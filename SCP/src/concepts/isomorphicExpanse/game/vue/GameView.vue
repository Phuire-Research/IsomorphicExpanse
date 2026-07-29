<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useGameEngine } from '../composables/useGameEngine'
import type { IRenderer } from '../renderer/BaseRenderer'
import { PersonalSpaceRenderer } from '../renderer/PersonalSpaceRenderer'
import { ActionType, Direction } from '../engine/types'
import type { Position, DialogTree, DialogNode, DialogOption, NPCState, ChestContainer, Action, FurnitureItem } from '../engine/types'
import { ITEMS } from '../engine/data/items'
import { getDialog } from '../engine/data/dialogs'
import { NPCS } from '../engine/data/npcs'
import { responder } from './responder'
import { getGlobalScsBridgeController, type ScsBridgeController } from '../../../scsBridge/scsBridgeController'
import type { ScsBridgeSessionEntry } from '../../../scsBridge/scsBridge.type'
import { resolveS8Anchor, findLiveS8Session, filterS8Sessions } from '../../../scsBridge/model/s8Anchor.model'
import { s8LastTurnPath } from '../../../scsBridge/model/s8Routes.model'
// W4 · the live agent-authored menu stage, crossed in from the landing page through the harness.
import type { MenuStage } from '../../../../model/shatteriteMenu.model'

// OPTIONAL — GameView still mounts standalone (undefined -> the static dialogs.ts node is the
// defaultStage for this chat).
const props = defineProps<{ menuStage?: MenuStage }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const {
  gameState,
  lastResult,
  initialize,
  dispatch,
  isWalkableAt,
  inventory,
  npcs,
  turn,
} = useGameEngine()

// INTEROPERABLE CONTROLS (user directive 2026-07-10): BOTH human and agent drive the same game
// through the same means. OBSERVER_MODE=false lifts the human-input lock while the __IE_GAME__ agent
// surface (agentCall/agentDriving, below) stays fully live — the arbitration machinery is preserved
// for building on (later: the same means targeting different NPCs). Revises P9.
const OBSERVER_MODE = false
let agentDriving = false
function humanInputBlocked(): boolean { return OBSERVER_MODE && !agentDriving }

const openChest = ref<ChestContainer | null>(null)
const activeDialog = ref<DialogTree | null>(null)
const activeDialogNode = ref<DialogNode | null>(null)
const activeNPCName = ref('')
const dialogNPCId = ref('')

interface DialogMessage { speaker: string; text: string; origin: 'player' | 'npc'; ts?: number; prior?: boolean }
const dialogMessages = ref<DialogMessage[]>([])

// LAST-TURN FLOW · PAGINATION — the held exchange renders ONE page at a time, tabbed with ←/→.
// Pages are paragraph-packed chunks of the full exchange (user turn, then model turn), each tagged
// with its origin so the row styling holds. Opens at the TAIL (what the single-field floor showed);
// ← walks back through the rest of what was said.
interface PriorPage { origin: 'player' | 'npc'; speaker: string; text: string }
const priorPages = ref<PriorPage[]>([])
const priorPageIndex = ref(0)
const PRIOR_PAGE_CHARS = 600

function packPriorPages(origin: PriorPage['origin'], speaker: string, text: string): PriorPage[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const pages: PriorPage[] = []
  let current = ''
  const flush = () => { if (current) { pages.push({ origin, speaker, text: current }); current = '' } }
  for (const para of paragraphs) {
    // A paragraph longer than a page hard-splits at word boundaries so no page ever overflows.
    const chunks: string[] = []
    if (para.length <= PRIOR_PAGE_CHARS) chunks.push(para)
    else {
      const words = para.split(/\s+/)
      let piece = ''
      for (const word of words) {
        if (piece && piece.length + word.length + 1 > PRIOR_PAGE_CHARS) { chunks.push(piece); piece = word }
        else piece = piece ? `${piece} ${word}` : word
      }
      if (piece) chunks.push(piece)
    }
    for (const chunk of chunks) {
      if (current && current.length + chunk.length + 2 > PRIOR_PAGE_CHARS) flush()
      current = current ? `${current}\n\n${chunk}` : chunk
      if (current.length >= PRIOR_PAGE_CHARS) flush()
    }
  }
  flush()
  return pages
}

function seedPriorPages(userTurn: string, modelTurn: string, npcName: string): void {
  const pages = [
    ...packPriorPages('player', 'You', userTurn),
    ...packPriorPages('npc', npcName, modelTurn),
  ]
  priorPages.value = pages
  priorPageIndex.value = pages.length ? pages.length - 1 : 0
}

const currentPriorPage = computed<PriorPage | null>(() => priorPages.value[priorPageIndex.value] ?? null)

function stepPriorPage(delta: number): void {
  const count = priorPages.value.length
  if (count < 2) return
  priorPageIndex.value = Math.min(count - 1, Math.max(0, priorPageIndex.value + delta))
}

// ←/→ tab the held exchange while the dialog is open. The caret keeps the keys once the chat
// input holds text (arrow = cursor movement there); an empty input yields them to the pager.
function handlePriorPageKeys(e: KeyboardEvent): void {
  if (!activeDialogNode.value || priorPages.value.length < 2) return
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const target = e.target as HTMLElement | null
  if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).value !== '') return
  e.preventDefault()
  stepPriorPage(e.key === 'ArrowLeft' ? -1 : 1)
}
const dialogInput = ref('')
const isProcessing = ref(false)
const dialogLogRef = ref<HTMLDivElement | null>(null)
const dialogInputRef = ref<HTMLInputElement | null>(null)

const controller = computed<ScsBridgeController | null>(() => getGlobalScsBridgeController())
const sessionsList = computed<ScsBridgeSessionEntry[]>(() => controller.value?.sessionsList.value ?? [])
const activeDesignation = computed<string>(() => NPCS[dialogNPCId.value]?.name ?? '')
const anchorEntry = computed<ScsBridgeSessionEntry | undefined>(() => activeDesignation.value ? resolveS8Anchor(sessionsList.value, activeDesignation.value) : undefined)
const anchorOnline = computed<boolean>(() => anchorEntry.value?.status === 'launched' && controller.value?.connectionEstablished.value === true)
// W5 · P18 · THE-LIVE-STAGE-WINS-IN-THE-CHAT. Mirrors ShatteriteMenu.vue's proven predicate:
// a live agent-authored stage wins (stageIndex >= 0 AND it carries options); otherwise the static
// dialogs.ts node IS this chat's defaultStage. hasStage was a `=> true` STUB until now.
const liveStageWins = computed<boolean>(() =>
  !!props.menuStage && props.menuStage.stageIndex >= 0 && props.menuStage.options.length > 0
)
const hasStage = computed<boolean>(() =>
  liveStageWins.value || (activeDialogNode.value?.options.length ?? 0) > 0
)
// ============================================================
// Stage 3.5 · THE-TOOL-APPROVAL-ROWS-ARE-THE-CHAT — the SessionManager's Tool Approval System
// curried into the NPC dialog, so the player answers the anchor's held tool gate in-world.
// ============================================================
// NO transport work is needed: ScsBridgeSessionEntry ALREADY carries the mirrored queue and the
// controller ALREADY exposes triggerPermissionDecision. anchorEntry is the same entry object the
// Session Manager reads, so a pending approval is reactively present the instant it lands.
// Readers below mirror ScsBridgeSessionManagement.vue's proven getPermissionHead/getPermissionButtons.
const approvalHead = computed<{ requestId: string; tool: string; input: string; suggestions?: string } | null>(() => {
  const s = anchorEntry.value
  if (!s || s.permissionPending !== true) return null
  const head = s.pendingPermissions?.[0]
  if (head) return { requestId: head.requestId, tool: head.tool, input: head.input, suggestions: head.suggestions }
  // Legacy scalar fallback — an entry mirrored before the FIFO queue existed.
  return {
    requestId: s.pendingPermissionRequestId ?? '',
    tool: s.pendingPermissionTool ?? '—',
    input: s.pendingPermissionInput ?? '',
    suggestions: s.permissionSuggestions,
  }
})
const approvalDepth = computed<number>(() => anchorEntry.value?.pendingPermissions?.length ?? (approvalHead.value ? 1 : 0))

