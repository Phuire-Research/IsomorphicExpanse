/**
 * GitM Resolver Vermillion — the diff-resolution directive GENERATOR (D-U4.4)
 *
 * A pure string builder. `buildGitmResolverVermillion` returns the directive TEXT
 * that the Update view hands to a spawned Gitm Resolver session via the existing
 * deliver-vermillion controller leg (`triggerDeliverVermillion` → scs_deliver_vermillion,
 * wrapped as an `SCS:Vermillion` message). The spawned session EXECUTES the contained
 * directive — this model does NOT execute anything (no I/O, no framework import).
 *
 * The directive arc the emitted text drives (per-update, atomic):
 *   1. Read the diff JSON at `diffJsonPath` (the three per-path buckets the staging
 *      update produced: apply / preserve / conference).
 *   2. Apply the resolution doctrine — the user's expansions always win; registration
 *      zones union (both kept); surface ONLY true overlaps where the same line span was
 *      edited on both sides.
 *   3. For every conference entry, decide a resolution and write a per-path note.
 *   4. Emit the resolved JSON at `Cascades/Bridge/scp-update-resolved.<scpName>.json`
 *      (the watcher fires on this write; the Update view then reflects the decisions).
 *
 * Diameter: this generator (a pure text builder) ↔ the deliver-vermillion leg (a
 * registered bridge tool) — UNLIKE Demometers; the through-measure is the directive body:
 * this model PRODUCES the body, the controller DELIVERS it.
 * Diameter: the resolved JSON this directive instructs the session to write IS the
 * UpdateResolvedShape the gitmUpdateWatcher consumes (gitmUpdate.type.ts).
 *
 * Citation: cadmiumResearchVermillion.model.ts (the pure Vermillion-model template).
 * Citation: SCP-UPD-D-U4-WGB.md §◆ D-U4.4 (buildGitmResolverVermillion contract).
 * Citation: gitmUpdate.type.ts (UpdateDiffShape / UpdateResolvedShape · the read/write contracts).
 */

// ============================================
// buildGitmResolverVermillion — the diff-resolution directive GENERATOR
// ============================================
//
// Returns the directive TEXT (string). PURE — no I/O, no time, no framework import.
// `scpName` selects the resolved-output filename; `diffJsonPath` is the diff body the
// session reads. The directive is wrapped as an SCS:Vermillion message at delivery.

