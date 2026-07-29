// WebSocket File Transfer Model - Client Side

import { createAction } from 'stratimux';

// Client → Server Actions (Client sends these)
export const WEB_SOCKET_CLIENT_FILE_TRANSFER = 'WebSocket Client File Transfer';
export const WEB_SOCKET_CLIENT_FILE_CHUNK = 'WebSocket Client File Chunk';
export const WEB_SOCKET_CLIENT_FILE_REQUEST = 'WebSocket Client File Request';

// Server → Client Actions (Client receives these)
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
  clientId?: string;
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

// Client-side action creators (for sending to server)

export const webSocketClientFileTransfer = (spec: FileTransferSpec) =>
  createAction(WEB_SOCKET_CLIENT_FILE_TRANSFER, {
    payload: spec as any,
  });

export const webSocketClientFileChunk = (spec: FileChunkSpec) =>
  createAction(WEB_SOCKET_CLIENT_FILE_CHUNK, {
    payload: spec as any,
  });

export const webSocketClientFileRequest = (spec: FileRequestSpec) =>
  createAction(WEB_SOCKET_CLIENT_FILE_REQUEST, {
    payload: spec as any,
  });