// ============================================================
// Salvo A · THE-LIVE-FEED-ACK — the `...` stops being silence.
// ============================================================
// The visitor used to face three dots for however long the anchor worked; a real turn can run tools
// for minutes (LAD-7's stall was exactly this, experienced as a hang). `activeTool`/`activeToolInput`
// ride the SAME ScsBridgeSessionEntry as the approval queue — no new transport (G2), just a read.
// The bridge DELETES activeTool on PostToolUse, so the feed clears via the relay, never optimistically.
const activeToolLive = computed<string | null>(() => anchorEntry.value?.activeTool ?? null)
const activeToolInputLive = computed<string | null>(() => anchorEntry.value?.activeToolInput ?? null)
// Show the feed whenever the anchor is demonstrably working, even if this client's local isProcessing
// missed the turn (e.g. work started from the terminal) — the point is that the visitor is never
// stranded wondering whether anything is happening.
const anchorWorking = computed<boolean>(() => isProcessing.value || activeToolLive.value !== null)
// Motion, not just a label: a turn that runs eight tools should LOOK like eight steps, so a single
// long Bash doesn't read the same as a stalled session.
const toolRunCount = ref(0)
// THE-FEED-MUST-NOT-BLINK-OUT (found by measuring, not by reading): the bridge DELETES activeTool on
// PostToolUse, so between tools the live field is null. Measured against a real 54s turn the tool was
// non-null in only 1 of 18 samples — i.e. a visitor watching the "fixed" feed would still have seen
// bare dots ~94% of the time, which is the very strandedness this salvo exists to end. So retain the
// LAST observed tool for the duration of the turn and mark it as settled; the live tool supersedes it
// the moment the next one starts.
const lastToolSeen = ref<string | null>(null)
const lastToolInputSeen = ref<string | null>(null)
watch(activeToolLive, (now, before) => {
  if (now && now !== before) {
    toolRunCount.value += 1
    lastToolSeen.value = now
    lastToolInputSeen.value = activeToolInputLive.value
  }
})
// What the feed SHOWS: the running tool if there is one, else the last one seen this turn.
const feedTool = computed<string | null>(() => activeToolLive.value ?? lastToolSeen.value)
const feedInput = computed<string | null>(() => activeToolInputLive.value ?? lastToolInputSeen.value)
// Settled = we are still working, but no tool is running right now (thinking between tools).
const feedSettled = computed<boolean>(() => activeToolLive.value === null && lastToolSeen.value !== null)
// The rows are SUGGESTION-DERIVED, not a fixed triad: Claude Code proposes its own rule labels
// (e.g. "git *"), which the bridge compacts into `suggestions`. Deny is always appended. Only the
// default set's "don't ask again" row carries persistRule.
const approvalOptions = computed<DialogOption[]>(() => {
  const head = approvalHead.value
  if (!head) return []
  const mint = (label: string, behavior: 'allow' | 'deny', persistRule: boolean, i: number): DialogOption => ({
    id: `approve-${i}`, text: label, kind: 'toolApproval', behavior, persistRule, requestId: head.requestId,
  })
  if (head.suggestions) {
    try {
      const parsed = JSON.parse(head.suggestions) as Array<{ label: string; behavior: 'allow' | 'deny' }>
      const cleaned = (Array.isArray(parsed) ? parsed : []).filter((b) => b && typeof b.label === 'string')
      if (cleaned.length) {
        return [
          ...cleaned.map((b, i) => mint(b.label, b.behavior === 'deny' ? 'deny' : 'allow', false, i)),
          mint('Deny', 'deny', false, cleaned.length),
        ]
      }
    } catch { /* malformed → the default set below */ }
  }
  return [mint('Allow', 'allow', false, 0), mint("Allow & don't ask", 'allow', true, 1), mint('Deny', 'deny', false, 2)]
})
// THE-OPTION-SHAPES-ADAPT — MenuOption {label, kind, scsCommand} -> DialogOption {id, text, ...}.
// Synthetic ids ('menu-<index>') keep the v-for key + the __IE_GAME__ selectMenuOption(id) lookup
// stable. 'prime' is unreachable here (the parser coerces any unknown kind to 'scs' · H2), so the
// DialogOption kind union holds.
//
// PRECEDENCE (mirrors the Session Manager's permission > focus > active > idle ladder): a pending
// approval OUTRANKS and SUSPENDS both the live menu and the static node. It is a live held resource
// on a 595s auto-deny clock — it cannot queue behind a menu the player might never open.
const effectiveOptions = computed<DialogOption[]>(() => {
  if (approvalOptions.value.length > 0) return approvalOptions.value
  if (liveStageWins.value && props.menuStage) {
    return props.menuStage.options.map((opt, index) => ({
      id: `menu-${index}`,
      text: opt.label,
      kind: opt.kind as DialogOption['kind'],
      scsCommand: opt.scsCommand,
    }))
  }
  return activeDialogNode.value?.options ?? []
})
// THE-ANCHOR-LIVENESS-GATE-CROSSING — the menu goes live only with a bound, launched anchor.
// APPROVALS ARE EXEMPT: a held gate originates from the anchor itself (so the session is alive by
// definition), and rendering it dormant would leave an unclickable gate ticking toward auto-deny.
const optionsLive = computed<boolean>(() => approvalOptions.value.length > 0 || (anchorOnline.value && hasStage.value))
const summoning = ref(false)
let summonPoll: ReturnType<typeof setInterval> | null = null
// Stage 3.5 · THE-AUTO-MODE-ANCHOR-RECLAIM — the Shatterite CHAT System's deviation from the
// standard Shatterite Menu System. The bridge FUSES two orthogonal concerns into the one `asWorker`
// spawn flag: it (a) appends ` --permission-mode auto` to the Claude argv (classifier-gated —
// auto-accepts safe Bash/WebSearch/edits, still BLOCKS risky ops), which is the LAD-7 stall fix the
// in-world dialog needs, and (b) SKIPS claimAnchorIfUnclaimed, because in the bridge's model "the
// worker is non-anchor by definition". Our NPC anchor needs BOTH halves, so: spawn as a worker to
// win Auto Mode, then stamp the anchor ourselves. registry.setSessionAnchor sets isAnchor=true,
// clears rival anchors in the same designation scope, and mirrors the binding into S8.json — and it
// never touches isWorker, so both flags coexist on one session.
//
// CONSEQUENCE (the trap): until that stamp lands, resolveS8Anchor CANNOT see this session (it
// matches isAnchor === true). Every lookup in this flow therefore uses the NON-anchor-gated
// findLiveS8Session / filterS8Sessions — polling resolveS8Anchor here would never resolve and the
// summon would always time out.
async function summonSession(): Promise<void> {
  if (humanInputBlocked()) return
  const ctrl = controller.value
  if (!ctrl || summoning.value) return
  summoning.value = true
  const designation = activeDesignation.value
  const alreadyLive = findLiveS8Session(sessionsList.value, designation)
  const dormant = filterS8Sessions(sessionsList.value, designation).find((s) => s.status !== 'launched')
  if (alreadyLive) { /* present already — fall through to the poll, which stamps + focuses */ }
  else if (dormant) { ctrl.triggerEngageSession(dormant.id) }
  else { ctrl.triggerSpawnS8Session(designation, null, true) } // asWorker=true → Auto Mode On
  const STEP_MS = 250, MAX_MS = 3000
  let elapsedMs = 0
  if (summonPoll) clearInterval(summonPoll)
  if (alertPulse) { clearInterval(alertPulse); alertPulse = null }
  if (walkTimer) { clearInterval(walkTimer); walkTimer = null }
  summonPoll = setInterval(() => {
    elapsedMs += STEP_MS
    const live = findLiveS8Session(sessionsList.value, designation)
    if (live) {
      if (summonPoll) { clearInterval(summonPoll); summonPoll = null }
      // Stamp the anchor BEFORE focusing — the responder's resolveS8Anchor depends on it.
      void ctrl.triggerSetAnchor(live.id).then(() => { ctrl.triggerFocusSession(live.id) })
      summoning.value = false
      return
    }
    if (elapsedMs >= MAX_MS) { if (summonPoll) { clearInterval(summonPoll); summonPoll = null } ; summoning.value = false }
  }, STEP_MS)
}
function focusSession(): void {
  if (humanInputBlocked()) return
  const ctrl = controller.value; const anchor = anchorEntry.value
  if (!ctrl || !anchor) return
  ctrl.triggerFocusSession(anchor.id)
}

let personalSpaceRenderer: IRenderer | null = null

function getActiveRenderer(): IRenderer | null {
  return personalSpaceRenderer
}

function renderFrame() {
  if (!gameState.value) return
  const r = getActiveRenderer()
  if (r) r.render(gameState.value)
}

watch(gameState, () => renderFrame())
// Opening/closing the rail changes the canvas width — refit on the next tick, after the DOM settles.
watch(activeDialogNode, () => { void nextTick(() => fitCanvasToStage()) })

// ============================================================
// Salvo E · THE-CANVAS-FITS — fit the stage to the island width, stay height-aware to the viewport.
// ============================================================
// CORRECTION to the Gate-7 note: the projection origin was NEVER a frozen 400. PersonalSpaceRenderer
// already derives it (`originX = width / 2` in the ctor, in resize(), and again each render), and
// screenToWorld reads the same origin so click-mapping follows for free. The real gap was simply that
// `resize()` — present on IRenderer since the start — had NO CALLERS, so the canvas stayed pinned to
// its 800x480 attributes. Wiring the observer is the whole salvo.
// THE-POINTER-PROPOSES — hover preview + NPC focus. Both are presentation-level intent; the engine
// still arbitrates every action, so a stale hover can never move anyone.
const hoverTile = ref<{ x: number; y: number } | null>(null)
const selectedNpcId = ref<string | null>(null)
const selectedNpcName = computed<string>(() => {
  const id = selectedNpcId.value
  if (!id || !gameState.value) return ''
  for (const npc of gameState.value.npcs.values()) if (npc.entity.id === id) return npc.entity.name
  return ''
})
const rootRef = ref<HTMLDivElement | null>(null)
const stageRef = ref<HTMLDivElement | null>(null)
const shellRef = ref<HTMLDivElement | null>(null)
const RAIL_W = 340   // chat rail (only reserved while a dialog is open)
const HUD_W = 0      // corner readout only — it sits in the diamond's dead corner, so the room is NOT inset
const FOOTER_H = 56  // the GAME BAR height — matches --ie-bar-h; the canvas takes viewport MINUS this
const TASKBAR_H = 68 // the fixed .scs-taskbar the page reserves at the viewport bottom
const CANVAS_MIN_W = 480
const CANVAS_MAX_W = 2400
// NO aspect lock (Cycle 8 revision): locking the ratio made a height-constrained viewport shrink the
// WIDTH too, which is what left the stage tiny. X fills the island width, Y takes the screen height,
// and the renderer's zoom fills whatever box that produces.
// Reserve BELOW the canvas: the halved 60px toolbar + the fixed .scs-taskbar clearance + margin.
// What sits ABOVE the canvas (page chrome) is MEASURED, not assumed — a fixed guess put the toolbar
// 20px below the fold on a 700px viewport because the stage starts ~220px down the page.
// The toolbar no longer costs vertical budget — it moved INTO the canvas negative space as the HUD.
// Only the fixed taskbar and page margins are reserved now, which is the Y this salvo reclaims.
const BELOW_CANVAS_RESERVE = 68 /* fixed taskbar */ + 8 /* hairline */ + FOOTER_H
let stageObserver: ResizeObserver | null = null

function fitCanvasToStage(): void {
  const canvas = canvasRef.value
  const stage = stageRef.value
  if (!canvas || !stage) return
  // READ the laid-out box. The stage is a flex child sized by the browser between the page chrome and
  // the game bar, so its clientWidth/Height are already "viewport minus bar" — no arithmetic, no
  // stale stageTop, and no circularity (the canvas is absolutely constrained to 100% of this box).
  // The root's own TOP is set by page chrome above it and is independent of the canvas, so measuring
  // it is safe (no circularity). Height = from the root's top down to the fixed taskbar — CSS alone
  // cannot express "my top to the viewport bottom", and calc(100vh - taskbar) ignored the chrome and
  // pushed the game bar 56px BELOW the fold.
  const root = rootRef.value
  if (root) {
    const rootTop = root.getBoundingClientRect().top
    const h = Math.max(320, Math.round(window.innerHeight - rootTop - TASKBAR_H))
    root.style.height = `${h}px`
  }
  const w = Math.max(CANVAS_MIN_W, Math.round(stage.clientWidth))
  const h = Math.max(200, Math.round(stage.clientHeight))
  shellRef.value?.style.setProperty('--ie-stage-w', `${w}px`)
  if (canvas.width === w && canvas.height === h) return
  const r = getActiveRenderer()
  if (r) r.resize(w, h) // sets canvas.width/height AND re-derives originX = w/2
  else { canvas.width = w; canvas.height = h }
  renderFrame()
}


const resultClass = computed(() => {
  if (!lastResult.value) return ''
  return lastResult.value.success ? 'ie-result-success' : 'ie-result-fail'
})

const inventoryQuickSlots = computed(() => {
  if (!gameState.value) return []
  return gameState.value.player.inventory.slots
    .filter(s => s.item)
    .map(s => ({ id: s.item!.name, qty: s.quantity }))
})

const filledSlots = computed(() => {
  if (!inventory.value) return []
  return inventory.value.slots.filter((s) => s.item !== null)
})

function tileFromEvent(e: MouseEvent): { x: number; y: number } | null {
  const canvas = canvasRef.value
  const renderer = getActiveRenderer()
  if (!canvas || !renderer) return null
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  // The canvas is CSS-sized to 100% of its box while its BUFFER is set in device-ish px; convert or
  // the reticle drifts from the cursor whenever the two differ.
  const sx = (e.clientX - rect.left) * (canvas.width / rect.width)
  const sy = (e.clientY - rect.top) * (canvas.height / rect.height)
  return renderer.screenToWorld(sx, sy)
}

function npcAtTile(pos: { x: number; y: number } | null) {
  if (!pos || !gameState.value) return null
  for (const npc of gameState.value.npcs.values()) {
    if (npc.homeRoomId !== gameState.value.currentPersonalSpaceId) continue
    if (npc.entity.position.x === pos.x && npc.entity.position.y === pos.y) return npc
  }
  return null
}

function handleCanvasMove(e: MouseEvent) {
  const pos = tileFromEvent(e)
  const prev = hoverTile.value
  const same = (!pos && !prev) || (!!pos && !!prev && pos.x === prev.x && pos.y === prev.y)
  if (same) return
  hoverTile.value = pos
  const r = getActiveRenderer()
  if (r && 'setHoverTile' in (r as object)) {
    // A tile is "valid" as a MOVE preview when it is a single step away; the NPC's own tile previews
    // as valid too, since clicking it selects rather than moves.
    let valid = false
    let path: Array<{ x: number; y: number }> = []
    if (pos && gameState.value) {
      if (npcAtTile(pos)) {
        valid = true                       // clicking a person SELECTS them — always a legal target
      } else {
        path = computePath(gameState.value.player.entity.position, pos)
        valid = path.length > 0            // reachable == valid; unreachable reads as refused (rose)
      }
    }
    hoverPath.value = path
    ;(r as unknown as { setHoverTile: (p: unknown, v: boolean) => void }).setHoverTile(pos, valid)
    if (!walkTimer) pushPathToRenderer(path)   // a walk in progress owns the trace
    renderFrame()
  }
}

function handleCanvasLeave() {
  if (!hoverTile.value) return
  hoverTile.value = null
  hoverPath.value = []
  if (!walkTimer) pushPathToRenderer([])
  const r = getActiveRenderer()
  if (r && 'setHoverTile' in (r as object)) {
    ;(r as unknown as { setHoverTile: (p: unknown, v: boolean) => void }).setHoverTile(null, true)
    renderFrame()
  }
}

