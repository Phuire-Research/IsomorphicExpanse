import type { GameState, Position, RoomTileType } from '../engine/types'
import type { IRenderer } from './BaseRenderer'

const ROOM_W = 12
const ROOM_H = 10
const TW = 28
const TH = 14
const WH = 38
const OY = 52

const ROOM_TILE_COLORS: Record<RoomTileType, { top: string; lft: string; rgt: string; wall: boolean }> = {
  empty:         { top: '',        lft: '',        rgt: '',        wall: false },
  floor_wood:    { top: '#9a7850', lft: '#54381c', rgt: '#6a4828', wall: false },
  floor_stone:   { top: '#808898', lft: '#3c444e', rgt: '#505860', wall: false },
  wall:          { top: '#98988a', lft: '#2c2c28', rgt: '#4c4c44', wall: true },
  wall_brick:    { top: '#9a6e60', lft: '#502820', rgt: '#683830', wall: true },
  rug:           { top: '#8a3030', lft: '#5a1818', rgt: '#6a2020', wall: false },
  water_feature: { top: '#3868aa', lft: '#1a3468', rgt: '#285088', wall: false },
}

const FURNITURE_COLORS: Record<string, string> = {
  exit_portal: '#00ee88',
  chest: '#8B7355',
  bookshelf: '#5a3a1a',
  plant: '#4a8a4a',
  door_lab: '#5aa0e0',
  door_cave: '#b0895a',
  cave_mouth: '#7a4a9a',
  console: '#40c0a0',
}

export class PersonalSpaceRenderer implements IRenderer {
  readonly viewMode = 'personal_space' as const
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private originX = 0
  private originY = OY
  // THE-ZOOM-FILLS-THE-STAGE (Cycle 8 · Salvo E revision). Tile size is fixed (TW/TH), so a larger
  // canvas alone just added empty margin — the room stayed the same tiny footprint. The whole context
  // is scaled instead, so tiles, furniture, NPCs and labels zoom together. Drawing math stays in
  // UNSCALED space; only the transform (and screenToWorld's inverse) know about the zoom.
  private scale = 1
  // Screen-space gutter on the left reserved for the Personal Space HUD, so the room is never drawn
  // beneath it. Budgeted into BOTH the zoom and the centring — otherwise a wider room would simply
  // slide under the controls at larger canvases.
  private insetLeft = 0
  // StratiPUNK reticle + selection state. Both are PRESENTATION only — the engine owns truth; these
  // just tell the renderer what the pointer is proposing and who the player has focused.
  private hoverTile: Position | null = null
  private hoverValid = true
  private selectedNpcId: string | null = null
  // Salvo F · world-space alerts keyed by NPC id, INDEPENDENT of any open dialog. A held tool gate
  // must be discoverable while the player is anywhere in the world — the bridge auto-denies it at
  // 595s, so an unseen gate is a silently lost decision.
  private npcAlerts: Record<string, 'approval' | 'working'> = {}
  private pulse = 0

  setNpcAlerts(alerts: Record<string, 'approval' | 'working'>): void { this.npcAlerts = alerts }
  // Extended movement · the traced route, in tile order from the next step to the destination.
  private path: Position[] = []
  setPath(path: Position[]): void { this.path = path ?? [] }
  setPulse(p: number): void { this.pulse = p }

  setHoverTile(pos: Position | null, valid = true): void {
    const same = (!pos && !this.hoverTile) ||
      (!!pos && !!this.hoverTile && pos.x === this.hoverTile.x && pos.y === this.hoverTile.y && valid === this.hoverValid)
    if (same) return
    this.hoverTile = pos
    this.hoverValid = valid
  }

  setSelectedNpc(id: string | null): void { this.selectedNpcId = id }

  setInsetLeft(px: number): void {
    if (this.insetLeft === px) return
    this.insetLeft = px
    this.recomputeFit()
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.recomputeFit()
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.recomputeFit()
  }

