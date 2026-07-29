import { TileType } from '../types'

export interface TileDefinition {
  type: TileType;
  name: string;
  walkable: boolean;
  speedModifier: number;
  resource: string | null;
  toolRequired: string | null;
  spawnWeight: number;
  color: string;
}

export const TILES: Record<string, TileDefinition> = {
  grass: {
    type: TileType.Grass,
    name: 'Grass',
    walkable: true,
    speedModifier: 1.0,
    resource: 'fiber',
    toolRequired: null,
    spawnWeight: 40,
    color: '#7ec850',
  },
  forest: {
    type: TileType.Forest,
    name: 'Forest',
    walkable: true,
    speedModifier: 0.7,
    resource: 'wood',
    toolRequired: null,
    spawnWeight: 15,
    color: '#2d5a27',
  },
  water: {
    type: TileType.Water,
    name: 'Water',
    walkable: false,
    speedModifier: 0,
    resource: 'clay',
    toolRequired: null,
    spawnWeight: 10,
    color: '#3b7dd8',
  },
  stone_deposit: {
    type: TileType.StoneDeposit,
    name: 'Stone Deposit',
    walkable: true,
    speedModifier: 0.8,
    resource: 'stone',
    toolRequired: null,
    spawnWeight: 8,
    color: '#8b8b8b',
  },
  ore_vein: {
    type: TileType.OreVein,
    name: 'Ore Vein',
    walkable: true,
    speedModifier: 0.8,
    resource: 'copper_ore',
    toolRequired: null,
    spawnWeight: 3,
    color: '#b87333',
  },
  tilled_soil: {
    type: TileType.TilledSoil,
    name: 'Tilled Soil',
    walkable: true,
    speedModifier: 0.9,
    resource: null,
    toolRequired: null,
    spawnWeight: 0,
    color: '#6b4423',
  },
  sand: {
    type: TileType.Sand,
    name: 'Sand',
    walkable: true,
    speedModifier: 0.8,
    resource: 'sand',
    toolRequired: null,
    spawnWeight: 5,
    color: '#e8d68e',
  },
  mountain: {
    type: TileType.Mountain,
    name: 'Mountain',
    walkable: true,
    speedModifier: 0.5,
    resource: 'iron_ore',
    toolRequired: null,
    spawnWeight: 4,
    color: '#696969',
  },
  deep_deposit: {
    type: TileType.DeepDeposit,
    name: 'Deep Deposit',
    walkable: true,
    speedModifier: 0.4,
    resource: 'oil',
    toolRequired: 'iron_pickaxe',
    spawnWeight: 1,
    color: '#2a2a2a',
  },
  building: {
    type: TileType.Building,
    name: 'Building',
    walkable: false,
    speedModifier: 0,
    resource: null,
    toolRequired: null,
    spawnWeight: 0,
    color: '#a0522d',
  },
  path: {
    type: TileType.Path,
    name: 'Path',
    walkable: true,
    speedModifier: 1.5,
    resource: null,
    toolRequired: null,
    spawnWeight: 0,
    color: '#c9b07a',
  },
  berry_bush: {
    type: TileType.BerryBush,
    name: 'Berry Bush',
    walkable: true,
    speedModifier: 0.9,
    resource: 'berries',
    toolRequired: null,
    spawnWeight: 0,
    color: '#8B0045',
  },
  coal_deposit: {
    type: TileType.CoalDeposit,
    name: 'Coal Deposit',
    walkable: true,
    speedModifier: 0.8,
    resource: 'coal',
    toolRequired: null,
    spawnWeight: 3,
    color: '#3d3d3d',
  },
  cave_floor: {
    type: TileType.CaveFloor,
    name: 'Cave Floor',
    walkable: true,
    speedModifier: 0.9,
    resource: null,
    toolRequired: null,
    spawnWeight: 0,
    color: '#3a3a3a',
  },
  cave_wall: {
    type: TileType.CaveWall,
    name: 'Cave Wall',
    walkable: false,
    speedModifier: 0,
    resource: 'stone',
    toolRequired: null,
    spawnWeight: 0,
    color: '#1a1a1a',
  },
  stairs_up: {
    type: TileType.StairsUp,
    name: 'Stairs Up',
    walkable: true,
    speedModifier: 1.0,
    resource: 'stairs_up',
    toolRequired: null,
    spawnWeight: 0,
    color: '#8b7355',
  },
  underground_water: {
    type: TileType.UndergroundWater,
    name: 'Underground Pool',
    walkable: false,
    speedModifier: 0,
    resource: 'clay',
    toolRequired: null,
    spawnWeight: 0,
    color: '#1a3a5a',
  },
  cave_mud: {
    type: TileType.CaveMud,
    name: 'Cave Mud',
    walkable: true,
    speedModifier: 0.7,
    resource: 'mud',
    toolRequired: null,
    spawnWeight: 0,
    color: '#4A3728',
  },
};

export function getTile(type: TileType): TileDefinition {
  const tile = Object.values(TILES).find((t) => t.type === type);
  if (!tile) {
    return TILES['grass'] as TileDefinition;
  }
  return tile;
}
