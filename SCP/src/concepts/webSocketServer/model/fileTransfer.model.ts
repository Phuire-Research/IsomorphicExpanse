// WebSocket File Transfer Model - Server Side

// Client → Server Actions (Server receives these)
export const WEB_SOCKET_CLIENT_FILE_TRANSFER = 'WebSocket Client File Transfer';
export const WEB_SOCKET_CLIENT_FILE_CHUNK = 'WebSocket Client File Chunk';
export const WEB_SOCKET_CLIENT_FILE_REQUEST = 'WebSocket Client File Request';

// Server → Client Actions (Server sends these)
export const WEB_SOCKET_SERVER_FILE_COMPLETE = 'WebSocket Server File Complete';
export const WEB_SOCKET_SERVER_FILE_ERROR = 'WebSocket Server File Error';
export const WEB_SOCKET_SERVER_FILE_PROGRESS = 'WebSocket Server File Progress';

export interface FileTransferSpec {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
  muxTapeId: string;
  collectionId: string;
  timelineIDs: string[];
  base64Data?: string; // For PoC, sending entire base64 at once
  clientId?: string; // Track which client sent the file
}

export interface FileChunkSpec {
  fileId: string;
  chunkIndex: number;
  chunkData: string;
  isLastChunk: boolean;
}

export interface FileCompleteSpec {
  fileId: string;
  receivedSize: number;
  checksum?: string;
  serverPath?: string; // Path where server stored the file
}

export interface FileRequestSpec {
  fileId: string;
  muxTapeId: string;
  requestType: 'download' | 'info';
}

// Server-side action creators (for sending to clients)
export const webSocketServerFileComplete = (spec: FileCompleteSpec) => ({
  type: WEB_SOCKET_SERVER_FILE_COMPLETE,
  payload: spec,
});

export const webSocketServerFileError = (fileId: string, error: string) => ({
  type: WEB_SOCKET_SERVER_FILE_ERROR,
  payload: { fileId, error, timestamp: Date.now() },
});

export const webSocketServerFileProgress = (fileId: string, progress: number) => ({
  type: WEB_SOCKET_SERVER_FILE_PROGRESS,
  payload: { fileId, progress, timestamp: Date.now() },
});
