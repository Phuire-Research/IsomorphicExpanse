<script setup lang="ts">
/**
 * Shell Component — SSR Layout Frame (E13 fix · Cycle 160 R3 Wave 2A)
 *
 * Shell is SSR-only · zero interactive Vue logic permitted here.
 * TaskBar + Sessions popup + click handlers moved to IslandWrapper.vue
 * (the only client-hydrated Vue tree). Per R7 Rose clinical diagnosis,
 * Shell.vue's <script setup> runs server-side only — any ref/computed/
 * @event-handler bound here is DEAD on the client (Vue runtime never
 * attaches handlers to SSR-rendered HTML it does not also hydrate).
 *
 * What Shell retains (Tier 1 SSR responsibilities):
 * - Sidebar layout markup + sidebar collapse ref (UX-prep · also SSR-dead
 *   reactively but acceptable for static layout; TBBM refactor Wave 2C
 *   may relocate sidebar logic if interactive collapse is required)
 * - Island container <div id="island-wrapper"> (IslandWrapper mount target)
 * - Sidebar/main scoped styles
 *
 * What Shell relinquished (moved to IslandWrapper · E13 fix):
 * - <TaskBar /> mount + click handler function
 * - <ScsBridgeSessionsPopup /> mount + open-state ref
 * - component-id-to-Vue-component lookup map
 * - global controller accessor call (SSR-dead by definition)
 *
 * Citation: TASKBAR-BUTTON-MODULE-WAVE1-R7-ROSE-CLINICAL.md (E13)
 * Citation: TASKBAR-BUTTON-MODULE-WAVE1-R4-VIRIDIAN-AUDIT.md (Two-Tree Architecture)
 * Citation: Watchlist 5 · SSR-Tier Boundary Invariant
 */
import { ref } from 'vue';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isActive: boolean;
  // MD-8 D-NM-1 · optional variant marking the synthetic "Create S8" dotted entry.
  variant?: string;
}

export interface ShellProps {
  title: string;
  islandId: string;
  navItems: NavItem[];
}

defineProps<ShellProps>();

// Sidebar collapse state (UI PREP · SSR-dead reactively but acceptable for layout)
// TBBM refactor Wave 2C may relocate if interactive collapse is required.
const sidebarCollapsed = ref<boolean>(false);
function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
</script>

