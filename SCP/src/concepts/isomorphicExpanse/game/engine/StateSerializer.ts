import type {
  GameState, Action, Position,
  Tile, Entity, Chunk, ChunkCoord, Biome,
  NPCState, AnimalState, Inventory,
  PlayerState, WorldState, GameClock, TurnResult,
  RecipeDefinition, GameStats, SkillState,
  PersonalSpaceRoom, GameContext, RoomTileType, RegrowEntry,
} from './types'
import { ActionType, Direction, Age } from './types'
import { getAvailableRecipes } from './data/recipes'
import { worldToChunk, worldToLocal, chunkKey } from './WorldGenerator'

const DEFAULT_FOV_RADIUS = 5;
const SAVE_KEY_PREFIX = 'stick-to-rocket-save-';

interface AgentInventoryItem {
  id: string;
  qty: number;
}

interface AgentPlayerState {
  position: Position;
  inventory: AgentInventoryItem[];
  inventory_slots: { used: number; max: number };
  hunger: number;
  stamina: number;
  health: number;
  equipped_clothing: string | null;
}

interface AgentClockState {
  day: number;
  season: string;
  weather: string;
  time_of_day: string;
}

interface AgentVisibleTile {
  x: number;
  y: number;
  type: string;
  resource: string | null;
  walkable: boolean;
}

interface AgentEntityState {
  id: string;
  type: string;
  name: string;
  position: Position;
}

interface AgentCraftState {
  id: string;
  name: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
}

interface AgentLastActionResult {
  success: boolean;
  message: string;
}

interface AgentStatePayload {
  turn: number;
  clock: AgentClockState;
  age: string;
  player: AgentPlayerState;
  visible_tiles: AgentVisibleTile[];
  nearby_entities: AgentEntityState[];
  available_crafts: AgentCraftState[];
  active_goals: string[];
  last_action_result: AgentLastActionResult | null;
  temperature: number;
}

function getInventoryAsRecord(inventory: Inventory): Record<string, number> {
  const record: Record<string, number> = {};
  for (const slot of inventory.slots) {
    if (slot.item) {
      record[slot.item.id] = (record[slot.item.id] ?? 0) + slot.quantity;
    }
  }
  return record;
}

function getVisibleTiles(state: GameState, radius: number): Tile[] {
  const tiles: Tile[] = [];
  const playerPos = state.player.entity.position;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const wx = playerPos.x + dx;
      const wy = playerPos.y + dy;
      const { cx, cy } = worldToChunk(wx, wy);
      const key = chunkKey(cx, cy);
      const chunk = state.world.chunks.get(key);
      if (!chunk) continue;
      const local = worldToLocal(wx, wy);
      const row = chunk.tiles[local.y];
      if (row) {
        const tile = row[local.x];
        if (tile) {
          tiles.push(tile);
        }
      }
    }
  }

  return tiles;
}

function getNearbyEntities(state: GameState, radius: number): Entity[] {
  const entities: Entity[] = [];
  const playerPos = state.player.entity.position;

  for (const entity of state.entities.values()) {
    const dx = Math.abs(entity.position.x - playerPos.x);
    const dy = Math.abs(entity.position.y - playerPos.y);
    if (dx <= radius && dy <= radius) {
      entities.push(entity);
    }
  }

  return entities;
}

export function serializeForAgent(state: GameState): string {
  const inventoryRecord = getInventoryAsRecord(state.player.inventory);
  const available = getAvailableRecipes(state.currentAge, inventoryRecord, state.discoveredTechs);
  const visible = getVisibleTiles(state, DEFAULT_FOV_RADIUS);
  const nearby = getNearbyEntities(state, DEFAULT_FOV_RADIUS);

  let usedSlots = 0;
  for (const slot of state.player.inventory.slots) {
    if (slot.item) {
      usedSlots++;
    }
  }

  const inventoryItems: AgentInventoryItem[] = [];
  for (const [id, qty] of Object.entries(inventoryRecord)) {
    inventoryItems.push({ id, qty });
  }

  const agentState: AgentStatePayload = {
    turn: state.clock.turn,
    clock: {
      day: state.clock.day,
      season: state.clock.season,
      weather: state.clock.weather,
      time_of_day: state.clock.timeOfDay,
    },
    age: state.currentAge,
    player: {
      position: { x: state.player.entity.position.x, y: state.player.entity.position.y },
      inventory: inventoryItems,
      inventory_slots: { used: usedSlots, max: state.player.inventory.maxSlots },
      hunger: state.player.hunger,
      stamina: state.player.stamina,
      health: state.player.health,
      equipped_clothing: state.player.equippedClothing ?? null,
    },
    visible_tiles: visible.map(t => ({
      x: t.position.x,
      y: t.position.y,
      type: t.type,
      resource: t.resource,
      walkable: t.walkable,
    })),
    nearby_entities: nearby.map(e => ({
      id: e.id,
      type: e.type,
      name: e.name,
      position: { x: e.position.x, y: e.position.y },
    })),
    available_crafts: available.map((r: RecipeDefinition) => ({
      id: r.id,
      name: r.name,
      inputs: r.inputs,
      outputs: r.outputs,
    })),
    active_goals: [],
    last_action_result: state.lastActionResult
      ? { success: state.lastActionResult.success, message: state.lastActionResult.message }
      : null,
    temperature: state.temperature,
  };

  return JSON.stringify(agentState, null, 2);
}

