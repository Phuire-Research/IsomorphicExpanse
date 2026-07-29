// IndexedDB utility functions - direct replacements for localStorage methods
// Maintains the same string-based interface for seamless migration

const DB_NAME = 'StratimuxStorage';
const DB_VERSION = 1;
const STORE_NAME = 'keyValueStore';

let dbPromise: Promise<IDBDatabase> | null = null;

function initDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[IndexedDB] Database opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log('[IndexedDB] Database upgrade needed');
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        console.log('[IndexedDB] Created object store:', STORE_NAME);
      }
    };
  });

  return dbPromise;
}

// Direct replacement for localStorage.setItem()
export function indexedDBSetItem(key: string, value: string): Promise<void> {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put({ key, value });

      request.onsuccess = () => {
        console.log('[IndexedDB] Successfully stored:', key);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to store:', key, request.error);
        reject(request.error);
      };
    });
  });
}

// Direct replacement for localStorage.getItem()
export function indexedDBGetItem(key: string): Promise<string | null> {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        const value = result ? result.value : null;
        console.log('[IndexedDB] Retrieved:', key, value ? 'found' : 'not found');
        resolve(value);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to retrieve:', key, request.error);
        reject(request.error);
      };
    });
  });
}

// Direct replacement for localStorage.removeItem()
export function indexedDBRemoveItem(key: string): Promise<void> {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.delete(key);

      request.onsuccess = () => {
        console.log('[IndexedDB] Successfully removed:', key);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to remove:', key, request.error);
        reject(request.error);
      };
    });
  });
}

// Additional utility for getting all keys (used in cleanup operations)
export function indexedDBGetAllKeys(): Promise<string[]> {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.getAllKeys();

      request.onsuccess = () => {
        console.log('[IndexedDB] Retrieved all keys:', request.result.length, 'keys');
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to get all keys:', request.error);
        reject(request.error);
      };
    });
  });
}
