<script setup lang="ts">
/**
 * NotificationPopup.vue
 *
 * Global notification display component.
 * Watches controller provided by Island Wrapper (Tier 2).
 * Agnostic to muxium - receives controller interface.
 *
 * Zero Knowledge Handoff Pattern:
 * - Tier 2 (IslandWrapper) provides controller
 * - This component watches controller.activeNotifications (Vue-owned)
 * - ClientMuxium principle hands off notifications, then clears Stratimux state
 * - Vue controller manages expiration timers
 * - User dismissal only affects Vue state (Stratimux has zero knowledge)
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: NOTIFICATION-HANDOFF-SEPARATION-ROADMAP.md
 * Citation: 3-Tier Application Architecture Discovery
 *
 * Usage:
 * <NotificationPopup :controller="notificationController" />
 */
import { computed, watch } from 'vue';
import type { Notification } from '../notification.type';
import { PRIORITY_COLORS } from '../notification.type';
import type { NotificationController } from '../notificationController';

// ============================================
// PROPS
// ============================================

const props = defineProps<{
  controller: NotificationController;
}>();

// ============================================
// REACTIVE STATE (from controller)
// ============================================

/**
 * Active notifications from controller (Vue-owned after handoff)
 * ShallowRef in controller triggers on array replacement
 */
const notifications = computed(() => props.controller.activeNotifications.value);

// ============================================
// ACTIONS
// ============================================

/**
 * Dismiss notification via controller
 */
function dismissNotification(id: string): void {
  props.controller.clear(id);
}

// ============================================
// DISPLAY HELPERS
// ============================================

function getBackgroundColor(priority: string): string {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || '#374151';
}

function getTextColor(priority: string): string {
  // Lighter priorities need dark text
  if (priority === 'ochre' || priority === 'viridian') {
    return '#0f0f1a';
  }
  return '#ffffff';
}

function getOriginIcon(origin: string): string {
  return origin === 'global' ? '🌐' : '📍';
}

// ============================================
// DEBUG LOGGING
// ============================================

watch(
  notifications,
  (newVal) => {
    console.log('[NotificationPopup] Notifications updated:', newVal.length);
  },
  { immediate: true },
);
</script>

<template>
  <div class="notification-container">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-popup"
        :style="{
          backgroundColor: getBackgroundColor(notification.priority),
          color: getTextColor(notification.priority),
        }"
      >
        <div class="notification-header">
          <span
            class="notification-origin"
            :title="notification.origin === 'global' ? 'Global Broadcast' : 'Local'"
          >
            {{ getOriginIcon(notification.origin) }}
          </span>
          <span class="notification-priority">
            {{ notification.priority.toUpperCase() }}
          </span>
          <button
            class="notification-close"
            :style="{ color: getTextColor(notification.priority) }"
            @click="dismissNotification(notification.id)"
          >
            &times;
          </button>
        </div>
        <div class="notification-message">
          {{ notification.message }}
        </div>
        <div class="notification-footer">
          <span class="notification-time">
            {{ new Date(notification.createdAt).toLocaleTimeString() }}
          </span>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 360px;
  pointer-events: none;
}

.notification-popup {
  pointer-events: auto;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 280px;
  backdrop-filter: blur(4px);
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.notification-origin {
  font-size: 0.875rem;
}

.notification-priority {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  opacity: 0.8;
  flex-grow: 1;
}

.notification-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.7;
  line-height: 1;
  padding: 0;
  margin-left: auto;
  transition: opacity 0.2s ease;
}

.notification-close:hover {
  opacity: 1;
}

.notification-message {
  font-size: 0.875rem;
  line-height: 1.4;
  word-break: break-word;
}

.notification-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.375rem;
}

.notification-time {
  font-size: 0.625rem;
  opacity: 0.6;
}

/* Transition animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
