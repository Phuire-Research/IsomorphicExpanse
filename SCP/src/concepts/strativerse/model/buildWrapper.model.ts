/**
 * Build CLI Wrapper Model
 *
 * Wraps Vite build CLI for client compilation after Demometric Interchange.
 * Uses child_process.exec pattern consistent with grepWrapper.model.ts.
 *
 * ARCHITECTURAL NOTE: This is a stateless endpoint wrapper.
 * Each operation is independent - no session tracking needed.
 * AsyncQualities call these methods and fire strategy on completion.
 *
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 * Citation: grep/model/grepWrapper.model.ts (pattern reference)
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// ============================================
// BUILD RESULT TYPE
// ============================================

export type BuildClientResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  duration: number;
  error?: string;
};

// ============================================
// BUILD OPERATIONS
// ============================================

/**
 * Build client using Vite
 *
 * Executes `npm run build:interchange` which runs:
 * `vite build --config vite.client.config.ts --logLevel error`
 *
 * Uses interchange-specific build script with reduced logging to avoid
 * cluttering the console during Demometric Interchange operations.
 *
 * @param serverRoot - Root directory of the server (where package.json lives)
 * @returns Build result with success status and output
 *
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 */
export async function buildClient(serverRoot: string): Promise<BuildClientResult> {
  const startTime = Date.now();

  try {
    console.log(`[BuildWrapper] Starting interchange build in: ${serverRoot}`);

    const { stdout, stderr } = await execAsync('npm run build:interchange', {
      cwd: serverRoot,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for build output
      env: {
        ...process.env,
        // Ensure we don't get color codes in output
        FORCE_COLOR: '0',
        NO_COLOR: '1',
      },
    });

    const duration = Date.now() - startTime;

    console.log(`[BuildWrapper] Client build complete in ${duration}ms`);

    return {
      success: true,
      stdout,
      stderr,
      duration,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const execError = error as { stdout?: string; stderr?: string; message?: string };

    console.error('[BuildWrapper] Client build failed:', execError.message);

    return {
      success: false,
      stdout: execError.stdout || '',
      stderr: execError.stderr || '',
      duration,
      error: execError.message || 'Unknown build error',
    };
  }
}

/**
 * Get server root directory from concepts path
 *
 * Given a path like /path/to/server/src/concepts/notification,
 * returns /path/to/server
 */
export function getServerRootFromConceptPath(conceptPath: string): string {
  // Navigate up from concepts/conceptName to server root
  // conceptPath: /path/to/server/src/concepts/notification
  // server root: /path/to/server
  return path.resolve(conceptPath, '..', '..', '..');
}
