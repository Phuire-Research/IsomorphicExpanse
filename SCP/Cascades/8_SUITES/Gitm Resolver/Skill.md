# Gitm Resolver — Skill Document

**The read-entry.** On engagement, read `Strategy/GR-S1-Staging-Update-Resolution.md` and
execute it against the parameters the delivered `SCS:Vermillion` anchor carries. The five
signatures declared in Instance.md ground INTO the Strategy — this document maps them; the
Strategy holds the doctrine (single source · never duplicated here).

## The Engagement Law — Intent-Anchor anor Doctrine-Read

The anchor (user input) names the run: Project (`<scpName>`), Diff Source, Resolution
Output. The Strategy (Skill read) names the method. Execute the Strategy WITH the anchor's
parameters. No anchor yet → HALT and wait; parameters are never derived.

## S1 · Diff-Ingest
**Ground**: Strategy §Orientation + §Step 1.
**Mechanic**: read the diff JSON at the anchor's Diff Source; hold the three buckets; the
Three Grounds govern every subsequent git command (`git -C <provenance.scpRepoRoot>` law).
**Concluder**: the diff JSON parsed — bucket counts held. Absent/unparseable → HALT
(Halting-Complete: report the contract line with the HALT note; never guess a shape).

## S2 · Auto-Path
**Ground**: Strategy §Step 2 rule 1 + §Step 3 dispositions.
**Mechanic**: apply-bucket → disposition "patch" (THE VERBATIM LAW) anor "write" (always
safe); preserve-bucket → disposition "preserve". No decision surface — the diff proved
these classifications.
**Concluder**: every apply+preserve path carries exactly one decision row.

## S3 · Zone-Union
**Ground**: Strategy §Step 2 rule 2 + Instance §The Two Collision Zones.
**Mechanic**: `collisionZone === true` → union at registration granularity (the user's
entries first, the template's appended, identical keys deduped) → disposition "write" with
the FULL merged content.
**Concluder**: no registration from EITHER side dropped (both rosters present in the
merged content).

## S4 · Conference-Surface
**Ground**: Strategy §Step 2 rule 3 (the Shatterite Update Variant shape).
**Mechanic**: `collisionZone === false` true overlaps → AskUserQuestion per entry —
OVERVIEW block, [A] Keep ours (default) / [B] Take theirs / [C] Manual merge, the
remaining-count footer. Esc = HALT (pending stays elevated · do NOT emit).
**Concluder**: every true overlap either user-decided or counted in "pending".

## S5 · Resolution-Emit
**Ground**: Strategy §Steps 3-4 + §THE LANDING RACE + §CONCLUDING SEQUENCE.
**Mechanic**: one decision per file across ALL THREE buckets; write the resolution JSON to
the anchor's Resolution Output; the write IS the hand-off — no post-write probes, no
post-write progress stamps; respond with the contract line.
**Concluder**: the resolution file on disk with `pending` counted honestly — the bridge's
watcher landing it is the terminal proof (owned by the bridge, not this session).
