import { ref, computed, shallowRef } from 'vue'
import { GameEngine, createNewGame } from '../engine/GameEngine'
import { WorldGenerator } from '../engine/WorldGenerator'
import type { GameState, Action, TurnResult, AgentState, GameStats, GameContext } from '../engine/types'
import { ActionType } from '../engine/types'

export function useGameEngine() {
  const engine = shallowRef<GameEngine | null>(null)
  const gameState = shallowRef<GameState | null>(null)
  const lastResult = ref<TurnResult | null>(null)
  const isInitialized = ref(false)

  function initialize(seed?: number) {
    // ESPSI · D2 · moved from function-body scope — initialize() only runs
    // from GameView's onMounted (client-only; Vue skips onMounted during SSR),
    // SSR-safe by construction.
    try { (window as any).__EF_STATE__ = { initializing: true } } catch {}
    const worldGen = new WorldGenerator(seed)
    const spawn = worldGen.getSpawnPosition()
    engine.value = createNewGame(worldGen, spawn)
    engine.value.executeTurn({ action: ActionType.EnterPersonalSpace })
    gameState.value = engine.value.getState()
    isInitialized.value = true
    try { (window as any).__EF_STATE__ = gameState.value } catch {}
  }

  function dispatch(action: Action): TurnResult | null {
    if (!engine.value) return null
    const result = engine.value.executeTurn(action)
    const gs = engine.value.getState()
    gameState.value = gs
    lastResult.value = result
    if (gs) {
      try { (window as any).__EF_STATE__ = gs } catch {}
    }
    return result
  }

  function isWalkableAt(pos: { x: number; y: number }): boolean {
    return engine.value ? engine.value.isWalkableAt(pos) : false
  }

  function getAgentState(): AgentState | null {
    return engine.value?.getAgentState() ?? null
  }

  const playerPosition = computed(() => gameState.value?.player.entity.position ?? null)
  const inventory = computed(() => gameState.value?.player.inventory ?? null)
  const currentAge = computed(() => gameState.value?.currentAge ?? null)
  const turn = computed(() => gameState.value?.clock.turn ?? 0)
  const clock = computed(() => gameState.value?.clock ?? null)
  const crops = computed(() => gameState.value?.crops ?? [])
  const npcs = computed(() => gameState.value?.npcs ?? new Map())
  const animals = computed(() => gameState.value?.animals ?? new Map())
  const hunger = computed(() => gameState.value?.player.hunger ?? 80)
  const stamina = computed(() => gameState.value?.player.stamina ?? 100)
  const unlockedRecipes = computed(() => gameState.value?.unlockedRecipes ?? [])
  const discoveredTechs = computed(() => gameState.value?.discoveredTechs ?? [])
  const gameWon = computed(() => gameState.value?.gameWon ?? false)
  const gameOver = computed(() => gameState.value?.gameOver ?? false)
  const winMessage = computed(() => gameState.value?.winMessage ?? '')
  const stats = computed<GameStats | null>(() => gameState.value?.stats ?? null)
  const gameContext = computed(() => 'personal_space' as GameContext)
  const currentDepth = computed(() => gameState.value?.player.currentDepth ?? 0)
  const temperature = computed(() => gameState.value?.temperature ?? 50)
  const health = computed(() => gameState.value?.player.health ?? 100)
  const maxHealth = computed(() => gameState.value?.player.maxHealth ?? 100)
  const equippedClothing = computed(() => gameState.value?.player.equippedClothing ?? null)

  const nearestStairsUp = computed(() => {
    if (!gameState.value || gameState.value.gameContext !== 'underground') return null
    const px = gameState.value.player.entity.position.x
    const py = gameState.value.player.entity.position.y
    const chunks = gameState.value.underground?.chunks
    if (!chunks) return null
    let best: { dx: number; dy: number; dist: number } | null = null
    for (const chunk of chunks.values()) {
      for (const row of chunk.tiles) {
        for (const tile of row) {
          if (tile.type === 'stairs_up' || (tile.type === 'building' && tile.resource === 'stairs_up')) {
            const dx = tile.position.x - px
            const dy = tile.position.y - py
            const dist = Math.abs(dx) + Math.abs(dy)
            if (!best || dist < best.dist) best = { dx, dy, dist }
          }
        }
      }
    }
    if (!best) return null
    const dir = best.dx === 0 && best.dy === 0 ? 'HERE'
      : (best.dy < 0 ? 'N' : best.dy > 0 ? 'S' : '') + (best.dx > 0 ? 'E' : best.dx < 0 ? 'W' : '')
    return { direction: dir, distance: best.dist }
  })

  function toggleEquip(): TurnResult | null {
    if (!engine.value) return null
    const result = engine.value.handleEquipToggle()
    gameState.value = engine.value.getState()
    lastResult.value = result
    return result
  }

  function respawnAtCampfire(): void {
    if (!engine.value) return
    engine.value.respawnAtCampfire()
    gameState.value = engine.value.getState()
  }

  return {
    engine,
    gameState,
    lastResult,
    isInitialized,
    initialize,
    dispatch,
    isWalkableAt,
    getAgentState,
    playerPosition,
    inventory,
    currentAge,
    turn,
    clock,
    crops,
    npcs,
    animals,
    hunger,
    stamina,
    unlockedRecipes,
    discoveredTechs,
    gameWon,
    gameOver,
    winMessage,
    stats,
    gameContext,
    currentDepth,
    temperature,
    health,
    maxHealth,
    nearestStairsUp,
    equippedClothing,
    toggleEquip,
    respawnAtCampfire,
  }
}
