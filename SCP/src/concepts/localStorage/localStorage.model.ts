import type { Concept, Quality, PrincipleFunction, MuxiumDeck, KeyedSelector } from 'stratimux';
import { indexedDBGetItem } from './indexeddb.model';

// LocalStorage State Interface
export type LocalStorageState = {
  // Core state
  isInitialized: boolean;
  isLocalStoragePrimed: boolean;
  systemFingerprint: string;

  // Configuration
  configuration: LocalStorageConfiguration | null;

  // KeyedSelector management
  syncedSelectors: Record<string, SyncedSelectorConfig>;
  mappedStorage: Record<string, SyncedConfig>;
  pendingSync: string[];
  lastSyncTimestamp: number;

  // Development safety
  environment: 'development' | 'production';
  autoCleanupEnabled: boolean;
};

export interface SyncedConfig {
  key: string; // The keys string from KeyedSelector (e.g., 'client.count')
  encrypted: boolean;
  lastUpdated: number;
  storageKey: string;
  chunkedKeys: string[]; // Array of storage keys for chunks if length > 0
}

export interface SyncedSelectorConfig {
  key: string; // The keys string from KeyedSelector (e.g., 'client.count')
  selector: KeyedSelector; // The actual KeyedSelector object
  encrypted: boolean;
  lastUpdated: number;
  storageKey: string;
}

export interface LocalStorageOperation {
  type:
    | 'set'
    | 'get'
    | 'remove'
    | 'encrypt'
    | 'decrypt'
    | 'add_selector'
    | 'remove_selector'
    | 'sync'
    | 'cleanup'
    | 'initialize'
    | 'fingerprint_generation'
    | 'environment_validation';
  key: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

// Action Payloads
export interface LocalStorageInitializePayload extends Record<string, unknown> {
  environment?: 'development' | 'production';
}

export interface LocalStorageAddSelectorPayload extends Record<string, unknown> {
  keyedSelector: KeyedSelector;
  encrypted?: boolean;
}

export interface LocalStorageSetPayload extends Record<string, unknown> {
  toBeSet: {
    key: string;
    value: any;
    encrypted?: boolean;
  }[];
}

export interface LocalStorageGetPayload extends Record<string, unknown> {
  key: string;
  encrypted?: boolean;
}

export interface LocalStorageSyncPayload extends Record<string, unknown> {
  changes: string[];
}

export interface LocalStorageCleanupPayload extends Record<string, unknown> {
  maxAge?: number; // milliseconds
}

// Fingerprinting Components
export interface FingerprintComponents {
  canvas: string;
  screen: string;
  timezone: string;
  hardwareConcurrency: number;
  random: string;
}

// Hardcoded PIN for encryption (to be replaced with user input in production)
export const LOCALSTORAGE_ENCRYPTION_PIN = '1234';

// Chunking configuration
export const MAX_CHUNK_SIZE = 4 * 1024 * 1024; // 4MB in bytes
export const MAX_CHUNK_CHARS = MAX_CHUNK_SIZE / 2; // UTF-16: 2 bytes per char

// Encryption/Decryption functions using Web Crypto API
export async function encryptData(data: string, fingerprint: string): Promise<string> {
  console.log('[ENCRYPTION] Starting encryption process', {
    dataLength: data.length,
    fingerprintLength: fingerprint.length,
    fingerprint: fingerprint,
  });

  // Check for circular references before proceeding
  try {
    JSON.stringify(data);
  } catch (e) {
    console.error('[ENCRYPTION] ❌ Data contains circular references', e);
    throw new Error('Cannot encrypt data with circular references');
  }

  const encoder = new TextEncoder();
  const salt = encoder.encode(fingerprint);

  console.log('[ENCRYPTION] Importing key material');
  // Derive key from PIN and fingerprint
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(LOCALSTORAGE_ENCRYPTION_PIN + fingerprint),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );

  console.log('[ENCRYPTION] Deriving encryption key');
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  console.log('[ENCRYPTION] Generated IV', { ivLength: iv.length });

