<script setup lang="ts">
/**
 * Notification Landing Page (SSR + Client Muxium Creation)
 *
 * Test interface for the Notification Bridge system.
 * Demonstrates Zero-Knowledge pattern: Landing only creates base ClientMuxium,
 * notification capability is built into the base.
 *
 * Architecture: concept/vue/NotificationLanding.vue
 * Pattern: Each concept owns its Vue pages
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md - Phase 6
 * Citation: STRATIMUX-VUE-REFERENCE.md - "Proper State Subscription Pattern"
 * Citation: 3-Tier Application Architecture Discovery
 *
 * Key Pattern:
 * - NO additional MuxonomicConcepts needed (notification in BASE)
 * - Access via d.client.d.notification.k.notifications
 * - IslandWrapper provides NotificationPopup (zero-knowledge)
 *
 * Type: 'Notification Landing' (Verbose Split)
 */
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
import type { Notification, NotificationPriority } from '../notification.type';
// Cycle 159 D1 · GPIM · Vue-layer Muxium binding into universal scsBridge controller
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
import ScsInput from '../../vue/components/ScsInput.vue';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../vue/components/ScsDropdown.vue';

// ============================================
// REACTIVE STATE
// ============================================

const notifications = ref<Notification[]>([]);
const notificationCount = ref<number>(0);
const isConnected = ref<boolean>(false);
const selectedPriority = ref<NotificationPriority>('cobalt');
const customMessage = ref<string>('');

// Muxium instance and stage planner
let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: any = null;

// Priority options for test buttons
const priorityOptions: { value: NotificationPriority; label: string; color: string }[] = [
  { value: 'maroon', label: 'Maroon (Critical)', color: '#800000' },
  { value: 'rust', label: 'Rust (Warning)', color: '#b7410e' },
  { value: 'ochre', label: 'Ochre (Info)', color: '#cc7722' },
  { value: 'viridian', label: 'Viridian (Success)', color: '#40826d' },
  { value: 'cobalt', label: 'Cobalt (System)', color: '#0047ab' },
  { value: 'amethyst', label: 'Amethyst (Debug)', color: '#9966cc' },
  { value: 'rose', label: 'Rose (Diagnostic)', color: '#ff007f' },
];

// SB-DS6 · priorityOptions mapped to the ScsDropdown {value,label} shape (the color feeds the
// existing preview swatch, not the dropdown row). value === the NotificationPriority string.
const priorityDropdownOptions = priorityOptions.map((o) => ({ value: o.value, label: o.label }));

// ============================================
// TEST ACTIONS
// ============================================

/**
 * Dispatch Hello World notification (DEFAULT — no payload)
 * Tests the Induction pattern based on current deployment target.
 * Backward-compat: dispatch with no arguments → defaults to
 * 'Hello World from StratiVERSE!' + viridian priority + 5000ms duration.
 */
function testHelloWorld() {
  if (!muxium) {
    console.error('[Notification Landing] Muxium not initialized');
    return;
  }

  console.log('[Notification Landing] Dispatching Hello World (default payload)');
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.notification.e.notificationHelloWorld(),
  );
}

/**
 * Dispatch Hello World notification with CUSTOM payload.
 * Demonstrates the generalized variant (Phase 3 Cobalt-C 2026-05-19) —
 * the Quality now accepts NotificationHelloWorldPayload with optional
 * message, priority, duration, and origin. Diameter contract preserved:
 * payload flows through Induction → actionQue → WebSocket → Huirth Real.
 *
 * Citation: SUITE-4-VIRIDIAN §7 Generalization Path.
 */
function testCustomHello() {
  if (!muxium) {
    console.error('[Notification Landing] Muxium not initialized');
    return;
  }

  console.log('[Notification Landing] Dispatching Custom Hello (payload variant)');
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.notification.e.notificationHelloWorld({
      notificationMessage: 'Custom message from generalized Quality',
      notificationPriority: 'cobalt',
      notificationDuration: 3000,
    }),
  );
}

