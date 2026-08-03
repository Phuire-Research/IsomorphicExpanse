/**
 * Vue SSR Principle - 3-Tier Shell Architecture (Tier 1)
 *
 * Server-side principle that renders the base SSR Shell.
 *
 * 3-Tier Architecture:
 * - Tier 1: Base SSR Shell (THIS - static HTML from server)
 * - Tier 2: Island Wrapper (single Vue client root, mounts to #island-wrapper)
 * - Tier 3: Concept Landings (dynamically loaded by IslandWrapper)
 *
 * Responsibilities:
 * 1. Render Shell to HTML via Vue SSR (sidebar, layout, #island-wrapper container)
 * 2. Wrap in document with window.__APP_STATE__ (includes initialIslandId)
 * 3. IslandWrapper mounts as single Vue client root
 * 4. IslandWrapper provides notification controller to Tier 3 landings
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: 3-Tier Application Architecture Discovery
 */

import * as express from 'express';
// C822 D2/D3 · the manifest routes' node imports + the SCP-side validator (the twin table).
import { execSync, exec } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { validateScpManifest } from '../../model/scpManifest.model';
import * as fs from 'fs';
import path from 'path';
import { createSSRApp, h, type Component } from 'vue';
import { renderToString } from '@vue/server-renderer';
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type { VueState } from './vue.model';
import type { ServerState } from '../server/server.concept';
import { notificationMuxonomic } from '../notification/notification.muxonomy';
import { scsBridgeMuxonomic } from '../scsBridge/scsBridge.muxonomy';
import { suite8Muxonomic } from '../suite8/suite8.muxonomy';
import { cadmiumMuxonomic } from '../cadmium/cadmium.muxonomy';
import { suiteCascadeMuxonomic } from '../suiteCascade/suiteCascade.muxonomy';
// GITM PAGE · the REGISTERED GitM page (nav-only · data rides the universal scsBridge base).
// Added AFTER the suiteCascadeMuxonomic import (the AIME-3 anchor) — anchor undisturbed.
import { gitmMuxonomic } from '../gitm/gitm.muxonomy';
// HIFI.3 · the Pewter Tessera page (nav-only · the Suite Color Selection surface). Mirrors
// gitmMuxonomic — a nav entry whose conceptName 'pewter' resolves to the IslandWrapper loader.
import { pewterMuxonomic } from '../pewter/pewter.muxonomy';
// GITM #639 · MOCH · /gitm-status endpoint dependencies (resolvers + shape)
// MD-A D2 · resolveScpLocalBridgeDir carries the /gitm-status read (the SCP's OWN rail);
// resolveBridgeRoot REMAINS for the workspace-territory reads (the update-diff/resolved
// staging artifacts + the Suite 8 RI SCS-root compute).
import { resolveBridgeRoot, resolveScpLocalBridgeDir } from '../scsBridge/bridgeRoot.model';
import type { GitmJsonShape } from '../gitm/gitm.type';
// SMSP · the Skill-Priming SORD wrapper for the /suite8-skill-prime endpoint (load Skill → 《SCS:Skill》).
import { buildSordSkillEnvelope } from '../../model/sordEnvelope.model';
// MD-CE-2 · THE FS AUTHORITY (the Code Editor's transfer half · STRATIMUX HOLDS · HTTP TRANSFERS IN).
import { registerEditorFsRoutes } from '../../model/editorFs.model';
// MD-4 · THE ENDPOINT READERS · the pure path-logic + traversal-guard idiom for the SCP-local
// Suite 8 document readers (Instance/Conductor/Maintainer/Skills/Strategies/Working-docs/asset).
import {
  resolveSuite8Dir,
  suite8DocPath,
  suite8SkillsDir,
  suite8StrategyDir,
  buildSkillsListing,
  matchSkill,
  buildStrategyListing,
  matchStrategy,
  filterWorkingDocs,
  suite8AssetsDir,
  resolveAssetCandidates,
  assetContentType,
  type Suite8DocKind,
  type WorkingDocEntry,
} from '../../model/suite8ReaderPaths.model';
// MD-3 · THE NAME-FIRST DEMOMETRIC MINT · the pure NDEP validation + barebones doc builders +
// the scaffold planner for POST /suite8/create (the fs-effecting write stays here · the logic
// is pure/testable in the model).
import {
  resolveMintDir,
  buildMintPlan,
} from '../../model/suite8CreateScaffold.model';
import {
  type MuxonomicConfig,
  type PageEntry,
  ChangeDetectionMode,
} from '../muxonomy/muxonomy.model';
// CLBF · Diamond BSE · the pre-bound Targeted Research Bulletin LIST/DETAIL registration produced by
// createLiveBulletin. Replaces the prior manual registerBulletinEndpoints call + local path build —
// the factory owns the jsonPath + parser + routes (single-source · server-side ONLY · never client).
import { registerResearchBulletinEndpoints } from '../cadmium/cadmiumResearchBulletinRelay.config';
// CLBF · Topic Live Bulletin · the pre-bound Topic Bulletin LIST/DETAIL registration produced by
// createLiveBulletin (folder-tree instance). Reads the materialised frontier/topicBulletin.json
// aggregate (Option A · single-source · server-side ONLY · never client).
import { registerTopicBulletinEndpoints } from '../cadmium/cadmiumTopicBulletinRelay.config';
// TOCH · Topics-On-Connect-Hydration · the pre-bound /cadmium-topics LIST endpoint (BSOH for the
// topics registry · reads topics.json via parseCadmiumTopics · server-side ONLY · never client).
import { registerTopicsEndpoint } from '../cadmium/cadmiumTopicsRelay.config';

// ============================================
// REGISTERED MUXONOMICS (Build-Time Registry)
// ============================================

const DEFAULT_LANDING_MUXONOMIC: MuxonomicConfig<'default'> = {
  conceptName: 'default',
  filterKeys: [],
  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },
  sync: {
    direction: 'toClient',
    filterKeys: [],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },
  demometers: {
    qualities: [],
    strategies: [],
    principles: [],
  },
  decks: {
    huirth: '',
    client: '',
  },
  navigation: {
    isMainLanding: true,
    icon: '🏠',
    color: 'cobalt',
    label: 'Home',
    order: 0,
    pages: [
      { path: '/', label: 'Home', order: 0, componentPath: 'vue/vue/DefaultLanding', isMain: true },
    ],
  },
};

import { graphiteScribeMuxonomic } from '../graphiteScribe/graphiteScribe.muxonomy';
const REGISTERED_MUXONOMICS: MuxonomicConfig[] = [
  DEFAULT_LANDING_MUXONOMIC,
  notificationMuxonomic,
  scsBridgeMuxonomic,
  // C833 · THE DSRE GATE FALLS — the Suite 8 roster page registers UNCONDITIONALLY. The prior
  // DSRE law ("an installed copy must not see the template roster") is stale: the roster reads
  // the SCP's OWN Cascades/8_SUITES (the Suite 8 Card System — hero · skills · strategies · the
  // C833 Description authoring surface), never template content; and the manifest output's
  // Edit → /?island=suite8&s8=<name> travel needs the page present on EVERY SCP.
  suite8Muxonomic,
  cadmiumMuxonomic,
  suiteCascadeMuxonomic,
  graphiteScribeMuxonomic,
  // GITM PAGE · REGISTERED page entry · inserted AFTER the suiteCascadeMuxonomic AIME-3
  // anchor (anchor line above undisturbed). Nav order 5 (after Suite Cascade's order 4).
  gitmMuxonomic,
  // HIFI.3 · the Pewter Tessera page · nav-only entry (order 6 · tail). conceptName 'pewter'
  // → getAuthorizedIslandIds() → IslandWrapper islandRegistry['pewter'] → PewterLanding.vue.
  pewterMuxonomic,
];

// ============================================
// VITE MANIFEST - Asset Resolution
// ============================================

type ViteManifest = Record<
  string,
  {
    file: string;
    isEntry?: boolean;
    css?: string[];
  }
>;

let cachedAssets: { js: string; css: string[] } | null = null;

function loadViteManifest(clientDistPath: string): { js: string; css: string[] } {
  if (cachedAssets) return cachedAssets;

  const manifestPath = path.join(clientDistPath, '.vite', 'manifest.json');

  try {
    const manifest: ViteManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const entryKey = Object.keys(manifest).find(
      (k) => manifest[k].isEntry || k.endsWith('main.ts'),
    );

    if (!entryKey) {
      console.warn('[Vue SSR] No entry in manifest, using fallback');
      return { js: '/islands/main.js', css: [] };
    }

    const entry = manifest[entryKey];
    cachedAssets = {
      js: '/' + entry.file,
      css: (entry.css || []).map((c) => '/' + c),
    };

    console.log(`[Vue SSR] Manifest loaded - JS: ${cachedAssets.js}`);
    return cachedAssets;
  } catch {
    console.warn('[Vue SSR] Manifest not found. Run: npm run build:client');
    return { js: '/islands/main.js', css: [] };
  }
}

// ============================================
// NAVIGATION HELPERS
// ============================================

type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
  isActive: boolean;
  // MD-8 D-NM-1 · marks the synthetic trailing "Create S8" entry so Shell.vue renders the
  // small dotted-border variant (Pewter · distinct from the real muxonomic pages · sits last).
  variant?: string;
};

// MD-8 D-NM-1 · resolve the honest Suite-8 landing path from the registered muxonomics at
// runtime (graceful no-JS degrade — the link navigates to the real roster; NEVER '#'). The
// synthetic entry's actual open behavior is the delegated overlay (IslandWrapper); this href is
// the fallback destination when JS is absent. Falls back to '/suite8' only if the suite8
// muxonomic is somehow deregistered.
function resolveSuite8LandingPath(): string {
  const suite8 = REGISTERED_MUXONOMICS.find((m) => m.conceptName === 'suite8');
  const mainPage = suite8?.navigation?.pages.find((p) => p.isMain);
  return mainPage?.path ?? '/suite8';
}

function getNavItems(currentPath: string, activeIslandId?: string | null): NavItem[] {
  const items: NavItem[] = [];

  for (const muxonomic of REGISTERED_MUXONOMICS) {
    if (!muxonomic.navigation) continue;
    if (muxonomic.navigation.enabled === false) continue;

    const nav = muxonomic.navigation;
    const mainPage = nav.pages.find((p) => p.isMain);
    const landingPath = mainPage?.path ?? `/${muxonomic.conceptName}`;

    // Check if current path matches any of this muxonomic's pages
    // C826 · THE ISLAND OVERRIDE: deep-link navigations ride `?island=<conceptName>` on the
    // same path — when present, the island IS the active page (the path match misleads).
    // Cures the stale Rotary-Nav highlight for BOTH the sub-page link travel and the
    // scp_focus_suite8_page agent tool (every full-reload navigation renders through here).
    const isActive = activeIslandId
      ? muxonomic.conceptName === activeIslandId
      : nav.pages.some((page) => page.path === currentPath) ||
        (nav.isMainLanding && currentPath === '/');

    items.push({
      id: muxonomic.conceptName,
      label: nav.label,
      icon: nav.icon,
      path: landingPath,
      isActive,
    });
  }

  const sorted = items.sort((a, b) => {
    const orderA =
      REGISTERED_MUXONOMICS.find((m) => m.conceptName === a.id)?.navigation?.order ?? 0;
    const orderB =
      REGISTERED_MUXONOMICS.find((m) => m.conceptName === b.id)?.navigation?.order ?? 0;
    return orderA - orderB;
  });

  // THE REGISTRATION TRUTH — a minted Suite 8 joins the sidebar nav ONLY through the compiled page
  // duplication: `scs suite8:page` copies the concept, registers it in REGISTERED_MUXONOMICS, and
  // rebuilds (the Entourage Forge Vermillion carries that command on Band B). A page-less mint dir
  // under Cascades/8_SUITES/ does NOT list here — its pre-page home is the roster at /suite8. The
  // prior dynamic-append + muxonomy.json gate listed page-less dirs, violating the rule; reversed.

  // MD-8 D-NM-1 · THE TRAILING DOTTED ENTRY — one synthetic NavItem appended AFTER the sort so it
  // always sits LAST. id `suite8-mint` (IslandWrapper's delegated click matches this via
  // data-concept) · a plus glyph consistent with the emoji/text icon field · href = the honest
  // Suite-8 landing path (graceful no-JS degrade) · variant 'create' triggers the dotted treatment.
  sorted.push({
    id: 'suite8-mint',
    // MD-9 · D-MC-4 · Create S8 correction. An SCP = Suite Cascade Protocol (SCS + S8s cascading
    // into a greater application); minting an addition creates a Suite 8, so the entry reads
    // "Create S8". Nav id `suite8-mint` + the delegated open behavior stay unchanged.
    label: 'Create S8',
    icon: '➕',
    path: resolveSuite8LandingPath(),
    isActive: false,
    variant: 'create',
  });

  return sorted;
}

function getLandingIsland(): { conceptName: string; page: PageEntry } | null {
  for (const muxonomic of REGISTERED_MUXONOMICS) {
    if (muxonomic.navigation?.isMainLanding && muxonomic.navigation.enabled !== false) {
      const mainPage = muxonomic.navigation.pages.find((p) => p.isMain);
      if (mainPage) return { conceptName: muxonomic.conceptName, page: mainPage };
    }
  }
  return null;
}

function getAuthorizedIslandIds(): string[] {
  return REGISTERED_MUXONOMICS.filter((m) => m.navigation && m.navigation.enabled !== false).map(
    (m) => m.conceptName,
  );
}

/**
 * Get island for a specific request path
 *
 * Matches request path to registered muxonomic pages.
 * Falls back to main landing if no match found.
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 */
function getIslandForPath(requestPath: string): { conceptName: string; page: PageEntry } | null {
  // First, check for exact path match in all registered muxonomics
  for (const muxonomic of REGISTERED_MUXONOMICS) {
    if (!muxonomic.navigation) continue;
    if (muxonomic.navigation.enabled === false) continue;

    for (const page of muxonomic.navigation.pages) {
      if (page.path === requestPath) {
        return { conceptName: muxonomic.conceptName, page };
      }
    }
  }

  // No exact match - fall back to main landing for root path
  if (requestPath === '/') {
    return getLandingIsland();
  }

  // For unmatched paths, still return main landing (SPA-style fallback)
  return getLandingIsland();
}

// ============================================
// SHELL COMPONENT — Canonical Shell.vue via Vite SSR Build
// ============================================
//
// Loads the compiled Shell.vue bundle from `dist/server/entry-server.js`.
// The bundle is produced by `npm run build:server` (vite.ssr.config.ts).
// If the bundle is missing, falls back to the inline legacy renderer below
// so the bridge boot path never hard-fails — but logs loudly.
//
// Citation: TASKBAR-ORPHAN-FIX-WAVE1-R2-RUST-PROSPECTING.md §SCP_ORIGIN entry-server pattern
// Citation: TASKBAR-ORPHAN-FIX-WAVE1-R4-VIRIDIAN-AUDIT.md §HAZARD-B / HAZARD-E

type RenderShellToHtmlFn = (props: {
  title: string;
  islandId: string;
  navItems: NavItem[];
}) => Promise<string>;

let cachedRenderShellToHtml: RenderShellToHtmlFn | null = null;
let ssrBundleLoadAttempted = false;

function resolveServerBundle(): RenderShellToHtmlFn | null {
  if (cachedRenderShellToHtml) return cachedRenderShellToHtml;
  if (ssrBundleLoadAttempted) return null;
  ssrBundleLoadAttempted = true;

  // ts-node:  __dirname = src/concepts/vue/ → ../../../dist/server/entry-server.js
  // compiled: __dirname = dist/concepts/vue/ → ../../server/entry-server.js
  const isRunningFromSource = __dirname.includes('/src/');
  const bundlePath = isRunningFromSource
    ? path.resolve(__dirname, '../../../dist/server/entry-server.js')
    : path.resolve(__dirname, '../../server/entry-server.js');

  if (!fs.existsSync(bundlePath)) {
    console.warn(
      `[Vue SSR] Shell bundle not found at ${bundlePath}. Run: npm run build:server. ` +
        `Falling back to legacy inline shell.`,
    );
    return null;
  }

  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const mod = require(bundlePath) as { renderShellToHtml?: RenderShellToHtmlFn };
    if (typeof mod.renderShellToHtml !== 'function') {
      console.warn(
        `[Vue SSR] Bundle at ${bundlePath} did not export renderShellToHtml. Falling back.`,
      );
      return null;
    }
    cachedRenderShellToHtml = mod.renderShellToHtml;
    console.log(`[Vue SSR] Canonical Shell.vue bundle loaded from ${bundlePath}`);
    return cachedRenderShellToHtml;
  } catch (error) {
    console.warn(`[Vue SSR] Failed to load Shell bundle at ${bundlePath}:`, error);
    return null;
  }
}

