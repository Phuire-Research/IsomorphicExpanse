export interface Position {
  x: number;
  y: number;
}

export enum TileType {
  Grass = 'grass',
  Forest = 'forest',
  Water = 'water',
  StoneDeposit = 'stone_deposit',
  OreVein = 'ore_vein',
  TilledSoil = 'tilled_soil',
  Sand = 'sand',
  Mountain = 'mountain',
  DeepDeposit = 'deep_deposit',
  Building = 'building',
  Path = 'path',
  BerryBush = 'berry_bush',
  CoalDeposit = 'coal_deposit',
  CaveFloor = 'cave_floor',
  CaveWall = 'cave_wall',
  StairsUp = 'stairs_up',
  UndergroundWater = 'underground_water',
  CaveMud = 'cave_mud',
}

export interface Tile {
  type: TileType;
  position: Position;
  resource: string | null;
  walkable: boolean;
  speedModifier: number;
  toolRequired: string | null;
  durability: number;
}

export enum Age {
  Gathering = 'gathering',
  Stone = 'stone',
  Wood = 'wood',
  Clay = 'clay',
  Copper = 'copper',
  Iron = 'iron',
  Steam = 'steam',
  Electric = 'electric',
  Chemical = 'chemical',
  Rocket = 'rocket',
}

export type ItemCategory = 'resource' | 'tool' | 'seed' | 'food' | 'component' | 'special';

export interface Item {
  id: string;
  name: string;
  stackable: boolean;
  maxStack: number;
  category: ItemCategory;
}

export interface ItemDefinition {
  id: string;
  name: string;
  stackable: boolean;
  maxStack: number;
  category: ItemCategory;
  tier: number;
  description: string;
  warmthBonus?: number;
}

export interface InventorySlot {
  item: Item | null;
  quantity: number;
}

export interface Inventory {
  slots: InventorySlot[];
  maxSlots: number;
}

export interface Recipe {
  id: string;
  name: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  requiredAge: Age;
  requiredStation: string | null;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  requiredAge: Age;
  requiredStation: string | null;
  tier: number;
  requiredTech?: string;
}

export enum EntityType {
  Player = 'player',
  NPC = 'npc',
  Animal = 'animal',
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  position: Position;
}

export interface SkillData {
  level: number;
  xp: number;
  xpToNext: number;
}

export interface SkillState {
  gathering: SkillData;
  crafting: SkillData;
  tech: SkillData;
}

export interface PlayerState {
  entity: Entity;
  inventory: Inventory;
  currentAge: Age;
  hunger: number;
  stamina: number;
  maxHunger: number;
  maxStamina: number;
  mounted: boolean;
  mountedAnimalId: string | null;
  lastSurvivalPosition: Position | null;
  skills: SkillState;
  equippedClothing: string | null;
  health: number;
  maxHealth: number;
  exhaustionTurns: number;
  starvationTurns: number;
  currentDepth: number;
  lastSurfacePosition: Position | null;
}

export interface NPCPersonality {
  friendliness: number;
  patience: number;
  curiosity: number;
}

export interface NPCScheduleEntry {
  time: string;
  instruction: string;
  location: string | Position;
  duration: number | undefined;
}

export interface NPCState {
  entity: Entity;
  homeRoomId: string;
  profession: string;
  personality: NPCPersonality;
  inventory: Inventory;
  friendship: {
    current: number;
    max: number;
  };
  schedule: NPCScheduleEntry[];
  dialogTreeId: string;
  tradeOffers: TradeOffer[];
}

export interface DialogOption {
  id: string;
  text: string;
  // 'toolApproval' (Stage 3.5) is the THIRD optioned surface — the SessionManager's Tool Approval
  // rows curried into the chat. It is NOT a Shatterite MenuOption kind and can never arrive from
  // menu.json (the relay parser coerces unknown kinds to 'scs' · H2); it is minted client-side only.
  kind?: 'scs' | 'focus' | 'askMore' | 'toolApproval';
  scsCommand?: string;
  // Stage 3.5 · THE-APPROVAL-ROW-CARRIES-ITS-DECISION. A toolApproval row resolves a LIVE held
  // Express response in the bridge, so it must round-trip a correlation id + the decision itself.
  // The chat-command fields (scsCommand/text) cannot carry this: sending them as a message would
  // post the button's label into the anchor's chat and leave the real gate to auto-deny at 595s.
  behavior?: 'allow' | 'deny';
  requestId?: string;
  persistRule?: boolean;
  nextNodeId?: string | null;            // demoted required→optional (dead since D4; no reader)
  requiredItem?: string;
  requiredFriendship?: number;
}

export interface DialogNode {
  id: string;
  speaker: string;
  text: string;
  options: DialogOption[];
}

export interface DialogTree {
  id: string;
  name: string;
  nodes: Record<string, DialogNode>;
  startNodeId: string;
}

export interface TradeOffer {
  itemId: string;
  quantity: number;
  price: Record<string, number>;
}

