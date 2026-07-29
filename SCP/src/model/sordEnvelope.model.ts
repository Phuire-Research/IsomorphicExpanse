/**
 * sordEnvelope.model.ts — SORD Envelope Model File (SMFT · RM-D2 R3 Yellow)
 *
 * PURE module · zero Stratimux/Huirth deps · CLI-importable. Produces the locked
 * 《send_message》-class SORD envelope string per RM-D2-FOUNDATION-R2-ORANGE §3.
 *
 * TNST: the opening tag === the tool name. ENDPOINT is DERIVED as
 * `${bridgeConfig.endpoint}/mcp` — bridge.json has NO /mcp field; four template
 * call sites confirm the +"/mcp" derivation (R1 Red §2).
 *
 * DBSE: `body` is OPTIONAL. Omitted ⇒ a tool-call envelope with no body section.
 * Present ⇒ the matching sentinel ('MESSAGE:' for kind 'message', 'DIRECTIVE:' for
 * kind 'directive'). Body text emitted verbatim (no escaping — the body is opaque
 * data per BDAP §5 Rule 3).
 *
 * Naming rationale: `.model.ts` suffix per Stratidian convention for pure,
 * dispatch-free, Stratimux-agnostic helpers (cf. lastTurnExtraction.model.ts,
 * muxonomy.model.ts, diametric.model.ts). NO `.huirth.ts` suffix.
 *
 * Citation: RM-D2-R3-YELLOW-ARCHITECTURE.md §B · R2 Orange §3 (locked envelope).
 */

export interface SordBridgeConfig { endpoint: string; }
export interface SordBody { kind: 'message' | 'directive'; text: string; }
export interface BuildSordEnvelopeInput {
  tool: string;
  bridgeConfig: SordBridgeConfig;
  params: Record<string, string>;
  body?: SordBody;
}

const OPEN = (tool: string) => `《${tool}》`;
const CLOSE = (tool: string) => `《/${tool}》`;

export function deriveMcpEndpoint(endpoint: string): string {
  // R1 Red §2: bridge.json carries `endpoint` (base URL), NO /mcp field.
  // Strip a trailing slash defensively, then append the canonical path.
  return `${endpoint.replace(/\/+$/, '')}/mcp`;
}

export function buildSordEnvelope(input: BuildSordEnvelopeInput): string {
  const { tool, bridgeConfig, params, body } = input;
  const lines: string[] = [
    OPEN(tool),
    `TOOL: ${tool}`,
    `ENDPOINT: ${deriveMcpEndpoint(bridgeConfig.endpoint)}`,
    'PARAMS:',
    ...Object.entries(params).map(([k, v]) => `  ${k}: ${v}`),
  ];
  if (body) {
    lines.push(body.kind === 'directive' ? 'DIRECTIVE:' : 'MESSAGE:');
    lines.push(body.text); // verbatim — opaque body
  }
  lines.push(CLOSE(tool));
  return lines.join('\n');
}

export interface BuildSordSkillEnvelopeInput {
  ref: string; // the Skill/Strategy path within the Suite 8 dir (e.g. 'Skills/SetColorsViaJson.md')
  kind: 'skill' | 'strategy';
  content: string; // the FULL Skill/Strategy text, verbatim
  // PSPC · Prime-SCP-Path-Convey (GitM color-cascade W1). The SCP this Pewter is anchored in —
  // the SCP server KNOWS its own name (scp.config.json @ process.cwd()). Carried as the SCP_NAME
  // header so a path-targeting Skill (e.g. SetColorsViaJson) can resolve the SCP PACKAGE dir's
  // own Cascades/ (Cascades/scps/<scpName>/SCP/Cascades/) — the EXACT dir the server reads
  // hifiConfig.json from (vue.principle.ts /hifi-config) AND inside the SCP RED git work-tree.
  // Empty/absent ⇒ the SCP_NAME header is omitted (back-compat · the Skill falls back to its
  // self-resolution instructions). Verbose-named, single-purpose.
  scpName?: string;
}

/**
 * SMSP · the Skill-Priming SORD envelope. Wraps a Skill/Strategy's FULL contents in SORD tags
 * (《SCS:Skill》 / 《SCS:Strategy》) so a Shatterite-Menu option (kind 'prime') can prime the anchored
 * Suite 8 to PERFORM it — delivered as a live message via triggerSendMessage. A DIRECTIVE envelope,
 * NOT a tool call: the body is the Skill text verbatim (opaque), the agent reads + performs it.
 * Same load-and-SORD-wrap mechanism the BDAP/Dock uses to supply MCP info at spawn — here, at
 * menu-request time, to the live anchor.
 *
 * PSPC · when input.scpName is a non-empty string, a `SCP_NAME: <name>` header is emitted BEFORE
 * the DIRECTIVE so the primed Skill can resolve its SCP-rooted write target unambiguously.
 */
export function buildSordSkillEnvelope(input: BuildSordSkillEnvelopeInput): string {
  const tool = input.kind === 'strategy' ? 'SCS:Strategy' : 'SCS:Skill';
  const lines: string[] = [OPEN(tool), `REF: ${input.ref}`];
  // PSPC · convey the anchoring SCP's name (omitted when absent/empty — back-compat).
  if (typeof input.scpName === 'string' && input.scpName.length > 0) {
    lines.push(`SCP_NAME: ${input.scpName}`);
  }
  lines.push(`DIRECTIVE: Load the following ${input.kind} in full and perform it now.`);
  lines.push(input.content); // verbatim — opaque body
  lines.push(CLOSE(tool));
  return lines.join('\n');
}