// ============================================
// LEGACY INLINE FALLBACK (kept for rollback safety until smoke test confirms)
// ============================================

function createShellComponentLegacy(props: {
  title: string;
  islandId: string;
  navItems: NavItem[];
}): Component {
  const { title, navItems } = props;

  return {
    name: 'ShellLegacyFallback',
    render() {
      return h('div', { class: 'shell' }, [
        h('aside', { class: 'sidebar' }, [
          h('div', { class: 'sidebar-header' }, [
            h(
              'a',
              {
                href: '/',
                class: 'sidebar-brand-link',
                style: 'text-decoration: none;',
                'aria-label': 'Suite Cascade System · Home',
              },
              [
                h('img', {
                  class: 'sidebar-logo',
                  src: '/scs-logo.png',
                  alt: 'Suite Cascade System',
                }),
                h('img', { class: 'sidebar-badge', src: '/scs-badge.png', alt: 'SCS' }),
              ],
            ),
          ]),
          h(
            'nav',
            { class: 'sidebar-nav' },
            navItems.map((item) =>
              h(
                'a',
                {
                  key: item.id,
                  href: item.path,
                  class: [
                    'nav-item',
                    item.isActive ? 'active' : '',
                    // MD-8 D-NM-1 · the dotted small "Create S8" variant treatment.
                    item.variant === 'create' ? 'nav-item-create' : '',
                  ],
                  'data-concept': item.id,
                },
                [
                  h('span', { class: 'nav-icon' }, item.icon),
                  h('span', { class: 'nav-label' }, item.label),
                ],
              ),
            ),
          ),
        ]),
        h('main', { class: 'main' }, [
          h('div', { id: 'island-wrapper', class: 'island-container' }, [
            h('div', { class: 'island-loading' }, [
              h('div', { class: 'loading-spinner' }),
              h('h2', null, title),
              h('p', null, 'Initializing...'),
            ]),
          ]),
        ]),
      ]);
    },
  };
}

// ============================================
// RENDER SHELL TO HTML
// ============================================

async function renderShell(props: {
  title: string;
  islandId: string;
  navItems: NavItem[];
}): Promise<string> {
  const canonical = resolveServerBundle();
  if (canonical) {
    return await canonical(props);
  }
  const component = createShellComponentLegacy(props);
  const app = createSSRApp(component);
  return await renderToString(app);
}

// ============================================
// DOCUMENT WRAPPER
// ============================================

