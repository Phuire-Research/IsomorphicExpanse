/**
 * GitM Update Types — the heavy diff/resolved bodies the D-U4.2 watcher relays (Fork A·β)
 *
 * The thin live STAGE RAIL (UpdateStatusShape · D-U4.1) rides gitm.json; the HEAVY lists
 * (the per-path diff buckets + the resolver decisions) ride their OWN watcher (this concept's
 * gitmUpdateWatcher) OFF gitm.json's per-change broadcast — so a multi-hundred-entry diff
 * never re-broadcasts on every unrelated git change. These shapes mirror the diff/resolved
 * JSON contracts the bridge ActionStrategy writes (D-U4.3 · scp-update-diff.<name>.json /
 * scp-update-resolved.<name>.json) — until D-U4.3 lands the files never exist → the watcher
 * finds nothing → null state → INERT.
 *
 * KeyedSelector law (STRATIMUX-REFERENCE.md "🧠 Strategic State Management" #4): NO optionals
 * on the SHAPE — the diff JSON's per-entry `collisionZoneName` is OPTIONAL in the file, so the
 * config's parsePayload coerces a missing value → '' to keep UpdateEntry non-optional.
 *
 * The client refs start null (mirrors gitmJson · null until the relay arrives). No non-null
 * sentinel is needed: the watcher's ENOENT → null path (StcpComponentRelayConfig.parsePayload
 * returning null + emptyPayload:null) covers absence the same way gitmJson stays null.
 *
 * Citation: gitm.type.ts (UpdateStatusShape · GitmJsonShape · the dual-deploy payload-type +
 *           explicit-quality-map pattern this file mirrors).
 * Citation: SCP-UPD-D-U4-WGB.md §◆ D-U4.2 (the diff/resolved JSON contracts · authoritative shapes).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🧠 Strategic State Management".
 */
// ============================================
// DIFF / RESOLVED JSON CONTRACT SHAPES
// ============================================

// One per-path entry in a diff bucket (apply / preserve / conference). `collisionZoneName`
// is OPTIONAL in the source JSON → parsePayload coerces missing → '' (KeyedSelector law · no
// optional on the SHAPE).
export type UpdateEntry = {
  path: string;
  status: string;
  collisionZone: boolean;
  collisionZoneName: string;
};

// The heavy diff body — provenance (the 3-way merge SHAs + clone mode), summary counts +
// collision-zone names, and the three per-path buckets. Written by scp-3way-diff.sh via the
// D-U4.3 StageRelay node to scp-update-diff.<name>.json.
export type UpdateDiffShape = {
  schemaVersion: string;
  scpName: string;
  generatedAt: string;
  provenance: {
    baseSha: string;
    oursSha: string;
    theirsSha: string;
    resultTree: string;
    theirsTemplatePath: string;
    cloneMode: string;
    mergeMechanism: string;
  };
  summary: {
    apply: number;
    preserve: number;
    conference: number;
    collisionZones: string[];
  };
  buckets: {
    apply: UpdateEntry[];
    preserve: UpdateEntry[];
    conference: UpdateEntry[];
  };
};

// SCP-UPD D-U5 — the CANONICAL resolved decision (the Gitm Resolver Suite 8 writes these;
// the bridge apply quality reads + lands them). Reconciled to ONE shape across the Resolver
// Skill S5, this type, parseResolved, and the apply quality — so the BYTES survive the parse
// (the silent-coerce trap: a field-defensive parse that drops resolvedContent/patch would
// write empty bytes). The apply LANDING contract:
//   disposition 'write'    → write resolvedContent verbatim to <scpDir>/<path>
//   disposition 'patch'    → apply patch (a unified-diff hunk) to <scpDir>/<path>
//   disposition 'preserve' → NO-OP (the user's file is authoritative · the preserve doctrine)
// resolvedContent + patch are OPTIONAL in the file (only the relevant one is populated per
// disposition) → parseResolved coerces a missing value → '' (KeyedSelector law · non-optional
// SHAPE). `bucket` echoes the diff bucket the decision came from (apply/preserve/conference);
// `note` is the resolver's per-path annotation (the "attending clinician" note · was attendingNote).
export type ResolvedDisposition = 'write' | 'patch' | 'preserve';
export type ResolvedBucket = 'apply' | 'preserve' | 'conference';
export type ResolvedDecision = {
  path: string;
  bucket: ResolvedBucket;
  disposition: ResolvedDisposition;
  resolvedContent: string; // the full file content to write (disposition 'write') · '' otherwise
  patch: string; // the unified-diff hunk to apply (disposition 'patch') · '' otherwise
  note: string; // the resolver's per-path note (was attendingNote)
};

// SCP-UPD D-U5 — the CANONICAL resolved body the apply quality reads. `pending` = the count of
// unresolved `conference` decisions (the apply HALT gate · apply does NOTHING when pending > 0).
// `summary` carries the resolver's per-disposition tallies (informational · the apply quality
// trusts the decisions[] totality, not the summary). Written to scp-update-resolved.<name>.json.
export type ResolvedSummary = {
  write: number;
  patch: number;
  preserve: number;
  pending: number;
};
export type UpdateResolvedShape = {
  schemaVersion: string;
  scpName: string;
  decisions: ResolvedDecision[];
  pending: number;
  summary: ResolvedSummary;
};

// ============================================
// QUALITY PAYLOAD TYPES (dual-deploy · mirror GitmSetGitmJson*Payload)
// ============================================

// Diff relay/Base payload — `updateDiff` carries the parsed body (or null on absent/parse-fail).
export type GitmSetUpdateDiffPayload = {
  updateDiff: UpdateDiffShape | null;
};

// Resolved relay/Base payload — `updateResolved` carries the parsed body (or null).
export type GitmSetUpdateResolvedPayload = {
  updateResolved: UpdateResolvedShape | null;
};

// ============================================
// EMPTY SENTINELS (null · the Idle/absent sentinel · mirrors emptyPayload:null in gitmRelay.config)
// ============================================

// null is the "no data" sentinel in the STCP engine (NOT a typed empty shape) — the same idle
// sentinel gitmRelay.config.ts uses (emptyPayload:null). The client refs seed null directly.
export const UPDATE_DIFF_EMPTY: UpdateDiffShape | null = null;
export const UPDATE_RESOLVED_EMPTY: UpdateResolvedShape | null = null;
