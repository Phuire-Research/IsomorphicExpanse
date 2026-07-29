import {
  createQualityCardWithPayload,
  defaultMethodCreator,
  type Quality,
  selectPayload,
} from 'stratimux';
import { type WebSocketClientState } from '../webSocketClient.concept';
import { WEB_SOCKET_CLIENT_ATOMIC_STATE_UPDATE } from '../model/webSocket.shared';

export type WebSocketClientAtomicStateUpdatePayload = {
  state: Record<string, unknown>;
};

export type WebSocketClientAtomicStateUpdate = Quality<
  WebSocketClientState,
  WebSocketClientAtomicStateUpdatePayload
>;

export const webSocketClientAtomicStateUpdate = createQualityCardWithPayload<
  WebSocketClientState,
  WebSocketClientAtomicStateUpdatePayload
>({
  type: WEB_SOCKET_CLIENT_ATOMIC_STATE_UPDATE,
  reducer: (state, action) => {
    const payload = selectPayload<WebSocketClientAtomicStateUpdatePayload>(action);
    console.log(
      '[WebSocketClient] Applying atomic state update from server:',
      Object.keys(payload.state),
    );

    // Direct state merge - triggers all reactive subscriptions
    return {
      ...payload.state,
    };
  },
  methodCreator: defaultMethodCreator,
});
