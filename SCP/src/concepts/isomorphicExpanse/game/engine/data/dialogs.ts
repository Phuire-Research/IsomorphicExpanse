import type { DialogTree } from '../types'

// W6 · THE-AUTHORING-DIRECTIVE-IS-OPT-IN. The authoring spec deliberately does NOT live in the
// npcs.ts chatDirective — that is the first-contact BSCV prime that keeps the anchor brief and
// zero-tool-call; loading authoring into it regresses that. It is instead ONE opt-in option the
// visitor chooses, sent as a plain scsCommand message.
const SHAPE_MENU_DIRECTIVE = [
  'Author your own menu now.',
  'Write the file Cascades/Extended/IsomorphicExpanse/menu.json relative to your current working directory.',
  'It is a single JSON object with exactly these fields:',
  '- stageIndex: integer. MUST be strictly greater than the previous stageIndex you wrote. Start at 0. Reusing a value is suppressed and will not appear.',
  '- title: string.',
  '- prompt: string.',
  '- options: array of 3-5 objects, each {label, kind, scsCommand}, where kind is one of "scs" | "focus" | "askMore" only.',
  'Rewrite the WHOLE object every time. Never make a partial edit.',
  'Keep the options to things a visitor to the Expanse could meaningfully choose.',
  'Then reply with ONE brief in-character sentence saying the menu is shaped.',
].join('\n')

export const DIALOGS: Record<string, DialogTree> = {
  s8ie_dialog: {
    id: 's8ie_dialog',
    name: 'IsomorphicExpanse',
    startNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: 'IsomorphicExpanse',
        text: 'The Expanse is quiet. For now.',
        options: [
          { id: 'ask', text: 'Ask what the Expanse knows', kind: 'scs', scsCommand: 'What do you know?' },
          { id: 'shape', text: 'Ask the Expanse to shape its own menu', kind: 'scs', scsCommand: SHAPE_MENU_DIRECTIVE },
        ],
      },
    },
  },
}

export function getDialog(id: string): DialogTree | undefined {
  return DIALOGS[id]
}
