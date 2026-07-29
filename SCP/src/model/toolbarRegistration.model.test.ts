/**
 * Toolbar Registration Model Tests — M2-A2-D1
 */
import type { ToolbarButtonRegistration } from '../concepts/scsBridge/scsBridge.type';
import {
  validateToolbarButton,
  addToolbarButton,
  removeToolbarButton,
  setToolbarButtonEnabled,
  findToolbarButton,
  isReservedToolbarButtonId,
  sortToolbarButtonsForRender,
  RESERVED_TOOLBAR_BUTTON_IDS,
} from './toolbarRegistration.model';

function makeButton(id: string, overrides: Partial<ToolbarButtonRegistration> = {}): ToolbarButtonRegistration {
  return {
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    icon: 'fa-solid fa-circle',
    kind: 'static',
    suiteColor: 'pewter',
    actionQualityName: `Scs Bridge ${id}`,
    enabled: true,
    ...overrides,
  };
}

describe('toolbarRegistration.model', () => {
  describe('validateToolbarButton', () => {
    it('accepts a valid kebab-case button', () => {
      expect(validateToolbarButton(makeButton('valid-id')).valid).toBe(true);
    });

    it('rejects empty id', () => {
      expect(validateToolbarButton(makeButton('') as ToolbarButtonRegistration).valid).toBe(false);
    });

    it('rejects id > 64 chars', () => {
      const id = 'a'.repeat(65);
      expect(validateToolbarButton(makeButton(id)).valid).toBe(false);
    });

    it('rejects non-kebab-case id', () => {
      expect(validateToolbarButton(makeButton('CamelCase')).valid).toBe(false);
      expect(validateToolbarButton(makeButton('snake_case')).valid).toBe(false);
      expect(validateToolbarButton(makeButton('-leading-hyphen')).valid).toBe(false);
      expect(validateToolbarButton(makeButton('trailing-hyphen-')).valid).toBe(false);
    });

    it('rejects empty label', () => {
      expect(validateToolbarButton(makeButton('x', { label: '' })).valid).toBe(false);
    });

    it('rejects label > 32 chars', () => {
      expect(validateToolbarButton(makeButton('x', { label: 'a'.repeat(33) })).valid).toBe(false);
    });

    it('rejects empty actionQualityName', () => {
      expect(validateToolbarButton(makeButton('x', { actionQualityName: '' })).valid).toBe(false);
    });

    it('rejects invalid kind', () => {
      expect(validateToolbarButton(makeButton('x', { kind: 'bogus' as 'static' })).valid).toBe(false);
    });
  });

  describe('addToolbarButton', () => {
    it('appends a new button', () => {
      const start = [makeButton('a')];
      const result = addToolbarButton(start, makeButton('b'));
      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('b');
    });

    it('upserts an existing button (preserves position)', () => {
      const start = [makeButton('a'), makeButton('b'), makeButton('c')];
      const updated = makeButton('b', { label: 'Updated' });
      const result = addToolbarButton(start, updated);
      expect(result).toHaveLength(3);
      expect(result[1].label).toBe('Updated');
      expect(result[1].id).toBe('b');
    });

    it('does not mutate input array', () => {
      const start = [makeButton('a')];
      addToolbarButton(start, makeButton('b'));
      expect(start).toHaveLength(1);
    });
  });

  describe('removeToolbarButton', () => {
    it('removes by id', () => {
      const start = [makeButton('a'), makeButton('b'), makeButton('c')];
      const result = removeToolbarButton(start, 'b');
      expect(result.map((b) => b.id)).toEqual(['a', 'c']);
    });

    it('returns same array reference when id not found', () => {
      const start = [makeButton('a')];
      const result = removeToolbarButton(start, 'nope');
      expect(result).toBe(start);
    });
  });

  describe('setToolbarButtonEnabled', () => {
    it('flips enabled flag', () => {
      const start = [makeButton('a', { enabled: true })];
      const result = setToolbarButtonEnabled(start, 'a', false);
      expect(result[0].enabled).toBe(false);
    });

    it('no-op when id not found', () => {
      const start = [makeButton('a')];
      const result = setToolbarButtonEnabled(start, 'missing', false);
      expect(result).toBe(start);
    });
  });

  describe('findToolbarButton', () => {
    it('returns the button', () => {
      const start = [makeButton('a'), makeButton('b')];
      expect(findToolbarButton(start, 'b')?.id).toBe('b');
    });

    it('returns null when missing', () => {
      expect(findToolbarButton([], 'x')).toBeNull();
    });
  });

  describe('isReservedToolbarButtonId', () => {
    it('detects reserved IDs', () => {
      for (const id of RESERVED_TOOLBAR_BUTTON_IDS) {
        expect(isReservedToolbarButtonId(id)).toBe(true);
      }
    });

    it('rejects non-reserved', () => {
      expect(isReservedToolbarButtonId('custom-btn')).toBe(false);
    });
  });

  describe('sortToolbarButtonsForRender', () => {
    it('orders reserved buttons first in canonical order', () => {
      const start = [
        makeButton('custom-btn'),
        makeButton('log-dump'),
        makeButton('turn-over'),
        makeButton('another-custom'),
        makeButton('install-scp'),
      ];
      const result = sortToolbarButtonsForRender(start);
      // Reserved order: turn-over · send-message · install-scp · log-dump
      const reservedIds = result.filter((b) => isReservedToolbarButtonId(b.id)).map((b) => b.id);
      expect(reservedIds).toEqual(['turn-over', 'install-scp', 'log-dump']);
      // User-registered appended in insertion order
      const customIds = result.filter((b) => !isReservedToolbarButtonId(b.id)).map((b) => b.id);
      expect(customIds).toEqual(['custom-btn', 'another-custom']);
    });

    it('handles all-reserved input', () => {
      const start = RESERVED_TOOLBAR_BUTTON_IDS.map((id) => makeButton(id));
      const result = sortToolbarButtonsForRender(start);
      expect(result.map((b) => b.id)).toEqual([...RESERVED_TOOLBAR_BUTTON_IDS]);
    });

    it('handles all-custom input (insertion order preserved)', () => {
      const start = [makeButton('a'), makeButton('b'), makeButton('c')];
      expect(sortToolbarButtonsForRender(start)).toEqual(start);
    });
  });
});
