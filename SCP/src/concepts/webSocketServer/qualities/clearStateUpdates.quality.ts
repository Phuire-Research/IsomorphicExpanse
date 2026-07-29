import { createQualityCard, Quality } from 'stratimux';
import type { WebSocketServerState } from '../webSocketServer.concept';

export const webSocketServerClearStateUpdates = createQualityCard<WebSocketServerState>({
  type: 'Web Socket Server Clear State Updates',
  reducer: (state) => {
    const clearedCount = state.stateUpdates?.length || 0;
    if (clearedCount > 0) {
      // TEMPORARY: Commented to reduce log cycling
      // console.log(`[WebSocketServer] Clearing ${clearedCount} processed state updates`);
    }
    return {
      stateUpdates: [], // Return new empty array
    };
  },
});

export type WebSocketServerClearStateUpdates = Quality<WebSocketServerState>;
