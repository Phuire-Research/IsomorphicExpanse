import type { Tile, Position, Chunk, GameState, Biome } from './types'
import { TileType } from './types'
import { getTile } from './data/tiles'

export const CHUNK_SIZE = 16;

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeTile(type: TileType, x: number, y: number): Tile {
  const def = getTile(type);
  return {
    type,
    position: { x, y },
    resource: def.resource,
    walkable: def.walkable,
    speedModifier: def.speedModifier,
    toolRequired: def.toolRequired,
    durability: -1,
  };
}

function getCell(map: Tile[][], x: number, y: number): Tile {
  return (map[y] as Tile[])[x] as Tile;
}

function setCell(map: Tile[][], x: number, y: number, tile: Tile): void {
  (map[y] as Tile[])[x] = tile;
}

export function worldToChunk(x: number, y: number): { cx: number; cy: number } {
  return {
    cx: Math.floor(x / CHUNK_SIZE),
    cy: Math.floor(y / CHUNK_SIZE),
  };
}

export function worldToLocal(x: number, y: number): Position {
  return {
    x: ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
    y: ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
  };
}

export function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

export class WorldGenerator {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
  }

  getChunkBiome(cx: number, cy: number): Biome {
    return 'plains';
  }

  generateChunk(cx: number, cy: number): Tile[][] {
    const biome = this.getChunkBiome(cx, cy);
    const chunkSeed = (this.seed ^ (cx * 73856093) ^ (cy * 19349663)) >>> 0;
    const rng = mulberry32(chunkSeed);

    const map: Tile[][] = [];
    const worldOffsetX = cx * CHUNK_SIZE;
    const worldOffsetY = cy * CHUNK_SIZE;

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      const row: Tile[] = [];
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const baseTile = this.pickBaseTile(biome, rng);
        row.push(makeTile(baseTile, worldOffsetX + lx, worldOffsetY + ly));
      }
      map.push(row);
    }

    this.placeBiomeFeatures(map, rng, worldOffsetX, worldOffsetY, biome);

    return map;
  }

  generateChunkAt(cx: number, cy: number): Chunk {
    const tiles = this.generateChunk(cx, cy);
    let hasVillage = false;
    for (let ly = 0; ly < CHUNK_SIZE && !hasVillage; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE && !hasVillage; lx++) {
        if (getCell(tiles, lx, ly).type === TileType.Building) {
          hasVillage = true;
        }
      }
    }
    return {
      coord: { cx, cy },
      tiles,
      biome: this.getChunkBiome(cx, cy),
      generated: true,
      hasVillage,
    };
  }

  private pickBaseTile(biome: Biome, rng: () => number): TileType {
    return TileType.Grass;
  }

  private placeBiomeFeatures(
    map: Tile[][],
    rng: () => number,
    worldOffsetX: number,
    worldOffsetY: number,
    biome: Biome,
  ): void {
  }

  private scatterBerryBushesChunk(map: Tile[][], rng: () => number, chance: number): void {
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const tile = getCell(map, lx, ly);
        if (tile.type === TileType.Grass && rng() < chance) {
          setCell(map, lx, ly, makeTile(TileType.BerryBush, tile.position.x, tile.position.y));
        }
      }
    }
  }

  private scatterMushroomsChunk(map: Tile[][], rng: () => number, chance: number): void {
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const tile = getCell(map, lx, ly);
        if (tile.type === TileType.Forest && rng() < chance) {
          tile.resource = 'mushroom';
        }
      }
    }
  }

  private placeDesertOasisChunk(map: Tile[][], rng: () => number): void {
    if (rng() > 0.15) return;
    const cx = 4 + Math.floor(rng() * (CHUNK_SIZE - 8));
    const cy = 4 + Math.floor(rng() * (CHUNK_SIZE - 8));
    this.placeClusterLocal(map, rng, cx, cy, 2 + Math.floor(rng() * 2), TileType.Water);
  }

  private applySwampSpeedModifier(map: Tile[][]): void {
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const tile = getCell(map, lx, ly);
        if (tile.type === TileType.Grass) {
          tile.speedModifier = 0.7;
          if (!tile.resource || tile.resource === 'fiber') {
            tile.resource = 'mud';
          }
        }
      }
    }
  }

  ensureChunksAroundPlayer(state: GameState, radius: number): void {
    const playerPos = state.player.entity.position;
    const { cx: pcx, cy: pcy } = worldToChunk(playerPos.x, playerPos.y);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const cx = pcx + dx;
        const cy = pcy + dy;
        const key = chunkKey(cx, cy);
        if (!state.world.chunks.has(key)) {
          state.world.chunks.set(key, this.generateChunkAt(cx, cy));
        }
      }
    }
  }

  getSpawnPosition(): Position {
    return {
      x: Math.floor(CHUNK_SIZE / 2),
      y: Math.floor(CHUNK_SIZE / 2),
    };
  }

  getSeed(): number {
    return this.seed;
  }

  placeSpawnFeatures(state: GameState): void {
    const spawn = state.player.entity.position;
    this.placeSpawnFarmWorld(state, spawn);
    this.placeSpawnPathWorld(state, spawn);
    this.placeBerryBushesWorld(state, spawn);
    this.placeSpawnStoneDeposits(state, spawn);
    this.placeSpawnForest(state, spawn);
    this.placeSpawnMud(state, spawn);
  }

  private placeSpawnStoneDeposits(state: GameState, spawn: Position): void {
    const offsets = [
      { x: 1, y: -1 }, { x: -1, y: 1 },
      { x: -2, y: -2 }, { x: 3, y: -1 }, { x: -1, y: 3 }, { x: 2, y: 3 },
      { x: 4, y: -3 }, { x: -3, y: 4 }, { x: 5, y: 2 }, { x: -4, y: -3 },
    ];
    for (const off of offsets) {
      const wx = spawn.x + off.x;
      const wy = spawn.y + off.y;
      const tile = this.getTileFromChunks(state, wx, wy);
      if (tile && tile.type === TileType.Grass) {
        this.setTileInChunks(state, wx, wy, makeTile(TileType.StoneDeposit, wx, wy));
      }
    }
    const rng = mulberry32(this.seed ^ 0x5710E);
    for (let dy = -15; dy <= 15; dy++) {
      for (let dx = -15; dx <= 15; dx++) {
        const wx = spawn.x + dx;
        const wy = spawn.y + dy;
        const tile = this.getTileFromChunks(state, wx, wy);
        if (tile && tile.type === TileType.Grass && rng() < 0.03) {
          this.setTileInChunks(state, wx, wy, makeTile(TileType.StoneDeposit, wx, wy));
        }
      }
    }
  }

  private placeSpawnMud(state: GameState, spawn: Position): void {
    const offsets = [
      { x: 2, y: 2 }, { x: -2, y: 2 }, { x: 2, y: -2 }, { x: -2, y: -2 },
      { x: 4, y: 1 }, { x: -4, y: 1 }, { x: 1, y: -4 }, { x: -1, y: 4 },
    ];
    for (const off of offsets) {
      const wx = spawn.x + off.x;
      const wy = spawn.y + off.y;
      const tile = this.getTileFromChunks(state, wx, wy);
      if (tile && tile.type === TileType.Grass) {
        tile.resource = 'mud';
      }
    }
    const rng = mulberry32(this.seed ^ 0xA0D);
    for (let dy = -12; dy <= 12; dy++) {
      for (let dx = -12; dx <= 12; dx++) {
        const wx = spawn.x + dx;
        const wy = spawn.y + dy;
        const tile = this.getTileFromChunks(state, wx, wy);
        if (tile && tile.type === TileType.Grass && rng() < 0.08) {
          tile.resource = 'mud';
        }
      }
    }
  }

  private placeSpawnForest(state: GameState, spawn: Position): void {
    const offsets = [
      { x: 3, y: 0 }, { x: -3, y: 0 }, { x: 0, y: 3 }, { x: 0, y: -3 },
      { x: 4, y: 2 }, { x: -4, y: 2 }, { x: 2, y: -4 }, { x: -2, y: 4 },
    ];
    for (const off of offsets) {
      const wx = spawn.x + off.x;
      const wy = spawn.y + off.y;
      const tile = this.getTileFromChunks(state, wx, wy);
      if (tile && tile.type === TileType.Grass) {
        this.setTileInChunks(state, wx, wy, makeTile(TileType.Forest, wx, wy));
      }
    }
    const rng = mulberry32(this.seed ^ 0xF0E57);
    for (let dy = -10; dy <= 10; dy++) {
      for (let dx = -10; dx <= 10; dx++) {
        const wx = spawn.x + dx;
        const wy = spawn.y + dy;
        const tile = this.getTileFromChunks(state, wx, wy);
        if (tile && tile.type === TileType.Grass && rng() < 0.05) {
          this.setTileInChunks(state, wx, wy, makeTile(TileType.Forest, wx, wy));
        }
      }
    }
  }

  private getTileFromChunks(state: GameState, wx: number, wy: number): Tile | null {
    const { cx, cy } = worldToChunk(wx, wy);
    const key = chunkKey(cx, cy);
    const chunk = state.world.chunks.get(key);
    if (!chunk) return null;
    const local = worldToLocal(wx, wy);
    const row = chunk.tiles[local.y];
    if (!row) return null;
    return row[local.x] ?? null;
  }

  private setTileInChunks(state: GameState, wx: number, wy: number, tile: Tile): void {
    const { cx, cy } = worldToChunk(wx, wy);
    const key = chunkKey(cx, cy);
    const chunk = state.world.chunks.get(key);
    if (!chunk) return;
    const local = worldToLocal(wx, wy);
    const row = chunk.tiles[local.y];
    if (row) {
      row[local.x] = tile;
    }
  }

  private placeSpawnFarmWorld(state: GameState, spawn: Position): void {
    const farmX = spawn.x + 3;
    const farmY = spawn.y + 3;
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const x = farmX + dx;
        const y = farmY + dy;
        this.setTileInChunks(state, x, y, makeTile(TileType.TilledSoil, x, y));
      }
    }
    const waterX = farmX - 1;
    const waterY = farmY + 1;
    this.setTileInChunks(state, waterX, waterY, makeTile(TileType.Water, waterX, waterY));
  }

  private placeSpawnPathWorld(state: GameState, spawn: Position): void {
    const pathStartX = spawn.x - 1;
    const pathY = spawn.y + 2;
    const pathLength = 7;
    for (let i = 0; i < pathLength; i++) {
      const x = pathStartX + i;
      this.setTileInChunks(state, x, pathY, makeTile(TileType.Path, x, pathY));
    }
  }

  private placeBerryBushesWorld(state: GameState, spawn: Position): void {
    const guaranteed = [
      { x: spawn.x - 2, y: spawn.y - 1 },
      { x: spawn.x + 2, y: spawn.y - 1 },
      { x: spawn.x - 2, y: spawn.y + 1 },
      { x: spawn.x + 2, y: spawn.y + 1 },
    ];
    for (const pos of guaranteed) {
      const tile = this.getTileFromChunks(state, pos.x, pos.y);
      if (tile && (tile.type === TileType.Grass || tile.type === TileType.BerryBush)) {
        this.setTileInChunks(state, pos.x, pos.y, makeTile(TileType.BerryBush, pos.x, pos.y));
      }
    }
    const rng = mulberry32(this.seed ^ 0xBE221E5);
    for (let dy = -20; dy <= 20; dy++) {
      for (let dx = -20; dx <= 20; dx++) {
        const wx = spawn.x + dx;
        const wy = spawn.y + dy;
        const tile = this.getTileFromChunks(state, wx, wy);
        if (tile && tile.type === TileType.Grass && rng() < 0.12) {
          this.setTileInChunks(state, wx, wy, makeTile(TileType.BerryBush, wx, wy));
        }
      }
    }
  }

  private placeWaterPondsChunk(map: Tile[][], rng: () => number, _worldOffsetX: number, _worldOffsetY: number): void {
    const pondCount = rng() < 0.4 ? 1 : 0;
    for (let p = 0; p < pondCount; p++) {
      const startX = 2 + Math.floor(rng() * (CHUNK_SIZE - 4));
      const startY = 2 + Math.floor(rng() * (CHUNK_SIZE - 4));
      const pondSize = 3 + Math.floor(rng() * 3);
      this.placeClusterLocal(map, rng, startX, startY, pondSize, TileType.Water);
    }
  }

  private placeSandNearWaterChunk(map: Tile[][], rng: () => number): void {
    const sandTiles: { lx: number; ly: number }[] = [];
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        if (getCell(map, lx, ly).type !== TileType.Water) continue;
        const neighbors = this.getLocalNeighbors(lx, ly);
        for (const n of neighbors) {
          if (getCell(map, n.x, n.y).type === TileType.Grass && rng() < 0.4) {
            sandTiles.push({ lx: n.x, ly: n.y });
          }
        }
      }
    }
    for (const pos of sandTiles) {
      if (getCell(map, pos.lx, pos.ly).type === TileType.Grass) {
        const worldTile = getCell(map, pos.lx, pos.ly);
        setCell(map, pos.lx, pos.ly, makeTile(TileType.Sand, worldTile.position.x, worldTile.position.y));
      }
    }
  }

  private placeForestClustersChunk(map: Tile[][], rng: () => number, _worldOffsetX: number, _worldOffsetY: number): void {
    const clusterCount = 1 + Math.floor(rng() * 2);
    for (let c = 0; c < clusterCount; c++) {
      const startX = 1 + Math.floor(rng() * (CHUNK_SIZE - 2));
      const startY = 1 + Math.floor(rng() * (CHUNK_SIZE - 2));
      const size = 2 + Math.floor(rng() * 3);
      this.placeClusterOnGrassLocal(map, rng, startX, startY, size, TileType.Forest);
    }
  }

  private placeMountainClustersChunk(map: Tile[][], rng: () => number, _worldOffsetX: number, _worldOffsetY: number): void {
    if (rng() > 0.3) return;
    const edge = Math.floor(rng() * 4);
    let startX: number;
    let startY: number;
    switch (edge) {
      case 0:
        startX = Math.floor(rng() * CHUNK_SIZE);
        startY = Math.floor(rng() * 3);
        break;
      case 1:
        startX = Math.floor(rng() * CHUNK_SIZE);
        startY = CHUNK_SIZE - 1 - Math.floor(rng() * 3);
        break;
      case 2:
        startX = Math.floor(rng() * 3);
        startY = Math.floor(rng() * CHUNK_SIZE);
        break;
      default:
        startX = CHUNK_SIZE - 1 - Math.floor(rng() * 3);
        startY = Math.floor(rng() * CHUNK_SIZE);
        break;
    }
    const size = 2 + Math.floor(rng() * 3);
    this.placeClusterLocal(map, rng, startX, startY, size, TileType.Mountain);
  }

  private placeStoneDepositsChunk(map: Tile[][], rng: () => number): void {
    const count = 1 + Math.floor(rng() * 3);
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 10) {
      const lx = Math.floor(rng() * CHUNK_SIZE);
      const ly = Math.floor(rng() * CHUNK_SIZE);
      if (getCell(map, lx, ly).type === TileType.Grass) {
        const worldTile = getCell(map, lx, ly);
        setCell(map, lx, ly, makeTile(TileType.StoneDeposit, worldTile.position.x, worldTile.position.y));
        placed++;
      }
      attempts++;
    }
  }

  private placeOreVeinsChunk(map: Tile[][], rng: () => number, resourceOverride?: string): void {
    const walkable: { lx: number; ly: number }[] = [];
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const tile = getCell(map, lx, ly);
        if (tile.type === TileType.Grass || tile.type === TileType.StoneDeposit) {
          walkable.push({ lx, ly });
        }
      }
    }

    if (walkable.length === 0) return;

    const oreCount = Math.min(3, walkable.length);
    let placed = 0;
    for (let attempts = 0; attempts < walkable.length && placed < oreCount; attempts++) {
      const idx = Math.floor(rng() * walkable.length);
      const pos = walkable[idx];
      if (getCell(map, pos.lx, pos.ly).type !== TileType.OreVein && rng() < 0.7) {
        const worldTile = getCell(map, pos.lx, pos.ly);
        const oreTile = makeTile(TileType.OreVein, worldTile.position.x, worldTile.position.y);
        if (resourceOverride) oreTile.resource = resourceOverride;
        setCell(map, pos.lx, pos.ly, oreTile);
        placed++;
      }
    }
  }

  private isAdjacentToWater(map: Tile[][], lx: number, ly: number): boolean {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = lx + dx;
        const ny = ly + dy;
        if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_SIZE) {
          if (getCell(map, nx, ny).type === TileType.Water) return true;
        }
      }
    }
    return false;
  }

  private scatterGrassResourcesChunk(map: Tile[][], rng: () => number): void {
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const tile = getCell(map, lx, ly);
        if (tile.type === TileType.Grass && tile.resource === 'fiber') {
          const nearWater = this.isAdjacentToWater(map, lx, ly);
          if (nearWater && rng() < 0.50) {
            tile.resource = 'mud';
          } else {
            const roll = rng();
            if (roll < 0.20) {
              tile.resource = 'stick';
            } else if (roll < 0.45) {
              tile.resource = 'mud';
            } else if (roll < 0.48) {
              tile.resource = 'stone';
            }
          }
        }
        if (tile.type === TileType.Forest && rng() < 0.05) {
          tile.resource = 'mushroom';
        }
        if (tile.type === TileType.Grass && tile.resource !== 'mud' && this.isAdjacentToWater(map, lx, ly) && rng() < 0.25) {
          tile.resource = 'clay';
        }
      }
    }
  }

  private scatterMountainClayChunk(map: Tile[][], rng: () => number): void {
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const tile = getCell(map, lx, ly);
        if (tile.type === TileType.Grass && rng() < 0.10) {
          tile.resource = 'clay';
        }
      }
    }
  }

  private placeClusterLocal(
    map: Tile[][],
    rng: () => number,
    startX: number,
    startY: number,
    size: number,
    type: TileType,
  ): void {
    const visited = new Set<string>();
    const queue: Position[] = [{ x: startX, y: startY }];
    let placed = 0;

    while (queue.length > 0 && placed < size) {
      const idx = Math.floor(rng() * queue.length);
      const removed = queue.splice(idx, 1);
      const pos = removed[0];
      if (!pos) continue;
      const key = `${pos.x},${pos.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (pos.x < 0 || pos.x >= CHUNK_SIZE || pos.y < 0 || pos.y >= CHUNK_SIZE) continue;

      const worldTile = getCell(map, pos.x, pos.y);
      setCell(map, pos.x, pos.y, makeTile(type, worldTile.position.x, worldTile.position.y));
      placed++;

      const neighbors = this.getLocalNeighbors(pos.x, pos.y);
      for (const n of neighbors) {
        const nKey = `${n.x},${n.y}`;
        if (!visited.has(nKey)) {
          queue.push(n);
        }
      }
    }
  }

  private placeClusterOnGrassLocal(
    map: Tile[][],
    rng: () => number,
    startX: number,
    startY: number,
    size: number,
    type: TileType,
  ): void {
    const visited = new Set<string>();
    const queue: Position[] = [{ x: startX, y: startY }];
    let placed = 0;

    while (queue.length > 0 && placed < size) {
      const idx = Math.floor(rng() * queue.length);
      const removed = queue.splice(idx, 1);
      const pos = removed[0];
      if (!pos) continue;
      const key = `${pos.x},${pos.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (pos.x < 0 || pos.x >= CHUNK_SIZE || pos.y < 0 || pos.y >= CHUNK_SIZE) continue;

      if (getCell(map, pos.x, pos.y).type !== TileType.Grass) continue;

      const worldTile = getCell(map, pos.x, pos.y);
      setCell(map, pos.x, pos.y, makeTile(type, worldTile.position.x, worldTile.position.y));
      placed++;

      const neighbors = this.getLocalNeighbors(pos.x, pos.y);
      for (const n of neighbors) {
        const nKey = `${n.x},${n.y}`;
        if (!visited.has(nKey)) {
          queue.push(n);
        }
      }
    }
  }

  ensureUndergroundChunks(state: GameState, radius: number): void {
  }

  private getLocalNeighbors(x: number, y: number): Position[] {
    const result: Position[] = [];
    if (x > 0) result.push({ x: x - 1, y });
    if (x < CHUNK_SIZE - 1) result.push({ x: x + 1, y });
    if (y > 0) result.push({ x, y: y - 1 });
    if (y < CHUNK_SIZE - 1) result.push({ x, y: y + 1 });
    return result;
  }
}
