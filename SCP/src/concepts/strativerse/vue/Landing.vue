<script setup lang="ts">
/**
 * StratiVERSE Landing Page (SSR + Client Muxium Creation)
 *
 * Concept Library Manager with Breakout/Hamburger Detail View.
 * Client CREATES its own ClientMuxium with StratiVERSE MuxonomicConcept.
 *
 * Architecture: concept/vue/Landing.vue
 * Pattern: Each concept owns its Vue pages
 *
 * Citation: STRATIMUX-VUE-REFERENCE.md - "Proper State Subscription Pattern"
 * Citation: STRATIMUX-REFERENCE.md - "🎯 DECK K Constant Pattern"
 * Citation: FORWARD-PASS-STRATIVERSE-VUE-SSR-ARCHITECTURE.md
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md - Induction Pattern
 *
 * POC 2.3a: Concept Library with Breakout Detail View
 * - Table-style concept list with Managed/Unmanaged column
 * - Hamburger breakout with tabbed aspect sections
 * - Muxonomic metadata display (code transparency in future PoC)
 *
 * Trajectory: StratiVERSE → Project Manager with cascading concept changes
 */
import { ref, onMounted, onUnmounted, computed, provide } from 'vue'
import type { Muxium } from 'stratimux'
import { createClientMuxiumInstance, type ExtendedClientDeck } from '../../client/client.muxonomy'
import { createMuxonomicStrativerseClient, type StrativerseClientDeck } from '../strativerse.concept.client'
import { createMuxonomicNotification } from '../../notification/notification.concept'
import type { NotificationDeck } from '../../notification/notification.type'
// Direct import from type file (NO barrel exports for tree-shaking)
import type {
  ConceptEntry,
  StrativerseConceptList,
  QualityEntry,
  PrincipleEntry,
  StrategyEntry,
  StateFieldEntry,
  TriggerUpdateTargetPayload,
  TriggerToggleDiameterPayload,
  ProjectEntry,
} from '../strativerse.type'
import { DeploymentTarget } from '../strativerse.type'
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../vue/components/ScsDropdown.vue'

/**
 * LandingDeck - Type-safe deck for this island
 *
 * Extends ClientMuxiumDeck with StratiVERSE CLIENT and Notification concepts.
 * Uses client-specific concept with dummy qualities for tree-shaking separation.
 * Access pattern: d.client.d.strativerse.k.conceptList.select()
 *                 d.client.d.notification.k.notifications.select()
 *
 * Citation: STRATIMUX-REFERENCE.md "🏗️ Muxified Concept Access Patterns (CRITICAL)"
 * Citation: FORWARD-PASS-MUXONOMY-ISLANDS.md - Phase 6 Muxonomic Build Separation
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 */
type LandingDeck = ExtendedClientDeck<StrativerseClientDeck & NotificationDeck>;

// ============================================
// REACTIVE STATE
// ============================================

const conceptList = ref<StrativerseConceptList | null>(null)
const managedProjects = ref<ProjectEntry[]>([])
const lastUpdated = ref<string>('')
const isLoading = ref<boolean>(true)
const isConnected = ref<boolean>(false)

// Phase 5E: Project Management State
const selectedProject = ref<string>('ADMIN_SCP')
const viewMode = ref<'library' | 'project'>('project')

// Breakout/Hamburger state
const expandedConcept = ref<string | null>(null)
const activeTab = ref<'qualities' | 'principles' | 'strategies' | 'state'>('qualities')
const filterStatus = ref<'all' | 'managed' | 'unmanaged'>('all')

// Muxium instance and stage planner
let muxium: Muxium<LandingDeck> | null = null
let stagePlanner: any = null

// Computed property for formatted concepts with filtering and sorting
// Uses displayConcepts (view-mode aware) as base
const sortedConcepts = computed(() => {
  const concepts = displayConcepts.value
  if (!concepts.length) return []

  let filtered = [...concepts]

  // Apply Managed/Unmanaged filter (hasMuxonomy = has muxonomy.ts file)
  if (filterStatus.value === 'managed') {
    filtered = filtered.filter(c => c.hasMuxonomy)
  } else if (filterStatus.value === 'unmanaged') {
    filtered = filtered.filter(c => !c.hasMuxonomy)
  }

  // Sort: Managed first, then alphabetical
  return filtered.sort((a, b) => {
    // Primary sort: Managed before Unmanaged
    if (a.hasMuxonomy !== b.hasMuxonomy) {
      return a.hasMuxonomy ? -1 : 1
    }
    // Secondary sort: Alphabetical
    return a.name.localeCompare(b.name)
  })
})

// Computed counts for status panel
const managedCount = computed(() =>
  conceptList.value?.concepts.filter(c => c.hasMuxonomy).length ?? 0
)
const unmanagedCount = computed(() =>
  conceptList.value?.concepts.filter(c => !c.hasMuxonomy).length ?? 0
)

// ============================================
// Phase 5E: Dual-View Computed Properties
// ============================================

// Available projects: ADMIN_SCP (default) + managed projects
const availableProjects = computed(() => {
  const projects: Array<{ name: string; isDefault: boolean }> = [
    { name: 'ADMIN_SCP', isDefault: true }
  ]
  if (managedProjects.value.length > 0) {
    managedProjects.value.forEach(p => {
      projects.push({ name: p.name, isDefault: false })
    })
  }
  return projects
})

