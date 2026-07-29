/**
 * GitM Last-Known-Good Model (the Turn-Over Disconnect Guard · W3d · HELD-seed single source)
 *
 * The SINGLE source of the GITM_LAST_KNOWN_GOOD_KEY localStorage contract, byte-imported by the
 * gitmDisplay principle for BOTH legs: PERSIST (every live gitmJson is snapshotted) and SEED (on a
 * fresh muxium boot the snapshot is applied SYNCHRONOUSLY before the async MOCH /gitm-status fetch).
 * One definition, never two — the persisted shape can never drift (the gitmTurnover.model precedent).
 *
 * THE LAW THIS ENFORCES (the Turn-Over Disconnect Guard · W3d): the false-"no B" window opens at
 * page reload — the muxium re-boots to gitmJson:null and Vue renders the Sword's B-creation invite
 * BEFORE the async /gitm-status resolves. Seeding the last-known-good gitmJson synchronously closes
 * that gap: the Sword reads the held workingBranch immediately, never a transient blank. The seed is
 * HELD data (last relay, not a live read) — the W3c liveness gate (connectionEstablished) still
 * governs the creation invitation, so a held seed shows the branch without falsely inviting a forge.
 *
 * Citation: gitmTurnover.model.ts (the localStorage key + SSR-guarded read/write single-source idiom).
 * Citation: DIAMOND-TURNOVER-DISCONNECT-GUARD.md §W3 · D-TDG-W1-BLANKING-TRACE.md §4 W3d.
 */
import type { GitmJsonShape } from '../concepts/gitm/gitm.type';

// The localStorage key the display principle persists to (on every live gitmJson) and seeds from
// (on a fresh muxium boot, before the async MOCH fetch). Distinct from the turn-over key.
export const GITM_LAST_KNOWN_GOOD_KEY = 'gitm_last_known_good';

// Read + parse the last-known-good snapshot (null when absent, malformed, or non-repo). Guards the
// isRepo:boolean gate the relay parse uses (gitmRelay.config.ts) so a partial/foreign value is
// rejected — only a bridge-authored snapshot ever seeds.
export const readGitmLastKnownGood = (): GitmJsonShape | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(GITM_LAST_KNOWN_GOOD_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GitmJsonShape;
    if (typeof parsed.isRepo !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
};

// Persist the live gitmJson as the last-known-good (called from the display principle's selector leg
// on every non-null relay). SSR-guarded + swallow-on-fail (localStorage full/blocked never breaks the
// relay). A null gitmJson is NEVER persisted — the dark hour must not overwrite the held snapshot.
export const writeGitmLastKnownGood = (gitmJson: GitmJsonShape | null): void => {
  if (typeof localStorage === 'undefined') return;
  if (gitmJson === null) return;
  try {
    localStorage.setItem(GITM_LAST_KNOWN_GOOD_KEY, JSON.stringify(gitmJson));
  } catch {
    /* localStorage unavailable/full — the relay still delivers live status; only the seed is lost */
  }
};
