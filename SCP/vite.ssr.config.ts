/**
 * Vite SSR Configuration (vite.ssr.config.ts) — Cycle 158 R3 · Shell Orphan Fix · Path A
 *
 * Compiles `src/entry-server.ts` (which imports Shell.vue + dependencies) into a
 * single Node-loadable bundle at `dist/server/entry-server.js`. The vue.principle.ts
 * loads this bundle at runtime via `require('./dist/server/entry-server.js')`,
 * bypassing ts-node's inability to handle .vue SFC imports.
 *
 * Output is CommonJS to match the existing ts-node + tsconfig `module: CommonJS` runtime.
 *
 * Citation: SCP_ORIGIN /vite.config.ts + build:server script pattern.
 */

import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    outDir: 'dist/server',
    emptyOutDir: false,
    ssr: true,
    minify: false,

    rollupOptions: {
      input: fileURLToPath(new URL('./src/entry-server.ts', import.meta.url)),

      output: {
        format: 'cjs',
        entryFileNames: 'entry-server.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },

      // Externalize node-side deps the principle already has loaded.
      external: ['vue', 'vue/server-renderer', '@vue/server-renderer'],
    },
  },

  ssr: {
    noExternal: [],
  },
});
