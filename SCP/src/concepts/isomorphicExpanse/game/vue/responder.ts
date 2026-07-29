import { getGlobalScsBridgeController, type ScsBridgeController } from '../../../scsBridge/scsBridgeController'
import type { ScsBridgeSessionEntry } from '../../../scsBridge/scsBridge.type'
import { resolveS8Anchor } from '../../../scsBridge/model/s8Anchor.model'
import { getNPC } from '../engine/data/npcs'

export interface ResponderInput { text: string; npcId: string; dialogId: string }
export interface ResponderOutput { text: string }
export type Responder = (input: ResponderInput) => ResponderOutput | Promise<ResponderOutput>

const MIN_DELAY_MS = 600
const MAX_DELAY_MS = 1200
// D4 SIMULATED responder — RETAINED for reference/tests; no longer the live export.
export const simulatedResponder: Responder = (input) => {
  const delayMs = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS))
  return new Promise((resolve) => { setTimeout(() => { resolve({ text: `The Expanse echoes: "${input.text}"` }) }, delayMs) })
}

const NOT_BOUND_LINE = '(the Expanse stirs, but the anchor is not yet bound)'
const SILENCE_LINE = '(...the Expanse is silent...)'
const TRANSCRIPT_POLL_MS = 250
// The Focus Bubble is designed for long processing — a brief-in-character chat reply is fast, but the
// anchor may do real work; a generous bound before the silence line (the visitor can [Focus◎] the
// terminal to watch a longer turn). NOT indefinite — a hung session must not hang the chat forever.
const TRANSCRIPT_TIMEOUT_MS = 300_000
// Read-tear guard: finalTurnIndex and transcriptLastModelOutput update non-atomically on the entry —
// require the settled state to hold this many consecutive polls so the fields converge before reading.
const SETTLE_POLLS = 2

// Sessions already framed with their NPC's chatDirective (first-contact BSCV prime, once per session).
const primedSessions = new Set<string>()

function findSessionEntry(controller: ScsBridgeController, sessionId: string): ScsBridgeSessionEntry | undefined {
  return controller.sessionsList.value.find((s) => s.id === sessionId)
}

// THE-AWAIT-OVER-DIAMETER-GAP — resolves when the SAME session's turn genuinely advances PAST the pre-send
// marker AND the reply text has CHANGED AND the state settles. HAZARD-Z (H6): isProcessing 3-valued → === only.
// The turn-advanced + text-changed pair (both re-read off ONE entry snapshot per poll) closes the read-tear
// that showed a stale prior turn; SETTLE_POLLS lets the non-atomic transcript fields converge before reading.
function watchTranscriptAdvance(
  controller: ScsBridgeController,
  sessionId: string,
  preSendTurnIndex: number,
  preSendModelOutput: string,
): Promise<string> {
  return new Promise((resolve) => {
    let elapsedMs = 0
    let settleCount = 0
    let poll: ReturnType<typeof setInterval> | null = null
    const settle = (text: string): void => { if (poll) { clearInterval(poll); poll = null } ; resolve(text) }
    poll = setInterval(() => {
      elapsedMs += TRANSCRIPT_POLL_MS
      const entry = findSessionEntry(controller, sessionId)
      if (!entry) { settle(SILENCE_LINE); return }
      const turnAdvanced = typeof entry.finalTurnIndex === 'number' && entry.finalTurnIndex > preSendTurnIndex
      const output = entry.transcriptLastModelOutput ?? ''
      const textChanged = output !== '' && output !== preSendModelOutput
      if (entry.isProcessing === false && turnAdvanced && textChanged) {
        settleCount += 1
        if (settleCount >= SETTLE_POLLS) { settle(output); return }
      } else {
        settleCount = 0
      }
      if (elapsedMs >= TRANSCRIPT_TIMEOUT_MS) { settle(SILENCE_LINE) }
    }, TRANSCRIPT_POLL_MS)
  })
}

// Stage 1 bridgeResponder — REAL session rail (PATH A). RULE: NEVER spawns (spawn = user's [Summon] act only).
export const bridgeResponder: Responder = async (input) => {
  const controller = getGlobalScsBridgeController()
  if (!controller) { return { text: NOT_BOUND_LINE } }
  const npc = getNPC(input.npcId)
  const designation = npc?.name
  const anchor = designation ? resolveS8Anchor(controller.sessionsList.value, designation) : undefined
  if (!anchor || anchor.status !== 'launched') { return { text: NOT_BOUND_LINE } }
  // Re-read the entry fresh at send-time so the pre-send markers are current (not a stale resolve snapshot).
  const preEntry = findSessionEntry(controller, anchor.id)
  const preSendTurnIndex = typeof preEntry?.finalTurnIndex === 'number' ? preEntry.finalTurnIndex : -1
  const preSendModelOutput = preEntry?.transcriptLastModelOutput ?? ''
  // BSCV · frame the FIRST message to this session with the NPC's chatDirective (brief-in-character;
  // deep work in the terminal) so the anchor doesn't treat a greeting as a full agentic task. Once only.
  let messageToSend = input.text
  if (npc?.chatDirective && !primedSessions.has(anchor.id)) {
    messageToSend = `${npc.chatDirective}\n\n— The visitor says: ${input.text}`
    primedSessions.add(anchor.id)
  }
  const sendResult = await controller.triggerSendMessage(anchor.id, messageToSend)
  if (!sendResult.ok) { return { text: SILENCE_LINE } }
  const replyText = await watchTranscriptAdvance(controller, anchor.id, preSendTurnIndex, preSendModelOutput)
  return { text: replyText }
}

export const responder: Responder = bridgeResponder
