/**
 * graphiteScribeOpenCircuit.model · MD-CE-5 · THE SHARED OPEN CIRCUIT.
 *
 * ONE open path for every entry surface (the MD-CE-4 path opener · the MD-CE-5 file
 * tree · any future caller): GET /editor-fs/read → dispatch graphiteScribeOpenFile. The
 * transfer and the hold stay in one place — callers never duplicate the fetch+dispatch
 * pair (the Epoch Law's seam: HTTP TRANSFERS IN · STRATIMUX HOLDS).
 *
 * Returns null on success, a short error token on failure (the caller renders it).
 */

export async function openFileThroughEditorFs(
  muxium: unknown,
  path: string,
): Promise<string | null> {
  const m = muxium as {
    dispatch: (a: unknown) => void;
    deck: { d: { client: { d: { graphiteScribe: { e: Record<string, (p: unknown) => unknown> } } } } };
  } | null;
  if (!m) return 'no-muxium';
  try {
    const res = await fetch(`/editor-fs/read?path=${encodeURIComponent(path)}`);
    const body = (await res.json()) as { ok: boolean; content?: string; error?: string };
    if (!body.ok || typeof body.content !== 'string') {
      return body.error ?? 'read-failed';
    }
    m.dispatch(
      m.deck.d.client.d.graphiteScribe.e.graphiteScribeOpenFile({ path, content: body.content }),
    );
    return null;
  } catch {
    return 'fetch-failed';
  }
}
