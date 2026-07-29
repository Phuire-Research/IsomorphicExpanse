/**
 * Vite Client Configuration (vite.client.config.ts)
 *
 * Builds client-side island bundles for tier-gated SSR delivery.
 *
 * Architecture:
 * - Entry: src/main.ts (client hydration orchestrator)
 * - Output: dist/client/ (static bundles served by Express)
 * - Manifest: Enables server to resolve asset paths
 *
 * Build Flow:
 * 1. npm run build:client → runs this config
 * 2. Vite bundles main.ts + all imported islands
 * 3. Output goes to dist/client/ with manifest.json
 * 4. Server reads manifest to inject correct script tags
 *
 * Citation: SUITE-1-2-MUXONOMY-ISLANDS-ARCHITECTURE.md
 * Citation: FORWARD-PASS-MUXONOMY-ISLANDS.md
 */

import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
// NOTE: @vitejs/plugin-vue-jsx is intentionally NOT loaded here. These SCP islands are pure
// .vue SFCs (no JSX/TSX), so plugin-vue handles all compilation. plugin-vue-jsx@4.2.0 pulls a
// pure-ESM @rolldown/pluginutils that the CJS config loader cannot require() (ERR_REQUIRE_ESM);
// dropping the unused plugin removes that config-load ghost with zero effect on output.

/**
 * Stratimux Concept Reload Plugin
 *
 * Forces full page reload when Stratimux concept files change.
 * HMR cannot properly handle muxification changes because:
 * - Muxium is created once at app startup
 * - Initial state is computed at module load time
 * - HMR replaces modules but doesn't re-run muxification
 *
 * Patterns that trigger full reload:
 * - *.concept.ts (concept definitions)
 * - *.shared.ts (shared types and initial data)
 * - *.principle.ts (principle functions)
 * - *.quality.ts (quality definitions)
 * - *.muxonomy.ts (muxonomy configurations)
 */
function stratimuxConceptReload(): Plugin {
  return {
    name: 'stratimux-concept-reload',
    handleHotUpdate({ file, server }) {
      const conceptPatterns = [
        /\.concept\.ts$/,
        /\.shared\.ts$/,
        /\.principle\.ts$/,
        /qualities\/.*\.quality\.ts$/,
        /\.muxonomy\.ts$/
      ];

      const needsFullReload = conceptPatterns.some(pattern => pattern.test(file));

      if (needsFullReload) {
        console.log(`[Stratimux] Concept file changed: ${file.split('/').pop()}`);
        console.log('[Stratimux] Triggering full page reload (muxification requires restart)');
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    }
  };
}

export default defineConfig({
  plugins: [
    stratimuxConceptReload(),
    vue(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  build: {
    // Output to dist/client for server to serve
    outDir: 'dist/client',

    // Don't empty outDir (preserve server build in dist/)
    emptyOutDir: false,

    // Generate manifest for SSR asset resolution
    manifest: true,

    // Disable minification for debugging (enable in production)
    minify: false,

    rollupOptions: {
      // Client entry point
      input: {
        main: fileURLToPath(new URL('./src/main.ts', import.meta.url))
      },

      output: {
        // Entry chunk naming
        entryFileNames: 'islands/[name]-[hash].js',

        // Code-split chunk naming
        chunkFileNames: 'islands/chunks/[name]-[hash].js',

        // Asset naming (CSS, images, etc.)
        assetFileNames: 'islands/assets/[name]-[hash].[ext]',

        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'vue-vendor': ['vue'],
          'stratimux-vendor': ['stratimux'],

          // Concept bundles can be split here for production
          // 'strativerse-island': ['./src/concepts/strativerse/strativerse.muxonomy'],
        }
      }
    }
  },

  // Development server configuration (for standalone client dev)
  server: {
    port: 5174, // Different from main Vite default to avoid conflicts
    strictPort: true,
  },

  // Optimize dependencies for faster dev startup
  optimizeDeps: {
    include: ['vue', 'stratimux']
  },

  // Define environment variables
  define: {
    // Ensure production checks work
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
