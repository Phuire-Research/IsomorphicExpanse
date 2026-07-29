/**
 * suite8ReaderPaths.model Tests — MD-4 THE ENDPOINT READERS (D-RD-1/D-RD-2)
 *
 * Pure-function tests covering the traversal guard (the verbatim vue.principle.ts idiom),
 * the trio doc paths, the HETEROGENEOUS skills listing (flat *.md + <dir>/Skill.md), the
 * fuzzy :skill / :strat match, the name-filtered working-docs, and the asset candidate probe.
 *
 * The Concluder for the SCP-local Suite 8 readers' PATH LOGIC — proves the ../ probe rejects
 * and the in-bounds resolves WITHOUT booting Express (the repo idiom).
 *
 * Citation: DIAMOND-SCP-ACTUALIZATION-EPOCH.md §MD-4 · the traversal guard idiom verbatim.
 * Citation: STRATIMUX-REFERENCE.md "🧪 Stratimux Testing Patterns"
 */
import path from 'path';
import {
  isInsideBase,
  resolveGuardedChild,
  resolveSuite8Dir,
  suite8DocPath,
  buildSkillsListing,
  matchSkill,
  buildStrategyListing,
  matchStrategy,
  filterWorkingDocs,
  resolveAssetCandidates,
  assetContentType,
  ASSET_EXTENSIONS,
} from './suite8ReaderPaths.model';

const BASE = path.resolve('/tmp/scpRoot/Cascades/8_SUITES');

