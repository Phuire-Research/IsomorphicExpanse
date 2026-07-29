<script setup lang="ts">
/**
 * ScpManifestAssemble.vue · D4+D5 · ZONE 4 · SHARE THIS SCP (assemble a manifest)
 *
 * Generate THIS SCP's own manifest (GET /scp-generate-manifest — the constitutionally
 * leak-proof generator, built from exactly commit + description + suite8s), preview it
 * with the same anatomy as the intake (ScpAnchorStamp + description + Cognitive
 * Aspects), then Copy JSON / Download scp-manifest.json / Submit at scp-origin.com/base.
 * The registry verifies the commit anchor — installing from a registry-verified
 * manifest installs what the registry stood behind.
 *
 * The transparent Suite-8 pane framing: this SCP shares itself onward.
 */
import { computed, ref } from 'vue';
import ScpMark from '../../../vue/components/ScpMark.vue';
import ScpAnchorStamp from './ScpAnchorStamp.vue';
import { validateScpManifest, type ParsedScpManifest } from '../../../../model/scpManifest.model';

const busy = ref(false);
const manifest = ref<ParsedScpManifest | null>(null);
const manifestJson = ref('');
const sourceLocation = ref<string>('');
const sourceKind = ref<'remote' | 'local-path' | ''>('');
const locationCopied = ref(false);

async function copyLocation(): Promise<void> {
  if (!sourceLocation.value) return;
  try {
    await navigator.clipboard.writeText(sourceLocation.value);
    locationCopied.value = true;
    setTimeout(() => { locationCopied.value = false; }, 2000);
  } catch { /* clipboard unavailable — the mono row remains selectable */ }
}
const errorLine = ref('');
const copied = ref(false);

let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const hasManifest = computed(() => manifest.value !== null);

async function handleGenerate(): Promise<void> {
  busy.value = true;
  errorLine.value = '';
  try {
    const res = await fetch('/scp-generate-manifest');
    const out = (await res.json()) as { ok?: boolean; manifestJson?: string; error?: string };
    if (out.ok && typeof out.manifestJson === 'string') {
      const check = validateScpManifest(out.manifestJson);
      if (check.ok) {
        manifest.value = check.manifest;
        manifestJson.value = out.manifestJson;
      sourceLocation.value = typeof out.sourceLocation === 'string' ? out.sourceLocation : '';
      sourceKind.value = (out.sourceKind === 'remote' || out.sourceKind === 'local-path') ? out.sourceKind : '';
      } else {
        errorLine.value = `the generated manifest failed validation: ${check.reason}`;
      }
    } else {
      errorLine.value = out.error ?? 'could not generate the manifest';
    }
  } catch (err) {
    errorLine.value = `generate request failed: ${String(err)}`;
  } finally {
    busy.value = false;
  }
}

async function handleCopy(): Promise<void> {
  if (!manifestJson.value) return;
  try {
    await navigator.clipboard.writeText(manifestJson.value);
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copied.value = false), 2000);
  } catch {
    errorLine.value = 'could not copy to the clipboard';
  }
}

// C833 · THE EDIT DOOR — each Cognitive Aspect row travels to the Suite 8 roster with that
// card auto-expanded on its CARD subpage (the Description section is the destination). The
// C824 SSR island override honors ?island; the landing's ?s8= focus door does the rest — a
// name with no valid card lands on the General Description Editor instead (never dead-ends).
function editSuite8Description(name: string): void {
  window.location.href = `/?island=suite8&s8=${encodeURIComponent(name)}`;
}

