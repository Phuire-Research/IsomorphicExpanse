/*<$
For the graph programming framework Stratimux and the Web Socket Client Concept, generate a helper that will synchronize the server state with the client's state.
$>*/
/*<#*/
import { createAction } from 'stratimux';
import type { ActionOptions } from 'stratimux';
import { WEB_SOCKET_SERVER_SYNC_CLIENT_STATE } from '../../model/webSocket.shared';

export const webSocketServerSyncClientState = (
  payload: { state: Record<string, unknown> },
  options?: ActionOptions,
) => createAction(WEB_SOCKET_SERVER_SYNC_CLIENT_STATE, { payload, ...options });
/*#>*/
