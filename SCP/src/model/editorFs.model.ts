/**
 * editorFs.model · MD-CE-2 · THE FS AUTHORITY (the Epoch Law's transfer half).
 *
 * The Code Editor's data-intensive transfer rides THESE endpoints (HTTP TRANSFERS IN);
 * the graphiteScribe Stratimux concept (now Graphite Scribe · MD-CE-3) HOLDS what they return. The SCP server is
 * the single fs authority — the editor's islands never touch the filesystem.
 *
 * THE GUARD (every route): resolveWithin — path.resolve against the SCP PACKAGE ROOT
 * (process.cwd() · the /scp-config precedent) + a prefix check; anything escaping the
 * root is REFUSED with a named error (path-refused · the guard-telemetry law). The
 * IGNORE set (node_modules · .git · dist · .bridge-*) applies to list/search only —
 * direct read/write of an explicit path inside the root stays allowed (the user may
 * legitimately open a dist artifact).
 *
 * Contracts (MD-CE-3 consumes these shapes verbatim):
 *   GET  /editor-fs/list?dir=<rel>        → { ok, dir, entries: [{ name, type: 'file'|'dir' }] }
 *   GET  /editor-fs/read?path=<rel>       → { ok, path, content, bytes }
 *   POST /editor-fs/write  { path, content } → { ok, path, bytes }
 *   POST /editor-fs/rename { from, to }       → { ok }
 *   POST /editor-fs/move   { from, toDir }    → { ok, to }
 *   POST /editor-fs/delete { path }           → { ok }   (files + EMPTY dirs only — never recursive)
 *   POST /editor-fs/mkdir  { path }           → { ok }
 *   GET  /editor-fs/search?q=<text>       → { ok, q, hits: [{ path, line, text }], capped }
 * Errors: { ok: false, error: 'path-refused' | 'not-found' | 'too-large' | ... }.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import express from 'express';
import type { Application, Request, Response } from 'express';

// The template registers json parsing PER-ROUTE (the `${prefix}/create` precedent) —
// no global body parser exists; every POST here carries its own.
const jsonBody = express.json({ limit: '4mb' });

const READ_CAP_BYTES = 2_000_000; // the transfer cap — larger files are viewed, not edited
const SEARCH_HIT_CAP = 200;
const SEARCH_FILE_CAP = 4000;
const IGNORE_NAMES = new Set(['node_modules', '.git', 'dist', '.DS_Store']);

function ignored(name: string): boolean {
  return IGNORE_NAMES.has(name) || name.startsWith('.bridge-');
}

/** The guard: resolve rel against root; escape → null (the caller refuses). */
function resolveWithin(root: string, rel: string): string | null {
  const target = path.resolve(root, rel);
  if (target === root) return target;
  return target.startsWith(root + path.sep) ? target : null;
}

function refuse(res: Response, error: string, code = 400): void {
  res.status(code).json({ ok: false, error });
}

// ============================================
// MD-CE-7 · THE EDITOR TOOL FAMILY (the SCP's OWN MCP surface · S8-callable)
// ============================================
//
// Five editor_* tools registered onto the SCP's /mcp (the scpRegisterToolsWithMetadata
// stage in scpExpressTransport appends these — the LEGACY direct-handler path executes
// them synchronously). The handlers reuse THIS module's guards verbatim (resolveWithin ·
// the IGNORE set · the caps) — the tool surface and the express surface are the SAME
// authority. Graphite Scribe (the Code Editor Suite 8) calls these to aid the user.
//
// editor_open is INFORMATIVE for now: it returns the file content (the read leg); the
// client-tab open lives in browser state — a future STCP leg can drive the surface's
// tab strip from the server side.

import type { SCPToolDefinition } from '../concepts/scp/scp.types';

