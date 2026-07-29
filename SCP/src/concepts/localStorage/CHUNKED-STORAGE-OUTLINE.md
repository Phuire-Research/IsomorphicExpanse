# Chunked localStorage Sequence Methodology

## Overview
This document outlines the implementation strategy for a chunked storage system that enables localStorage to handle entries of any size, limited only by the browser's total localStorage capacity. The system remains agnostic to encryption while providing dynamic chunking based on available quota.

### Key Technical Insights
- localStorage uses **UTF-16 encoding** internally (2 bytes per code unit)
- Accurate size calculation: `(key.length + value.length) * 2`
- Browser quotas: Chrome/Firefox (10MB), Safari (5MB traditional, up to 20% disk modern)
- Base overhead: ~3KB per domain
- Optimal chunking threshold: >1MB data

## 1. SyncedConfig Extension for Chunked Storage

```typescript
// Extend SyncedConfig interface in localStorage.model.ts
export interface SyncedConfig {
  key: string; // The keys string from KeyedSelector (e.g., 'client.count')
  encrypted: boolean;
  lastUpdated: number;
  storageKey: string;
  // NEW: Chunked storage parameters
  chunkedKeys: string[]; // Array of storage keys for chunks if length > 0
}
```

## 2. Core Chunking Architecture

### A. Write Operations - Simple Chunking

1. **Size Check**
   - Calculate string size: `string.length * 2` (UTF-16)
   - If size > MAX_CHUNK_SIZE, chunk it

2. **Chunking Process**
   ```typescript
   const MAX_CHUNK_SIZE = 4 * 1024 * 1024; // 4MB in bytes
   const maxChunkChars = MAX_CHUNK_SIZE / 2; // UTF-16: 2 bytes per char
   
   function chunkString(data: string): string[] {
     const chunks: string[] = [];
     for (let i = 0; i < data.length; i += maxChunkChars) {
       chunks.push(data.slice(i, i + maxChunkChars));
     }
     return chunks;
   }
   ```

3. **Storage Pattern**
   - If chunkedKeys.length === 0: Store data directly
   - If chunkedKeys.length > 0: Store metadata, then store each chunk
   - Chunk keys: `${storageKey}_chunk_${index}`

### B. Read Operations - Simple Reassembly

1. **Detection**
   - Check chunkedKeys array length
   - If empty: Read normally
   - If has values: Read chunks

2. **Reassembly**
   ```typescript
   function reassemble(chunkedKeys: string[]): string {
     let result = '';
     for (const chunkKey of chunkedKeys) {
       result += localStorage.getItem(chunkKey) || '';
     }
     return result;
   }
   ```

## 3. Simple Implementation Flow

### Write Flow (set.quality.ts)
```typescript
// 1. Determine size
const dataToStore = encrypted ? encryptedData : jsonData;
const sizeInBytes = dataToStore.length * 2;

// 2. Decide if chunking needed
if (sizeInBytes <= MAX_CHUNK_SIZE) {
  // Store normally
  localStorage.setItem(key, dataToStore);
  updateSyncedConfig({ chunkedKeys: [] });
} else {
  // Chunk and store
  const chunks = chunkString(dataToStore);
  const chunkKeys = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkKey = `${key}_chunk_${i}`;
    localStorage.setItem(chunkKey, chunks[i]);
    chunkKeys.push(chunkKey);
  }
  
  updateSyncedConfig({ chunkedKeys });
}
```

### Read Flow (get.quality.ts)
```typescript
// 1. Check metadata
const config = getSyncedConfig(key);

// 2. Read based on chunking
if (config.chunkedKeys.length === 0) {
  // Read normally
  const data = localStorage.getItem(key);
  return encrypted ? decrypt(data) : JSON.parse(data);
} else {
  // Reassemble chunks
  const reassembled = reassemble(config.chunkedKeys);
  return encrypted ? decrypt(reassembled) : JSON.parse(reassembled);
}
```

## 4. Key Implementation Details

### Cleanup on Update
When updating an existing chunked entry:
```typescript
// Remove old chunks first
if (existingConfig.chunkedKeys.length > 0) {
  for (const oldChunkKey of existingConfig.chunkedKeys) {
    localStorage.removeItem(oldChunkKey);
  }
}
// Then store new data (chunked or not)
```

### Error Handling
- If any chunk fails to store: Roll back all chunks
- If chunk missing during read: Return error or partial data
- Always clean up orphaned chunks

### Size Calculation
```typescript
function getStringSize(str: string): number {
  return str.length * 2; // UTF-16: 2 bytes per character
}

function needsChunking(data: string): boolean {
  return getStringSize(data) > MAX_CHUNK_SIZE;
}
```

## 5. Summary

### The Simple Process
1. **Store**: Check size → Chunk if needed → Store chunks → Update metadata
2. **Retrieve**: Check metadata → Read chunks if any → Join strings → Return

### Key Points
- Chunking decision based on: `string.length * 2 > MAX_CHUNK_SIZE`
- Chunks are simple string slices, no modification
- Encryption happens before chunking, decryption after reassembly
- Empty chunkedKeys array means no chunking
- Non-empty chunkedKeys array contains all chunk storage keys

This approach keeps the implementation straightforward while enabling storage of any size data within browser limits.