/**
 * Vue SFC Type Declarations
 *
 * Allows TypeScript to understand .vue file imports.
 * Required for main.ts to import IslandWrapper.vue
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