export function buildEditorScpTools(): SCPToolDefinition[] {
  const root = process.cwd();
  const now = Date.now();

  const listDir = (dir: string) => {
    const abs = resolveWithin(root, dir);
    if (!abs) return { ok: false, error: 'path-refused' };
    try {
      const entries = fs
        .readdirSync(abs, { withFileTypes: true })
        .filter((e) => !ignored(e.name))
        .map((e) => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }));
      return { ok: true, dir, entries };
    } catch {
      return { ok: false, error: 'not-found' };
    }
  };

  const readFile = (rel: string) => {
    const abs = rel ? resolveWithin(root, rel) : null;
    if (!abs) return { ok: false, error: 'path-refused' };
    try {
      const stat = fs.statSync(abs);
      if (!stat.isFile()) return { ok: false, error: 'not-a-file' };
      if (stat.size > READ_CAP_BYTES) return { ok: false, error: 'too-large' };
      return { ok: true, path: rel, content: fs.readFileSync(abs, 'utf-8'), bytes: stat.size };
    } catch {
      return { ok: false, error: 'not-found' };
    }
  };

  return [
    {
      name: 'editor_tree',
      description:
        'List one directory level of the SCP project (lazy — call per directory). Returns {ok, dir, entries:[{name,type}]}. The Code Editor file browser shows this same tree.',
      inputSchema: {
        type: 'object',
        properties: { dir: { type: 'string', description: "Directory relative to the SCP root (default '.')" } },
        required: [],
      },
      registeredAt: now,
      handler: (params) => listDir(typeof params.dir === 'string' ? params.dir : '.'),
    },
    {
      name: 'editor_read',
      description:
        'Read a file from the SCP project (path relative to the SCP root, 2MB cap). Returns {ok, path, content, bytes}.',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'File path relative to the SCP root' } },
        required: ['path'],
      },
      registeredAt: now,
      handler: (params) => readFile(typeof params.path === 'string' ? params.path : ''),
    },
    {
      name: 'editor_open',
      description:
        'Open a file for the user (informative: returns the file content the Code Editor surface would hold; the user opens the same path via the file tree or the path opener on the Code Editor page).',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'File path relative to the SCP root' } },
        required: ['path'],
      },
      registeredAt: now,
      handler: (params) => {
        const r = readFile(typeof params.path === 'string' ? params.path : '');
        return typeof params.path === 'string' && (r as { ok: boolean }).ok
          ? { ...r, note: 'Content returned. Direct the user to this path in the Code Editor tree or path opener.' }
          : r;
      },
    },
    {
      name: 'editor_write',
      description:
        'Write a file into the SCP project (path relative to the SCP root · parent dirs auto-created · traversal refused). Returns {ok, path, bytes}. The Code Editor surface reflects saved content on next open.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to the SCP root' },
          content: { type: 'string', description: 'Full file content to write' },
        },
        required: ['path', 'content'],
      },
      registeredAt: now,
      handler: (params) => {
        const rel = typeof params.path === 'string' ? params.path : '';
        const content = typeof params.content === 'string' ? params.content : null;
        if (!rel || content === null) return { ok: false, error: 'bad-request' };
        const abs = resolveWithin(root, rel);
        if (!abs) return { ok: false, error: 'path-refused' };
        try {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, content, 'utf-8');
          return { ok: true, path: rel, bytes: Buffer.byteLength(content, 'utf-8') };
        } catch (err) {
          return { ok: false, error: 'write-failed: ' + String(err) };
        }
      },
    },
    {
      name: 'editor_search',
      description:
        'Search file contents across the SCP project (substring match · 200-hit/4000-file caps with `capped` in the result). Returns {ok, q, hits:[{path,line,text}], capped}.',
      inputSchema: {
        type: 'object',
        properties: { q: { type: 'string', description: 'Text to search for (min 2 chars)' } },
        required: ['q'],
      },
      registeredAt: now,
      handler: (params) => {
        const q = typeof params.q === 'string' ? params.q : '';
        if (q.length < 2) return { ok: false, error: 'query-too-short' };
        const hits: Array<{ path: string; line: number; text: string }> = [];
        let filesSeen = 0;
        let capped = false;
        const walk = (dirAbs: string, dirRel: string): void => {
          if (capped) return;
          let entries: fs.Dirent[];
          try {
            entries = fs.readdirSync(dirAbs, { withFileTypes: true });
          } catch {
            return;
          }
          for (const e of entries) {
            if (capped) return;
            if (ignored(e.name)) continue;
            const rel = dirRel === '.' ? e.name : dirRel + '/' + e.name;
            if (e.isDirectory()) {
              walk(path.join(dirAbs, e.name), rel);
            } else if (e.isFile()) {
              filesSeen += 1;
              if (filesSeen > SEARCH_FILE_CAP) {
                capped = true;
                return;
              }
              try {
                const stat = fs.statSync(path.join(dirAbs, e.name));
                if (stat.size > READ_CAP_BYTES) continue;
                const lines = fs.readFileSync(path.join(dirAbs, e.name), 'utf-8').split('\n');
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].includes(q)) {
                    hits.push({ path: rel, line: i + 1, text: lines[i].slice(0, 200) });
                    if (hits.length >= SEARCH_HIT_CAP) {
                      capped = true;
                      return;
                    }
                  }
                }
              } catch {
                /* binary/unreadable — skip */
              }
            }
          }
        };
        walk(root, '.');
        return { ok: true, q, hits, capped };
      },
    },
  ];
}