// ============================================================
// Salvo F · THE-NPC-FLAG-FOR-OFFSTAGE-APPROVAL
// ============================================================
// Derived from sessionsList and keyed by DESIGNATION, deliberately independent of activeDialogNode:
// the whole point is the case where the dialog is CLOSED. A held gate carries a 595s auto-deny clock,
// so a player standing anywhere in the world must still be able to see that someone is waiting on
// them. Shares its source with the in-chat tool feed (Salvo A) — one pending-state truth, two surfaces.
const npcAlerts = computed<Record<string, 'approval' | 'working'>>(() => {
  const out: Record<string, 'approval' | 'working'> = {}
  const list = sessionsList.value
  if (!list.length) return out
  for (const npcId of Object.keys(NPCS)) {
    const designation = NPCS[npcId]?.name
    if (!designation) continue
    const anchor = resolveS8Anchor(list, designation)
    if (!anchor) continue
    if (anchor.permissionPending === true) out[npcId] = 'approval'
    else if (anchor.activeTool !== undefined) out[npcId] = 'working'
  }
  return out
})
const hasNpcAlert = computed<boolean>(() => Object.keys(npcAlerts.value).length > 0)
// CROSS-ROOM GAP: the world flag only exists where the NPC is DRAWN. With the NPC in the Lab and the
// player in the Cave it renders nowhere, while the 595s clock keeps running. The bar chip is the
// room-independent surface — geography must never hide a decision that is waiting on the player.
const alertingNpcs = computed<Array<{ id: string; name: string; kind: 'approval' | 'working' }>>(() =>
  Object.entries(npcAlerts.value).map(([id, kind]) => ({ id, name: NPCS[id]?.name ?? id, kind })))
const pendingApprovalNpcs = computed(() => alertingNpcs.value.filter((a) => a.kind === 'approval'))

// The canvas renders on change, so a pulsing badge needs a phase driven from here — and ONLY while
// something is actually pending, so an idle world costs nothing.
let alertPulse: ReturnType<typeof setInterval> | null = null
let pulseTick = 0
function pushAlertsToRenderer(): void {
  const r = getActiveRenderer()
  if (!r || !('setNpcAlerts' in (r as object))) return
  ;(r as unknown as { setNpcAlerts: (a: Record<string, string>) => void }).setNpcAlerts(npcAlerts.value)
  ;(r as unknown as { setPulse: (n: number) => void }).setPulse(pulseTick)
  renderFrame()
}
watch(npcAlerts, () => {
  pushAlertsToRenderer()
  if (hasNpcAlert.value && !alertPulse) {
    alertPulse = setInterval(() => { pulseTick += 1; pushAlertsToRenderer() }, 420)
  } else if (!hasNpcAlert.value && alertPulse) {
    clearInterval(alertPulse); alertPulse = null
    pulseTick = 0
    pushAlertsToRenderer()
  }
}, { deep: true })

// ============================================================
// EXTENDED MOVEMENT · THE-PATH-IS-TRACED-THEN-WALKED
// ============================================================
// Click a distant tile: the route is traced tile-by-tile on hover, then walked ONE STEP PER TURN.
// The walk is a queue of engine Move dispatches, never a teleport — every step passes the same
// validation a keyboard step does, so the world stays authoritative and turn-accurate.
const PATH_MAX = 48          // BFS ceiling — a click across an unreachable room must not sweep forever
const STEP_MS = 130          // one tile per beat; slow enough to read, fast enough not to feel laggy
const hoverPath = ref<Array<{ x: number; y: number }>>([])
const walkQueue = ref<Array<{ x: number; y: number }>>([])
let walkTimer: ReturnType<typeof setInterval> | null = null

// 8-way BFS over ENGINE walkability. NPC-occupied tiles are impassable (you route AROUND people),
// which is also why clicking an NPC selects rather than paths.
function computePath(from: { x: number; y: number }, to: { x: number; y: number }): Array<{ x: number; y: number }> {
  if (!gameState.value) return []
  if (from.x === to.x && from.y === to.y) return []
  if (!isWalkableAt(to)) return []
  const occupied = new Set<string>()
  for (const npc of gameState.value.npcs.values()) {
    if (npc.homeRoomId !== gameState.value.currentPersonalSpaceId) continue
    occupied.add(`${npc.entity.position.x},${npc.entity.position.y}`)
  }
  // FURNITURE IS IMPASSABLE TO A ROUTE. Two reasons, both found by measuring a walk that died early:
  //   1. isWalkableAt() answers from the CHUNK TILE, which stays walkable under a chest — so a path
  //      would route through furniture the engine then refuses, stalling the walk.
  //   2. DOORS are furniture. An auto-walk crossing one would silently transition the player to
  //      another ROOM mid-route — a teleport they never asked for. Routes go around; doors are
  //      entered deliberately, by standing on them and interacting.
  const room = gameState.value.personalSpace
  if (room?.furniture) {
    for (const f of room.furniture) {
      const fx = (f as { tileX?: number }).tileX
      const fy = (f as { tileY?: number }).tileY
      if (typeof fx === 'number' && typeof fy === 'number') occupied.add(`${fx},${fy}`)
    }
  }
  const key = (p: { x: number; y: number }) => `${p.x},${p.y}`
  const prev = new Map<string, { x: number; y: number }>()
  const seen = new Set<string>([key(from)])
  let frontier: Array<{ x: number; y: number }> = [from]
  let depth = 0
  while (frontier.length && depth < PATH_MAX) {
    const next: Array<{ x: number; y: number }> = []
    for (const cur of frontier) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue
          const n = { x: cur.x + dx, y: cur.y + dy }
          const k = key(n)
          if (seen.has(k) || occupied.has(k) || !isWalkableAt(n)) continue
          seen.add(k)
          prev.set(k, cur)
          if (n.x === to.x && n.y === to.y) {
            const out: Array<{ x: number; y: number }> = []
            let step: { x: number; y: number } | undefined = n
            while (step && !(step.x === from.x && step.y === from.y)) {
              out.unshift(step)
              step = prev.get(key(step))
            }
            return out
          }
          next.push(n)
        }
      }
    }
    frontier = next
    depth += 1
  }
  return []   // unreachable within the ceiling — the reticle will read as refused
}

function pushPathToRenderer(path: Array<{ x: number; y: number }>): void {
  const r = getActiveRenderer()
  if (!r || !('setPath' in (r as object))) return
  ;(r as unknown as { setPath: (p: unknown[]) => void }).setPath(path)
  renderFrame()
}

function stopWalk(): void {
  if (walkTimer) { clearInterval(walkTimer); walkTimer = null }
  walkQueue.value = []
  pushPathToRenderer(hoverPath.value)
}

function beginWalk(path: Array<{ x: number; y: number }>): void {
  stopWalk()
  if (!path.length) return
  // RE-PLAN EACH BEAT rather than consuming a fixed queue. Measured: the engine does not always land
  // the exact diagonal that was dispatched (it can slide along an obstacle), so a blindly-consumed
  // queue drifts out of sync with the player's real position and the walk dies mid-route. Re-deriving
  // from the ACTUAL position each step is self-correcting and also absorbs NPCs moving into the way.
  const dest = { ...path[path.length - 1] }
  walkQueue.value = [...path]
  let stalls = 0
  walkTimer = setInterval(() => {
    const cur = gameState.value?.player.entity.position
    if (!cur) { stopWalk(); return }
    if (cur.x === dest.x && cur.y === dest.y) { stopWalk(); return }
    const remaining = computePath(cur, dest)
    if (!remaining.length) { stopWalk(); return }   // destination became unreachable
    walkQueue.value = remaining
    pushPathToRenderer(remaining)
    const step = remaining[0]
    dispatch({ action: ActionType.Move, direction: directionFromDelta(step.x - cur.x, step.y - cur.y) })
    const after = gameState.value?.player.entity.position
    if (!after || (after.x === cur.x && after.y === cur.y)) {
      // Genuinely refused. Allow one retry (a re-plan may route around), then abandon — never grind.
      stalls += 1
      if (stalls >= 2) { stopWalk(); return }
    } else {
      stalls = 0
    }
  }, STEP_MS)
}

function selectNpc(id: string | null): void {
  selectedNpcId.value = id
  const r = getActiveRenderer()
  if (r && 'setSelectedNpc' in (r as object)) {
    ;(r as unknown as { setSelectedNpc: (i: string | null) => void }).setSelectedNpc(id)
    renderFrame()
  }
}

function handleCanvasClick(e: MouseEvent) {
  if (humanInputBlocked()) return
  if (!gameState.value) return
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.focus()
  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const renderer = getActiveRenderer()
  if (!renderer) return
  const worldPos = renderer.screenToWorld(sx, sy)
  if (!worldPos) return
  // Clicking an NPC FOCUSES it (context-dependent actions then address that NPC) instead of walking
  // into it. Clicking the same NPC again clears the focus; clicking empty ground also clears it, so
  // the player is never silently addressing someone they stopped thinking about.
  const clickedNpc = npcAtTile(worldPos)
  if (clickedNpc) {
    selectNpc(selectedNpcId.value === clickedNpc.entity.id ? null : clickedNpc.entity.id)
    return
  }
  if (selectedNpcId.value) selectNpc(null)
  const ppos = gameState.value.player.entity.position
  if (worldPos.x === ppos.x && worldPos.y === ppos.y) { stopWalk(); return }
  // Extended movement: walk the WHOLE traced route, one engine step per beat.
  const path = computePath(ppos, worldPos)
  if (!path.length) return
  beginWalk(path)
}

// Returns the focused NPC when it is adjacent to the player, else null.
function npcAtTileAdjacentTo(npcId: string) {
  if (!gameState.value) return null
  const p = gameState.value.player.entity.position
  for (const npc of gameState.value.npcs.values()) {
    if (npc.entity.id !== npcId) continue
    if (npc.homeRoomId !== gameState.value.currentPersonalSpaceId) continue
    const dx = Math.abs(npc.entity.position.x - p.x)
    const dy = Math.abs(npc.entity.position.y - p.y)
    if (dx <= 1 && dy <= 1) return npc
  }
  return null
}

function directionFromDelta(dx: number, dy: number): Direction {
  const ndx = dx === 0 ? 0 : dx > 0 ? 1 : -1
  const ndy = dy === 0 ? 0 : dy > 0 ? 1 : -1
  if (ndx === 0 && ndy < 0) return Direction.North
  if (ndx === 0 && ndy > 0) return Direction.South
  if (ndx > 0 && ndy === 0) return Direction.East
  if (ndx < 0 && ndy === 0) return Direction.West
  if (ndx > 0 && ndy < 0) return Direction.Northeast
  if (ndx < 0 && ndy < 0) return Direction.Northwest
  if (ndx > 0 && ndy > 0) return Direction.Southeast
  return Direction.Southwest
}

function doMove(dir: Direction) {
  if (humanInputBlocked()) return
  if (walkTimer) stopWalk()   // manual input reclaims control from an auto-walk
  dispatch({ action: ActionType.Move, direction: dir })
}

function doWait() {
  if (humanInputBlocked()) return
  dispatch({ action: ActionType.Wait })
}

function doExit() {
  if (humanInputBlocked()) return
  dispatch({ action: ActionType.ExitPersonalSpace })
}

function findAdjacentNPC(): NPCState | null {
  if (!gameState.value) return null
  const pos = gameState.value.player.entity.position
  for (const npc of npcs.value.values()) {
    if (
      gameState.value.gameContext === 'personal_space' &&
      npc.homeRoomId !== gameState.value.currentPersonalSpaceId
    ) continue
    const dx = Math.abs(npc.entity.position.x - pos.x)
    const dy = Math.abs(npc.entity.position.y - pos.y)
    if (dx <= 1 && dy <= 1 && (dx + dy > 0)) {
      return npc
    }
  }
  return null
}

const hasAdjacentNPC = computed(() => findAdjacentNPC() !== null)

