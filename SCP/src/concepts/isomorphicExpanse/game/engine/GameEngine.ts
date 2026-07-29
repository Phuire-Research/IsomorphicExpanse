import type {
  GameState, PlayerState, Action, TurnResult,
  Tile, Position, Direction, Age,
  Inventory, InventorySlot, GameClock, WorldState,
  AgentState, Recipe, Entity, Season, TimeOfDay, WeatherType,
  Item, GameStats, RoomTileType, PersonalSpaceRoom, GameContext,
  ChestContainer, Biome, SkillData, Chunk,
} from './types'
import { ActionType, EntityType, TileType } from './types'
import { Age as AgeEnum } from './types'
import { ITEMS } from './data/items'
import { RECIPES, getAvailableRecipes } from './data/recipes'
import { executeNPCSchedule, spawnNPCs } from './NPCSystem'
import { NPCS } from './data/npcs'
import { worldToChunk, worldToLocal, chunkKey, CHUNK_SIZE } from './WorldGenerator'
import type { WorldGenerator } from './WorldGenerator'

const AGE_ORDER: Age[] = [
  AgeEnum.Gathering,
  AgeEnum.Stone,
  AgeEnum.Wood,
  AgeEnum.Clay,
  AgeEnum.Copper,
  AgeEnum.Iron,
  AgeEnum.Steam,
  AgeEnum.Electric,
  AgeEnum.Chemical,
  AgeEnum.Rocket,
];

const TIME_PERIODS: TimeOfDay[] = ['dawn', 'morning', 'midday', 'afternoon', 'evening', 'night'];
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

const TURNS_PER_DAY = 6;
const DAYS_PER_SEASON = 28;

const VOID_STUB_POSITION = { x: 500, y: 500 };

const WEATHER_TEMP_MODIFIERS: Record<WeatherType, number> = {
  clear: 0,
  rain: -4,
  snow: -8,
  sandstorm: 6,
  fog: -2,
  wind: -3,
};

const SEASON_TEMP_MODIFIERS: Record<Season, number> = {
  spring: 0,
  summer: 3,
  fall: -1,
  winter: -5,
};

const DIRECTION_OFFSETS: Record<Direction, Position> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
  northeast: { x: 1, y: -1 },
  northwest: { x: -1, y: -1 },
  southeast: { x: 1, y: 1 },
  southwest: { x: -1, y: 1 },
} as Record<Direction, Position>;

function directionName(d: Position): string {
  const ns = d.y < 0 ? 'north' : d.y > 0 ? 'south' : '';
  const ew = d.x < 0 ? 'west' : d.x > 0 ? 'east' : '';
  return ns + ew || 'nowhere';
}

const STONE_TOOLS = ['stone_knife', 'stone_axe', 'stone_hoe'];
const DEFAULT_FOV_RADIUS = 5;
const DEFAULT_INVENTORY_SLOTS = 16;

const CONTAINER_TECHS: Record<string, number> = {
  carrying_bundle: 3,
  hide_pouch: 2,
  wooden_crate: 2,
  clay_pot_storage: 2,
  metal_strongbox: 2,
  steel_vault: 2,
  automated_bin: 2,
  digital_catalog: 2,
  chemical_storage: 4,
  rocket_logistics: 4,
};

const STAMINA_COSTS: Record<string, number> = {
  [ActionType.Move]: 1,
  [ActionType.Gather]: 2,
  [ActionType.Craft]: 0,
  [ActionType.Plant]: 2,
  [ActionType.Harvest]: 2,
  [ActionType.Use]: 2,
  [ActionType.Interact]: 0,
  [ActionType.Trade]: 0,
  [ActionType.Wait]: 0,
  [ActionType.Eat]: 0,
  [ActionType.Place]: 2,
  [ActionType.Tame]: 1,
  [ActionType.Mount]: 0,
  [ActionType.Dismount]: 0,
  [ActionType.Research]: 2,
  [ActionType.Launch]: 0,
  [ActionType.Fish]: 3,
  [ActionType.Equip]: 0,
  [ActionType.Descend]: 5,
  [ActionType.Ascend]: 5,
  [ActionType.Prospect]: 3,
  [ActionType.Drop]: 0,
};

const FOOD_VALUES: Record<string, number> = {
  berries: 15,
  mushroom: 10,
  carrot: 20,
  potato: 25,
  wheat: 8,
  rice: 8,
  wheat_seeds: 3,
  carrot_seeds: 3,
  potato_seeds: 3,
  bread: 35,
  carrot_soup: 40,
  potato_stew: 45,
  raw_fish: 8,
  cooked_fish: 30,
  egg: 20,
  milk: 25,
  omelet: 30,
};

function createDefaultSkill(): SkillData {
  return { level: 1, xp: 0, xpToNext: 100 };
}

function addSkillXP(skill: SkillData, amount: number): string[] {
  const messages: string[] = [];
  skill.xp += amount;
  while (skill.xp >= skill.xpToNext) {
    skill.xp -= skill.xpToNext;
    skill.level = Math.min(99, skill.level + 1);
    skill.xpToNext = 100 * skill.level;
    messages.push(`Skill increased to level ${skill.level}!`);
  }
  return messages;
}

export class GameEngine {
  private state: GameState;
  private worldGen: WorldGenerator | null;
  private lastAutomationMessages: string[] = [];
  private lastTemperatureMessage: string = '';
  private lastHealthMessage: string = '';

  constructor(initialState: GameState, worldGen?: WorldGenerator) {
    this.state = initialState;
    this.worldGen = worldGen ?? null;
  }

  executeTurn(action: Action): TurnResult {
    if (this.state.gameOver) {
      return {
        success: false,
        message: 'You have perished.',
        stateChanges: {},
      };
    }
    let staminaCost = STAMINA_COSTS[action.action] ?? 0;
    if (action.action === ActionType.Move && this.state.player.mounted) {
      staminaCost = 0;
    }
    if (staminaCost > 0 && this.state.player.stamina <= 0) {
      return {
        success: false,
        message: 'Too exhausted to act.',
        stateChanges: {},
      };
    }

    let result: TurnResult;

    switch (action.action) {
      case ActionType.Move:
        result = this.handleMove(action.direction);
        break;
      case ActionType.Gather:
        result = this.handleGather(action.target);
        break;
      case ActionType.Craft:
        result = this.handleCraft(action.recipe);
        break;
      case ActionType.Wait:
        result = this.handleWait();
        break;
      case ActionType.Use:
        result = this.handleUse(action.item, action.target);
        break;
      case ActionType.Interact:
        result = this.handleInteract(action.target);
        break;
      case ActionType.Eat:
        result = this.handleEat(action.item);
        break;
      case ActionType.Place:
        result = this.handlePlace(action.item, action.target);
        break;
      case ActionType.Mount:
        result = this.handleMount(action.target);
        break;
      case ActionType.Dismount:
        result = this.handleDismount();
        break;
      case ActionType.Research:
        result = this.handleResearch(action.recipeId);
        break;
      case ActionType.Launch:
        result = this.handleLaunch();
        break;
      case ActionType.EnterPersonalSpace:
        result = this.handleEnterPersonalSpace();
        break;
      case ActionType.ExitPersonalSpace:
        result = this.handleExitPersonalSpace();
        break;
      case ActionType.PlaceFurniture:
        result = this.handlePlaceFurniture(action.furnitureType, action.target);
        break;
      case ActionType.PlaceCollectible:
        result = this.handlePlaceCollectible(action.itemId, action.target);
        break;
      case ActionType.Fish:
        result = this.handleFish(action.target);
        break;
      case ActionType.OpenChest:
        result = this.handleOpenChest(action.chestId);
        break;
      case ActionType.TransferToChest:
        result = this.handleTransferToChest(action.chestId, action.itemId, action.quantity);
        break;
      case ActionType.TransferFromChest:
        result = this.handleTransferFromChest(action.chestId, action.itemId, action.quantity);
        break;
      case ActionType.Equip:
        result = this.handleEquip(action.itemId);
        break;
      case ActionType.Descend:
        result = this.handleDescend();
        break;
      case ActionType.Ascend:
        result = this.handleAscend();
        break;
      case ActionType.Prospect:
        result = this.handleProspect();
        break;
      case ActionType.Drop:
        result = this.handleDrop(action.slotIndex, action.quantity);
        break;
      default:
        result = {
          success: false,
          message: 'Action not yet supported.',
          stateChanges: {},
        };
        break;
    }

    if (result.success && staminaCost > 0 && this.state.gameContext !== 'personal_space' && this.state.gameContext !== 'void_world') {
      this.state.player.stamina = Math.max(0, this.state.player.stamina - staminaCost);
    }

    if (result.success) {
      const techMessages = this.processTechDiscovery();
      if (techMessages.length > 0) {
        result = { ...result, message: result.message + ' ' + techMessages.join(' ') };
      }
    }

    this.advanceClock();
    if (result.success) {
      const npcHint = this.checkNPCProximity();
      if (npcHint) {
        result = { ...result, message: result.message + ' ' + npcHint };
      }
    }
    if (this.lastAutomationMessages.length > 0) {
      result = { ...result, message: result.message + ' ' + this.lastAutomationMessages.join(' ') };
    }
    if (this.lastTemperatureMessage) {
      result = { ...result, message: result.message + ' ' + this.lastTemperatureMessage };
    }
    if (this.lastHealthMessage) {
      result = { ...result, message: result.message + ' ' + this.lastHealthMessage };
    }
    this.state.lastActionResult = result;
    return result;
  }

  getState(): GameState {
    return structuredClone(this.state);
  }

  getComposedTiles(): { tiles: Tile[][]; width: number; height: number; originX: number; originY: number } {
    return this.getFlatTiles();
  }

  getAgentState(): AgentState {
    const inventoryRecord = this.getInventoryAsRecord();
    const availableCrafts = getAvailableRecipes(this.state.currentAge, inventoryRecord, this.state.discoveredTechs);

    return {
      turn: this.state.clock.turn,
      clock: structuredClone(this.state.clock),
      age: this.state.currentAge,
      player: {
        position: { ...this.state.player.entity.position },
        inventory: structuredClone(this.state.player.inventory),
      },
      visibleTiles: this.getVisibleTiles(DEFAULT_FOV_RADIUS),
      nearbyEntities: this.getNearbyEntities(DEFAULT_FOV_RADIUS),
      availableCrafts: availableCrafts as Recipe[],
      activeGoals: [],
      lastActionResult: this.state.lastActionResult
        ? structuredClone(this.state.lastActionResult)
        : null,
    };
  }

