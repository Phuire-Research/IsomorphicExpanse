/**
 * registerSampleDesignations Quality — Local Reducer
 *
 * Idempotent registration of sample Suite 8 designations matching the
 * actual Suite 8 directories in Cascades/8_SUITES/. Each sample includes
 * baked-in placeholder loaded content for Pewter Tessera (visual smoke
 * test target). Real file-loading from disk is deferred to D4.5 / A2-D1
 * (Cadmium Researcher where designation registration happens from UI).
 *
 * Sample registry covers: Pewter Tessera · Stratimuxian Automata ·
 * Cadmium Researcher · Teal Claude · SCP Researcher.
 *
 * Citation: DIAMOND-TIER-M1-A1-D4.md · Wave A (revised scope)
 */
import { createQualityCard, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeDesignation,
} from '../graphiteScribe.type';

const SAMPLE_DESIGNATIONS: GraphiteScribeDesignation[] = [
  {
    name: 'Pewter Tessera',
    diamondPath: 'Cascades/Working/DIAMOND-TIER-M1-A1-D4.md',
    onyxPath: 'Cascades/Working/ONYX-TIER-9.md',
    cascadeJsonPath: 'Cascades/Cascade.json',
    directoryPath: 'Cascades/8_SUITES/Pewter Tessera',
    description: 'HiFi Design System Maintainer · Suite 8 Dynamic',
    color: '#9aa0a8',
  },
  {
    name: 'Stratimuxian Automata',
    diamondPath: 'Cascades/Working/DIAMOND-TIER-MACRO-1.md',
    onyxPath: 'Cascades/Working/ONYX-TIER-9.md',
    cascadeJsonPath: 'Cascades/Cascade.json',
    directoryPath: 'Cascades/8_SUITES/Stratimuxian Automata',
    description: 'Autonomous Cascade Engagement via /loop',
    color: '#4a5568',
  },
  {
    name: 'Cadmium Researcher',
    diamondPath: 'Cascades/Working/DIAMOND-TIER-M1-A1-D4.md',
    onyxPath: 'Cascades/Working/ONYX-TIER-9.md',
    cascadeJsonPath: 'Cascades/Cascade.json',
    directoryPath: 'Cascades/8_SUITES/Cadmium Researcher',
    description: 'Spawned ClaudeCode Instance Page Island (Aspirant 2 target)',
    color: '#c44d22',
  },
  {
    name: 'Teal Claude',
    diamondPath: 'Cascades/Working/DIAMOND-TIER-MACRO-1.md',
    onyxPath: 'Cascades/Working/ONYX-TIER-9.md',
    cascadeJsonPath: 'Cascades/Cascade.json',
    directoryPath: 'Cascades/8_SUITES/Teal Claude',
    description: 'Conductor · Band assignment · Shatterite Menu',
    color: '#008080',
  },
  {
    name: 'SCP Researcher',
    diamondPath: 'Cascades/Working/DIAMOND-TIER-M1-A1-D4.md',
    onyxPath: 'Cascades/Working/ONYX-TIER-9.md',
    cascadeJsonPath: 'Cascades/Cascade.json',
    directoryPath: 'Cascades/8_SUITES/SCP Researcher',
    description: 'Personal SCP Designation Manager · SCP Adapt cascade',
    color: '#a35e3b',
  },
];

const SAMPLE_PEWTER_DIAMOND = `# Pewter Tessera — Sample Diamond Snapshot

**Designation**: Pewter Tessera
**Role**: HiFi Design System Maintainer within the Suite Cascade

## Pearl

Pewter Tessera is the **Design + System Muxification** Suite 8. Design (creative
visual capability) and System (CSS design token infrastructure) compose
bidirectionally — neither sequential nor hierarchical, but mutually reinforcing.

## Loaded Skills (8 Design)

- D1 Color Token Architecture
- D2 Pattern Tile Composition
- D3 Pane Gradient Assembly
- D4 Complementary Text Shadow
- D5 Embossed Border Treatment
- D6 Typography Stack
- D7 Button Variant System
- D8 Utility Pattern Library

## Sample Status

This is **sample bake-in content** rendered to verify the D-O Viewer tab's
markdown rendering pipeline. Real file-loading arrives in D4.5 or A2-D1.
`;

const SAMPLE_PEWTER_ONYX = `# Pewter Tessera — Sample Onyx Snapshot

**Tier**: 1 · **Version**: 1.1 (Generalized for Suite Cascade System release)

## Suite Function Mapping

| Suite | Color | Role | Pewter Pipeline Function |
|-------|-------|------|--------------------------|
| 1 | Red | Curator | Inventory existing design tokens |
| 2 | Orange | Prospector | Discover design gaps |
| 3 | Yellow | Architect | Design new tokens + patterns |
| 4 | Green | Sculptor | Examine designs from all angles |
| 5 | Blue | Professional | Implement CSS tokens · pattern compositions |
| 6 | Purple | Orchestrator | Sequence design changes |
| 7 | Fuchsia | Clinician | Diagnose visual regressions |

## Sample Status

This is **sample bake-in content** rendered to verify the D-O Viewer tab's
markdown rendering pipeline. Real Onyx file content from disk arrives in D4.5
or A2-D1 (Cadmium Researcher designation registration territory).
`;

const SAMPLE_PEWTER_FS_SHEET = `# Pewter Tessera — File System Info Sheet (Sample)

**Directory**: Cascades/8_SUITES/Pewter Tessera
**Configuration**: Direct (Instance.md + Skill.md)

## Files

- \`Instance.md\` — Identity Configuration + Operating Principle + Stratidian Contract
- \`Skill.md\` — 8 Design Skill Reference (D1-D8) + Compound Workflows

## Sample Status

This is **sample bake-in content** rendered to verify the Info Sheet tab's
markdown rendering pipeline. Real file-system info-sheet rendering (concatenated
Instance.md + Skill.md) arrives in D4.5 or A2-D1.
`;

const SAMPLE_PEWTER_BOUND_CASCADE = {
  activeDiamond: 'Cascades/Working/DIAMOND-TIER-PEWTER-SAMPLE.md',
  activeOnyx: 'Cascades/Working/ONYX-TIER-PEWTER-SAMPLE.md',
  designation: 'Pewter Tessera',
  cyclePosition: {
    cycle: 1,
    rotation: 1,
    totalRotations: 1,
    gate: 0,
  },
  sample: true,
  note: 'This is sample bake-in content. Real BoundCascade.json file-loading arrives in D4.5 or A2-D1.',
};

export const graphiteScribeRegisterSampleDesignations = createQualityCard<GraphiteScribeClientState>({
  type: 'Suite 8 Register Sample Designations',
  reducer: (state) => {
    const existingNames = new Set(state.designations.map((d) => d.name));
    const toAdd = SAMPLE_DESIGNATIONS.filter((d) => !existingNames.has(d.name));

    if (toAdd.length === 0 && state.activeDesignationName === 'Pewter Tessera') {
      return {};
    }

    const nextDesignations =
      toAdd.length > 0 ? [...state.designations, ...toAdd] : state.designations;

    return {
      designations: nextDesignations,
      activeDesignationName: 'Pewter Tessera',
      activeTab: 'doviewer',
      loadedDiamondContent: SAMPLE_PEWTER_DIAMOND,
      loadedOnyxContent: SAMPLE_PEWTER_ONYX,
      loadedBoundCascade: SAMPLE_PEWTER_BOUND_CASCADE,
      loadedFileSystemSheet: SAMPLE_PEWTER_FS_SHEET,
    };
  },
  methodCreator: defaultMethodCreator,
});
