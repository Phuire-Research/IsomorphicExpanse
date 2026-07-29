import { createQualityCardWithPayload, selectPayload, defaultMethodCreator } from 'stratimux';
import type { LocalStorageState } from '../localStorage.model';

export interface LocalStorageSetStatePayload extends Record<string, unknown> {
  newState: Record<string, unknown>;
}

export const localStorageSetState = createQualityCardWithPayload<
  LocalStorageState,
  LocalStorageSetStatePayload
>({
  type: 'Local Storage Set State',
  reducer: (state, action) => {
    const { newState } = selectPayload<LocalStorageSetStatePayload>(action);

    console.log(
      '[Initialization] 🔧 localStorage setState: Setting localStorage state with:',
      newState,
    );

    return {
      ...newState,
    };
  },
  methodCreator: defaultMethodCreator,
});
