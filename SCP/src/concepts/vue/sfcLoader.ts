/**
 * Vue SFC Runtime Loader
 *
 * Compiles .vue Single File Components at runtime for SSR.
 * Uses @vue/compiler-sfc to parse and compile .vue files.
 *
 * Purpose: Enable SSR of .vue files from client (source of truth)
 * Pattern: Runtime compilation for PoC, migrate to Vite SSR build later
 *
 * Citation: FORWARD-PASS-STRATIVERSE-VUE-SSR-ARCHITECTURE.md
 * Architecture: Client .vue files → Server runtime compilation → SSR HTML
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  parse,
  compileScript,
  compileTemplate,
  type SFCDescriptor,
  type SFCScriptBlock,
} from '@vue/compiler-sfc';
import { createSSRApp, h, type Component, type DefineComponent } from 'vue';
import { renderToString } from '@vue/server-renderer';

// ============================================
// TYPES
// ============================================

export type CompiledSFC = {
  component: Component;
  descriptor: SFCDescriptor;
  styles: string[];
};

export type SFCCache = Map<string, CompiledSFC>;

// ============================================
// CACHE
// ============================================

/**
 * SFC cache - avoid recompilation on every request
 * Key: absolute file path
 * Value: compiled component and metadata
 */
const sfcCache: SFCCache = new Map();

/**
 * Development mode - clear cache on file changes
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

// ============================================
// LOADER FUNCTIONS
// ============================================

/**
 * loadSFC - Load and compile a .vue file
 *
 * Reads .vue file, parses with compiler-sfc, and returns component.
 * Caches compiled result for subsequent requests.
 *
 * @param filePath - Absolute path to .vue file
 * @param useCache - Whether to use cached compilation (default: true)
 * @returns Compiled SFC with component and styles
 */
export async function loadSFC(
  filePath: string,
  useCache: boolean = true,
): Promise<CompiledSFC | null> {
  // Check cache
  if (useCache && sfcCache.has(filePath)) {
    console.log(`[SFC Loader] Cache hit: ${path.basename(filePath)}`);
    return sfcCache.get(filePath)!;
  }

  // Verify file exists
  if (!fs.existsSync(filePath)) {
    console.error(`[SFC Loader] File not found: ${filePath}`);
    return null;
  }

  try {
    console.log(`[SFC Loader] Compiling: ${path.basename(filePath)}`);

    // Read .vue file
    const source = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);

    // Parse SFC
    const { descriptor, errors } = parse(source, {
      filename,
      sourceMap: isDevelopment,
    });

    if (errors.length > 0) {
      console.error(`[SFC Loader] Parse errors in ${filename}:`, errors);
      return null;
    }

    // Compile script (if exists)
    let scriptCode = '';
    let bindings: Record<string, unknown> | undefined;

    if (descriptor.script || descriptor.scriptSetup) {
      const compiledScript = compileScript(descriptor, {
        id: filename,
        sourceMap: isDevelopment,
      });
      scriptCode = compiledScript.content;
      bindings = compiledScript.bindings;
    }

    // Compile template (if exists)
    let renderCode = '';
    if (descriptor.template) {
      const compiledTemplate = compileTemplate({
        source: descriptor.template.content,
        filename,
        id: filename,
        compilerOptions: {
          bindingMetadata: bindings as any,
          mode: 'module',
        },
      });

      if (compiledTemplate.errors.length > 0) {
        console.error(`[SFC Loader] Template errors in ${filename}:`, compiledTemplate.errors);
        return null;
      }

      renderCode = compiledTemplate.code;
    }

    // Extract styles
    const styles = descriptor.styles.map((style) => style.content);

    // Create component
    // For SSR, we need a simple component with render function
    // Note: This is simplified - full implementation would use eval or vm.runInContext
    const component = createSimpleSSRComponent(descriptor, filename);

    const compiled: CompiledSFC = {
      component,
      descriptor,
      styles,
    };

    // Cache result
    sfcCache.set(filePath, compiled);

    console.log(`[SFC Loader] Successfully compiled: ${filename}`);
    return compiled;
  } catch (error) {
    console.error(`[SFC Loader] Compilation error for ${filePath}:`, error);
    return null;
  }
}

/**
 * createSimpleSSRComponent - Create a simple SSR component from descriptor
 *
 * For the PoC, we create a component that renders the template content.
 * This is simplified and doesn't support script logic.
 *
 * Full implementation would use vm.runInContext or similar for script execution.
 */