const VALID_DIRECTIONS = new Set<string>(Object.values(Direction));
const VALID_ACTIONS = new Set<string>(Object.values(ActionType));

function isValidPosition(val: unknown): val is Position {
  if (typeof val !== 'object' || val === null) return false;
  const obj = val as Record<string, unknown>;
  return typeof obj['x'] === 'number' && typeof obj['y'] === 'number';
}

function extractJsonBlock(text: string): string | null {
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) {
        start = i;
      }
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.substring(start, i + 1);
      }
    }
  }

  return null;
}

export function parseAgentAction(response: string): Action {
  const jsonBlock = extractJsonBlock(response);
  if (!jsonBlock) {
    return { action: ActionType.Wait };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonBlock) as Record<string, unknown>;
  } catch {
    return { action: ActionType.Wait };
  }

  const actionStr = parsed['action'];
  if (typeof actionStr !== 'string' || !VALID_ACTIONS.has(actionStr)) {
    return { action: ActionType.Wait };
  }

  switch (actionStr) {
    case ActionType.Move: {
      const dir = parsed['direction'];
      if (typeof dir === 'string' && VALID_DIRECTIONS.has(dir)) {
        return { action: ActionType.Move, direction: dir as Direction };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Gather: {
      const target = parsed['target'];
      if (isValidPosition(target)) {
        return { action: ActionType.Gather, target: { x: target.x, y: target.y } };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Craft: {
      const recipe = parsed['recipe'];
      if (typeof recipe === 'string') {
        return { action: ActionType.Craft, recipe };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Plant: {
      const crop = parsed['crop'];
      const target = parsed['target'];
      if (typeof crop === 'string' && isValidPosition(target)) {
        return { action: ActionType.Plant, crop, target: { x: target.x, y: target.y } };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Harvest: {
      const target = parsed['target'];
      if (isValidPosition(target)) {
        return { action: ActionType.Harvest, target: { x: target.x, y: target.y } };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Interact: {
      const target = parsed['target'];
      const option = parsed['option'];
      if (typeof target === 'string' && typeof option === 'string') {
        return { action: ActionType.Interact, target, option };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Trade: {
      const offer = parsed['offer'];
      const request = parsed['request'];
      if (
        typeof offer === 'object' && offer !== null &&
        typeof request === 'object' && request !== null
      ) {
        return {
          action: ActionType.Trade,
          offer: offer as Record<string, number>,
          request: request as Record<string, number>,
        };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Tame: {
      const target = parsed['target'];
      const item = parsed['item'];
      if (isValidPosition(target) && typeof item === 'string') {
        return { action: ActionType.Tame, target: { x: target.x, y: target.y }, item };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Use: {
      const item = parsed['item'];
      const target = parsed['target'];
      if (typeof item === 'string' && isValidPosition(target)) {
        return { action: ActionType.Use, item, target: { x: target.x, y: target.y } };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Eat: {
      const item = parsed['item'];
      if (typeof item === 'string') {
        return { action: ActionType.Eat, item };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Place: {
      const item = parsed['item'];
      const target = parsed['target'];
      if (typeof item === 'string' && isValidPosition(target)) {
        return { action: ActionType.Place, item, target: { x: target.x, y: target.y } };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Mount: {
      const target = parsed['target'];
      if (typeof target === 'string') {
        return { action: ActionType.Mount, target };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Dismount:
      return { action: ActionType.Dismount };

    case ActionType.Research: {
      const recipeId = parsed['recipeId'];
      if (typeof recipeId === 'string') {
        return { action: ActionType.Research, recipeId };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Wait:
      return { action: ActionType.Wait };

    case ActionType.Launch:
      return { action: ActionType.Launch };

    case ActionType.EnterPersonalSpace:
      return { action: ActionType.EnterPersonalSpace };

    case ActionType.ExitPersonalSpace:
      return { action: ActionType.ExitPersonalSpace };

    case ActionType.PlaceFurniture: {
      const furnitureType = parsed['furnitureType'];
      const target = parsed['target'];
      if (typeof furnitureType === 'string' && isValidPosition(target)) {
        return { action: ActionType.PlaceFurniture, furnitureType, target: { x: target.x, y: target.y } };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.OpenChest: {
      const chestId = parsed['chestId'];
      if (typeof chestId === 'string') {
        return { action: ActionType.OpenChest, chestId };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.TransferToChest: {
      const chestId = parsed['chestId'];
      const itemId = parsed['itemId'];
      const quantity = parsed['quantity'];
      if (typeof chestId === 'string' && typeof itemId === 'string' && typeof quantity === 'number') {
        return { action: ActionType.TransferToChest, chestId, itemId, quantity };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.TransferFromChest: {
      const chestId = parsed['chestId'];
      const itemId = parsed['itemId'];
      const quantity = parsed['quantity'];
      if (typeof chestId === 'string' && typeof itemId === 'string' && typeof quantity === 'number') {
        return { action: ActionType.TransferFromChest, chestId, itemId, quantity };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Equip: {
      const itemId = parsed['itemId'];
      if (typeof itemId === 'string') {
        return { action: ActionType.Equip, itemId };
      }
      return { action: ActionType.Wait };
    }

    case ActionType.Descend:
      return { action: ActionType.Descend };

    case ActionType.Ascend:
      return { action: ActionType.Ascend };

    default:
      return { action: ActionType.Wait };
  }
}

type SerializedChunk = {
  coord: ChunkCoord;
  tiles: Tile[][];
  generated: boolean;
  biome?: Biome;
  hasVillage?: boolean;
};

type SerializedGameState = {
  player: PlayerState;
  world: {
    chunks: [string, SerializedChunk][];
    seed: number;
  };
  clock: GameClock;
  entities: [string, Entity][];
  npcs: [string, NPCState][];
  animals: [string, AnimalState][];
  currentAge: Age;
  unlockedRecipes?: string[];
  lastActionResult: TurnResult | null;
  gameWon?: boolean;
  gameOver?: boolean;
  winMessage?: string;
  stats?: GameStats;
  visitedTiles?: string[];
  personalSpace?: PersonalSpaceRoom;
  personalSpaces?: [string, PersonalSpaceRoom][];
  currentPersonalSpaceId?: string;
  underground?: {
    chunks: [string, SerializedChunk][];
    discoveredChunks: string[];
  };
  gameContext?: GameContext;
  regrowQueue?: RegrowEntry[];
  undergroundRegrowQueue?: RegrowEntry[];
  discoveredTechs?: string[];
  temperature?: number;
};

export function serializeGameState(state: GameState): string {
  const serialized: SerializedGameState = {
    player: state.player,
    world: {
      chunks: Array.from(state.world.chunks.entries()),
      seed: state.world.seed,
    },
    clock: state.clock,
    entities: Array.from(state.entities.entries()),
    npcs: Array.from(state.npcs.entries()),
    animals: Array.from(state.animals.entries()),
    currentAge: state.currentAge,
    unlockedRecipes: state.unlockedRecipes,
    lastActionResult: state.lastActionResult,
    gameWon: state.gameWon,
    gameOver: state.gameOver,
    winMessage: state.winMessage,
    stats: state.stats,
    visitedTiles: state.visitedTiles,
    personalSpace: state.personalSpace,
    personalSpaces: Array.from(state.personalSpaces.entries()),
    currentPersonalSpaceId: state.currentPersonalSpaceId,
    underground: {
      chunks: Array.from(state.underground.chunks.entries()),
      discoveredChunks: Array.from(state.underground.discoveredChunks),
    },
    gameContext: state.gameContext,
    regrowQueue: state.regrowQueue,
    undergroundRegrowQueue: state.undergroundRegrowQueue,
    discoveredTechs: state.discoveredTechs,
    temperature: state.temperature,
  };

  return JSON.stringify(serialized);
}

export function deserializeGameState(json: string): GameState | null {
  let parsed: SerializedGameState;
  try {
    parsed = JSON.parse(json) as SerializedGameState;
  } catch {
    return null;
  }

  if (
    !parsed.player ||
    !parsed.world ||
    !parsed.clock ||
    !parsed.entities ||
    !parsed.npcs ||
    !parsed.animals ||
    typeof parsed.currentAge !== 'string'
  ) {
    return null;
  }

  const chunks = new Map<string, Chunk>();
  if (Array.isArray(parsed.world.chunks)) {
    for (const entry of parsed.world.chunks) {
      if (Array.isArray(entry) && entry.length === 2) {
        const [key, chunk] = entry as [string, SerializedChunk];
        chunks.set(key, {
          coord: chunk.coord,
          tiles: chunk.tiles,
          biome: chunk.biome ?? 'plains',
          generated: chunk.generated,
          hasVillage: chunk.hasVillage ?? false,
        });
      }
    }
  }

  const world: WorldState = {
    chunks,
    seed: parsed.world.seed,
  };

  const entities = new Map<string, Entity>();
  if (Array.isArray(parsed.entities)) {
    for (const entry of parsed.entities) {
      if (Array.isArray(entry) && entry.length === 2) {
        const [key, entity] = entry as [string, Entity];
        entities.set(key, entity);
      }
    }
  }

  const npcs = new Map<string, NPCState>();
  if (Array.isArray(parsed.npcs)) {
    for (const entry of parsed.npcs) {
      if (Array.isArray(entry) && entry.length === 2) {
        const [key, npc] = entry as [string, NPCState];
        npc.homeRoomId = npc.homeRoomId ?? 'overworld';
        npcs.set(key, npc);
      }
    }
  }

  const animals = new Map<string, AnimalState>();
  if (Array.isArray(parsed.animals)) {
    for (const entry of parsed.animals) {
      if (Array.isArray(entry) && entry.length === 2) {
        const [key, animal] = entry as [string, AnimalState];
        animals.set(key, animal);
      }
    }
  }

  const defaultStats: GameStats = {
    totalItemsCrafted: 0,
    totalTilesExplored: 0,
    totalTradesCompleted: 0,
    totalNPCsInteracted: [],
    totalAnimalsTamed: 0,
    totalCropsHarvested: 0,
    totalFoodEaten: 0,
    agesReached: [parsed.currentAge],
  };

  const playerData = parsed.player;
  if (playerData.inventory && playerData.inventory.slots.length < playerData.inventory.maxSlots) {
    while (playerData.inventory.slots.length < playerData.inventory.maxSlots) {
      playerData.inventory.slots.push({ item: null, quantity: 0 });
    }
  }

  const defaultSkills: SkillState = {
    gathering: { level: 1, xp: 0, xpToNext: 100 },
    crafting: { level: 1, xp: 0, xpToNext: 100 },
    tech: { level: 1, xp: 0, xpToNext: 100 },
  };
  if (!playerData.skills) {
    (playerData as PlayerState).skills = defaultSkills;
  }
  if (playerData.equippedClothing === undefined) {
    (playerData as PlayerState).equippedClothing = null;
  }
  if ((playerData as PlayerState).health === undefined) {
    (playerData as PlayerState).health = 100;
  }
  if ((playerData as PlayerState).maxHealth === undefined) {
    (playerData as PlayerState).maxHealth = 100;
  }
  if ((playerData as PlayerState).exhaustionTurns === undefined) {
    (playerData as PlayerState).exhaustionTurns = 0;
  }
  if ((playerData as PlayerState).starvationTurns === undefined) {
    (playerData as PlayerState).starvationTurns = 0;
  }
  if ((playerData as PlayerState).currentDepth === undefined) {
    (playerData as PlayerState).currentDepth = 0;
  }
  if ((playerData as PlayerState).lastSurfacePosition === undefined) {
    (playerData as PlayerState).lastSurfacePosition = null;
  }

  const undergroundChunks = new Map<string, Chunk>();
  if (parsed.underground && Array.isArray(parsed.underground.chunks)) {
    for (const entry of parsed.underground.chunks) {
      if (Array.isArray(entry) && entry.length === 2) {
        const [key, chunk] = entry as [string, SerializedChunk];
        undergroundChunks.set(key, {
          coord: chunk.coord,
          tiles: chunk.tiles,
          biome: chunk.biome ?? 'plains',
          generated: chunk.generated,
          hasVillage: chunk.hasVillage ?? false,
        });
      }
    }
  }
  const undergroundDiscovered = new Set<string>(
    parsed.underground && Array.isArray(parsed.underground.discoveredChunks)
      ? parsed.underground.discoveredChunks
      : []
  );

  const currentPersonalSpaceId = parsed.currentPersonalSpaceId ?? 'cave';
  let personalSpaceEntries: [string, PersonalSpaceRoom][];
  if (parsed.personalSpaces && Array.isArray(parsed.personalSpaces) && parsed.personalSpaces.length > 0) {
    personalSpaceEntries = parsed.personalSpaces.map(
      ([k, room]) => [k, { ...room, chests: room.chests ?? [] }] as [string, PersonalSpaceRoom]
    );
  } else {
    const legacyRoom = parsed.personalSpace
      ? ensureBottomlessChest({
          ...parsed.personalSpace,
          id: parsed.personalSpace.id ?? 'cave',
          name: parsed.personalSpace.name ?? 'The Cave',
          chests: parsed.personalSpace.chests ?? [],
        })
      : createDefaultRoom();
    personalSpaceEntries = [['cave', legacyRoom]];
  }
  const personalSpaces = new Map<string, PersonalSpaceRoom>(personalSpaceEntries);
  const personalSpace = personalSpaces.get(currentPersonalSpaceId) ?? personalSpaces.get('cave') ?? createDefaultRoom();

  return {
    player: playerData,
    world,
    clock: { ...parsed.clock, weather: parsed.clock.weather ?? 'clear' },
    entities,
    npcs,
    animals,
    crops: [],
    currentAge: parsed.currentAge,
    unlockedRecipes: parsed.unlockedRecipes ?? [],
    lastActionResult: parsed.lastActionResult,
    gameWon: parsed.gameWon ?? false,
    gameOver: parsed.gameOver ?? false,
    winMessage: parsed.winMessage ?? '',
    stats: parsed.stats ?? defaultStats,
    visitedTiles: parsed.visitedTiles ?? [],
    personalSpace,
    personalSpaces,
    currentPersonalSpaceId,
    underground: {
      chunks: undergroundChunks,
      discoveredChunks: undergroundDiscovered,
    },
    gameContext: parsed.gameContext ?? 'survival',
    regrowQueue: parsed.regrowQueue ?? [],
    undergroundRegrowQueue: parsed.undergroundRegrowQueue ?? [],
    discoveredTechs: parsed.discoveredTechs ?? [],
    temperature: parsed.temperature ?? 50,
  };
}

function ensureBottomlessChest(room: PersonalSpaceRoom): PersonalSpaceRoom {
  const hasBottomless = room.chests.some(c => c.id === 'bottomless_chest')
  if (!hasBottomless) {
    room.chests.push({
      id: 'bottomless_chest',
      roomPosition: { tileX: 8, tileY: 4 },
      capacity: 9999,
      slots: [],
    })
    const hasFurniture = room.furniture.some(f => f.id === 'bottomless_chest')
    if (!hasFurniture) {
      room.furniture.push({ id: 'bottomless_chest', tileX: 8, tileY: 4, type: 'chest' })
    }
  }
  return room
}

function createDefaultRoom(): PersonalSpaceRoom {
  const ROOM_W = 12
  const ROOM_H = 10
  const grid: RoomTileType[][] = []
  for (let y = 0; y < ROOM_H; y++) {
    const row: RoomTileType[] = []
    for (let x = 0; x < ROOM_W; x++) {
      if (y === 0 || y === ROOM_H - 1 || x === 0 || x === ROOM_W - 1) {
        row.push('wall')
      } else {
        row.push('floor_wood')
      }
    }
    grid.push(row)
  }
  return {
    id: 'cave',
    name: 'The Cave',
    grid,
    spawnX: 6,
    spawnY: 5,
    furniture: [
      { id: 'exit_portal_1', tileX: 6, tileY: 8, type: 'exit_portal' },
      { id: 'bottomless_chest', tileX: 8, tileY: 4, type: 'chest' },
    ],
    collectibleDisplays: [
      { tileX: 4, tileY: 4, itemId: null },
    ],
    chests: [{
      id: 'bottomless_chest',
      roomPosition: { tileX: 8, tileY: 4 },
      capacity: 9999,
      slots: [],
    }],
  }
}

export function saveToLocalStorage(state: GameState, slotName?: string): void {
  if (typeof window === 'undefined') return;
  const key = SAVE_KEY_PREFIX + (slotName ?? 'auto');
  localStorage.setItem(key, serializeGameState(state));
}

export function loadFromLocalStorage(slotName?: string): GameState | null {
  if (typeof window === 'undefined') return null;
  const key = SAVE_KEY_PREFIX + (slotName ?? 'auto');
  const json = localStorage.getItem(key);
  if (!json) return null;
  return deserializeGameState(json);
}

export function listSaveSlots(): string[] {
  if (typeof window === 'undefined') return [];
  const slots: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(SAVE_KEY_PREFIX)) {
      slots.push(key.substring(SAVE_KEY_PREFIX.length));
    }
  }
  return slots;
}
