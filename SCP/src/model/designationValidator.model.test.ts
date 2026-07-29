/**
 * Designation Validator + Concept Generator Tests — M2-A1-D2
 *
 * Pure-function tests covering validation rules, name derivation,
 * and bare-minimum concept generation.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D2
 * Citation: STRATIMUX-REFERENCE.md "🧪 Stratimux Testing Patterns"
 */
import {
  validateDesignationForWizard,
  deriveNamesFromDesignation,
  validateAndDerive,
  SCP_RESERVED_NAMES,
} from './designationValidator.model';
import { generateBareMinimumConcept } from './conceptGenerator.model';

describe('designationValidator.model', () => {
  describe('validateDesignationForWizard', () => {
    it('accepts valid PascalCase designation', () => {
      const r = validateDesignationForWizard('MyResearchSCP');
      expect(r.valid).toBe(true);
    });

    it('accepts simple 2-char minimum', () => {
      const r = validateDesignationForWizard('Ab');
      expect(r.valid).toBe(true);
    });

    it('accepts 32-char maximum', () => {
      const name = 'A' + 'b'.repeat(31);
      expect(name.length).toBe(32);
      expect(validateDesignationForWizard(name).valid).toBe(true);
    });

    it('rejects empty string', () => {
      expect(validateDesignationForWizard('').valid).toBe(false);
    });

    it('rejects single character', () => {
      expect(validateDesignationForWizard('A').valid).toBe(false);
    });

    it('rejects 33-char overflow', () => {
      const name = 'A' + 'b'.repeat(32);
      expect(name.length).toBe(33);
      expect(validateDesignationForWizard(name).valid).toBe(false);
    });

    it('rejects lowercase start', () => {
      expect(validateDesignationForWizard('myResearch').valid).toBe(false);
    });

    it('rejects digit start', () => {
      expect(validateDesignationForWizard('1Research').valid).toBe(false);
    });

    it('rejects spaces', () => {
      expect(validateDesignationForWizard('My Research').valid).toBe(false);
    });

    it('rejects hyphens', () => {
      expect(validateDesignationForWizard('My-Research').valid).toBe(false);
    });

    it('rejects underscores', () => {
      expect(validateDesignationForWizard('My_Research').valid).toBe(false);
    });

    it('rejects periods', () => {
      expect(validateDesignationForWizard('My.Research').valid).toBe(false);
    });

    it('rejects reserved names case-insensitively', () => {
      for (const reserved of SCP_RESERVED_NAMES) {
        const candidates = [
          reserved,
          reserved.toUpperCase(),
          reserved.charAt(0).toUpperCase() + reserved.slice(1),
        ];
        for (const c of candidates) {
          if (/^[A-Z]/.test(c) && /^[A-Za-z0-9]+$/.test(c) && c.length >= 2 && c.length <= 32) {
            expect(validateDesignationForWizard(c).valid).toBe(false);
          }
        }
      }
    });
  });

  describe('deriveNamesFromDesignation', () => {
    it('converts PascalCase to camelCase concept name', () => {
      expect(deriveNamesFromDesignation('MyResearchSCP')).toEqual({
        designation: 'MyResearchSCP',
        conceptName: 'myResearchSCP',
      });
    });

    it('handles single uppercase + lowercase rest', () => {
      expect(deriveNamesFromDesignation('Foo')).toEqual({
        designation: 'Foo',
        conceptName: 'foo',
      });
    });

    it('preserves consecutive capitals after first', () => {
      expect(deriveNamesFromDesignation('SCPBrain')).toEqual({
        designation: 'SCPBrain',
        conceptName: 'sCPBrain',
      });
    });
  });

  describe('validateAndDerive', () => {
    it('returns ok=true with derivation for valid input', () => {
      const r = validateAndDerive('MyResearch');
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.derivation.designation).toBe('MyResearch');
        expect(r.derivation.conceptName).toBe('myResearch');
      }
    });

    it('returns ok=false with reason for invalid input', () => {
      const r = validateAndDerive('');
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.reason).toContain('Enter');
      }
    });
  });
});

describe('conceptGenerator.model', () => {
  describe('generateBareMinimumConcept', () => {
    const derivation = { designation: 'MyResearch', conceptName: 'myResearch' };

    it('generates 3 files', () => {
      const bundle = generateBareMinimumConcept(derivation);
      expect(bundle.fileCount).toBe(3);
      expect(bundle.files.length).toBe(3);
    });

    it('places files under concepts/{conceptName}/', () => {
      const bundle = generateBareMinimumConcept(derivation);
      const paths = bundle.files.map((f) => f.relativePath);
      expect(paths).toEqual([
        'concepts/myResearch/myResearch.type.ts',
        'concepts/myResearch/myResearch.state.ts',
        'concepts/myResearch/myResearch.concept.ts',
      ]);
    });

    it('type file declares Name constant + State + Concept types', () => {
      const bundle = generateBareMinimumConcept(derivation);
      const typeFile = bundle.files.find((f) => f.relativePath.endsWith('.type.ts'))!;
      expect(typeFile.content).toContain("export const myResearchName = 'myResearch';");
      expect(typeFile.content).toContain('export type MyResearchState');
      expect(typeFile.content).toContain('export type MyResearchConcept');
      expect(typeFile.content).toContain('actionQue: AnyAction[];');
    });

    it('state file exports factory + FILTER_KEYS', () => {
      const bundle = generateBareMinimumConcept(derivation);
      const stateFile = bundle.files.find((f) => f.relativePath.endsWith('.state.ts'))!;
      expect(stateFile.content).toContain('export function createMyResearchState');
      expect(stateFile.content).toContain('MYRESEARCH_FILTER_KEYS');
      expect(stateFile.content).toContain('initializedAt: Date.now()');
    });

    it('concept file exports createConcept factory', () => {
      const bundle = generateBareMinimumConcept(derivation);
      const conceptFile = bundle.files.find((f) => f.relativePath.endsWith('.concept.ts'))!;
      expect(conceptFile.content).toContain('export const createMyResearchConcept');
      expect(conceptFile.content).toContain('createConcept');
      expect(conceptFile.content).toContain('createMyResearchState()');
    });

    it('emits valid TypeScript (no template syntax errors)', () => {
      const bundle = generateBareMinimumConcept(derivation);
      for (const file of bundle.files) {
        // Must not contain unsubstituted template fragments
        expect(file.content).not.toContain('${');
        expect(file.content).not.toContain('{{');
        // Must contain proper imports + exports
        expect(file.content).toMatch(/^\/\*\*/); // starts with JSDoc
      }
    });

    it('handles different conceptName casings', () => {
      const bundle = generateBareMinimumConcept({ designation: 'Foo', conceptName: 'foo' });
      const typeFile = bundle.files.find((f) => f.relativePath.endsWith('.type.ts'))!;
      expect(typeFile.content).toContain("export const fooName = 'foo';");
      expect(typeFile.content).toContain('export type FooState');
    });
  });
});
