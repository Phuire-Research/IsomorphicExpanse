/**
 * cadmiumCascadeRegistration Principle — Huirth Deployment · DPASL-D1 · First Registrant
 *
 * Cadmium is the first registrant onto the Cascade Registry (the suiteCascade `cascades`
 * Record · the point of entry). This principle is the actualization of the suiteCascade
 * factory `createCascadeRegistrationPrinciple({ name: 'Cadmium Researcher' })` — a one-shot
 * registration plan that, on load, dispatches the cascade-register Base+Relay setters onto
 * the registry. The watcher's [k_.cascades] sweep then scaffolds + watches
 * `Cascades/Extended/Cadmium Researcher/Cascade.json`.
 *
 * BOUNDARY (DPASL-D1): the import flows DOWNWARD — cadmium (registrant) → suiteCascade
 * (registry owner · the factory lives there). The watcher imports NOTHING from cadmium;
 * registration flows INTO the Record, the watcher only reads OUT of it.
 *
 * DISPATCH CAPABILITY: this principle is registered into the suiteCascade Huirth concept's
 * principles array (suiteCascade.concept.huirth.ts) — the SAME muxium where the
 * cadmiumOkMonitor already dispatches `d.suiteCascade.e.suiteCascadeSetCascadeHuirthBase`
 * + `suiteCascadeSetCascadeRelay`. Both setters are therefore live for this principle's
 * `d.suiteCascade.e.*` dispatch (SuiteCascadeHuirthDeck supplies them).
 *
 * Citation: suiteCascade/model/cascadeRegistration.model.ts (CRPF factory · the shape).
 * Citation: cadmiumOkMonitor.principle.huirth.ts (co-registered into suiteCascade Huirth
 *           concept · proven d.suiteCascade.e.* dispatch from a cadmium-authored principle).
 * Citation: cadmium.type.ts (DEFAULT_CADMIUM_DESIGNATION_NAME · NDEP Name).
 */
import type { SuiteCascadeHuirthPrinciple } from '../../suiteCascade/suiteCascade.type';
import { createCascadeRegistrationPrinciple } from '../../suiteCascade/model/cascadeRegistration.model';
import { DEFAULT_CADMIUM_DESIGNATION_NAME } from '../cadmium.type';

// Actualize the factory with Cadmium's NDEP Name. On load this registers
// 'Cadmium Researcher' → 'Cascades/Extended/Cadmium Researcher/' onto the Cascade Registry.
export const cadmiumCascadeRegistrationPrinciple: SuiteCascadeHuirthPrinciple =
  createCascadeRegistrationPrinciple({ name: DEFAULT_CADMIUM_DESIGNATION_NAME });
