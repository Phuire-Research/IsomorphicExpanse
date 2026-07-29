/*<$
@fileoverview Quality for the Client concept that allows toggling dark mode state.
This quality provides functionality to set the dark mode state in the Client concept.
It takes a boolean payload to determine whether dark mode should be enabled or disabled.
$>*/
/*<#*/
import { createQualityCardWithPayload, defaultMethodCreator, type Quality } from 'stratimux';
import type { ClientDeck, ClientState } from '../client.concept';

export type ClientSetDarkModePayload = {
  darkMode: boolean;
};

export type ClientSetDarkMode = Quality<ClientState, ClientSetDarkModePayload>;
export const clientSetDarkMode = createQualityCardWithPayload<
  ClientState,
  ClientSetDarkModePayload
>({
  type: 'set Dark Mode based on Payload',
  reducer: (_, action) => {
    return {
      darkMode: action.payload.darkMode,
    };
  },
  methodCreator: defaultMethodCreator,
});
/*#>*/