function findAdjacentFurniture(): FurnitureItem | null {
  if (!gameState.value) return null
  if (gameState.value.gameContext !== 'personal_space') return null
  const pos = gameState.value.player.entity.position
  for (const f of gameState.value.personalSpace.furniture) {
    if (!f.targetRoomId) continue
    if (Math.abs(f.tileX - pos.x) <= 1 && Math.abs(f.tileY - pos.y) <= 1) {
      return f
    }
  }
  return null
}

function doInteract() {
  if (humanInputBlocked()) return
  // Context correlation: if the player has FOCUSED an NPC and is standing next to them, the action
  // addresses that NPC specifically — not merely whoever findAdjacentNPC happens to return first.
  const focused = selectedNpcId.value
  const adjacent = findAdjacentNPC()
  const npc = (focused && adjacent && adjacent.entity.id !== focused)
    ? (npcAtTileAdjacentTo(focused) ?? adjacent)
    : adjacent
  if (!npc) {
    const furniture = findAdjacentFurniture()
    if (furniture) {
      dispatch({ action: ActionType.Interact, target: furniture.id, option: '' })
    }
    return
  }
  dispatch({ action: ActionType.Interact, target: npc.entity.id, option: '' })
  const npcDef = NPCS[npc.entity.id]
  const tree = getDialog(npcDef ? npcDef.dialog : npc.dialogTreeId)
  if (!tree) return
  activeDialog.value = tree
  activeDialogNode.value = tree.nodes[tree.startNodeId] ?? null
  activeNPCName.value = npc.entity.name
  dialogNPCId.value = npc.entity.id
  // LAST-TURN FLOW — the SessionManager-rows read: the anchor's row already holds the last exchange
  // (transcriptLastUserInput/transcriptLastModelOutput · persisted by scs_persist_last_turn), so the
  // dialog opens INTO an exchange in flow rather than a cold blank. The persisted fields are the
  // INSTANT floor (the output field holds only the turn's final text block); the /suite8-last-turn
  // route then delivers the FULL exchange from the transcript JSONL and repaginates. The held
  // exchange renders as dimmed pages tabbed with ←/→, replaced on the first send. No anchor anor
  // empty fields → today's greeting-only seed.
  const heldAnchor = npcDef?.name ? resolveS8Anchor(sessionsList.value, npcDef.name) : undefined
  const heldUserTurn = heldAnchor?.transcriptLastUserInput ?? ''
  const heldModelTurn = heldAnchor?.transcriptLastModelOutput ?? ''
  seedPriorPages(heldUserTurn, heldModelTurn, npc.entity.name)
  // The static greeting is the FALLBACK, not a follow-on: a conversation already in flow needs no
  // opening line — it only speaks when there is no held turn to resume.
  dialogMessages.value = priorPages.value.length === 0 && activeDialogNode.value
    ? [{ speaker: activeNPCName.value, text: activeDialogNode.value.text, origin: 'npc', ts: Date.now() }]
    : []
  scrollDialogLogToBottom()
  if (npcDef?.name) {
    const openedNpcId = npc.entity.id
    void fetch(s8LastTurnPath(npcDef.name), { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { ok?: boolean; userTurn?: string; modelTurn?: string } | null) => {
        // Still the same open, still untouched by a send (a send always writes a fresh
        // player-origin row) → repaginate with the full exchange.
        if (!body?.ok || dialogNPCId.value !== openedNpcId) return
        if (dialogMessages.value.some((m) => m.origin === 'player' && !m.prior)) return
        seedPriorPages(body.userTurn ?? heldUserTurn, body.modelTurn ?? heldModelTurn, npc.entity.name)
        // A held exchange displaces the fallback greeting — the conversation resumes, it does not restart.
        if (priorPages.value.length > 0) dialogMessages.value = dialogMessages.value.filter((m) => m.prior)
        scrollDialogLogToBottom()
      })
      .catch(() => { /* route absent anor offline → the floor pages stand */ })
  }
  // Focus the chat input on open so the caret is active and the user can type immediately.
  nextTick(() => dialogInputRef.value?.focus())
}

function closeDialog() {
  if (humanInputBlocked()) return
  activeDialog.value = null
  activeDialogNode.value = null
  activeNPCName.value = ''
  dialogNPCId.value = ''
  priorPages.value = []
  priorPageIndex.value = 0
}

function scrollDialogLogToBottom() {
  nextTick(() => { if (dialogLogRef.value) dialogLogRef.value.scrollTop = dialogLogRef.value.scrollHeight })
}
async function sendDialogMessage(text?: string) {
  if (humanInputBlocked()) return
  if (isProcessing.value) return
  const messageText = (text ?? dialogInput.value).trim()
  if (!messageText || !activeDialogNode.value) return
  dialogMessages.value = [{ speaker: 'You', text: messageText, origin: 'player', ts: Date.now() }]
  priorPages.value = [] // the held exchange yields to the live one — same law as the greeting
  priorPageIndex.value = 0
  dialogInput.value = ''
  scrollDialogLogToBottom()
  toolRunCount.value = 0 // Salvo A · the feed counts THIS turn's tools, not the session's.
  lastToolSeen.value = null; lastToolInputSeen.value = null // ...and does not carry the prior turn's tool over.
  isProcessing.value = true
  try {
    const response = await responder({ text: messageText, npcId: dialogNPCId.value, dialogId: activeDialog.value?.id ?? '' })
    dialogMessages.value = [...dialogMessages.value, { speaker: activeNPCName.value, text: response.text, origin: 'npc', ts: Date.now() }]
  } catch (e) {
    dialogMessages.value = [...dialogMessages.value, { speaker: activeNPCName.value, text: '(...the Expanse is silent...)', origin: 'npc', ts: Date.now() }]
  } finally {
    isProcessing.value = false
    scrollDialogLogToBottom()
  }
}

// Stage 3 · THE-AUTHORED-KIND-IS-HONORED — the anchor authors `kind` per option, so the kind MUST
// route. 'focus' hands the visitor to the terminal (the deep-work half of BSCV) instead of sending
// text; every other kind dispatches its scsCommand on the proven Stage-1 send rail. Without this
// branch an authored focus row would silently post its scsCommand as a chat line.
const decidingApproval = ref(false)
// Stage 3.5 · resolve the anchor's held tool gate. NEVER routes through sendDialogMessage — posting
// the label as chat would leave the real Express response held until its 595s auto-deny. The panel
// clears via the relay (bridge clears the entry -> sessions.json -> relay), never optimistically.
async function decideApproval(option: DialogOption): Promise<void> {
  const ctrl = controller.value
  const session = anchorEntry.value
  if (!ctrl || !session || decidingApproval.value) return
  if (option.behavior === undefined) return
  decidingApproval.value = true
  try {
    await ctrl.triggerPermissionDecision(session.id, option.behavior, option.requestId ?? '', option.persistRule === true)
  } finally {
    decidingApproval.value = false
  }
}

async function selectMenuOption(option: DialogOption) {
  if (humanInputBlocked()) return
  // Both branches sit AHEAD of the isProcessing guard by design: an approval pends precisely WHILE
  // the anchor is blocked (isProcessing true), so gating it would make the gate unanswerable exactly
  // when it matters; focus likewise must reach the terminal mid-turn.
  if (option.kind === 'toolApproval') { await decideApproval(option); return }
  if (option.kind === 'focus') { focusSession(); return }
  if (isProcessing.value === true) return
  if (!activeDialogNode.value) return
  await sendDialogMessage(option.scsCommand || option.text)
}

const hasDisplayableItem = computed(() => {
  if (!gameState.value) return false
  return gameState.value.player.inventory.slots.some(
    s => s.item && s.item.category === 'special' && s.quantity > 0
  )
})

const firstDisplayableItemId = computed(() => {
  if (!gameState.value) return null
  const slot = gameState.value.player.inventory.slots.find(
    s => s.item && s.item.category === 'special' && s.quantity > 0
  )
  return slot?.item?.id ?? null
})

function findEmptyDisplay(): Position | null {
  if (!gameState.value) return null
  const room = gameState.value.personalSpace
  for (const display of room.collectibleDisplays) {
    if (!display.itemId) {
      return { x: display.tileX, y: display.tileY }
    }
  }
  return null
}

function doPlaceCollectible() {
  if (humanInputBlocked()) return
  const itemId = firstDisplayableItemId.value
  const target = findEmptyDisplay()
  if (itemId && target) {
    dispatch({ action: ActionType.PlaceCollectible, itemId, target })
  }
}

const adjacentChest = computed<ChestContainer | null>(() => {
  if (!gameState.value) return null
  const pos = gameState.value.player.entity.position
  const room = gameState.value.personalSpace
  for (const chest of room.chests) {
    const dx = Math.abs(chest.roomPosition.tileX - pos.x)
    const dy = Math.abs(chest.roomPosition.tileY - pos.y)
    if (dx <= 1 && dy <= 1 && (dx + dy > 0)) return chest
  }
  return null
})

function doOpenChest() {
  if (humanInputBlocked()) return
  const chest = adjacentChest.value
  if (!chest) return
  dispatch({ action: ActionType.OpenChest, chestId: chest.id })
  openChest.value = chest
}

function doTransferToChest(itemId: string) {
  if (humanInputBlocked()) return
  if (!openChest.value) return
  dispatch({ action: ActionType.TransferToChest, chestId: openChest.value.id, itemId, quantity: 1 })
  if (gameState.value) {
    const updated = gameState.value.personalSpace.chests.find(c => c.id === openChest.value?.id)
    if (updated) openChest.value = updated
  }
}

function doTransferFromChest(itemId: string) {
  if (humanInputBlocked()) return
  if (!openChest.value) return
  dispatch({ action: ActionType.TransferFromChest, chestId: openChest.value.id, itemId, quantity: 1 })
  if (gameState.value) {
    const updated = gameState.value.personalSpace.chests.find(c => c.id === openChest.value?.id)
    if (updated) openChest.value = updated
  }
}

function closeChest() {
  if (humanInputBlocked()) return
  openChest.value = null
}

const chestInventoryItems = computed(() => {
  if (!openChest.value) return []
  return openChest.value.slots.map(s => ({
    itemId: s.itemId,
    name: ITEMS[s.itemId]?.name ?? s.itemId,
    quantity: s.quantity,
  }))
})

const roomDimensions = computed(() => {
  if (!gameState.value) return ''
  const room = gameState.value.personalSpace
  return `${room.grid[0]?.length ?? 0}x${room.grid.length ?? 0}`
})

