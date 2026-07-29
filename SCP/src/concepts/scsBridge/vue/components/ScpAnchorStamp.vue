<script setup lang="ts">
/**
 * ScpAnchorStamp.vue · D4+D5 · THE COMMIT-ANCHOR STAMP (reusable)
 *
 * A hifi-stamp-esque dark inset presenting a manifest's commit anchor: the short
 * 8-char hash foregrounded, the remainder receded, the message, the humanized
 * timestamp, and a right-aligned VERIFIED ANCHOR label. Reused by both the intake
 * preview (an incoming manifest) and the assemble preview (this SCP's own manifest).
 *
 * Pure presentation. It shows exactly the commit fields — the same commit the
 * registry stood behind at verification; reviewing that specific commit is the
 * safety practice named in the security notice.
 */
import { computed } from 'vue';
import type { ParsedScpManifest } from '../../../../model/scpManifest.model';

const props = defineProps<{ commit: ParsedScpManifest['commit'] }>();

const shortHash = computed(() => props.commit.hash.slice(0, 8));
const restHash = computed(() => props.commit.hash.slice(8));

const anchoredHuman = computed(() => {
  const ms = Date.parse(props.commit.timestamp);
  if (Number.isNaN(ms)) return props.commit.timestamp;
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toUTCString();
  }
});
</script>

<template>
  <div class="scp-anchor-stamp">
    <div class="scp-anchor-stamp-top">
      <div class="scp-anchor-stamp-rows">
        <div class="scp-anchor-row">
          <span class="scp-anchor-key">Commit</span>
          <span class="scp-anchor-hash hifi-mono">
            <span class="hifi-hl-green scp-anchor-hash-short">{{ shortHash }}</span
            ><span class="scp-anchor-hash-rest">{{ restHash }}</span>
          </span>
        </div>
        <div class="scp-anchor-row">
          <span class="scp-anchor-key">Message</span>
          <span class="scp-anchor-val">{{ commit.message }}</span>
        </div>
        <div class="scp-anchor-row">
          <span class="scp-anchor-key">Anchored</span>
          <span class="scp-anchor-val scp-anchor-val-recede">{{ anchoredHuman }}</span>
        </div>
      </div>
      <span class="scp-anchor-verified">VERIFIED ANCHOR</span>
    </div>
  </div>
</template>

<style scoped>
.scp-anchor-stamp {
  border-radius: 0.55rem;
  border: 1px solid rgba(39, 227, 108, 0.28);
  background:
    radial-gradient(135% 135% at 100% 0%, rgba(20, 34, 26, 0.9) 0%, rgba(8, 11, 9, 0.94) 55%, rgba(6, 8, 7, 0.96) 100%);
  box-shadow: inset 0 2px 9px rgba(0, 0, 0, 0.55);
  padding: 0.85rem 1rem;
}
.scp-anchor-stamp-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.scp-anchor-stamp-rows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
  flex: 1;
}
.scp-anchor-row {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  min-width: 0;
}
.scp-anchor-key {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.5));
  min-width: 4.75rem;
}
.scp-anchor-hash {
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.scp-anchor-hash-short {
  font-weight: 600;
}
.scp-anchor-hash-rest {
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.4));
  font-size: 0.8rem;
}
.scp-anchor-val {
  color: var(--color-white-conductor, #f0f0f0);
  font-size: 0.78rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.scp-anchor-val-recede {
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.6));
  font-size: 0.72rem;
}
.scp-anchor-verified {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  color: var(--color-green-light, #6ee7b7);
  white-space: nowrap;
  align-self: flex-start;
  padding-top: 0.1rem;
}
</style>