  // The room's natural footprint in unscaled drawing space: an isometric diamond spanning
  // (ROOM_W + ROOM_H) tiles on each axis, plus one wall height of vertical headroom.
  private recomputeFit(): void {
    const span = ROOM_W + ROOM_H
    const naturalW = span * TW
    const naturalH = span * TH + WH + OY
    const w = this.canvas.width || 1
    const h = this.canvas.height || 1
    const usableW = Math.max(1, w - this.insetLeft)
    // min() so BOTH axes fit; 0.98 keeps a hairline margin off the edges.
    this.scale = Math.max(0.5, Math.min(usableW / naturalW, h / naturalH) * 0.98)
    const dh = h / this.scale
    // Centre within the USABLE band (right of the HUD), not the raw canvas.
    this.originX = (this.insetLeft + usableW / 2) / this.scale
    // Centre the diamond vertically in drawing space rather than pinning it to the old constant.
    this.originY = Math.max(OY, (dh - span * TH) / 2)
  }

  private toScr(tx: number, ty: number): { sx: number; sy: number } {
    return {
      sx: this.originX + (tx - ty) * TW,
      sy: this.originY + (tx + ty) * TH,
    }
  }

  screenToWorld(screenX: number, screenY: number): Position | null {
    // Invert the zoom first — the caller hands us CSS/screen pixels, the projection lives in
    // unscaled drawing space. Without this, clicks land on the wrong tile at any scale != 1.
    const dx = screenX / this.scale
    const dy = screenY / this.scale
    const rx = (dx - this.originX) / TW
    const ry = (dy - this.originY) / TH
    const tx = Math.floor((rx + ry) / 2)
    const ty = Math.floor((ry - rx) / 2)
    if (tx < 0 || tx >= ROOM_W || ty < 0 || ty >= ROOM_H) return null
    return { x: tx, y: ty }
  }

  render(state: GameState): void {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    this.recomputeFit()
    // Background is painted in SCREEN space (identity transform) so it always covers the full canvas;
    // everything after it draws through the zoom.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // The VOID renders in SCREEN space — it is full-bleed chrome, not part of the isometric room, so
    // it must not inherit the zoom (its centred label would drift off-centre if it did).
    if (state.gameContext === 'void_world') {
      this.renderVoid(ctx, w, h)
      return
    }

    ctx.fillStyle = '#1a1008'
    ctx.fillRect(0, 0, w, h)
    this.drawDotGrid(ctx, w, h)

    // Everything from here is the room itself — drawn through the zoom in unscaled drawing space.
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0)

    const room = state.personalSpace
    const queue: { d: number; tx: number; ty: number }[] = []
    for (let ty = 0; ty < ROOM_H; ty++) {
      for (let tx = 0; tx < ROOM_W; tx++) {
        queue.push({ d: tx + ty, tx, ty })
      }
    }
    queue.sort((a, b) => a.d - b.d || a.tx - b.tx)

    for (const { tx, ty } of queue) {
      const tileType = room.grid[ty]?.[tx] ?? 'empty'
      const def = ROOM_TILE_COLORS[tileType]
      const { sx, sy } = this.toScr(tx, ty)

      if (!def || !def.top) {
        this.drawDiamond(ctx, sx, sy, '', 'rgba(30,60,80,0.25)')
        continue
      }

      if (def.wall) {
        this.drawWall(ctx, sx, sy, def)
      } else {
        this.drawDiamond(ctx, sx, sy, def.top, 'rgba(0,0,0,0.18)')
      }
    }

    for (const furniture of room.furniture) {
      this.drawFurniture(ctx, furniture.tileX, furniture.tileY, furniture.type)
    }

    for (const display of room.collectibleDisplays) {
      this.drawCollectibleDisplay(ctx, display.tileX, display.tileY, display.itemId)
    }

    this.drawPlayer(ctx, state.player.entity.position.x, state.player.entity.position.y)

