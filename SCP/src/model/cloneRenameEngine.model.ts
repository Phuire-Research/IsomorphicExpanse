/**
 * Clone + Rename Engine — M2-A1-D3
 *
 * Materializes a user-installed SCP from the template tree by:
 *   1. Recursive copy of template/SCP → {installPath}/SCP (skipping node_modules · dist · etc.)
 *   2. Case-preserving substitution of template identifiers with user's designation
 *      derivations (huirth-scp-template → {conceptName}-scp, etc.)
 *   3. Writing generated bare-minimum concept files (from M2-A1-D2 generator)
 *   4. Stamping template-version.json metadata into the install
 *
 * Higher-Order Composition: pure orchestration over node:fs primitives.
 * NameDerivation flows in from designationValidator.model.ts; GeneratedConceptBundle
 * flows in from conceptGenerator.model.ts. Engine owns no state.
 *
 * Filesystem Lambda-event: actual disk writes happen here. Caller must
 * Concluder-verify (test -d {installPath}/SCP/package.json) post-call.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D3
 * Citation: designationValidator.model.ts + conceptGenerator.model.ts (M2-A1-D2 substrate)
 * Citation: SUITE-1-RED-MACRO-2-CURATION.md (R1 grounding · ADMIN_ICP install precedent)
 */
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} from 'node:fs';
import path from 'node:path';
import type { NameDerivation } from './designationValidator.model';
import type { GeneratedConceptBundle } from './conceptGenerator.model';

// ============================================
// CONFIG
// ============================================

/**
 * Directories to skip during recursive copy. node_modules and dist are
 * never copied — the user installs fresh node_modules via npm install
 * at M2-A1-D4 (Prime stage). `.bridge-restart.json` is dynamic state.
 */
export const CLONE_SKIP_DIRS: readonly string[] = [
  'node_modules',
  'dist',
  'coverage',
  '.git',
];

export const CLONE_SKIP_FILES: readonly string[] = [
  '.bridge-restart.json',
  '.DS_Store',
  '*.tsbuildinfo',
];

/**
 * File extensions eligible for rename substitution. Binary files (.png,
 * .ico, etc.) are copied byte-for-byte without text substitution.
 */
export const RENAME_ELIGIBLE_EXTENSIONS: readonly string[] = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.html',
  '.css',
  '.vue',
];

// ============================================
// RENAME RULES (case-preserving substitution)
// ============================================

export interface RenameRule {
  template: string;        // pattern in template
  replacement: string;     // user-derived replacement
  caseSensitive: boolean;  // if false, applies to all case variants
}

/**
 * Builds the canonical rename rule set from a NameDerivation. The template
 * uses `huirth-scp-template` as its package name; user installs become
 * `{conceptName}-scp`. PascalCase template references would rename to
 * derivation.designation; camelCase to derivation.conceptName.
 *
 * Note: framework concept names (huirth, client, scsBridge, etc.) are
 * NOT renamed — they're framework-internal constants. Only the npm package
 * identity changes.
 */
export function buildRenameRules(d: NameDerivation): RenameRule[] {
  return [
    {
      template: 'huirth-scp-template',
      replacement: `${d.conceptName.toLowerCase()}-scp`,
      caseSensitive: true,
    },
    {
      template: 'HuiRth SCP Template - Barebones Co-Located Vue Island Architecture',
      replacement: `${d.designation} SCP - Personalized Stratimuxian Manifold`,
      caseSensitive: true,
    },
  ];
}

/**
 * Applies all rules to content. Case-sensitive rules use exact match;
 * case-insensitive rules generate 3 variants (lower · upper · capitalized)
 * mapping to similarly-cased replacements.
 */
export function applyRenameRules(content: string, rules: RenameRule[]): string {
  let result = content;
  for (const rule of rules) {
    if (rule.caseSensitive) {
      result = result.split(rule.template).join(rule.replacement);
    } else {
      // Case-preserving: lower → lower, Cap → Cap, UPPER → UPPER
      const lower = rule.template.toLowerCase();
      const upper = rule.template.toUpperCase();
      const capitalized = rule.template.charAt(0).toUpperCase() + rule.template.slice(1).toLowerCase();
      const replLower = rule.replacement.toLowerCase();
      const replUpper = rule.replacement.toUpperCase();
      const replCap = rule.replacement.charAt(0).toUpperCase() + rule.replacement.slice(1).toLowerCase();
      result = result.split(lower).join(replLower);
      result = result.split(upper).join(replUpper);
      result = result.split(capitalized).join(replCap);
    }
  }
  return result;
}

