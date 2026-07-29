/**
 * gitmDiffHunk — the pure client-side unified-diff hunk parser (MD-C · STAGE-FROM-DIFF)
 *
 * Parses the raw unified diff (gitmJson.activeDiff · relayed capped ~400 lines) into per-FILE,
 * per-HUNK blocks the Diff panel renders. Each hunk carries its own re-appliable patch text
 * (the file header + the single `@@` hunk) so the per-hunk Stage button can send exactly that
 * slice to gitm_stage_hunk { patch } (git apply --cached - via the MD-A stdin seam).
 *
 * PURE (no Vue, no fetch) · fixture-testable. Tolerant of the relay truncation marker (a
 * non-`diff`/`@@` trailing line is ignored — it is neither a file header nor a hunk head).
 *
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-C build #4 (per-hunk stage-from-diff).
 */

export type DiffHunk = {
  header: string; // the `@@ -a,b +c,d @@ …` hunk header line
  lines: string[]; // the hunk body lines (context/+/-) — for display
  patch: string; // the re-appliable slice: file header lines + this hunk (ends with \n)
};

export type DiffFile = {
  path: string; // the `+++ b/<path>` target path (or `--- a/<path>` on a delete)
  fileHeader: string; // the `diff --git …` + index + `---`/`+++` lines (the patch preamble)
  hunks: DiffHunk[];
};

// A file-header block = the lines from a `diff --git` up to (not including) the first `@@`.
// A hunk = a `@@ …` line + all following lines until the next `@@` or `diff --git`.
export function parseUnifiedDiff(raw: string): DiffFile[] {
  if (raw.trim() === '') return [];
  const lines = raw.split('\n');
  const files: DiffFile[] = [];
  let current: DiffFile | null = null;
  let headerLines: string[] = [];
  let inHunk = false;
  let hunkHeader = '';
  let hunkBody: string[] = [];

  const flushHunk = (): void => {
    if (!current || !inHunk) return;
    const patch = `${current.fileHeader}\n${hunkHeader}\n${hunkBody.join('\n')}\n`;
    current.hunks.push({ header: hunkHeader, lines: hunkBody.slice(), patch });
    inHunk = false;
    hunkHeader = '';
    hunkBody = [];
  };

  const flushFile = (): void => {
    flushHunk();
    if (current) files.push(current);
    current = null;
    headerLines = [];
  };

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      flushFile();
      headerLines = [line];
      current = { path: '', fileHeader: '', hunks: [] };
      continue;
    }
    if (current === null) {
      // Pre-amble noise (or the relay truncation marker) before any file header — ignore.
      continue;
    }
    if (line.startsWith('@@')) {
      // First hunk in this file → seal the file header preamble.
      if (current.fileHeader === '') current.fileHeader = headerLines.join('\n');
      flushHunk();
      inHunk = true;
      hunkHeader = line;
      hunkBody = [];
      continue;
    }
    if (inHunk) {
      // Ignore a trailing relay truncation marker line (not a +/-/context/`\` line).
      hunkBody.push(line);
      continue;
    }
    // Still in the file-header preamble — capture path from the +++/--- markers.
    headerLines.push(line);
    if (line.startsWith('+++ b/')) current.path = line.slice(6);
    else if (line.startsWith('+++ ')) current.path = line.slice(4);
    else if (current.path === '' && line.startsWith('--- a/')) current.path = line.slice(6);
  }
  flushFile();
  return files;
}