// SB-DS6 · availableProjects mapped to the ScsDropdown {value,label} shape. Value === the project
// name (the v-model contract); label keeps the ' (Default)' suffix the native <option> showed.
const projectOptions = computed(() =>
  availableProjects.value.map((proj) => ({
    value: proj.name,
    label: `${proj.name}${proj.isDefault ? ' (Default)' : ''}`,
  })),
)

// Count of syncManaged concepts (for Library view header)
const syncManagedCount = computed(() => {
  if (viewMode.value === 'library') {
    // In Library view: count all syncManaged concepts across all projects
    let count = conceptList.value?.concepts.filter(c => c.muxonomyConfig?.syncManaged).length ?? 0
    managedProjects.value.forEach(p => {
      count += p.conceptEntries?.filter(c => c.muxonomyConfig?.syncManaged).length ?? 0
    })
    return count
  }
  // In Project view: count syncManaged concepts in selected project only
  if (selectedProject.value === 'ADMIN_SCP') {
    return conceptList.value?.concepts.filter(c => c.muxonomyConfig?.syncManaged).length ?? 0
  }
  const project = managedProjects.value.find(p => p.name === selectedProject.value)
  return project?.conceptEntries?.filter(c => c.muxonomyConfig?.syncManaged).length ?? 0
})

// Display concepts based on view mode and selected project
type DisplayConceptEntry = ConceptEntry & { sourceProject?: string }