export function registerEditorFsRoutes(expressApp: Application): void {
  const root = process.cwd();

  // MD-CE-6 · /editor-config — serve the SCP's shipped editor settings (the /hifi-config
  // precedent: factory defaults < editorConfig.json < localStorage · the client boot-read
  // applies this UNDER the user's localStorage overrides). editorConfig.json lives at the
  // SCP PACKAGE ROOT so the editor can open/edit it as a first-class buffer through
  // /editor-fs (the C418 'the editor IS its settings GUI'). Writes ride /editor-fs/write.
  // Absent / malformed → {} (the client treats {} as no-file-overrides).
  const editorConfigPath = path.resolve(root, 'editorConfig.json');
  expressApp.get('/editor-config', (_req: Request, res: Response) => {
    try {
      const raw = fs.readFileSync(editorConfigPath, 'utf-8');
      res.json(JSON.parse(raw));
    } catch {
      res.json({});
    }
  });

  expressApp.get('/editor-fs/list', (req: Request, res: Response) => {
    const dir = typeof req.query.dir === 'string' ? req.query.dir : '.';
    const abs = resolveWithin(root, dir);
    if (!abs) return refuse(res, 'path-refused', 403);
    try {
      const entries = fs
        .readdirSync(abs, { withFileTypes: true })
        .filter((e) => !ignored(e.name))
        .map((e) => ({ name: e.name, type: e.isDirectory() ? ('dir' as const) : ('file' as const) }))
        .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
      res.json({ ok: true, dir, entries });
    } catch {
      refuse(res, 'not-found', 404);
    }
  });

  expressApp.get('/editor-fs/read', (req: Request, res: Response) => {
    const rel = typeof req.query.path === 'string' ? req.query.path : '';
    const abs = rel ? resolveWithin(root, rel) : null;
    if (!abs) return refuse(res, 'path-refused', 403);
    try {
      const stat = fs.statSync(abs);
      if (!stat.isFile()) return refuse(res, 'not-a-file');
      if (stat.size > READ_CAP_BYTES) return refuse(res, 'too-large', 413);
      const content = fs.readFileSync(abs, 'utf-8');
      res.json({ ok: true, path: rel, content, bytes: stat.size });
    } catch {
      refuse(res, 'not-found', 404);
    }
  });

  expressApp.post('/editor-fs/write', jsonBody, (req: Request, res: Response) => {
    const { path: rel, content } = (req.body ?? {}) as { path?: unknown; content?: unknown };
    if (typeof rel !== 'string' || typeof content !== 'string') return refuse(res, 'bad-request');
    const abs = resolveWithin(root, rel);
    if (!abs) return refuse(res, 'path-refused', 403);
    try {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, 'utf-8');
      res.json({ ok: true, path: rel, bytes: Buffer.byteLength(content, 'utf-8') });
    } catch (err) {
      refuse(res, 'write-failed: ' + String(err), 500);
    }
  });

  expressApp.post('/editor-fs/rename', jsonBody, (req: Request, res: Response) => {
    const { from, to } = (req.body ?? {}) as { from?: unknown; to?: unknown };
    if (typeof from !== 'string' || typeof to !== 'string') return refuse(res, 'bad-request');
    const absFrom = resolveWithin(root, from);
    const absTo = resolveWithin(root, to);
    if (!absFrom || !absTo) return refuse(res, 'path-refused', 403);
    try {
      if (fs.existsSync(absTo)) return refuse(res, 'target-exists', 409);
      fs.renameSync(absFrom, absTo);
      res.json({ ok: true });
    } catch {
      refuse(res, 'rename-failed', 500);
    }
  });

  expressApp.post('/editor-fs/move', jsonBody, (req: Request, res: Response) => {
    const { from, toDir } = (req.body ?? {}) as { from?: unknown; toDir?: unknown };
    if (typeof from !== 'string' || typeof toDir !== 'string') return refuse(res, 'bad-request');
    const absFrom = resolveWithin(root, from);
    const absDir = resolveWithin(root, toDir);
    if (!absFrom || !absDir) return refuse(res, 'path-refused', 403);
    try {
      const to = path.join(toDir, path.basename(from));
      const absTo = resolveWithin(root, to);
      if (!absTo) return refuse(res, 'path-refused', 403);
      if (fs.existsSync(absTo)) return refuse(res, 'target-exists', 409);
      fs.renameSync(absFrom, absTo);
      res.json({ ok: true, to });
    } catch {
      refuse(res, 'move-failed', 500);
    }
  });

  expressApp.post('/editor-fs/delete', jsonBody, (req: Request, res: Response) => {
    const { path: rel } = (req.body ?? {}) as { path?: unknown };
    if (typeof rel !== 'string') return refuse(res, 'bad-request');
    const abs = resolveWithin(root, rel);
    if (!abs) return refuse(res, 'path-refused', 403);
    try {
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) {
        // NEVER recursive — an empty dir only (the editor's tree offers no rm -rf).
        fs.rmdirSync(abs);
      } else {
        fs.unlinkSync(abs);
      }
      res.json({ ok: true });
    } catch (err) {
      const msg = String(err);
      refuse(res, msg.includes('ENOTEMPTY') ? 'dir-not-empty' : 'delete-failed', msg.includes('ENOTEMPTY') ? 409 : 500);
    }
  });

  expressApp.post('/editor-fs/mkdir', jsonBody, (req: Request, res: Response) => {
    const { path: rel } = (req.body ?? {}) as { path?: unknown };
    if (typeof rel !== 'string') return refuse(res, 'bad-request');
    const abs = resolveWithin(root, rel);
    if (!abs) return refuse(res, 'path-refused', 403);
    try {
      fs.mkdirSync(abs, { recursive: true });
      res.json({ ok: true });
    } catch {
      refuse(res, 'mkdir-failed', 500);
    }
  });

  expressApp.get('/editor-fs/search', (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (q.length < 2) return refuse(res, 'query-too-short');
    const hits: Array<{ path: string; line: number; text: string }> = [];
    let filesSeen = 0;
    let capped = false;
    const walk = (dirAbs: string, dirRel: string): void => {
      if (capped) return;
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dirAbs, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        if (capped) return;
        if (ignored(e.name)) continue;
        const rel = dirRel === '.' ? e.name : dirRel + '/' + e.name;
        if (e.isDirectory()) {
          walk(path.join(dirAbs, e.name), rel);
        } else if (e.isFile()) {
          filesSeen += 1;
          if (filesSeen > SEARCH_FILE_CAP) {
            capped = true;
            return;
          }
          try {
            const stat = fs.statSync(path.join(dirAbs, e.name));
            if (stat.size > READ_CAP_BYTES) continue;
            const lines = fs.readFileSync(path.join(dirAbs, e.name), 'utf-8').split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(q)) {
                hits.push({ path: rel, line: i + 1, text: lines[i].slice(0, 200) });
                if (hits.length >= SEARCH_HIT_CAP) {
                  capped = true;
                  return;
                }
              }
            }
          } catch {
            /* binary/unreadable — skip */
          }
        }
      }
    };
    walk(root, '.');
    // No silent caps (the completeness law): capped is part of the contract.
    res.json({ ok: true, q, hits, capped });
  });
}
