// pewterDefaultMenu.model.ts — the Pewter Tessera default Shatterite Menu (SMSP · the design menu).
//
// The standing menu a freshly-spawned/anchored Pewter presents: "Modify the Suite Colors and Patterns."
// Each design option is a 'prime' kind bound to a Skill (primeRef) — on select, ShatteriteMenu loads the
// Skill in full, SORD-wraps it (/suite8-skill-prime → buildSordSkillEnvelope), and relays it to the live
// anchor (triggerSendMessage) to PRIME the Pewter to PERFORM the design Skill. The Skills edit the
// controlling Cascades/hifiConfig.json (the SCP's HiFi design · the P4 boot-read cascades it into the app).
//
// Passed to ShatteriteMenu as `defaultStage` from PewterLanding (a live menu.json stage wins if present).
// Pure model — zero Stratimux/dispatch. Mirrors suite8DefaultMenu.model.ts.

import type { MenuStage } from './shatteriteMenu.model';

export const PEWTER_DEFAULT_MENU_STAGE: MenuStage = {
  stageIndex: 0,
  title: 'Modify the Suite Colors and Patterns',
  prompt:
    'Engage the Pewter Tessera Anchor to cascade your own HiFi design into this SCP — pick a Skill to prime.',
  options: [
    {
      label: 'Modify Suite Colors',
      kind: 'prime',
      inFocus: true,
      scsCommand: '',
      primeRef: 'Skills/SetColorsViaJson.md',
      primeKind: 'skill',
      tooltip: 'Prime the Anchor to set / change the Suite Colors via the controlling hifiConfig.json.',
    },
    {
      label: 'Modify Suite Patterns',
      kind: 'prime',
      inFocus: true,
      scsCommand: '',
      primeRef: 'Skills/AddSvgPattern.md',
      primeKind: 'skill',
      tooltip: 'Prime the Anchor to add a new SVG pattern + assign Suite Patterns via hifiConfig.json.',
    },
    {
      // DOCUMENTATION row — focus the instance to review the Pewter design documentation.
      label: 'Open Documentation',
      kind: 'focus',
      scsCommand: '',
      tooltip: 'Focus the Anchor to review the Pewter Tessera design documentation.',
    },
  ],
};