const displayConcepts = computed((): DisplayConceptEntry[] => {
  if (viewMode.value === 'library') {
    // Library view: Show only syncManaged concepts from all projects with source
    const libraryConcepts: DisplayConceptEntry[] = []

    // Add syncManaged concepts from ADMIN_SCP
    if (conceptList.value?.concepts) {
      conceptList.value.concepts
        .filter(c => c.muxonomyConfig?.syncManaged)
        .forEach(c => libraryConcepts.push({ ...c, sourceProject: 'ADMIN_SCP' }))
    }

    // Add syncManaged concepts from managed projects
    managedProjects.value.forEach(p => {
      if (p.conceptEntries) {
        p.conceptEntries
          .filter(c => c.muxonomyConfig?.syncManaged)
          .forEach(c => libraryConcepts.push({ ...c, sourceProject: p.name }))
      }
    })

    return libraryConcepts.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Project view: Show all concepts from selected project
  if (selectedProject.value === 'ADMIN_SCP') {
    return conceptList.value?.concepts ?? []
  }

  const project = managedProjects.value.find(p => p.name === selectedProject.value)
  return project?.conceptEntries ?? []
})

// ============================================
// BREAKOUT HELPERS
// ============================================

function toggleConcept(conceptName: string) {
  if (expandedConcept.value === conceptName) {
    expandedConcept.value = null
  } else {
    expandedConcept.value = conceptName
    activeTab.value = 'qualities' // Reset to first tab
  }
}

function getDeploymentLabel(target: DeploymentTarget): string {
  switch (target) {
    case DeploymentTarget.All: return 'All'
    case DeploymentTarget.Huirth: return 'Huirth'
    case DeploymentTarget.Client: return 'Client'
    default: return 'Unknown'
  }
}

function getDeploymentClass(target: DeploymentTarget): string {
  switch (target) {
    case DeploymentTarget.All: return 'target-all'
    case DeploymentTarget.Huirth: return 'target-huirth'
    case DeploymentTarget.Client: return 'target-client'
    default: return ''
  }
}

// ============================================
// POC 2.3b: MUXONOMY MODIFICATION HELPERS
// ============================================

/**
 * Get next deployment target in cycle: All → Huirth → Client → All
 */
function getNextDeploymentTarget(current: DeploymentTarget): DeploymentTarget {
  switch (current) {
    case DeploymentTarget.All: return DeploymentTarget.Huirth
    case DeploymentTarget.Huirth: return DeploymentTarget.Client
    case DeploymentTarget.Client: return DeploymentTarget.All
    default: return DeploymentTarget.All
  }
}

/**
 * Dispatch action to change deployment target of a quality or principle
 * Uses direct selection (not cycling) for explicit user control
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 */
function changeDeploymentTarget(
  conceptName: string,
  aspectType: 'quality' | 'principle',
  aspectName: string,
  newTarget: DeploymentTarget
) {
  if (!muxium) {
    console.error('[StratiVERSE Client] Muxium not initialized')
    return
  }

  console.log('[StratiVERSE Client] Changing deployment target:', {
    conceptName,
    aspectType,
    aspectName,
    newTarget: getDeploymentLabel(newTarget)
  })

  // Dispatch via Induction pattern - routes through WebSocket to server
  muxium.dispatch(
    (muxium as Muxium<LandingDeck>).deck.d.client.d.strativerse.e.strativerseTriggerUpdateTarget({
      conceptName,
      aspectType,
      aspectName,
      newTarget
    })
  )
}

/**
 * Handle deployment target selection change event
 */
function onDeploymentTargetChange(
  event: Event,
  conceptName: string,
  aspectType: 'quality' | 'principle',
  aspectName: string
) {
  const select = event.target as HTMLSelectElement
  const newTarget = parseInt(select.value, 10) as DeploymentTarget
  changeDeploymentTarget(conceptName, aspectType, aspectName, newTarget)
}

/**
 * Dispatch action to toggle diameter (Induction pattern) on a quality
 * Note: Cannot enable diameter on DeploymentTarget.All
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 */
function toggleDiameterOnQuality(
  conceptName: string,
  qualityName: string,
  currentDiameter: boolean,
  deploymentTarget: DeploymentTarget
) {
  if (!muxium) {
    console.error('[StratiVERSE Client] Muxium not initialized')
    return
  }

  // Cannot enable diameter on DeploymentTarget.All
  if (!currentDiameter && deploymentTarget === DeploymentTarget.All) {
    console.warn('[StratiVERSE Client] Cannot enable diameter on DeploymentTarget.All')
    return
  }

  const enableDiameter = !currentDiameter
  console.log('[StratiVERSE Client] Toggling diameter:', {
    conceptName,
    qualityName,
    enableDiameter
  })

  // Dispatch via Induction pattern - routes through WebSocket to server
  muxium.dispatch(
    (muxium as Muxium<LandingDeck>).deck.d.client.d.strativerse.e.strativerseTriggerToggleDiameter({
      conceptName,
      qualityName,
      enableDiameter
    })
  )
}

// ============================================
// Phase 5E: SYNC MANAGED TOGGLE
// ============================================

/**
 * Toggle syncManaged status for a concept
 * Uses strativerse_toggle_sync_managed SCP tool via Induction
 * Citation: SUITE-5-6-STRATIVERSE-LANDING-PAGE-ENHANCEMENT-ROADMAP.md Phase D
 */
function toggleSyncManaged(conceptName: string, currentSyncManaged: boolean, projectName: string = 'ADMIN_SCP') {
  if (!muxium) {
    console.error('[StratiVERSE Client] Muxium not initialized')
    return
  }

  const enableSync = !currentSyncManaged
  console.log('[StratiVERSE Client] Toggling syncManaged:', {
    conceptName,
    projectName,
    enableSync
  })

  // Dispatch via Induction pattern - routes through WebSocket to server
  // Server calls strativerse_toggle_sync_managed SCP tool
  muxium.dispatch(
    (muxium as Muxium<LandingDeck>).deck.d.client.d.strativerse.e.strativerseTriggerToggleSyncManaged({
      conceptName,
      projectName,
      enableSync
    })
  )
}

// ============================================
// CLIENT MUXIUM CREATION (Tier-Gating)
// ============================================

onMounted(() => {
  if (typeof window === 'undefined') return;

  // CREATE ClientMuxium with StratiVERSE CLIENT and Notification MuxonomicConcepts
  // THIS IS TIER-GATING: Only this page has access to strativerse + notification concepts
  // Uses CLIENT-SPECIFIC concept with dummy qualities for tree-shaking
  // Full muxification workflow handled by createClientMuxiumInstance
  // Generic type parameter provides type-safe deck access
  //
  // POC 2.4: Notification concept muxified for popup display
  // Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
  muxium = createClientMuxiumInstance<LandingDeck>([
    createMuxonomicStrativerseClient(),  // StratiVERSE CLIENT concept (no fs/path)
    createMuxonomicNotification(),       // Notification concept with display principle
  ], {
    title: 'StrativerseLanding',
    logging: true,
    storeDialog: true,
  })

  // Provide muxium for any child components
  provide('muxium', muxium)

  // POC 2.1: Ready State Self-Query Pattern with Induction
  // Citation: STRATIMUX-VUE-REFERENCE.md - "Proper State Subscription Pattern"
  // Citation: STRATIMUX-REFERENCE.md - "🎯 DECK K Constant Pattern - Reactive State Access"
  // Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
  //
  // Two-Stage Induction Pattern:
  // Stage 0: Observe connection, dispatch scan request when Ready State detected (Induction routes to server)
  // Stage 1: Monitor for conceptList updates via state sync
  stagePlanner = muxium.plan<LandingDeck>('strativerseClientInduction', ({ staging, stage, d__, d_ }) => staging(() => {
    console.log('[StratiVERSE Client] Induction plan initialized');
    return [
      // ============================================
      // STAGE 0: Ready State Detection & Self-Query
      // ============================================
      stage(
        ({ d, dispatch }) => {
          const connected = d.client.d.webSocketClient.k.isConnected.select()
          isConnected.value = connected

          if (connected) {
            // Ready State Detected - dispatch trigger scan via Induction
            // Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
            //
            // Trigger Scan Pattern:
            // - Direct dispatch to triggerScan Induction quality
            // - Induction wraps with strategyDetermine (clientStateKey routing)
            // - webSocketClient.principle sends via WebSocket
            // - Server creates full manifold strategy with clientStateKey
            // - Response routes back to this client
            console.log('[StratiVERSE Client] Ready State detected, triggering scan via Induction');

            // Direct dispatch - Induction pattern wraps with strategyDetermine
            dispatch(
              d.client.d.strativerse.e.strativerseTriggerScan({}),
              { setStage: 1 }
            );
          } else {
            // Not yet connected - continue monitoring via selector
            // No dispatch needed, selector will re-fire when isConnected changes
            console.log('[StratiVERSE Client] Waiting for connection...');
          }
        },
        {
          // Selector-based reactivity: fires when isConnected changes
          selectors: [d__.client.d.webSocketClient.k.isConnected]
        }
      ),

      // ============================================
      // STAGE 1: ConceptList + ManagedProjects Monitoring
      // Phase 5E: Added managedProjects sync for dual-view
      // ============================================
      stage(
        ({ d }) => {
          // Monitor conceptList and managedProjects updates via state sync
          // Server processes scan, updates state, broadcasts via WebSocket
          const list = d.client.d.strativerse.k.conceptList.select()
          const projects = d.client.d.strativerse.k.managedProjects.select()
          const connected = d.client.d.webSocketClient.k.isConnected.select()
          isConnected.value = connected

          if (list) {
            console.log('[StratiVERSE Client] ConceptList received via Induction:', list.concepts.length, 'concepts');
            conceptList.value = list
            lastUpdated.value = new Date(list.lastScan).toLocaleString()
            isLoading.value = false
          }

          // Sync managedProjects for dual-view
          if (projects) {
            console.log('[StratiVERSE Client] ManagedProjects received:', projects.length, 'projects');
            managedProjects.value = projects
          }
        },
        {
          // Reactive selectors - fires when conceptList, managedProjects, or connection changes
          selectors: [
            d__.client.d.strativerse.k.conceptList,
            d__.client.d.strativerse.k.managedProjects,
            d__.client.d.webSocketClient.k.isConnected
          ]
        }
      )
    ]
  }))
})

onUnmounted(() => {
  if (stagePlanner) {
    stagePlanner.conclude()
  }
  if (muxium) {
    muxium.close()
  }
})

// ============================================
// RENDERING MODE INDICATOR
// ============================================

const renderMode = computed(() => {
  if (typeof window === 'undefined') return 'SSR'
  return isConnected.value ? 'Client (Connected)' : 'Client (Connecting)'
})
</script>

<template>
  <div class="strativerse-view">
    <header class="view-header">
      <h1>StratiVERSE</h1>
      <p class="subtitle">Concept Library Manager (Vue SSR)</p>
    </header>

    <main class="view-content">
      <!-- Status Panel -->
      <section class="status-panel">
        <h2>Scan Status</h2>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">State</span>
            <span :class="['status-value', isLoading ? 'loading' : 'ready']">
              {{ isLoading ? 'Loading...' : 'Ready' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Last Scan</span>
            <span class="status-value mono">
              {{ lastUpdated || 'Never' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Managed</span>
            <span class="status-value managed-count">
              {{ managedCount }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Unmanaged</span>
            <span class="status-value unmanaged-count">
              {{ unmanagedCount }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Render Mode</span>
            <span class="status-value ssr-indicator">
              {{ renderMode }}
            </span>
          </div>
        </div>
      </section>

      <!-- Phase 5E: Control Bar - Project Selector + View Mode Toggle -->
      <section class="control-bar">
        <div class="control-group">
          <label class="control-label">Project</label>
          <ScsDropdown
            v-model="selectedProject"
            class="project-selector"
            :options="projectOptions"
            :disabled="viewMode === 'library'"
          />
        </div>
        <div class="control-group">
          <label class="control-label">View</label>
          <div class="view-toggle">
            <button
              :class="['toggle-btn', viewMode === 'project' && 'active']"
              @click="viewMode = 'project'"
            >Project</button>
            <button
              :class="['toggle-btn', viewMode === 'library' && 'active']"
              @click="viewMode = 'library'"
            >Library ({{ syncManagedCount }})</button>
          </div>
        </div>
        <div class="control-group connection-status">
          <span :class="['status-dot', isConnected ? 'connected' : 'disconnected']"></span>
          <span class="status-text">{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </section>

      <!-- Concept Library Panel -->
      <section class="concepts-panel">
        <div class="panel-header">
          <h2>{{ viewMode === 'library' ? 'Concept Library' : `${selectedProject} Concepts` }}</h2>
          <div class="filter-controls">
            <button
              :class="['filter-btn', filterStatus === 'all' && 'active']"
              @click="filterStatus = 'all'"
            >All ({{ displayConcepts.length }})</button>
            <button
              :class="['filter-btn', filterStatus === 'managed' && 'active']"
              @click="filterStatus = 'managed'"
            >Managed ({{ managedCount }})</button>
            <button
              :class="['filter-btn', filterStatus === 'unmanaged' && 'active']"
              @click="filterStatus = 'unmanaged'"
            >Unmanaged ({{ unmanagedCount }})</button>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          <p>Waiting for server state sync...</p>
          <p class="hint">Make sure the server is running and WebSocket is connected.</p>
        </div>

        <div v-else-if="sortedConcepts.length === 0" class="empty-state">
          <p>No concepts found matching filter.</p>
        </div>

        <div v-else class="concepts-table">
          <!-- Table Header - Phase 5E: Added sync, version, source columns -->
          <div :class="['table-header', viewMode === 'library' ? 'library-view' : 'project-view']">
            <div class="col-expand"></div>
            <div class="col-name">Concept</div>
            <div class="col-sync">Sync</div>
            <div class="col-version">Ver</div>
            <div v-if="viewMode === 'library'" class="col-source">Source</div>
            <div class="col-status">Status</div>
            <div class="col-demometers">Demometers</div>
          </div>

          <!-- Concept Rows -->
          <div
            v-for="concept in sortedConcepts"
            :key="concept.name + (concept.sourceProject || '')"
            class="concept-row-container"
          >
            <!-- Main Row (Clickable) -->
            <div
              :class="['concept-row', expandedConcept === concept.name && 'expanded', viewMode === 'library' ? 'library-view' : 'project-view']"
              @click="toggleConcept(concept.name)"
            >
              <div class="col-expand">
                <span class="expand-icon">{{ expandedConcept === concept.name ? '▼' : '▶' }}</span>
              </div>
              <div class="col-name">
                <span class="concept-icon">⬡</span>
                <span class="concept-name">{{ concept.name }}</span>
              </div>
              <div class="col-sync" @click.stop>
                <button
                  :class="['sync-toggle', concept.muxonomyConfig?.syncManaged ? 'synced' : 'not-synced']"
                  @click="toggleSyncManaged(concept.name, concept.muxonomyConfig?.syncManaged ?? false, concept.sourceProject || selectedProject)"
                  :title="concept.muxonomyConfig?.syncManaged ? 'Remove from Library' : 'Add to Library'"
                >
                  {{ concept.muxonomyConfig?.syncManaged ? '✓' : '○' }}
                </button>
              </div>
              <div class="col-version">
                <span class="version-badge">{{ concept.muxonomyConfig?.syncVersion ?? 0 }}</span>
              </div>
              <div v-if="viewMode === 'library'" class="col-source">
                <span class="source-badge">{{ concept.sourceProject }}</span>
              </div>
              <div class="col-status">
                <span :class="['status-badge', concept.hasMuxonomy ? 'managed' : 'unmanaged']">
                  {{ concept.hasMuxonomy ? 'Managed' : 'Unmanaged' }}
                </span>
              </div>
              <div class="col-demometers">
                <span class="demometer-badge quality">Q:{{ concept.qualities.length }}</span>
                <span class="demometer-badge principle">P:{{ concept.principles.length }}</span>
                <span class="demometer-badge strategy">S:{{ concept.strategies.length }}</span>
              </div>
            </div>

            <!-- Breakout Panel (Hamburger Expansion) -->
            <div v-if="expandedConcept === concept.name" class="breakout-panel">
              <!-- Tab Navigation -->
              <div class="breakout-tabs">
                <button
                  :class="['tab-btn', activeTab === 'qualities' && 'active']"
                  @click.stop="activeTab = 'qualities'"
                >Qualities ({{ concept.qualities.length }})</button>
                <button
                  :class="['tab-btn', activeTab === 'principles' && 'active']"
                  @click.stop="activeTab = 'principles'"
                >Principles ({{ concept.principles.length }})</button>
                <button
                  :class="['tab-btn', activeTab === 'strategies' && 'active']"
                  @click.stop="activeTab = 'strategies'"
                >Strategies ({{ concept.strategies.length }})</button>
                <button
                  :class="['tab-btn', activeTab === 'state' && 'active']"
                  @click.stop="activeTab = 'state'"
                >State ({{ concept.stateFields.length }})</button>
              </div>

              <!-- Tab Content -->
              <div class="breakout-content">
                <!-- Qualities Tab -->
                <div v-if="activeTab === 'qualities'" class="tab-content">
                  <div v-if="concept.qualities.length === 0" class="empty-tab">
                    No qualities found
                  </div>
                  <div v-else class="aspect-list">
                    <div v-for="quality in concept.qualities" :key="quality.name" class="aspect-item">
                      <span class="aspect-icon">⬡</span>
                      <div class="aspect-info">
                        <span class="aspect-name">{{ quality.name }}</span>
                        <span class="aspect-type">{{ quality.typeString }}</span>
                      </div>
                      <div class="aspect-badges">
                        <!-- POC 2.3b: Deployment target selector (Managed only) -->
                        <select
                          v-if="concept.hasMuxonomy"
                          :class="['deployment-select', getDeploymentClass(quality.deploymentTarget)]"
                          :value="quality.deploymentTarget"
                          @change="onDeploymentTargetChange($event, concept.name, 'quality', quality.name)"
                          @click.stop
                          title="Select deployment target"
                        >
                          <option :value="DeploymentTarget.All">All</option>
                          <option :value="DeploymentTarget.Huirth">Huirth</option>
                          <option :value="DeploymentTarget.Client">Client</option>
                        </select>
                        <span v-else :class="['deployment-badge', getDeploymentClass(quality.deploymentTarget)]">
                          {{ getDeploymentLabel(quality.deploymentTarget) }}
                        </span>
                        <!-- POC 2.3b: Clickable diameter toggle (Managed only, not for All target) -->
                        <button
                          v-if="concept.hasMuxonomy"
                          :class="['diameter-toggle', quality.diameter ? 'active' : '', quality.deploymentTarget === DeploymentTarget.All ? 'disabled' : '']"
                          :title="quality.deploymentTarget === DeploymentTarget.All ? 'Cannot enable diameter on All target' : (quality.diameter ? 'Disable Induction' : 'Enable Induction')"
                          :disabled="quality.deploymentTarget === DeploymentTarget.All && !quality.diameter"
                          @click.stop="toggleDiameterOnQuality(concept.name, quality.name, quality.diameter, quality.deploymentTarget)"
                        >
                          ◈
                        </button>
                        <span v-else-if="quality.diameter" class="diameter-badge" title="Induction Quality">◈</span>
                        <span v-if="quality.hasPayload" class="payload-badge" title="Has Payload">⊕</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Principles Tab -->
                <div v-if="activeTab === 'principles'" class="tab-content">
                  <div v-if="concept.principles.length === 0" class="empty-tab">
                    No principles found
                  </div>
                  <div v-else class="aspect-list">
                    <div v-for="principle in concept.principles" :key="principle.name" class="aspect-item">
                      <span class="aspect-icon">◇</span>
                      <div class="aspect-info">
                        <span class="aspect-name">{{ principle.name }}</span>
                        <span class="aspect-file">{{ principle.fileName }}</span>
                      </div>
                      <div class="aspect-badges">
                        <!-- POC 2.3b: Deployment target selector (Managed only, no diameter for principles) -->
                        <select
                          v-if="concept.hasMuxonomy"
                          :class="['deployment-select', getDeploymentClass(principle.deploymentTarget)]"
                          :value="principle.deploymentTarget"
                          @change="onDeploymentTargetChange($event, concept.name, 'principle', principle.name)"
                          @click.stop
                          title="Select deployment target"
                        >
                          <option :value="DeploymentTarget.All">All</option>
                          <option :value="DeploymentTarget.Huirth">Huirth</option>
                          <option :value="DeploymentTarget.Client">Client</option>
                        </select>
                        <span v-else :class="['deployment-badge', getDeploymentClass(principle.deploymentTarget)]">
                          {{ getDeploymentLabel(principle.deploymentTarget) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Strategies Tab -->
                <div v-if="activeTab === 'strategies'" class="tab-content">
                  <div v-if="concept.strategies.length === 0" class="empty-tab">
                    No strategies found
                  </div>
                  <div v-else class="aspect-list">
                    <div v-for="strategy in concept.strategies" :key="strategy.name" class="aspect-item">
                      <span class="aspect-icon">⟡</span>
                      <div class="aspect-info">
                        <span class="aspect-name">{{ strategy.name }}</span>
                        <span class="aspect-file">{{ strategy.fileName }}</span>
                      </div>
                      <div class="aspect-badges">
                        <span class="inferred-badge" title="Deployment inferred from usage">Inferred</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- State Tab -->
                <div v-if="activeTab === 'state'" class="tab-content">
                  <div v-if="concept.stateFields.length === 0" class="empty-tab">
                    No state fields found
                  </div>
                  <div v-else>
                    <div class="state-type-name">{{ concept.stateTypeName || 'State Type' }}</div>
                    <div class="aspect-list">
                      <div v-for="field in concept.stateFields" :key="field.name" class="aspect-item state-field">
                        <span class="aspect-icon">○</span>
                        <div class="aspect-info">
                          <span class="aspect-name">
                            {{ field.name }}{{ field.isOptional ? '?' : '' }}
                          </span>
                          <span class="aspect-type type-string">{{ field.typeString }}</span>
                        </div>
                        <div class="aspect-badges">
                          <span v-if="field.isArray" class="type-badge array">[]</span>
                          <span v-if="field.isBaseType" class="type-badge base">Base</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Future: Code Transparency Placeholder -->
              <div class="code-transparency-placeholder">
                <span class="placeholder-icon">🔮</span>
                <span class="placeholder-text">Code transparency view coming in future PoC</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Info Panel -->
      <section class="info-panel">
        <h2>StratiVERSE Trajectory</h2>
        <div class="info-content">
          <p>Concept Library Manager evolving toward Project Manager with cascading changes.</p>
          <div class="legend">
            <h3>Legend</h3>
            <div class="legend-items">
              <div class="legend-item"><span class="demometer-badge quality">Q</span> Qualities (Actions)</div>
              <div class="legend-item"><span class="demometer-badge principle">P</span> Principles (Behaviors)</div>
              <div class="legend-item"><span class="demometer-badge strategy">S</span> Strategies (Orchestration)</div>
              <div class="legend-item"><span class="diameter-badge">◈</span> Induction Quality (Diameter)</div>
              <div class="legend-item"><span class="payload-badge">⊕</span> Has Payload</div>
            </div>
          </div>
          <div class="deployment-legend">
            <h3>Deployment Targets</h3>
            <div class="legend-items">
              <div class="legend-item"><span class="deployment-badge target-all">All</span> Both Huirth + Client</div>
              <div class="legend-item"><span class="deployment-badge target-huirth">Huirth</span> Server-only</div>
              <div class="legend-item"><span class="deployment-badge target-client">Client</span> Client-only</div>
            </div>
          </div>
          <div class="interactive-legend">
            <h3>POC 2.3b: Interactive Controls (Managed Only)</h3>
            <div class="legend-items">
              <div class="legend-item"><span class="deployment-badge target-all clickable">All</span> Click to cycle target</div>
              <div class="legend-item"><button class="diameter-toggle">◈</button> Toggle Induction (not for All)</div>
            </div>
          </div>
          <p class="note">
            <strong>PoC 2.3b:</strong> Muxonomy Modification for Managed Concepts.
            Click deployment targets to cycle (All → Huirth → Client → All).
            Toggle ◈ to enable/disable Induction pattern on qualities.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.strativerse-view {
  min-height: 100vh;
  background: #0f0f1a;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #e5e5e5;
}

.view-header {
  text-align: center;
  margin-bottom: 2rem;
}

.view-header h1 {
  color: #4ade80;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #9ca3af;
  font-size: 0.875rem;
}

.view-content {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Panels */
.status-panel,
.concepts-panel,
.info-panel {
  background: #1a1a2e;
  border: 1px solid #2d2d44;
  border-radius: 8px;
  padding: 1.5rem;
}

.status-panel h2,
.concepts-panel h2,
.info-panel h2 {
  color: #4ade80;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  margin-top: 0;
}

/* Status Grid */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-label {
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.status-value {
  color: #f3f4f6;
  font-size: 1rem;
}

.status-value.loading {
  color: #fbbf24;
}

.status-value.ready {
  color: #4ade80;
}

.status-value.mono {
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
}

.status-value.ssr-indicator {
  color: #60a5fa;
  font-weight: 600;
}

.status-value.managed-count {
  color: #4ade80;
  font-weight: 600;
}

.status-value.unmanaged-count {
  color: #fbbf24;
  font-weight: 600;
}

/* Panel Header with Filter Controls */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.panel-header h2 {
  margin-bottom: 0;
}

.filter-controls {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.375rem 0.75rem;
  background: #0f0f1a;
  border: 1px solid #2d2d44;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #4ade80;
  color: #e5e5e5;
}

.filter-btn.active {
  background: #4ade80;
  border-color: #4ade80;
  color: #0f0f1a;
  font-weight: 600;
}

/* Concepts Table */
.concepts-table {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.table-header {
  display: grid;
  grid-template-columns: 2rem 1fr 3rem 3rem 7rem 10rem;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: #0f0f1a;
  border-radius: 4px 4px 0 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 600;
}

/* Phase 5E: Library view has extra source column */
.table-header.library-view {
  grid-template-columns: 2rem 1fr 3rem 3rem 6rem 7rem 10rem;
}

.concept-row-container {
  border-bottom: 1px solid #2d2d44;
}

.concept-row-container:last-child {
  border-bottom: none;
}

.concept-row {
  display: grid;
  grid-template-columns: 2rem 1fr 3rem 3rem 7rem 10rem;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #1a1a2e;
  cursor: pointer;
  transition: background 0.2s ease;
}

/* Phase 5E: Library view has extra source column */
.concept-row.library-view {
  grid-template-columns: 2rem 1fr 3rem 3rem 6rem 7rem 10rem;
}

.concept-row:hover {
  background: #252540;
}

.concept-row.expanded {
  background: #252540;
  border-bottom: 1px solid #4ade80;
}

.col-expand {
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-icon {
  color: #6b7280;
  font-size: 0.75rem;
  transition: color 0.2s ease;
}

.concept-row:hover .expand-icon,
.concept-row.expanded .expand-icon {
  color: #4ade80;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.concept-icon {
  color: #4ade80;
  font-size: 1rem;
}

.concept-name {
  color: #f3f4f6;
  font-weight: 500;
  font-family: monospace;
}

/* Status Badges */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.managed {
  background: #4ade80;
  color: #0f0f1a;
}

.status-badge.unmanaged {
  background: #fbbf24;
  color: #0f0f1a;
}

/* Demometer Badges */
.col-demometers {
  display: flex;
  gap: 0.5rem;
}

.demometer-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.625rem;
  font-weight: 600;
  font-family: monospace;
}

.demometer-badge.quality {
  background: #3b82f6;
  color: white;
}

.demometer-badge.principle {
  background: #8b5cf6;
  color: white;
}

.demometer-badge.strategy {
  background: #ec4899;
  color: white;
}

/* Breakout Panel */
.breakout-panel {
  background: #0f0f1a;
  border-left: 3px solid #4ade80;
  margin-left: 2rem;
  padding: 1rem;
}

.breakout-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #2d2d44;
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #e5e5e5;
  background: #252540;
}

.tab-btn.active {
  color: #4ade80;
  background: #252540;
  font-weight: 600;
}

.breakout-content {
  min-height: 100px;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.empty-tab {
  color: #6b7280;
  font-style: italic;
  padding: 1rem;
  text-align: center;
}

/* Aspect List (Qualities, Principles, Strategies, State) */
.aspect-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.aspect-item {
  display: grid;
  grid-template-columns: 1.5rem 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #1a1a2e;
  border-radius: 4px;
}

.aspect-icon {
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
}

.aspect-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.aspect-name {
  color: #e5e5e5;
  font-family: monospace;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.aspect-type,
.aspect-file {
  color: #6b7280;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.aspect-type.type-string {
  font-family: monospace;
  color: #a78bfa;
}

.aspect-badges {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

/* Deployment Badges */
.deployment-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.625rem;
  font-weight: 600;
}

.deployment-badge.target-all {
  background: #4ade80;
  color: #0f0f1a;
}

.deployment-badge.target-huirth {
  background: #3b82f6;
  color: white;
}

.deployment-badge.target-client {
  background: #f97316;
  color: white;
}

/* POC 2.3b: Deployment Target Selector */
.deployment-select {
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.625rem;
  font-weight: 600;
  border: 1px solid #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.25rem center;
  padding-right: 1rem;
}

.deployment-select:hover {
  border-color: #4ade80;
}

.deployment-select:focus {
  outline: none;
  border-color: #4ade80;
  box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
}

.deployment-select.target-all {
  background-color: #4ade80;
  color: #0f0f1a;
}

.deployment-select.target-huirth {
  background-color: #3b82f6;
  color: white;
}

.deployment-select.target-client {
  background-color: #f97316;
  color: white;
}

.deployment-select option {
  background: #1a1a2e;
  color: #e5e7eb;
}

/* POC 2.3b: Diameter Toggle Button */
.diameter-toggle {
  width: 1.25rem;
  height: 1.25rem;
  border: 1px solid #374151;
  border-radius: 3px;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.diameter-toggle:hover:not(.disabled) {
  border-color: #fbbf24;
  color: #fbbf24;
}

.diameter-toggle.active {
  background: #fbbf24;
  border-color: #fbbf24;
  color: #0f0f1a;
}

.diameter-toggle.active:hover {
  background: #f59e0b;
  border-color: #f59e0b;
}

.diameter-toggle.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Special Badges */
.diameter-badge {
  color: #fbbf24;
  font-size: 0.875rem;
}

.payload-badge {
  color: #a78bfa;
  font-size: 0.75rem;
}

.inferred-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.625rem;
  background: #374151;
  color: #9ca3af;
}

/* State Tab Specifics */
.state-type-name {
  color: #a78bfa;
  font-family: monospace;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: #1a1a2e;
  border-radius: 4px;
  border-left: 3px solid #a78bfa;
}

.type-badge {
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
  font-size: 0.625rem;
  font-family: monospace;
}

.type-badge.array {
  background: #3b82f6;
  color: white;
}

.type-badge.base {
  background: #374151;
  color: #9ca3af;
}

/* Code Transparency Placeholder */
.code-transparency-placeholder {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #1a1a2e;
  border: 1px dashed #2d2d44;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.75rem;
}

.placeholder-icon {
  font-size: 1rem;
}

/* Empty/Loading States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

/* Info Panel */
.info-content {
  color: #9ca3af;
  line-height: 1.6;
}

.info-content p {
  margin-bottom: 0.75rem;
  margin-top: 0;
}

.info-content h3 {
  color: #e5e5e5;
  font-size: 0.75rem;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  margin-top: 0;
}

.legend,
.deployment-legend,
.interactive-legend {
  margin: 1rem 0;
  padding: 1rem;
  background: #0f0f1a;
  border-radius: 4px;
}

.interactive-legend {
  border: 1px dashed #4ade80;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.info-content code {
  background: #0f0f1a;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.875rem;
}

.info-content .note {
  margin-top: 1rem;
  padding: 1rem;
  background: #0f0f1a;
  border-left: 3px solid #a78bfa;
  border-radius: 0 4px 4px 0;
}

/* ============================================
   Phase 5E: Control Bar + New Column Styles
   ============================================ */

/* Control Bar */
.control-bar {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 1.5rem;
  background: #1a1a2e;
  border: 1px solid #2d2d44;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.control-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 600;
}

/* SB-DS6 · ScsDropdown replaces the native project <select>; this class lands on the dropdown
   trigger via $attrs (scoped → wins over the component's own trigger chrome), preserving the
   original look. min-width keeps the row width; the green open-state accent matches the retired
   select's focus edge; ScsDropdown owns the :disabled trigger styling. */
.project-selector {
  background: #0f0f1a;
  border: 1px solid #2d2d44;
  color: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
  cursor: pointer;
  min-width: 160px;
  --dropdown-accent: #4ade80;
}

.project-selector:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.view-toggle {
  display: flex;
  background: #0f0f1a;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #2d2d44;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: #f3f4f6;
  background: #252540;
}

.toggle-btn.active {
  background: #4ade80;
  color: #0f0f1a;
}

.connection-status {
  margin-left: auto;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.connected {
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}

.status-dot.disconnected {
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
}

.status-text {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Sync Toggle Column */
.col-sync {
  display: flex;
  justify-content: center;
}

.sync-toggle {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid #2d2d44;
  background: transparent;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sync-toggle:hover {
  border-color: #4ade80;
  color: #4ade80;
}

.sync-toggle.synced {
  background: #4ade80;
  border-color: #4ade80;
  color: #0f0f1a;
}

.sync-toggle.synced:hover {
  background: #22c55e;
  border-color: #22c55e;
}

/* Version Column */
.col-version {
  display: flex;
  justify-content: center;
}

.version-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.625rem;
  font-family: monospace;
  font-weight: 600;
  background: #374151;
  color: #9ca3af;
}

/* Source Column (Library view only) */
.col-source {
  display: flex;
  justify-content: center;
}

.source-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  font-size: 0.625rem;
  font-family: monospace;
  font-weight: 600;
  background: #1e40af;
  color: #93c5fd;
}

/* Responsive */
@media (max-width: 768px) {
  .table-header {
    display: none;
  }

  .concept-row {
    grid-template-columns: 2rem 1fr;
    grid-template-rows: auto auto;
  }

  .col-status,
  .col-demometers {
    grid-column: 2;
    justify-self: start;
  }

  .breakout-tabs {
    flex-wrap: wrap;
  }

  .filter-controls {
    width: 100%;
    justify-content: center;
  }
}
</style>
