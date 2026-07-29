/**
 * Toolbar Registration Model — TaskBar Pattern Port (M2-A2-D1)
 *
 * Pure functions for managing the SCS-Bridge toolbar button registry.
 * Ports R1-curated SCP-Origin TaskBar.vue architecture (TaskBarAction
 * interface · suite-typed buttons · drop-up popover system) into
 * Stratimux compositional form: registration via quality dispatch
 * rather than Vue props, per Q6 locked decision.
 *
 * Higher-Order Composition: standalone pure functions composed by the
 * scsBridge concept qualities (registerToolbarButton ·
 * unregisterToolbarButton). The toolbar state lives in
 * scsBridge.toolbarButtons; these functions transform it.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A2-D1
 * Citation: SUITE-1-RED-MACRO-2-CURATION.md Target 2 (SCP-Origin TaskBar curation)
 * Citation: scsBridge.type.ts ToolbarButtonRegistration + ToolbarButtonKind types
 */
import type { ToolbarButtonRegistration } from '../concepts/scsBridge/scsBridge.type';

// ============================================
// RESERVED TOOLBAR BUTTON IDS
// ============================================

/**
 * Reserved button IDs are baked into the toolbar by core Macro 2 flows.
 * User-registered buttons MUST NOT collide with these. Validated by
 * `validateToolbarButton`.
 *
 *   'turn-over'       — Hard Turn Over (Pewter · M2-A2-D2 refold target)
 *   'bridge-sessions' — Session Management Popup (Cobalt · Cycle 157 Wave 4)
 *   'send-message'    — Send Message PoC (Cobalt · M2-A2-D3 target)
 *   'install-scp'     — Install SCP entry (AJMI Main Menu mirror · M2-A1-D1)
 *   'log-dump'        — Log Dump UI (M2-A1-D4 surface)
 *   'stable-a'        — GITM A↔B · Register stable A (#641 · the A/B group)
 *   'turn-over-a'     — GITM A↔B-R · Turn Over A (return to stable A · #641-R DUALTURN)
 *   'turn-over-b'     — GITM A↔B-R · Turn Over B + confirm-success + CHANGEDIAL (#641-R DUALTURN)
 *   'merge-b-a'       — GITM A↔B · Merge B→A (#641 · the A/B group)
 *   'branch-hop'      — GITM A↔B-R · FREEHOP free branch selector (#641-R · idle-gated)
 *
 * #641-R DUALTURN: 'turn-over-a' + 'turn-over-b' REPLACE 'turn-over-ab'; 'create-b' is
 * RETIRED (B auto-populates via the bridge BSEED auto-advance — no manual create path).
 */
export const RESERVED_TOOLBAR_BUTTON_IDS: readonly string[] = [
  'send-message',
  'install-scp',
  'log-dump',
  // Session Management onto the Bridge Dock — 'bridge-sessions' moved from the head of the list
  // to lead the FINAL DOCK GROUP (user · the Session Manager rides beside the bridge controls).
  // sortToolbarButtonsForRender orders reserved buttons by their index here, so this position
  // (immediately before 'stable-a') mirrors DEFAULT_TOOLBAR_BUTTONS render order.
  'bridge-sessions',
  // GITM A↔B Refinement Sword epoch — the FINAL DOCK GROUP (order matches DEFAULT_TOOLBAR_BUTTONS):
  //   stable-a (Shield A-set) · turn-over-a · sword-b (Sword B-set) · turn-over-b · merge-b-a.
  // The generic 'turn-over' default + standalone 'branch-hop' (Freehop · subsumed) are REMOVED.
  'stable-a',
  'turn-over-a',
  'sword-b',
  'turn-over-b',
  'merge-b-a',
];

// ============================================
// VALIDATION
// ============================================

export interface ToolbarButtonValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Validates a ToolbarButtonRegistration. Constraints:
 *   - id must be non-empty kebab-case (alphanumeric + hyphens)
 *   - id must not exceed 64 chars
 *   - label must be non-empty + max 32 chars (UI ergonomics)
 *   - actionQualityName must be non-empty (dispatch target)
 *   - kind must be 'static' or 'interactive'
 *
 * Reserved ID collisions are allowed during validation — the caller
 * (registerToolbarButton quality) handles upsert semantics for reserved
 * IDs separately.
 */