/**
 * Dispatch custom notification with selected priority
 */
function testCustomNotification() {
  if (!muxium) {
    console.error('[Notification Landing] Muxium not initialized');
    return;
  }

  const message = customMessage.value.trim() || `Test notification (${selectedPriority.value})`;

  console.log('[Notification Landing] Dispatching custom notification:', {
    message,
    priority: selectedPriority.value,
  });

  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.notification.e.notificationAddNotification(
      {
        message,
        notificationPriority: selectedPriority.value,
        notificationOrigin: 'local',
      },
    ),
  );

  // Clear custom message after dispatch
  customMessage.value = '';
}

/**
 * Clear all notifications
 */
function clearAllNotifications() {
  if (!muxium || notifications.value.length === 0) return;

  console.log('[Notification Landing] Clearing all notifications');

  // Clear each notification individually
  for (const notification of notifications.value) {
    muxium.dispatch(
      (
        muxium as Muxium<ClientMuxiumDeck>
      ).deck.d.client.d.notification.e.notificationClearNotification({
        id: notification.id,
      }),
    );
  }
}

/**
 * Test each priority level
 */
function testAllPriorities() {
  if (!muxium) return;

  console.log('[Notification Landing] Testing all priority levels');

  priorityOptions.forEach((option, index) => {
    setTimeout(() => {
      muxium!.dispatch(
        (
          muxium as Muxium<ClientMuxiumDeck>
        ).deck.d.client.d.notification.e.notificationAddNotification({
          message: `Suite ${index + 1}: ${option.label}`,
          notificationPriority: option.value,
          notificationOrigin: 'local',
          duration: 5000,
        }),
      );
    }, index * 300); // Stagger dispatch for visual effect
  });
}

// ============================================
// CLIENT MUXIUM CREATION (Base Only - Zero Knowledge)
// ============================================

onMounted(() => {
  if (typeof window === 'undefined') return;

  // CREATE ClientMuxium with BASE CONCEPTS ONLY
  // Notification is already in BASE_CONCEPTS_CREATORS
  // Zero-Knowledge: This landing doesn't need to import notification concept
  //
  // Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
  // Citation: 3-Tier Application Architecture Discovery
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [], // No additional MuxonomicConcepts - notification is in BASE
    {
      title: 'NotificationLanding',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  // Subscribe to notification state
  // Citation: STRATIMUX-REFERENCE.md - "🎯 DECK K Constant Pattern"
  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'notificationLandingSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => {
        console.log('[Notification Landing] Subscription plan initialized');
        return [
          // ============================================
          // STAGE 0: Monitor Notifications and Connection
          // ============================================
          stage(
            ({ d }) => {
              // Access notification state via base client muxification
              const notificationList = d.client.d.notification.k.notifications.select();
              const connected = d.client.d.webSocketClient.k.isConnected.select();

              notifications.value = notificationList;
              notificationCount.value = notificationList.length;
              isConnected.value = connected;

              console.log('[Notification Landing] State updated:', {
                notifications: notificationList.length,
                connected,
              });
            },
            {
              // Reactive selectors - fires when notifications or connection changes
              selectors: [
                d__.client.d.notification.k.notifications,
                d__.client.d.webSocketClient.k.isConnected,
              ],
            },
          ),
        ];
      }),
  );
});

onUnmounted(() => {
  // GPIM cleanup · unbind controller from this landing's Muxium
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  if (stagePlanner) {
    stagePlanner.conclude();
  }
  if (muxium) {
    muxium.close();
  }
});

// ============================================
// HELPERS
// ============================================

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

function getPriorityColor(priority: NotificationPriority): string {
  const option = priorityOptions.find((o) => o.value === priority);
  return option?.color ?? '#374151';
}
</script>

