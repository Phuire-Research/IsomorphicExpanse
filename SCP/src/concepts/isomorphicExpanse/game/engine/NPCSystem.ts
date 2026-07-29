import type { GameState, Tile, Position, NPCState, NPCScheduleEntry, TimeOfDay, Entity, Inventory, InventorySlot } from './types'
import { EntityType } from './types'
import { NPCS } from './data/npcs'

interface PathNode {
  pos: Position;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

function posKey(p: Position): string {
  return `${p.x},${p.y}`;
}

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getTileAt(tiles: Tile[][], pos: Position, originX = 0, originY = 0): Tile | null {
  const row = tiles[pos.y - originY];
  if (row) {
    const tile = row[pos.x - originX];
    if (tile) {
      return tile;
    }
  }
  return null;
}

function getNeighbors(pos: Position, mapWidth: number, mapHeight: number, originX = 0, originY = 0): Position[] {
  const result: Position[] = [];
  if (pos.x > originX) result.push({ x: pos.x - 1, y: pos.y });
  if (pos.x < originX + mapWidth - 1) result.push({ x: pos.x + 1, y: pos.y });
  if (pos.y > originY) result.push({ x: pos.x, y: pos.y - 1 });
  if (pos.y < originY + mapHeight - 1) result.push({ x: pos.x, y: pos.y + 1 });
  return result;
}

function isPositionOccupied(state: GameState, pos: Position): boolean {
  if (state.player.entity.position.x === pos.x && state.player.entity.position.y === pos.y) {
    return true;
  }
  for (const entity of state.entities.values()) {
    if (entity.position.x === pos.x && entity.position.y === pos.y) {
      return true;
    }
  }
  return false;
}

function createEmptyInventory(): Inventory {
  const slots: InventorySlot[] = [];
  for (let i = 0; i < 6; i++) {
    slots.push({ item: null, quantity: 0 });
  }
  return { slots, maxSlots: 6 };
}

export function findPath(
  tiles: Tile[][],
  from: Position,
  to: Position,
  mapWidth: number,
  mapHeight: number,
  originX = 0,
  originY = 0
): Position[] {
  if (from.x === to.x && from.y === to.y) {
    return [];
  }

  const targetTile = getTileAt(tiles, to, originX, originY);
  if (!targetTile || !targetTile.walkable) {
    return [];
  }

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    pos: from,
    g: 0,
    h: manhattan(from, to),
    f: manhattan(from, to),
    parent: null,
  };
  openSet.push(startNode);

  let iterations = 0;
  const MAX_ITERATIONS = 1000;

  while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;

    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i]!.f < openSet[lowestIdx]!.f) {
        lowestIdx = i;
      }
    }

    const current = openSet[lowestIdx]!;
    openSet.splice(lowestIdx, 1);

    if (current.pos.x === to.x && current.pos.y === to.y) {
      const path: Position[] = [];
      let node: PathNode | null = current;
      while (node !== null) {
        path.push(node.pos);
        node = node.parent;
      }
      path.reverse();
      path.shift();
      return path;
    }

    const key = posKey(current.pos);
    if (closedSet.has(key)) {
      continue;
    }
    closedSet.add(key);

    const neighbors = getNeighbors(current.pos, mapWidth, mapHeight, originX, originY);
    for (const neighborPos of neighbors) {
      const nKey = posKey(neighborPos);
      if (closedSet.has(nKey)) {
        continue;
      }

      const tile = getTileAt(tiles, neighborPos, originX, originY);
      if (!tile || !tile.walkable) {
        continue;
      }

      const g = current.g + 1;
      const h = manhattan(neighborPos, to);
      const f = g + h;

      const existingIdx = openSet.findIndex(n => n.pos.x === neighborPos.x && n.pos.y === neighborPos.y);
      if (existingIdx !== -1) {
        if (g < openSet[existingIdx]!.g) {
          openSet[existingIdx] = { pos: neighborPos, g, h, f, parent: current };
        }
        continue;
      }

      openSet.push({ pos: neighborPos, g, h, f, parent: current });
    }
  }

  return [];
}

export function moveNPCAlongPath(npc: NPCState, path: Position[]): void {
  if (path.length === 0) {
    return;
  }
  const next = path.shift();
  if (next) {
    npc.entity.position = next;
  }
}

export function getCurrentScheduleEntry(npc: NPCState, timeOfDay: TimeOfDay): NPCScheduleEntry | null {
  for (const entry of npc.schedule) {
    if (entry.time === timeOfDay) {
      return entry;
    }
  }
  return null;
}

