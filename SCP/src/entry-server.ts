/**
 * SSR Server Entry — Compiled by Vite SSR Build (Cycle 158 R3 · Shell Orphan Fix · Path A)
 *
 * This module is compiled by `vite build --ssr` into `dist/server/entry-server.{js,cjs}`.
 * The compiled output is imported at runtime by `vue.principle.ts` to render the canonical
 * Shell.vue SFC server-side. Bypasses ts-node's inability to load `.vue` files directly.
 *
 * Citation: TASKBAR-ORPHAN-FIX-WAVE1-R2-RUST-PROSPECTING.md §SCP_ORIGIN entry-server pattern
 * Citation: TASKBAR-ORPHAN-FIX-WAVE1-R4-VIRIDIAN-AUDIT.md §HAZARD-B Fix Required
 */

import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Shell from './concepts/vue/shell/Shell.vue';

export interface ShellSSRNavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isActive: boolean;
  // MD-8 D-NM-1 · optional variant marking the synthetic "Create S8" dotted entry.
  variant?: string;
}

export interface ShellSSRProps {
  title: string;
  islandId: string;
  navItems: ShellSSRNavItem[];
}

/**
 * Render the canonical Shell.vue to an HTML string.
 *
 * The rendered shell:
 * - Mounts to `<div id="island-wrapper">` (static — preserves main.ts:56 lookup)
 * - Includes sidebar with logo+badge + collapse button
 * - Includes TaskBar (fixed bottom · Option B overlay)
 * - Includes loading-state placeholder for island hydration
 */
export async function renderShellToHtml(props: ShellSSRProps): Promise<string> {
  const app = createSSRApp(Shell as never, props as unknown as Record<string, unknown>);
  return await renderToString(app);
}