export function buildGitmResolverVermillion(scpName: string, diffJsonPath: string): string {
  const resolvedPath = `Cascades/Bridge/scp-update-resolved.${scpName}.json`;

  return `SCS:Vermillion Resolve the staging-update collisions for this project, then write the resolution file.

<VermillionPlan topic="Staging Update Resolution · ${scpName}">

Project: ${scpName}
Diff Source: ${diffJsonPath}
Resolution Output: ${resolvedPath}

ORIENTATION (the Three Grounds — read BEFORE any git command):
  1. The diff JSON's provenance block carries "scpRepoRoot" (the RED repo — the ONLY git
     object database in this operation; ours=HEAD, base=the init root, and the merged
     resultTree all live there) and "theirsTemplateRoot" (the retained clone parent).
  2. EVERY git object command MUST run as: git -C <provenance.scpRepoRoot> …
     (e.g. git -C <scpRepoRoot> cat-file -p <provenance.resultTree>:<path>).
     Your working directory is a DIFFERENT git repo — a bare git command reads the
     wrong object database and fails with "could not get object info".
  3. The clone has NO .git (a file copy). Read THEIRS content as plain files at
     <provenance.theirsTemplateRoot>/<path> (the diff paths are SCP/-prefixed and align).
  4. Read OURS content as plain files at <provenance.scpRepoRoot>/<path>.
  5. Apply-bucket membership IS the verification the user's file was untouched — the
     diff script already proved it; do not re-derive hashes.

Step 1 (Simple Prompt) — Read the diff:
  Informative: Read the diff JSON at "${diffJsonPath}". It carries three per-path buckets —
    "apply" (changes that auto-apply · no decision needed), "preserve" (the user's own
    expansions · left untouched · no decision needed), and "conference" (the entries that
    need a decision). Each conference entry has a "path", a "status", a "collisionZone"
    flag, and a "collisionZoneName".
  Actionable: Hold the conference list. BREVITY LAW: do NOT run builds, npm installs, or
      broad filesystem sweeps — content patches verify by Read-back alone; your judgment is the
      deliverable and the apply quality owns the landing. Only the conference entries require a decision;
    apply and preserve are informational here.

PART-RENEWAL ORIENTATION: Identity-bearing fields — package.json name/description,
  scp.config.json scpName, and the lock name — are RULE-PRESERVED at the apply seam
  via scripts/scp-update-rules.json. When an identity reversion appears in the diff,
  it is EXPECTED-AND-GUARDED: record it in that entry's "note" field and move on.
  THE NAME PRIORITY LAW: the USER'S SCP NAME ("${scpName}") is ALWAYS authoritative —
  the template's name ("template" / "huirth-scp-template" tokens) is NEVER adopted,
  NEVER surfaced as a conference question, and NEVER treated as a decision. A
  template-name reversion in the diff is pure noise: auto-resolve toward the user's
  name and move on. Asking the user about naming is a redundant setup step that can
  only harm the experience — the name was decided at install and stands.
  CRITICAL — PROTECT THE SCP NAME: give identity-bearing files disposition "write" with
  the FULL theirs content in resolvedContent (the apply seam then merges the preserved
  identity fields onto it). NEVER disposition "patch" for an identity-bearing file — a
  raw hunk would land the reversion verbatim.
  Do NOT invent other safety stories (e.g. "cloneRenameEngine re-stamps during apply"
  is FALSE — cloneRenameEngine is install-time only; the rule file is the real guard).

UI-PROGRESS (best-effort — attempt before each Step below): Stamp progress to the UI via the
  bridge tool gitm_update_progress at the /mcp endpoint (read the endpoint from
  Cascades/Bridge/bridge.json) with { stage: 'resolving', note: '<what you are doing now>' }.
  /MCP CALL DISCIPLINE (every bridge tool call): curl -s -m 15 -H 'Content-Type: application/json'
    — the response is ONE JSON body; read it, then proceed. NEVER background these calls and never
    omit the -m timeout. Fire strictly sequentially. Never pass scpName to any gitm tool — the
    bridge resolves the active SCP from its own update state.
  FAILURE RULE: a failed or timed-out progress stamp NEVER blocks the work — proceed immediately.
    The stamp is informational only; the resolution file is the deliverable.

Step 2 (Simple Prompt) — Apply the resolution doctrine:
  Informative: Three rules govern every decision —
    1. The user's expansions win. Where the user has extended a file, that extension is kept.
    2. Registration zones union. When an entry's "collisionZone" is true, BOTH sides are
       kept (the new entries from the template AND the user's entries merge — nothing is
       dropped). These are not true conflicts.
    3. Surface only true overlaps. A true overlap is where the SAME span was edited on both
       sides and the two edits cannot both stand. These are the only entries a human must
       review.
  Actionable: Classify each conference entry as a zone-union (auto-merge · both kept) or a
    true overlap (needs human review). For each true-overlap entry, surface via AskUserQuestion in
    the Shatterite Update Variant shape: an OVERVIEW block (path · one-line ours-summary · one-line
    theirs-summary · stakes) then OPTIONS where each option row states its tool placement (the
    disposition + resolved fields set on selection): [A] Keep ours (default · preserve · note records
    template intent) [B] Take theirs (write · theirs verbatim) [C] Manual merge (write · user provides).
    Footer: remaining conflict count · Esc = HALT (pending stays elevated · apply blocked · do NOT emit).

Step 3 (Simple Prompt) — Decide every entry (the apply quality lands these):
  Informative: The apply quality reads the resolution file and lands each decision by its
    "disposition" — so EVERY file from ALL THREE buckets must appear once with a disposition:
      - "write"    → the apply quality writes "resolvedContent" verbatim to the file. Use this
                     for zone-union merges and any conference entry the user resolves in favor
                     of a merged result. Put the FULL merged file content in "resolvedContent".
      - "patch"    → the apply quality applies "patch" (a unified-diff hunk) to the file. Use
                     this for "apply"-bucket files (the template moved · the user never touched
                     them). SOURCE the hunk: git -C <provenance.scpRepoRoot> diff <oursSha> <resultTree> -- <path>.
                     THE VERBATIM LAW: the hunk must be the BYTE-EXACT output of that command —
                     redirect it to a temp file and Read it back; NEVER re-type, summarize, or
                     shorten a line (ONE truncated long line = corrupt patch = the ENTIRE apply
                     fails for every file). If any line is long anor the hunk is more than you
                     can carry byte-verbatim, use disposition "write" with the full theirs
                     content instead — write is always safe. You may verify a hunk with
                     git -C <provenance.scpRepoRoot> apply --check --whitespace=nowarn <tmpfile>
                     BEFORE writing the resolution file ONLY — never after (THE LANDING RACE).
                     BOTH-ADDED-IDENTICAL (base absent · ours===theirs · empty hunk): use
                     disposition "write" with the full content instead — never an empty patch.
      - "preserve" → the apply quality does NOTHING (the user's file wins). Use this for every
                     "preserve"-bucket file AND any true-overlap conference entry the user keeps.
  Actionable: Build one decision per file across apply + preserve + conference. For "write" set
    "resolvedContent" (full content) and leave "patch" empty; for "patch" set "patch" (the hunk)
    and leave "resolvedContent" empty; for "preserve" leave both empty. Count how many TRUE
    overlaps remain UNRESOLVED — that count is "pending" (the apply HALT gate · apply refuses
    while pending > 0). A preserve disposition is RESOLVED, not pending.

Step 4 (Simple Prompt) — Write the resolution file:
  Informative: Synthesize the decisions into the resolution JSON. The Update view reads this
    file the moment it appears; the apply quality lands it once "pending" is 0.
  Actionable: Write "${resolvedPath}" as a single JSON object with these fields:
    {
      "schemaVersion": "<the same schemaVersion as the diff source>",
      "scpName": "${scpName}",
      "decisions": [
        {
          "path": "<the file path · repo-relative>",
          "bucket": "apply" | "preserve" | "conference",
          "disposition": "write" | "patch" | "preserve",
          "resolvedContent": "<full file content · only for disposition write · else empty>",
          "patch": "<unified-diff hunk · only for disposition patch · else empty>",
          "note": "<the short per-path note>"
        }
      ],
      "pending": <the count of true overlaps still needing human review>,
      "summary": {
        "write": <count of write decisions>,
        "patch": <count of patch decisions>,
        "preserve": <count of preserve decisions>,
        "pending": <same as the top-level pending>
      }
    }

THE LANDING RACE (doctrine — do NOT probe after writing): the bridge WATCHES for your
  resolution file and lands the apply within seconds of the write. NEVER run git apply --check
  (anor any tree probe) AFTER writing the file — you will race the landing and read the LANDED
  tree as a double-apply failure. The landed state is SUCCESS. Verify only by reading
  Cascades/Bridge/gitm.json updateStatus afterward if you must observe.

CONCLUDING SEQUENCE: The resolution file (pending 0) + the contract line below IS the complete
  deliverable. The BRIDGE owns the terminal voice — it watches for the resolution file and lands
  everything itself the moment a pending-0 file arrives: the apply (writes/patches/commits the tree)
  → the applied stamp (the Apply Success panel) → the window refocus. You do NOT invoke the landing,
  and you do NOT stamp a concluding progress note — a final 'resolving' stamp would OVERWRITE the
  bridge's terminal applied stamp and strand the rail. After writing the file:
  (1) Do NOT fire any further gitm_update_progress stamp. The last stamp you may fire is a
      per-step 'resolving' note BEFORE the write — never after. The write IS the hand-off.
  (2) On ANY hang or timeout during the earlier steps: STOP calling. Report the contract line
      with the HALT note appended:
      SCS:Vermillion:OK:<summary> · invocation-channel HALT: <which call hung>
  The user watches the bridge carry the boot-proof through.

</VermillionPlan>

After acting, respond with the contract line first:
SCS:Vermillion:OK:<one-line summary of the resolution pass>`;
}