function handleDownload(): void {
  if (!manifestJson.value) return;
  const blob = new Blob([manifestJson.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scp-manifest.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="scpm-assemble hifi-pane-transparent">
    <div class="hifi-panel-toolbar">
      <span class="hifi-heading scpm-assemble-title">Share This <ScpMark /></span>
    </div>
    <div class="hifi-panel-body">
      <p class="scpm-assemble-intro">
        Generate a commit-anchored manifest for this SCP — share it so others can install exactly this
        commit.
      </p>

      <button
        type="button"
        class="hifi-btn hifi-btn-transparent scpm-generate-btn"
        :disabled="busy"
        @click="handleGenerate"
      >
        {{ busy ? 'Generating…' : 'Generate Manifest' }}
      </button>

      <p v-if="errorLine" class="scpm-assemble-error">{{ errorLine }}</p>

      <div v-if="hasManifest && manifest" class="scpm-assemble-preview">
        <ScpAnchorStamp :commit="manifest.commit" />
        <p class="scpm-assemble-description">{{ manifest.description }}</p>
        <div v-if="manifest.suite8s.length > 0" class="scpm-assemble-aspects">
          <span class="scpm-assemble-aspects-label">Cognitive Aspects</span>
          <ul class="hifi-list scpm-assemble-aspects-list">
            <li v-for="s in manifest.suite8s" :key="s.name" style="--mark: rgba(206, 198, 236, 0.85)">
              <span class="scpm-assemble-aspect-name">{{ s.name }}</span>
              <span class="scpm-assemble-aspect-desc"> · {{ s.functionalDescription }}</span>
              <button
                type="button"
                class="hifi-btn hifi-btn-base scpm-aspect-edit"
                :title="`Edit the ${s.name} description`"
                @click="editSuite8Description(s.name)"
              >Edit →</button>
            </li>
          </ul>
        </div>

        <!-- C824 · THE SOURCE LOCATION — beside the manifest, never inside it (the RD Privacy
             Doctrine): a remote wins; with no remote the repo's own file:// path serves the
             offline transfer between projects. -->
        <div v-if="sourceLocation" class="scpm-location">
          <span class="scpm-location-kind hifi-mono">{{ sourceKind === 'remote' ? 'REMOTE' : 'LOCAL PATH' }}</span>
          <span class="scpm-location-value hifi-mono">{{ sourceLocation }}</span>
          <button type="button" class="hifi-btn hifi-btn-base scpm-location-copy" @click="copyLocation">{{ locationCopied ? 'Copied!' : 'Copy Location' }}</button>
        </div>
        <p v-if="sourceLocation" class="scpm-location-note">The origin now rides INSIDE the manifest — remote host first; the file:// path only when no remote exists. Copy JSON alone carries everything (the intake pre-fills from it). The scp-origin.com registry screens local paths — a remote host is required to publish an SCP; file:// is for direct machine-to-machine transfer.</p>
        <div class="scpm-assemble-actions">
          <button type="button" class="scpm-action-btn" @click="handleCopy">
            {{ copied ? 'Copied!' : 'Copy JSON' }}
          </button>
          <button type="button" class="scpm-action-btn" @click="handleDownload">
            Download scp-manifest.json
          </button>
          <a
            class="scpm-action-btn scpm-submit-link"
            href="https://scp-origin.com/base"
            target="_blank"
            rel="noopener"
          >Submit at scp-origin.com/base</a>
        </div>

        <p class="scpm-assemble-note">
          The registry verifies the commit anchor — installing from a registry-verified manifest installs
          what the registry stood behind.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scpm-assemble {
  border-radius: 0.65rem;
  overflow: hidden;
}
.scpm-assemble-title {
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.scpm-assemble-intro {
  margin: 0 0 0.85rem;
  font-size: 0.78rem;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.6));
}
.scpm-generate-btn {
  font-size: 0.72rem;
  padding: 0.5rem 1.1rem;
}
.scpm-assemble-error {
  margin: 0.6rem 0 0;
  font-size: 0.72rem;
  color: var(--color-red-light, #ff4e4e);
}
.scpm-assemble-preview {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 1rem;
}
.scpm-assemble-description {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--color-white-conductor, #f0f0f0);
}
.scpm-assemble-aspects {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.scpm-assemble-aspects-label {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.7));
}
.scpm-assemble-aspects-list {
  font-size: 0.78rem;
}
.scpm-assemble-aspect-name {
  color: var(--color-white-conductor, #f0f0f0);
  font-weight: 500;
}
.scpm-assemble-aspect-desc {
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.6));
}
/* C833 · the per-aspect Edit door (→ /?island=suite8&s8=<name> · the CARD-tab landing). */
.scpm-aspect-edit {
  font-size: 0.62rem;
  padding: 0.2rem 0.55rem;
  margin-left: 0.5rem;
  vertical-align: middle;
}
.scpm-assemble-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.scpm-action-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0.35rem 0.85rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.scpm-action-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
}
.scpm-submit-link {
  border-color: rgba(255, 255, 255, 0.3);
}
.scpm-assemble-note {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.55;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.55));
}

/* C824 · the source location row (beside the manifest — the transfer seam). */
.scpm-location {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.9rem;
  padding: 0.6rem 0.8rem;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 6px;
  border-left: 3px solid var(--color-blue, #3b82f6);
}
.scpm-location-kind {
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  color: var(--color-blue-light, #93c5fd);
}
.scpm-location-value {
  font-size: 0.78rem;
  color: rgba(235, 231, 222, 0.9);
  word-break: break-all;
  flex: 1 1 240px;
  user-select: all;
}
.scpm-location-copy { font-size: 0.7rem; }
.scpm-location-note {
  margin: 0.4rem 0 0;
  font-size: 0.7rem;
  color: rgba(235, 231, 222, 0.55);
}
</style>