export function executeNPCSchedule(
  state: GameState,
  tiles: Tile[][],
  mapWidth: number,
  mapHeight: number,
  originX = 0,
  originY = 0
): void {
  for (const npc of state.npcs.values()) {
    const entry = getCurrentScheduleEntry(npc, state.clock.timeOfDay);
    if (!entry) {
      continue;
    }

    if (entry.instruction === 'rest' || entry.instruction === 'wait' || entry.instruction === 'meditate' || entry.instruction === 'camp') {
      continue;
    }

    if (entry.instruction === 'wander') {
      const adjacent = getNeighbors(npc.entity.position, mapWidth, mapHeight, originX, originY);
      const walkable = adjacent.filter(p => {
        const tile = getTileAt(tiles, p, originX, originY);
        return tile !== null && tile.walkable;
      });
      if (walkable.length > 0) {
        const idx = Math.floor(Math.random() * walkable.length);
        const target = walkable[idx];
        if (target) {
          npc.entity.position = target;
        }
      }
      continue;
    }

    if (typeof entry.location === 'object' && 'x' in entry.location && 'y' in entry.location) {
      const target = entry.location as Position;
      if (npc.entity.position.x === target.x && npc.entity.position.y === target.y) {
        continue;
      }
      const path = findPath(tiles, npc.entity.position, target, mapWidth, mapHeight, originX, originY);
      moveNPCAlongPath(npc, path);
      continue;
    }

    const locationStr = entry.location as string;
    const targetTile = findNearestTileOfType(tiles, npc.entity.position, locationStr, mapWidth, mapHeight, originX, originY);
    if (targetTile) {
      if (npc.entity.position.x === targetTile.x && npc.entity.position.y === targetTile.y) {
        continue;
      }
      const path = findPath(tiles, npc.entity.position, targetTile, mapWidth, mapHeight, originX, originY);
      moveNPCAlongPath(npc, path);
    }
  }
}

function findNearestTileOfType(
  tiles: Tile[][],
  from: Position,
  tileTypeName: string,
  mapWidth: number,
  mapHeight: number,
  originX = 0,
  originY = 0
): Position | null {
  let nearest: Position | null = null;
  let nearestDist = Infinity;

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const wx = originX + x;
      const wy = originY + y;
      const tile = getTileAt(tiles, { x: wx, y: wy }, originX, originY);
      if (tile && tile.type === tileTypeName && tile.walkable) {
        const dist = manhattan(from, { x: wx, y: wy });
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = { x: wx, y: wy };
        }
      }
    }
  }

  return nearest;
}

export function spawnNPCs(
  state: GameState,
  tiles: Tile[][],
  mapWidth: number,
  mapHeight: number,
  playerSpawn: Position,
  originX = 0,
  originY = 0
): void {
  for (const def of Object.values(NPCS)) {
    if (state.npcs.has(def.id)) {
      continue;
    }

    const spawnPos = findSpawnPosition(state, tiles, def.spawnBias, mapWidth, mapHeight, playerSpawn, originX, originY);
    if (!spawnPos) {
      continue;
    }

    const entity: Entity = {
      id: def.id,
      type: EntityType.NPC,
      name: def.name,
      position: spawnPos,
    };

    const npcState: NPCState = {
      entity,
      homeRoomId: 'overworld',
      profession: def.profession,
      personality: { ...def.personality },
      inventory: createEmptyInventory(),
      friendship: { current: 0, max: 100 },
      schedule: def.schedule.map(s => ({ ...s })),
      dialogTreeId: def.dialog,
      tradeOffers: def.tradeOffers.map(t => ({ ...t, price: { ...t.price } })),
    };

    state.npcs.set(def.id, npcState);
    state.entities.set(def.id, entity);
  }
}

function findSpawnPosition(
  state: GameState,
  tiles: Tile[][],
  spawnBias: string,
  mapWidth: number,
  mapHeight: number,
  playerSpawn: Position,
  originX = 0,
  originY = 0
): Position | null {
  const maxSearchRadius = 20;
  for (let radius = 1; radius <= maxSearchRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
          continue;
        }
        const x = playerSpawn.x + dx;
        const y = playerSpawn.y + dy;
        if (x < originX || x >= originX + mapWidth || y < originY || y >= originY + mapHeight) {
          continue;
        }
        const tile = getTileAt(tiles, { x, y }, originX, originY);
        if (tile && tile.type === spawnBias && tile.walkable && !isPositionOccupied(state, { x, y })) {
          return { x, y };
        }
      }
    }
  }

  const fallbackRadius = 15;
  for (let radius = 1; radius <= fallbackRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
          continue;
        }
        const x = playerSpawn.x + dx;
        const y = playerSpawn.y + dy;
        if (x < originX || x >= originX + mapWidth || y < originY || y >= originY + mapHeight) {
          continue;
        }
        const tile = getTileAt(tiles, { x, y }, originX, originY);
        if (tile && tile.walkable && !isPositionOccupied(state, { x, y })) {
          return { x, y };
        }
      }
    }
  }

  return null;
}