// ============================================
// COPY (recursive · skip-list aware)
// ============================================

/**
 * Returns true if the given path basename should be skipped during copy.
 */
export function shouldSkip(basename: string): boolean {
  if (CLONE_SKIP_DIRS.includes(basename)) return true;
  for (const pattern of CLONE_SKIP_FILES) {
    if (pattern.startsWith('*')) {
      const ext = pattern.slice(1);
      if (basename.endsWith(ext)) return true;
    } else if (basename === pattern) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true if the file extension makes the file eligible for text
 * rename substitution.
 */
export function isRenameEligible(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return RENAME_ELIGIBLE_EXTENSIONS.includes(ext);
}

/**
 * Recursive copy with rename pass. Walks `srcDir`, copies each non-skip
 * entry to `destDir`. Text-eligible files run through `applyRenameRules`;
 * binary files are byte-copied.
 *
 * Returns the count of files copied (for Concluder verification).
 */
export function cloneWithRename(
  srcDir: string,
  destDir: string,
  rules: RenameRule[],
): { filesCopied: number; dirsCreated: number } {
  let filesCopied = 0;
  let dirsCreated = 0;

  function walk(currentSrc: string, currentDest: string): void {
    if (!existsSync(currentDest)) {
      mkdirSync(currentDest, { recursive: true });
      dirsCreated++;
    }
    const entries = readdirSync(currentSrc);
    for (const entry of entries) {
      if (shouldSkip(entry)) continue;
      const srcEntry = path.join(currentSrc, entry);
      const destEntry = path.join(currentDest, entry);
      const stat = statSync(srcEntry);
      if (stat.isDirectory()) {
        walk(srcEntry, destEntry);
      } else if (stat.isFile()) {
        if (isRenameEligible(srcEntry)) {
          const content = readFileSync(srcEntry, 'utf8');
          const renamed = applyRenameRules(content, rules);
          writeFileSync(destEntry, renamed, 'utf8');
        } else {
          copyFileSync(srcEntry, destEntry);
        }
        filesCopied++;
      }
    }
  }

  walk(srcDir, destDir);
  return { filesCopied, dirsCreated };
}

// ============================================
// GENERATED CONCEPT WRITER
// ============================================

/**
 * Writes the M2-A1-D2 generated concept bundle into the installed SCP's
 * src/ tree. `installSrcDir` is typically `{installPath}/SCP/src`.
 *
 * Returns count of files written for Concluder.
 */
export function writeGeneratedConcept(
  installSrcDir: string,
  bundle: GeneratedConceptBundle,
): { filesWritten: number } {
  let filesWritten = 0;
  for (const file of bundle.files) {
    const fullPath = path.join(installSrcDir, file.relativePath);
    const dir = path.dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, file.content, 'utf8');
    filesWritten++;
  }
  return { filesWritten };
}

// ============================================
// TOP-LEVEL ORCHESTRATOR
// ============================================

export interface MaterializeScpOptions {
  templateRoot: string;          // abs path to Cascades/scps/template/SCP
  installRoot: string;           // abs path to Cascades/scps/{Designation}/SCP
  derivation: NameDerivation;
  generatedConcept: GeneratedConceptBundle;
}

export interface MaterializeScpResult {
  ok: boolean;
  filesCopied: number;
  dirsCreated: number;
  generatedFilesWritten: number;
  reason?: string;
}

/**
 * End-to-end SCP materialization: copy template → apply rename → write
 * generated concept. Fails fast if installRoot already exists (caller's
 * responsibility to ensure clean target).
 */
export function materializeScp(opts: MaterializeScpOptions): MaterializeScpResult {
  if (existsSync(opts.installRoot)) {
    return {
      ok: false,
      filesCopied: 0,
      dirsCreated: 0,
      generatedFilesWritten: 0,
      reason: `Install path already exists: ${opts.installRoot}`,
    };
  }
  if (!existsSync(opts.templateRoot)) {
    return {
      ok: false,
      filesCopied: 0,
      dirsCreated: 0,
      generatedFilesWritten: 0,
      reason: `Template path missing: ${opts.templateRoot}`,
    };
  }

  const rules = buildRenameRules(opts.derivation);
  const cloneResult = cloneWithRename(opts.templateRoot, opts.installRoot, rules);
  const writeResult = writeGeneratedConcept(
    path.join(opts.installRoot, 'src'),
    opts.generatedConcept,
  );

  return {
    ok: true,
    filesCopied: cloneResult.filesCopied,
    dirsCreated: cloneResult.dirsCreated,
    generatedFilesWritten: writeResult.filesWritten,
  };
}
