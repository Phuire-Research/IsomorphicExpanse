/**
 * GitM Turn-Over Failsafe Model (#641-R W5 · HAZARD-5 byte-match single source)
 *
 * The SINGLE source of the GITM_TURNOVER_KEY localStorage contract, byte-imported by
 * BOTH the writer (GitmTurnOverBButton.vue) AND the reader (webSocketClient.principle.ts
 * close handler). One definition, never two — the localStorage shape can never drift
 * (S4 Green HAZARD 5 · S3 Yellow Blueprint §W5-step-1).
 *
 * When the user turns over to B, the B button writes GITM_TURNOVER_KEY BEFORE dispatching
 * the MCP turn-over. The close handler reads it to distinguish an A↔B turn-over
 * (deadline-armed) from a normal restart (unbounded ping). If B never boots within
 * GITM_TURNOVER_DEADLINE_MS, the deadline timer fires gitm_revert_to_stable over the OUTER
 * bridge /mcp (alive during SCP-down) → checkout A → boot on A → client reloads.
 *
 * Citation: webSocketClient.principle.ts (the verbatim L39-59 it replaces).
 * Citation: GITM-AB-R-S3-YELLOW-BLUEPRINT.md §W5-step-1 + §W6a.
 */

// The localStorage key the B button writes + the close handler reads.
export const GITM_TURNOVER_KEY = 'gitm_turnover_in_progress';

// S4 Green §1c — generous build budget, < 60s HPRD.
export const GITM_TURNOVER_DEADLINE_MS = 45_000;

export type GitmTurnoverProgress = {
  // SORD Shield/Sword (Macro Diamond) — the source is now 'A' OR 'B'. A Shield-A turn-over
  // (return/recovery to stable A) writes source:'A'; a Sword-B turn-over (carry onto B) writes
  // source:'B'. The deadline failsafe in the WS-close handler only arms for source==='B'.
  source: 'A' | 'B';
  deadline: number; // Date.now() + GITM_TURNOVER_DEADLINE_MS (set at write time by the button)
  stableA: string; // the stableBranch name at turn-over time
  bridgeEndpoint: string; // the outer SCS-Bridge /mcp base (reachable while the SCP is down)
  // D-T-REVERT (Cycle 270 · user semantics): when an A turn-over fires FROM the working B (the
  // revert), the client RESUMES on B after A boots — the ping-success seam fires
  // gitm_branch_switch to this branch (nodemon watches only .bridge-restart.json, so the
  // re-checkout does NOT restart the server: A keeps running while the tree sits on B).
  resumeToB?: string;
  // SORD Shield/Sword (D5/TVOS) — the overlay variant the WS-close handler re-shows across the
  // respawn gap so the SAME visual continues after the restart tears the connection down. Absent
  // ⇒ the close handler falls back to the plain 'turn-over' overlay.
  overlayVariant?: 'shield-a' | 'sword-b';
  // C639 · THE STICKY EXPRESSION — the turn-over CLASS rides the marker so EVERY re-show
  // (the WS-close re-assert · the post-reload connect gap) lands the same register the
  // trigger declared. Absent ⇒ the show derives from the mode (legacy · shield).
  turnClass?: 'shield' | 'sword' | 'sparks';
  // BOOT-STREAM (standby live tail) — THIS SCP's own name (GET /scp-config · getScpName), captured
  // at turn-over-write time. The standby overlay polls `${bridgeEndpoint}/scp-boot-log/${scpName}`
  // to tail the re-booting SCP's boot log across the respawn gap. Absent ⇒ no live tail (the
  // overlay still shows; the stream div stays empty).
  scpName?: string;
};

// Read + parse the turn-over progress key (null when absent or malformed).
export const readGitmTurnoverProgress = (): GitmTurnoverProgress | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(GITM_TURNOVER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GitmTurnoverProgress;
  } catch {
    return null;
  }
};

// SORD Shield/Sword — the single write helper the turn-over buttons call BEFORE firing the SORD
// anchor. Byte-match single source (HAZARD-5): the buttons never hand-roll the localStorage write,
// so the shape the WS-close handler reads can never drift from what the button wrote.
export const writeGitmTurnoverProgress = (p: GitmTurnoverProgress): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(GITM_TURNOVER_KEY, JSON.stringify(p));
  } catch {
    /* localStorage unavailable — the turn-over still fires, just without the failsafe/variant */
  }
};