function wrapInDocument(options: {
  shellHtml: string;
  title: string;
  authorizedIslandIds: string[];
  initialIslandId: string;
  // D-RB · THE NAVBAR ROTARY BARREL — the SAME NavItem[] the SSR Shell renders (Create-last
  // order preserved) is threaded into __APP_STATE__ so the client barrel island reads it and
  // reproduces the exact row markup (data-concept + nav-icon/nav-label) the delegated
  // mint/collapse listeners already target. The SSR column remains the no-JS fallback.
  navItems: NavItem[];
  assets: { js: string; css: string[] };
}): string {
  const { shellHtml, title, authorizedIslandIds, initialIslandId, navItems, assets } = options;

  const cssLinks = assets.css
    .map((href) => `<link rel="stylesheet" crossorigin href="${href}">`)
    .join('\n    ');

  // C927 · THE SCP'S OWN NAME rides __APP_STATE__ (sync-available at first paint) so the
  // localStorage override keys scope PER SCP — user styling never leaks across citizens
  // sharing a localhost origin (port reuse). Source: scp.config.json (the FKIS stamp).
  let ownScpName = 'scp';
  try {
    const ownCfg = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'scp.config.json'), 'utf-8'),
    ) as { scpName?: string };
    if (typeof ownCfg.scpName === 'string' && ownCfg.scpName.length > 0) ownScpName = ownCfg.scpName;
  } catch {
    /* absent/malformed → the neutral 'scp' scope (never breaks the shell) */
  }

  const appState = {
    scpName: ownScpName,
    authorizedIslandIds,
    initialIslandId,
    // D-RB · barrel ring source — mirrors initialIslandId's flow into __APP_STATE__.
    navItems,
    initialRoute: '/',
    serverTime: Date.now(),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" integrity="sha512-2SwdPD6INVrV/lHTZbO2nodKhrnDdJK9/kg2XD1r9uGqPo1cUbujc+IYdlYdEErWNu69gVcYgdxlmVmzTWnetw==" crossorigin="anonymous" referrerpolicy="no-referrer">
  ${cssLinks}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #0d0d0f;
      color: #f0f0f0;
      min-height: 100vh;
    }
    .top-spectrum-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 2px;
      z-index: 1000;
      display: flex;
      opacity: 0.85;
      /* D-WRAP P1 · hex -> var(--color-*, hex) so a user re-tint cascades through the TOP
         Suite Cascade Bar (was static SSR-baked hex). The hex fallbacks keep the bar painted
         before style.css loads — this <style> renders in the SSR <head> ahead of the client
         vars (Sibling-Var-No-Fallback lesson). Defaults byte-identical to the rainbow hex. */
      background: linear-gradient(90deg,
        var(--color-red, #ef4444) 0%, var(--color-red, #ef4444) 14.28%,
        var(--color-orange, #f97316) 14.28%, var(--color-orange, #f97316) 28.57%,
        var(--color-yellow, #eab308) 28.57%, var(--color-yellow, #eab308) 42.85%,
        var(--color-green, #22c55e) 42.85%, var(--color-green, #22c55e) 57.14%,
        var(--color-blue, #3b82f6) 57.14%, var(--color-blue, #3b82f6) 71.42%,
        var(--color-purple, #a855f7) 71.42%, var(--color-purple, #a855f7) 85.71%,
        var(--color-fuchsia, #ec4899) 85.71%, var(--color-fuchsia, #ec4899) 100%);
    }
    .shell { display: flex; min-height: 100vh; padding-top: 2px; }
    .sidebar {
      /* BO-5 (C454) · the live collapse: the legacy inline stylesheet IS the served CSS
         (Shell.vue's scoped styles never ship via SSR) — the width consumes the var the
         client toggle sets inline on .shell. */
      width: var(--sidebar-width, 240px);
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      background-image:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='15' cy='25' r='1' fill='white' opacity='0.15'/%3E%3Ccircle cx='45' cy='15' r='1.5' fill='white' opacity='0.2'/%3E%3Ccircle cx='75' cy='35' r='1' fill='white' opacity='0.15'/%3E%3Ccircle cx='25' cy='65' r='2' fill='white' opacity='0.1'/%3E%3Ccircle cx='55' cy='55' r='1' fill='white' opacity='0.25'/%3E%3Ccircle cx='85' cy='75' r='1.5' fill='white' opacity='0.15'/%3E%3Ccircle cx='35' cy='85' r='1' fill='white' opacity='0.2'/%3E%3Ccircle cx='65' cy='90' r='1.5' fill='white' opacity='0.3'/%3E%3Ccircle cx='95' cy='45' r='1' fill='white' opacity='0.15'/%3E%3Ccircle cx='10' cy='50' r='1' fill='white' opacity='0.2'/%3E%3C/svg%3E"),
        radial-gradient(ellipse at 87.5% 12.5%, rgb(42, 42, 42) 0%, rgb(4, 4, 4) 88%);
      background-size: 30px 30px, 100% 100%;
      background-repeat: repeat, no-repeat;
      border-top: 2px solid rgb(22, 22, 22);
      border-right: 2px solid rgb(22, 22, 22);
      border-bottom: 2px solid rgb(30, 30, 30);
      border-left: 2px solid rgb(30, 30, 30);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 2px;
      bottom: 0;
      left: 0;
      z-index: 100;
    }
    .shell.sidebar-collapsed .sidebar-logo,
    .shell.sidebar-collapsed .nav-label { display: none; }
    .shell.sidebar-collapsed .sidebar-badge { display: block; }
    .shell.sidebar-collapsed .nav-item { justify-content: center; }
    .main { min-width: 0; }

    .sidebar-header {
      padding: 1.25rem 1rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .sidebar-header .sidebar-collapse-btn {
      width: 100%;
      height: 24px;
      min-width: 0;
      min-height: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      font-size: 0.6rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      line-height: 1;
      border-radius: 4px;
      opacity: 0.55;
      transition: opacity 0.2s ease;
    }
    .sidebar-header .sidebar-collapse-btn:hover {
      opacity: 1;
    }
    .shell.sidebar-collapsed .collapse-label,
    .shell.sidebar-collapsed .sidebar-collapse-btn i:last-child { display: none; }
    .shell.sidebar-collapsed .sidebar-header .sidebar-collapse-btn { gap: 0; opacity: 0.8; }
    .sidebar-brand-link {
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
    }
    .sidebar-badge {
      display: none;
      width: 44px;
      height: 44px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }
    .sidebar-nav { flex: 1; padding: 1rem 0; overflow-y: auto; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: #a0a0a8;
      text-decoration: none;
      transition: all 0.2s ease;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.875rem;
    }
    .nav-item:hover {
      background: rgba(59, 130, 246, 0.08);
      color: #f0f0f0;
    }
    .nav-item.active {
      background: rgba(59, 130, 246, 0.12);
      color: #f0f0f0;
      border-left: 3px solid #3b82f6;
      padding-left: calc(1.5rem - 3px);
      text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
    }
    .nav-icon { font-size: 1.15rem; width: 1.5rem; text-align: center; }
    .nav-label { font-size: 0.875rem; letter-spacing: 0.02em; }
    /* D-RB · THE NAVBAR ROTARY BARREL — the client barrel island (SidebarBarrel.vue) takes over
       the SSR-static .sidebar-nav on hydration. barrel-active flips the container into an
       always-scrollable ring surface (scrollbar hidden so the endless rotation reads as a barrel,
       NOT a scrollbar drag); position relative roots the absolutely-positioned marquee hairlines.
       The barrel reproduces the exact .nav-item row markup so the served rules above still paint it. */
    .sidebar-nav.barrel-active { overflow-y: auto; scrollbar-width: none; position: relative; overflow-anchor: none; }
    .sidebar-nav.barrel-active::-webkit-scrollbar { display: none; }
    /* The two IntersectionObserver marquee hairlines — parked at scrollHeight/2 -+ ROW_HEIGHT/2
       (inline top set by the island). Zero visual footprint: they are pure boundary sensors, so
       visibility hidden keeps them observable without painting a line across the rail. */
    .barrel-marquee { position: absolute; left: 0; right: 0; height: 1px; pointer-events: none; visibility: hidden; }
    /* D-RB · THE RING SEAM — the thin dashed rule marking the Create-S8 row's ring boundary when it
       renders mid-window (the wrap point between last real page and first). Reuses the Pewter dotted
       idiom of .nav-item-create so the seam and the Create affordance read as one visual family. */
    .barrel-seam { border-top: 1px dashed rgba(154, 160, 168, 0.4); margin-top: 0.35rem; padding-top: 0.35rem; }
    /* D-RB · when the barrel mounts it hides the static SSR anchor rows (kept in the DOM as the
       no-JS fallback source — NEVER innerHTML-wiped). The island rows render via the Teleport. */
    .sidebar-nav.barrel-active .barrel-static-hidden { display: none; }
    .main {
      flex: 1;
      /* C468 · the UNIVERSAL SIZING FIX — the margin FOLLOWS the live rail width (the fixed
         240px literal left a dead gap on collapse; IslandWrapper sets the var inline). */
      margin-left: var(--sidebar-width, 240px);
      min-height: 100vh;
      transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .island-container { min-height: 100vh; }
    .island-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #a0a0a8;
    }
    .island-loading h2 {
      font-family: 'Orbitron', system-ui, sans-serif;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: #f0f0f0;
      margin-bottom: 1rem;
      text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
    }
    .loading-spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(59, 130, 246, 0.18);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .sidebar { width: 60px; }
      .sidebar-logo, .nav-label { display: none; }
      .sidebar-badge { display: block; }
      .sidebar-header { padding: 0.75rem 0.5rem; }
      .nav-item { justify-content: center; padding: 1rem; }
      .main { margin-left: 60px; }
    }
  </style>
</head>
<body>
  <div class="top-spectrum-bar" aria-hidden="true"></div>
  ${shellHtml}
  <script>window.__APP_STATE__ = ${JSON.stringify(appState)};</script>
  <script type="module" crossorigin src="${assets.js}"></script>
</body>
</html>`;
}

// ============================================
// PRINCIPLE
// ============================================

type VuePrincipleState = VueState & ServerState;

export type VueSSRPrincipleType = PrincipleFunction<VueState, MuxiumDeck, VuePrincipleState>;

export const vueSSRPrinciple: VueSSRPrincipleType = ({ concepts_, k_ }) => {
  const serverState = k_.getState(concepts_) as VuePrincipleState;
  const expressApp = serverState.server as express.Application;
  const servers = serverState.servers;

  if (!expressApp) {
    console.error('[Vue SSR] No Express server found');
    return;
  }

  // Resolve client dist path - works in both ts-node and compiled modes
  // ts-node: __dirname = server/src/concepts/vue/ → need to go to server/dist/client/
  // compiled: __dirname = server/dist/ → client assets at server/dist/client/
  const isRunningFromSource = __dirname.includes('/src/');
  const clientDistPath = isRunningFromSource
    ? path.resolve(__dirname, '../../../dist/client') // From src/concepts/vue/ → server/dist/client/
    : path.join(__dirname, 'client'); // From dist/ to dist/client/
  const assets = loadViteManifest(clientDistPath);
  console.log(
    `[Vue SSR] Client dist path: ${clientDistPath} (source mode: ${isRunningFromSource})`,
  );

  // Resolve public/ path · same source/compiled split as clientDistPath
  // ts-node: __dirname = src/concepts/vue/ → server/public/
  // compiled: __dirname = dist/ → server/public/
  const publicPath = isRunningFromSource
    ? path.resolve(__dirname, '../../../public')
    : path.join(__dirname, '../public');
  console.log(`[Vue SSR] Public path: ${publicPath}`);

  // Serve static assets · public/ first (raw assets like favicons/logos) then dist/client/ (Vite-built bundles + manifest-copied public)
  expressApp.use(express.static(publicPath, { index: false }));
  expressApp.use(express.static(clientDistPath, { index: false }));

  // ============================================
  // C4-D1 · WNPM/IAAF — /cadmium-assets image route (PATH-TRAVERSAL HARDENED)
  // ============================================
  //
  // Serves images the Cadmium Researcher instance writes to
  // Cascades/Extended/Cadmium Researcher/assets/ (the IAAF accumulation folder · the converged RI
  // dir · SCSNM · supersedes the old Cascades/Cadmium/assets/), resolved relative to the SCP
  // working directory (process.cwd() — the same basis the cadmiumOkMonitor uses for the Cadmium
  // folder watcher). The CadmiumBulletin rewrites `../assets/<file>` Markdown refs to
  // `/cadmium-assets/<file>` before render.
  //
  // SECURITY (BIGGEST RISK · Ochre §5/§8): req.params.filename is user-controlled. The guard:
  //   1. path.resolve the requested name against the assets base.
  //   2. Reject unless the resolved path is STRICTLY INSIDE base — `resolved !== base` AND
  //      `resolved.startsWith(base + path.sep)`. The `base + path.sep` suffix is mandatory: a
  //      filename whose resolution equals the base prefix (e.g. a sibling `assetsX/`) must NOT
  //      pass. `..` traversal resolves outside base → fails the prefix check → 403.
  //   3. Image-extension allowlist (png/jpg/jpeg/gif/svg/webp) — only images leave this route.
  const cadmiumAssetsBase = path.resolve(process.cwd(), 'Cascades', 'Extended', 'Cadmium Researcher', 'assets');
  expressApp.get('/cadmium-assets/:filename', (req, res) => {
    const filename = req.params.filename;
    const resolved = path.resolve(cadmiumAssetsBase, filename);
    if (resolved !== cadmiumAssetsBase && !resolved.startsWith(cadmiumAssetsBase + path.sep)) {
      res.status(403).end();
      return;
    }
    if (!/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(filename)) {
      res.status(403).end();
      return;
    }
    res.sendFile(resolved);
  });

  // ============================================
  // Macro SM · Issue 1a · MOCH — /cadmium-menu ODCF endpoint (menu-stage on-demand hydration)
  // ============================================
  //
  // Returns the current agent-authored menu stage from
  // Cascades/Extended/Cadmium Researcher/menu.json — the SAME file the cadmiumOkMonitor IAJW
  // watcher broadcasts. The webSocketServer does NOT replay state on (re)connect, so the IAJW
  // relay's one-time broadcast is missed by any client that loads/reloads AFTER it (HMR, or the
  // page-loads-then-anchor-writes ordering) → the menu renders the empty "Waiting…" placeholder
  // forever. Mirror the AV ODCF doctrine (the two-channel split applies to the menu too): the
  // CadmiumLanding onMounted hydration GETs this route to seed menuStage, then the IAJW relay
  // keeps it live for subsequent stage increments. Resolution MIRRORS the watcher
  // (SCS_BRIDGE_ROOT_OVERRIDE ?? cwd) so it reads the EXACT file the watcher watches (dev:self →
  // SCS root; production → install cwd). AFPR: absent/unreadable/malformed → 200 empty stage
  // (stageIndex -1). READ-ONLY · no params · no path-traversal surface.
  // C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL now (the BO-2-E walk-up read the
  // WORKSPACE root; Extended no longer lives there). cwd = the SCP package dir is the base.
  const cadmiumMenuJsonPath = path.resolve(
    process.cwd(), 'Cascades', 'Extended', 'Cadmium Researcher', 'menu.json',
  );
  // C660 · THE EXTENDED TWO-ROOTS FALLBACK (the persisted-default law): the C465 relocation
  // made Extended SCP-LOCAL, but the ANCHOR AGENT'S cwd is the WORKSPACE root — its menu.json
  // writes land at {workspace}/Cascades/Extended/… . Until the agent-side root law lands
  // (DF3/DF4 knowledge), the default read WALKS UP from the SCP package looking for the
  // workspace copy when the SCP-local file is absent — the persisted menu renders either way.
  const cadmiumMenuFallbackPaths = (() => {
    const out: string[] = [];
    let dir = process.cwd();
    for (let i = 0; i < 6; i += 1) {
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
      out.push(path.resolve(dir, 'Cascades', 'Extended', 'Cadmium Researcher', 'menu.json'));
    }
    return out;
  })();
  const EMPTY_CADMIUM_MENU_STAGE = { stageIndex: -1, title: '', prompt: '', options: [] };
  expressApp.get('/cadmium-menu', (_req, res) => {
    for (const candidate of [cadmiumMenuJsonPath, ...cadmiumMenuFallbackPaths]) {
      try {
        const raw = fs.readFileSync(candidate, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.stageIndex === 'number' && Array.isArray(parsed.options)) {
          res.json(parsed);
          return;
        }
      } catch {
        /* absent anor malformed → the next candidate (the two-roots walk-up) */
      }
    }
    res.json(EMPTY_CADMIUM_MENU_STAGE);
  });

  // ============================================
  // IE-D4 · THE D-O PAGE SURFACE — Extended RI document read/write (Create-S8 Dynamic Linkage)
  // ============================================
  //
  // The generic Suite8CascadeDocs two-pane home surface reads the ACTIVE plan/trajectory pair from
  // the LIVE cascade state (the extended auto-registration relay). These two routes serve the
  // surface's two SIDE affordances:
  //   - /suite8-doc-tiers/:designation  (GET)  — enumerate PRIOR-tier filenames WITHOUT loading
  //     their content (falling-out-of-scope law as UI · the tier menu).
  //   - /suite8-doc-save               (POST) — write authority split by nature: ONLY a DIAMOND-*.md
  //     file (the plan · Ego · prunable · page-editable) may be written. An ONYX-*.md (the trajectory
  //     · Lambda · sacred · session-written) is REJECTED (403).
  //
  // Both resolve the SCP-LOCAL Cascades/Extended/<designation>/ folder via a two-roots walk-up +
  // traversal guard (self-encapsulated). The designation is a single directory NAME — separators /
  // traversal are rejected outright.

  // Resolve the FIRST existing Cascades/Extended/<designation>/ dir across the two-roots walk-up.
  // Returns { extendedBase, dir } for whichever root holds the folder, or null (absent everywhere).
  const resolveExtendedDesignationDir = (
    designation: string,
  ): { extendedBase: string; dir: string } | null => {
    if (
      !designation ||
      designation.includes('/') ||
      designation.includes('\\') ||
      designation.includes('..')
    ) {
      return null;
    }
    const roots: string[] = [process.cwd()];
    let walk = process.cwd();
    for (let i = 0; i < 6; i += 1) {
      const parent = path.dirname(walk);
      if (parent === walk) break;
      walk = parent;
      roots.push(walk);
    }
    for (const root of roots) {
      const extendedBase = path.resolve(root, 'Cascades', 'Extended');
      const dir = path.resolve(extendedBase, designation);
      // Traversal guard — the resolved dir must stay inside the Extended base on this root.
      if (dir !== extendedBase && !dir.startsWith(extendedBase + path.sep)) continue;
      try {
        if (fs.statSync(dir).isDirectory()) return { extendedBase, dir };
      } catch {
        /* absent on this root → the next root */
      }
    }
    return null;
  };

  // GET — enumerate prior-tier document filenames (DIAMOND-TIER-*.md / ONYX-TIER-*.md) WITHOUT
  // loading their content. The ACTIVE pair (the highest tier of each) is served by the live cascade
  // state; "prior" = every OTHER tier document present in the folder. READ-ONLY · absent → 200 [].
  expressApp.get('/suite8-doc-tiers/:designation', (req, res) => {
    const resolved = resolveExtendedDesignationDir(req.params.designation);
    if (!resolved) {
      res.json({ priorTiers: [] });
      return;
    }
    try {
      const docs = fs
        .readdirSync(resolved.dir)
        .filter((f) => /^(DIAMOND|ONYX)-TIER-\d+\.md$/i.test(f))
        .sort();
      // The ACTIVE pair = the highest-numbered DIAMOND + ONYX (what the panes render live).
      // Everything else is a PRIOR tier — enumerate names only (never read their bodies).
      const tierNum = (f: string): number => {
        const m = f.match(/-TIER-(\d+)\./i);
        return m ? Number(m[1]) : -1;
      };
      const highest = (prefix: RegExp): string | null => {
        const of = docs.filter((f) => prefix.test(f));
        if (of.length === 0) return null;
        return of.reduce((a, b) => (tierNum(a) >= tierNum(b) ? a : b));
      };
      const activeDiamond = highest(/^DIAMOND/i);
      const activeOnyx = highest(/^ONYX/i);
      const priorTiers = docs.filter((f) => f !== activeDiamond && f !== activeOnyx);
      res.json({ priorTiers });
    } catch {
      res.json({ priorTiers: [] });
    }
  });

  // GET — THE ON-BOOT SELF-QUERY (the Shatterite Menu RD · the MOCH hydrate-every-load law).
  // The CascadeDocs pane's WS legs (relay · reconnect-gated SCRR · backfill) all RACE a cold-boot
  // mount; this route is the timing-immune floor: read Cascade.json + the manifest's active files
  // straight from disk on EVERY load. Same two-roots resolveExtendedDesignationDir idiom as the
  // doc routes; the manifest's filePaths resolve OWN-ROOT-FIRST (a Working/-relative path lands
  // inside Extended/<designation>/), falling back to the SCP cwd (the repo-relative case).
  // NEVER throws: absent designation → 404 honest; an unreadable manifest file → skipped.
  expressApp.get('/suite8-cascade/:designation', (req, res) => {
    const resolved = resolveExtendedDesignationDir(req.params.designation);
    if (!resolved) {
      res.status(404).json({ ok: false, error: 'designation cascade not found' });
      return;
    }
    let cascadeJson: Record<string, unknown> | null = null;
    try {
      cascadeJson = JSON.parse(
        fs.readFileSync(path.resolve(resolved.dir, 'Cascade.json'), 'utf-8'),
      ) as Record<string, unknown>;
    } catch {
      /* absent anor malformed manifest → null (the empty floor is honest) */
    }
    // The manifest keys mirror GENERAL_CASCADE_FILE_MANIFEST_KEYS (ACFR Load Rule · same order →
    // same first-match pane split) — inlined to keep the route self-encapsulated like its siblings.
    const manifestKeys = ['activeDiamond', 'activeOnyx', 'priorDiamond', 'priorOnyx', 'masterDiamond'];
    const activeCascadeFiles: { filePath: string; content: string }[] = [];
    const seen = new Set<string>();
    if (cascadeJson) {
      for (const key of manifestKeys) {
        const value = cascadeJson[key];
        if (typeof value !== 'string' || value.length === 0 || seen.has(value)) continue;
        seen.add(value);
        // OWN-ROOT-FIRST (the watcher's C712/IE-D4e resolution): a founded dir's Working/-relative
        // anor bare-basename path lives beside the manifest; fall back to the cwd-relative
        // (repo-relative) interpretation when the dir-local file is absent.
        for (const candidate of [path.resolve(resolved.dir, value), path.resolve(process.cwd(), value)]) {
          try {
            activeCascadeFiles.push({ filePath: value, content: fs.readFileSync(candidate, 'utf-8') });
            break;
          } catch {
            /* absent on this interpretation → the next (anor skip · never throw) */
          }
        }
      }
    }
    res.json({ name: req.params.designation, cascadeJson, activeCascadeFiles });
  });

  // GET — THE MENU FLOOR (1A-prime · the ODCF doctrine lifted from CadmiumLanding into the
  // generic circuit). The ShatteriteMenu component self-queries THIS route on mount for its
  // designation's menu.json — the timing-immune display-on-viewing floor beneath the STCP
  // stream (which races cold mounts, is BOCR-starved, and pre-hash identity-suppressed
  // in-place edits — the C756 diagnosis). Same two-roots resolveExtendedDesignationDir idiom
  // as its siblings. NEVER throws: absent designation anor menu.json anor malformed → 404
  // honest (the component keeps its default standing stage).
  // C766 · STAGED: the floor serves the NORMALIZED MenuDocument (legacy single-stage files
  // auto-wrap as stages[0]) — the whole workflow + position hydrate in one GET.
  const validateMenuStageShape = (o: unknown): boolean => {
    if (!o || typeof o !== 'object') return false;
    const s = o as Record<string, unknown>;
    return typeof s.stageIndex === 'number' && typeof s.title === 'string' && Array.isArray(s.options);
  };
  expressApp.get('/suite8-menu/:designation', (req, res) => {
    // D-AFS · THE CROSS-CITIZEN READ (?scpName=) — Local anchor focus renders ANOTHER
    // citizen's stage. The R3 law holds (no sibling HTTP): the FOREIGN root resolves via
    // this SCP's OWN sovereign bridge.json boundScps[scpName].dir (the MD-1 picker
    // precedent — a filesystem read, existence-checked), then the designation resolves
    // STRICTLY INSIDE that citizen's Extended (the same traversal guard idiom).
    const foreignScpName = typeof req.query.scpName === 'string' ? req.query.scpName : undefined;
    let menuDir: string | null = null;
    if (foreignScpName !== undefined) {
      try {
        const ownBridgeJsonPath = path.resolve(process.cwd(), 'Cascades', 'Bridge', 'bridge.json');
        const bridgeMeta = JSON.parse(fs.readFileSync(ownBridgeJsonPath, 'utf-8')) as {
          boundScps?: Record<string, { dir?: string }>;
        };
        const foreignDir = bridgeMeta.boundScps?.[foreignScpName]?.dir;
        if (typeof foreignDir !== 'string' || foreignDir.length === 0) {
          res.status(404).json({ ok: false, error: 'scpName not bound' });
          return;
        }
        const foreignExtendedBase = path.resolve(foreignDir, 'Cascades', 'Extended');
        const candidate = path.resolve(foreignExtendedBase, req.params.designation);
        if (candidate === foreignExtendedBase || !candidate.startsWith(foreignExtendedBase + path.sep)) {
          res.status(403).end();
          return;
        }
        menuDir = candidate;
      } catch {
        res.status(404).json({ ok: false, error: 'bridge.json unreadable · foreign read unavailable' });
        return;
      }
    } else {
      const resolved = resolveExtendedDesignationDir(req.params.designation);
      if (!resolved) {
        res.status(404).json({ ok: false, error: 'designation menu not found' });
        return;
      }
      menuDir = resolved.dir;
    }
    try {
      const raw = fs.readFileSync(path.resolve(menuDir, 'menu.json'), 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (Array.isArray(parsed.stages)) {
        const stages = (parsed.stages as unknown[]).filter(validateMenuStageShape);
        if (stages.length === 0) {
          res.status(404).json({ ok: false, error: 'menu.json stages all invalid' });
          return;
        }
        const rawIdx = typeof parsed.currentStageIndex === 'number' ? parsed.currentStageIndex : 0;
        res.json({
          currentStageIndex: Math.min(Math.max(rawIdx, 0), stages.length - 1),
          stages,
        });
        return;
      }
      if (!validateMenuStageShape(parsed)) {
        res.status(404).json({ ok: false, error: 'menu.json missing required fields' });
        return;
      }
      res.json({ currentStageIndex: 0, stages: [parsed] });
    } catch {
      res.status(404).json({ ok: false, error: 'menu.json absent anor malformed' });
    }
  });

  // W6 (C775) · GET — THE DOCUMENTATION SUMMON GROUND: the shipped SHATTERITE-MENU.md served
  // from the SCP's own Cascades/Documentation/. The menu's manual, pullable from the menu —
  // the self-referential close of the Turing-complete Pass Through doctrine (its §7).
  expressApp.get('/suite8-menu-doc', (_req, res) => {
    try {
      const docPath = path.resolve(process.cwd(), 'Cascades', 'Documentation', 'SHATTERITE-MENU.md');
      res.type('text/markdown').send(fs.readFileSync(docPath, 'utf-8'));
    } catch {
      res.status(404).json({ ok: false, error: 'SHATTERITE-MENU.md absent at this SCP' });
    }
  });

  // C766 · POST — the client-persisted stage iteration (2A). Body { designation,
  // currentStageIndex }. Read-modify-writes ONLY currentStageIndex (the agent owns `stages`);
  // a LEGACY single-stage file is first wrapped into the staged form. The menu watcher then
  // relays the converged document to every client — the file stays the authority. Clamped into
  // range; traversal-guarded by resolveExtendedDesignationDir; NEVER throws.
  expressApp.post('/suite8-menu-stage', express.json(), (req, res) => {
    const { designation, currentStageIndex } = (req.body ?? {}) as {
      designation?: string;
      currentStageIndex?: number;
    };
    if (typeof designation !== 'string' || typeof currentStageIndex !== 'number') {
      res.status(400).json({ ok: false, error: 'designation + currentStageIndex required' });
      return;
    }
    const resolved = resolveExtendedDesignationDir(designation);
    if (!resolved) {
      res.status(404).json({ ok: false, error: 'designation menu not found' });
      return;
    }
    const menuPath = path.resolve(resolved.dir, 'menu.json');
    try {
      const parsed = JSON.parse(fs.readFileSync(menuPath, 'utf-8')) as Record<string, unknown>;
      const doc = Array.isArray(parsed.stages)
        ? parsed
        : { currentStageIndex: 0, stages: [parsed] };
      const stages = (doc.stages as unknown[]).filter(validateMenuStageShape);
      if (stages.length === 0) {
        res.status(409).json({ ok: false, error: 'menu.json holds no valid stages' });
        return;
      }
      const clamped = Math.min(Math.max(currentStageIndex, 0), stages.length - 1);
      const next = { ...doc, currentStageIndex: clamped, stages };
      fs.writeFileSync(menuPath, JSON.stringify(next, null, 2) + '\n', 'utf-8');
      res.json({ ok: true, currentStageIndex: clamped, stageCount: stages.length });
    } catch {
      res.status(404).json({ ok: false, error: 'menu.json absent anor malformed' });
    }
  });

  // POST — write authority split by nature. Body: { designation, filePath, markdown }. ONLY a
  // DIAMOND-*.md basename is writable (the plan · Ego · prunable). ONYX (the trajectory · Lambda ·
  // sacred) is REJECTED — it is session-written only. The filePath must land INSIDE the resolved
  // Extended/<designation>/ folder (traversal-guarded). The suiteCascade watcher's chokidar 'change'
  // event then re-reads + relays the new activeCascadeFiles (no direct state write here).
  expressApp.post('/suite8-doc-save', express.json(), (req, res) => {
    const { designation, filePath, markdown } = (req.body ?? {}) as {
      designation?: string;
      filePath?: string;
      markdown?: string;
    };
    if (!designation || !filePath || typeof markdown !== 'string') {
      res.status(400).json({ ok: false, error: 'designation, filePath, and markdown are required' });
      return;
    }
    const resolved = resolveExtendedDesignationDir(designation);
    if (!resolved) {
      res.status(404).json({ ok: false, error: 'designation folder not found' });
      return;
    }
    // ONLY the plan (DIAMOND) is page-writable; the trajectory (ONYX) is session-written.
    const basename = path.basename(filePath);
    if (!/^DIAMOND-.*\.md$/i.test(basename)) {
      res
        .status(403)
        .json({ ok: false, error: 'only the plan (DIAMOND-*.md) is editable from the page' });
      return;
    }
    // C727 · 3 THE Working/-AWARE SUBTREE RESOLVE — the manifest filePath is repository-relative and
    // the pair now lives one level down in Working/ (Temporal-Accumulating Ledger Concentration). The
    // PRIOR basename-collapse (path.resolve(resolved.dir, basename)) flattened EVERY save to the
    // Extended/<name>/ root, so a page-edit of Working/DIAMOND-TIER-1.md wrote the FLAT copy the read
    // never resolves (the read/write split · A6). Preserve exactly the Working/ subdir when the
    // incoming path's parent is Working/, else keep the flat basename (back-compat with founded dirs
    // whose pair sits beside the manifest). The traversal guard below still holds — Working/ is INSIDE
    // resolved.dir — and the DIAMOND-only law above is intact (basename is still the gated filename).
    const parentDir = path.basename(path.dirname(filePath));
    const rel = parentDir === 'Working' ? path.join('Working', basename) : basename;
    const target = path.resolve(resolved.dir, rel);
    if (target !== resolved.dir && !target.startsWith(resolved.dir + path.sep)) {
      res.status(403).json({ ok: false, error: 'path escapes the designation folder' });
      return;
    }
    // Ensure the Working/ subtree exists before the write (mint seeds it, but a founded-elsewhere or
    // pre-C727 dir may lack it — fs.writeFileSync creates no parent dirs · ENOENT-on-open guard).
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
    } catch {
      /* best-effort · the write below surfaces any genuine fault as a 500 */
    }
    try {
      fs.writeFileSync(target, markdown, 'utf-8');
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: `write failed: ${String(err)}` });
    }
  });

  // ============================================
  // GITM #639 · MOCH — /gitm-status endpoint (gitm.json on-demand hydration · external)
  // ============================================
  //
  // Returns the current gitm.json snapshot from <junction>/Cascades/Bridge/gitm.json — the
  // SAME file the gitm STCP gitmJsonWatcher relays. The page itself is served by the STCP
  // relay + BOCR backfill (no endpoint needed for page hydration); this endpoint is for
  // external consumers querying the SCP directly + a belt-and-suspenders C1 seed. Path
  // MD-A D2 · resolves via resolveScpLocalBridgeDir() — gitm.json is the SCP's OWN rail
  // under sovereignty (the bridge's GITEP writer lands the calling SCP's copy).
  // AFPR: absent/unreadable/malformed → 200 null. READ-ONLY · no params.
  expressApp.get('/gitm-status', (_req, res) => {
    const gitmJsonPath = path.join(resolveScpLocalBridgeDir(), 'gitm.json');
    try {
      const raw = fs.readFileSync(gitmJsonPath, 'utf-8');
      res.json(JSON.parse(raw) as GitmJsonShape);
    } catch {
      res.json(null);
    }
  });

  // GITM SCP-UPD (C282) · MOCH endpoints for the HEAVY update bodies. The update watcher's
  // C1/SBIS relay dispatch fires at server boot BEFORE any client connects, and the STCP
  // BOCR backfill is dead (#640) — the diff/resolved bodies never reach a client via the
  // relay alone. Same MOCH doctrine as /gitm-status: read the bridge-owned file on demand;
  // AFPR (absent/unreadable/malformed → 200 null). READ-ONLY · no params.
  expressApp.get('/gitm-update-diff', (_req, res) => {
    const name = process.env.SCP_NAME ?? '';
    const diffPath = path.join(resolveBridgeRoot(), `scp-update-diff.${name}.json`);
    try {
      res.json(JSON.parse(fs.readFileSync(diffPath, 'utf-8')));
    } catch {
      res.json(null);
    }
  });
  expressApp.get('/gitm-update-resolved', (_req, res) => {
    const name = process.env.SCP_NAME ?? '';
    const resolvedPath = path.join(resolveBridgeRoot(), `scp-update-resolved.${name}.json`);
    try {
      res.json(JSON.parse(fs.readFileSync(resolvedPath, 'utf-8')));
    } catch {
      res.json(null);
    }
  });

  // ============================================
  // MD-B · THE BRIDGE SUB-PAGE PROXY (Installation + Registration + Boot + Focus)
  // ============================================
  // The Installation sub-page talks to THE BRIDGE (the R3 law: an SCP page never
  // reaches a sibling directly). Discovery rides the SCP's OWN sovereign bridge.json
  // (resolveScpLocalBridgeDir · the per-SCP rail MD-A established — the bridge keeps
  // it current on every workspace write). The bridge's /mcp accepts single-shot
  // JSON-RPC tools/call POSTs (the mcpInvoke precedent — no session handshake).
  // MD-ARC+C · Wave 7 · the boundScps entry gains an optional `worktree` marker (the WAPF role the
  // bridge probes at write time) and the shape gains the `archivedScps` sibling ledger relay.
  const readOwnBridgeJson = (): { endpoint?: string; port?: number; installedScps?: string[]; boundScps?: Record<string, { port: number; status: string; browserUrl: string; worktree?: 'clean' | 'instance' | 'owner' }>; scpLifecycle?: Record<string, string>; scpWindows?: Record<string, number>; scpWindowsRendered?: Record<string, number>; scpStatuses?: Record<string, string>; archivedScps?: Array<{ name: string; archivedAt: number; worktree: 'clean' | 'instance' | 'owner' }>; writtenAt?: number } | null => {
    try {
      const raw = fs.readFileSync(path.join(resolveScpLocalBridgeDir(), 'bridge.json'), 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  let mcpProxyRequestId = 1;
  const invokeBridgeTool = async (toolName: string, args: Record<string, unknown>): Promise<{ ok: boolean; error?: string; result?: unknown }> => {
    const meta = readOwnBridgeJson();
    if (!meta || typeof meta.port !== 'number' || meta.port <= 0) {
      return { ok: false, error: 'Bridge not discovered — the per-SCP bridge.json is absent or portless. Is the SCS-Bridge running?' };
    }
    try {
      const res = await fetch(`http://127.0.0.1:${meta.port}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: mcpProxyRequestId++, method: 'tools/call', params: { name: toolName, arguments: args } }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return { ok: false, error: `Bridge /mcp responded ${res.status}` };
      const body = (await res.json()) as { result?: unknown; error?: { message?: string } };
      if (body.error) return { ok: false, error: body.error.message ?? 'Bridge tool error' };
      return { ok: true, result: body.result };
    } catch (err) {
      return { ok: false, error: `Bridge /mcp unreachable: ${String(err)}` };
    }
  };

  // The roster — installed (SCPs.json-registered, broadcast on bridge.json) + active
  // (boundScps · the live spawnsByScp projection). READ-ONLY · AFPR → 200 null shape.
  expressApp.get('/bridge-roster', (_req, res) => {
    const meta = readOwnBridgeJson();
    if (!meta) {
      // W6a · THE LIFECYCLE PROJECTION (SCM W6) · the null-shape carries an empty scpLifecycle so the
      // helm reads a consistent field shape whether the bridge is up or not. SWFB · W6 REFINEMENT ·
      // scpWindows carried alongside (same consistent-shape reason · empty ⇒ no window presence).
      // M2 · WINDOW-RENDERED · scpWindowsRendered carried alongside (same consistent-shape reason).
      // C653 · scpStatuses carried alongside (same consistent-shape reason · empty ⇒ no install-transient).
      // MD-ARC+C · Wave 7 · archivedScps carried alongside (same consistent-shape reason · [] ⇒ the
      // widget's Archived tab shows the empty state whether the bridge is up or not).
      res.json({ bridgeUp: false, installedScps: [], boundScps: {}, scpLifecycle: {}, scpWindows: {}, scpWindowsRendered: {}, scpStatuses: {}, archivedScps: [], writtenAt: 0 });
      return;
    }
    res.json({
      bridgeUp: true,
      installedScps: meta.installedScps ?? [],
      boundScps: meta.boundScps ?? {},
      // W6a · THE LIFECYCLE PROJECTION (SCM W6) · echo the bridge's per-SCP FSM-state map so the helm
      // reads booting-class states (pending/idle/booting) DIRECTLY — the booting phase was invisible
      // before (boundScps is live-only). Absent on a pre-W6 bridge.json ⇒ {} (no booting signal).
      scpLifecycle: meta.scpLifecycle ?? {},
      // SWFB · W6 REFINEMENT · echo the bridge's per-SCP window-presence map (scpName → visible
      // Electron windowId). The helm gates its ONE focus round on THIS — a name present means its
      // OS window truly exists (post-live, closing the moments gap). Absent on a pre-refinement
      // bridge.json ⇒ {} (the helm falls back to firing focus on FSM 'live').
      scpWindows: meta.scpWindows ?? {},
      // M2 · WINDOW-RENDERED (D-WR C628) · echo the bridge's per-SCP window-RENDERED map (scpName →
      // first did-finish-load epoch-ms). The helm gates its ONE focus round on THIS (RENDERED) instead
      // of scpWindows (BOUND) — a name present means the window PAINTED, so /bridge-focus never lands
      // on a bound-but-blank window (the exact blank the user saw focused). Absent on a pre-rendered
      // bridge.json ⇒ {} (the helm falls back to scpWindows presence).
      scpWindowsRendered: meta.scpWindowsRendered ?? {},
      // C653 · THE STATUS PROJECTION (MEND C) · echo the bridge's per-SCP PSSM status map (scpName →
      // 'live' | 'pending' | 'installing'). The helm reads THIS to hold the MULTIPLY staged bar's
      // INSTALL tick + disable the instance-row Spawn button while a fresh instance's npm install
      // runs. Absent on a pre-C653 bridge.json ⇒ {} (the helm treats every instance as install-complete).
      scpStatuses: meta.scpStatuses ?? {},
      // MD-ARC+C · Wave 7 · THE ARCHIVED ROSTER — echo the bridge's {name, archivedAt, worktree}
      // projection of SCPs.json archivedScps[] so the widget's Archived tab renders Restore + Delete
      // rows off the SAME poll (no second fetch). The `worktree` markers on installedScps/boundScps
      // ride through inside `boundScps` above (each BoundScpEntry carries its WAPF role). Absent on a
      // pre-Wave-7 bridge.json ⇒ [] (the widget shows the empty-archived state).
      archivedScps: meta.archivedScps ?? [],
      writtenAt: meta.writtenAt ?? 0,
    });
  });

  // Install an SCP — from the bundled template (no source), a local PATH, anor a git URL.
  // ACK-only: the bridge pipeline runs async; the roster reflects the registration on the
  // next bridge.json broadcast.
  // C822 D2 · THE COMMIT-LOCKED INSTALL RELAY (RD-SCP-MANIFEST v1): validates the manifest
  // HERE (the SCP side of the both-sides law) before relaying; the bridge validates AGAIN.
  // The install checks out the manifest's commit hash — never HEAD.
  expressApp.post('/bridge-install-manifest', express.json(), (req, res) => {
    const { designation, gitUrl, manifestJson } = (req.body ?? {}) as {
      designation?: string; gitUrl?: string; manifestJson?: string;
    };
    if (!designation || !/^[A-Z][A-Za-z0-9]*$/.test(designation)) {
      res.status(400).json({ ok: false, error: 'designation must be PascalCase (e.g. MyProject)' });
      return;
    }
    if (!gitUrl || typeof gitUrl !== 'string') {
      res.status(400).json({ ok: false, error: 'gitUrl is required for a manifest install' });
      return;
    }
    if (!manifestJson || typeof manifestJson !== 'string') {
      res.status(400).json({ ok: false, error: 'manifestJson is required' });
      return;
    }
    const check = validateScpManifest(manifestJson);
    if (!check.ok) {
      res.status(400).json({ ok: false, error: `manifest rejected: ${check.reason}` });
      return;
    }
    void invokeBridgeTool('install_scp', { designation, sourceUrl: gitUrl, manifestJson }).then(
      (out) => res.json({ ...(out as object), anchor: check.manifest.commit.hash }),
    );
  });

  // THE CREATE DOOR (SCP Management · the Freshest-Template workflow): a designation-only
  // create — the bridge installs from the BUNDLED template (the Freshest-Template Law: the
  // npm package's copy renews with every bridge install and now WINS the source resolution),
  // staging progress in the same per-designation sidecar the manifest install polls.
  // One field, one press: a new SCP born current.
  expressApp.post('/bridge-create-scp', express.json(), (req, res) => {
    const { designation } = (req.body ?? {}) as { designation?: string };
    if (!designation || !/^[A-Z][A-Za-z0-9]*$/.test(designation)) {
      res.status(400).json({ ok: false, error: 'designation must be PascalCase (e.g. MyProject)' });
      return;
    }
    void invokeBridgeTool('install_scp', { designation }).then((out) => res.json(out as object));
  });

  // C833 · THE EFFECTIVE DESCRIPTION RESOLVER — the ONE resolver both the /s8/:name/description
  // reader AND the manifest generator use. Precedence: Description.md (the authored file-system
  // aspect · the Suite 8 Card System's editing surface writes it · sessions edit it directly) →
  // the Instance.md `**Domain**:` line (the scaffold's literal 'TBD' falls through — the
  // unactualized mark is not a description) → the generated default. Cap 300 (RD-SCP-MANIFEST
  // functionalDescription parity — this value FEEDS the manifest).
  const readEffectiveSuite8Description = (
    suite8Dir: string,
    name: string,
  ): { description: string; source: 'file' | 'domain' | 'default' } => {
    try {
      const authored = readFileSync(path.resolve(suite8Dir, 'Description.md'), 'utf8').trim().slice(0, 300);
      if (authored.length > 0) return { description: authored, source: 'file' };
    } catch { /* no Description.md — fall through */ }
    try {
      const body = readFileSync(path.resolve(suite8Dir, 'Instance.md'), 'utf8');
      const dm = body.match(/\*\*Domain\*\*:\s*([^\n]+)/);
      const fd = (dm ? dm[1] : '').trim().slice(0, 300);
      if (fd.length > 0 && fd !== 'TBD') return { description: fd, source: 'domain' };
    } catch { /* no Instance.md — fall through */ }
    return { description: `The ${name} aspect of this SCP.`.slice(0, 300), source: 'default' };
  };

  // C822 D3 · THE MANIFEST GENERATOR (RD-SCP-MANIFEST v1 · the Generator Notes VERBATIM):
  // commit.* from THIS repo's HEAD (git log -1) · description from scp.config.json anor
  // package.json (authored text) · suite8s from the ROSTER-PARITY 8_SUITES registry
  // (C835: suite8RiBase — the same base the card system reads; C833: PRESENCE IS THE
  // REGISTRY — every directory lists; the effective description resolves Description.md →
  // **Domain** → the default via the one resolver above). CONSTITUTIONALLY UNABLE TO LEAK:
  // built from exactly these inputs, never filtered from a larger object.
  expressApp.get('/scp-generate-manifest', (_req, res) => {
    try {
      const cwd = process.cwd();
      const raw = execSync('git log -1 --format=%H%n%s%n%cI', { cwd, encoding: 'utf8' });
      const [hash, subject, iso] = raw.trim().split('\n');
      // C832 · %cI carries the commit's LOCAL OFFSET (e.g. -07:00) — the RD demands UTC
      // Z-suffixed. Convert losslessly (same instant); a non-parsing date is an honest 500,
      // never a served guess. The self-validation below caught this exact breach in the
      // field (IE · C831) — the gate stands untouched.
      const tsMs = Date.parse(iso);
      if (Number.isNaN(tsMs)) {
        res.status(500).json({ ok: false, error: `git emitted a non-parsing committer date: ${iso}` });
        return;
      }
      const timestampUtc = new Date(tsMs).toISOString();
      let description = '';
      // C838 · THE DESIGNATION RIDES TOO — the SCP's own scpName, sanitized to the intake's
      // PascalCase law (non-alphanumerics stripped · first letter raised). The intake
      // PRE-FILLS its Designation field from it (copy-and-paste carries EVERYTHING); the
      // user edits it there if they see fit.
      let designation = '';
      try {
        const cfg = JSON.parse(readFileSync(path.resolve(cwd, 'scp.config.json'), 'utf8')) as { description?: string; scpName?: string };
        description = typeof cfg.description === 'string' ? cfg.description : '';
        if (typeof cfg.scpName === 'string') {
          const cleaned = cfg.scpName.replace(/[^A-Za-z0-9]/g, '');
          designation = cleaned.length > 0 ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : '';
        }
        if (!description) {
          const pkg = JSON.parse(readFileSync(path.resolve(cwd, 'package.json'), 'utf8')) as { description?: string };
          description = typeof pkg.description === 'string' ? pkg.description : '';
        }
        if (!description) description = `${cfg.scpName ?? 'This SCP'} — a Suite Cascade Protocol app.`;
      } catch {
        description = 'A Suite Cascade Protocol app.';
      }
      const suite8s: Array<{ name: string; functionalDescription: string }> = [];
      try {
        // C835 · THE ROSTER-PARITY ROOT — the manifest enumerates the SAME base the Suite 8
        // Card System reads (suite8RiBase · the bridge-root walk-up → the workspace
        // Cascades/8_SUITES). The prior cwd-local read served 5 aspects while the roster
        // stood 15 — the manifest and the roster are ONE registry (the field wound: "We are
        // Missing Quite a Few"). The /s8/:name/description pair already writes here, so
        // every listed aspect is the very dir the Edit door authors.
        const s8Root = suite8RiBase;
        // C833 · PRESENCE IS THE REGISTRY — every DIRECTORY lists (the Instance.md-existence
        // skip fell; a bare dir is a valid Suite 8 awaiting its description). Directories only,
        // per the roster convention.
        const dirents = readdirSync(s8Root, { withFileTypes: true });
        for (const de of dirents.filter((d) => d.isDirectory()).slice(0, 32)) {
          const eff = readEffectiveSuite8Description(path.join(s8Root, de.name), de.name);
          suite8s.push({ name: de.name.slice(0, 60), functionalDescription: eff.description });
        }
      } catch { /* no 8_SUITES — an empty array is valid per the RD */ }
      // C837 · THE ORIGIN RIDES INSIDE THE MANIFEST (the doctrine REVISED by the user's law —
      // supersedes the C824 beside-the-manifest placement). EITHER/OR with PRIORITY TO THE
      // REMOTE HOST: `git remote get-url origin` wins; with NO remote the repo's own
      // file:// path serves the offline transfer (performCloneAtCommit clones both alike).
      // The scp-origin.com registry SCREENS local paths at upload — a remote host is
      // required for a public SCP; the file:// form is for direct machine-to-machine
      // transfer only. The GitM status check records the same remote (gitm.json
      // remoteOrigin · C837) — one truth, two surfaces.
      let sourceLocation = '';
      let sourceKind: 'remote' | 'local-path' = 'local-path';
      try {
        const remote = execSync('git remote get-url origin', { cwd, encoding: 'utf8' }).trim();
        if (remote.length > 0) {
          sourceLocation = remote;
          sourceKind = 'remote';
        }
      } catch { /* no remote — fall through to the local path */ }
      if (!sourceLocation) {
        // C839 · THE REPO-ROOT LAW — git clones REPO ROOTS only; the SCP package may be a
        // SUBDIR of its repo (IE: <repo>/SCP). The file:// origin is the git toplevel, never
        // cwd — the field wound: `fatal: …/SCP does not appear to be a git repository`.
        // The receiving pipeline's package locator finds the SCP package inside the clone.
        let repoRoot = cwd;
        try {
          repoRoot = execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf8' }).trim() || cwd;
        } catch { /* not a repo?? — the commit read above would have thrown first */ }
        sourceLocation = `file://${repoRoot}`;
        sourceKind = 'local-path';
      }
      const manifest = {
        manifestVersion: 1,
        commit: { hash, message: subject.trim().slice(0, 200), timestamp: timestampUtc },
        description: description.trim().slice(0, 2000),
        suite8s,
        origin: sourceLocation.slice(0, 500),
        ...(designation.length > 0 ? { designation: designation.slice(0, 60) } : {}),
      };
      const manifestJson = JSON.stringify(manifest, null, 2);
      const check = validateScpManifest(manifestJson);
      if (!check.ok) {
        res.status(500).json({ ok: false, error: `generated manifest failed its own validation: ${check.reason}` });
        return;
      }
      res.json({ ok: true, manifestJson, sourceLocation, sourceKind });
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // C839 · THE STAGED INSTALL RELAY (MOCH · the /gitm-update-diff idiom VERBATIM): read the
  // bridge-owned per-designation progress sidecar on demand. AFPR — absent/unreadable/
  // malformed → 200 null (the page treats null as not-yet-started). NDEP: the designation
  // is a single NAME — separators/traversal reject to null.
  expressApp.get('/bridge-install-progress/:designation', (req, res) => {
    const designation = req.params.designation;
    if (!designation || designation.includes('/') || designation.includes('\\') || designation.includes('..')) {
      res.json(null);
      return;
    }
    const progressPath = path.join(resolveBridgeRoot(), `scp-install-progress.${designation}.json`);
    try {
      res.json(JSON.parse(fs.readFileSync(progressPath, 'utf-8')));
    } catch {
      res.json(null);
    }
  });

  expressApp.post('/bridge-install', express.json(), (req, res) => {
    const { designation, sourcePath, sourceUrl } = (req.body ?? {}) as { designation?: string; sourcePath?: string; sourceUrl?: string };
    if (!designation || !/^[A-Z][A-Za-z0-9]*$/.test(designation)) {
      res.status(400).json({ ok: false, error: 'designation must be PascalCase (e.g. MyProject)' });
      return;
    }
    const args: Record<string, unknown> = { designation };
    if (sourceUrl) args.sourceUrl = sourceUrl;
    else if (sourcePath) args.sourcePath = sourcePath;
    void invokeBridgeTool('install_scp', args).then((out) => res.json(out));
  });

  // Boot an installed SCP — the recommended default launch (session-management surface).
  expressApp.post('/bridge-boot', express.json(), (req, res) => {
    const { scpName } = (req.body ?? {}) as { scpName?: string };
    if (!scpName) {
      res.status(400).json({ ok: false, error: 'scpName required' });
      return;
    }
    void invokeBridgeTool('scp_launch_session_management', { scpName }).then((out) => res.json(out));
  });

  // SES · THE STOP RAIL (C632 · Helm Exit ability) — stop a LIVE SCP. Closes the
  // SCP window, SIGTERMs its dedicated server, drives the lifecycle FSM dying→gone,
  // and writes persisted status 'pending'. RECOVERABLE — /bridge-boot re-launches;
  // NOT a destructive worktree removal. Mirrors /bridge-boot's shape exactly (scpName
  // guard → invokeBridgeTool('scp_stop', { scpName })). The roster poll flips the row
  // offline naturally once the FSM settles.
  expressApp.post('/bridge-stop', express.json(), (req, res) => {
    const { scpName } = (req.body ?? {}) as { scpName?: string };
    if (!scpName) {
      res.status(400).json({ ok: false, error: 'scpName required' });
      return;
    }
    void invokeBridgeTool('scp_stop', { scpName }).then((out) => res.json(out));
  });

  // MD-ARC+C · Wave 7 · SARC — archive a STOPPED SCP (the reversible vault move ·
  // recoverable via /bridge-reinstate). Mirrors /bridge-stop's shape exactly (scpName
  // guard → invokeBridgeTool). `force` rides the H1-owner Path B (move + git worktree
  // repair); the widget re-calls with force:true when the WAPF confer surfaces owned
  // worktrees. The roster poll moves the row to the Archived tab on the next cycle.
  expressApp.post('/bridge-archive', express.json(), (req, res) => {
    const { scpName, force } = (req.body ?? {}) as { scpName?: string; force?: boolean };
    if (!scpName) {
      res.status(400).json({ ok: false, error: 'scpName required' });
      return;
    }
    const args: Record<string, unknown> = { scpName };
    if (force === true) args.force = true;
    void invokeBridgeTool('scp_archive', args).then((out) => res.json(out));
  });

  // MD-ARC+C · Wave 7 · SRST — reinstate an archived SCP (the reverse move + ledger
  // restoration at status 'pending' · launch is manual). Mirrors /bridge-stop's shape.
  // The roster poll moves the row back to the Installed tab on the next cycle.
  expressApp.post('/bridge-reinstate', express.json(), (req, res) => {
    const { scpName } = (req.body ?? {}) as { scpName?: string };
    if (!scpName) {
      res.status(400).json({ ok: false, error: 'scpName required' });
      return;
    }
    void invokeBridgeTool('scp_reinstate', { scpName }).then((out) => res.json(out));
  });

  // MD-ARC+C · Wave 7 · SDEL — PERMANENTLY delete an SCP (the destructive sibling of
  // /bridge-archive · NOT recoverable). `fromArchive` selects the vault seat (deleting
  // an already-archived SCP) vs the installed seat. Mirrors /bridge-stop's shape. The
  // roster poll drops the row on the next cycle. The widget arms this behind the typed-
  // name confirm (Installed tab) anor the Y/N confirm (Archived tab).
  expressApp.post('/bridge-delete', express.json(), (req, res) => {
    const { scpName, fromArchive } = (req.body ?? {}) as { scpName?: string; fromArchive?: boolean };
    if (!scpName) {
      res.status(400).json({ ok: false, error: 'scpName required' });
      return;
    }
    const args: Record<string, unknown> = { scpName };
    if (fromArchive === true) args.fromArchive = true;
    void invokeBridgeTool('scp_delete', args).then((out) => res.json(out));
  });

  // Focus a live SCP's window. The URL is passed EXPLICITLY from the roster's boundScps
  // (the SWFB registry resolves server-side too, but the env-based BWRF fallback is
  // unreliable post-BO-2-C — passing the known browserUrl closes that gap).
  expressApp.post('/bridge-focus', express.json(), (req, res) => {
    const { scpName } = (req.body ?? {}) as { scpName?: string };
    const meta = readOwnBridgeJson();
    const bound = scpName && meta?.boundScps ? meta.boundScps[scpName] : undefined;
    const args: Record<string, unknown> = {};
    if (bound?.browserUrl) args.url = bound.browserUrl;
    // M3 · THE FOCUS RECORD SEAM (D-WR C628) — thread the KNOWN scpName so the tool's by-id path
    // resolves THIS window record, not the env 'template' fallback (which grabbed a stale windowId:1
    // in R7). Belt-and-suspenders alongside the browserUrl override above.
    if (scpName) args.scpName = scpName;
    void invokeBridgeTool('scs_focus_bridge_window', args).then((out) => res.json(out));
  });

  // ============================================
  // PRE-EPOCH · AD · /suite8-anchor-spawn/:designation — anchorSpawn mode on-demand read
  // ============================================
  //
  // Returns the `anchorSpawn` ('prompt' | 'auto') field from a Suite 8's OWN per-Suite-8 RI file at
  // Cascades/8_SUITES/<designation>/Cascade.json (the AD convention · S2 Pattern 28). The
  // Suite8HomeLanding onMounted GETs this once to decide its first-load anchor behavior. Resolution
  // MIRRORS the menu watcher (SCS_BRIDGE_ROOT_OVERRIDE ?? cwd) so it reads the EXACT per-Suite-8 RI
  // dir (dev:self → SCS root; production → install cwd). DEFAULT 'prompt' (decision 3): absent file /
  // absent field / unreadable / malformed → { anchorSpawn: 'prompt' }. READ-ONLY.
  //
  // PATH-TRAVERSAL HARDENED: req.params.designation is user-controlled. Resolve against the 8_SUITES
  // base + reject unless STRICTLY INSIDE (resolved !== base AND startsWith(base + sep)) — a `..`
  // traversal or sibling resolves outside base → 403.
  // Template Citizenship (BO-2-C · Edit 1.1): re-anchor via resolveBridgeRoot()
  // walk-up instead of the SCS_BRIDGE_ROOT_OVERRIDE ?? cwd env read.
  // resolveBridgeRoot() returns <scsRoot>/Cascades/Bridge; two '..' ascents yield
  // <scsRoot>. It still honors SCS_BRIDGE_ROOT_OVERRIDE first-priority (back-compat)
  // and walks up from a spawned SCP's cwd when the override is absent.
  const suite8RiScsRoot = path.resolve(resolveBridgeRoot(), '..', '..');
  const suite8RiBase = path.resolve(suite8RiScsRoot, 'Cascades', '8_SUITES');
  expressApp.get('/suite8-anchor-spawn/:designation', (req, res) => {
    const designation = req.params.designation;
    const designationDir = path.resolve(suite8RiBase, designation);
    if (
      designationDir !== suite8RiBase &&
      !designationDir.startsWith(suite8RiBase + path.sep)
    ) {
      res.status(403).end();
      return;
    }
    // C481 · THE FILESYSTEM ANCHOR — the toggle's truth is the per-Suite-8 S8.json in the
    // SCP-LOCAL Extended (the C465 rail · extensible: more per-S8 settings build off this file).
    // localStorage is OUT of the truth loop entirely (the user-diagnosed local-read race).
    // Fallback: the legacy 8_SUITES Cascade.json anchorSpawn (migration-friendly read).
    const s8JsonPath = path.resolve(process.cwd(), 'Cascades', 'Extended', designation, 'S8.json');
    try {
      const raw = fs.readFileSync(s8JsonPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const mode = parsed && parsed.anchorSpawn === 'auto' ? 'auto' : 'prompt';
      // C772 · W4 — autoMode rides the same S8.json rail (the HiFi-yellow toggle's truth).
      // D-AFS · anchorFocus ('specified'|'local') + localAnchorScpName ride the same rail —
      // the recorded Anchor Focus Selector (like Auto-Spawn/Auto Mode · survives reloads and
      // worktree re-opens).
      res.json({
        anchorSpawn: mode,
        autoMode: parsed && parsed.autoMode === true,
        anchorFocus: parsed && parsed.anchorFocus === 'local' ? 'local' : 'specified',
        localAnchorScpName:
          parsed && typeof parsed.localAnchorScpName === 'string' && parsed.localAnchorScpName.length > 0
            ? parsed.localAnchorScpName
            : null,
      });
      return;
    } catch { /* S8.json absent → legacy fallback below */ }
    const cascadeJsonPath = path.resolve(designationDir, 'Cascade.json');
    try {
      const raw = fs.readFileSync(cascadeJsonPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const mode = parsed && parsed.anchorSpawn === 'auto' ? 'auto' : 'prompt';
      res.json({ anchorSpawn: mode, autoMode: false });
    } catch {
      res.json({ anchorSpawn: 'prompt', autoMode: false }); // absent / unreadable / malformed → the default.
    }
  });

  // C470 · THE AUTO-SPAWN TOGGLE WRITE LEG — POST /suite8-anchor-spawn/:designation
  // { anchorSpawn: 'auto' | 'prompt' }. Read-modify-write the Suite 8's OWN Cascade.json
  // (all other fields preserved; absent file → a minimal { anchorSpawn } is born). The same
  // traversal guard as the GET. The Shatterite Menus' toggle is the sole caller.
  expressApp.post('/suite8-anchor-spawn/:designation', express.json(), (req, res) => {
    const designation = req.params.designation;
    const designationDir = path.resolve(suite8RiBase, designation);
    if (
      designationDir !== suite8RiBase &&
      !designationDir.startsWith(suite8RiBase + path.sep)
    ) {
      res.status(403).end();
      return;
    }
    const body = (req.body ?? {}) as { anchorSpawn?: unknown; autoMode?: unknown; anchorFocus?: unknown; localAnchorScpName?: unknown };
    const nextMode = body.anchorSpawn;
    const nextAuto = body.autoMode;
    // D-AFS · the Anchor Focus Selector record — same rail, same read-modify-write.
    const nextFocus = body.anchorFocus;
    const nextLocalScp = body.localAnchorScpName;
    const hasMode = nextMode === 'auto' || nextMode === 'prompt';
    const hasAuto = typeof nextAuto === 'boolean';
    const hasFocus = nextFocus === 'specified' || nextFocus === 'local';
    const hasLocalScp = typeof nextLocalScp === 'string' || nextLocalScp === null;
    if (!hasMode && !hasAuto && !hasFocus && !hasLocalScp) {
      res.status(400).json({ ok: false, error: 'anchorSpawn (auto|prompt) anor autoMode (boolean) anor anchorFocus (specified|local) anor localAnchorScpName (string|null) required' });
      return;
    }
    // C481 · write the FILESYSTEM ANCHOR — the SCP-local Extended S8.json (born on first
    // toggle · read-modify-write preserves future per-S8 fields).
    const s8Dir = path.resolve(process.cwd(), 'Cascades', 'Extended', designation);
    const s8JsonPath = path.resolve(s8Dir, 'S8.json');
    try {
      fs.mkdirSync(s8Dir, { recursive: true });
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(fs.readFileSync(s8JsonPath, 'utf-8')) as Record<string, unknown>;
      } catch {
        /* absent anor malformed → born minimal */
      }
      // C772 · W4 — write only the supplied fields (either toggle updates its own).
      if (hasMode) parsed.anchorSpawn = nextMode;
      if (hasAuto) parsed.autoMode = nextAuto;
      // D-AFS · the focus record writes its own fields; null clears the local selection.
      if (hasFocus) parsed.anchorFocus = nextFocus;
      if (hasLocalScp) {
        if (nextLocalScp === null) delete parsed.localAnchorScpName;
        else parsed.localAnchorScpName = nextLocalScp;
      }
      fs.writeFileSync(s8JsonPath, JSON.stringify(parsed, null, 2), 'utf-8');
      res.json({ ok: true, anchorSpawn: nextMode });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // ============================================
  // SMSP · /suite8-skill-prime/:designation?ref=<path>&kind=skill|strategy — load a Skill/Strategy
  // in FULL and SORD-wrap it for the live-anchor relay (the Shatterite Menu Skill-Priming feature)
  // ============================================
  //
  // The ShatteriteMenu 'prime' option GETs this, then triggerSendMessage's the returned `envelope` to
  // the page Anchor — priming the Suite 8 to PERFORM the Skill. Resolves `ref` against the SAME
  // per-Suite-8 RI dir (Cascades/8_SUITES/<designation>/ · the suite8RiBase above). READ-ONLY.
  // PATH-TRAVERSAL HARDENED on BOTH the designation AND the ref (both user-controlled): each must
  // resolve STRICTLY INSIDE its base, else 403. Missing ref → 400; absent/unreadable Skill → 404.
  expressApp.get('/suite8-skill-prime/:designation', (req, res) => {
    const designation = req.params.designation;
    const designationDir = path.resolve(suite8RiBase, designation);
    if (designationDir !== suite8RiBase && !designationDir.startsWith(suite8RiBase + path.sep)) {
      res.status(403).end();
      return;
    }
    const ref = typeof req.query.ref === 'string' ? req.query.ref : '';
    if (!ref) {
      res.status(400).json({ error: 'missing ref' });
      return;
    }
    const refPath = path.resolve(designationDir, ref);
    if (!refPath.startsWith(designationDir + path.sep)) {
      res.status(403).end(); // a `..` traversal or sibling resolves outside the designation dir.
      return;
    }
    const kind: 'skill' | 'strategy' = req.query.kind === 'strategy' ? 'strategy' : 'skill';
    // PSPC · Prime-SCP-Path-Convey (GitM color-cascade W1). Read THIS SCP's own name from
    // scp.config.json @ process.cwd() (the SCP PACKAGE ROOT · the SAME resolution /scp-config uses)
    // and carry it into the envelope so a path-targeting Skill (SetColorsViaJson) writes to the SCP
    // package dir's own Cascades/ (the EXACT dir /hifi-config reads · inside the SCP RED git work-tree),
    // not the anchor session's OUTER cwd. Best-effort: absent/unreadable/malformed ⇒ '' ⇒ header omitted.
    let primeScpName = '';
    try {
      const cfgRaw = fs.readFileSync(path.resolve(process.cwd(), 'scp.config.json'), 'utf-8');
      const cfg = JSON.parse(cfgRaw) as { scpName?: unknown };
      if (typeof cfg?.scpName === 'string') primeScpName = cfg.scpName;
    } catch {
      /* no scp.config.json (dev:self / pre-install) — the Skill falls back to self-resolution */
    }
    try {
      const content = fs.readFileSync(refPath, 'utf-8');
      res.json({ envelope: buildSordSkillEnvelope({ ref, kind, content, scpName: primeScpName }) });
    } catch {
      res.status(404).json({ error: 'skill not found' });
    }
  });

  // ============================================
  // MD-4 · THE ENDPOINT READERS — SCP-local Suite 8 documents (D-RD-1 trio+skills · D-RD-2 docs+asset)
  // ============================================
  //
  // GET /suite8/:name/instance | /conductor | /maintainer  → the doc (text/markdown · 404 honest)
  // GET /suite8/:name/skills                                → the Skills/ LISTING (JSON)
  // GET /suite8/:name/skill/:skill                          → a Skill.md (fuzzy match · text/markdown)
  // GET /suite8/:name/strategies                            → the Strategy/ LISTING (JSON)
  // GET /suite8/:name/strategy/:strat                       → a Strategy file (fuzzy match · text/markdown)
  // GET /suite8/:name/working-docs                          → Cascades/Working/ FILTERED to :name (JSON)
  // GET /suite8/:name/asset?ref=logo                        → assets/<ref>.{png,svg,jpg,jpeg,webp} (first present)
  //
  // ALL READ-ONLY (writes = the DIAMETRIC anor the update system). suite8RiBase (above · the C338
  // boundary · SCS_BRIDGE_ROOT_OVERRIDE ?? cwd → SCP-local) is the 8_SUITES root. THE TRAVERSAL
  // GUARD IDIOM (verbatim `resolved !== base && startsWith(base+sep)`) is applied on :name AND
  // :skill/:strat/:ref via the pure suite8ReaderPaths.model helpers — no `..` anor absolute passes.
  // THE FailureNode Doctrine: every 404 carries { error, path } (the path TRIED · the honest reason).
  //
  // Guard fail = 403; empty/missing = 400; absent-on-disk = 404 {error,path}. Deterministic.

  // C370-B · THE RENAME-PROOF ALIAS PREFIXES — the reader family registers under BOTH `/suite8/…`
  // (the historical prefix · the template-self surfaces still use it) AND `/s8/…` (the alias). THE
  // ROOT DEFECT: `suite8:page`'s token replace rewrites EVERY `suite8` literal in a copied concept —
  // INCLUDING these fetch URLs — but the reader routes live in the SHARED `vue` concept and only ever
  // answered `/suite8/…`, so a generated page's rewritten `/{{concept}}/…` fetch hit NO route (the SPA
  // fallback), leaving its Card + forge predicate blind. THE CURE: the string `s8` contains no
  // `suite8`/`Suite8` token, so the rename can NEVER touch a `/s8/…` fetch — the generated page keeps a
  // working reader family. ONE handler body per route (a prefix loop · never a duplicated body). The
  // `:name` param stays the DISPLAY name (the 8_SUITES dir). See Suite8Card.vue + Suite8HomeLanding.vue.
  const SUITE8_ROUTE_PREFIXES = ['/suite8', '/s8'] as const;
  for (const prefix of SUITE8_ROUTE_PREFIXES) {
  // The trio + maintainer (D-RD-1). One handler factory, three fixed leaf files.
  const registerSuite8DocReader = (route: string, kind: Suite8DocKind) => {
    expressApp.get(route, (req, res) => {
      const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
      if (!dir.ok) {
        res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
        return;
      }
      const filePath = suite8DocPath(dir.path, kind);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.type('text/markdown').send(content);
      } catch {
        res.status(404).json({ error: `${kind} not found`, path: filePath });
      }
    });
  };
  registerSuite8DocReader(`${prefix}/:name/instance`, 'instance');
  registerSuite8DocReader(`${prefix}/:name/conductor`, 'conductor');
  registerSuite8DocReader(`${prefix}/:name/maintainer`, 'maintainer');

  // C833 · THE DESCRIPTION ASPECT PAIR — the Suite 8 description is a FILE-SYSTEM aspect
  // (Description.md beside Instance.md): user-editable in the card AND session-editable as a
  // file (ONE truth; the manifest generator reads the same resolver). GET = the effective
  // description + its named source. POST = write Description.md (trim · cap 300 · RD parity)
  // with READ-BACK; an ABSENT dir is CREATED (the General Description Editor's save — a bare
  // Suite 8 dir is a valid registry entry per the presence-is-the-registry law). The write is
  // the ONE sanctioned exception to the family's read-only rule — it touches exactly the
  // description leaf under the traversal-guarded dir, nothing else.
  expressApp.get(`${prefix}/:name/description`, (req, res) => {
    const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
    if (!dir.ok) {
      res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
      return;
    }
    res.json({ ok: true, ...readEffectiveSuite8Description(dir.path, req.params.name) });
  });
  expressApp.post(`${prefix}/:name/description`, express.json(), (req, res) => {
    const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
    if (!dir.ok) {
      res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
      return;
    }
    const raw = (req.body ?? {}) as { description?: string };
    const text = typeof raw.description === 'string' ? raw.description.trim().slice(0, 300) : '';
    if (!text) {
      res.status(400).json({ error: 'description required (1-300 chars · plain text)' });
      return;
    }
    try {
      fs.mkdirSync(dir.path, { recursive: true });
      const filePath = path.resolve(dir.path, 'Description.md');
      fs.writeFileSync(filePath, text + '\n', 'utf-8');
      const readBack = fs.readFileSync(filePath, 'utf-8').trim();
      if (readBack !== text) {
        res.status(500).json({ error: 'read-back mismatch after write' });
        return;
      }
      res.json({ ok: true, description: readBack, source: 'file' });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Skills LISTING (D-RD-1) — HETEROGENEOUS: flat *.md AND <SkillDir>/Skill.md. Absent Skills/ → [].
  expressApp.get(`${prefix}/:name/skills`, (req, res) => {
    const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
    if (!dir.ok) {
      res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
      return;
    }
    const skillsDir = suite8SkillsDir(dir.path);
    try {
      const dirents = fs.readdirSync(skillsDir, { withFileTypes: true });
      const listing = buildSkillsListing(
        dirents.map((d) => ({ name: d.name, isDir: d.isDirectory() })),
      );
      res.json(listing);
    } catch {
      res.json([]); // absent Skills/ → honest empty listing.
    }
  });

  // Skill DETAIL (D-RD-1) — fuzzy-tolerant :skill match → the Skill.md content.
  expressApp.get(`${prefix}/:name/skill/:skill`, (req, res) => {
    const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
    if (!dir.ok) {
      res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
      return;
    }
    const skillsDir = suite8SkillsDir(dir.path);
    let listing;
    try {
      const dirents = fs.readdirSync(skillsDir, { withFileTypes: true });
      listing = buildSkillsListing(dirents.map((d) => ({ name: d.name, isDir: d.isDirectory() })));
    } catch {
      res.status(404).json({ error: 'no skills', path: skillsDir });
      return;
    }
    const matched = matchSkill(listing, req.params.skill);
    if (!matched) {
      res.status(404).json({ error: 'skill not found', path: `${skillsDir}/${req.params.skill}` });
      return;
    }
    const skillPath = path.resolve(skillsDir, matched.skillMdRelPath);
    try {
      res.type('text/markdown').send(fs.readFileSync(skillPath, 'utf-8'));
    } catch {
      res.status(404).json({ error: 'skill not found', path: skillPath });
    }
  });

  // Strategies LISTING (D-RD-2) — flat *.md. Absent Strategy/ → [].
  expressApp.get(`${prefix}/:name/strategies`, (req, res) => {
    const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
    if (!dir.ok) {
      res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
      return;
    }
    const stratDir = suite8StrategyDir(dir.path);
    try {
      const files = fs.readdirSync(stratDir);
      res.json(buildStrategyListing(files));
    } catch {
      res.json([]);
    }
  });

  // Strategy DETAIL (D-RD-2) — fuzzy-tolerant :strat match → the file content.
  expressApp.get(`${prefix}/:name/strategy/:strat`, (req, res) => {
    const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
    if (!dir.ok) {
      res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
      return;
    }
    const stratDir = suite8StrategyDir(dir.path);
    let listing;
    try {
      listing = buildStrategyListing(fs.readdirSync(stratDir));
    } catch {
      res.status(404).json({ error: 'no strategies', path: stratDir });
      return;
    }
    const matched = matchStrategy(listing, req.params.strat);
    if (!matched) {
      res.status(404).json({ error: 'strategy not found', path: `${stratDir}/${req.params.strat}` });
      return;
    }
    const stratPath = path.resolve(stratDir, matched.file);
    try {
      res.type('text/markdown').send(fs.readFileSync(stratPath, 'utf-8'));
    } catch {
      res.status(404).json({ error: 'strategy not found', path: stratPath });
    }
  });

  // Working-docs (D-RD-2) — Cascades/Working/ FILTERED to filenames anor first-lines containing :name.
  // Working/ is SCP-LOCAL (suite8RiScsRoot/Cascades/Working · the same root suite8RiBase derives from).
  const suite8WorkingDir = path.resolve(suite8RiScsRoot, 'Cascades', 'Working');
  expressApp.get(`${prefix}/:name/working-docs`, (req, res) => {
    // Guard :name (the filter needle · not a path segment here, but keep the boundary honest).
    const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
    if (!dir.ok) {
      res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
      return;
    }
    const name = req.params.name;
    let docs: WorkingDocEntry[] = [];
    try {
      const files = fs.readdirSync(suite8WorkingDir).filter((f) => /\.md$/i.test(f));
      docs = files.map((file) => {
        let firstLine = '';
        try {
          const raw = fs.readFileSync(path.resolve(suite8WorkingDir, file), 'utf-8');
          firstLine = raw.split('\n', 1)[0] ?? '';
        } catch {
          /* unreadable individual doc → empty first-line (still filterable by filename) */
        }
        return { file, firstLine };
      });
    } catch {
      res.json([]); // absent Working/ → honest empty array.
      return;
    }
    res.json(filterWorkingDocs(docs, name));
  });

  // MD-6 · Working-doc CONTENT (D-BP-1) — GET /suite8/:name/working-doc?file=<name.md> reads ONE
  // doc from Cascades/Working/ so the HOME subpage's Cascade Documents list opens a reader in-page
  // (the /working-docs route serves the LISTING only). READ-ONLY. THE TRAVERSAL GUARD IDIOM: the
  // `file` query is user-controlled — resolve it against suite8WorkingDir and reject unless STRICTLY
  // INSIDE (resolved !== base AND startsWith(base + sep)) + enforce a .md leaf. Missing file → 400;
  // guard fail → 403; absent-on-disk → 404 {error,path} (the FailureNode Doctrine · honest reason).
  expressApp.get(`${prefix}/:name/working-doc`, (req, res) => {
    const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
    if (!dir.ok) {
      res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
      return;
    }
    const file = typeof req.query.file === 'string' ? req.query.file : '';
    if (!file || !/\.md$/i.test(file)) {
      res.status(400).json({ error: 'missing or non-markdown file' });
      return;
    }
    const docPath = path.resolve(suite8WorkingDir, file);
    if (docPath !== suite8WorkingDir && !docPath.startsWith(suite8WorkingDir + path.sep)) {
      res.status(403).end(); // a `..` traversal or absolute path resolves outside Working/ → 403.
      return;
    }
    try {
      res.type('text/markdown').send(fs.readFileSync(docPath, 'utf-8'));
    } catch {
      res.status(404).json({ error: 'working-doc not found', path: docPath });
    }
  });

  // Asset (D-RD-2) — assets/<ref>.<ext> first-present · ?ref=logo default · guarded on :name AND ref.
  expressApp.get(`${prefix}/:name/asset`, (req, res) => {
    const dir = resolveSuite8Dir(suite8RiBase, req.params.name);
    if (!dir.ok) {
      res.status(dir.reason === 'empty' ? 400 : 403).json({ error: dir.reason });
      return;
    }
    const ref = typeof req.query.ref === 'string' ? req.query.ref : 'logo';
    const assetsBase = suite8AssetsDir(dir.path);
    const resolved = resolveAssetCandidates(assetsBase, ref);
    if (!resolved.ok) {
      res.status(resolved.reason === 'empty' ? 400 : 403).json({ error: resolved.reason });
      return;
    }
    const present = resolved.candidates.find((c) => fs.existsSync(c));
    if (!present) {
      res.status(404).json({ error: 'asset not found', path: `${assetsBase}/${ref}.{png,svg,jpg,jpeg,webp}` });
      return;
    }
    res.type(assetContentType(present)).sendFile(present);
  });

  // ============================================
  // MD-3 · THE NAME-FIRST DEMOMETRIC MINT — POST /suite8/create {name} (D-NM-1)
  // ============================================
  //
  // Mints a NEW Suite 8 as a DIRECTORY under Cascades/8_SUITES/<name>/ (SCP-LOCAL · suite8RiBase
  // above · the C338 boundary) holding barebones docs — NOT a compiled concept. The generic
  // `suite8` island renders it BY PARAM (risk-2 law). NDEP-validated (alphanumeric + space · the
  // dir-entry rule). THE FailureNode Doctrine: every reject carries { error, reason }.
  //   400 → invalid name (bad shape · out-of-bounds) · { error:'invalid name', reason }
  //   409 → collision (the dir already exists) · { error:'already exists', reason }
  //   200 → { ok:true, name, directoryPath } — the caller refreshes the roster.
  // The two barebones files (Instance.md + Maintainer.md) carry THE CADMIUM RECOMMENDATION +
  // the MD-2 Maintainer schema (Home SCP read from THIS SCP's scp.config.json). READ→WRITE
  // (the ONE write route beside the read-only readers · the mint is the intended write).
  expressApp.post(`${prefix}/create`, express.json(), (req, res) => {
    // C724 · THE MINT WHOLE-LOCAL FIX — the mint's 8_SUITES base is SCP-LOCAL (process.cwd() ·
    // the SCP PACKAGE ROOT · the SAME anchor the C708 Extended-seed pass + buildMintPlan below use)
    // — NOT the resolveBridgeRoot()-walk-up suite8RiBase (which lands the identity home at the
    // SHARED WORKSPACE root). This colocates the 8_SUITES Instance/Maintainer with the SCP-local
    // Extended seed → resolveOwningScpRoot resolves → the Extended stamp fires. Scoped to the MINT
    // path only; the read-only suite8RiBase readers above keep the workspace walk-up unchanged.
    const suite8MintBase = path.resolve(process.cwd(), 'Cascades', '8_SUITES');
    const resolved = resolveMintDir(suite8MintBase, (req.body ?? {}).name);
    if (!resolved.ok) {
      res.status(400).json({ error: 'invalid name', reason: resolved.reason });
      return;
    }
    // Uniqueness — 409 honest if the dir already exists (never silently overwrite a live Suite 8).
    if (fs.existsSync(resolved.dir)) {
      res.status(409).json({
        error: 'already exists',
        reason: `A Suite 8 named "${resolved.name}" already exists at Cascades/8_SUITES/${resolved.name}/`,
      });
      return;
    }
    // PSPC-idiom · read THIS SCP's own name from scp.config.json @ cwd (the SAME resolution
    // /scp-config + /suite8-skill-prime use) → the Maintainer.md Home SCP. Best-effort default.
    // C727 · 1 · resolvedScpName holds the REAL designation ONLY (undefined when scp.config.json
    // is absent · dev:self / pre-install) so the S8.json scpName stamp never persists the 'this SCP'
    // placeholder — the mint OMITs the field instead (the never-guess law).
    let homeScp = 'this SCP';
    let resolvedScpName: string | undefined;
    try {
      const cfgRaw = fs.readFileSync(path.resolve(process.cwd(), 'scp.config.json'), 'utf-8');
      const cfg = JSON.parse(cfgRaw) as { scpName?: unknown };
      if (typeof cfg?.scpName === 'string' && cfg.scpName.length > 0) {
        homeScp = cfg.scpName;
        resolvedScpName = cfg.scpName;
      }
    } catch {
      /* no scp.config.json (dev:self / pre-install) — the barebones default stands */
    }
    try {
      // IE-D4b · pass process.cwd() as the SCP-LOCAL root so the Extended seed lands at THIS SCP's
      // OWN Cascades/Extended/<name>/ (the 4A self-encapsulation law) — NOT the resolveBridgeRoot()-
      // walk-up workspace root that suite8RiBase/resolved.dir carry (the SHARED bridge base · the
      // prior ENOENT cause). This matches the Extended readers (resolveExtendedDesignationDir walks
      // up from process.cwd(), SCP-first) + the scp.config.json / S8.json cwd reads above.
      const plan = buildMintPlan(resolved.dir, resolved.name, homeScp, process.cwd(), resolvedScpName);
      fs.mkdirSync(plan.dir, { recursive: true });
      // IE-D4b · mkdir the Extended seed folder(s) BEFORE writing (fs.writeFileSync does not create
      // parent dirs · the Cascades/Extended/<name>/ folder needs its own recursive mkdir).
      for (const extraDir of plan.extraDirs) {
        fs.mkdirSync(extraDir, { recursive: true });
      }
      for (const file of plan.files) {
        fs.writeFileSync(file.path, file.content, 'utf-8');
      }
      res.status(200).json({
        ok: true,
        name: resolved.name,
        directoryPath: `Cascades/8_SUITES/${resolved.name}/`,
      });
    } catch (err) {
      // fs write failure → 500 honest (the scaffold could not be written).
      res.status(500).json({
        error: 'scaffold write failed',
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // ============================================
  // MD-3 · THE SOVEREIGNTY-PURE ROSTER — GET /suite8/local-roster (D-NM-3)
  // ============================================
  //
  // The SCP-LOCAL Suite 8 roster: a directory listing of Cascades/8_SUITES/ (suite8RiBase above ·
  // the C338 boundary · SCS_BRIDGE_ROOT_OVERRIDE ?? cwd → SCP-local). SOVEREIGNTY: this reads the
  // SCP's OWN 8_SUITES — NO bridge SEAP dependency, NO ?scpName param. A minted Suite 8 appears
  // here the instant its dir exists (no rebuild · the static-seed GAP closed). Each entry carries
  // { name, directoryPath, snippet } — the landing seeds its roster Record from this. Absent
  // 8_SUITES → []. READ-ONLY. Directories only (files ignored). Deterministic name sort.
  //
  // MD-5 · THE SNIPPET (the MD-4 firstLine helper idiom): the first MEANINGFUL Instance.md line
  // (non-heading · non-blank · stripped of markdown ornament), capped to SUITE8_SNIPPET_CAP. The
  // card surface reads it without a second /instance fetch. Absent/unreadable Instance.md → ''.
  const SUITE8_SNIPPET_CAP = 160;
  // D-EF-3 · THE FORGE PREDICATE — a freshly-minted (un-forged) Suite 8's Instance.md still carries
  // the scaffold's literal '**Domain**: TBD' (buildMintInstanceMd · suite8CreateScaffold.model.ts:150).
  // The Forge (Entourage Forge · its Band-1/F1) writes the REAL Domain into the minted Instance.md,
  // so the next roster load reads no 'TBD' → isUnactualized flips false → THE DOOR SELF-CLEARS (no
  // truncation to build). The migrated real Suite 8s carry real Domains → naturally excluded. One
  // extra includes() on the file the snippet reader already opens — no new route, no second read.
  const SUITE8_UNACTUALIZED_MARK = '**Domain**: TBD';
  const readInstanceUnactualized = (suite8DirName: string): boolean => {
    try {
      const instancePath = path.resolve(suite8RiBase, suite8DirName, 'Instance.md');
      return fs.readFileSync(instancePath, 'utf-8').includes(SUITE8_UNACTUALIZED_MARK);
    } catch {
      return false; // absent / unreadable Instance.md → not a forgeable placeholder.
    }
  };
  const readInstanceSnippet = (suite8DirName: string): string => {
    try {
      const instancePath = path.resolve(suite8RiBase, suite8DirName, 'Instance.md');
      const raw = fs.readFileSync(instancePath, 'utf-8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.length === 0) continue; // blank
        if (trimmed.startsWith('#')) continue; // heading
        if (trimmed.startsWith('>')) continue; // blockquote ornament
        if (/^[-*=_]{3,}$/.test(trimmed)) continue; // horizontal rule
        // First meaningful line — strip leading list/emphasis ornament, cap length.
        const cleaned = trimmed.replace(/^[-*]\s+/, '').replace(/^\*\*|\*\*$/g, '');
        return cleaned.length > SUITE8_SNIPPET_CAP
          ? `${cleaned.slice(0, SUITE8_SNIPPET_CAP - 1)}…`
          : cleaned;
      }
      return '';
    } catch {
      return ''; // absent / unreadable Instance.md → honest empty snippet.
    }
  };
  expressApp.get(`${prefix}/local-roster`, (_req, res) => {
    try {
      const entries = fs
        .readdirSync(suite8RiBase, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => ({
          name: e.name,
          directoryPath: `Cascades/8_SUITES/${e.name}/`,
          snippet: readInstanceSnippet(e.name),
          isUnactualized: readInstanceUnactualized(e.name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      res.json(entries);
    } catch {
      res.json([]); // absent / unreadable 8_SUITES → honest empty array.
    }
  });
  } // C370-B · close the SUITE8_ROUTE_PREFIXES loop — the reader family now answers /suite8 AND /s8.

  // ============================================
  // P4 · /hifi-config — serve the SCP's controlling hifiConfig.json (colors + patterns)
  // ============================================
  //
  // The IslandWrapper boot-read GETs this and applies it UNDER the user's localStorage clicks
  // (precedence factory :root < hifiConfig.json < localStorage). The JSON is the SCP's SHIPPED HiFi
  // design — authored by a spawned Pewter via the Set-Colors-via-JSON / Add-SVG-Pattern Skills (direct
  // JSON edit) — at <scsRoot>/Cascades/hifiConfig.json (the SCP's own Cascades · suite8RiScsRoot above).
  // READ-ONLY. Absent / unreadable / malformed → {} (IslandWrapper treats a non-HifiConfig as null).
  // C872 · SCP-LOCAL (the C465 rule): suite8RiScsRoot rides resolveBridgeRoot whose BO-2-I
  // walk-up PREFERS the ANCESTOR (the workspace rendezvous) — correct for the bridge, WRONG
  // for the SCP's OWN shipped HiFi (the Pewter write landed SCP-local and was never served;
  // the workspace file answered instead). cwd IS the package — the ONLY correct base here.
  const hifiConfigPath = path.resolve(process.cwd(), 'Cascades', 'hifiConfig.json');
  expressApp.get('/hifi-config', (_req, res) => {
    try {
      const raw = fs.readFileSync(hifiConfigPath, 'utf-8');
      res.json(JSON.parse(raw));
    } catch {
      res.json({});
    }
  });

  // ============================================
  // /scp-config — serve THIS SCP's declarative identity (Per-SCP-Identity-Config · FKIS Origin)
  // ============================================
  //
  // Sibling to /hifi-config. The scsBridgeController boot-reads this (loadScpConfig · same-origin
  // GET /scp-config) to cache the SCP's OWN scpName, then carries it as originScpName on every
  // send_message POST (the prime/SMSP path inherits via the single triggerSendMessage). This closes
  // the installed-SCP 'no-origin' bail: the shared workspace bridge muxium boots before any SCP is
  // chosen and has no per-SCP env to read — the SCP's OWN name IS its origin, declared here in data.
  //
  // scp.config.json lives at the SCP PACKAGE ROOT (process.cwd() · alongside package.json) — NOT the
  // suite8RiScsRoot junction (which dev:self repoints at the SCS repo root via SCS_BRIDGE_ROOT_OVERRIDE).
  // Fixed filename · no user input · path-traversal-safe by construction. READ-ONLY. Absent /
  // unreadable / malformed → { scpName: null } (the controller treats null as no-origin · env-first
  // resolution on the guard remains authoritative for env-carrying spawn routes).
  const scpConfigPath = path.resolve(process.cwd(), 'scp.config.json');
  // C466 · extendedRoot rides /scp-config: the CLIENT-side Vermillion builder needs the SCP's
  // absolute Extended base (workers run at the WORKSPACE cwd — the C465 relocation law) but the
  // browser has no process.cwd(). The server declares it here; CadmiumLanding threads it as riBase.
  const scpExtendedRoot = path.resolve(process.cwd(), 'Cascades', 'Extended');
  // C882 · THE DOCUMENTATION SITE — three sections, one index, fresh-from-disk reads.
  //   base    = the Base Cascade's Documentation (the workspace · suite8RiScsRoot)
  //   local   = THIS SCP's own Documentation (cwd — the C465/C872 rule)
  //   cascade = the Cascade Commands, derived from the Base Project's .claude/ directory
  const docSectionRoots = (): Record<string, { label: string; root: string }> => ({
    base: { label: 'Base', root: path.resolve(suite8RiScsRoot, 'Cascades', 'Documentation') },
    local: { label: 'Local', root: path.resolve(process.cwd(), 'Cascades', 'Documentation') },
    cascade: { label: 'Cascade', root: path.resolve(suite8RiScsRoot, '.claude') },
  });
  const walkMarkdown = (root: string, depth: number, rel: string, out: Array<{ file: string; title: string }>): void => {
    if (depth < 0 || !fs.existsSync(root)) return;
    for (const name of fs.readdirSync(root)) {
      if (name.startsWith('.')) continue;
      const full = path.join(root, name);
      const relPath = rel ? `${rel}/${name}` : name;
      try {
        const st = fs.statSync(full);
        if (st.isDirectory()) { walkMarkdown(full, depth - 1, relPath, out); continue; }
        if (!name.toLowerCase().endsWith('.md')) continue;
        let title = name.replace(/\.md$/i, '');
        try {
          const head = fs.readFileSync(full, 'utf-8').slice(0, 2000);
          const h = head.split('\n').find((l) => l.startsWith('# '));
          if (h) title = h.slice(2).trim();
        } catch { /* unreadable head → the filename stands */ }
        out.push({ file: relPath, title });
      } catch { /* stat race → skip the entry */ }
    }
  };
  expressApp.get('/documentation-index', (_req, res) => {
    const roots = docSectionRoots();
    const sections = Object.entries(roots).map(([id, { label, root }]) => {
      const docs: Array<{ file: string; title: string }> = [];
      walkMarkdown(root, 3, '', docs);
      docs.sort((a, b) => a.file.localeCompare(b.file));
      return { id, label, docs };
    });
    res.json({ sections });
  });
  expressApp.get('/documentation-doc', (req, res) => {
    const section = String(req.query.section ?? '');
    const file = String(req.query.file ?? '');
    const roots = docSectionRoots();
    const entry = roots[section];
    if (!entry || file.length === 0) { res.status(400).json({ error: 'section+file required' }); return; }
    const resolved = path.resolve(entry.root, file);
    if (!resolved.startsWith(entry.root + path.sep) || !resolved.toLowerCase().endsWith('.md')) {
      res.status(403).json({ error: 'outside the section root' }); return;
    }
    try {
      const markdown = fs.readFileSync(resolved, 'utf-8');
      res.json({ section, file, markdown, mtime: fs.statSync(resolved).mtimeMs });
    } catch { res.status(404).json({ error: 'absent' }); }
  });
  // C882 · the SCP-LOCAL Suite 8 designation roster (cwd rule) — the Component selector's feed.
  expressApp.get('/suite8-designations', (_req, res) => {
    const base = path.resolve(process.cwd(), 'Cascades', '8_SUITES');
    try {
      const names = fs.readdirSync(base).filter((n) => {
        try { return !n.startsWith('.') && fs.statSync(path.join(base, n)).isDirectory(); } catch { return false; }
      }).sort();
      res.json({ designations: names });
    } catch { res.json({ designations: [] }); }
  });

  // C898 · THE GENERAL CASCADE FLOOR (MOCH) — the SuiteCascade page requests this on EVERY
  // mount: the STCP relay pushes only on CHANGE (BOCR #640), so a fresh page saw nothing
  // until a file changed anor the SCP turned over. Reads the SCP-LOCAL general manifest +
  // the active pair FRESH from disk (the cwd rule).
  expressApp.get('/general-cascade', (_req, res) => {
    const dir = path.resolve(process.cwd(), 'Cascades');
    const manifestPath = path.join(dir, 'Cascade.json');
    let cascadeJson: Record<string, unknown> | null = null;
    let missing = true;
    try {
      cascadeJson = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
      missing = false;
    } catch { /* absent/malformed → the scaffold-absent shape (missingCascadeJson true) */ }
    const files: Array<{ filePath: string; markdown: string }> = [];
    for (const key of ['activeDiamond', 'activeOnyx']) {
      const rel = cascadeJson?.[key];
      if (typeof rel !== 'string' || rel.length === 0) continue;
      const resolved = path.resolve(dir, rel);
      if (!resolved.startsWith(dir + path.sep)) continue;
      try {
        files.push({ filePath: rel, markdown: fs.readFileSync(resolved, 'utf-8') });
      } catch { /* pointer to an absent file → omit (honest partial floor) */ }
    }
    res.json({
      name: 'General',
      cascadeDirectory: 'Cascades',
      cascadeJson,
      activeCascadeFiles: files,
      missingCascadeJson: missing,
    });
  });

  expressApp.get('/scp-config', (_req, res) => {
    try {
      const raw = fs.readFileSync(scpConfigPath, 'utf-8');
      const parsed = JSON.parse(raw) as { scpName?: unknown };
      const scpName = typeof parsed?.scpName === 'string' ? parsed.scpName : null;
      res.json({ scpName, extendedRoot: scpExtendedRoot });
    } catch {
      res.json({ scpName: null, extendedRoot: scpExtendedRoot });
    }
  });

  // ============================================
  // D-UP8 · /scs-bridge-version — THE TASKBAR VERSION LABEL (SCP-server-owned check)
  // ============================================
  //
  // Populated at SCP-SERVER BOOT (independent of the bridge vintage — visible even when
  // nothing else changed): the server runs `npm view scs-bridge version` (the command),
  // falling back to the npm registry endpoint when npm is absent from the PATH. The
  // INSTALLED version reads from the SCP's own sovereign bridge.json (bridgeVersion — the
  // MD-A discovery file). The TaskBar fetches this once on mount (the /scp-config idiom)
  // and colors the label: purple = current/unknown · red = the npm publish is GREATER than
  // the installed bridge · fuchsia = the npm publish is LESSER (this install is ahead).
  // Failure-silent throughout: no npm, no network, no bridge.json → nulls, purple label.
  // THE VERSIONING MUXAMETER — two Demometers under the one Cascade Position. The counters
  // (scsMuxameter { cli, scp } · monotonic) ride the npm /latest custom field; the verdict is
  // pure comparison: remote.cli > installed.cli → the CLI update · remote.scp > installed.scp
  // → the SCP Update circuit · both → both · pre-counter publishes → 'unknown' (both-paths).
  // D-RD1 · THE APPLIED-COUNTER RED DISCIPLINE: the red verdict keys on what THIS SCP has
  // LANDED (appliedScpMuxameter · scp.config.json scsMuxameterScp — stamped at install +
  // every update-apply), NOT on the global install. Red persists after the global sync
  // until Run Update lands the payload; purple returns only when both counters are current
  // — even when the npm VERSION is newer (counters equal = nothing of value → no nag).
  // `syncAvailable` (version differs remote-newer) drives the install button independently
  // of the class — the double bind (button hidden while red persists) is dissolved.
  type ScsCounterPair = { cli: number; scp: number };
  // MD-UM · LEG 3 · THE DIFFERENTIAL RELAY — the release manifest shape the bridge writes into
  // bridge.json (updateManifest.model.ts · getCachedReleaseManifest). Carried alongside the verdict
  // so the Update Page's differential mount reads the incoming releases the SAME way it reads the
  // applied counter — one fetch, one relay. Typed loosely (the bridge is the schema authority).
  type ScsReleaseManifest = {
    schemaVersion?: number;
    current?: string;
    muxameter?: ScsCounterPair;
    releases?: Array<{
      id: string;
      version?: string;
      label: string;
      muxameter?: ScsCounterPair;
      magnitude?: number;
      features: Array<{ title: string; color: string; summary: string; detail: string[] }>;
    }>;
  };
  const scsBridgeVersionCheck: {
    installedVersion: string | null;
    npmLatestVersion: string | null;
    checkedAt: number;
    installedMuxameter: ScsCounterPair | null;
    remoteMuxameter: ScsCounterPair | null;
    appliedScpMuxameter: number | null;
    syncAvailable: boolean;
    updateClass: 'none' | 'cli' | 'scp' | 'both' | 'unknown';
    // MD-UM · LEG 3 · the incoming releases relay (null until the bridge's manifest fetch lands).
    releaseManifest: ScsReleaseManifest | null;
  } = {
    installedVersion: null,
    npmLatestVersion: null,
    checkedAt: 0,
    installedMuxameter: null,
    remoteMuxameter: null,
    appliedScpMuxameter: null,
    syncAvailable: false,
    updateClass: 'none',
    releaseManifest: null,
  };
  const parseCounterPair = (m: unknown): ScsCounterPair | null => {
    const o = m as { cli?: unknown; scp?: unknown } | null | undefined;
    return o && typeof o.cli === 'number' && typeof o.scp === 'number'
      ? { cli: o.cli, scp: o.scp }
      : null;
  };
  const readInstalledBridgeVersion = (): void => {
    try {
      const raw = fs.readFileSync(path.join(resolveScpLocalBridgeDir(), 'bridge.json'), 'utf-8');
      const parsed = JSON.parse(raw) as {
        bridgeVersion?: unknown;
        installedMuxameter?: unknown;
        releaseManifest?: unknown;
      };
      scsBridgeVersionCheck.installedVersion =
        typeof parsed?.bridgeVersion === 'string' ? parsed.bridgeVersion : null;
      // The installed counters — written by a Muxameter-aware bridge; absent on older
      // bridges (⇒ 'unknown' verdicts when an update exists · both-paths, safe once).
      scsBridgeVersionCheck.installedMuxameter = parseCounterPair(parsed?.installedMuxameter);
      // MD-UM · LEG 3 · THE DIFFERENTIAL RELAY — the incoming releases the bridge fetched (the
      // composer leg writes getCachedReleaseManifest() into bridge.json). Absent on a pre-MD-UM
      // bridge ⇒ null (the differential mount stands in with the SCP-local updates.json wings).
      scsBridgeVersionCheck.releaseManifest =
        parsed?.releaseManifest && typeof parsed.releaseManifest === 'object'
          ? (parsed.releaseManifest as ScsReleaseManifest)
          : null;
    } catch {
      scsBridgeVersionCheck.installedVersion = null;
      scsBridgeVersionCheck.installedMuxameter = null;
      scsBridgeVersionCheck.releaseManifest = null;
    }
    // The applied counter — THIS SCP's own scp.config.json (the /scp-config resolution).
    // Absent (pre-law SCP) → null; the verdict falls back to installed-vs-remote for the
    // scp leg until the first stamped apply.
    try {
      const cfg = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'scp.config.json'), 'utf-8'),
      ) as { scsMuxameterScp?: unknown };
      scsBridgeVersionCheck.appliedScpMuxameter =
        typeof cfg?.scsMuxameterScp === 'number' ? cfg.scsMuxameterScp : null;
    } catch {
      scsBridgeVersionCheck.appliedScpMuxameter = null;
    }
  };
  const versionIsNewer = (a: string, b: string): boolean => {
    const av = a.split('.').map((s) => parseInt(s, 10) || 0);
    const bv = b.split('.').map((s) => parseInt(s, 10) || 0);
    for (let i = 0; i < Math.max(av.length, bv.length); i += 1) {
      if ((av[i] ?? 0) > (bv[i] ?? 0)) return true;
      if ((av[i] ?? 0) < (bv[i] ?? 0)) return false;
    }
    return false;
  };
  const deriveScsUpdateClass = (): void => {
    const i = scsBridgeVersionCheck.installedVersion;
    const n = scsBridgeVersionCheck.npmLatestVersion;
    const remoteVersionNewer = !!i && !!n && versionIsNewer(n, i);
    // The install button's key — independent of the class (the double-bind cure).
    scsBridgeVersionCheck.syncAvailable = remoteVersionNewer;
    const im = scsBridgeVersionCheck.installedMuxameter;
    const rm = scsBridgeVersionCheck.remoteMuxameter;
    if (!im || !rm) {
      // Pre-counter side(s): the counters cannot judge — the version comparison stands in
      // (the pre-Muxameter behavior · 'unknown' = both-paths-safe when an update exists).
      scsBridgeVersionCheck.updateClass = remoteVersionNewer ? 'unknown' : 'none';
      return;
    }
    // THE APPLIED-COUNTER LAW: counters govern; the version does NOT gate. The cli leg
    // compares the global install; the scp leg compares what THIS SCP has LANDED (applied
    // absent → the installed-vs-remote fallback — no regression for pre-law SCPs).
    const applied = scsBridgeVersionCheck.appliedScpMuxameter;
    const cli = rm.cli > im.cli;
    const scp = applied === null ? rm.scp > im.scp : rm.scp > applied;
    scsBridgeVersionCheck.updateClass = cli && scp ? 'both' : cli ? 'cli' : scp ? 'scp' : 'none';
  };
  const acceptRemote = (version: string, muxameter: unknown): void => {
    scsBridgeVersionCheck.npmLatestVersion = version;
    scsBridgeVersionCheck.remoteMuxameter = parseCounterPair(muxameter);
    scsBridgeVersionCheck.checkedAt = Date.now();
    deriveScsUpdateClass();
  };
  const runScsBridgeVersionCheck = (): void => {
    readInstalledBridgeVersion();
    // `--json` carries the FULL published metadata (version + the scsMuxameter custom field).
    exec('npm view scs-bridge --json', { timeout: 10_000 }, (err, stdout) => {
      if (!err) {
        try {
          const meta = JSON.parse(stdout) as { version?: unknown; scsMuxameter?: unknown };
          if (typeof meta.version === 'string' && /^\d+\.\d+\.\d+/.test(meta.version)) {
            acceptRemote(meta.version.trim(), meta.scsMuxameter);
            return;
          }
        } catch { /* fall through to the registry */ }
      }
      // The registry fallback (npm absent anor the command failed) — same data source.
      fetch('https://registry.npmjs.org/scs-bridge/latest', { headers: { Accept: 'application/json' } })
        .then((r) => (r.ok ? r.json() : null))
        .then((body: { version?: unknown; scsMuxameter?: unknown } | null) => {
          if (body && typeof body.version === 'string') {
            acceptRemote(body.version.trim(), body.scsMuxameter);
          }
        })
        .catch(() => { /* offline — the purple label stands honest */ });
    });
  };
  // Boot populate (deferred so the server's own boot is never held) + a 6h re-check.
  setTimeout(runScsBridgeVersionCheck, 3000);
  setInterval(runScsBridgeVersionCheck, 6 * 60 * 60 * 1000).unref?.();
  expressApp.get('/scs-bridge-version', (_req, res) => {
    // The installed side re-reads on every request (the bridge may have relaunched newer
    // since boot); the npm side serves the boot/interval cache; the verdict re-derives.
    readInstalledBridgeVersion();
    deriveScsUpdateClass();
    res.json(scsBridgeVersionCheck);
  });

  // ============================================
  // MD-CE-2 · /editor-fs/* — THE FS AUTHORITY (Code Editor Actualization Epoch)
  // ============================================
  //
  // The Epoch Law's transfer half: the graphiteScribe concept (now Graphite Scribe · MD-CE-3) HOLDS open files /
  // buffers / dirty flags in Stratimux state; these endpoints are the ONLY fs surface it
  // transfers through. Root = process.cwd() (the SCP PACKAGE ROOT · the /scp-config
  // precedent) with resolve+prefix traversal guards in the model. Contracts + guard
  // rationale live at src/model/editorFs.model.ts.
  registerEditorFsRoutes(expressApp);

  // ============================================
  // Diamond BSE · BLEP + BDRP — the Research Bulletin two-channel base pattern
  // ============================================
  //
  // GET /cadmium-research-bulletin       → CadmiumArticle[] (LIST · AFPR absent/malformed → [])
  // GET /cadmium-research-bulletin/:id   → single CadmiumArticle by articleId (DETAIL · 404 → null)
  //
  // The LIST channel is the BSOH lost-on-refresh fix: the IAJW/STCP relay broadcasts the bulletin
  // ONCE at write-time; a page that loads/reloads AFTER that broadcast never receives it (the
  // webSocketServer does not replay on reconnect). The CadmiumLanding onMounted ODCF GETs this
  // route to seed the researchBulletin store; the relay keeps it live thereafter. The DETAIL
  // channel feeds the BSBS sidebar→detail bodyCache (component-local · never Stratimux state).
  //
  // CLBF · the jsonPath + parser + routes are now owned by createLiveBulletin (single-source). The
  // factory's pre-bound registerResearchBulletinEndpoints registers the SAME LIST/DETAIL channels
  // against the EXACT researchBulletin.json the OkMonitor watcher watches (SCS_BRIDGE_ROOT_OVERRIDE
  // ?? cwd resolution lives in cadmiumResearchBulletinRelay.config.ts). Routes byte-identical.
  registerResearchBulletinEndpoints(expressApp);

  // ============================================
  // Topic Live Bulletin · CLBF folder-tree BSE — the Topic Bulletin two-channel registration
  // ============================================
  //
  // GET /cadmium-topic-bulletin       → CadmiumArticle[] (LIST · merged frontier/ aggregate · → [])
  // GET /cadmium-topic-bulletin/:id   → single CadmiumArticle by articleId (DETAIL · 404 → null)
  //
  // CLBF · the LIST/DETAIL channels read the materialised frontier/topicBulletin.json aggregate the
  // folder-tree merge writes after each dispatch (Option A · no change to registerBulletinEndpoints).
  // The CadmiumLanding onMounted ODCF GETs the LIST route to seed the topicBulletin store on refresh;
  // the folder-tree relay keeps it live thereafter. The DETAIL channel feeds the LiveBulletin
  // sidebar→detail bodyCache (component-local · never Stratimux state · markdownContent from the
  // merged child when present · empty until W4/mock inlines it). Path resolution
  // (SCS_BRIDGE_ROOT_OVERRIDE ?? cwd) lives in cadmiumTopicBulletinRelay.config.ts.
  registerTopicBulletinEndpoints(expressApp);

  // TOCH · Topics-On-Connect-Hydration — the topics registry (topics.json) is an STCP relay with NO
  // on-mount endpoint (unlike the menu MOCH + the bulletins BSOH), so a page loading after the boot
  // broadcast showed "no topics configured" though topics.json is populated. This LIST endpoint lets
  // CadmiumLanding onMounted GET the current topics so the registry survives a hard-refresh. Path +
  // parser owned by cadmiumTopicsRelay.config.
  registerTopicsEndpoint(expressApp);

  // Handler factory for SSR routes
  const createHandler = () => async (req: express.Request, res: express.Response) => {
    try {
      // Determine which island to load based on request path
      const targetIsland = getIslandForPath(req.path);
      if (!targetIsland) {
        res.status(404).send('No landing configured');
        return;
      }

      const navItems = getNavItems(req.path, typeof req.query.island === 'string' ? req.query.island : null);
      const authorizedIslandIds = getAuthorizedIslandIds();

      console.log(`[Vue SSR] Routing ${req.path} → island: ${targetIsland.conceptName}`);

      // Render Shell via Vue SSR
      const shellHtml = await renderShell({
        title: targetIsland.page.label,
        islandId: targetIsland.conceptName,
        navItems,
      });

      // Wrap in document with scripts
      const html = wrapInDocument({
        shellHtml,
        title: targetIsland.page.label,
        authorizedIslandIds,
        initialIslandId: targetIsland.conceptName,
        // D-RB · thread the SAME array the Shell rendered into __APP_STATE__ (the barrel ring).
        navItems,
        assets,
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('[Vue SSR] Error:', error);
      res.status(500).send('Server Error');
    }
  };

  // Register routes
  expressApp.get('/', createHandler());

  expressApp.use((req, res, next) => {
    if (
      req.path.startsWith('/files/') ||
      req.path.startsWith('/mcp') ||
      req.path.startsWith('/islands/') ||
      /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|eot)$/i.test(req.path)
    ) {
      return next();
    }
    createHandler()(req, res);
  });

  // Apply to additional servers
  servers.forEach((some) => {
    some.server.use(express.static(publicPath, { index: false }));
    some.server.use(express.static(clientDistPath, { index: false }));
    some.server.get('/', createHandler());
  });

  console.log('[Vue SSR] Shell initialized (Vue SSR → Static Islands)');
  console.log(`[Vue SSR] Islands: ${getAuthorizedIslandIds().join(', ')}`);
};
