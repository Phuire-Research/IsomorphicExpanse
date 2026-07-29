/**
 * SCP Spawn Descriptor Builder Tests — M2-A1-D5
 *
 * Pure-function tests for SABO descriptor construction. No actual spawn
 * invocations — those are integration-tested at consumer wire-up.
 */
import {
  buildSpawnDescriptor,
  deriveCadmiumJoinPending,
  isPortInScpRange,
  SCP_PORT_RANGE_START,
  SCP_PORT_RANGE_END,
} from './scpSpawn.model';

describe('scpSpawn.model', () => {
  const derivation = { designation: 'MyResearch', conceptName: 'myResearch' };

  describe('buildSpawnDescriptor', () => {
    it('uses npm run bridge by default', () => {
      const d = buildSpawnDescriptor({
        installPath: '/abs/install',
        derivation,
        port: 7711,
      });
      expect(d.command).toBe('npm');
      expect(d.args).toEqual(['run', 'bridge']);
    });

    it('sets SABO invariants (detached · unref · stdio ignore-stdin)', () => {
      const d = buildSpawnDescriptor({
        installPath: '/abs/install',
        derivation,
        port: 7711,
      });
      expect(d.detached).toBe(true);
      expect(d.shouldUnref).toBe(true);
      expect(d.stdio[0]).toBe('ignore');
    });

    it('resolves cwd to abs path', () => {
      const d = buildSpawnDescriptor({
        installPath: '/abs/install',
        derivation,
        port: 7711,
      });
      expect(d.cwd).toBe('/abs/install');
    });

    it('injects SCP_NAME · SCP_CONCEPT_NAME · SCP_BRIDGE_PORT · PORT into env', () => {
      const d = buildSpawnDescriptor({
        installPath: '/abs/install',
        derivation,
        port: 7711,
      });
      expect(d.env.SCP_NAME).toBe('MyResearch');
      expect(d.env.SCP_CONCEPT_NAME).toBe('myResearch');
      expect(d.env.SCP_BRIDGE_PORT).toBe('7711');
      expect(d.env.PORT).toBe('7711');
    });

    it('merges parentEnv when supplied', () => {
      const d = buildSpawnDescriptor({
        installPath: '/abs/install',
        derivation,
        port: 7711,
        parentEnv: { CUSTOM_FLAG: '1', PATH: '/usr/bin' },
      });
      expect(d.env.CUSTOM_FLAG).toBe('1');
      expect(d.env.PATH).toBe('/usr/bin');
      // Spawn env still overrides on collision
      expect(d.env.SCP_NAME).toBe('MyResearch');
    });

    it('builds browserUrl as http://localhost:{port}', () => {
      const d = buildSpawnDescriptor({
        installPath: '/abs/install',
        derivation,
        port: 7777,
      });
      expect(d.browserUrl).toBe('http://localhost:7777');
    });

    it('passes scpName through for Cadmium join transition', () => {
      const d = buildSpawnDescriptor({
        installPath: '/abs/install',
        derivation,
        port: 7711,
      });
      expect(d.scpName).toBe('MyResearch');
    });
  });

  describe('deriveCadmiumJoinPending', () => {
    it('produces pending state with scpName', () => {
      const state = deriveCadmiumJoinPending('MyResearch');
      expect(state).toEqual({ kind: 'pending', scpName: 'MyResearch' });
    });

    it('returns object that satisfies CadmiumTutorialJoinState pending variant', () => {
      const state = deriveCadmiumJoinPending('Foo');
      expect(state.kind).toBe('pending');
      expect(state.scpName).toBe('Foo');
    });
  });

  describe('isPortInScpRange', () => {
    it('accepts ports inside range', () => {
      expect(isPortInScpRange(SCP_PORT_RANGE_START)).toBe(true);
      expect(isPortInScpRange(SCP_PORT_RANGE_END)).toBe(true);
      expect(isPortInScpRange(7750)).toBe(true);
    });

    it('rejects ports below range', () => {
      expect(isPortInScpRange(SCP_PORT_RANGE_START - 1)).toBe(false);
      expect(isPortInScpRange(0)).toBe(false);
    });

    it('rejects ports above range', () => {
      expect(isPortInScpRange(SCP_PORT_RANGE_END + 1)).toBe(false);
      expect(isPortInScpRange(65535)).toBe(false);
    });
  });
});
