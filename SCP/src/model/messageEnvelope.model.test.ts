/**
 * Message Envelope Model Tests — M2-A2-D3
 */
import {
  buildEnvelope,
  validateEnvelope,
  serializeEnvelope,
  deserializeEnvelope,
  generateEnvelopeId,
  MESSAGE_BODY_MAX_BYTES,
  MESSAGE_ENVELOPE_ID_PATTERN,
} from './messageEnvelope.model';

describe('messageEnvelope.model', () => {
  const validEnvelope = () =>
    buildEnvelope({
      kind: 'user-input',
      scpName: 'MyResearch',
      body: 'hello',
      envelopeId: 'abc12345',
      sentAt: 1700000000000,
    });

  describe('buildEnvelope', () => {
    it('produces envelope with all fields', () => {
      const env = validEnvelope();
      expect(env.kind).toBe('user-input');
      expect(env.scpName).toBe('MyResearch');
      expect(env.body).toBe('hello');
      expect(env.envelopeId).toBe('abc12345');
      expect(env.sentAt).toBe(1700000000000);
    });

    it('defaults sentAt to Date.now', () => {
      const before = Date.now();
      const env = buildEnvelope({
        kind: 'user-input',
        scpName: 'X',
        body: 'y',
        envelopeId: 'abcdefgh',
      });
      const after = Date.now();
      expect(env.sentAt).toBeGreaterThanOrEqual(before);
      expect(env.sentAt).toBeLessThanOrEqual(after);
    });

    it('passes through metadata', () => {
      const env = buildEnvelope({
        kind: 'lifecycle-event',
        scpName: 'X',
        body: 'spawn',
        envelopeId: 'abcdefgh',
        metadata: { source: 'spawn' },
      });
      expect(env.metadata).toEqual({ source: 'spawn' });
    });
  });

  describe('validateEnvelope', () => {
    it('accepts a valid envelope', () => {
      expect(validateEnvelope(validEnvelope()).valid).toBe(true);
    });

    it('rejects invalid kind', () => {
      const env = validEnvelope();
      (env as { kind: string }).kind = 'bogus';
      expect(validateEnvelope(env).valid).toBe(false);
    });

    it('rejects empty scpName', () => {
      const env = validEnvelope();
      env.scpName = '';
      expect(validateEnvelope(env).valid).toBe(false);
    });

    it('rejects body over 16KB', () => {
      const env = validEnvelope();
      env.body = 'x'.repeat(MESSAGE_BODY_MAX_BYTES + 1);
      expect(validateEnvelope(env).valid).toBe(false);
    });

    it('accepts body at exact 16KB limit', () => {
      const env = validEnvelope();
      env.body = 'x'.repeat(MESSAGE_BODY_MAX_BYTES);
      expect(validateEnvelope(env).valid).toBe(true);
    });

    it('rejects negative sentAt', () => {
      const env = validEnvelope();
      env.sentAt = -1;
      expect(validateEnvelope(env).valid).toBe(false);
    });

    it('rejects non-finite sentAt', () => {
      const env = validEnvelope();
      env.sentAt = NaN;
      expect(validateEnvelope(env).valid).toBe(false);
    });

    it('rejects envelopeId shorter than 8 chars', () => {
      const env = validEnvelope();
      env.envelopeId = 'abc123';
      expect(validateEnvelope(env).valid).toBe(false);
    });

    it('rejects envelopeId longer than 32 chars', () => {
      const env = validEnvelope();
      env.envelopeId = 'a'.repeat(33);
      expect(validateEnvelope(env).valid).toBe(false);
    });

    it('rejects envelopeId with uppercase or special chars', () => {
      const env = validEnvelope();
      env.envelopeId = 'ABC12345';
      expect(validateEnvelope(env).valid).toBe(false);
      env.envelopeId = 'abc-1234';
      expect(validateEnvelope(env).valid).toBe(false);
    });

    it('rejects metadata that is array', () => {
      const env = validEnvelope();
      env.metadata = ['a', 'b'] as unknown as Record<string, string>;
      expect(validateEnvelope(env).valid).toBe(false);
    });

    it('rejects null envelope', () => {
      expect(validateEnvelope(null as unknown as ReturnType<typeof validEnvelope>).valid).toBe(false);
    });
  });

  describe('serializeEnvelope + deserializeEnvelope', () => {
    it('roundtrips valid envelope', () => {
      const env = validEnvelope();
      const json = serializeEnvelope(env);
      const back = deserializeEnvelope(json);
      expect(back).toEqual(env);
    });

    it('returns null on parse error', () => {
      expect(deserializeEnvelope('not-json')).toBeNull();
    });

    it('returns null on invalid shape after parse', () => {
      expect(deserializeEnvelope('{"kind":"bogus"}')).toBeNull();
    });

    it('serializes metadata when present', () => {
      const env = buildEnvelope({
        kind: 'cadmium-handshake',
        scpName: 'X',
        body: 'init',
        envelopeId: 'abcdefgh',
        metadata: { ref: 'CADMIUM-LOOP-1' },
      });
      const back = deserializeEnvelope(serializeEnvelope(env));
      expect(back?.metadata).toEqual({ ref: 'CADMIUM-LOOP-1' });
    });
  });

  describe('generateEnvelopeId', () => {
    it('produces id matching pattern', () => {
      const id = generateEnvelopeId();
      expect(MESSAGE_ENVELOPE_ID_PATTERN.test(id)).toBe(true);
    });

    it('produces 12-char id', () => {
      expect(generateEnvelopeId().length).toBe(12);
    });

    it('produces different ids on successive calls (probabilistic)', () => {
      const a = generateEnvelopeId();
      const b = generateEnvelopeId();
      expect(a).not.toBe(b);
    });
  });
});
