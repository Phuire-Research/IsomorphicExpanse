/**
 * GitM Resolver Vermillion — the INTENT ANCHOR generator (MD-RS · RS.2)
 *
 * A pure string builder. `buildGitmResolverVermillion` returns the ANCHOR TEXT the
 * Update view hands to a spawned Gitm Resolver session via the deliver-vermillion leg
 * (`triggerDeliverVermillion` → scs_deliver_vermillion, wrapped as an `SCS:Vermillion`
 * message). This model does NOT execute anything (no I/O, no framework import).
 *
 * THE INTENT-ANCHOR anor DOCTRINE-READ PATTERN (MD-RS): the anchor carries the USER'S
 * BIAS OF INTENT — which SCP, which diff, which output — as the session's anchor. The
 * DOCTRINE (orientation grounds, resolution rules, dispositions, the Verbatim Law, the
 * Landing Race, the Concluding Sequence) lives in the resolver's OWN Suite 8 Strategy:
 *   Cascades/8_SUITES/Gitm Resolver/Strategy/GR-S1-Staging-Update-Resolution.md
 * — SCP-local, versioned WITH the SCP, renewed by the very update circuit the resolver
 * serves. The anchor names the run; the Strategy names the method. NO doctrine rides
 * this builder: a doctrine change is a Strategy edit, never an anchor edit.
 *
 * Diameter: this generator (a pure text builder) ↔ the deliver-vermillion leg (a
 * registered bridge tool) — UNLIKE Demometers; the through-measure is the anchor body.
 * Diameter: the anchor's parameter block ↔ the Strategy's Parameters section — the
 * names (<scpName>/<diffJsonPath>/<resolvedPath>) are the binding contract (see
 * Maintainer.md §Boundary Law — never renamed unilaterally on either side).
 *
 * Citation: cadmiumResearchVermillion.model.ts (the pure Vermillion-model template).
 * Citation: DIAMOND-MACRO-RESOLVER-SOVEREIGNTY.md §BAND 2 (the thin anchor contract).
 */

// ============================================
// buildGitmResolverVermillion — the intent anchor GENERATOR
// ============================================
//
// Returns the anchor TEXT (string). PURE — no I/O, no time, no framework import.
// `scpName` selects the resolved-output filename; `diffJsonPath` is the diff body the
// session reads. The anchor is wrapped as an SCS:Vermillion message at delivery.

export function buildGitmResolverVermillion(scpName: string, diffJsonPath: string): string {
  const resolvedPath = `Cascades/Bridge/scp-update-resolved.${scpName}.json`;

  return `SCS:Vermillion Resolve the staging-update collisions for ${scpName}, then write the resolution file.

<VermillionPlan topic="Staging Update Resolution · ${scpName}">

Project: ${scpName}
Diff Source: ${diffJsonPath}
Resolution Output: ${resolvedPath}

Step 1 (Simple Prompt) — Read your doctrine:
  Informative: Your resolution doctrine is your own Suite 8's Strategy (SCP-local):
    Cascades/8_SUITES/Gitm Resolver/Strategy/GR-S1-Staging-Update-Resolution.md
  Actionable: Read it in full. Its Parameters section binds to this anchor:
    <scpName> = ${scpName} · <diffJsonPath> = ${diffJsonPath} · <resolvedPath> = ${resolvedPath}

Step 2 (Simple Prompt) — Execute the Strategy:
  Informative: The Strategy carries every ground and law — orientation, resolution rules,
    dispositions, progress discipline, and the concluding sequence. This anchor carries
    only the run: the project, the diff, and the output above.
  Actionable: Execute the Strategy start to contract line with the bound parameters.

</VermillionPlan>

After acting, respond with the contract line first:
SCS:Vermillion:OK:<one-line summary of the resolution pass>`;
}