function handleKeydown(e: KeyboardEvent) {
  if (humanInputBlocked()) return
  if (e.repeat) return
  const key = e.key.toLowerCase()

  if (openChest.value) {
    if (key === 'escape') {
      closeChest()
      canvasRef.value?.focus()
    }
    return
  }

  if (activeDialogNode.value) {
    if (key === 'escape' || key === 'i') {
      closeDialog()
      canvasRef.value?.focus()
    }
    return
  }

  switch (key) {
    case 'w':
    case 'arrowup':
      e.preventDefault()
      doMove(Direction.North)
      break
    case 's':
    case 'arrowdown':
      e.preventDefault()
      doMove(Direction.South)
      break
    case 'a':
    case 'arrowleft':
      e.preventDefault()
      doMove(Direction.West)
      break
    case 'd':
    case 'arrowright':
      e.preventDefault()
      doMove(Direction.East)
      break
    case 'e':
      doExit()
      break
    case 'i':
      doInteract()
      break
    case 'o':
      if (adjacentChest.value) {
        doOpenChest()
      }
      break
    case ' ':
      e.preventDefault()
      doWait()
      break
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (humanInputBlocked()) return
  // LAST-TURN FLOW — ←/→ tab the held exchange while the dialog is open (self-guarded).
  handlePriorPageKeys(e)
  if (e.key === 'Escape') {
    if (openChest.value) {
      closeChest()
      canvasRef.value?.focus()
      return
    }
    if (activeDialogNode.value) {
      closeDialog()
      canvasRef.value?.focus()
    }
  }
}

onMounted(() => {
  if (typeof window === 'undefined') return
  initialize()
  if (canvasRef.value) {
    personalSpaceRenderer = new PersonalSpaceRenderer(canvasRef.value)
    fitCanvasToStage() // Salvo E · size BEFORE the first paint so the map is never drawn off-centre.
    renderFrame()
    canvasRef.value.focus()
  }
  // Salvo E · observe the stage (element width) AND the window (viewport height) — the fit is a
  // function of both, and a height-only change must still re-fit.
  const fitHost = stageRef.value
  if (fitHost && typeof ResizeObserver !== 'undefined') {
    stageObserver = new ResizeObserver(() => fitCanvasToStage())
    stageObserver.observe(fitHost)
  }
  window.addEventListener('resize', fitCanvasToStage)
  window.addEventListener('keydown', handleGlobalKeydown)
  if (typeof window !== 'undefined') {
    function agentCall<T>(fn: () => T): T { const prev = agentDriving; agentDriving = true; try { return fn() } finally { agentDriving = prev } }
    ;(window as any).__IE_GAME__ = {
      move: (dir: Direction) => agentCall(() => doMove(dir)),
      wait: () => agentCall(() => doWait()),
      talk: () => agentCall(() => doInteract()),
      interact: () => agentCall(() => doInteract()),
      place: () => agentCall(() => doPlaceCollectible()),
      sendMessage: (text: string) => agentCall(() => sendDialogMessage(text)),
      summon: () => agentCall(() => summonSession()),
      focus: () => agentCall(() => focusSession()),
      anchorOnline: () => anchorOnline.value,
      getMessages: () => dialogMessages.value,
      // LAST-TURN FLOW — the PlayTester sees the pager, not just the page.
      getPriorPages: () => ({ index: priorPageIndex.value, count: priorPages.value.length, page: currentPriorPage.value }),
      stepPriorPage: (delta: number) => agentCall(() => stepPriorPage(delta)),
      isProcessing: () => isProcessing.value,
      // Salvo A · the same live feed the human sees — an agent PlayTester must be able to observe
      // tool activity rather than infer it from a spinner it cannot see.
      selectNpc: (id: string | null) => agentCall(() => selectNpc(id)),
      getSelectedNpc: () => selectedNpcId.value,
      // Salvo F · an agent PlayTester must be able to SEE the offstage flag, not just a human.
      getNpcAlerts: () => ({ ...npcAlerts.value }),
      getHoverTile: () => hoverTile.value,
      getHoverPath: () => hoverPath.value.map((p) => ({ ...p })),
      walkTo: (x: number, y: number) => agentCall(() => {
        const p = gameState.value?.player.entity.position
        if (!p) return []
        const path = computePath(p, { x, y })
        if (path.length) beginWalk(path)
        return path
      }),
      isWalking: () => walkTimer !== null,
      getToolFeed: () => ({
        working: anchorWorking.value,
        tool: feedTool.value,
        liveTool: activeToolLive.value,
        settled: feedSettled.value,
        input: feedInput.value,
        step: toolRunCount.value,
      }),
      closeDialog: () => agentCall(() => closeDialog()),
      openChest: () => agentCall(() => doOpenChest()),
      transferToChest: (itemId: string) => agentCall(() => doTransferToChest(itemId)),
      transferFromChest: (itemId: string) => agentCall(() => doTransferFromChest(itemId)),
      closeChest: () => agentCall(() => closeChest()),
      exit: () => agentCall(() => doExit()),
      dispatch: (action: Action) => agentCall(() => dispatch(action)),
      // W5 · INTEROPERABLE CONTROLS — the agent drives the SAME options a human sees
      // (effectiveOptions), not the static node's.
      // `approval` mirrors the held-gate head so an agent PlayTester can SEE a pending gate, not just
      // its buttons — the rows themselves already ride effectiveOptions (interoperable controls).
      getDialogState: () => ({ npcName: activeNPCName.value, npcId: dialogNPCId.value, text: activeDialogNode.value?.text ?? null, options: effectiveOptions.value, approval: approvalHead.value ? { tool: approvalHead.value.tool, input: approvalHead.value.input, depth: approvalDepth.value } : null }),
      selectMenuOption: (id: string) => agentCall(() => { const o = effectiveOptions.value.find(o => o.id === id); if (o) return selectMenuOption(o) }),
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('resize', fitCanvasToStage)
  if (stageObserver) { stageObserver.disconnect(); stageObserver = null }
  if (summonPoll) clearInterval(summonPoll)
  if (alertPulse) { clearInterval(alertPulse); alertPulse = null }
  if (walkTimer) { clearInterval(walkTimer); walkTimer = null }
  if (typeof window !== 'undefined') delete (window as any).__IE_GAME__
})
</script>

<template>
  <div class="ie-game-root" ref="rootRef">
    <!-- THE-CHAT-BECOMES-A-RAIL — stage and chat are SIBLINGS in a row: the chat no longer
         overlays the actors it is about, and it consumes the abundant X instead of the scarce Y. -->
    <div class="ie-game-shell" ref="shellRef">
      <div class="ie-game-column">
      <div class="ie-game-stage" ref="stageRef">
        <canvas
          ref="canvasRef"
          tabindex="0"
          class="ie-game-canvas"
          @keydown.prevent="handleKeydown"
          @click="handleCanvasClick"
          @mousemove="handleCanvasMove"
          @mouseleave="handleCanvasLeave"
        />
        <div
          v-if="openChest"
          class="ie-chest-overlay"
          @click.self="closeChest()"
        >
          <div class="ie-chest-panel" style="max-height: 80%;" @click.stop>
            <div class="ie-chest-header">
              <h2 class="ie-chest-title">Chest Storage</h2>
              <button class="ie-dialog-close" :disabled="OBSERVER_MODE" @click="closeChest(); canvasRef?.focus()">X</button>
            </div>
            <div class="ie-chest-columns">
              <div class="ie-chest-col">
                <div class="ie-chest-col-label">Inventory</div>
                <div class="ie-chest-list">
                  <div v-if="filledSlots.length === 0" class="ie-chest-empty">Empty</div>
                  <div
                    v-for="slot in filledSlots"
                    :key="'inv-' + slot.item!.id"
                    class="ie-chest-item"
                  >
                    <span class="ie-chest-item-name">{{ slot.item!.name }} <span class="ie-chest-item-qty">x{{ slot.quantity }}</span></span>
                    <button
                      class="ie-chest-xfer"
                      :disabled="OBSERVER_MODE"
                      @click="doTransferToChest(slot.item!.id)"
                    >-></button>
                  </div>
                </div>
              </div>
              <div class="ie-chest-col">
                <div class="ie-chest-col-label">{{ openChest.capacity >= 9999 ? `Bottomless Chest (${openChest.slots.length} items stored)` : `Chest (${openChest.slots.length}/${openChest.capacity})` }}</div>
                <div class="ie-chest-list">
                  <div v-if="chestInventoryItems.length === 0" class="ie-chest-empty">Empty</div>
                  <div
                    v-for="cItem in chestInventoryItems"
                    :key="'chest-' + cItem.itemId"
                    class="ie-chest-item"
                  >
                    <button
                      class="ie-chest-xfer"
                      :disabled="OBSERVER_MODE"
                      @click="doTransferFromChest(cItem.itemId)"
                    ><-</button>
                    <span class="ie-chest-item-name">{{ cItem.name }} <span class="ie-chest-item-qty">x{{ cItem.quantity }}</span></span>
                  </div>
                </div>
              </div>
            </div>
            <div class="ie-dialog-hint">Click outside or X to close</div>
          </div>
        </div>
        <!-- Personal Space HUD lives in the canvas NEGATIVE SPACE (the dead wing beside the
             isometric diamond), reclaiming its whole 60px band from the Y budget. -->
        <!-- Corner readout — Personal Space + Room specs stay in the canvas dead corner. The
             action/inventory controls migrate to the always-visible footer below the game. -->
        <div class="ie-hud-corner">
        <div class="ie-toolbar-info">
          <!-- Salvo D · Turn and Room share ONE line so the halved 60px band holds title + meta + help
               without clipping (three stacked lines no longer fit). -->
          <div class="ie-toolbar-title">Personal Space</div>
          <div class="ie-toolbar-meta">Turn {{ turn }} <span class="ie-toolbar-meta-dim">· Room {{ roomDimensions }}</span></div>
          <div class="ie-toolbar-help">WASD=move I=talk O=chest E=exit Space=wait</div>
          <!-- StratiPUNK focus chip — teal is reserved for POINTER INTENT + FOCUS, so the reticle on
               the ground and this chip read as one system. Absent when nobody is addressed. -->
          <div v-if="selectedNpcName" class="ie-focus-chip">
            <span class="ie-focus-chip-caret">▾</span>{{ selectedNpcName }}
          </div>
        </div>
        </div>
      </div>
      </div>
      <aside v-if="activeDialogNode" class="ie-chat-rail">
        <div
        v-if="activeDialogNode"
        class="ie-dialog-overlay"
        @click.self="closeDialog()"
        >
        <div class="ie-dialog-panel" :class="{ 'is-offline': !anchorOnline }">
        <div class="ie-dialog-header">
        <div class="ie-dialog-avatar">
        <span class="ie-dialog-avatar-initial">{{ activeNPCName.charAt(0) }}</span>
        <span class="ie-session-status-dot" :class="anchorOnline ? 'is-online' : 'is-offline'" />
        </div>
        <div class="ie-dialog-speaker">{{ activeNPCName }}</div>
        <div class="ie-dialog-header-actions">
        <button v-if="!anchorOnline" class="ie-session-btn is-summon" :disabled="OBSERVER_MODE || summoning" title="Summon the Anchor" @click="summonSession()">⚓</button>
        <button v-else class="ie-session-btn is-focus" :disabled="OBSERVER_MODE" title="Focus the Anchor" @click="focusSession()">◎</button>
        <button class="ie-dialog-close" :disabled="OBSERVER_MODE" @click="closeDialog(); canvasRef?.focus()">X</button>
        </div>
        </div>
        <div ref="dialogLogRef" class="ie-dialog-log">
        <!-- LAST-TURN FLOW — the held exchange, one page at a time. ←/→ tab through the rest of
             what was said; the pager row names the position. Cleared by the first send. -->
        <template v-if="currentPriorPage">
        <p
        class="ie-msg is-immediate is-prior"
        :class="currentPriorPage.origin === 'player' ? 'ie-msg-player' : 'ie-msg-npc'"
        >{{ currentPriorPage.text }}</p>
        <div v-if="priorPages.length > 1" class="ie-prior-pager">
        <span class="ie-prior-pager-key" :class="{ 'is-dim': priorPageIndex === 0 }">‹</span>
        <span class="ie-prior-pager-pos">{{ priorPageIndex + 1 }}/{{ priorPages.length }}</span>
        <span class="ie-prior-pager-key" :class="{ 'is-dim': priorPageIndex === priorPages.length - 1 }">›</span>
        </div>
        </template>
        <p
        v-for="(m, idx) in dialogMessages"
        :key="idx"
        class="ie-msg is-immediate"
        :class="[m.origin === 'player' ? 'ie-msg-player' : 'ie-msg-npc', { 'is-prior': m.prior }]"
        >{{ m.text }}</p>
        <!-- Salvo A · THE-LIVE-FEED-ACK. The dots persist as the heartbeat; when the anchor is
        actually running a tool the feed names it, so a long turn reads as WORK, not a hang. -->
        <div v-if="anchorWorking" class="ie-focus-bubble" aria-label="working">
        <span class="ie-focus-dot"></span>
        <span class="ie-focus-dot"></span>
        <span class="ie-focus-dot"></span>
        </div>
        <div v-if="anchorWorking && feedTool" class="ie-tool-feed" :class="{ 'is-settled': feedSettled }" aria-live="polite">
        <span class="ie-tool-feed-spark">◈</span>
        <span class="ie-tool-feed-name">{{ feedTool }}</span>
        <span v-if="toolRunCount > 1" class="ie-tool-feed-count">step {{ toolRunCount }}</span>
        <span v-if="feedSettled" class="ie-tool-feed-count">· done, thinking</span>
        <div v-if="feedInput" class="ie-tool-feed-input">{{ feedInput }}</div>
        </div>
        </div>
        <!-- Stage 3.5 · the held tool gate, stated in-world. Without the head the player would face
        bare Allow/Deny rows with no idea what they are permitting. -->
        <div v-if="approvalHead" class="ie-approval-head">
        <span class="ie-approval-mark">⚠</span>
        <span class="ie-approval-tool">{{ approvalHead.tool }}</span>
        <span v-if="approvalDepth > 1" class="ie-approval-depth">+{{ approvalDepth - 1 }} waiting</span>
        <div v-if="approvalHead.input" class="ie-approval-input">{{ approvalHead.input }}</div>
        </div>
        <div v-if="activeDialogNode && effectiveOptions.length > 0" class="ie-dialog-options" :class="{ 'is-dormant': !optionsLive }">
        <button
        v-for="opt in effectiveOptions"
        :key="opt.id"
        class="ie-menu-option-btn"
        :class="`ie-menu-option-${opt.kind ?? 'focus'}`"
        :disabled="OBSERVER_MODE || (opt.kind !== 'toolApproval' && isProcessing === true) || (opt.kind === 'toolApproval' && decidingApproval)"
        :title="opt.text"
        @click="selectMenuOption(opt)"
        >{{ opt.text }}</button>
        </div>
        <div class="ie-dialog-input-row">
        <input ref="dialogInputRef" v-model="dialogInput" type="text" placeholder="Say something..."
        class="ie-dialog-input"
        :disabled="OBSERVER_MODE || isProcessing" @keydown.enter.prevent="sendDialogMessage()" />
        <button class="ie-send-btn"
        :disabled="OBSERVER_MODE || isProcessing || !dialogInput.trim()" @click="sendDialogMessage()">Send</button>
        </div>
        <div class="ie-dialog-hint" title="Click outside to close" aria-label="Click outside to close" @click="closeDialog()"></div>
        </div>
        </div>
      </aside>
    </div>

      <!-- FOOTER TOOLBAR — always visible beneath the game, with room to expand. Actions scroll
           on X when they outnumber their section rather than wrapping into a taller band. -->
      <div class="ie-footer">
        <div class="ie-footer-actions">
        <div class="ie-toolbar-actions">
          <button
            class="ie-toolbar-btn"
            :disabled="OBSERVER_MODE"
            @click="doExit(); canvasRef?.focus()"
          >
            <kbd class="ie-kbd">E</kbd>
            Exit
          </button>
          <button
            v-if="hasAdjacentNPC"
            class="ie-toolbar-btn ie-toolbar-btn-accent"
            :disabled="OBSERVER_MODE"
            @click="doInteract(); canvasRef?.focus()"
          >
            <kbd class="ie-kbd">I</kbd>
            Talk
          </button>
          <button
            v-if="adjacentChest"
            class="ie-toolbar-btn ie-toolbar-btn-gold"
            :disabled="OBSERVER_MODE"
            @click="doOpenChest(); canvasRef?.focus()"
          >
            <kbd class="ie-kbd">O</kbd>
            Chest
          </button>
          <button
            v-if="hasDisplayableItem"
            class="ie-toolbar-btn"
            :disabled="OBSERVER_MODE"
            @click="doPlaceCollectible(); canvasRef?.focus()"
          >
            Display
          </button>
        </div>
        </div>
        <!-- Salvo F · room-independent alert. Present whenever ANY bound anchor holds a gate, even if
             its NPC is in another room and therefore undrawn. -->
        <div v-if="hasNpcAlert" class="ie-footer-alert">
          <div
            v-for="a in alertingNpcs"
            :key="a.id"
            class="ie-alert-chip"
            :class="a.kind === 'approval' ? 'is-approval' : 'is-working'"
            :title="a.kind === 'approval' ? a.name + ' is waiting on your approval' : a.name + ' is working'"
          >
            <span class="ie-alert-glyph">{{ a.kind === 'approval' ? '!' : '*' }}</span>{{ a.name }}
          </div>
        </div>
        <div class="ie-footer-inv">
        <div class="ie-toolbar-inv">
          <div class="ie-inv-label">Inventory</div>
          <div v-if="inventoryQuickSlots.length === 0" class="ie-inv-empty">Empty</div>
          <div v-else class="ie-inv-grid">
            <div
              v-for="(slot, idx) in inventoryQuickSlots"
              :key="idx"
              class="ie-inv-slot"
            >
              <span class="ie-inv-slot-name">{{ slot.id }}</span>
              <span class="ie-inv-slot-qty">x{{ slot.qty }}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
  </div>
</template>

<style scoped>
/* ============================================================
 * IsomorphicExpanse — Game Overlay Styles
 * Dark elevated panes, cobalt/blue accents, gold chest accent,
 * embossed control bar. Consumes the global design tokens
 * (board surfaces, suite colors, font stacks). Standard CSS —
 * the game render surface reads as a styled chat + control bar.
 * ============================================================ */

/* ---- Outer game frame ---- */
.ie-game-root {
  /* width:100% breaks a CIRCULARITY: the root shrink-wrapped its content, so its clientWidth was a
     function of the canvas we were sizing FROM it — the fit collapsed to CANVAS_MIN_W on every load.
     Stretching to the island makes the measurement independent of the content it drives. */
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  /* THE-Y-IS-LAID-OUT-NOT-COMPUTED. JS sets this height once per fit (root top -> taskbar); the shell
     then FLEXES into whatever remains above the game bar, and the canvas READS its laid-out box.
     Computing the canvas height from a stageTop measured pre-layout was stale by ~90px — the dead band. */
  min-height: 320px;
  /* Salvo D/E · THE SINGLE STAGE WIDTH. Canvas, toolbar, and the docked chat all measure from this
     one token. Salvo E made the canvas responsive; the renderer ALREADY derives its projection origin
     (originX = width/2) and screenToWorld reads the same origin, so click-mapping follows for free. */
  --ie-stage-w: 800px;
  /* Salvo C · one row of chrome + a half row above and below. */
  --ie-row: 1.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Salvo C/E · min-height:100vh manufactured the dead band between the stage and the toolbar. The
     column is now content-sized; the .scs-taskbar clearance lives HERE (page level) instead of being
     baked into the dialog overlay, which is what pushed the chat 68px off its dock. */
  padding-bottom: 0;
  background: var(--color-board-dark);
  color: rgba(255, 255, 255, 0.92);
  font-family: var(--font-body);
  user-select: none;
}
.ie-game-shell {
  display: flex;
  align-items: stretch;   /* rail matches the play field height, so it seats flush on the bar */
  gap: 0.5rem;
  width: 100%;
  margin-top: 0.5rem;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;          /* lets the shell SHRINK to the bar instead of overflowing past it */
}
.ie-game-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;   /* the canvas fills this box exactly; nothing spills */
}
/* THE-CHAT-BECOMES-A-RAIL — a tall, narrow column: the natural shape of a message log, and the shape
   the dead horizontal wing already had. Spends X (abundant) instead of Y (scarce). */
.ie-chat-rail {
  flex: 0 0 auto;
  width: var(--ie-rail-w, 340px);
  align-self: stretch;   /* fit to the bottom — matches canvas + footer height */
  display: flex;
  min-width: 0;
}
/* The HUD now floats in the canvas negative space beside the isometric diamond, so the Personal
   Space band costs ZERO vertical budget. Pointer-events are re-enabled on the controls only, so the
   dead wing still passes clicks through to the canvas. */
/* The stage and its always-visible footer form one column; the rail is the row sibling beside them
   and STRETCHES to the bottom, so the chat fits the full height rather than ending part-way. */
.ie-game-column {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
/* --ie-bar-h is the single source for the bar's height: the fit reserves exactly this much Y, so the
   canvas is viewport-height MINUS the bar (plus the fixed taskbar) and no dead band survives. */
/* Corner readout only — specs live in the canvas dead corner and cost no layout height. Sized to
   content so the room is no longer inset by a full-height 170px column (scale recovered ~0.68->0.95). */
.ie-hud-corner {
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  width: 12rem;
  max-width: 45%;
  pointer-events: none;
  z-index: 60;
}
.ie-hud-corner > * { pointer-events: auto; }
/* FOOTER — always visible, room to expand. */
/* THE GAME BAR — spans the FULL screen width beneath the play field, with the chat framed neatly on
   top of it (the shell's bottom edge is this bar's top edge). It is the one element that is never
   scoped to the canvas: a control surface the viewer can always find, at a constant place. */
.ie-footer {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  width: 100%;
  min-height: var(--ie-bar-h, 56px);
  margin-top: 0;
  border-left: none;
  border-right: none;
  border-radius: 0;
  background:
    radial-gradient(ellipse at 87.5% 12.5%, rgba(59, 130, 246, 0.05) 0%, rgba(0, 0, 0, 0) 75%),
    var(--color-board-surface);
  border: 1px solid var(--color-board-light);
  border-radius: 0.35rem;
  overflow: hidden;
}
.ie-footer-actions {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 0.4rem 0.5rem;
  /* Actions SCROLL on X when they outnumber the section — they never wrap into a taller footer. */
  overflow-x: auto;
  overflow-y: hidden;
  border-right: 1px solid var(--color-board-light);
}
.ie-footer-inv {
  flex: 0 0 auto;
  width: 16rem;
  max-width: 45%;
  display: flex;
  align-items: center;
  padding: 0.4rem 0.5rem;
  overflow: hidden;
}
.ie-game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;   /* the pointer PROPOSES a tile — a crosshair says so before the reticle does */
  max-width: 100%;
  border: 1px solid var(--color-board-light);
  outline: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6), 0 8px 28px rgba(0, 0, 0, 0.55);
}

/* ---- Dialog messaging surface (overlay + bottom-anchored panel) ---- */
.ie-dialog-overlay {
  position: relative;
  inset: 0;
  /* In RAIL form the overlay is simply the column body — no insets, no bottom-docking, and the
     click-outside-to-close backdrop is gone (a rail is not modal; the world stays live beside it). */
  inset: auto;
  width: 100%;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  z-index: 40;
}
.ie-dialog-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;   /* a column, not a bottom sheet */
  padding: 0.35rem 1.15rem 0.5rem; /* Salvo C · reclaimed padding goes to the message log */
  background:
    radial-gradient(ellipse at 87.5% 12.5%, rgba(59, 130, 246, 0.09) 0%, rgba(0, 0, 0, 0) 70%),
    rgba(28, 28, 33, 0.96);
  border: 1px solid var(--color-board-light);
  border-top: 2px solid var(--color-cobalt);
  border-bottom: none;
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  box-shadow: 0 -6px 26px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  overflow: hidden;
}

