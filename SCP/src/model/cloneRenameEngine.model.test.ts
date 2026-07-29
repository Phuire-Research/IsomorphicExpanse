/**
 * Clone + Rename Engine Tests — M2-A1-D3
 *
 * Tmpdir-isolated tests of the filesystem Lambda. Constructs a minimal
 * fake "template" tree, materializes into a fake install root, then
 * asserts on file presence + content rename + skip rules.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  shouldSkip,
  isRenameEligible,
  buildRenameRules,
  applyRenameRules,
  cloneWithRename,
  writeGeneratedConcept,
  materializeScp,
  CLONE_SKIP_DIRS,
  CLONE_SKIP_FILES,
  RENAME_ELIGIBLE_EXTENSIONS,
} from './cloneRenameEngine.model';
import { generateBareMinimumConcept } from './conceptGenerator.model';

describe('cloneRenameEngine.model', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(path.join(tmpdir(), 'scp-clone-test-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  describe('shouldSkip', () => {
    it('skips listed directories', () => {
      for (const d of CLONE_SKIP_DIRS) expect(shouldSkip(d)).toBe(true);
    });

    it('skips listed exact files', () => {
      expect(shouldSkip('.bridge-restart.json')).toBe(true);
      expect(shouldSkip('.DS_Store')).toBe(true);
    });

    it('skips glob-pattern files (*.tsbuildinfo)', () => {
      expect(shouldSkip('foo.tsbuildinfo')).toBe(true);
    });

    it('does not skip normal files', () => {
      expect(shouldSkip('package.json')).toBe(false);
      expect(shouldSkip('main.ts')).toBe(false);
    });
  });

  describe('isRenameEligible', () => {
    it('returns true for all listed extensions', () => {
      for (const ext of RENAME_ELIGIBLE_EXTENSIONS) {
        expect(isRenameEligible(`file${ext}`)).toBe(true);
      }
    });

    it('returns false for binary extensions', () => {
      expect(isRenameEligible('logo.png')).toBe(false);
      expect(isRenameEligible('favicon.ico')).toBe(false);
    });

    it('is case-insensitive on extension', () => {
      expect(isRenameEligible('FILE.TS')).toBe(true);
    });
  });

  describe('buildRenameRules', () => {
    const d = { designation: 'MyResearch', conceptName: 'myResearch' };

    it('produces 2 rules', () => {
      expect(buildRenameRules(d).length).toBe(2);
    });

    it('replaces template package name with lowercased {conceptName}-scp', () => {
      const rules = buildRenameRules(d);
      const pkgRule = rules.find((r) => r.template === 'huirth-scp-template')!;
      expect(pkgRule.replacement).toBe('myresearch-scp');
    });

    it('replaces template description with personalized designation', () => {
      const rules = buildRenameRules(d);
      const descRule = rules.find((r) => r.template.includes('HuiRth'))!;
      expect(descRule.replacement).toContain('MyResearch');
    });
  });

  describe('applyRenameRules', () => {
    it('substitutes template package name', () => {
      const rules = buildRenameRules({ designation: 'MyResearch', conceptName: 'myResearch' });
      const out = applyRenameRules('"name": "huirth-scp-template"', rules);
      expect(out).toBe('"name": "myresearch-scp"');
    });

    it('returns unchanged when no rule matches', () => {
      const rules = buildRenameRules({ designation: 'X', conceptName: 'x' });
      const out = applyRenameRules('foo bar baz', rules);
      expect(out).toBe('foo bar baz');
    });

    it('applies multiple substitutions in one pass', () => {
      const rules = buildRenameRules({ designation: 'Foo', conceptName: 'foo' });
      const out = applyRenameRules(
        '"name": "huirth-scp-template" — HuiRth SCP Template - Barebones Co-Located Vue Island Architecture',
        rules,
      );
      expect(out).toContain('foo-scp');
      expect(out).toContain('Foo SCP');
    });
  });

  describe('cloneWithRename', () => {
    it('copies tree applying rename to eligible files', () => {
      // Fake template
      const tmpl = path.join(tmp, 'template');
      mkdirSync(path.join(tmpl, 'src'), { recursive: true });
      writeFileSync(
        path.join(tmpl, 'package.json'),
        '{"name": "huirth-scp-template", "version": "0.1.0"}',
      );
      writeFileSync(path.join(tmpl, 'src', 'main.ts'), '// huirth-scp-template entry');

      const dest = path.join(tmp, 'dest');
      const rules = buildRenameRules({ designation: 'Foo', conceptName: 'foo' });
      const result = cloneWithRename(tmpl, dest, rules);

      expect(result.filesCopied).toBe(2);
      expect(existsSync(path.join(dest, 'package.json'))).toBe(true);
      expect(existsSync(path.join(dest, 'src', 'main.ts'))).toBe(true);

      const pkg = readFileSync(path.join(dest, 'package.json'), 'utf8');
      expect(pkg).toContain('foo-scp');
      expect(pkg).not.toContain('huirth-scp-template');

      const main = readFileSync(path.join(dest, 'src', 'main.ts'), 'utf8');
      expect(main).toContain('foo-scp');
    });

    it('skips node_modules during copy', () => {
      const tmpl = path.join(tmp, 'template');
      mkdirSync(path.join(tmpl, 'node_modules', 'foo'), { recursive: true });
      writeFileSync(path.join(tmpl, 'node_modules', 'foo', 'pkg.json'), 'should-not-copy');
      writeFileSync(path.join(tmpl, 'package.json'), '{}');

      const dest = path.join(tmp, 'dest');
      cloneWithRename(tmpl, dest, []);

      expect(existsSync(path.join(dest, 'node_modules'))).toBe(false);
      expect(existsSync(path.join(dest, 'package.json'))).toBe(true);
    });

    it('byte-copies binary files (no rename)', () => {
      const tmpl = path.join(tmp, 'template');
      mkdirSync(tmpl, { recursive: true });
      const binaryBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]); // PNG header
      writeFileSync(path.join(tmpl, 'logo.png'), binaryBuf);

      const dest = path.join(tmp, 'dest');
      cloneWithRename(tmpl, dest, []);

      const copied = readFileSync(path.join(dest, 'logo.png'));
      expect(copied.equals(binaryBuf)).toBe(true);
    });
  });

  describe('writeGeneratedConcept', () => {
    it('writes the 6-file Cadmium-likeness bundle to installSrcDir', () => {
      const installSrc = path.join(tmp, 'install', 'src');
      mkdirSync(installSrc, { recursive: true });
      const bundle = generateBareMinimumConcept({ designation: 'Foo', conceptName: 'foo' });
      const result = writeGeneratedConcept(installSrc, bundle);

      // C727 · 5 · the emit set grew 3 → 6 (base triple + client face + muxonomy + Landing.vue).
      expect(result.filesWritten).toBe(6);
      expect(existsSync(path.join(installSrc, 'concepts/foo/foo.type.ts'))).toBe(true);
      expect(existsSync(path.join(installSrc, 'concepts/foo/foo.state.ts'))).toBe(true);
      expect(existsSync(path.join(installSrc, 'concepts/foo/foo.concept.ts'))).toBe(true);
      expect(existsSync(path.join(installSrc, 'concepts/foo/foo.concept.client.ts'))).toBe(true);
      expect(existsSync(path.join(installSrc, 'concepts/foo/foo.muxonomy.ts'))).toBe(true);
      expect(existsSync(path.join(installSrc, 'concepts/foo/vue/FooLanding.vue'))).toBe(true);
    });

    it('content is the generated content (preserves template strings)', () => {
      const installSrc = path.join(tmp, 'install', 'src');
      const bundle = generateBareMinimumConcept({ designation: 'Bar', conceptName: 'bar' });
      writeGeneratedConcept(installSrc, bundle);

      const concept = readFileSync(path.join(installSrc, 'concepts/bar/bar.concept.ts'), 'utf8');
      expect(concept).toContain('createBarConcept');
      // Concept file imports barName from .type.ts (constant, not literal)
      expect(concept).toContain('barName');

      // Verify literal 'bar' string lives in the type file
      const typeFile = readFileSync(path.join(installSrc, 'concepts/bar/bar.type.ts'), 'utf8');
      expect(typeFile).toContain("export const barName = 'bar';");
    });
  });

  describe('materializeScp', () => {
    it('end-to-end: copies template + writes generated concept', () => {
      // Set up fake template
      const tmpl = path.join(tmp, 'template');
      mkdirSync(path.join(tmpl, 'src', 'concepts'), { recursive: true });
      writeFileSync(path.join(tmpl, 'package.json'), '{"name": "huirth-scp-template"}');
      writeFileSync(path.join(tmpl, 'src', 'main.ts'), '// template entry');

      const installRoot = path.join(tmp, 'install', 'SCP');
      const derivation = { designation: 'MyResearch', conceptName: 'myResearch' };
      const result = materializeScp({
        templateRoot: tmpl,
        installRoot,
        derivation,
        generatedConcept: generateBareMinimumConcept(derivation),
      });

      expect(result.ok).toBe(true);
      expect(result.filesCopied).toBeGreaterThanOrEqual(2);
      // C727 · 5 · the Cadmium-likeness emit set = 6 files.
      expect(result.generatedFilesWritten).toBe(6);

      // Verify rename
      const pkg = readFileSync(path.join(installRoot, 'package.json'), 'utf8');
      expect(pkg).toContain('myresearch-scp');

      // Verify generated concept written
      expect(existsSync(path.join(installRoot, 'src/concepts/myResearch/myResearch.concept.ts'))).toBe(true);
    });

    it('fails fast if installRoot exists', () => {
      const tmpl = path.join(tmp, 'template');
      mkdirSync(tmpl, { recursive: true });
      writeFileSync(path.join(tmpl, 'package.json'), '{}');
      const installRoot = path.join(tmp, 'install');
      mkdirSync(installRoot, { recursive: true });

      const result = materializeScp({
        templateRoot: tmpl,
        installRoot,
        derivation: { designation: 'X', conceptName: 'x' },
        generatedConcept: generateBareMinimumConcept({ designation: 'X', conceptName: 'x' }),
      });

      expect(result.ok).toBe(false);
      expect(result.reason).toContain('already exists');
    });

    it('fails fast if templateRoot missing', () => {
      const result = materializeScp({
        templateRoot: path.join(tmp, 'nonexistent-template'),
        installRoot: path.join(tmp, 'install'),
        derivation: { designation: 'X', conceptName: 'x' },
        generatedConcept: generateBareMinimumConcept({ designation: 'X', conceptName: 'x' }),
      });

      expect(result.ok).toBe(false);
      expect(result.reason).toContain('Template path missing');
    });
  });
});
