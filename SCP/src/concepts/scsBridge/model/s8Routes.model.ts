/**
 * s8Routes.model.ts — the REWRITE-PROOF Suite 8 route paths (W1 · the BO-1 law applied to routes)
 *
 * THE CLASS THIS CURES (C758 · the Frontier Hello World determination): the Forge's blanket
 * suite8→{name} token rewrite over copied page components REWROTE THE FETCH ROUTE LITERALS
 * (/suite8-cascade/ → /frontierHelloWorld-cascade/ — a route that exists NOWHERE server-side),
 * so every minted concept's on-mount floors 404ed against a perfectly healthy server. The
 * server registers these routes ONCE, designation-parameterized; the client paths must
 * therefore be IMMUTABLE across the mint rewrite.
 *
 * THE BO-1 PRECEDENT (s8Anchor.model): route/lookup contracts live in a NEVER-COPIED scsBridge
 * model whose exported names carry NO `suite8` token (`s8` survives the rewrite), so the
 * suite8:page token rewrite cannot break them in mints. Same law here: the `/suite8-*` literals
 * live ONLY in this file; copied components import `s8*Path` helpers by rewrite-proof name.
 *
 * Citation: s8Anchor.model.ts (BO-1 · the never-copied route home + the s8 naming law).
 * Citation: vue.principle.ts /suite8-cascade · /suite8-menu · /suite8-doc-tiers · /suite8-doc-save.
 */

/** GET — the Cascade Memory floor (manifest + active file contents · the C750 self-query). */
export const s8CascadePath = (designation: string): string =>
  `/suite8-cascade/${encodeURIComponent(designation)}`;

/** GET — the Shatterite Menu floor (menu.json as a MenuStage · the C757 ODCF floor). */
export const s8MenuPath = (designation: string): string =>
  `/suite8-menu/${encodeURIComponent(designation)}`;

/** GET — the prior-tier document names (DIAMOND/ONYX-TIER-*.md · never their bodies). */
export const s8DocTiersPath = (designation: string): string =>
  `/suite8-doc-tiers/${encodeURIComponent(designation)}`;

/** POST — the Diamond-only page-edit save (ONYX 403 by nature · body carries designation). */
export const S8_DOC_SAVE_PATH = '/suite8-doc-save';

/** POST — the client-persisted stage iteration (2A): body { designation, currentStageIndex };
 *  read-modify-writes ONLY currentStageIndex into the designation's menu.json — the watcher
 *  then relays the converged document to every client (the file stays the authority). */
export const S8_MENU_STAGE_SET_PATH = '/suite8-menu-stage';

/** GET — the Shatterite Menu's OWN documentation (W6 · the summon ground): serves the shipped
 *  Cascades/Documentation/SHATTERITE-MENU.md so the component's manual is pullable from the
 *  component itself — the self-referential close of the Pass Through doctrine (§7). */
export const S8_MENU_DOC_PATH = '/suite8-menu-doc';