  // Encrypt
  console.log('[ENCRYPTION] Encrypting data');
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data),
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  console.log('[ENCRYPTION] ✅ Encryption complete', {
    combinedLength: combined.length,
    encryptedDataLength: encryptedData.byteLength,
  });

  // Return base64 - Use chunked conversion for large data
  // Convert Uint8Array to base64 without exceeding call stack
  let binary = '';
  const chunkSize = 8192; // Process in 8KB chunks
  for (let i = 0; i < combined.length; i += chunkSize) {
    const chunk = combined.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export async function decryptData(encryptedData: string, fingerprint: string): Promise<string> {
  console.log('[ENCRYPTION] Starting decryption process', {
    encryptedDataLength: encryptedData.length,
    fingerprintLength: fingerprint.length,
    fingerprint: fingerprint,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const salt = encoder.encode(fingerprint);

  console.log('[ENCRYPTION] Importing key material for decryption');
  // Derive key from PIN and fingerprint
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(LOCALSTORAGE_ENCRYPTION_PIN + fingerprint),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );

  console.log('[ENCRYPTION] Deriving decryption key');
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  // Decode from base64 - Handle large data safely
  console.log('[ENCRYPTION] Decoding from base64');
  const binaryString = atob(encryptedData);
  const combined = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i);
  }

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  console.log('[ENCRYPTION] Extracted IV and encrypted data', {
    ivLength: iv.length,
    encryptedLength: encrypted.length,
  });

  // Decrypt
  console.log('[ENCRYPTION] Decrypting data');
  const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

  const decryptedString = decoder.decode(decryptedData);
  console.log('[ENCRYPTION] ✅ Decryption complete', {
    decryptedLength: decryptedString.length,
  });

  return decryptedString;
}

// Configuration interface for stored localStorage metadata
export interface LocalStorageConfiguration {
  version: string;
  entries: Array<{
    key: string;
    encrypted: boolean;
    lastUpdated: number;
  }>;
}

// Quality Types (will be implemented)
export type LocalStorageQualities = {
  localStorageInitialize: Quality<LocalStorageState, LocalStorageInitializePayload>;
  localStorageIsInitialized: Quality<LocalStorageState, void>;
  localStorageIsPrimed: Quality<LocalStorageState, void>;
  localStorageAddSelectorForSync: Quality<LocalStorageState, LocalStorageAddSelectorPayload>;
  localStorageRemoveSelectorFromSync: Quality<LocalStorageState, { key: string }>;
  localStorageSet: Quality<LocalStorageState, LocalStorageSetPayload>;
  localStorageGet: Quality<LocalStorageState, LocalStorageGetPayload>;
  localStorageSetState: Quality<LocalStorageState, { newState: Record<string, unknown> }>;
  localStorageSaveMappedStorage: Quality<LocalStorageState, void>;
  localStorageGetMappedStorage: Quality<LocalStorageState, void>;
  localStorageSynchronizeFromMappedStorage: Quality<LocalStorageState, void>;
  localStorageSync: Quality<LocalStorageState, LocalStorageSyncPayload>;
  localStorageCleanup: Quality<LocalStorageState, LocalStorageCleanupPayload>;
  localStorageGenerateFingerprint: Quality<LocalStorageState, void>;
  localStorageValidateEnvironment: Quality<LocalStorageState, void>;
};

export type LocalStorageConcept = Concept<LocalStorageState, LocalStorageQualities>;

export type LocalStorageDeck = {
  // Specific note about working with the new selectStratiDECK System is this strange nuance demonstrates the fundamental limitations of hierarchically informed type systems. This will Not Build when Utilizing, Pure Entry Actions will be Assumed to have Payloads.
  localStorage: Concept<LocalStorageState, LocalStorageQualities>;
} & MuxiumDeck;

export type LocalStoragePrinciple = PrincipleFunction<
  LocalStorageQualities,
  LocalStorageDeck,
  LocalStorageState
>;

// Chunking utility functions
export function getStringSize(str: string): number {
  return str.length * 2; // UTF-16: 2 bytes per character
}

export function needsChunking(data: string): boolean {
  return getStringSize(data) > MAX_CHUNK_SIZE;
}

export function chunkString(data: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += MAX_CHUNK_CHARS) {
    chunks.push(data.slice(i, i + MAX_CHUNK_CHARS));
  }
  return chunks;
}

export async function reassembleChunks(chunkedKeys: string[]): Promise<string> {
  let result = '';
  for (const chunkKey of chunkedKeys) {
    try {
      const chunk = await indexedDBGetItem(chunkKey);
      if (!chunk) {
        console.error(`[CHUNKING] Missing chunk: ${chunkKey}`);
        // Continue with partial data rather than throwing
      }
      result += chunk || '';
    } catch (error) {
      console.error(`[CHUNKING] Error retrieving chunk: ${chunkKey}`, error);
      // Continue with partial data rather than throwing
    }
  }
  return result;
}