export interface NPCDefinition {
  id: string;
  name: string;
  profession: string;
  personality: NPCPersonality;
  schedule: NPCScheduleEntry[];
  dialog: string;
  tradeOffers: TradeOffer[];
  spawnBias: string;
  // BSCV · the brief-in-character prime the bridgeResponder frames the FIRST message to this NPC's
  // anchor with — establishes "reply briefly + in character in the chat; deep work in the terminal."
  // Per-NPC (expandable); optional (NPCs without a bound anchor need none).
  chatDirective?: string;
}

export interface AnimalState {
  entity: Entity;
  species: string;
  tameable: boolean;
  tameProgress: number;
  tamed: boolean;
  produces: string[];
  lastProduceTurn: number;
  tamedPosition: Position | null;
}

export interface AnimalDefinition {
  id: string;
  name: string;
  species: string;
  tameable: boolean;
  tameDifficulty: number;
  preferredFood: string;
  produces: { itemId: string; interval: number }[];
  spawnBiome: string;
  fleeDistance: number;
}

export enum ActionType {
  Move = 'move',
  Gather = 'gather',
  Craft = 'craft',
  Plant = 'plant',
  Harvest = 'harvest',
  Interact = 'interact',
  Trade = 'trade',
  Tame = 'tame',
  Use = 'use',
  Wait = 'wait',
  Eat = 'eat',
  Place = 'place',
  Mount = 'mount',
  Dismount = 'dismount',
  Research = 'research',
  Launch = 'launch',
  EnterPersonalSpace = 'enter_personal_space',
  ExitPersonalSpace = 'exit_personal_space',
  PlaceFurniture = 'place_furniture',
  PlaceCollectible = 'place_collectible',
  Fish = 'fish',
  OpenChest = 'open_chest',
  TransferToChest = 'transfer_to_chest',
  TransferFromChest = 'transfer_from_chest',
  Equip = 'equip',
  Descend = 'descend',
  Ascend = 'ascend',
  Prospect = 'prospect',
  Drop = 'drop',
}

export enum Direction {
  North = 'north',
  South = 'south',
  East = 'east',
  West = 'west',
  Northeast = 'northeast',
  Northwest = 'northwest',
  Southeast = 'southeast',
  Southwest = 'southwest',
}

export interface MoveAction {
  action: ActionType.Move;
  direction: Direction;
}

export interface GatherAction {
  action: ActionType.Gather;
  target: Position;
}

export interface CraftAction {
  action: ActionType.Craft;
  recipe: string;
}

export interface PlantAction {
  action: ActionType.Plant;
  crop: string;
  target: Position;
}

export interface HarvestAction {
  action: ActionType.Harvest;
  target: Position;
}

export interface InteractAction {
  action: ActionType.Interact;
  target: string;
  option: string;
}

export interface TradeAction {
  action: ActionType.Trade;
  offer: Record<string, number>;
  request: Record<string, number>;
}

export interface TameAction {
  action: ActionType.Tame;
  target: Position;
  item: string;
}

export interface UseAction {
  action: ActionType.Use;
  item: string;
  target: Position;
}

export interface WaitAction {
  action: ActionType.Wait;
}

export interface EatAction {
  action: ActionType.Eat;
  item: string;
}

export interface PlaceAction {
  action: ActionType.Place;
  item: string;
  target: Position;
}

export interface MountAction {
  action: ActionType.Mount;
  target: string;
}

export interface DismountAction {
  action: ActionType.Dismount;
}

export interface ResearchAction {
  action: ActionType.Research;
  recipeId: string;
}

export interface LaunchAction {
  action: ActionType.Launch;
}

export interface EnterPersonalSpaceAction {
  action: ActionType.EnterPersonalSpace;
}

export interface ExitPersonalSpaceAction {
  action: ActionType.ExitPersonalSpace;
}

export interface PlaceFurnitureAction {
  action: ActionType.PlaceFurniture;
  furnitureType: string;
  target: Position;
}

export interface PlaceCollectibleAction {
  action: ActionType.PlaceCollectible;
  itemId: string;
  target: Position;
}

export type Action =
  | MoveAction
  | GatherAction
  | CraftAction
  | PlantAction
  | HarvestAction
  | InteractAction
  | TradeAction
  | TameAction
  | UseAction
  | WaitAction
  | EatAction
  | PlaceAction
  | MountAction
  | DismountAction
  | ResearchAction
  | LaunchAction
  | EnterPersonalSpaceAction
  | ExitPersonalSpaceAction
  | PlaceFurnitureAction
  | PlaceCollectibleAction
  | FishAction
  | OpenChestAction
  | TransferToChestAction
  | TransferFromChestAction
  | EquipAction
  | DescendAction
  | AscendAction
  | ProspectAction
  | DropAction;

export interface FishAction {
  action: ActionType.Fish;
  target: Position;
}

export interface OpenChestAction {
  action: ActionType.OpenChest;
  chestId: string;
}

export interface TransferToChestAction {
  action: ActionType.TransferToChest;
  chestId: string;
  itemId: string;
  quantity: number;
}

