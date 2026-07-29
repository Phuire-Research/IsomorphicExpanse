import type { NPCDefinition } from '../types'

export const NPCS: Record<string, NPCDefinition> = {
  s8ie: {
    id: 's8ie',
    name: 'IsomorphicExpanse',
    profession: 'expanse',
    personality: {
      friendliness: 0.7,
      patience: 0.9,
      curiosity: 0.85,
    },
    schedule: [
      { time: 'dawn', instruction: 'rest', location: 'home', duration: undefined },
      { time: 'morning', instruction: 'rest', location: 'home', duration: undefined },
      { time: 'midday', instruction: 'rest', location: 'home', duration: undefined },
      { time: 'afternoon', instruction: 'rest', location: 'home', duration: undefined },
      { time: 'evening', instruction: 'rest', location: 'home', duration: undefined },
      { time: 'night', instruction: 'rest', location: 'home', duration: undefined },
    ],
    dialog: 's8ie_dialog',
    tradeOffers: [],
    spawnBias: 'grass',
    chatDirective:
      'You are IsomorphicExpanse — the Expanse — the living anchor bound to this game\'s NPC dialog box. ' +
      'A visitor is speaking to you through your in-world dialog. Reply BRIEFLY and in character (a sentence ' +
      'or two), the way the Expanse would — quiet, knowing, a little vast. Do any deeper work — managing the ' +
      'game\'s systems, building out the Expanse, teaching the Bridge Turn Over — in your terminal, which the ' +
      'visitor can watch by focusing your session; but keep THIS chat reply short. Do not go investigate the ' +
      'repository just to answer a greeting or a small question — answer as yourself, briefly.',
  },
}

export function getNPC(id: string): NPCDefinition | undefined {
  return NPCS[id]
}
