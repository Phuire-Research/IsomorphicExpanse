import { ref } from 'vue'
import type { GameState } from '../engine/types'
import {
  openGameDB,
  saveGameToIDB,
  loadGameFromIDB,
  hasGameSave,
} from '../engine/GamePersistence'

const SAVE_INTERVAL_MS = 5000
const SAVE_TURN_THRESHOLD = 10

export function useGamePersistence() {
  const idbReady = ref(false)
  let saveTimer: ReturnType<typeof setInterval> | null = null
  let pendingSave: GameState | null = null
  let turnsSinceLastSave = 0
  let boundFlush: (() => void) | null = null

  async function init() {
    try {
      await openGameDB()
      idbReady.value = true
    } catch {
      idbReady.value = false
    }
  }

  async function flushSave(): Promise<void> {
    if (!pendingSave || !idbReady.value) return
    const state = pendingSave
    pendingSave = null
    turnsSinceLastSave = 0
    try {
      await saveGameToIDB(state)
    } catch {
      pendingSave = state
    }
  }

  function scheduleSave(state: GameState) {
    pendingSave = state
    turnsSinceLastSave++
    if (turnsSinceLastSave >= SAVE_TURN_THRESHOLD) {
      flushSave()
    }
  }

  async function loadSave(slot?: string): Promise<GameState | null> {
    if (!idbReady.value) return null
    return loadGameFromIDB(slot)
  }

  async function hasSave(slot?: string): Promise<boolean> {
    if (!idbReady.value) return false
    return hasGameSave(slot)
  }

  function setupBeforeUnload() {
    boundFlush = () => {
      if (pendingSave && idbReady.value) {
        const data = pendingSave
        pendingSave = null
        saveGameToIDB(data)
      }
    }
    window.addEventListener('beforeunload', boundFlush)
    saveTimer = setInterval(() => {
      if (pendingSave) {
        flushSave()
      }
    }, SAVE_INTERVAL_MS)
  }

  function cleanup() {
    if (saveTimer !== null) {
      clearInterval(saveTimer)
      saveTimer = null
    }
    if (boundFlush) {
      window.removeEventListener('beforeunload', boundFlush)
      boundFlush = null
    }
  }

  return {
    idbReady,
    init,
    scheduleSave,
    flushSave,
    loadSave,
    hasSave,
    setupBeforeUnload,
    cleanup,
  }
}
