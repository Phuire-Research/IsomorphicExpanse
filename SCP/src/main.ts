/**
 * Client Build Entry Point (main.ts)
 *
 * Entry point for Vite's client build.
 * Mounts IslandWrapper as the single Vue client root (Tier 2).
 *
 * 3-Tier Architecture:
 * - Tier 1: Base SSR Shell (static HTML from server)
 * - Tier 2: Island Wrapper (THIS - single Vue client root)
 * - Tier 3: Concept Landings (dynamically loaded by IslandWrapper)
 *
 * Key Pattern:
 * - IslandWrapper provides notification controller
 * - IslandWrapper dynamically loads concept landings
 * - ClientMuxium in landings hooks into controller via inject
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: 3-Tier Application Architecture Discovery
 */

import './style.css';
import { createApp } from 'vue';
import IslandWrapper from './concepts/vue/IslandWrapper.vue';

// ============================================
// APP STATE INTERFACE (Server-Injected)
// ============================================

interface AppState {
  authorizedIslandIds: string[];
  initialIslandId?: string;
  // D-RB · THE NAVBAR ROTARY BARREL — the SSR nav list threaded through __APP_STATE__ (the barrel
  // island ring source · Create-S8 entry last). Optional: a build predating the barrel omits it,
  // and SidebarBarrel defensively renders nothing when it is absent.
  navItems?: Array<{
    id: string;
    label: string;
    icon: string;
    path: string;
    isActive: boolean;
    variant?: string;
  }>;
  initialRoute?: string;
  serverTime?: number;
}

declare global {
  interface Window {
    __APP_STATE__?: AppState;
  }
}

// ============================================
// ISLAND WRAPPER MOUNT (Tier 2)
// ============================================

/**
 * Initialize the Island Wrapper as the single Vue client root
 *
 * Architecture:
 * - SSR Shell renders #island-wrapper container
 * - We mount IslandWrapper (Tier 2) to this container
 * - IslandWrapper dynamically loads concept landings (Tier 3)
 * - Global components (NotificationPopup) persist across page changes
 */
function initializeIslandWrapper(): void {
  const container = document.getElementById('island-wrapper');

  if (!container) {
    console.warn('[Islands] Container #island-wrapper not found');
    return;
  }

  const appState = window.__APP_STATE__;
  if (!appState?.authorizedIslandIds?.length) {
    // E14 fix · Cycle 160 R3 · explicit hydration gate warning (was silent exit)
    console.warn(
      '[Islands] authorizedIslandIds absent — IslandWrapper NOT mounting · TaskBar events DEAD · Shell is SSR-only'
    );
    return;
  }

  // Determine initial island to load
  const initialIslandId = appState.initialIslandId ?? appState.authorizedIslandIds[0];

  console.log('[Islands] Mounting IslandWrapper (Tier 2)');
  console.log(`[Islands] Initial island: ${initialIslandId}`);

  // Create and mount the Island Wrapper
  const app = createApp(IslandWrapper, {
    initialIslandId,
  });

  app.mount(container);

  console.log('[Islands] IslandWrapper mounted - 3-Tier Architecture active');
}

// ============================================
// AUTO-INITIALIZE ON DOM READY
// ============================================

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIslandWrapper);
  } else {
    initializeIslandWrapper();
  }
}

export type { AppState };