  private handleMove(direction: Direction): TurnResult {
    const offset = this.getDirectionOffset(direction);
    const current = this.state.player.entity.position;

    // Mounts do not exist in personal_space; this branch is survival/underground only.
    if (this.state.player.mounted) {
      const mid: Position = {
        x: current.x + offset.x,
        y: current.y + offset.y,
      };
      const final: Position = {
        x: current.x + offset.x * 2,
        y: current.y + offset.y * 2,
      };

      const midTile = this.getTileAt(mid);
      if (!midTile) {
        return {
          success: false,
          message: `Cannot ride ${direction}: out of bounds.`,
          stateChanges: {},
        };
      }

      if (!midTile.walkable) {
        return {
          success: false,
          message: `Cannot ride ${direction}: path blocked (${midTile.type}).`,
          stateChanges: {},
        };
      }

      const finalTile = this.getTileAt(final);
      let destination = final;
      let msg: string;

      if (!finalTile || !finalTile.walkable) {
        destination = mid;
        msg = `Horse slows — moved ${direction} to (${mid.x}, ${mid.y}).`;
      } else {
        msg = `Rode ${direction} to (${final.x}, ${final.y}).`;
      }

      this.state.player.entity.position = destination;
      this.updateMountedAnimalPosition();
      this.trackVisitedTile(destination);

      return {
        success: true,
        message: msg,
        stateChanges: {
          player: structuredClone(this.state.player),
        },
      };
    }

    const target: Position = {
      x: current.x + offset.x,
      y: current.y + offset.y,
    };

    const tile = this.getTileAt(target);
    if (!tile) {
      return {
        success: false,
        message: `Cannot move ${direction}: out of bounds.`,
        stateChanges: {},
      };
    }

    if (!tile.walkable) {
      return {
        success: false,
        message: `Cannot move ${direction}: tile is not walkable (${tile.type}).`,
        stateChanges: {},
      };
    }

    if (this.state.gameContext === 'personal_space') {
      const door = this.state.personalSpace.furniture.find(
        f => f.tileX === target.x && f.tileY === target.y && f.targetRoomId && f.targetRoomId !== 'void_world'
      );
      if (door && door.targetRoomId) {
        return this.transitionThroughFurniture(door.targetRoomId);
      }
      // Walls are forbidden. Checked AFTER the door branch on purpose: a door sits in the wall line
      // and is the sanctioned way through it, so blocking walls first would seal the rooms shut.
      const blockedBy = this.personalSpaceBlockedBy(target);
      if (blockedBy) {
        return {
          success: false,
          message: `Cannot move ${direction}: blocked by ${blockedBy}.`,
          stateChanges: {},
        };
      }
    }

    this.state.player.entity.position = target;
    this.trackVisitedTile(target);
    return {
      success: true,
      message: `Moved ${directionName(offset)} to (${target.x}, ${target.y}).`,
      stateChanges: {
        player: structuredClone(this.state.player),
      },
    };
  }

  private handleGather(target: Position): TurnResult {
    if (!this.isAdjacent(this.state.player.entity.position, target)) {
      return {
        success: false,
        message: `Cannot gather: target (${target.x}, ${target.y}) is not adjacent.`,
        stateChanges: {},
      };
    }

    const tile = this.getTileAt(target);
    if (!tile) {
      return {
        success: false,
        message: `Cannot gather: target (${target.x}, ${target.y}) is out of bounds.`,
        stateChanges: {},
      };
    }

    if (!tile.resource) {
      return {
        success: false,
        message: `Cannot gather: no resource at (${target.x}, ${target.y}).`,
        stateChanges: {},
      };
    }

    if (tile.toolRequired) {
      const hasTool = this.getInventoryCount(tile.toolRequired) > 0;
      if (!hasTool) {
        const toolDef = ITEMS[tile.toolRequired];
        const toolName = toolDef ? toolDef.name : tile.toolRequired;
        return {
          success: false,
          message: `Cannot gather: requires ${toolName}.`,
          stateChanges: {},
        };
      }
    }

    const resourceId = tile.resource;
    const itemDef = ITEMS[resourceId];
    if (!itemDef) {
      return {
        success: false,
        message: `Cannot gather: unknown resource '${resourceId}'.`,
        stateChanges: {},
      };
    }

    const hasAxe = this.getInventoryCount('stone_axe') > 0 || this.getInventoryCount('iron_axe') > 0;
    const hasPickaxe = this.getInventoryCount('iron_pickaxe') > 0;
    const isOre = resourceId === 'iron_ore' || resourceId === 'copper_ore' || resourceId === 'coal';
    const isUnderground = this.state.gameContext === 'underground';
    const axeBonus = hasAxe && (resourceId === 'wood' || resourceId === 'stone') ? 1 : 0;
    const pickaxeBonus = hasPickaxe && isOre ? 1 : 0;
    const oilPickaxeBonus = hasPickaxe && resourceId === 'oil' ? 1 : 0;
    const undergroundOreBonus = isUnderground && isOre ? 1 : 0;
    const totalYield = 1 + axeBonus + pickaxeBonus + oilPickaxeBonus + undergroundOreBonus;

    const added = this.addToInventory(resourceId, totalYield);
    if (!added) {
      return {
        success: false,
        message: `Cannot gather: inventory is full.`,
        stateChanges: {},
      };
    }

    this.depleteTileResource(target);

    const skills = this.state.player.skills ?? { gathering: createDefaultSkill(), crafting: createDefaultSkill(), tech: createDefaultSkill() };
    this.state.player.skills = skills;
    const gatherLevel = skills.gathering.level;
    const gatherXP = 5 + gatherLevel;
    const skillMessages = addSkillXP(skills.gathering, gatherXP);
    const hungerHeal = 3 + Math.floor(gatherLevel / 3);
    this.state.player.hunger = Math.min(this.state.player.maxHunger, this.state.player.hunger + hungerHeal);

    const bonusYield = axeBonus + pickaxeBonus + undergroundOreBonus;
    let bonusMessage = bonusYield > 0 ? ` (bonus: +${bonusYield})` : '';
    if (resourceId === 'berries' && Math.random() < 0.25) {
      const seedTypes = ['wheat_seeds', 'carrot_seeds', 'potato_seeds'];
      const seedId = seedTypes[Math.floor(Math.random() * seedTypes.length)];
      const seedAdded = this.addToInventory(seedId, 1);
      if (seedAdded) {
        const seedDef = ITEMS[seedId];
        bonusMessage = ` Found 1 ${seedDef?.name || seedId} in the bush!`;
      }
    }

    const skillMsg = skillMessages.map(m => `Gathering ${m.toLowerCase()}`).join(' ');

    return {
      success: true,
      message: `Gathered 1 ${itemDef.name} from (${target.x}, ${target.y}).${bonusMessage}${skillMsg ? ' ' + skillMsg : ''}`,
      stateChanges: {
        player: structuredClone(this.state.player),
      },
    };
  }

  private handleCraft(recipeId: string): TurnResult {
    const recipe = RECIPES[recipeId];
    if (!recipe) {
      return {
        success: false,
        message: `Cannot craft: unknown recipe '${recipeId}'.`,
        stateChanges: {},
      };
    }

    const currentAgeIndex = AGE_ORDER.indexOf(this.state.currentAge);
    const requiredAgeIndex = AGE_ORDER.indexOf(recipe.requiredAge);
    if (requiredAgeIndex > currentAgeIndex) {
      return {
        success: false,
        message: `Cannot craft ${recipe.name}: requires ${recipe.requiredAge} age (current: ${this.state.currentAge}).`,
        stateChanges: {},
      };
    }

    if (recipe.requiredStation) {
      const hasStation = this.getInventoryCount(recipe.requiredStation) > 0;
      const hasAdjacentStation = this.checkAdjacentStation(recipe.requiredStation);
      if (!hasStation && !hasAdjacentStation) {
        return {
          success: false,
          message: `Cannot craft ${recipe.name}: requires ${recipe.requiredStation}.`,
          stateChanges: {},
        };
      }
    }

    for (const [itemId, requiredQty] of Object.entries(recipe.inputs)) {
      const available = this.getInventoryCount(itemId);
      if (available < requiredQty) {
        const itemDef = ITEMS[itemId];
        const itemName = itemDef ? itemDef.name : itemId;
        return {
          success: false,
          message: `Cannot craft ${recipe.name}: need ${requiredQty} ${itemName} (have ${available}).`,
          stateChanges: {},
        };
      }
    }

    const inputSlots = new Set(Object.keys(recipe.inputs));
    const outputSlots = new Set(Object.keys(recipe.outputs));
    const slotsFreedByInputs = [...inputSlots].filter(id => {
      const available = this.getInventoryCount(id);
      const required = recipe.inputs[id] ?? 0;
      return available === required;
    }).length;
    const newSlotsNeeded = [...outputSlots].filter(id => !inputSlots.has(id) && this.getInventoryCount(id) === 0).length;
    const currentSlots = this.state.player.inventory.slots.filter(s => s.item !== null).length;
    const maxSlots = this.state.player.inventory.maxSlots;
    if (currentSlots - slotsFreedByInputs + newSlotsNeeded > maxSlots) {
      return {
        success: false,
        message: `Cannot craft ${recipe.name}: not enough inventory space for output.`,
        stateChanges: {},
      };
    }

    for (const [itemId, requiredQty] of Object.entries(recipe.inputs)) {
      this.removeFromInventory(itemId, requiredQty);
    }

    const outputNames: string[] = [];
    for (const [itemId, outputQty] of Object.entries(recipe.outputs)) {
      const added = this.addToInventory(itemId, outputQty);
      if (!added) {
        for (const [inId, inQty] of Object.entries(recipe.inputs)) {
          this.addToInventory(inId, inQty);
        }
        return {
          success: false,
          message: `Cannot craft ${recipe.name}: not enough inventory space for output.`,
          stateChanges: {},
        };
      }
      const itemDef = ITEMS[itemId];
      const itemName = itemDef ? itemDef.name : itemId;
      outputNames.push(`${outputQty} ${itemName}`);
    }

    this.state.stats.totalItemsCrafted++;

    let autoEquipMsg = '';
    for (const outputId of Object.keys(recipe.outputs)) {
      const outputDef = ITEMS[outputId];
      if (outputDef?.warmthBonus && outputDef.warmthBonus > 0) {
        const currentBonus = this.state.player.equippedClothing
          ? (ITEMS[this.state.player.equippedClothing]?.warmthBonus ?? 0)
          : 0;
        if (outputDef.warmthBonus > currentBonus) {
          const equipResult = this.handleEquip(outputId);
          if (equipResult.success) {
            autoEquipMsg = ` Auto-equipped ${outputDef.name} (+${outputDef.warmthBonus} warmth).`;
          }
        }
      }
    }

    const skills = this.state.player.skills ?? { gathering: createDefaultSkill(), crafting: createDefaultSkill(), tech: createDefaultSkill() };
    this.state.player.skills = skills;
    const craftLevel = skills.crafting.level;
    const craftXP = 8 + craftLevel;
    const craftSkillMessages = addSkillXP(skills.crafting, craftXP);
    const staminaRestore = 5 + Math.floor(craftLevel / 2);
    this.state.player.stamina = Math.min(this.state.player.maxStamina, this.state.player.stamina + staminaRestore);
    if (skills.crafting.level % 5 === 0 && craftSkillMessages.length > 0) {
      this.state.player.maxStamina += 5;
    }

    const ageMessage = this.checkAgeAdvancement();

    const craftSkillMsg = craftSkillMessages.map(m => `Crafting ${m.toLowerCase()}`).join(' ');
    const parts = [`Crafted ${outputNames.join(', ')}.`];
    if (autoEquipMsg) parts.push(autoEquipMsg);
    if (ageMessage) parts.push(ageMessage);
    if (craftSkillMsg) parts.push(craftSkillMsg);

    return {
      success: true,
      message: parts.join(' '),
      stateChanges: {
        player: structuredClone(this.state.player),
        currentAge: this.state.currentAge,
      },
    };
  }

