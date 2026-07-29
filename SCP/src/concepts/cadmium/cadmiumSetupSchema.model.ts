/**
 * Cadmium Setup SFSD — the Research-Topics setup schema (Macro SU actualization)
 *
 * Cadmium's instance of the generalizable SFSD. Defines the Research Topics setup
 * the user fills on the Cadmium page; on submit the STSC feeds each field's
 * interpolated promptTemplate to the Cadmium Anchor — which actuates via its
 * SCS:Aspect teaching (no agent change needed this Macro).
 *
 * Each promptTemplate is a SCS-style delivery message: the Anchor's Instance.md
 * SCS:Aspect contract interprets the directive line + the {{value}} the user
 * entered (e.g. SCS:TopicUpdate to register a research topic).
 *
 * Citation: EPOCH-DIAMOND-SUITE8-SETUP-RESEARCH.md §2 Macro 1 SU (Cadmium)
 * Citation: setupFieldSchema.type.ts (SetupFieldSchema contract)
 */
import type { SetupFieldSchema } from '../suite8/setupFieldSchema.type';

export const cadmiumSetupSfsd: SetupFieldSchema = [
  {
    name: 'primaryTopic',
    label: 'Primary Research Topic',
    type: 'text',
    promptTemplate:
      'SCS:TopicUpdate Register this as my primary long-term research topic: {{value}}',
    default: '',
  },
  {
    name: 'secondaryTopics',
    label: 'Secondary Topics (one per line)',
    type: 'textarea',
    promptTemplate:
      'SCS:TopicUpdate Also track these secondary research topics for me:\n{{value}}',
    default: '',
  },
  {
    name: 'depth',
    label: 'Research Depth',
    type: 'select',
    options: ['initial', 'macro', 'epoch'],
    promptTemplate:
      'SCS:Diamond Set my default research depth (Diamond Scale) to: {{value}}',
    default: 'initial',
  },
  {
    name: 'ongoing',
    label: 'Enable ongoing personalized research',
    type: 'checkbox',
    promptTemplate:
      'SCS:Cascade Ongoing personalized research enabled flag: {{value}}',
    default: 'true',
  },
];

// One-line page-usage overview shown in the Setup zone header.
export const cadmiumSetupOverview =
  'Prime your Research Topics. Each field is delivered to the Cadmium Anchor in '
  + 'sequence, personalizing the research pipeline (Topic + RI).';