/* Speaker header (avatar + name + close) */
.ie-dialog-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  /* Salvo C · a SINGLE row of chrome with a half-row of breathing space above and below. The old
     0.6rem bottom margin plus the tall avatar/buttons made the header eat ~3 rows of the panel. */
  height: var(--ie-row);
  padding: calc(var(--ie-row) / 2) 0;
  box-sizing: content-box;
  margin-bottom: 0;
  flex: 0 0 auto;
}
.ie-dialog-avatar {
  flex: 0 0 auto;
  position: relative;
  width: var(--ie-row);
  height: var(--ie-row);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 38% 30%, rgba(59, 130, 246, 0.35) 0%, var(--fade-cobalt) 78%);
  border: 2px solid var(--color-cobalt);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.35);
}
.ie-dialog-avatar-initial {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--color-cobalt-light);
  text-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
}
.ie-dialog-speaker {
  font-family: var(--font-heading);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-cobalt);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.5); /* amber complement of cobalt */
}
.ie-dialog-close {
  margin-left: auto;
  flex: 0 0 auto;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1;
  background: transparent;
  border: 1px solid var(--color-board-light);
  border-radius: 0.25rem;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ie-dialog-close:hover:not(:disabled) {
  color: rgba(255, 255, 255, 0.92);
  border-color: var(--color-cobalt);
}
.ie-dialog-close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Scrolling message log */
.ie-dialog-log {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  /* In rail form the log ABSORBS the height the stacked options used to eat (chat in focus). */
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  padding: 0.15rem 0.4rem 0.15rem 0.15rem;
  scrollbar-width: thin;
}
.ie-dialog-log::-webkit-scrollbar { width: 4px; }
.ie-dialog-log::-webkit-scrollbar-track { background: transparent; }
.ie-dialog-log::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 2px; }

