/**
 * Message Envelope Model — Managing Instance Contact (M2-A2-D3)
 *
 * Pure functions for building, validating, and serializing message
 * envelopes between SCS-Bridge consumers (spawned SCPs) and Managing
 * Instances (ClaudeCode sessions hosting the install).
 *
 * AJMI alignment: the envelope carries scpName (origin) + the message
 * body. The Managing Instance receives via its registered handler;
 * dispatch routing is the Diameter between the two surfaces.
 *
 * Higher-Order Composition: envelope shape is the medium; producer and
 * consumer compose through the shape, not through each other.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A2-D3
 * Citation: scsBridge.type.ts ScsBridgeSendBridgeMessagePayload (existing M1 surface)
 */

// ============================================
// ENVELOPE TYPES
// ============================================

export type MessageEnvelopeKind =
  | 'user-input'         // user-typed message via toolbar
  | 'status-probe'       // health check from Managing Instance
  | 'lifecycle-event'    // birth/death/restart notifications
  | 'cadmium-handshake'; // Macro 3 Cadmium join handshake

export interface MessageEnvelope {
  kind: MessageEnvelopeKind;
  scpName: string;                  // origin SCP designation (PascalCase)
  body: string;                     // message content (UTF-8 · max 16KB)
  sentAt: number;                   // ms epoch
  envelopeId: string;               // unique id for ack tracking (caller-supplied)
  metadata?: Record<string, string>; // optional routing hints
}

export interface EnvelopeValidation {
  valid: boolean;
  reason?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const MESSAGE_BODY_MAX_BYTES = 16 * 1024; // 16KB hard cap
export const MESSAGE_ENVELOPE_ID_PATTERN = /^[a-z0-9]{8,32}$/;

const VALID_KINDS: readonly MessageEnvelopeKind[] = [
  'user-input',
  'status-probe',
  'lifecycle-event',
  'cadmium-handshake',
];

// ============================================
// BUILD
// ============================================

export interface BuildEnvelopeOptions {
  kind: MessageEnvelopeKind;
  scpName: string;
  body: string;
  envelopeId: string;
  metadata?: Record<string, string>;
  sentAt?: number; // defaults to Date.now() · injectable for testing
}

/**
 * Builds a MessageEnvelope from minimal options. Caller is responsible
 * for validating via `validateEnvelope` before sending — `buildEnvelope`
 * does NOT throw on shape errors.
 */
export function buildEnvelope(opts: BuildEnvelopeOptions): MessageEnvelope {
  return {
    kind: opts.kind,
    scpName: opts.scpName,
    body: opts.body,
    sentAt: opts.sentAt ?? Date.now(),
    envelopeId: opts.envelopeId,
    metadata: opts.metadata,
  };
}

// ============================================
// VALIDATE
// ============================================

/**
 * Validates an envelope shape + invariants. Used by the dispatch quality
 * before WebSocket emission to prevent runtime errors at the receiver.
 */
export function validateEnvelope(env: MessageEnvelope): EnvelopeValidation {
  if (!env || typeof env !== 'object') {
    return { valid: false, reason: 'Envelope must be an object' };
  }
  if (!VALID_KINDS.includes(env.kind)) {
    return { valid: false, reason: `Invalid kind: ${env.kind}` };
  }
  if (typeof env.scpName !== 'string' || env.scpName.length === 0) {
    return { valid: false, reason: 'scpName must be non-empty string' };
  }
  if (typeof env.body !== 'string') {
    return { valid: false, reason: 'body must be a string' };
  }
  // Byte-length check (string.length is char count; for ASCII it matches bytes)
  if (Buffer.byteLength(env.body, 'utf8') > MESSAGE_BODY_MAX_BYTES) {
    return { valid: false, reason: `body exceeds ${MESSAGE_BODY_MAX_BYTES} bytes` };
  }
  if (typeof env.sentAt !== 'number' || !Number.isFinite(env.sentAt) || env.sentAt < 0) {
    return { valid: false, reason: 'sentAt must be non-negative finite number' };
  }
  if (typeof env.envelopeId !== 'string' || !MESSAGE_ENVELOPE_ID_PATTERN.test(env.envelopeId)) {
    return { valid: false, reason: 'envelopeId must match /^[a-z0-9]{8,32}$/' };
  }
  if (env.metadata !== undefined && (typeof env.metadata !== 'object' || env.metadata === null || Array.isArray(env.metadata))) {
    return { valid: false, reason: 'metadata must be plain object if present' };
  }
  return { valid: true };
}

// ============================================
// SERIALIZE
// ============================================

/**
 * Serializes envelope to JSON string for WebSocket transmission. Throws
 * if envelope contains non-JSON-serializable values (Date objects ·
 * functions · circular refs); caller should validate first.
 */
export function serializeEnvelope(env: MessageEnvelope): string {
  return JSON.stringify(env);
}

/**
 * Deserializes a JSON string into a MessageEnvelope. Returns null on
 * parse error or shape mismatch (consumer can fail-fast on null).
 */
export function deserializeEnvelope(json: string): MessageEnvelope | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    const env = parsed as MessageEnvelope;
    const v = validateEnvelope(env);
    return v.valid ? env : null;
  } catch {
    return null;
  }
}

// ============================================
// ENVELOPE ID GENERATOR (caller utility)
// ============================================

/**
 * Generates a random envelope ID matching MESSAGE_ENVELOPE_ID_PATTERN.
 * Uses Math.random — sufficient for ack tracking, NOT for cryptographic
 * needs. Length 12 (within 8-32 range · short enough to log).
 */
export function generateEnvelopeId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
