/**
 * GitM Concept State Factory (Client-Side)
 *
 * gitmJson starts null on the client — null until the relay arrives. GITM_FILTER_KEYS
 * holds the migrated 'gitmJson' key (off scsBridge · onto gitm).
 *
 * Citation: cadmium.state.ts (createCadmiumClientState + FILTER_KEYS shape).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W1 gitm.state.ts.
 */
import type { GitmClientState } from './gitm.type';

export const GITM_FILTER_KEYS: string[] = ['gitmJson'];

export const createGitmClientState = (): GitmClientState => ({
  gitmJson: null,
  // GITM Staging-Update (D-U4.2) — null until the gitmUpdateWatcher relay arrives (mirrors
  // gitmJson · the watcher's ENOENT → null path covers absence · INERT until D-U4.3 writes them).
  updateDiff: null,
  updateResolved: null,
});