/* Message rows — NPC left/accent, player right/dimmed (chat idiom) */
.ie-msg {
  max-width: 80%;
  margin: 0;
  padding: 0.4rem 0.6rem;
  border-radius: 0.4rem;
  font-family: var(--font-body);
  font-size: 0.82rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
/* LAST-TURN FLOW — the held turn reads as MEMORY, not fresh speech: dimmed, no entrance animation. */
.ie-msg.is-prior {
  opacity: 0.55;
  white-space: pre-wrap;   /* the full exchange carries paragraph breaks — keep them */
}
/* The pager row — small, quiet, keyboard-first: the ‹ › name the keys, the count names the place. */
.ie-prior-pager {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  align-self: center;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.45);
  user-select: none;
}
.ie-prior-pager-key { color: rgba(64, 224, 208, 0.7); }
.ie-prior-pager-key.is-dim { opacity: 0.25; }
.ie-msg-npc {
  align-self: flex-start;
  background: rgba(0, 0, 0, 0.28);
  border-top: 1px solid var(--color-board-light);
  border-left: 3px solid var(--color-cobalt);
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.35);
}
.ie-msg-player {
  align-self: flex-end;
  text-align: right;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-right: 3px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.62);
}

/* Focus Bubble — animated typing indicator (replaces the inert pulse line) */
.ie-focus-bubble {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.4rem;
  background: rgba(0, 0, 0, 0.28);
  border-top: 1px solid var(--color-board-light);
  border-left: 3px solid var(--color-cobalt);
}
.ie-focus-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-cobalt-light);
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);
  animation: ie-focus-bounce 1.25s ease-in-out infinite;
}
.ie-focus-dot:nth-child(2) { animation-delay: 0.18s; }
.ie-focus-dot:nth-child(3) { animation-delay: 0.36s; }
@keyframes ie-focus-bounce {
  0%, 70%, 100% { transform: translateY(0); opacity: 0.35; }
  35%           { transform: translateY(-4px); opacity: 1; }
}

/* Input row — text field + send button */
.ie-dialog-input-row {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  margin-top: 0.7rem;
}
.ie-dialog-input {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  line-height: 1.5;
  padding: 0.5rem 0.75rem;
  border-radius: 0.3rem;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 0, 0, 0.3);
  border-right: 1px solid rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 3px solid var(--color-cobalt);
  color: rgba(255, 255, 255, 0.88);
  outline: none;
  transition: box-shadow 0.15s ease;
}
.ie-dialog-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}
.ie-dialog-input:focus {
  box-shadow: inset 3px 0 0 var(--color-cobalt), 0 0 6px rgba(59, 130, 246, 0.28);
}
.ie-dialog-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Send button — embossed suite-keyed control (cobalt) */
.ie-send-btn {
  flex: 0 0 auto;
  font-family: var(--font-heading);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0 1rem;
  border-radius: 0.3rem;
  background: rgba(59, 130, 246, 0.1);
  border-top: 2px solid var(--color-cobalt-dark);
  border-right: 2px solid var(--color-cobalt-dark);
  border-bottom: 2px solid var(--color-cobalt-light);
  border-left: 2px solid var(--color-cobalt-light);
  color: var(--color-cobalt-light);
  cursor: pointer;
  transition: all 0.15s ease;
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.4);
}
.ie-send-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.22);
  color: #fff;
  box-shadow: -1px 1px 4px var(--shadow-cobalt);
}
.ie-send-btn:active:not(:disabled) {
  border-top: 2px solid var(--color-cobalt-light);
  border-right: 2px solid var(--color-cobalt-light);
  border-bottom: 2px solid var(--color-cobalt-dark);
  border-left: 2px solid var(--color-cobalt-dark);
  box-shadow: 0 0 2px inset rgba(0, 0, 0, 0.5);
}
.ie-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Salvo C · THE LIP. The full "Click outside to close" sentence spent a labelled row on a hint the
   player learns once; it is now a thin bar under the chat — same affordance, ~4px instead of ~18px.
   The text survives as the title/aria-label so the meaning is not lost for screen readers. */
.ie-dialog-hint {
  margin: 0.3rem auto 0;
  width: 3.5rem;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 0;
  line-height: 0;
  overflow: hidden;
  cursor: pointer;
  transition: background 0.15s ease;
  flex: 0 0 auto;
}
.ie-dialog-hint:hover { background: rgba(255, 255, 255, 0.4); }

/* ---- Dialog menu options (Shatterite-grammar adapter) ----
   Row of embossed suite-keyed buttons between the log and the input row.
   'scs' mirrors .ie-send-btn (cobalt rail); 'focus'/'askMore' mirror
   .ie-toolbar-btn-gold (gold rail). */
/* THE-ONE-LINE-BAND — the doors are a single rotating row that scrolls on X, not a vertical stack.
   In the narrow rail each option was claiming a full row, so five doors pushed the message log down to
   a sliver; the chat is the subject of this panel and must hold the vertical space. Mirrors the game
   bar's action strip: nowrap + overflow-x, never wrap into extra height. */
.ie-dialog-options {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
  flex: 0 0 auto;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  padding-bottom: 0.2rem;
  /* fade the right edge so a scrollable overflow reads as "more doors this way" */
  mask-image: linear-gradient(to right, #000 calc(100% - 1.25rem), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 1.25rem), transparent 100%);
}
.ie-menu-option-btn {
  flex: 0 0 auto;      /* no shrinking — the BAND scrolls, the labels stay legible */
  max-width: 14rem;
  font-family: var(--font-heading);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.35rem 0.7rem;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 'scs' — cobalt rail (mirrors .ie-send-btn) */
.ie-menu-option-scs {
  background: rgba(59, 130, 246, 0.1);
  border-top: 2px solid var(--color-cobalt-dark);
  border-right: 2px solid var(--color-cobalt-dark);
  border-bottom: 2px solid var(--color-cobalt-light);
  border-left: 2px solid var(--color-cobalt-light);
  color: var(--color-cobalt-light);
}
.ie-menu-option-scs:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.22);
  color: #fff;
  box-shadow: -1px 1px 4px var(--shadow-cobalt);
}
.ie-menu-option-scs:active:not(:disabled) {
  border-top: 2px solid var(--color-cobalt-light);
  border-right: 2px solid var(--color-cobalt-light);
  border-bottom: 2px solid var(--color-cobalt-dark);
  border-left: 2px solid var(--color-cobalt-dark);
  box-shadow: 0 0 2px inset rgba(0, 0, 0, 0.5);
}
/* Stage 3.5 · 'toolApproval' — vermillion rail. Deliberately the LOUDEST option style in the
   dialog: these rows pre-empt the menu, hold a live gate, and expire on a clock. */
