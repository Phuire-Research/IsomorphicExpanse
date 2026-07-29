/**
 * archiveManifest.model.ts — SCP-side SMFT copy of the archive manifest-scan primitive.
 *
 * PURE module · zero Stratimux/Huirth deps. Reads the flat dated archive tree
 * (Cascades/Archive/YYYY/MM/DD/<id>.entry.json) and produces the ATMS manifest. This is
 * the SMFT byte-faithful copy of the manifest BUILD half of the bridge-side
 * src/lib/bridge/archiveManifest.model.ts (the SCP package cannot import from the bridge
 * package · SMFT precedent: src/model/sordEnvelope.model.ts).
 *
 * DIFFERENCE from the bridge source (intentional · SCP package shape):
 *   - The bridge model imports claudeArchiveRoot() from ./paths (which uses process.cwd()).
 *     paths.ts is NOT vendored SCP-side, and the SCP huirth may run from a different cwd
 *     than the bridge — so buildArchiveManifest() takes the archive root as a PARAMETER.
 *     The AMWP watcher resolves it against the SCS_BRIDGE_ROOT_OVERRIDE discipline (G1)
 *     identical to cadmiumOkMonitor's SCS_ROOT.
 *   - The contents-read half (readArchiveContents → extractLastTurnSnippet) is OMITTED:
 *     W3 only broadcasts the manifest into client state; the on-demand bodies are fetched
 *     by the Vue client from the bridge GET /sessionArchive/:id endpoint (W2 · already built).
 *
 * Resilience (AFPR/RDSC/EJMP): an absent Cascades/Archive/ → empty manifest (never a
 * throw); a malformed/partial <id>.entry.json → skipped, never crashes the scan.
 *
 * Citation: src/lib/bridge/archiveManifest.model.ts (SMFT source · build half) ·
 *   EPOCH-EXT-SE-S1-RED-CURATION.md (scan) · EPOCH-EXT-SE-S2-ORANGE-NAMING.md ATMS/RDSC/EJMP.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { ArchiveEntryJson, ArchiveManifestEntry } from './archiveManifest.types';
import { manifestEntryFromJson, MANIFEST_CAP } from './archiveManifest.types';

// RDSC · re-exported from the PURE types neighbor (browser-safe home · keeps this
// Node-only module · node:fs/promises · out of the client bundle while the value
// stays addressable here for backward-compatible consumers).
export { MANIFEST_CAP };

// Recursively collect all *.entry.json paths under the archive root (YYYY/MM/DD/<id>.entry.json).
// AFPR: absent / unreadable dir → skip (returns []). Never throws.
async function collectEntryJsonPaths(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      return; // absent / unreadable → skip (AFPR)
    }
    for (const name of names) {
      const full = path.join(dir, name);
      try {
        const s = await stat(full);
        if (s.isDirectory()) {
          await walk(full);
        } else if (name.endsWith('.entry.json')) {
          out.push(full);
        }
      } catch {
        // race / vanished entry → skip
      }
    }
  }
  await walk(root);
  return out;
}

async function readEntryJson(p: string): Promise<ArchiveEntryJson | null> {
  try {
    const parsed = JSON.parse(await readFile(p, 'utf8')) as ArchiveEntryJson;
    if (parsed && typeof parsed.id === 'string') return parsed;
    return null;
  } catch {
    return null; // malformed / partial (EJMP) → skip
  }
}

// ATMS · build the manifest (sorted archivedAt desc, capped). Absent root → [].
// `archiveRoot` is the resolved Cascades/Archive/ directory (SCS_ROOT-relative · the AMWP
// watcher supplies it · NOT claudeArchiveRoot() which is bridge-cwd-relative).
export async function buildArchiveManifest(archiveRoot: string): Promise<ArchiveManifestEntry[]> {
  const paths = await collectEntryJsonPaths(archiveRoot);
  const entries: ArchiveEntryJson[] = [];
  for (const p of paths) {
    const e = await readEntryJson(p);
    if (e) entries.push(e);
  }
  entries.sort((a, b) => b.archivedAt - a.archivedAt);
  return entries.slice(0, MANIFEST_CAP).map(manifestEntryFromJson);
}