describe('suite8ReaderPaths.model', () => {
  describe('isInsideBase (the traversal guard idiom)', () => {
    it('accepts a strict child', () => {
      expect(isInsideBase(BASE, path.resolve(BASE, 'MyDomain'))).toBe(true);
    });
    it('rejects the base itself', () => {
      expect(isInsideBase(BASE, BASE)).toBe(false);
    });
    it('rejects a sibling false-prefix (baseX)', () => {
      expect(isInsideBase(BASE, BASE + 'X')).toBe(false);
    });
    it('rejects a ../ escape (resolve collapses it outside base)', () => {
      expect(isInsideBase(BASE, path.resolve(BASE, '../secret'))).toBe(false);
    });
  });

  describe('resolveGuardedChild', () => {
    it('empty segment → empty', () => {
      expect(resolveGuardedChild(BASE, '')).toEqual({ ok: false, reason: 'empty' });
    });
    it('../ probe → traversal', () => {
      expect(resolveGuardedChild(BASE, '../../etc/passwd')).toEqual({
        ok: false,
        reason: 'traversal',
      });
    });
    it('absolute override → traversal', () => {
      expect(resolveGuardedChild(BASE, '/etc/passwd')).toEqual({
        ok: false,
        reason: 'traversal',
      });
    });
    it('bare name → ok with resolved path', () => {
      const r = resolveGuardedChild(BASE, 'MyDomain');
      expect(r).toEqual({ ok: true, path: path.resolve(BASE, 'MyDomain') });
    });
  });

  describe('resolveSuite8Dir + suite8DocPath', () => {
    it('resolves the trio leaf files under a guarded dir', () => {
      const dir = resolveSuite8Dir(BASE, 'MyDomain');
      expect(dir.ok).toBe(true);
      if (dir.ok) {
        expect(suite8DocPath(dir.path, 'instance')).toBe(
          path.resolve(BASE, 'MyDomain', 'Instance.md'),
        );
        expect(suite8DocPath(dir.path, 'conductor')).toBe(
          path.resolve(BASE, 'MyDomain', 'Conductor.md'),
        );
        expect(suite8DocPath(dir.path, 'maintainer')).toBe(
          path.resolve(BASE, 'MyDomain', 'Maintainer.md'),
        );
      }
    });
    it('rejects a ../ :name', () => {
      expect(resolveSuite8Dir(BASE, '../evil').ok).toBe(false);
    });
  });

  describe('buildSkillsListing (heterogeneous)', () => {
    const listing = buildSkillsListing([
      { name: 'S-STRATIPUNK', isDir: true },
      { name: 'AddSvgPattern.md', isDir: false },
      { name: 'SetColorsViaJson.md', isDir: false },
      { name: 'README.txt', isDir: false }, // non-.md flat → ignored
    ]);
    it('maps a subdir to <dir>/Skill.md', () => {
      const punk = listing.find((e) => e.name === 'S-STRATIPUNK');
      expect(punk).toEqual({
        name: 'S-STRATIPUNK',
        kind: 'dir',
        skillMdRelPath: 'S-STRATIPUNK/Skill.md',
      });
    });
    it('maps a flat *.md to itself (name sans-ext)', () => {
      const flat = listing.find((e) => e.name === 'AddSvgPattern');
      expect(flat).toEqual({
        name: 'AddSvgPattern',
        kind: 'flat',
        skillMdRelPath: 'AddSvgPattern.md',
      });
    });
    it('ignores non-.md flat files', () => {
      expect(listing.find((e) => e.name.includes('README'))).toBeUndefined();
    });
    it('is deterministically sorted', () => {
      expect(listing.map((e) => e.name)).toEqual([
        'AddSvgPattern',
        'S-STRATIPUNK',
        'SetColorsViaJson',
      ]);
    });
  });

  describe('matchSkill (fuzzy-tolerant)', () => {
    const listing = buildSkillsListing([
      { name: 'S-STRATIPUNK', isDir: true },
      { name: 'SetColorsViaJson.md', isDir: false },
    ]);
    it('exact case-insensitive', () => {
      expect(matchSkill(listing, 'setcolorsviajson')?.name).toBe('SetColorsViaJson');
    });
    it('substring partial', () => {
      expect(matchSkill(listing, 'stratipunk')?.name).toBe('S-STRATIPUNK');
    });
    it('no match → null', () => {
      expect(matchSkill(listing, 'nope')).toBeNull();
    });
  });

  describe('buildStrategyListing + matchStrategy', () => {
    const listing = buildStrategyListing(['GreetingStrategy.md', 'notes.txt']);
    it('lists flat *.md sans-ext', () => {
      expect(listing).toEqual([{ name: 'GreetingStrategy', file: 'GreetingStrategy.md' }]);
    });
    it('fuzzy matches', () => {
      expect(matchStrategy(listing, 'greeting')?.file).toBe('GreetingStrategy.md');
    });
  });

  describe('filterWorkingDocs', () => {
    const docs = [
      { file: 'DIAMOND-CADMIUM-EPOCH.md', firstLine: '# Cadmium Diamond' },
      { file: 'OTHER.md', firstLine: '# Cadmium Researcher note in body' },
      { file: 'UNRELATED.md', firstLine: '# Something else' },
    ];
    it('matches on filename', () => {
      expect(filterWorkingDocs(docs, 'cadmium').map((d) => d.file)).toContain(
        'DIAMOND-CADMIUM-EPOCH.md',
      );
    });
    it('matches on first-line', () => {
      expect(filterWorkingDocs(docs, 'cadmium').map((d) => d.file)).toContain('OTHER.md');
    });
    it('excludes unrelated', () => {
      expect(filterWorkingDocs(docs, 'cadmium').map((d) => d.file)).not.toContain('UNRELATED.md');
    });
    it('no match → empty array (honest)', () => {
      expect(filterWorkingDocs(docs, 'zzz')).toEqual([]);
    });
  });

  describe('resolveAssetCandidates + assetContentType', () => {
    const assetsBase = path.resolve(BASE, 'MyDomain', 'assets');
    it('defaults ref to logo + probes all extensions', () => {
      const r = resolveAssetCandidates(assetsBase, '');
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.candidates).toEqual(
          ASSET_EXTENSIONS.map((ext) => path.resolve(assetsBase, `logo.${ext}`)),
        );
      }
    });
    it('rejects a ../ ref', () => {
      const r = resolveAssetCandidates(assetsBase, '../../evil');
      expect(r.ok).toBe(false);
    });
    it('content types', () => {
      expect(assetContentType('/x/logo.png')).toBe('image/png');
      expect(assetContentType('/x/logo.svg')).toBe('image/svg+xml');
      expect(assetContentType('/x/logo.jpg')).toBe('image/jpeg');
      expect(assetContentType('/x/logo.webp')).toBe('image/webp');
      expect(assetContentType('/x/logo.bin')).toBe('application/octet-stream');
    });
  });
});