  private handleWait(): TurnResult {
    const timeOfDay = this.state.clock.timeOfDay;
    let restore = 2;
    let msg = 'Waited one turn.';
    if (timeOfDay === 'night' || timeOfDay === 'evening') {
      const sheltered = this.checkShelter();
      restore = sheltered ? 20 : 10;
      msg = sheltered ? 'Rested in shelter. Stamina restored greatly.' : 'Rested. Stamina restored.';
    }
    this.state.player.stamina = Math.min(this.state.player.maxStamina, this.state.player.stamina + restore);
    if (this.state.player.hunger < 30) {
      const foodItem = this.state.player.inventory.slots.find(
        s => s.item && FOOD_VALUES[s.item.id] !== undefined && s.quantity > 0
      );
      if (foodItem && foodItem.item) {
        const foodId = foodItem.item.id;
        const foodValue = FOOD_VALUES[foodId]!;
        this.removeFromInventory(foodId, 1);
        this.state.player.hunger = Math.min(100, this.state.player.hunger + foodValue);
        this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + 2);
        this.state.stats.totalFoodEaten++;
        msg += ` Ate ${foodId} (+${foodValue} hunger).`;
      }
    }
    return {
      success: true,
      message: msg,
      stateChanges: {
        player: structuredClone(this.state.player),
      },
    };
  }

  private handleEat(itemId: string): TurnResult {
    if (this.getInventoryCount(itemId) <= 0) {
      const itemDef = ITEMS[itemId];
      const name = itemDef ? itemDef.name : itemId;
      return {
        success: false,
        message: `Cannot eat: no ${name} in inventory.`,
        stateChanges: {},
      };
    }

    const foodValue = FOOD_VALUES[itemId];
    if (foodValue === undefined) {
      return {
        success: false,
        message: 'Cannot eat that.',
        stateChanges: {},
      };
    }

    this.removeFromInventory(itemId, 1);
    this.state.player.hunger = Math.min(100, this.state.player.hunger + foodValue);
    this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + 2);
    this.state.stats.totalFoodEaten++;

    return {
      success: true,
      message: `Ate ${itemId}. Hunger: ${this.state.player.hunger}/100.`,
      stateChanges: {
        player: structuredClone(this.state.player),
      },
    };
  }

  handleEquipToggle(): TurnResult {
    if (this.state.player.equippedClothing) {
      return this.handleUnequip();
    }
    let bestId: string | null = null;
    let bestBonus = 0;
    for (const slot of this.state.player.inventory.slots) {
      if (slot.item) {
        const def = ITEMS[slot.item.id];
        if (def?.warmthBonus && def.warmthBonus > bestBonus) {
          bestBonus = def.warmthBonus;
          bestId = slot.item.id;
        }
      }
    }
    if (!bestId) {
      return { success: false, message: 'No clothing in inventory to equip.', stateChanges: {} };
    }
    return this.handleEquip(bestId);
  }

  private handleEquip(itemId: string): TurnResult {
    const itemDef = ITEMS[itemId];
    if (!itemDef) {
      return { success: false, message: `Unknown item: ${itemId}.`, stateChanges: {} };
    }
    if (!itemDef.warmthBonus || itemDef.warmthBonus <= 0) {
      return { success: false, message: `${itemDef.name} is not equippable clothing.`, stateChanges: {} };
    }
    if (this.getInventoryCount(itemId) <= 0) {
      return { success: false, message: `No ${itemDef.name} in inventory.`, stateChanges: {} };
    }
    const currentClothing = this.state.player.equippedClothing;
    if (currentClothing) {
      const oldDef = ITEMS[currentClothing];
      const added = this.addToInventory(currentClothing, 1);
      if (!added) {
        return { success: false, message: `Cannot unequip ${oldDef?.name ?? currentClothing}: inventory full.`, stateChanges: {} };
      }
    }
    this.removeFromInventory(itemId, 1);
    this.state.player.equippedClothing = itemId;
    return {
      success: true,
      message: `Equipped ${itemDef.name}. Warmth bonus: +${itemDef.warmthBonus}.`,
      stateChanges: { player: structuredClone(this.state.player) },
    };
  }

  private handleUnequip(): TurnResult {
    const currentClothing = this.state.player.equippedClothing;
    if (!currentClothing) {
      return { success: false, message: 'No clothing equipped.', stateChanges: {} };
    }
    const added = this.addToInventory(currentClothing, 1);
    if (!added) {
      return { success: false, message: 'Cannot unequip: inventory full.', stateChanges: {} };
    }
    const oldDef = ITEMS[currentClothing];
    this.state.player.equippedClothing = null;
    return {
      success: true,
      message: `Unequipped ${oldDef?.name ?? currentClothing}.`,
      stateChanges: { player: structuredClone(this.state.player) },
    };
  }

  private handlePlace(itemId: string, target: Position): TurnResult {
    if (!this.isAdjacent(this.state.player.entity.position, target)) {
      return { success: false, message: `Cannot place: target (${target.x}, ${target.y}) is not adjacent.`, stateChanges: {} };
    }
    if (this.getInventoryCount(itemId) <= 0) {
      const itemDef = ITEMS[itemId];
      const name = itemDef ? itemDef.name : itemId;
      return { success: false, message: `Cannot place: no ${name} in inventory.`, stateChanges: {} };
    }
    const tile = this.getTileAt(target);
    if (!tile) {
      return { success: false, message: `Cannot place: target (${target.x}, ${target.y}) is out of bounds.`, stateChanges: {} };
    }
    if (!tile.walkable) {
      return { success: false, message: `Cannot place: tile at (${target.x}, ${target.y}) is not walkable.`, stateChanges: {} };
    }
    if (tile.type === TileType.Building) {
      return { success: false, message: `Cannot place: tile at (${target.x}, ${target.y}) already has a structure.`, stateChanges: {} };
    }
    this.removeFromInventory(itemId, 1);
    tile.type = TileType.Building;
    tile.resource = itemId;
    tile.walkable = false;
    tile.speedModifier = 0;
    const CLAY_RESISTANT = ['workbench', 'campfire', 'lean_to', 'kiln', 'smelter', 'anvil', 'workshop', 'blast_furnace', 'electric_furnace', 'launch_pad', 'auto_hammer', 'conveyor', 'combine_harvester', 'steam_engine', 'generator', 'chemistry_station', 'research_desk', 'irrigation_pump', 'electric_pump', 'solar_panel', 'stairs_down', 'stairs_up'];
    tile.durability = CLAY_RESISTANT.includes(itemId) ? -1 : 30;
    const itemDef = ITEMS[itemId];
    const name = itemDef ? itemDef.name : itemId;
    return {
      success: true,
      message: `Placed ${name} at (${target.x}, ${target.y}).`,
      stateChanges: {
        player: structuredClone(this.state.player),
      },
    };
  }

  private handleMount(targetId: string): TurnResult {
    if (this.state.player.mounted) {
      return {
        success: false,
        message: 'Already mounted.',
        stateChanges: {},
      };
    }

    const animal = this.state.animals.get(targetId);
    if (!animal) {
      return {
        success: false,
        message: 'No such animal nearby.',
        stateChanges: {},
      };
    }

    if (animal.species !== 'horse') {
      return {
        success: false,
        message: 'Only horses can be mounted.',
        stateChanges: {},
      };
    }

    if (!animal.tamed) {
      return {
        success: false,
        message: 'The horse is not tamed.',
        stateChanges: {},
      };
    }

    if (!this.isAdjacent(this.state.player.entity.position, animal.entity.position)) {
      return {
        success: false,
        message: 'The horse is not adjacent.',
        stateChanges: {},
      };
    }

    this.state.player.mounted = true;
    this.state.player.mountedAnimalId = targetId;
    animal.entity.position = { ...this.state.player.entity.position };

    return {
      success: true,
      message: 'You mount the horse.',
      stateChanges: {
        player: structuredClone(this.state.player),
      },
    };
  }

  private handleDismount(): TurnResult {
    if (!this.state.player.mounted) {
      return {
        success: false,
        message: 'Not mounted.',
        stateChanges: {},
      };
    }

    this.state.player.mounted = false;
    this.state.player.mountedAnimalId = null;

    return {
      success: true,
      message: 'You dismount.',
      stateChanges: {
        player: structuredClone(this.state.player),
      },
    };
  }

  private handleResearch(recipeId: string): TurnResult {
    const recipe = RECIPES[recipeId];
    if (!recipe) {
      return {
        success: false,
        message: `Cannot research: unknown recipe '${recipeId}'.`,
        stateChanges: {},
      };
    }

    if (this.state.unlockedRecipes.includes(recipeId)) {
      return {
        success: false,
        message: `Already researched ${recipe.name}.`,
        stateChanges: {},
      };
    }

    if (!this.checkAdjacentStation('research_desk')) {
      return {
        success: false,
        message: 'Cannot research: must be adjacent to a research desk.',
        stateChanges: {},
      };
    }

    if (this.getInventoryCount('research_notes') <= 0) {
      return {
        success: false,
        message: 'Cannot research: need research notes.',
        stateChanges: {},
      };
    }

    this.removeFromInventory('research_notes', 1);
    this.state.unlockedRecipes.push(recipeId);

    return {
      success: true,
      message: `Researched ${recipe.name}!`,
      stateChanges: {
        player: structuredClone(this.state.player),
        unlockedRecipes: [...this.state.unlockedRecipes],
      },
    };
  }

  private handleLaunch(): TurnResult {
    if (!this.checkAdjacentStation('launch_pad')) {
      return {
        success: false,
        message: 'Cannot launch: must be adjacent to a launch pad.',
        stateChanges: {},
      };
    }

    const ROCKET_COMPONENTS = ['rocket_engine', 'fuel_tank', 'guidance_system', 'heat_shield', 'capsule'];
    const missing: string[] = [];
    for (const comp of ROCKET_COMPONENTS) {
      if (this.getInventoryCount(comp) <= 0) {
        const def = ITEMS[comp];
        missing.push(def ? def.name : comp);
      }
    }
    if (this.getInventoryCount('rocket_fuel') < 3) {
      const have = this.getInventoryCount('rocket_fuel');
      missing.push(`Rocket Fuel (${have}/3)`);
    }

    if (missing.length > 0) {
      return {
        success: false,
        message: `Cannot launch: missing ${missing.join(', ')}.`,
        stateChanges: {},
      };
    }

    for (const comp of ROCKET_COMPONENTS) {
      this.removeFromInventory(comp, 1);
    }
    this.removeFromInventory('rocket_fuel', 3);

    this.state.gameWon = true;
    this.state.winMessage = `From a single stick to the stars! Turns: ${this.state.clock.turn} | Days: ${this.state.clock.day} | Season: ${this.state.clock.season} | Final Age: ${this.state.currentAge}`;

    return {
      success: true,
      message: 'LAUNCH SUCCESSFUL! From a stick to the stars!',
      stateChanges: {
        player: structuredClone(this.state.player),
        gameWon: true,
        winMessage: this.state.winMessage,
      },
    };
  }

  private handleEnterPersonalSpace(): TurnResult {
    if (this.state.gameContext === 'personal_space') {
      return { success: false, message: 'Already in Personal Space.', stateChanges: {} }
    }
    this.state.player.lastSurvivalPosition = { ...this.state.player.entity.position }
    this.state.player.entity.position = {
      x: this.state.personalSpace.spawnX,
      y: this.state.personalSpace.spawnY,
    }
    this.state.gameContext = 'personal_space'
    return {
      success: true,
      message: 'You step onto the teleporter pad and appear in your Personal Space.',
      stateChanges: { player: structuredClone(this.state.player) },
    }
  }

  private transitionThroughFurniture(targetRoomId: string): TurnResult {
    if (targetRoomId === 'void_world') {
      this.state.gameContext = 'void_world'
      this.state.player.entity.position = { ...VOID_STUB_POSITION }
      return {
        success: true,
        message: 'You step into the yawning maw. Darkness swallows you — you are in THE VOID.',
        stateChanges: {
          player: structuredClone(this.state.player),
        },
      }
    }

    const targetRoom = this.state.personalSpaces.get(targetRoomId)
    if (!targetRoom) {
      return {
        success: false,
        message: 'The door leads nowhere.',
        stateChanges: {},
      }
    }

    this.state.currentPersonalSpaceId = targetRoomId
    this.state.personalSpace = targetRoom
    this.state.player.entity.position = {
      x: targetRoom.spawnX,
      y: targetRoom.spawnY,
    }
    return {
      success: true,
      message: `You step through into ${targetRoom.name}.`,
      stateChanges: {
        player: structuredClone(this.state.player),
        personalSpace: structuredClone(this.state.personalSpace),
      },
    }
  }

  private handleExitPersonalSpace(): TurnResult {
    if (this.state.gameContext === 'void_world') {
      const caveRoom = this.state.personalSpaces.get('cave')
      if (caveRoom) {
        this.state.personalSpace = caveRoom
      }
      this.state.currentPersonalSpaceId = 'cave'
      this.state.gameContext = 'personal_space'
      this.state.player.entity.position = {
        x: this.state.personalSpace.spawnX,
        y: this.state.personalSpace.spawnY,
      }
      return {
        success: true,
        message: 'You climb back out of the void, into the Cave.',
        stateChanges: {
          player: structuredClone(this.state.player),
          personalSpace: structuredClone(this.state.personalSpace),
          currentPersonalSpaceId: 'cave',
        },
      }
    }
    if (this.state.gameContext !== 'personal_space') {
      return { success: false, message: 'Not in Personal Space.', stateChanges: {} }
    }
    if (this.state.player.lastSurvivalPosition) {
      this.state.player.entity.position = { ...this.state.player.lastSurvivalPosition }
    }
    this.state.player.lastSurvivalPosition = null
    this.state.gameContext = 'survival'
    return {
      success: true,
      message: 'You step through the portal and return to the world.',
      stateChanges: { player: structuredClone(this.state.player) },
    }
  }

  private handleDescend(): TurnResult {
    if (this.state.gameContext !== 'survival') {
      return { success: false, message: 'Can only descend from the surface.', stateChanges: {} }
    }
    const playerPos = this.state.player.entity.position
    let foundStairs = false
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tile = this.getTileAt({ x: playerPos.x + dx, y: playerPos.y + dy })
        if (tile && tile.type === TileType.Building && tile.resource === 'stairs_down') {
          foundStairs = true
          break
        }
      }
      if (foundStairs) break
    }
    if (!foundStairs) {
      return { success: false, message: 'No stairs down nearby.', stateChanges: {} }
    }
    this.state.player.lastSurfacePosition = { ...playerPos }
    this.state.gameContext = 'underground'
    this.state.player.currentDepth = -1
    if (this.worldGen) {
      this.worldGen.ensureUndergroundChunks(this.state, 1)
    }
    const { cx, cy } = worldToChunk(playerPos.x, playerPos.y)
    const ck = chunkKey(cx, cy)
    const chunkCenter = {
      x: cx * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2),
      y: cy * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2),
    }
    this.state.player.entity.position = chunkCenter
    this.state.underground.discoveredChunks.add(ck)
    return {
      success: true,
      message: 'You descend underground.',
      stateChanges: { player: structuredClone(this.state.player) },
    }
  }

  private handleAscend(): TurnResult {
    if (this.state.gameContext !== 'underground') {
      return { success: false, message: 'You are not underground.', stateChanges: {} }
    }
    const playerPos = this.state.player.entity.position
    let foundStairs = false
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tile = this.getTileAt({ x: playerPos.x + dx, y: playerPos.y + dy })
        if (tile && (tile.type === TileType.StairsUp || (tile.type === TileType.Building && tile.resource === 'stairs_up'))) {
          foundStairs = true
          break
        }
      }
      if (foundStairs) break
    }
    if (!foundStairs) {
      return { success: false, message: 'No stairs up nearby.', stateChanges: {} }
    }
    if (this.state.player.lastSurfacePosition) {
      this.state.player.entity.position = { ...this.state.player.lastSurfacePosition }
    }
    this.state.player.lastSurfacePosition = null
    this.state.gameContext = 'survival'
    this.state.player.currentDepth = 0
    return {
      success: true,
      message: 'You ascend to the surface.',
      stateChanges: { player: structuredClone(this.state.player) },
    }
  }

  private handleProspect(): TurnResult {
    if (this.state.gameContext !== 'survival') {
      return { success: false, message: 'You can only prospect on the surface.', stateChanges: {} }
    }
    if (!this.state.discoveredTechs.includes('prospecting')) {
      return { success: false, message: 'You lack the knowledge to prospect.', stateChanges: {} }
    }
    const hasTool = this.state.player.inventory.slots.some(
      s => s.item && (s.item.id.includes('stone') || s.item.id.includes('iron')) && ITEMS[s.item.id]?.category === 'tool'
    )
    if (!hasTool) {
      return { success: false, message: 'You need a stone or iron tool to prospect.', stateChanges: {} }
    }
    const biome = this.getPlayerBiome()
    let message = ''
    switch (biome) {
      case 'mountain':
        message = 'You sense rich copper and iron ore deposits below!'
        break
      case 'forest':
        message = 'You detect coal seams and clay deposits beneath the soil.'
        break
      case 'plains':
        message = 'Mixed mineral traces — some copper, some iron below.'
        break
      case 'desert':
        message = 'Deep iron deposits, but sparse. The rock runs deep.'
        break
      case 'swamp':
        message = 'Heavy clay and coal deposits below the muck.'
        break
      default:
        message = 'The ground here doesn\'t reveal much.'
        break
    }
    return { success: true, message, stateChanges: {} }
  }

  private handleDrop(slotIndex: number, quantity: number): TurnResult {
    const inv = this.state.player.inventory;
    if (slotIndex < 0 || slotIndex >= inv.maxSlots) {
      return { success: false, message: 'Invalid slot.', stateChanges: {} };
    }
    const slot = inv.slots[slotIndex];
    if (!slot || !slot.item) {
      return { success: false, message: 'Nothing in that slot.', stateChanges: {} };
    }
    const itemName = slot.item.name;
    const dropQty = quantity === -1 ? slot.quantity : Math.min(quantity, slot.quantity);
    if (dropQty >= slot.quantity) {
      slot.item = null;
      slot.quantity = 0;
    } else {
      slot.quantity -= dropQty;
    }
    return {
      success: true,
      message: `Dropped ${dropQty} ${itemName}.`,
      stateChanges: { player: structuredClone(this.state.player) },
    };
  }

  private handlePlaceFurniture(furnitureType: string, target: Position): TurnResult {
    if (this.state.gameContext !== 'personal_space') {
      return { success: false, message: 'Can only place furniture in Personal Space.', stateChanges: {} }
    }
    const room = this.state.personalSpace
    if (target.y < 0 || target.y >= room.grid.length || target.x < 0 || target.x >= room.grid[0].length) {
      return { success: false, message: 'Out of bounds.', stateChanges: {} }
    }
    const tile = room.grid[target.y][target.x]
    if (tile === 'wall' || tile === 'wall_brick' || tile === 'empty') {
      return { success: false, message: 'Cannot place furniture here.', stateChanges: {} }
    }
    const furnId = `furn_${Date.now()}`
    room.furniture.push({
      id: furnId,
      tileX: target.x,
      tileY: target.y,
      type: furnitureType,
    })
    if (furnitureType === 'chest') {
      room.chests.push({
        id: furnId,
        roomPosition: { tileX: target.x, tileY: target.y },
        capacity: 20,
        slots: [],
      })
    }
    return {
      success: true,
      message: `Placed ${furnitureType}.`,
      stateChanges: {},
    }
  }

  private handlePlaceCollectible(itemId: string, target: Position): TurnResult {
    if (this.state.gameContext !== 'personal_space') {
      return { success: false, message: 'Can only place collectibles in Personal Space.', stateChanges: {} }
    }
    const display = this.state.personalSpace.collectibleDisplays.find(
      d => d.tileX === target.x && d.tileY === target.y
    )
    if (!display) {
      return { success: false, message: 'No display stand at this position.', stateChanges: {} }
    }
    if (display.itemId) {
      return { success: false, message: 'Display already has an item.', stateChanges: {} }
    }
    if (!this.removeFromInventory(itemId, 1)) {
      return { success: false, message: 'You don\'t have that item.', stateChanges: {} }
    }
    display.itemId = itemId
    return {
      success: true,
      message: `Placed ${itemId} on display.`,
      stateChanges: { player: structuredClone(this.state.player) },
    }
  }

  private handleOpenChest(chestId: string): TurnResult {
    if (this.state.gameContext !== 'personal_space') {
      return { success: false, message: 'Can only open chests in Personal Space.', stateChanges: {} }
    }
    const chest = this.state.personalSpace.chests.find(c => c.id === chestId)
    if (!chest) {
      return { success: false, message: 'Chest not found.', stateChanges: {} }
    }
    return {
      success: true,
      message: `Opened chest (${chest.slots.length}/${chest.capacity} slots used).`,
      stateChanges: { personalSpace: structuredClone(this.state.personalSpace) },
    }
  }

  private handleTransferToChest(chestId: string, itemId: string, quantity: number): TurnResult {
    if (this.state.gameContext !== 'personal_space') {
      return { success: false, message: 'Can only use chests in Personal Space.', stateChanges: {} }
    }
    const chest = this.state.personalSpace.chests.find(c => c.id === chestId)
    if (!chest) {
      return { success: false, message: 'Chest not found.', stateChanges: {} }
    }
    if (this.getInventoryCount(itemId) < quantity) {
      return { success: false, message: 'Not enough items in inventory.', stateChanges: {} }
    }
    const existingSlot = chest.slots.find(s => s.itemId === itemId)
    if (existingSlot) {
      existingSlot.quantity += quantity
    } else {
      if (chest.slots.length >= chest.capacity) {
        return { success: false, message: 'Chest is full.', stateChanges: {} }
      }
      chest.slots.push({ itemId, quantity })
    }
    this.removeFromInventory(itemId, quantity)
    const name = ITEMS[itemId]?.name ?? itemId
    return {
      success: true,
      message: `Stored ${quantity} ${name} in chest.`,
      stateChanges: {
        player: structuredClone(this.state.player),
        personalSpace: structuredClone(this.state.personalSpace),
      },
    }
  }

  private handleTransferFromChest(chestId: string, itemId: string, quantity: number): TurnResult {
    if (this.state.gameContext !== 'personal_space') {
      return { success: false, message: 'Can only use chests in Personal Space.', stateChanges: {} }
    }
    const chest = this.state.personalSpace.chests.find(c => c.id === chestId)
    if (!chest) {
      return { success: false, message: 'Chest not found.', stateChanges: {} }
    }
    const slot = chest.slots.find(s => s.itemId === itemId)
    if (!slot || slot.quantity < quantity) {
      return { success: false, message: 'Not enough items in chest.', stateChanges: {} }
    }
    if (!this.addToInventory(itemId, quantity)) {
      return { success: false, message: 'Inventory is full.', stateChanges: {} }
    }
    slot.quantity -= quantity
    if (slot.quantity <= 0) {
      chest.slots.splice(chest.slots.indexOf(slot), 1)
    }
    const name = ITEMS[itemId]?.name ?? itemId
    return {
      success: true,
      message: `Took ${quantity} ${name} from chest.`,
      stateChanges: {
        player: structuredClone(this.state.player),
        personalSpace: structuredClone(this.state.personalSpace),
      },
    }
  }

  private updateMountedAnimalPosition(): void {
    if (!this.state.player.mountedAnimalId) return;
    const animal = this.state.animals.get(this.state.player.mountedAnimalId);
    if (animal) {
      animal.entity.position = { ...this.state.player.entity.position };
    }
  }

  private checkShelter(): boolean {
    const pos = this.state.player.entity.position;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tile = this.getTileAt({ x: pos.x + dx, y: pos.y + dy });
        if (tile && tile.type === TileType.Building && tile.resource === 'lean_to') {
          return true;
        }
      }
    }
    return false;
  }

  private checkAdjacentStation(stationId: string): boolean {
    const pos = this.state.player.entity.position;
    const validStations = stationId === 'workbench' ? ['workbench', 'workshop']
      : stationId === 'anvil' ? ['anvil']
      : stationId === 'smelter' ? ['smelter', 'blast_furnace']
      : stationId === 'generator' ? ['generator']
      : stationId === 'electric_furnace' ? ['electric_furnace', 'chemistry_station']
      : stationId === 'chemistry_station' ? ['chemistry_station']
      : stationId === 'research_desk' ? ['research_desk']
      : stationId === 'launch_pad' ? ['launch_pad']
      : [stationId];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tile = this.getTileAt({ x: pos.x + dx, y: pos.y + dy });
        if (tile && tile.type === TileType.Building && tile.resource && validStations.includes(tile.resource)) {
          return true;
        }
      }
    }
    return false;
  }

  private getAdjacentBuildingTypes(): string[] {
    const pos = this.state.player.entity.position;
    const types: string[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tile = this.getTileAt({ x: pos.x + dx, y: pos.y + dy });
        if (tile && tile.type === TileType.Building && tile.resource) {
          types.push(tile.resource);
        }
      }
    }
    return types;
  }

  private getPlayerBiome(): Biome {
    const pos = this.state.player.entity.position;
    const { cx, cy } = worldToChunk(pos.x, pos.y);
    const key = chunkKey(cx, cy);
    const chunk = this.getActiveChunks().get(key);
    return chunk?.biome ?? 'plains';
  }

  private hasAdjacentWater(): boolean {
    const pos = this.state.player.entity.position;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tile = this.getTileAt({ x: pos.x + dx, y: pos.y + dy });
        if (tile && tile.type === TileType.Water) {
          return true;
        }
      }
    }
    return false;
  }

  private processTemperature(): void {
    let temp = this.state.temperature;
    const adjacent = this.getAdjacentBuildingTypes();
    const biome = this.getPlayerBiome();
    const time = this.state.clock.timeOfDay;

    const MAX_STATION_HEAT = 15;
    let stationHeat = 0;

    if (adjacent.includes('campfire')) {
      if (temp > 70) {
        stationHeat -= 5;
      } else {
        stationHeat += 8;
      }
    }
    if (adjacent.includes('kiln')) stationHeat += 6;
    if (adjacent.includes('smelter') || adjacent.includes('blast_furnace') || adjacent.includes('electric_furnace')) stationHeat += 10;
    if (adjacent.includes('steam_engine')) stationHeat += 5;
    if (adjacent.includes('lean_to')) stationHeat += 3;
    if (adjacent.includes('building')) stationHeat += 5;
    temp += Math.min(stationHeat, MAX_STATION_HEAT);

    if (time === 'dawn' || time === 'morning' || time === 'midday' || time === 'afternoon') {
      temp += 2;
    }

    if (time === 'evening') temp -= 3;
    if (time === 'night') temp -= 5;

    if (biome === 'mountain') temp -= 3;
    if (biome === 'desert' && time === 'midday') temp += 5;
    if (this.hasAdjacentWater()) temp -= 1;

    temp += WEATHER_TEMP_MODIFIERS[this.state.clock.weather];
    temp += SEASON_TEMP_MODIFIERS[this.state.clock.season];

    if (this.state.player.equippedClothing) {
      const clothingItem = ITEMS[this.state.player.equippedClothing];
      if (clothingItem?.warmthBonus) {
        const bonus = clothingItem.warmthBonus;
        if (temp < 50) {
          temp += bonus;
        } else if (temp > 50) {
          temp -= Math.floor(bonus * 0.6);
        }
      }
    }

    if (temp < 50) {
      temp += Math.ceil((50 - temp) / 10);
    } else if (temp > 50) {
      temp -= Math.ceil((temp - 50) / 10);
    }

    temp = Math.max(0, Math.min(100, temp));
    this.state.temperature = temp;

    if (temp < 5) {
      this.state.player.hunger = Math.max(0, this.state.player.hunger - 2);
      this.state.player.stamina = Math.max(0, this.state.player.stamina - 2);
    } else if (temp < 15) {
      this.state.player.stamina = Math.max(0, this.state.player.stamina - 1);
    }
    if (temp > 95) {
      const severity = Math.floor((temp - 95) / 2) + 1;
      this.state.player.stamina = Math.max(0, this.state.player.stamina - severity);
      this.state.player.hunger = Math.max(0, this.state.player.hunger - severity);
    } else if (temp > 85) {
      this.state.player.stamina = Math.max(0, this.state.player.stamina - 1);
    }

    if (temp < 5) {
      this.lastTemperatureMessage = 'You are freezing!';
    } else if (temp < 15) {
      this.lastTemperatureMessage = 'You feel cold.';
    } else if (temp > 95) {
      this.lastTemperatureMessage = 'The heat is scorching!';
    } else if (temp > 85) {
      this.lastTemperatureMessage = 'It\'s getting hot.';
    } else {
      this.lastTemperatureMessage = '';
    }
  }

  private processHealth(): void {
    const player = this.state.player;

    if (player.stamina === 0) {
      player.exhaustionTurns++;
    } else {
      player.exhaustionTurns = 0;
    }

    if (player.hunger === 0) {
      player.starvationTurns++;
    } else {
      player.starvationTurns = 0;
    }

    let damage = 0;

    if (this.state.temperature < 3) {
      damage += 2;
    }
    if (this.state.temperature > 97) {
      damage += 2;
    }
    if (player.exhaustionTurns >= 5) {
      damage += 1;
    }
    if (player.starvationTurns >= 10) {
      damage += 3;
    }

    if (damage > 0) {
      player.health = Math.max(0, player.health - damage);
    }

    if (damage === 0 && player.hunger > 150 && player.stamina > 150) {
      player.health = Math.min(player.maxHealth, player.health + 1);
    }

    if (player.health <= 0) {
      player.health = 0;
      this.state.gameOver = true;
      this.lastHealthMessage = 'You have perished. Your body could not endure.';
      this.state.lastActionResult = {
        success: true,
        message: 'You have perished. Your body could not endure.',
        stateChanges: {},
      };
      return;
    }

    if (player.health < 10) {
      this.lastHealthMessage = `CRITICAL: Health at ${player.health}!`;
    } else if (player.health < 20) {
      this.lastHealthMessage = 'Your health is failing!';
    } else {
      this.lastHealthMessage = '';
    }
  }

  private isHeatSourceBuilding(resource: string): boolean {
    return resource === 'campfire' || resource === 'smelter'
      || resource === 'blast_furnace' || resource === 'electric_furnace'
      || resource === 'steam_engine';
  }

  private hasNearbyHeatSource(x: number, y: number, radius: number): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tile = this.getTileAt({ x: x + dx, y: y + dy });
        if (tile && tile.type === TileType.Building && tile.resource && this.isHeatSourceBuilding(tile.resource)) {
          return true;
        }
      }
    }
    return false;
  }

  private findSafeSpawnPosition(startX: number, startY: number): Position {
    const visited = new Set<string>();
    const queue: Array<Position> = [{ x: startX, y: startY }];
    let firstWalkable: Position | null = null;

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const key = `${pos.x},${pos.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const tile = this.getTileAt(pos);
      if (tile && tile.walkable && tile.type !== TileType.Building) {
        if (!this.hasNearbyHeatSource(pos.x, pos.y, 2)) {
          return pos;
        }
        if (!firstWalkable) {
          firstWalkable = pos;
        }
      }

      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = pos.x + dx;
        const ny = pos.y + dy;
        if (!visited.has(`${nx},${ny}`)) {
          queue.push({ x: nx, y: ny });
        }
      }

      if (visited.size > 500) break;
    }

    if (firstWalkable) return firstWalkable;
    return { x: startX + 3, y: startY + 3 };
  }

  respawnAtCampfire(): void {
    let nearestCampfire: Position | null = null;
    let nearestDist = Infinity;
    const px = this.state.player.entity.position.x;
    const py = this.state.player.entity.position.y;
    for (const chunk of this.state.world.chunks.values()) {
      for (const row of chunk.tiles) {
        for (const tile of row) {
          if (tile.type === TileType.Building && tile.resource === 'campfire') {
            const dist = Math.abs(tile.position.x - px) + Math.abs(tile.position.y - py);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestCampfire = { x: tile.position.x, y: tile.position.y };
            }
          }
        }
      }
    }
    const rawSpawn = nearestCampfire ?? { x: px, y: py };
    const safeSpawn = this.findSafeSpawnPosition(rawSpawn.x, rawSpawn.y);
    this.state.player.entity.position = safeSpawn;
    this.state.player.health = Math.floor(this.state.player.maxHealth * 0.5);
    this.state.player.hunger = 150;
    this.state.player.stamina = 150;
    this.state.gameOver = false;
    this.state.gameContext = 'survival';
    this.state.player.currentDepth = 0;
    this.lastHealthMessage = '';
    this.state.lastActionResult = {
      success: true,
      message: nearestCampfire ? 'You respawn near a campfire, battered but alive.' : 'You awaken, battered but alive.',
      stateChanges: {},
    };
  }

  private handleUse(itemId: string, target: Position): TurnResult {
    if (!this.isAdjacent(this.state.player.entity.position, target)) {
      return { success: false, message: `Cannot use item: target (${target.x}, ${target.y}) is not adjacent.`, stateChanges: {} };
    }
    if (this.getInventoryCount(itemId) <= 0) {
      const itemDef = ITEMS[itemId];
      const name = itemDef ? itemDef.name : itemId;
      return { success: false, message: `Cannot use: no ${name} in inventory.`, stateChanges: {} };
    }
    return { success: false, message: `Cannot use ${itemId}: no known use for this item yet.`, stateChanges: {} };
  }

  private handleInteract(targetId: string): TurnResult {
    const npc = this.state.npcs.get(targetId);
    if (!npc) {
      if (this.state.gameContext === 'personal_space') {
        const playerPos = this.state.player.entity.position;
        const portals = this.state.personalSpace.furniture.filter(f => f.targetRoomId);
        if (portals.length > 0) {
          const near = portals.find(
            f => Math.abs(playerPos.x - f.tileX) <= 1 && Math.abs(playerPos.y - f.tileY) <= 1
          );
          if (near && near.targetRoomId) {
            return this.transitionThroughFurniture(near.targetRoomId);
          }
          return {
            success: false,
            message: 'Too far away to interact.',
            stateChanges: {},
          };
        }
      }
      return {
        success: false,
        message: 'No NPC with that ID nearby.',
        stateChanges: {},
      };
    }

    if (!this.isAdjacent(this.state.player.entity.position, npc.entity.position)) {
      return {
        success: false,
        message: 'Not close enough to interact.',
        stateChanges: {},
      };
    }

    if (!this.state.stats.totalNPCsInteracted.includes(npc.entity.id)) {
      this.state.stats.totalNPCsInteracted.push(npc.entity.id);
    }

    return {
      success: true,
      message: `Started conversation with ${npc.entity.name}.`,
      stateChanges: {},
    };
  }

  private getFlatTiles(): { tiles: Tile[][]; width: number; height: number; originX: number; originY: number } {
    const chunks = this.getActiveChunks();
    if (chunks.size === 0) {
      return { tiles: [], width: 0, height: 0, originX: 0, originY: 0 };
    }

    let minCX = Infinity;
    let minCY = Infinity;
    let maxCX = -Infinity;
    let maxCY = -Infinity;

    for (const chunk of chunks.values()) {
      if (chunk.coord.cx < minCX) minCX = chunk.coord.cx;
      if (chunk.coord.cy < minCY) minCY = chunk.coord.cy;
      if (chunk.coord.cx > maxCX) maxCX = chunk.coord.cx;
      if (chunk.coord.cy > maxCY) maxCY = chunk.coord.cy;
    }

    const originX = minCX * CHUNK_SIZE;
    const originY = minCY * CHUNK_SIZE;
    const width = (maxCX - minCX + 1) * CHUNK_SIZE;
    const height = (maxCY - minCY + 1) * CHUNK_SIZE;

    const tiles: Tile[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        const wx = originX + x;
        const wy = originY + y;
        const { cx, cy } = worldToChunk(wx, wy);
        const key = chunkKey(cx, cy);
        const chunk = chunks.get(key);
        if (chunk) {
          const local = worldToLocal(wx, wy);
          const chunkRow = chunk.tiles[local.y];
          const tile = chunkRow ? chunkRow[local.x] : undefined;
          if (tile) {
            row.push(tile);
            continue;
          }
        }
        row.push({
          type: TileType.Grass,
          position: { x: wx, y: wy },
          resource: null,
          walkable: true,
          speedModifier: 1,
          toolRequired: null,
          durability: -1,
        });
      }
      tiles.push(row);
    }

    return { tiles, width, height, originX, originY };
  }

  private advanceClock(): void {
    if (this.state.gameContext === 'personal_space' || this.state.gameContext === 'void_world') {
      return;
    }
    const clock = this.state.clock;
    clock.turn += 1;

    const isUnderground = this.state.gameContext === 'underground';

    const periodIndex = clock.turn % TURNS_PER_DAY;
    const period = TIME_PERIODS[periodIndex];
    if (period !== undefined) {
      clock.timeOfDay = period;
    }

    if (periodIndex === 0 && clock.turn > 0) {
      clock.day += 1;

      if (clock.day > DAYS_PER_SEASON) {
        clock.day = 1;
        const currentSeasonIndex = SEASONS.indexOf(clock.season);
        const nextSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
        const nextSeason = SEASONS[nextSeasonIndex];
        if (nextSeason !== undefined) {
          clock.season = nextSeason;
        }
      }

      if (!isUnderground) {
        clock.weather = this.rollWeather();
      }
    }

    if (this.worldGen) {
      if (isUnderground) {
        this.worldGen.ensureUndergroundChunks(this.state, 1);
      } else {
        this.worldGen.ensureChunksAroundPlayer(this.state, 2);
      }
    }

    if (!isUnderground) {
      const { tiles, width, height, originX, originY } = this.getFlatTiles();
      executeNPCSchedule(this.state, tiles, width, height, originX, originY);
      this.processRegrowth();
      this.processWeatherDegradation();
    }
    this.processUndergroundRegrowth();

    if (isUnderground) {
      let temp = 45;
      if (this.state.player.equippedClothing) {
        const clothingItem = ITEMS[this.state.player.equippedClothing];
        if (clothingItem?.warmthBonus) {
          const bonus = clothingItem.warmthBonus;
          if (temp < 50) {
            temp += bonus;
          } else if (temp > 50) {
            temp -= Math.floor(bonus * 0.6);
          }
        }
      }
      this.state.temperature = Math.max(0, Math.min(100, temp));
    } else {
      this.processTemperature();
    }
    this.processHealth();

    const isNight = this.state.clock.timeOfDay === 'night';
    const hasShelter = this.checkShelter();
    let hungerDrain = 1;
    if (isNight && !hasShelter) {
      hungerDrain = 2;
    } else if (isNight && hasShelter) {
      hungerDrain = 0;
    }
    this.state.player.hunger = Math.max(0, this.state.player.hunger - hungerDrain);
    if (this.state.player.hunger === 0) {
      this.state.player.stamina = Math.max(0, this.state.player.stamina - 3);
    }

    this.state.player.stamina = Math.min(this.state.player.maxStamina, this.state.player.stamina + 3);

    if (clock.turn % 3 === 0 && !isUnderground) {
      const pos = this.state.player.entity.position;
      let foundBush = false;
      for (let dy = -1; dy <= 1 && !foundBush; dy++) {
        for (let dx = -1; dx <= 1 && !foundBush; dx++) {
          if (dx === 0 && dy === 0) continue;
          const tile = this.getTileAt({ x: pos.x + dx, y: pos.y + dy });
          if (tile && tile.type === TileType.BerryBush && tile.resource) {
            this.state.player.hunger = Math.min(this.state.player.maxHunger, this.state.player.hunger + 1);
            foundBush = true;
          }
        }
      }
    }

    if (clock.turn % 5 === 0 && this.state.player.skills) {
      const techLevel = this.state.player.skills.tech.level;
      const passiveRegen = 1 + Math.floor(techLevel / 5);
      this.state.player.hunger = Math.min(this.state.player.maxHunger, this.state.player.hunger + passiveRegen);
      this.state.player.stamina = Math.min(this.state.player.maxStamina, this.state.player.stamina + passiveRegen);
    }

    const timeNow = this.state.clock.timeOfDay;
    if (this.state.clock.season === 'winter' && !hasShelter && (timeNow === 'night' || timeNow === 'evening')) {
      this.state.player.stamina = Math.max(0, this.state.player.stamina - 3);
      this.state.lastActionResult = {
        success: true,
        message: 'The cold saps your strength.',
        stateChanges: {},
      };
    }

    if (periodIndex === 0 && clock.turn > 0 && this.state.player.stamina > 0) {
      if (this.state.player.stamina < 30) {
        this.state.lastActionResult = {
          success: true,
          message: 'The cold kept you awake — stamina low.',
          stateChanges: {},
        };
      } else {
        this.state.lastActionResult = {
          success: true,
          message: 'You survived the night.',
          stateChanges: {},
        };
      }
    }
  }

  private isAdjacent(a: Position, b: Position): boolean {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx <= 1 && dy <= 1 && (dx + dy > 0);
  }

  private getActiveChunks(): Map<string, Chunk> {
    return this.state.gameContext === 'underground'
      ? this.state.underground.chunks
      : this.state.world.chunks;
  }

  // Extended movement · THE-PATH-USES-ENGINE-TRUTH. Pathfinding MUST ask the same question movement
  // asks, or a traced path will confidently route through tiles the engine then refuses. Note this
  // resolves against the OVERWORLD CHUNKS (not room.grid) — the non-obvious fact a client-side
  // walkability guess would have gotten wrong.
  public isWalkableAt(pos: Position): boolean {
    const tile = this.getTileAt(pos);
    if (!tile || !tile.walkable) return false;
    return this.personalSpaceBlockedBy(pos) === null;
  }

  // THE-ROOM-GRID-IS-THE-WALL-TRUTH. Personal-space movement validated ONLY against the overworld
  // chunk (which stays walkable beneath a drawn wall) and the door furniture — it never consulted
  // room.grid, so the player could walk straight onto WALL tiles and out past the room footprint.
  // This is the single rule both handleMove and isWalkableAt now ask, so a traced path can never
  // disagree with what movement permits.
  private personalSpaceBlockedBy(pos: Position): string | null {
    if (this.state.gameContext !== 'personal_space') return null;
    const room = this.state.personalSpace;
    if (!room || !room.grid || room.grid.length === 0) return null;
    if (pos.y < 0 || pos.y >= room.grid.length) return 'the room edge';
    const row = room.grid[pos.y];
    if (!row || pos.x < 0 || pos.x >= row.length) return 'the room edge';
    const t = row[pos.x];
    if (t === 'wall' || t === 'wall_brick') return 'a wall';
    if (t === 'empty') return 'the void beyond the room';
    return null;
  }

  private getTileAt(pos: Position): Tile | null {
    const { cx, cy } = worldToChunk(pos.x, pos.y);
    const key = chunkKey(cx, cy);
    const chunk = this.getActiveChunks().get(key);
    if (!chunk) return null;
    const local = worldToLocal(pos.x, pos.y);
    const row = chunk.tiles[local.y];
    if (!row) return null;
    return row[local.x] ?? null;
  }

  private getDirectionOffset(dir: Direction): Position {
    return DIRECTION_OFFSETS[dir] ?? { x: 0, y: 0 };
  }

  private addToInventory(itemId: string, quantity: number): boolean {
    const itemDef = ITEMS[itemId];
    if (!itemDef) {
      return false;
    }

    const item: Item = {
      id: itemDef.id,
      name: itemDef.name,
      stackable: itemDef.stackable,
      maxStack: itemDef.maxStack,
      category: itemDef.category,
    };

    let remaining = quantity;
    const slots = this.state.player.inventory.slots;

    if (item.stackable) {
      for (const slot of slots) {
        if (remaining <= 0) break;
        if (slot.item && slot.item.id === itemId) {
          const space = item.maxStack - slot.quantity;
          const toAdd = Math.min(remaining, space);
          slot.quantity += toAdd;
          remaining -= toAdd;
        }
      }
    }

    while (remaining > 0) {
      const emptySlot = slots.find(s => s.item === null);
      if (!emptySlot) {
        return false;
      }
      const toAdd = item.stackable ? Math.min(remaining, item.maxStack) : 1;
      emptySlot.item = { ...item };
      emptySlot.quantity = toAdd;
      remaining -= toAdd;
    }

    return true;
  }

  private removeFromInventory(itemId: string, quantity: number): boolean {
    let remaining = quantity;
    const slots = this.state.player.inventory.slots;

    const matchingSlots = slots.filter(s => s.item && s.item.id === itemId);
    let available = 0;
    for (const slot of matchingSlots) {
      available += slot.quantity;
    }
    if (available < quantity) {
      return false;
    }

    for (const slot of matchingSlots) {
      if (remaining <= 0) break;
      const toRemove = Math.min(remaining, slot.quantity);
      slot.quantity -= toRemove;
      remaining -= toRemove;
      if (slot.quantity <= 0) {
        slot.item = null;
        slot.quantity = 0;
      }
    }

    return true;
  }

  private getInventoryCount(itemId: string): number {
    let count = 0;
    for (const slot of this.state.player.inventory.slots) {
      if (slot.item && slot.item.id === itemId) {
        count += slot.quantity;
      }
    }
    return count;
  }

  private getInventoryAsRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    for (const slot of this.state.player.inventory.slots) {
      if (slot.item) {
        record[slot.item.id] = (record[slot.item.id] ?? 0) + slot.quantity;
      }
    }
    return record;
  }

  private checkAgeAdvancement(): string | null {
    const previous = this.state.currentAge;

    if (previous === AgeEnum.Gathering) {
      const hasStoneToolInInventory = STONE_TOOLS.some(
        toolId => this.getInventoryCount(toolId) > 0
      );
      if (hasStoneToolInInventory) {
        this.state.currentAge = AgeEnum.Stone;
        this.state.player.currentAge = AgeEnum.Stone;
      }
    } else if (previous === AgeEnum.Stone) {
      if (this.getInventoryCount('workbench') > 0) {
        this.state.currentAge = AgeEnum.Wood;
        this.state.player.currentAge = AgeEnum.Wood;
      }
    } else if (previous === AgeEnum.Wood) {
      if (this.getInventoryCount('kiln') > 0) {
        this.state.currentAge = AgeEnum.Clay;
        this.state.player.currentAge = AgeEnum.Clay;
      }
    } else if (previous === AgeEnum.Clay) {
      if (this.getInventoryCount('smelter') > 0) {
        this.state.currentAge = AgeEnum.Copper;
        this.state.player.currentAge = AgeEnum.Copper;
      }
    } else if (previous === AgeEnum.Copper) {
      if (this.getInventoryCount('anvil') > 0) {
        this.state.currentAge = AgeEnum.Iron;
        this.state.player.currentAge = AgeEnum.Iron;
      }
    } else if (previous === AgeEnum.Iron) {
      if (this.getInventoryCount('steam_engine') > 0) {
        this.state.currentAge = AgeEnum.Steam;
        this.state.player.currentAge = AgeEnum.Steam;
      }
    } else if (previous === AgeEnum.Steam) {
      if (this.getInventoryCount('generator') > 0) {
        this.state.currentAge = AgeEnum.Electric;
        this.state.player.currentAge = AgeEnum.Electric;
      }
    } else if (previous === AgeEnum.Electric) {
      if (this.getInventoryCount('electric_furnace') > 0) {
        this.state.currentAge = AgeEnum.Chemical;
        this.state.player.currentAge = AgeEnum.Chemical;
      }
    } else if (previous === AgeEnum.Chemical) {
      if (this.getInventoryCount('launch_pad') > 0) {
        this.state.currentAge = AgeEnum.Rocket;
        this.state.player.currentAge = AgeEnum.Rocket;
      }
    }

    if (this.state.currentAge !== previous) {
      if (!this.state.stats.agesReached.includes(this.state.currentAge)) {
        this.state.stats.agesReached.push(this.state.currentAge);
      }
      const skills = this.state.player.skills ?? { gathering: createDefaultSkill(), crafting: createDefaultSkill(), tech: createDefaultSkill() };
      this.state.player.skills = skills;
      for (const key of ['gathering', 'crafting', 'tech'] as const) {
        skills[key].level = Math.min(99, skills[key].level + 2);
        skills[key].xpToNext = 100 * skills[key].level;
      }
      const ageName = this.state.currentAge.charAt(0).toUpperCase() + this.state.currentAge.slice(1);
      return `The Age of ${ageName} has begun! All skills boosted by +2!`;
    }

    return null;
  }

  private processTechDiscovery(): string[] {
    return [];
  }

  private getVisibleTiles(radius: number): Tile[] {
    const tiles: Tile[] = [];
    const playerPos = this.state.player.entity.position;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tile = this.getTileAt({ x: playerPos.x + dx, y: playerPos.y + dy });
        if (tile) {
          tiles.push(structuredClone(tile));
        }
      }
    }

    return tiles;
  }

  private getNearbyEntities(radius: number): Entity[] {
    const entities: Entity[] = [];
    const playerPos = this.state.player.entity.position;

    for (const entity of this.state.entities.values()) {
      const dx = Math.abs(entity.position.x - playerPos.x);
      const dy = Math.abs(entity.position.y - playerPos.y);
      if (dx <= radius && dy <= radius) {
        entities.push(structuredClone(entity));
      }
    }

    return entities;
  }

  private trackVisitedTile(pos: Position): void {
    const key = `${pos.x},${pos.y}`;
    if (!this.state.visitedTiles.includes(key)) {
      this.state.visitedTiles.push(key);
      this.state.stats.totalTilesExplored = this.state.visitedTiles.length;
    }
  }

  private depleteTileResource(pos: Position): void {
    const tile = this.getTileAt(pos);
    if (tile) {
      const resource = tile.resource;
      const isUnderground = this.state.gameContext === 'underground';

      if (isUnderground && tile.type === TileType.CaveWall) {
        tile.type = TileType.CaveFloor;
        tile.walkable = true;
        tile.speedModifier = 0.9;
        tile.resource = null;
        return;
      }

      tile.resource = null;

      if (tile.type === TileType.Building) {
        tile.type = TileType.Grass;
        tile.walkable = true;
        tile.speedModifier = 1;
        tile.durability = undefined as any;
        return;
      }

      if (isUnderground && resource && ['copper_ore', 'iron_ore', 'coal', 'clay', 'mud'].includes(resource)) {
        this.state.undergroundRegrowQueue.push({
          x: pos.x,
          y: pos.y,
          resource,
          regrowTurn: this.state.clock.turn + (resource === 'mud' ? 40 : 50),
        });
        return;
      }

      if (resource === 'berries') {
        this.state.regrowQueue.push({
          x: pos.x,
          y: pos.y,
          resource: 'berries',
          regrowTurn: this.state.clock.turn + 20,
        });
      } else if (resource === 'wood' && tile.type === TileType.Forest) {
        this.state.regrowQueue.push({
          x: pos.x,
          y: pos.y,
          resource: 'wood',
          regrowTurn: this.state.clock.turn + 30,
        });
      } else if (resource === 'mud') {
        this.state.regrowQueue.push({
          x: pos.x,
          y: pos.y,
          resource: 'mud',
          regrowTurn: this.state.clock.turn + 12,
        });
      } else if (resource === 'stone' && tile.type === TileType.StoneDeposit) {
        this.state.regrowQueue.push({
          x: pos.x,
          y: pos.y,
          resource: 'stone',
          regrowTurn: this.state.clock.turn + 30,
        });
      }
    }
  }

  private checkNPCProximity(): string | null {
    const pos = this.state.player.entity.position;
    for (const [, npc] of this.state.npcs) {
      if (this.state.gameContext === 'personal_space' && npc.homeRoomId !== this.state.currentPersonalSpaceId) continue;
      const dx = Math.abs(npc.entity.position.x - pos.x);
      const dy = Math.abs(npc.entity.position.y - pos.y);
      if (dx <= 8 && dy <= 8) {
        const npcKey = `npc:${npc.entity.id}`;
        if (!this.state.visitedTiles.includes(npcKey)) {
          this.state.visitedTiles.push(npcKey);
          return `You notice signs of habitation nearby.`;
        }
      }
    }
    return null;
  }

  private handleFish(target: Position): TurnResult {
    if (!this.isAdjacent(this.state.player.entity.position, target)) {
      return { success: false, message: `Cannot fish: target is not adjacent.`, stateChanges: {} };
    }
    const tile = this.getTileAt(target);
    if (!tile || tile.type !== TileType.Water) {
      return { success: false, message: `Cannot fish: no water at target.`, stateChanges: {} };
    }
    if (this.getInventoryCount('fishing_rod') <= 0) {
      return { success: false, message: `Cannot fish: no Fishing Rod in inventory.`, stateChanges: {} };
    }
    const catchChance = 0.7;
    if (Math.random() > catchChance) {
      return { success: true, message: `Cast the line but nothing bites.`, stateChanges: {} };
    }
    const added = this.addToInventory('raw_fish', 1);
    if (!added) {
      return { success: false, message: `Cannot fish: inventory is full.`, stateChanges: {} };
    }
    return {
      success: true,
      message: `Caught a fish!`,
      stateChanges: { player: structuredClone(this.state.player) },
    };
  }

  private rollWeather(): WeatherType {
    const season = this.state.clock.season;
    const biome = this.getPlayerBiome();
    const roll = Math.random();

    if (season === 'winter') {
      if (biome === 'mountain') return roll < 0.4 ? 'snow' : roll < 0.6 ? 'wind' : roll < 0.8 ? 'fog' : 'clear';
      return roll < 0.2 ? 'snow' : roll < 0.4 ? 'rain' : roll < 0.55 ? 'wind' : roll < 0.7 ? 'fog' : 'clear';
    }
    if (season === 'summer') {
      if (biome === 'desert') return roll < 0.3 ? 'sandstorm' : roll < 0.5 ? 'wind' : 'clear';
      return roll < 0.15 ? 'rain' : roll < 0.25 ? 'wind' : 'clear';
    }
    if (season === 'spring') {
      return roll < 0.25 ? 'rain' : roll < 0.35 ? 'fog' : roll < 0.45 ? 'wind' : 'clear';
    }
    return roll < 0.3 ? 'rain' : roll < 0.4 ? 'wind' : roll < 0.5 ? 'fog' : 'clear';
  }

  private processWeatherDegradation(): void {
    if (this.state.clock.timeOfDay !== 'night') return;
    if (this.state.clock.weather !== 'rain') return;

    const { tiles } = this.getFlatTiles();
    let degraded = false;
    for (const row of tiles) {
      for (const tile of row) {
        if (tile.type === TileType.Building && tile.durability > 0) {
          tile.durability -= 1;
          if (tile.durability <= 0) {
            const itemName = ITEMS[tile.resource || '']?.name || tile.resource || 'structure';
            tile.type = TileType.Grass;
            tile.resource = null;
            tile.walkable = true;
            tile.speedModifier = 1;
            tile.durability = -1;
            if (!degraded) {
              this.state.lastActionResult = {
                success: true,
                message: `Rain destroyed your ${itemName}! Clay structures resist weather.`,
                stateChanges: {},
              };
              degraded = true;
            }
          }
        }
      }
    }
  }

  private processRegrowth(): void {
    const currentTurn = this.state.clock.turn;
    const remaining: typeof this.state.regrowQueue = [];
    for (const entry of this.state.regrowQueue) {
      if (currentTurn >= entry.regrowTurn) {
        const tile = this.lookupTileInChunks(this.state.world.chunks, { x: entry.x, y: entry.y });
        if (tile && !tile.resource) {
          tile.resource = entry.resource;
        }
      } else {
        remaining.push(entry);
      }
    }
    this.state.regrowQueue = remaining;
  }

  private processUndergroundRegrowth(): void {
    const currentTurn = this.state.clock.turn;
    const remaining: typeof this.state.undergroundRegrowQueue = [];
    for (const entry of this.state.undergroundRegrowQueue) {
      if (currentTurn >= entry.regrowTurn) {
        const tile = this.lookupTileInChunks(this.state.underground.chunks, { x: entry.x, y: entry.y });
        if (tile && !tile.resource) {
          tile.resource = entry.resource;
        }
      } else {
        remaining.push(entry);
      }
    }
    this.state.undergroundRegrowQueue = remaining;
  }

  private lookupTileInChunks(chunks: Map<string, Chunk>, pos: Position): Tile | null {
    const { cx, cy } = worldToChunk(pos.x, pos.y);
    const key = chunkKey(cx, cy);
    const chunk = chunks.get(key);
    if (!chunk) return null;
    const local = worldToLocal(pos.x, pos.y);
    const row = chunk.tiles[local.y];
    if (!row) return null;
    return row[local.x] ?? null;
  }
}

function createEmptySlots(count: number): InventorySlot[] {
  const slots: InventorySlot[] = [];
  for (let i = 0; i < count; i++) {
    slots.push({ item: null, quantity: 0 });
  }
  return slots;
}

export function createNewGame(worldGen: WorldGenerator, spawnPos: Position): GameEngine {
  const stickDef = ITEMS['stick'];

  const slots = createEmptySlots(DEFAULT_INVENTORY_SLOTS);
  if (stickDef) {
    slots[0] = {
      item: {
        id: stickDef.id,
        name: stickDef.name,
        stackable: stickDef.stackable,
        maxStack: stickDef.maxStack,
        category: stickDef.category,
      },
      quantity: 3,
    };
  }

  const inventory: Inventory = {
    slots,
    maxSlots: DEFAULT_INVENTORY_SLOTS,
  };

  const player: PlayerState = {
    entity: {
      id: 'player',
      type: EntityType.Player,
      name: 'Player',
      position: { ...spawnPos },
    },
    inventory,
    currentAge: AgeEnum.Gathering,
    hunger: 240,
    stamina: 300,
    maxHunger: 300,
    maxStamina: 300,
    mounted: false,
    mountedAnimalId: null,
    lastSurvivalPosition: null,
    skills: {
      gathering: { level: 1, xp: 0, xpToNext: 100 },
      crafting: { level: 1, xp: 0, xpToNext: 100 },
      tech: { level: 1, xp: 0, xpToNext: 100 },
    },
    equippedClothing: null,
    health: 100,
    maxHealth: 100,
    exhaustionTurns: 0,
    starvationTurns: 0,
    currentDepth: 0,
    lastSurfacePosition: null,
  };

  const ROOM_W = 12
  const ROOM_H = 10

  function buildCaveRoom(): PersonalSpaceRoom {
    const grid: RoomTileType[][] = []
    for (let y = 0; y < ROOM_H; y++) {
      const row: RoomTileType[] = []
      for (let x = 0; x < ROOM_W; x++) {
        if (y === 0 && x === 6) {
          row.push('empty')
        } else if (y === 0 || y === ROOM_H - 1 || x === 0 || x === ROOM_W - 1) {
          row.push('wall')
        } else {
          row.push('floor_stone')
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
        { id: 'door_to_lab', tileX: 10, tileY: 5, type: 'door_lab', targetRoomId: 'lab' },
        { id: 'cave_mouth', tileX: 6, tileY: 1, type: 'cave_mouth', targetRoomId: 'void_world' },
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

  function buildLabRoom(): PersonalSpaceRoom {
    const grid: RoomTileType[][] = []
    for (let y = 0; y < ROOM_H; y++) {
      const row: RoomTileType[] = []
      for (let x = 0; x < ROOM_W; x++) {
        if (y === 0 || y === ROOM_H - 1 || x === 0 || x === ROOM_W - 1) {
          row.push('wall')
        } else if (y === 6 && x >= 7 && x <= 9) {
          row.push('rug')
        } else {
          row.push('floor_stone')
        }
      }
      grid.push(row)
    }
    return {
      id: 'lab',
      name: 'The Laboratory',
      grid,
      spawnX: 2,
      spawnY: 5,
      furniture: [
        { id: 'door_to_cave', tileX: 1, tileY: 5, type: 'door_cave', targetRoomId: 'cave' },
        { id: 'lab_console', tileX: 8, tileY: 6, type: 'console' },
        { id: 'lab_bookshelf', tileX: 9, tileY: 4, type: 'bookshelf' },
      ],
      collectibleDisplays: [],
      chests: [],
    }
  }

  const caveRoom = buildCaveRoom()
  const labRoom = buildLabRoom()
  const personalSpaces = new Map<string, PersonalSpaceRoom>([['cave', caveRoom], ['lab', labRoom]])
  // Boot INTO the Lab (user directive 2026-07-12): the player spawns in the Laboratory beside S8IE
  // so the NPC is on-screen at boot (the Cave + Void become places you walk TO, via door_to_cave).
  const personalSpace = labRoom

  const world: WorldState = {
    chunks: new Map(),
    seed: worldGen.getSeed(),
  };

  const clock: GameClock = {
    turn: 0,
    day: 1,
    season: 'spring' as Season,
    weather: 'clear' as WeatherType,
    timeOfDay: 'dawn',
  };

  const spawnKey = `${spawnPos.x},${spawnPos.y}`;

  const initialState: GameState = {
    player,
    world,
    clock,
    entities: new Map(),
    npcs: new Map(),
    animals: new Map(),
    crops: [],
    currentAge: AgeEnum.Gathering,
    unlockedRecipes: [],
    lastActionResult: null,
    gameWon: false,
    gameOver: false,
    winMessage: '',
    stats: {
      totalItemsCrafted: 0,
      totalTilesExplored: 1,
      totalTradesCompleted: 0,
      totalNPCsInteracted: [],
      totalAnimalsTamed: 0,
      totalCropsHarvested: 0,
      totalFoodEaten: 0,
      agesReached: [AgeEnum.Gathering],
    },
    visitedTiles: [spawnKey],
    personalSpace,
    personalSpaces,
    currentPersonalSpaceId: 'lab',
    underground: {
      chunks: new Map(),
      discoveredChunks: new Set(),
    },
    gameContext: 'survival' as GameContext,
    regrowQueue: [],
    undergroundRegrowQueue: [],
    discoveredTechs: [],
    temperature: 50,
  };

  worldGen.ensureChunksAroundPlayer(initialState, 2);
  worldGen.placeSpawnFeatures(initialState);

  const engine = new GameEngine(initialState, worldGen);

  const s8ieDef = NPCS['s8ie'];
  if (s8ieDef) {
    const s8ieEntity: Entity = {
      id: s8ieDef.id,
      type: EntityType.NPC,
      name: s8ieDef.name,
      position: { x: 5, y: 6 },
    };
    initialState.npcs.set(s8ieDef.id, {
      entity: s8ieEntity,
      homeRoomId: 'lab',
      profession: s8ieDef.profession,
      personality: { ...s8ieDef.personality },
      inventory: { slots: [], maxSlots: 6 },
      friendship: { current: 0, max: 100 },
      schedule: s8ieDef.schedule.map(s => ({ ...s })),
      dialogTreeId: s8ieDef.dialog,
      tradeOffers: s8ieDef.tradeOffers.map(t => ({ ...t, price: { ...t.price } })),
    });
    initialState.entities.set(s8ieDef.id, s8ieEntity);
  }

  const flatTiles = engine.getComposedTiles();
  spawnNPCs(initialState, flatTiles.tiles, flatTiles.width, flatTiles.height, spawnPos, flatTiles.originX, flatTiles.originY);
  return engine;
}