export function validateToolbarButton(btn: ToolbarButtonRegistration): ToolbarButtonValidation {
  if (typeof btn.id !== 'string' || btn.id.length === 0) {
    return { valid: false, reason: 'id must be non-empty' };
  }
  if (btn.id.length > 64) {
    return { valid: false, reason: 'id cannot exceed 64 characters' };
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(btn.id)) {
    return { valid: false, reason: 'id must be kebab-case (lowercase alphanumeric + hyphens)' };
  }
  if (typeof btn.label !== 'string' || btn.label.length === 0) {
    return { valid: false, reason: 'label must be non-empty' };
  }
  if (btn.label.length > 32) {
    return { valid: false, reason: 'label cannot exceed 32 characters' };
  }
  if (typeof btn.actionQualityName !== 'string' || btn.actionQualityName.length === 0) {
    return { valid: false, reason: 'actionQualityName must be non-empty' };
  }
  if (btn.kind !== 'static' && btn.kind !== 'interactive') {
    return { valid: false, reason: 'kind must be "static" or "interactive"' };
  }
  return { valid: true };
}

// ============================================
// REGISTRATION ARITHMETIC (pure functions on the array)
// ============================================

/**
 * Adds a button to the registry. If a button with the same `id` already
 * exists, UPSERTS (replaces). Order: new buttons appended; upserted
 * buttons retain their original position.
 */
export function addToolbarButton(
  current: ToolbarButtonRegistration[],
  btn: ToolbarButtonRegistration,
): ToolbarButtonRegistration[] {
  const existingIndex = current.findIndex((b) => b.id === btn.id);
  if (existingIndex >= 0) {
    const next = current.slice();
    next[existingIndex] = btn;
    return next;
  }
  return [...current, btn];
}

/**
 * Removes a button by id. Returns the unchanged array if no match.
 * Reserved button IDs are removable — callers that need to prevent
 * removal should check `isReservedToolbarButtonId` upstream.
 */
export function removeToolbarButton(
  current: ToolbarButtonRegistration[],
  id: string,
): ToolbarButtonRegistration[] {
  const idx = current.findIndex((b) => b.id === id);
  if (idx < 0) return current;
  return [...current.slice(0, idx), ...current.slice(idx + 1)];
}

/**
 * Toggles button enabled state by id. Returns unchanged array if no match.
 */
export function setToolbarButtonEnabled(
  current: ToolbarButtonRegistration[],
  id: string,
  enabled: boolean,
): ToolbarButtonRegistration[] {
  const idx = current.findIndex((b) => b.id === id);
  if (idx < 0) return current;
  const next = current.slice();
  next[idx] = { ...next[idx], enabled };
  return next;
}

/**
 * Returns the button by id, or null if absent.
 */
export function findToolbarButton(
  current: ToolbarButtonRegistration[],
  id: string,
): ToolbarButtonRegistration | null {
  return current.find((b) => b.id === id) ?? null;
}

/**
 * Returns true if `id` is in the reserved set.
 */
export function isReservedToolbarButtonId(id: string): boolean {
  return RESERVED_TOOLBAR_BUTTON_IDS.includes(id);
}

/**
 * Stable sort: reserved buttons first (in reserved-list order), then
 * user-registered buttons in their insertion order. Used by the Vue
 * surface for v-for rendering.
 */
export function sortToolbarButtonsForRender(
  buttons: ToolbarButtonRegistration[],
): ToolbarButtonRegistration[] {
  const reserved: ToolbarButtonRegistration[] = [];
  const userRegistered: ToolbarButtonRegistration[] = [];
  for (const btn of buttons) {
    if (isReservedToolbarButtonId(btn.id)) {
      reserved.push(btn);
    } else {
      userRegistered.push(btn);
    }
  }
  // Sort reserved by their position in RESERVED_TOOLBAR_BUTTON_IDS
  reserved.sort((a, b) => {
    const ai = RESERVED_TOOLBAR_BUTTON_IDS.indexOf(a.id);
    const bi = RESERVED_TOOLBAR_BUTTON_IDS.indexOf(b.id);
    return ai - bi;
  });
  return [...reserved, ...userRegistered];
}
