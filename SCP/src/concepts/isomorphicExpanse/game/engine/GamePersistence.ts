import type { GameState } from './types'
import { serializeGameState, deserializeGameState } from './StateSerializer'

const DB_NAME = 'emerald-forge-saves'
const DB_VERSION = 1
const GAME_SAVES_STORE = 'game_saves'
const PERSONAL_SPACE_STORE = 'personal_space'

interface GameSaveRecord {
  slot: string
  data: string
  savedAt: string
}

interface PersonalSpaceRecord {
  slot: string
  data: string
  savedAt: string
}

let dbPromise: Promise<IDBDatabase> | null = null

export function openGameDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available in SSR'))
  }
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = request.result
      const oldVersion = event.oldVersion
      if (oldVersion < 1) {
        db.createObjectStore(GAME_SAVES_STORE, { keyPath: 'slot' })
        db.createObjectStore(PERSONAL_SPACE_STORE, { keyPath: 'slot' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })

  return dbPromise
}

function txGame(mode: IDBTransactionMode, store = GAME_SAVES_STORE): Promise<IDBObjectStore> {
  return openGameDB().then(db => {
    const transaction = db.transaction(store, mode)
    return transaction.objectStore(store)
  })
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveGameToIDB(state: GameState, slot = 'auto'): Promise<void> {
  if (typeof window === 'undefined') return
  const store = await txGame('readwrite')
  const record: GameSaveRecord = {
    slot,
    data: serializeGameState(state),
    savedAt: new Date().toISOString(),
  }
  await reqToPromise(store.put(record))
}

export async function loadGameFromIDB(slot = 'auto'): Promise<GameState | null> {
  if (typeof window === 'undefined') return null
  const store = await txGame('readonly')
  const record = await reqToPromise<GameSaveRecord | undefined>(store.get(slot))
  if (!record) return null
  return deserializeGameState(record.data)
}

export async function listGameSlots(): Promise<string[]> {
  if (typeof window === 'undefined') return []
  const store = await txGame('readonly')
  const records = await reqToPromise<GameSaveRecord[]>(store.getAll())
  return records.map(r => r.slot)
}

export async function deleteGameSlot(slot: string): Promise<void> {
  if (typeof window === 'undefined') return
  const store = await txGame('readwrite')
  await reqToPromise(store.delete(slot))
}

export async function hasGameSave(slot = 'auto'): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const store = await txGame('readonly')
  const result = await reqToPromise<number>(store.count(slot))
  return result > 0
}