.ie-menu-option-toolApproval {
  background: rgba(220, 38, 38, 0.14);
  border-top: 2px solid var(--color-red-dark, #7f1d1d);
  border-right: 2px solid var(--color-red-dark, #7f1d1d);
  border-bottom: 2px solid var(--color-red-light, #f87171);
  border-left: 2px solid var(--color-red-light, #f87171);
  color: var(--color-red-light, #f87171);
}
.ie-menu-option-toolApproval:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.3);
  color: #fff;
  box-shadow: -1px 1px 4px var(--shadow-red, rgba(220, 38, 38, 0.5));
}
.ie-menu-option-toolApproval:active:not(:disabled) {
  border-top: 2px solid var(--color-red-light, #f87171);
  border-right: 2px solid var(--color-red-light, #f87171);
  border-bottom: 2px solid var(--color-red-dark, #7f1d1d);
  border-left: 2px solid var(--color-red-dark, #7f1d1d);
  box-shadow: 0 0 2px inset rgba(0, 0, 0, 0.5);
}
/* Salvo A · the live tool feed. Cobalt rail (the Expanse working WITH you) — deliberately quieter
   than the vermillion approval head, which demands an answer; this only reports. */
.ie-tool-feed {
  margin: 0.25rem 0.5rem 0.1rem;
  padding: 0.3rem 0.5rem;
  background: rgba(59, 130, 246, 0.08);
  border-left: 2px solid var(--color-cobalt-light);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.66rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  animation: ie-tool-feed-in 0.18s ease-out;
}
@keyframes ie-tool-feed-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
.ie-tool-feed-spark { color: var(--color-cobalt-light); animation: ie-tool-spark 1.4s ease-in-out infinite; }
@keyframes ie-tool-spark { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
.ie-tool-feed-name {
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.ie-tool-feed-count { color: rgba(255, 255, 255, 0.45); }
/* Settled = tool finished, anchor still thinking. Dimmer, and the spark stops pulsing. */
.ie-tool-feed.is-settled { background: rgba(59, 130, 246, 0.05); }
.ie-tool-feed.is-settled .ie-tool-feed-spark { animation: none; opacity: 0.4; }
.ie-tool-feed.is-settled .ie-tool-feed-name { color: rgba(255, 255, 255, 0.7); }
.ie-tool-feed-input {
  flex-basis: 100%;
  color: rgba(255, 255, 255, 0.6);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 2.6rem;
  overflow: hidden;
}
/* The held-gate head — states WHAT is being permitted, above the rows. */
.ie-approval-head {
  margin: 0 0.5rem 0.35rem;
  padding: 0.4rem 0.55rem;
  background: rgba(220, 38, 38, 0.1);
  border-left: 3px solid var(--color-red-light, #f87171);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.72rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.ie-approval-mark { color: var(--color-red-light, #f87171); }
.ie-approval-tool {
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.ie-approval-depth {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.66rem;
}
.ie-approval-input {
  flex-basis: 100%;
  color: rgba(255, 255, 255, 0.7);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 4.5rem;
  overflow-y: auto;
}
/* 'focus' + 'askMore' — gold rail (mirrors .ie-toolbar-btn-gold) */
.ie-menu-option-focus,
.ie-menu-option-askMore {
  background: rgba(234, 179, 8, 0.12);
  border-top: 2px solid var(--color-yellow-dark);
  border-right: 2px solid var(--color-yellow-dark);
  border-bottom: 2px solid var(--color-yellow-light);
  border-left: 2px solid var(--color-yellow-light);
  color: var(--color-yellow-light);
}
.ie-menu-option-focus:hover:not(:disabled),
.ie-menu-option-askMore:hover:not(:disabled) {
  background: rgba(234, 179, 8, 0.26);
  color: #fff;
  box-shadow: -1px 1px 4px var(--shadow-yellow);
}
.ie-menu-option-focus:active:not(:disabled),
.ie-menu-option-askMore:active:not(:disabled) {
  border-top: 2px solid var(--color-yellow-light);
  border-right: 2px solid var(--color-yellow-light);
  border-bottom: 2px solid var(--color-yellow-dark);
  border-left: 2px solid var(--color-yellow-dark);
  box-shadow: 0 0 2px inset rgba(0, 0, 0, 0.5);
}
.ie-menu-option-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ---- Chest overlay (centered panel, gold accent) ---- */
.ie-chest-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}
.ie-chest-panel {
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 32rem;
  padding: 1rem 1.15rem;
  background:
    radial-gradient(ellipse at 87.5% 12.5%, rgba(234, 179, 8, 0.08) 0%, rgba(0, 0, 0, 0) 70%),
    rgba(28, 28, 33, 0.97);
  border: 1px solid var(--color-board-light);
  border-top: 2px solid var(--color-yellow);
  border-radius: 0.6rem;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(5px);
  overflow: hidden;
}
.ie-chest-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.ie-chest-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-yellow);
  text-shadow: 0.5px 0.5px 0 rgba(8, 63, 234, 0.5); /* cobalt-violet complement of ochre */
}
.ie-chest-columns {
  display: flex;
  gap: 1rem;
}
.ie-chest-col {
  flex: 1;
  min-width: 0;
}
.ie-chest-col-label {
  margin-bottom: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}
.ie-chest-list {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  max-height: 12rem;
  overflow-y: auto;
}
.ie-chest-list::-webkit-scrollbar { width: 4px; }
.ie-chest-list::-webkit-scrollbar-track { background: transparent; }
.ie-chest-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 2px; }
.ie-chest-empty {
  font-family: var(--font-body);
  font-size: 0.62rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.35);
}
.ie-chest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.28rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-board-light);
  font-size: 0.74rem;
}
.ie-chest-item-name {
  color: rgba(255, 255, 255, 0.82);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ie-chest-item-qty {
  font-family: var(--font-mono);
  color: rgba(255, 255, 255, 0.45);
}
.ie-chest-xfer {
  flex: 0 0 auto;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 0.25rem;
  background: rgba(234, 179, 8, 0.14);
  border-top: 1px solid var(--color-yellow-dark);
  border-right: 1px solid var(--color-yellow-dark);
  border-bottom: 1px solid var(--color-yellow-light);
  border-left: 1px solid var(--color-yellow-light);
  color: var(--color-yellow-light);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ie-chest-xfer:hover:not(:disabled) {
  background: rgba(234, 179, 8, 0.28);
  color: #fff;
}
.ie-chest-xfer:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ---- Toolbar / control bar ---- */
/* Salvo D · THE-TOOLBAR-HALVED. 120px -> 60px: the band was spending a large share of the viewport
   without providing proportional functionality. Width now comes from the SHARED --ie-stage-w token
   (declared on .ie-game-root) so Salvo E can make the stage responsive by changing ONE value —
   D and E must never grow two independent width sources. */
.ie-toolbar {
  /* The Talk/Exit controls were present but PAINTED UNDER neighbouring elements — a stacking issue,
     not a missing button (it is why an agent tile-sweep never surfaced Talk). Own the stacking. */
  display: flex;
  flex-direction: column;   /* the wing is tall and narrow — stack, do not band */
  gap: 0.35rem;
  width: 100%;
  height: auto;
  background:
    radial-gradient(ellipse at 87.5% 12.5%, rgba(59, 130, 246, 0.05) 0%, rgba(0, 0, 0, 0) 75%),
    var(--color-board-surface);
  border: 1px solid var(--color-board-light);
  border-top: none;
}
.ie-toolbar-info {
  width: 100%;
  flex: 0 0 auto;
  padding: 0.35rem 0.55rem;
  /* NO plate — the corner readout floats bare over the canvas; a boxed background read as a panel
     cutting into the world view. Text-shadow keeps the readout legible over pale wall tiles. */
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.05rem;
  overflow: hidden;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 6px rgba(0, 0, 0, 0.6);
}
.ie-toolbar-title {
  font-family: var(--font-heading);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-yellow);
  text-shadow: 0.5px 0.5px 0 rgba(8, 63, 234, 0.4);
}
.ie-toolbar-meta {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.55);
}
.ie-toolbar-meta-dim { color: rgba(255, 255, 255, 0.38); }
.ie-focus-chip {
  margin-top: 0.2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  align-self: flex-start;
  padding: 0.08rem 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #40e0d0;
  background: rgba(64, 224, 208, 0.1);
  border: 1px solid rgba(64, 224, 208, 0.55);
  border-radius: 0.2rem;
  box-shadow: 0 0 6px rgba(64, 224, 208, 0.25);
  animation: ie-focus-chip-in 0.16s ease-out;
}
@keyframes ie-focus-chip-in { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: none; } }
.ie-focus-chip-caret { opacity: 0.8; }
.ie-footer-alert {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.5rem;
  border-right: 1px solid var(--color-board-light);
  overflow-x: auto;
}
.ie-alert-chip {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.45rem;
  border-radius: 0.2rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}
.ie-alert-chip .ie-alert-glyph { font-weight: 700; }
/* Urgent: a held gate on a clock — it pulses until answered. */
.ie-alert-chip.is-approval {
  color: #fca5a5;
  background: rgba(220, 38, 38, 0.16);
  border: 1px solid rgba(220, 38, 38, 0.65);
  animation: ie-alert-pulse 1.15s ease-in-out infinite;
}
@keyframes ie-alert-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(220, 38, 38, 0); }
  50% { box-shadow: 0 0 8px rgba(220, 38, 38, 0.55); }
}
/* Working: informational only — reports, never demands. */
.ie-alert-chip.is-working {
  color: var(--color-cobalt-light);
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.5);
}
.ie-toolbar-title, .ie-toolbar-meta, .ie-toolbar-help { line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ie-toolbar-help {
  font-family: var(--font-mono);
  font-size: 0.56rem;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.35);
}
.ie-toolbar-actions {
  flex: 1 1 auto;
  flex-wrap: nowrap;
  min-width: 0;
  padding: 0.35rem 0.5rem;
  display: flex;
  flex-wrap: nowrap;          /* Salvo D · one row — wrapping is what forced the 120px height */
  align-items: center;
  gap: 0.35rem;
  overflow-x: auto;
  overflow-y: hidden;
  border-right: 1px solid var(--color-board-light);
}
.ie-toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.6rem;
  font-family: var(--font-heading);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 0.3rem;
  background: var(--color-board-elevated);
  border-top: 2px solid var(--color-base-dark);
  border-right: 2px solid var(--color-base-dark);
  border-bottom: 2px solid var(--color-base-light);
  border-left: 2px solid var(--color-base-light);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: -2px 2px 6px var(--shadow-base);
}
.ie-toolbar-btn:hover:not(:disabled) {
  color: #fff;
  box-shadow: -1px 1px 4px var(--shadow-base);
}
.ie-toolbar-btn:active:not(:disabled) {
  border-top: 2px solid var(--color-base-light);
  border-right: 2px solid var(--color-base-light);
  border-bottom: 2px solid var(--color-base-dark);
  border-left: 2px solid var(--color-base-dark);
  box-shadow: 0 0 2px inset rgba(0, 0, 0, 0.5);
}
.ie-toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.ie-toolbar-btn-accent {
  border-top-color: var(--color-cobalt-dark);
  border-right-color: var(--color-cobalt-dark);
  border-bottom-color: var(--color-cobalt-light);
  border-left-color: var(--color-cobalt-light);
  color: var(--color-cobalt-light);
  box-shadow: -2px 2px 6px var(--shadow-cobalt);
}
.ie-toolbar-btn-accent:hover:not(:disabled) {
  color: #fff;
  box-shadow: -1px 1px 4px var(--shadow-cobalt);
}
.ie-toolbar-btn-gold {
  border-top-color: var(--color-yellow-dark);
  border-right-color: var(--color-yellow-dark);
  border-bottom-color: var(--color-yellow-light);
  border-left-color: var(--color-yellow-light);
  color: var(--color-yellow-light);
  box-shadow: -2px 2px 6px var(--shadow-yellow);
}
.ie-toolbar-btn-gold:hover:not(:disabled) {
  color: #fff;
  box-shadow: -1px 1px 4px var(--shadow-yellow);
}
.ie-kbd {
  display: inline-block;
  padding: 0 0.28rem;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  border-radius: 0.2rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-board-light);
  color: rgba(255, 255, 255, 0.55);
}
.ie-toolbar-inv {
  width: 100%;
  flex: 0 0 auto;
  padding: 0 0.25rem;
  border-right: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.15rem;
  overflow: hidden;
  border-right: 1px solid var(--color-board-light);
}
.ie-inv-label {
  margin-bottom: 0;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}
.ie-inv-empty {
  font-family: var(--font-body);
  font-size: 0.62rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.35);
}
.ie-inv-grid {
  display: flex;              /* Salvo D · a scrollable strip fits the halved band; the 2-col grid did not */
  gap: 0.2rem;
  overflow-x: auto;
  overflow-y: hidden;
}
.ie-inv-grid .ie-inv-slot { flex: 0 0 auto; }
.ie-inv-slot {
  display: flex;
  justify-content: space-between;
  gap: 0.25rem;
  padding: 0.1rem 0.35rem;
  border-radius: 0.22rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-board-light);
  font-size: 0.62rem;
}
.ie-inv-slot-name {
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ie-inv-slot-qty {
  font-family: var(--font-mono);
  color: rgba(255, 255, 255, 0.45);
}
.ie-toolbar-result {
  width: 10rem;
  flex: 0 0 auto;
  padding: 0.5rem;
  display: flex;
  align-items: center;
}
.ie-result-msg {
  margin: 0;
  font-size: 0.62rem;
  line-height: 1.3;
}
.ie-result-idle {
  margin: 0;
  font-size: 0.62rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.35);
}
.ie-result-success {
  color: var(--color-green-light);
  text-shadow: 0.5px 0.5px 0 rgba(197, 34, 137, 0.35); /* magenta complement of viridian */
}
.ie-result-fail {
  color: var(--color-red-light);
  text-shadow: 0.5px 0.5px 0 rgba(68, 239, 239, 0.35); /* cyan complement of maroon */
}

/* ---- Session presence: status dot + Summon/Focus chrome (Pewter) ---- */
.ie-session-status-dot { position: absolute; right: -1px; bottom: -1px; width: 0.62rem; height: 0.62rem; border-radius: 50%; border: 2px solid var(--color-board-dark); background: rgba(255,255,255,0.22); transition: background 0.25s ease, box-shadow 0.25s ease; }
.ie-session-status-dot.is-online { background: var(--color-green-light); box-shadow: 0 0 6px var(--color-green-light); animation: ie-session-pulse 1.6s ease-in-out infinite; }
.ie-session-status-dot.is-offline { background: rgba(255,255,255,0.22); box-shadow: none; animation: none; }
@keyframes ie-session-pulse { 0%,100% { opacity:0.7; box-shadow:0 0 4px var(--color-green-light);} 50% { opacity:1; box-shadow:0 0 9px var(--color-green-light);} }
.ie-dialog-panel.is-offline { border-top-color: var(--color-board-light); }
.ie-dialog-options.is-dormant .ie-menu-option-btn { filter: saturate(0.3) brightness(0.9); opacity: 0.55; box-shadow: none; pointer-events: none; }
.ie-dialog-header-actions { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; }
.ie-session-btn { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 0.3rem; height: 1.5rem; padding: 0 0.55rem; border-radius: 0.25rem; font-family: var(--font-heading); font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
.ie-session-btn.is-summon { background: rgba(234,179,8,0.14); border-top: 2px solid var(--color-yellow-dark); border-right: 2px solid var(--color-yellow-dark); border-bottom: 2px solid var(--color-yellow-light); border-left: 2px solid var(--color-yellow-light); color: var(--color-yellow-light); box-shadow: -2px 2px 6px var(--shadow-yellow); animation: ie-summon-beckon 2.4s ease-in-out infinite; }
.ie-session-btn.is-summon:hover { background: rgba(234,179,8,0.26); color: #fff; }
.ie-session-btn.is-summon:active { border-top: 2px solid var(--color-yellow-light); border-left: 2px solid var(--color-yellow-light); border-bottom: 2px solid var(--color-yellow-dark); border-right: 2px solid var(--color-yellow-dark); animation: none; }
@keyframes ie-summon-beckon { 0%,100% { box-shadow: -2px 2px 6px var(--shadow-yellow);} 50% { box-shadow: -2px 2px 10px var(--shadow-yellow), 0 0 6px rgba(234,179,8,0.5);} }
.ie-session-btn.is-focus { background: rgba(59,130,246,0.10); border-top: 2px solid var(--color-cobalt-dark); border-right: 2px solid var(--color-cobalt-dark); border-bottom: 2px solid var(--color-cobalt-light); border-left: 2px solid var(--color-cobalt-light); color: var(--color-cobalt-light); box-shadow: -2px 2px 6px var(--shadow-cobalt); }
.ie-session-btn.is-focus:hover { background: rgba(59,130,246,0.22); color: #fff; }
.ie-session-btn.is-focus:active { border-top: 2px solid var(--color-cobalt-light); border-left: 2px solid var(--color-cobalt-light); border-bottom: 2px solid var(--color-cobalt-dark); border-right: 2px solid var(--color-cobalt-dark); }
</style>
