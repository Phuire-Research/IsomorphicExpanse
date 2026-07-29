<script setup lang="ts">
/**
 * ScpSecurityNotice.vue · D4+D5 · ZONE 1 · BEFORE YOU INSTALL
 *
 * The caution pane — plain words, Damascus discipline: an SCP is software that
 * runs on your machine; review before it runs; the commit-pinned install installs
 * the specific commit the manifest carries (the same commit the registry stood
 * behind at verification), so reviewing that commit is the safety practice. Not
 * dismissible. Emits 'viewed' ONCE when the pane scrolls into view (an
 * IntersectionObserver on the root, threshold ~0.4) — the parent gates every
 * install button on that acknowledgement.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';

const emit = defineEmits<{ (e: 'viewed'): void }>();

const root = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let fired = false;

onMounted(() => {
  const el = root.value;
  if (!el) return;
  if (typeof IntersectionObserver === 'undefined') {
    // No observer available (SSR-hydrated environments without the API) — the
    // notice is present in the DOM, so treat mount as viewed rather than trapping the gate.
    fired = true;
    emit('viewed');
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !fired) {
          fired = true;
          emit('viewed');
          if (observer) observer.disconnect();
        }
      }
    },
    { threshold: 0.4 },
  );
  observer.observe(el);
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
  observer = null;
});
</script>

<template>
  <section ref="root" class="scp-security-notice hifi-pane-red">
    <div class="hifi-panel-toolbar">
      <span class="hifi-heading hifi-hl-red scp-security-notice-title">Before You Install</span>
    </div>
    <div class="hifi-panel-body">
      <div class="hifi-subtext-ground">
        <p class="scp-security-notice-lead">You are installing software that will run on your machine.</p>
        <ul class="hifi-list scp-security-notice-list">
          <li style="--mark: rgba(255, 78, 78, 0.85)">
            Review what you install before it runs — open-source software is provided as is, without
            warranty of any kind, and with limited liability.
          </li>
          <li style="--mark: rgba(255, 78, 78, 0.85)">
            Commit-pinned installs (via manifest) install the specific commit the manifest carries — the
            same commit the registry stood behind at verification. Reviewing that specific commit is the
            safety practice.
          </li>
          <li style="--mark: rgba(255, 78, 78, 0.85)">
            Bundled and local installs run code you already have on disk. Git URL installs fetch from the
            remote at your direction.
          </li>
          <li style="--mark: rgba(255, 78, 78, 0.85)">
            The SCS-Bridge runs SCP processes on your local machine. Treat an SCP the same as any software
            you run. The same caution stands on SCP-Origin.
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scp-security-notice {
  border-radius: 0.65rem;
  overflow: hidden;
}
.scp-security-notice-title {
  font-size: 0.9rem;
}
.scp-security-notice-lead {
  margin: 0 0 0.9rem;
  font-size: 0.86rem;
  font-weight: 500;
}
.scp-security-notice-list {
  font-size: 0.8rem;
}
</style>