function createSimpleSSRComponent(descriptor: SFCDescriptor, filename: string): Component {
  // For SSR PoC, we render the template as static HTML
  // Script logic is NOT executed - this is a limitation of runtime compilation
  // For full support, migrate to Vite SSR build pipeline

  const templateContent = descriptor.template?.content ?? '';

  return {
    name: filename.replace('.vue', ''),
    render() {
      // Parse template and convert to h() calls
      // For PoC, we use a simplified approach: render as raw HTML
      // This works for static templates but not for dynamic ones
      return h('div', {
        innerHTML: templateContent,
        class: 'sfc-ssr-content',
      });
    },
  };
}

/**
 * renderSFC - Load and render a .vue file to HTML string
 *
 * Convenience function that loads SFC and renders to string.
 *
 * @param filePath - Absolute path to .vue file
 * @returns Rendered HTML string
 */
export async function renderSFC(filePath: string): Promise<string | null> {
  const compiled = await loadSFC(filePath);
  if (!compiled) {
    return null;
  }

  try {
    const app = createSSRApp(compiled.component);
    const html = await renderToString(app);
    return html;
  } catch (error) {
    console.error(`[SFC Loader] Render error for ${filePath}:`, error);
    return null;
  }
}

/**
 * renderSFCWithStyles - Load and render with extracted styles
 *
 * Returns both HTML and style tags for full page rendering.
 */
export async function renderSFCWithStyles(filePath: string): Promise<{
  html: string;
  styles: string;
} | null> {
  const compiled = await loadSFC(filePath);
  if (!compiled) {
    return null;
  }

  try {
    const app = createSSRApp(compiled.component);
    const html = await renderToString(app);
    const styles = compiled.styles.join('\n');

    return { html, styles };
  } catch (error) {
    console.error(`[SFC Loader] Render error for ${filePath}:`, error);
    return null;
  }
}

/**
 * clearSFCCache - Clear the SFC compilation cache
 *
 * Call when .vue files change in development.
 */
export function clearSFCCache(): void {
  sfcCache.clear();
  console.log('[SFC Loader] Cache cleared');
}

/**
 * getCacheStats - Get cache statistics
 */
export function getCacheStats(): { size: number; files: string[] } {
  return {
    size: sfcCache.size,
    files: Array.from(sfcCache.keys()).map((p) => path.basename(p)),
  };
}

// ============================================
// PATH UTILITIES
// ============================================

/**
 * resolveClientPath - Resolve path relative to client/src
 *
 * @param relativePath - Path relative to client/src (e.g., 'views/strativerse/Landing.vue')
 * @returns Absolute path
 */
export function resolveClientPath(relativePath: string): string {
  return path.join(process.cwd(), '../client/src', relativePath);
}

/**
 * resolveConceptVuePath - Resolve path to concept's vue/ directory
 *
 * Concept-centric architecture: Each concept owns its vue/ directory.
 * Pattern: server/src/concepts/[conceptName]/vue/[PageName].vue
 *
 * @param conceptName - Concept name (e.g., 'strativerse')
 * @param pageName - Page name (e.g., 'Landing')
 * @returns Absolute path to .vue file
 */
export function resolveConceptVuePath(conceptName: string, pageName: string): string {
  return path.join(process.cwd(), 'src/concepts', conceptName, 'vue', `${pageName}.vue`);
}

/**
 * resolveComponentPath - Resolve component path from muxonomy config
 *
 * Muxonomy componentPath format: 'strativerse/vue/Landing'
 * Resolves to: server/src/concepts/strativerse/vue/Landing.vue
 *
 * Citation: FORWARD-PASS-STRATIVERSE-VUE-SSR-ARCHITECTURE.md
 * Pattern: Concept-centric Vue pages (concept/vue/Page.vue)
 *
 * @param componentPath - Component path from PageEntry.componentPath
 * @returns Absolute path to .vue file
 */
export function resolveComponentPath(componentPath: string): string {
  // Convert muxonomy format to actual file path
  // 'strativerse/vue/Landing' → concepts/strativerse/vue/Landing.vue
  const parts = componentPath.split('/');
  const conceptName = parts[0];
  const pageName = parts[parts.length - 1];

  // Concept-centric pattern: concept/vue/PageName.vue
  return resolveConceptVuePath(conceptName, pageName);
}

export const sfcLoader = {
  loadSFC,
  renderSFC,
  renderSFCWithStyles,
  clearSFCCache,
  getCacheStats,
  resolveClientPath,
  resolveConceptVuePath,
  resolveComponentPath,
};