    // Route trace draws beneath the reticle and the actors — it is ground marking, not an object.
    if (this.path.length) this.drawPath(ctx)
    // Reticle draws UNDER the actors so a hovered tile never hides the character standing on it.
    if (this.hoverTile) this.drawHoverReticle(ctx, this.hoverTile.x, this.hoverTile.y, this.hoverValid)

    for (const npc of state.npcs.values()) {
      if (npc.homeRoomId !== state.currentPersonalSpaceId) continue
      if (npc.entity.id === this.selectedNpcId) {
        this.drawSelectionRing(ctx, npc.entity.position.x, npc.entity.position.y)
      }
      this.drawNPC(ctx, npc.entity.position.x, npc.entity.position.y, npc.entity.name)
      const alert = this.npcAlerts[npc.entity.id]
      if (alert) this.drawNpcAlert(ctx, npc.entity.position.x, npc.entity.position.y, alert)
    }

    // The vignette is SCREEN-space chrome like the background — reset the zoom first, or the
    // (0,0,w,h) fill rides the room transform and lands as a scale-sized box pinned top-left
    // (the faint panel that enclosed the HUD title and cut into the world at any scale < 1).
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.drawVignette(ctx, w, h)
  }

  // THE-PREVIEW-RETICLE — an UPSIDE-DOWN CONE: apex pinned to the tile the pointer proposes, flaring
  // upward so the target reads from above without occluding the floor. Teal is reserved for
  // POINTER INTENT and is deliberately unused by any other rail (cobalt=scs, gold=askMore/focus,
  // vermillion=approval), so "teal means where I am about to go" is unambiguous. StratiPUNK: thin
  // neon rim, transparent volume, a scan-line across the cone rather than a solid fill.
  private drawHoverReticle(ctx: CanvasRenderingContext2D, tx: number, ty: number, valid: boolean): void {
    const { sx, sy } = this.toScr(tx, ty)
    const cx = sx
    const cy = sy + TH                 // tile centre (the diamond's middle)
    const rx = TW * 0.94
    const ry = TH * 0.94
    const height = WH * 1.05
    const topY = cy - height
    // Invalid targets (blocked/out of reach) dim to a warning rose rather than vanishing — the player
    // still sees WHERE they pointed, and learns the tile is refused.
    const hue = valid ? '64, 224, 208' : '224, 96, 112'

    ctx.save()
    // volume
    const grad = ctx.createLinearGradient(0, topY, 0, cy)
    grad.addColorStop(0, `rgba(${hue}, 0.03)`)
    grad.addColorStop(1, `rgba(${hue}, 0.26)`)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx - rx, topY)
    ctx.lineTo(cx + rx, topY)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
    // scan-line — one horizontal band across the cone (StratiPUNK CRT tell)
    const bandY = topY + height * 0.55
    const bandHalf = rx * (1 - 0.55) * 0.9
    ctx.beginPath()
    ctx.moveTo(cx - bandHalf, bandY)
    ctx.lineTo(cx + bandHalf, bandY)
    ctx.strokeStyle = `rgba(${hue}, 0.5)`
    ctx.lineWidth = 1
    ctx.stroke()
    // rim
    ctx.beginPath()
    ctx.ellipse(cx, topY, rx, ry * 0.62, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${hue}, 0.6)`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = `rgba(${hue}, 0.07)`
    ctx.fill()
    // footprint on the tile itself
    ctx.beginPath()
    ctx.moveTo(cx, cy - ry)
    ctx.lineTo(cx + rx, cy)
    ctx.lineTo(cx, cy + ry)
    ctx.lineTo(cx - rx, cy)
    ctx.closePath()
    ctx.strokeStyle = `rgba(${hue}, 0.9)`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = `rgba(${hue}, 0.16)`
    ctx.fill()
    ctx.restore()
  }

  // Selected NPC — a teal ground ring + caret. Marks WHO context-dependent actions address.
  private drawSelectionRing(ctx: CanvasRenderingContext2D, tx: number, ty: number): void {
    const { sx, sy } = this.toScr(tx, ty)
    const cx = sx
    const cy = sy + TH
    const rx = TW * 0.9
    const ry = TH * 0.9
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cx, cy - ry)
    ctx.lineTo(cx + rx, cy)
    ctx.lineTo(cx, cy + ry)
    ctx.lineTo(cx - rx, cy)
    ctx.closePath()
    ctx.strokeStyle = 'rgba(64, 224, 208, 0.95)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = 'rgba(64, 224, 208, 0.12)'
    ctx.fill()
    // caret above the head — the "addressed" tell
    const capY = cy - WH * 1.25
    ctx.beginPath()
    ctx.moveTo(cx, capY + 7)
    ctx.lineTo(cx - 5, capY)
    ctx.lineTo(cx + 5, capY)
    ctx.closePath()
    ctx.fillStyle = 'rgba(64, 224, 208, 0.9)'
    ctx.fill()
    ctx.restore()
  }

  // THE-PATH-TRACE — teal footfalls along the route, brightening toward the destination so the eye
  // reads DIRECTION without an arrowhead. Teal because this is pointer INTENT, the same semantic as
  // the reticle: the trace and the cone are one system, not two.
  private drawPath(ctx: CanvasRenderingContext2D): void {
    const n = this.path.length
    ctx.save()
    // connective thread first, so the pips sit on top of it
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const { sx, sy } = this.toScr(this.path[i].x, this.path[i].y)
      const px = sx
      const py = sy + TH
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.strokeStyle = 'rgba(64, 224, 208, 0.28)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
    // footfalls
    for (let i = 0; i < n; i++) {
      const { sx, sy } = this.toScr(this.path[i].x, this.path[i].y)
      const px = sx
      const py = sy + TH
      const t = 0.30 + 0.55 * (n === 1 ? 1 : i / (n - 1))   // brighter toward the destination
      const last = i === n - 1
      const rx = last ? TW * 0.5 : TW * 0.26
      const ry = last ? TH * 0.5 : TH * 0.26
      ctx.beginPath()
      ctx.moveTo(px, py - ry)
      ctx.lineTo(px + rx, py)
      ctx.lineTo(px, py + ry)
      ctx.lineTo(px - rx, py)
      ctx.closePath()
      ctx.fillStyle = `rgba(64, 224, 208, ${last ? 0.34 : 0.20 * t + 0.06})`
      ctx.fill()
      ctx.strokeStyle = `rgba(64, 224, 208, ${last ? 0.85 : t})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.restore()
  }

  // Salvo F · THE-NPC-FLAG. Drawn ABOVE the NPC and above everything else in the room, so it is the
  // one thing that cannot be missed. Colour carries the same semantics as the chat rails:
  //   vermillion = a held gate WAITING ON YOU (urgent, on a clock) · cobalt = the anchor is WORKING.
  // Teal is untouched here — it stays reserved for pointer intent and focus.
  private drawNpcAlert(ctx: CanvasRenderingContext2D, tx: number, ty: number, kind: 'approval' | 'working'): void {
    const { sx, sy } = this.toScr(tx, ty)
    const cx = sx
    const baseY = sy + TH - WH * 1.55          // clear of the head and the selection caret
    const urgent = kind === 'approval'
    const hue = urgent ? '220, 38, 38' : '59, 130, 246'
    // Urgent pulses hard; working breathes. Phase comes from the view layer so the canvas stays
    // render-on-change rather than owning an animation loop.
    const t = urgent ? (0.55 + 0.45 * Math.sin(this.pulse * 0.35)) : (0.4 + 0.25 * Math.sin(this.pulse * 0.18))
    const r = urgent ? 7 : 5

    ctx.save()
    // ground tether so the badge is unambiguously THIS npc's
    ctx.beginPath()
    ctx.moveTo(cx, baseY + r + 2)
    ctx.lineTo(cx, sy + TH - WH * 0.55)
    ctx.strokeStyle = `rgba(${hue}, ${0.35 * t})`
    ctx.lineWidth = 1
    ctx.stroke()
    // halo
    ctx.beginPath()
    ctx.arc(cx, baseY, r + 4, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${hue}, ${0.16 * t})`
    ctx.fill()
    // badge
    ctx.beginPath()
    ctx.arc(cx, baseY, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${hue}, ${urgent ? 0.92 : 0.75})`
    ctx.fill()
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * t})`
    ctx.lineWidth = 1
    ctx.stroke()
    // glyph — '!' demands an answer, '*' merely reports activity
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${urgent ? 9 : 8}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(urgent ? '!' : '*', cx, baseY + 0.5)
    ctx.restore()
  }

  private renderVoid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.globalAlpha = 0.08
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.45)
    glow.addColorStop(0, '#8060c0')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, w * 0.4, h * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.font = 'bold 22px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(180,160,220,0.7)'
    ctx.fillText('THE VOID', w / 2, h / 2)

    this.drawVignette(ctx, w, h)
  }

  private drawDotGrid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = 'rgba(40,30,20,0.4)'
    for (let y = 0; y < h; y += 28) {
      for (let x = 0; x < w; x += 28) {
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  private drawDiamond(ctx: CanvasRenderingContext2D, sx: number, sy: number, fill: string, stroke?: string): void {
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + TW, sy + TH)
    ctx.lineTo(sx, sy + TH * 2)
    ctx.lineTo(sx - TW, sy + TH)
    ctx.closePath()
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = 0.7
      ctx.stroke()
    }
  }

  private drawWall(ctx: CanvasRenderingContext2D, sx: number, sy: number, def: { top: string; lft: string; rgt: string }): void {
    ctx.beginPath()
    ctx.moveTo(sx + TW, sy - WH + TH)
    ctx.lineTo(sx, sy - WH + TH * 2)
    ctx.lineTo(sx, sy + TH * 2)
    ctx.lineTo(sx + TW, sy + TH)
    ctx.closePath()
    ctx.fillStyle = def.rgt
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(sx - TW, sy - WH + TH)
    ctx.lineTo(sx, sy - WH + TH * 2)
    ctx.lineTo(sx, sy + TH * 2)
    ctx.lineTo(sx - TW, sy + TH)
    ctx.closePath()
    ctx.fillStyle = def.lft
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(sx, sy - WH)
    ctx.lineTo(sx + TW, sy - WH + TH)
    ctx.lineTo(sx, sy - WH + TH * 2)
    ctx.lineTo(sx - TW, sy - WH + TH)
    ctx.closePath()
    ctx.fillStyle = def.top
    ctx.fill()

    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 0.8
    const edges: [number, number, number, number][] = [
      [sx - TW, sy - WH + TH, sx - TW, sy + TH],
      [sx + TW, sy - WH + TH, sx + TW, sy + TH],
      [sx, sy - WH + TH * 2, sx, sy + TH * 2],
    ]
    for (const [x1, y1, x2, y2] of edges) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }

  private drawFurniture(ctx: CanvasRenderingContext2D, tx: number, ty: number, type: string): void {
    const { sx, sy } = this.toScr(tx, ty)

    const color = FURNITURE_COLORS[type] ?? '#a0855a'
    const boxH = 12

    if (type === 'exit_portal') {
      ctx.save()
      ctx.globalAlpha = 0.6
      this.drawDiamond(ctx, sx, sy, '', color)
      ctx.globalAlpha = 0.3
      this.drawDiamond(ctx, sx, sy - 4, color, '')
      ctx.restore()
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = color
      ctx.fillText('EXIT', sx, sy + TH * 2 + 10)
      return
    }

    ctx.beginPath()
    ctx.moveTo(sx + TW * 0.6, sy + TH * 0.6 - boxH)
    ctx.lineTo(sx, sy + TH * 1.2 - boxH)
    ctx.lineTo(sx, sy + TH * 1.2)
    ctx.lineTo(sx + TW * 0.6, sy + TH * 0.6)
    ctx.closePath()
    ctx.fillStyle = this.dimColor(color, 0.7)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(sx - TW * 0.6, sy + TH * 0.6 - boxH)
    ctx.lineTo(sx, sy + TH * 1.2 - boxH)
    ctx.lineTo(sx, sy + TH * 1.2)
    ctx.lineTo(sx - TW * 0.6, sy + TH * 0.6)
    ctx.closePath()
    ctx.fillStyle = this.dimColor(color, 0.5)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(sx, sy - boxH)
    ctx.lineTo(sx + TW * 0.6, sy + TH * 0.6 - boxH)
    ctx.lineTo(sx, sy + TH * 1.2 - boxH)
    ctx.lineTo(sx - TW * 0.6, sy + TH * 0.6 - boxH)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  private drawCollectibleDisplay(ctx: CanvasRenderingContext2D, tx: number, ty: number, itemId: string | null): void {
    const { sx, sy } = this.toScr(tx, ty)
    const pedestalH = 8

    ctx.beginPath()
    ctx.moveTo(sx + TW * 0.4, sy + TH * 0.4 - pedestalH)
    ctx.lineTo(sx, sy + TH * 0.8 - pedestalH)
    ctx.lineTo(sx, sy + TH * 0.8)
    ctx.lineTo(sx + TW * 0.4, sy + TH * 0.4)
    ctx.closePath()
    ctx.fillStyle = '#606060'
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(sx - TW * 0.4, sy + TH * 0.4 - pedestalH)
    ctx.lineTo(sx, sy + TH * 0.8 - pedestalH)
    ctx.lineTo(sx, sy + TH * 0.8)
    ctx.lineTo(sx - TW * 0.4, sy + TH * 0.4)
    ctx.closePath()
    ctx.fillStyle = '#484848'
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(sx, sy - pedestalH)
    ctx.lineTo(sx + TW * 0.4, sy + TH * 0.4 - pedestalH)
    ctx.lineTo(sx, sy + TH * 0.8 - pedestalH)
    ctx.lineTo(sx - TW * 0.4, sy + TH * 0.4 - pedestalH)
    ctx.closePath()
    ctx.fillStyle = '#787878'
    ctx.fill()

    if (itemId) {
      ctx.font = '7px monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#cccccc'
      ctx.fillText(itemId, sx, sy - pedestalH - 4)
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, tx: number, ty: number): void {
    const { sx, sy } = this.toScr(tx, ty)

    const centerY = sy + TH

    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.ellipse(sx, centerY + TH * 0.5, TW * 0.35, TH * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = '#e74c3c'
    ctx.beginPath()
    ctx.ellipse(sx, centerY - 6, 7, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#e0b888'
    ctx.beginPath()
    ctx.arc(sx, centerY - 18, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawNPC(ctx: CanvasRenderingContext2D, tx: number, ty: number, name: string): void {
    const { sx, sy } = this.toScr(tx, ty)
    const centerY = sy + TH

    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.ellipse(sx, centerY + TH * 0.5, TW * 0.35, TH * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = '#3a86c8'
    ctx.beginPath()
    ctx.ellipse(sx, centerY - 6, 7, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#e0b888'
    ctx.beginPath()
    ctx.arc(sx, centerY - 18, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = 'bold 8px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#bfe0ff'
    ctx.fillText(name, sx, centerY - 30)
  }

  private drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, w * 0.7)
    vg.addColorStop(0, 'transparent')
    vg.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, w, h)
  }

  private dimColor(hex: string, factor: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, Math.floor((num >> 16) * factor))
    const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * factor))
    const b = Math.max(0, Math.floor((num & 0xff) * factor))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }
}