export interface TransferFromChestAction {
  action: ActionType.TransferFromChest;
  chestId: string;
  itemId: string;
  quantity: number;
}

export interface EquipAction {
  action: ActionType.Equip;
  itemId: string;
}

export interface DescendAction {
  action: ActionType.Descend;
}

export interface AscendAction {
  action: ActionType.Ascend;
}

export interface ProspectAction {
  action: ActionType.Prospect;
}

export interface DropAction {
  action: ActionType.Drop;
  slotIndex: number;
  quantity: number;
}

export interface TurnResult {
  success: boolean;
  message: string;
  stateChanges: Partial<GameState>;
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type WeatherType = 'clear' | 'rain' | 'snow' | 'sandstorm' | 'fog' | 'wind';
export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export interface CropDefinition {
  id: string;
  name: string;
  seedItemId: string;
  harvestItemId: string;
  growthStages: number;
  turnsPerStage: number;
  minYield: number;
  maxYield: number;
  seasons: Season[];
  waterBonus: number;
  tier: number;
}

export interface CropState {
  cropId: string;
  position: Position;
  currentStage: number;
  turnsInStage: number;
  waterProximity: boolean;
  plantedTurn: number;
}

export interface GameClock {
  turn: number;
  day: number;
  season: Season;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
}

export type Biome = 'plains' | 'forest' | 'desert' | 'mountain' | 'swamp';

export interface ChunkCoord {
  cx: number;
  cy: number;
}

export interface Chunk {
  coord: ChunkCoord;
  tiles: Tile[][];
  biome: Biome;
  generated: boolean;
  hasVillage: boolean;
}

export interface WorldState {
  chunks: Map<string, Chunk>;
  seed: number;
}

export interface GameStats {
  totalItemsCrafted: number;
  totalTilesExplored: number;
  totalTradesCompleted: number;
  totalNPCsInteracted: string[];
  totalAnimalsTamed: number;
  totalCropsHarvested: number;
  totalFoodEaten: number;
  agesReached: string[];
}

export interface GameState {
  player: PlayerState;
  world: WorldState;
  clock: GameClock;
  entities: Map<string, Entity>;
  npcs: Map<string, NPCState>;
  animals: Map<string, AnimalState>;
  crops: CropState[];
  currentAge: Age;
  unlockedRecipes: string[];
  lastActionResult: TurnResult | null;
  gameWon: boolean;
  gameOver: boolean;
  winMessage: string;
  stats: GameStats;
  visitedTiles: string[];
  personalSpace: PersonalSpaceRoom;
  personalSpaces: Map<string, PersonalSpaceRoom>;
  currentPersonalSpaceId: string;
  underground: UndergroundState;
  gameContext: GameContext;
  regrowQueue: RegrowEntry[];
  undergroundRegrowQueue: RegrowEntry[];
  discoveredTechs: string[];
  temperature: number;
}

export interface RegrowEntry {
  x: number;
  y: number;
  resource: string;
  regrowTurn: number;
}

export type RoomTileType =
  | 'empty'
  | 'floor_wood'
  | 'floor_stone'
  | 'wall'
  | 'wall_brick'
  | 'rug'
  | 'water_feature'

export interface FurnitureItem {
  id: string
  tileX: number
  tileY: number
  type: string
  targetRoomId?: string
}

export interface CollectibleDisplay {
  tileX: number
  tileY: number
  itemId: string | null
}

export interface ChestSlot {
  itemId: string
  quantity: number
}

export interface ChestContainer {
  id: string
  roomPosition: { tileX: number; tileY: number }
  capacity: number
  slots: ChestSlot[]
}

export interface UndergroundState {
  chunks: Map<string, Chunk>
  discoveredChunks: Set<string>
}

export interface PersonalSpaceRoom {
  id: string
  name: string
  grid: RoomTileType[][]
  spawnX: number
  spawnY: number
  furniture: FurnitureItem[]
  collectibleDisplays: CollectibleDisplay[]
  chests: ChestContainer[]
}

export type GameContext = 'survival' | 'personal_space' | 'underground' | 'void_world'

export type TechCategory = 'fire' | 'shelter' | 'water' | 'earth' | 'metal' | 'farming' | 'animal' | 'chemical' | 'electric' | 'mechanical' | 'storage'

export interface TechPrerequisite {
  type: 'has_item' | 'has_building' | 'has_age' | 'has_tech'
  target: string
}

export interface TechNode {
  id: string
  name: string
  description: string
  categories: TechCategory[]
  diameterName: string
  age: Age
  prerequisites: TechPrerequisite[]
  unlocks: string[]
}

export interface AgentState {
  turn: number;
  clock: GameClock;
  age: Age;
  player: {
    position: Position;
    inventory: Inventory;
  };
  visibleTiles: Tile[];
  nearbyEntities: Entity[];
  availableCrafts: Recipe[];
  activeGoals: string[];
  lastActionResult: TurnResult | null;
}
