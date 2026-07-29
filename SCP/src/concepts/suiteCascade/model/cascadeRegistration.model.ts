/**
 * Cascade Registration Model — DPASL-D1 · CRPF (Cascade-Registration-Principle-Function)
 *
 * The Cascade Registry is the `cascades` Record on the suiteCascade (Huirth) concept —
 * the POINT OF ENTRY. Entities REGISTER their cascade onto it; the watcher
 * (suiteCascadeJsonWatcher.principle.huirth.ts) is the PURE CONSUMER that reads its own
 * `k_.cascades` and watches what is registered.
 *
 * This Model File is a factory: each registrant imports `createCascadeRegistrationPrinciple`
 * and actualizes it with ITS OWN `{ name }` to obtain a specific one-shot
 * `SuiteCascadeHuirthPrinciple` it exports + registers into the muxium where
 * `d.suiteCascade.e.*` is in scope (e.g. the suiteCascade Huirth concept, where the
 * cadmiumOkMonitor already dispatches the same Base+Relay setters).
 *
 * BOUNDARY DISCIPLINE (the whole point of DPASL-D1): this factory lives in suiteCascade
 * (the registry owner · the PRIOR base). Registrants import it DOWNWARD (cadmium →
 * suiteCascade · allowed). The watcher therefore needs ZERO import from any registrant
 * concept — registration flows INTO the Record, the watcher only reads OUT of it.
 *
 * The produced PrincipleFunction is a one-shot `plan(...)` whose stage array is:
 *   1. stageO()              — stage-0 opener (ownership-aware · auto-registers).
 *   2. stage(register)       — dispatch the cascade-register onto the registry: Base
 *                              (suiteCascadeSetCascadeHuirthBase · runs the local Huirth
 *                              reducer so cascades[name] is real server-side) + Relay
 *                              (suiteCascadeSetCascadeRelay · broadcasts via
 *                              actionExchange.serverToClient to all Clients), both via
 *                              `nextA`, THEN a single `dispatch(muxiumKick, {iterateStage})`
 *                              to advance into the concluding stage (mirrors the watcher
 *                              STAGE-0 idiom — single dispatch per stage · SBIS Base→Relay).
 *   3. conclude()            — the concluding stage (one-shot · the register fires once).
 *
 * The stub Cascade sets ALL KeyedSelector fields (no optionals): cascadeJson null +
 * missingCascadeJson true + empty activeCascadeFiles. The watcher's [k_.cascades] sweep
 * then arms a chokidar watch on `Cascades/Extended/<name>/Cascade.json`; its CWSD scaffold
 * mkdir+seeds the file, and the chokidar 'add' event reloads genuine content over the stub.
 *
 * Citation: suiteCascade/model/suite8Registration.model.ts (MPRF · Model-File-as-Function).
 * Citation: suiteCascade/principles/suiteCascade.principles.model.ts (register stage idiom ·
 *           dispatch(..., { iterateStage: true }) · all-KeyedSelector stub Cascade).
 * Citation: cadmiumOkMonitor.principle.huirth.ts (SBIS Base→Relay via nextA · d.suiteCascade.e.*).
 * Citation: webSocketClient/principles/localStorageRegistration.principle.ts (stageO →
 *           register stage → conclude · one-shot registration plan).
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns" (single dispatch
 *           per stage · nextA for queued actions · Principle Context).
 */
import {
  EXTENDED_CASCADE_DIR,
  type Cascade,
  type SuiteCascadeHuirthPrinciple,
} from '../suiteCascade.type';

// ============================================
// CRPF PARAMS — the shape a registrant passes when actualizing the factory
// ============================================

export type CascadeRegistrationParams = {
  // NDEP — the literal registry Name. Keys cascades[name] AND is the LAST path segment of
  // the registered RI directory `Cascades/Extended/<name>` (round-trips through the
  // watcher's deriveCascadeName back to <name>). Renaming the dir MUST rename this call.
  name: string;
};

// ============================================
// EXTENDED DIR DERIVATION — `Cascades/Extended/<name>` (POSIX · repo-relative)
// ============================================
//
// The registered RI directory for a cascade Name. Built as a forward-slash repository-
// relative path so it round-trips through the watcher's deriveCascadeName (last segment)
// regardless of host platform. (The watcher resolves it against SCS_ROOT at watch time.)
export const deriveExtendedCascadeDirectory = (name: string): string =>
  `${EXTENDED_CASCADE_DIR}/${name}`;

// ============================================
// CRPF — the primary export; each registrant imports + actualizes this
// ============================================

export const createCascadeRegistrationPrinciple = (
  params: CascadeRegistrationParams,
): SuiteCascadeHuirthPrinciple => {
  const { name } = params;
  const cascadeDirectory = deriveExtendedCascadeDirectory(name);

  // The all-KeyedSelector stub Cascade — every field set (no optionals). cascadeJson null +
  // missingCascadeJson true until the watcher's CWSD scaffold + chokidar reload land the
  // real Cascade.json over this stub.
  const stubCascade: Cascade = {
    name,
    cascadeDirectory,
    cascadeJson: null,
    activeCascadeFiles: [],
    missingCascadeJson: true,
  };

  const cascadeRegistrationPrinciple: SuiteCascadeHuirthPrinciple = ({ plan, nextA }) => {
    console.log('[Cascade Registration] Principle started · registering cascade · name=', name);

    const registrationPlan = plan(
      `SuiteCascade Registration (${name})`,
      ({ stage, stageO, conclude }) => [
        // 1 · stage-0 opener (ownership-aware · auto-registers).
        stageO(),

        // 2 · register the cascade onto the registry (SBIS Base→Relay), then advance.
        stage(({ d, dispatch }) => {
          // Base first — runs the local Huirth reducer so cascades[name] is real server-side.
          nextA(
            d.suiteCascade.e.suiteCascadeSetCascadeHuirthBase({ name, cascade: stubCascade }),
          );
          // Relay — broadcasts via actionExchange.serverToClient to all connected Clients.
          nextA(
            d.suiteCascade.e.suiteCascadeSetCascadeRelay({ name, cascade: stubCascade }),
          );
          console.log(
            '[Cascade Registration] registered · name=',
            name,
            '· cascadeDirectory=',
            cascadeDirectory,
          );
          // Single dispatch per stage — advance into conclude (the watcher [k_.cascades]
          // sweep then arms + scaffolds + watches Cascades/Extended/<name>/Cascade.json).
          dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
        }),

        // 3 · concluding stage (one-shot · the register fires once).
        conclude(),
      ],
    );

    return () => {
      console.log('[Cascade Registration] Principle cleanup · name=', name);
      registrationPlan.conclude();
    };
  };

  return cascadeRegistrationPrinciple;
};