<template>
  <div class="notification-landing">
    <header class="landing-header">
      <h1 class="hifi-heading spectrum-text">Notification Bridge</h1>
      <p class="subtitle hifi-label">POC 2.4 Test Interface</p>
    </header>

    <main class="landing-content">
      <!-- Status Panel -->
      <section class="status-panel hifi-pane-blue">
        <h2 class="hifi-heading">System Status</h2>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">Connection</span>
            <span :class="['status-value', isConnected ? 'connected' : 'disconnected']">
              {{ isConnected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Active Notifications</span>
            <span class="status-value count">{{ notificationCount }}</span>
          </div>
        </div>
      </section>

      <!-- Test Controls Panel -->
      <section class="test-panel hifi-pane-base">
        <h2 class="hifi-heading">Test Controls</h2>

        <!-- Hello World Test -->
        <div class="test-section">
          <h3>Hello World (Induction Test)</h3>
          <p class="test-description">
            Dispatches the Hello World quality. Deployment target determines local (Client) or
            global (Huirth) execution. The DEFAULT button dispatches with no payload (backward-compat
            — falls back to the canonical 'Hello World from StratiVERSE!' message). The CUSTOM button
            dispatches the generalized payload variant
            <code>{ notificationMessage, notificationPriority, notificationDuration }</code>.
          </p>
          <div class="hello-world-buttons">
            <button class="hifi-btn hifi-btn-green" @click="testHelloWorld">
              Hello World (Default)
            </button>
            <button class="hifi-btn hifi-btn-blue" @click="testCustomHello">
              Custom Hello (Payload)
            </button>
          </div>
        </div>

        <!-- Custom Notification Test -->
        <div class="test-section">
          <h3>Custom Notification</h3>
          <div class="custom-form">
            <ScsInput
              v-model="customMessage"
              type="text"
              placeholder="Enter message (optional)"
              class="message-input"
              @keyup.enter="testCustomNotification"
            />
            <ScsDropdown
              :options="priorityDropdownOptions"
              :model-value="selectedPriority"
              class="priority-select"
              @update:model-value="(v) => { selectedPriority = v as NotificationPriority; }"
            />
            <button class="hifi-btn hifi-btn-blue" @click="testCustomNotification">
              Send Notification
            </button>
          </div>
        </div>

        <!-- Bulk Tests -->
        <div class="test-section">
          <h3>Bulk Tests</h3>
          <div class="bulk-buttons">
            <button class="hifi-btn hifi-btn-purple" @click="testAllPriorities">
              Test All Priorities
            </button>
            <button
              class="hifi-btn hifi-btn-red"
              :disabled="notificationCount === 0"
              @click="clearAllNotifications"
            >
              Clear All ({{ notificationCount }})
            </button>
          </div>
        </div>
      </section>

      <!-- Notification Queue Panel -->
      <section class="queue-panel hifi-pane-onyx">
        <h2 class="hifi-heading">Notification Queue</h2>
        <div v-if="notifications.length === 0" class="empty-queue">
          <p>No active notifications</p>
        </div>
        <div v-else class="queue-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="queue-item"
            :style="{ borderLeftColor: getPriorityColor(notification.priority) }"
          >
            <div class="queue-item-header">
              <span
                class="queue-priority"
                :style="{ color: getPriorityColor(notification.priority) }"
              >
                {{ notification.priority.toUpperCase() }}
              </span>
              <span
                class="queue-origin"
                :title="notification.origin === 'global' ? 'From Server' : 'Local'"
              >
                {{ notification.origin === 'global' ? '🌐' : '📍' }}
              </span>
              <span class="queue-time">{{ formatTime(notification.createdAt) }}</span>
            </div>
            <div class="queue-message">{{ notification.message }}</div>
            <div class="queue-meta">
              <span class="queue-id">ID: {{ notification.id.slice(0, 8) }}...</span>
              <span class="queue-duration">
                {{ notification.closeOnly ? 'Close Only' : `${notification.duration}ms` }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Info Panel -->
      <section class="info-panel hifi-pane-base">
        <h2 class="hifi-heading">Architecture Notes</h2>
        <div class="info-content">
          <p>
            <strong>Zero-Knowledge Pattern:</strong> This landing creates a base ClientMuxium
            without explicitly importing the notification concept. Notification capability is built
            into the base via <code>BASE_CONCEPTS_CREATORS</code>.
          </p>
          <p>
            <strong>3-Tier Architecture:</strong> The NotificationPopup is mounted by IslandWrapper
            (Tier 2), not by this landing (Tier 3). This landing only dispatches actions; the
            wrapper handles display.
          </p>
          <p>
            <strong>Induction Pattern:</strong> The Hello World quality's deployment target (Client
            vs Huirth) is controlled via StratiVERSE. Toggle it there to test local vs global
            notification routing.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.notification-landing {
  min-height: 100vh;
  padding: 2rem;
  color: var(--color-white-conductor, #f0f0f0);
}

.landing-header {
  text-align: center;
  margin-bottom: 2rem;
}

.landing-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.875rem;
}

.landing-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Panels — visual styling from .hifi-pane-* globals; layout-only here */
.status-panel,
.test-panel,
.queue-panel,
.info-panel {
  border-radius: 8px;
  padding: 1.5rem;
}

.status-panel h2,
.test-panel h2,
.queue-panel h2,
.info-panel h2 {
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
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.status-value {
  font-size: 1rem;
  font-weight: 600;
}

.status-value.connected {
  color: var(--color-green-light, #4ade80);
}

.status-value.disconnected {
  color: var(--color-red-light, #ef4444);
}

.status-value.count {
  color: var(--color-blue-light, #60a5fa);
}

/* Test Sections */
.test-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #2d2d44;
}

.test-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.test-section h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  margin-top: 0;
}

.test-description {
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

/* Custom Form */
.custom-form {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.message-input {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: var(--color-white-conductor, #f0f0f0);
  font-size: 0.875rem;
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
}

.message-input:focus {
  outline: none;
  border-color: var(--color-blue-light, #60a5fa);
}

/* SB-DS6 · ScsDropdown replaces the native priority <select>; the trigger carries this class via
   $attrs. The dropdown owns its own chrome (bg/border/radius) — here we only size the padding to
   match the row's other controls and set the cobalt open-state accent. */
.priority-select {
  padding: 0.75rem 1rem;
  --dropdown-accent: var(--color-blue-light, #60a5fa);
}

/* Bulk Buttons */
.bulk-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Hello World Buttons (Default + Custom Payload variants) */
.hello-world-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Queue Panel */
.empty-queue {
  text-align: center;
  padding: 2rem;
  color: var(--color-white-muted, #a0a0a8);
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.queue-item {
  background: rgba(0, 0, 0, 0.45);
  border-radius: 6px;
  padding: 1rem;
  border-left: 4px solid rgba(255, 255, 255, 0.18);
}

.queue-item-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.queue-priority {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.queue-origin {
  font-size: 0.875rem;
}

.queue-time {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--color-white-muted, #a0a0a8);
}

.queue-message {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.queue-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-white-muted, #a0a0a8);
}

.queue-id {
  font-family: var(--font-mono, 'Space Mono', monospace);
}

/* Info Panel */
.info-content {
  line-height: 1.6;
}

.info-content p {
  margin-bottom: 0.75rem;
  margin-top: 0;
}

.info-content p:last-child {
  margin-bottom: 0;
}

.info-content code {
  background: rgba(0, 0, 0, 0.45);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.875rem;
  color: var(--color-purple-light, #a78bfa);
}

/* Responsive */
@media (max-width: 600px) {
  .custom-form {
    flex-direction: column;
  }

  .message-input {
    min-width: auto;
  }

  .bulk-buttons {
    flex-direction: column;
  }
}
</style>