<template>
  <div
    class="shell"
    :style="{ '--sidebar-width': sidebarCollapsed ? '60px' : '240px' }"
  >
    <!-- Sidebar Navigation -->
    <aside :class="['sidebar', 'hifi-pane-base', { collapsed: sidebarCollapsed }]">
      <div class="sidebar-header">
        <a
          href="/"
          class="sidebar-brand-link"
          style="text-decoration: none"
          aria-label="Suite Cascade System · Home"
        >
          <img class="sidebar-logo" src="/scs-logo.png" alt="Suite Cascade System" />
          <img class="sidebar-badge" src="/scs-badge.png" alt="SCS" />
        </a>
        <!-- The collapse control is a LONG BAR just under the logo — `« UnExpand «` (C457).
             Collapsed it shrinks to the rail showing only the flipped chevrons; the label
             hides via CSS. The LIVE rules ship via vue.principle's stylesheet (scoped never
             ships); the icon swap is IslandWrapper's delegated handler (all i elements). -->
        <button
          class="sidebar-collapse-btn hifi-btn hifi-btn-base"
          data-testid="sidebar-collapse-btn"
          :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleSidebar"
        >
          <i :class="sidebarCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"></i>
          <span class="collapse-label">UnExpand</span>
          <i :class="sidebarCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"></i>
        </button>
      </div>
      <nav class="sidebar-nav">
        <a
          v-for="item in navItems"
          :key="item.id"
          :href="item.path"
          :class="[
            'nav-item',
            { active: item.isActive, 'nav-item-create': item.variant === 'create' },
          ]"
          :data-concept="item.id"
          :title="sidebarCollapsed ? item.label : undefined"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="main">
      <div id="island-wrapper" :data-island-id="islandId" class="island-container">
        <div class="island-loading">
          <div class="loading-spinner"></div>
          <h2>{{ title }}</h2>
          <p>Initializing...</p>
        </div>
      </div>
    </main>

    <!--
      E13 fix · Cycle 160 R3 Wave 2A · TaskBar + Sessions popup REMOVED from Shell.
      Both now mounted inside IslandWrapper.vue (the only client-hydrated Vue tree)
      so their event bindings actually attach to the DOM. Shell-mounted versions
      were dead HTML — visible buttons, no @click listeners. See R7 Rose clinical
      diagnosis E13 · TASKBAR-BUTTON-MODULE-WAVE1-R7-ROSE-CLINICAL.md.
    -->
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.shell {
  display: flex;
  min-height: 100vh;
  color: var(--color-white-conductor, #f0f0f0);
  font-family: var(--font-body, 'Inter', system-ui, -apple-system, sans-serif);
}

/* Sidebar — visual styling lives in global .hifi-pane-base; layout-only here */
.sidebar {
  width: var(--sidebar-width, 240px);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.collapsed .sidebar-logo,
.sidebar.collapsed .nav-label {
  opacity: 0;
  width: 0;
  overflow: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease, width 0.2s ease;
}

.sidebar.collapsed .sidebar-badge {
  display: block;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 1rem;
}

/* BO-5 (C454) · THE CLIENT-LIVE COLLAPSE: the Shell is SSR-static (the Vue @click never
   binds in the browser) — IslandWrapper's delegated click toggles .sidebar-collapsed on
   .shell + persists localStorage. These class-driven rules ARE the live mechanism; the
   inline --sidebar-width binding above only serves the (dead) SSR path. */
.shell.sidebar-collapsed {
  --sidebar-width: 60px;
}
.shell.sidebar-collapsed .sidebar-logo,
.shell.sidebar-collapsed .nav-label {
  opacity: 0;
  width: 0;
  display: none;
}
.shell.sidebar-collapsed .sidebar-badge {
  display: block;
}
.shell.sidebar-collapsed .nav-item {
  justify-content: center;
}
.shell.sidebar-collapsed .collapse-label,
.shell.sidebar-collapsed .sidebar-collapse-btn i:last-child {
  display: none;
}
.shell.sidebar-collapsed .sidebar-collapse-btn {
  gap: 0;
  opacity: 0.8;
}

.sidebar-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* Parity mirror of the SERVED rules (vue.principle.ts) — the long bar under the logo. */
.sidebar-collapse-btn {
  width: 100%;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--color-white-conductor, #f0f0f0);
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
  opacity: 0.55;
  transition: opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.sidebar-collapse-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
}

.sidebar-collapse-btn:active {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.sidebar-brand-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition: transform 0.2s ease;
}

.sidebar-brand-link:hover {
  transform: scale(1.02);
}

.sidebar-logo {
  width: 100%;
  max-width: 200px;
  height: auto;
  display: block;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
  transition: opacity 0.2s ease, width 0.2s ease;
}

.sidebar-badge {
  display: none;
  width: 44px;
  height: 44px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: var(--color-white-muted, #a0a0a8);
  text-decoration: none;
  transition: all 0.2s ease;
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
  font-size: 0.875rem;
}

.nav-item:hover {
  background: rgba(59, 130, 246, 0.08);
  color: var(--color-white-conductor, #f0f0f0);
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.12);
  color: var(--color-white-conductor, #f0f0f0);
  border-left: 3px solid var(--color-blue, #3b82f6);
  padding-left: calc(1.5rem - 3px);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
}

/* MD-8 D-NM-1 · THE TRAILING DOTTED ENTRY — the small "Create S8" affordance.
   SMALL (reduced padding + font vs the standard rows) · DOTTED border (Pewter neutral,
   dashed 1px in a muted accent, brightening on hover) · visually distinct from the real
   muxonomic pages · sits last in the list. Pewter = the neutral system-chrome register. */
.nav-item.nav-item-create {
  margin: 0.5rem 1rem 0;
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  color: var(--color-pewter-light, #cbd0d6);
  border: 1px dashed rgba(154, 160, 168, 0.4);
  border-radius: 6px;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.nav-item.nav-item-create:hover {
  background: rgba(154, 160, 168, 0.08);
  border-color: rgba(154, 160, 168, 0.75);
  color: var(--color-white-conductor, #f0f0f0);
}

.nav-item.nav-item-create .nav-icon {
  font-size: 0.9rem;
  width: 1.1rem;
}

.nav-icon {
  font-size: 1.25rem;
  width: 1.5rem;
  text-align: center;
}

.nav-label {
  font-size: 0.875rem;
  transition: opacity 0.2s ease, width 0.2s ease;
}

/* Main Content — synchronized with sidebar width via --sidebar-width variable */
.main {
  flex: 1;
  margin-left: var(--sidebar-width, 240px);
  min-height: 100vh;
  padding-bottom: 68px; /* TaskBar height clearance (56px content + the 12px bottom band) */
  transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0; /* BO-5 · islands react to the sidebar width */
}

/* Island Container */
.island-container {
  min-height: calc(100vh - 68px); /* TaskBar clearance */
}

/* Loading State */
.island-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 68px);
  color: var(--color-white-muted, #a0a0a8);
}

.island-loading h2 {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-white-conductor, #f0f0f0);
  margin-bottom: 1rem;
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.18);
  border-top-color: var(--color-blue, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive — media query cooperates with --sidebar-width via JS toggle.
   Media query remains as fallback for non-JS environments. */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  .sidebar-logo,
  .nav-label {
    display: none;
  }
  .sidebar-badge {
    display: block;
  }
  .nav-item {
    justify-content: center;
    padding: 1rem;
  }
  .main {
    margin-left: 60px;
  }
}
</style>
