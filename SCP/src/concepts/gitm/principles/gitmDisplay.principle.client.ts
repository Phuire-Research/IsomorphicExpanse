/**
 * gitmDisplay Principle — Client Deployment (SDPS · read-only controller sync)
 *
 * Separate Display Principle Sync (SDPS) clone of scsBridgeDisplay.principle.client.ts,
 * MINUS the principleDispatchShim — the gitm controller is READ-ONLY (Decision 2,
 * S3 Yellow Blueprint §W4a). Dispatch stays on scsBridgeController.triggerGitmAction.
 *
 * Subscribes to the gitm BASE concept's gitmJson via Tier-2 DECK K and pushes the
 * delta into the global gitm controller so the A/B button group + the Merge gate read
 * a reactive source (replacing the per-button /gitm-status polls).
 *
 * Flow:
 *  1. Principle starts on muxium kick
 *  2. Looks up the global gitm controller (registered by IslandWrapper)
 *  3. Initial sync · push current gitmJson from this concept's own K ref
 *  4. Stage subscribes to k_.gitmJson (beat 0)
 *  5. On selector change → controller.sync({ gitmJson })
 *  6. Cleanup concludes the display plan (no Muxium binding to clear · read-only)
 *
 * GITM A↔B Refinement (#641-R) · S3 Yellow Blueprint §W4b · S5 Blue Wave W4.
 * Citation: scsBridgeDisplay.principle.client.ts (SDPS sync exemplar).
 * Citation: GITM-AB-R-S3-YELLOW-BLUEPRINT.md §W4b.
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns".
 */
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  GitmClientState,
  GitmClientQualities,
  GitmClientConcept,
  GitmJsonShape,
} from '../gitm.type';
import { getGlobalGitmController } from '../gitmController';
// W3d · THE HELD-SEED single source (the Turn-Over Disconnect Guard) — persist every live gitmJson
// and seed the last-known-good SYNCHRONOUSLY on boot, before the async MOCH fetch, so the Sword
// never renders a transient blank workingBranch in the reload → gitmJson:null → fetch-resolve gap.
import { readGitmLastKnownGood, writeGitmLastKnownGood } from '../../../model/gitmLastKnownGood.model';

// The gitm BASE concept deck shape this principle observes (Tier-1 from its own view).
type GitmDisplayDeck = MuxiumDeck & { gitm: GitmClientConcept };

export type GitmDisplayPrinciple = PrincipleFunction<
  GitmClientQualities,
  GitmDisplayDeck,
  GitmClientState
>;

export const gitmDisplayPrinciple: GitmDisplayPrinciple = ({ k_, e_, nextA, plan }) => {
  console.log('[GitM Display] Principle started · SDPS · read-only gitmJson sync');

  // MOCH hoisted (page-independent hydration · the 075 Home-page MERGEGATE root): a fresh
  // muxium boots with gitmJson null and the STCP BOCR backfill is dead across all relays
  // (#640) — so until the NEXT gitm.json change lands, every gitm gate (Merge B→A, Turn-Over
  // A, badges) sits cold on any page without its own on-mount fetch. GitmLanding's MOCH only
  // covers the GitM page; this principle runs on EVERY client muxium (gitm is a BASE concept),
  // so the snapshot fetch here hydrates all pages. The SMRP relay keeps it fresh thereafter.
  // W3d · THE HELD SEED (the Turn-Over Disconnect Guard · runs BEFORE the async fetch below) — on a
  // fresh muxium boot (gitmJson null), apply the last-known-good snapshot SYNCHRONOUSLY so the Sword
  // reads the held workingBranch immediately, never a transient blank in the MOCH gap. This is HELD
  // data (the last relay, not a live read); the W3c liveness gate (connectionEstablished) still
  // governs the B-creation invite, so the seed surfaces the branch WITHOUT falsely inviting a forge.
  // The subsequent /gitm-status fetch (or the SMRP relay) supersedes it with the live snapshot.
  // C646 · THE SELF-DEFEATING GATE (the persistent-3 root): the held seed below fills gitmJson,
  // and the fetch was gated on gitmJson === null AFTER the seed — so whenever a held seed
  // existed, the authoritative /gitm-status fetch NEVER FIRED, and with the relay backfill
  // dormant (#640 BOCR) the stale seed persisted until the next on-disk change. Capture the
  // boot null-ness BEFORE seeding; the fetch supersedes the seed on every seeded boot.
  const bootedNull = typeof window !== 'undefined' && k_.gitmJson.select() === null;
  if (bootedNull) {
    const held = readGitmLastKnownGood();
    if (held !== null) {
      // C645 · THE ROSTER-HONEST SEED (the client-seed instance of the C630/C640 freshness family) —
      // seed the held snapshot with the branches ROSTER STRIPPED (branches:[]). A persisted roster is
      // PRESENCE, not TRUTH: the last-known-good was captured during a real git window (e.g. the 10s
      // branch delete/recreate) and can carry a partial/stale roster; rendering it synchronously at boot
      // would surface a partial-roster phantom before /gitm-status supersedes. The held seed still closes
      // the workingBranch/decision blank gap (its PURPOSE); the ROSTER waits for the authoritative supply
      // (the live /gitm-status fetch below / the SMRP relay), which lands the true branches[].
      nextA(e_.gitmSetGitmJson({ gitmJson: { ...held, branches: [] } }));
    }
  }

  if (bootedNull) {
    void fetch('/gitm-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((parsed) => {
        if (parsed && typeof parsed.isRepo === 'boolean') {
          nextA(e_.gitmSetGitmJson({ gitmJson: parsed as GitmJsonShape }));
        }
      })
      .catch(() => {
        /* absent/unreachable → keep null; the relay still delivers live status */
      });
  }

  const controller = getGlobalGitmController();
  if (controller) {
    // Initial sync · push current gitmJson from this concept's own K ref (Principle Context).
    controller.sync({ gitmJson: k_.gitmJson.select() });
  } else {
    console.warn(
      '[GitM Display] No global gitm controller registered · IslandWrapper has not mounted · sync deferred',
    );
  }

  const displayPlan = plan('GitM Display Sync (Client)', ({ stage }) => [
    stage(
      // Tier-2 d.client.d.gitm.k.* access via cast (matches scsBridgeDisplay pattern).
      ({ d }) => {
        const liveController = getGlobalGitmController();
        if (!liveController) {
          return;
        }
        const gitmCtx = (d as any).client?.d?.gitm ?? d.gitm;
        const liveGitmJson = gitmCtx.k.gitmJson.select();
        liveController.sync({ gitmJson: liveGitmJson });
        // W3d · PERSIST the last-known-good on every live relay (null is never persisted · the dark
        // hour must not overwrite the held snapshot) so the next reload seeds from the freshest state.
        writeGitmLastKnownGood(liveGitmJson);
      },
      {
        selectors: [k_.gitmJson],
        beat: 0,
      },
    ),
  ]);

  return () => {
    console.log('[GitM Display] Principle cleanup · concluding display plan');
    displayPlan.conclude();
  };
};
