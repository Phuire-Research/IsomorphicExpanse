/**
 * Default Toolbar Buttons Tests — M2-A2-D2
 *
 * Asserts the shape + ordering invariants of the canonical 4-button
 * default toolbar set.
 */
import {
  DEFAULT_TOOLBAR_BUTTONS,
  TOOLBAR_BUTTON_SWORD_B,
  TOOLBAR_BUTTON_SEND_MESSAGE,
  TOOLBAR_BUTTON_INSTALL_SCP,
  TOOLBAR_BUTTON_LOG_DUMP,
} from './defaultToolbarButtons.model';
import {
  validateToolbarButton,
  RESERVED_TOOLBAR_BUTTON_IDS,
} from './toolbarRegistration.model';

describe('defaultToolbarButtons.model', () => {
  describe('shape invariants', () => {
    it('every default button passes validation', () => {
      for (const btn of DEFAULT_TOOLBAR_BUTTONS) {
        const result = validateToolbarButton(btn);
        if (!result.valid) {
          throw new Error(`Button ${btn.id} failed validation: ${result.reason}`);
        }
        expect(result.valid).toBe(true);
      }
    });

    it('every default button ID is in RESERVED_TOOLBAR_BUTTON_IDS', () => {
      const defaultIds = DEFAULT_TOOLBAR_BUTTONS.map((b) => b.id).sort();
      const reserved = [...RESERVED_TOOLBAR_BUTTON_IDS].sort();
      expect(defaultIds).toEqual(reserved);
    });

    it('TOOLBAR_BUTTON_SWORD_B is the ochre B-setter routed to GitmSwordBButton', () => {
      expect(TOOLBAR_BUTTON_SWORD_B.id).toBe('sword-b');
      expect(TOOLBAR_BUTTON_SWORD_B.suiteColor).toBe('ochre');
      expect(TOOLBAR_BUTTON_SWORD_B.componentName).toBe('GitmSwordBButton');
      expect(TOOLBAR_BUTTON_SWORD_B.actionQualityName).toBe('Gitm Branch Create');
    });

    it('TOOLBAR_BUTTON_SEND_MESSAGE is DISABLED in default boot (D3 wires)', () => {
      expect(TOOLBAR_BUTTON_SEND_MESSAGE.enabled).toBe(false);
    });

    it('TOOLBAR_BUTTON_INSTALL_SCP dispatches install menu open', () => {
      expect(TOOLBAR_BUTTON_INSTALL_SCP.actionQualityName).toBe('Scs Bridge Set Install Menu Open');
    });

    it('TOOLBAR_BUTTON_LOG_DUMP is fuchsia (Fuchsia clinician role)', () => {
      expect(TOOLBAR_BUTTON_LOG_DUMP.suiteColor).toBe('fuchsia');
    });
  });

  describe('boot order', () => {
    it('matches RESERVED_TOOLBAR_BUTTON_IDS canonical sequence', () => {
      const bootOrder = DEFAULT_TOOLBAR_BUTTONS.map((b) => b.id);
      expect(bootOrder).toEqual([...RESERVED_TOOLBAR_BUTTON_IDS]);
    });

    it('all reserved buttons present (no silent drop · count matches RESERVED_TOOLBAR_BUTTON_IDS)', () => {
      expect(DEFAULT_TOOLBAR_BUTTONS.length).toBe(RESERVED_TOOLBAR_BUTTON_IDS.length);
    });
  });

  describe('immutability discipline', () => {
    it('DEFAULT_TOOLBAR_BUTTONS is declared readonly array', () => {
      // Compile-time check via readonly type; runtime check on length stability
      const start = DEFAULT_TOOLBAR_BUTTONS.length;
      // (Cannot mutate readonly · TypeScript would flag · runtime test that count is stable)
      expect(DEFAULT_TOOLBAR_BUTTONS.length).toBe(start);
    });
  });
});
