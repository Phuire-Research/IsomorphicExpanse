/**
 * SCP Designation Validator — M2-A1-D2 Naming Wizard
 *
 * Pure validation functions for SCP naming wizard. Derives PascalCase
 * designation from user input and camelCase concept name for Stratimux
 * binding. Stricter than CLI-side validateDesignation (scpInstance.ts)
 * because the SCS-Bridge wizard generates BARE-MINIMUM concept files —
 * requires camelCase-safe naming (no spaces · hyphens · dots).
 *
 * Higher-Order Composition: pure functions composed by the wizard quality.
 * No state owned; all input parameterized. AJMI compatible — the validated
 * designation flows into ScpRegistryEntry.name + .conceptName at clone time.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D2
 * Citation: src/lib/scp/scpInstance.ts validateDesignation (CLI-side precedent)
 */

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export interface DesignationValidation {
  valid: boolean;
  reason?: string;
}

export interface NameDerivation {
  designation: string;     // PascalCase user-facing name e.g. "MyResearchSCP"
  conceptName: string;     // camelCase Stratimux ident e.g. "myResearchSCP"
}

// ============================================
// RESERVED NAMES
// ============================================

export const SCP_RESERVED_NAMES: readonly string[] = [
  'template',
  'SCP',
  'huirth',
  'client',
  'scsBridge',
  'scpRegistry',
  'scpLog',
  'webSocketClient',
  'webSocketServer',
  'serverConcept',
  'vueConcept',
  'notification',
  'notificationHuirth',
];

// ============================================
// VALIDATION
// ============================================

/**
 * Validates an SCP designation for the wizard. Stricter than CLI-side:
 *   - 2-32 characters (CLI allows 64; wizard caps for filesystem ergonomics)
 *   - PascalCase ONLY (must start with uppercase + alphanumeric content)
 *   - No spaces, hyphens, underscores, periods (camelCase derivation requires this)
 *   - Not in SCP_RESERVED_NAMES (case-insensitive)
 */
export function validateDesignationForWizard(designation: string): DesignationValidation {
  if (typeof designation !== 'string') {
    return { valid: false, reason: 'Designation must be a string' };
  }
  if (designation.length === 0) {
    return { valid: false, reason: 'Enter a name for your SCP' };
  }
  if (designation.length < 2) {
    return { valid: false, reason: 'Designation must be at least 2 characters' };
  }
  if (designation.length > 32) {
    return { valid: false, reason: 'Designation cannot exceed 32 characters' };
  }
  if (!/^[A-Z]/.test(designation)) {
    return { valid: false, reason: 'Designation must start with an uppercase letter (PascalCase)' };
  }
  if (!/^[A-Za-z0-9]+$/.test(designation)) {
    return {
      valid: false,
      reason: 'Designation may contain only letters and numbers (no spaces · hyphens · underscores · periods)',
    };
  }
  const lowerInput = designation.toLowerCase();
  for (const reserved of SCP_RESERVED_NAMES) {
    if (lowerInput === reserved.toLowerCase()) {
      return { valid: false, reason: `"${designation}" is a reserved name` };
    }
  }
  return { valid: true };
}

// ============================================
// DERIVATION
// ============================================

/**
 * Derives a canonical NameDerivation from validated designation input.
 * Caller MUST validate first via `validateDesignationForWizard`. Behavior
 * on invalid input is undefined.
 *
 *   designation: stays as user-entered PascalCase
 *   conceptName: first char lowercased, rest preserved (camelCase)
 *
 *   "MyResearchSCP" → { designation: "MyResearchSCP", conceptName: "myResearchSCP" }
 *   "Foo"           → { designation: "Foo", conceptName: "foo" }
 */
export function deriveNamesFromDesignation(designation: string): NameDerivation {
  const conceptName = designation.charAt(0).toLowerCase() + designation.slice(1);
  return {
    designation,
    conceptName,
  };
}

/**
 * One-shot composite: validate + derive. Returns either valid derivation
 * OR validation reason. Consuming wizard quality uses this for the
 * single-dispatch update of `wizardConceptNameDraft` + `wizardConceptNameValid`
 * + `wizardConceptNameError` triplet.
 */
export type WizardNameResult =
  | { ok: true; derivation: NameDerivation }
  | { ok: false; reason: string };

export function validateAndDerive(designation: string): WizardNameResult {
  const validation = validateDesignationForWizard(designation);
  if (!validation.valid) {
    return { ok: false, reason: validation.reason ?? 'Invalid designation' };
  }
  return { ok: true, derivation: deriveNamesFromDesignation(designation) };
}
