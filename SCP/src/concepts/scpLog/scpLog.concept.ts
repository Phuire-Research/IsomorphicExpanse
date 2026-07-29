/**
 * SCP Log Concept (Server-Side · Huirth Deployment) — M2-A1-D4
 *
 * Composes into huirth via muxifyConcepts. Owns bridge.log + bun.log
 * read/truncate/query operations. Rotation utility lives in
 * `model/logRotation.model.ts` (M2-P3 port from ADMIN_ICP).
 *
 * Higher-Order Composition: muxified into huirth at Tier 2:
 *   d.huirth.d.scpLog.k.lastQuery.select()
 *
 * Quality map empty for M2-A1-D4 — qualities materialize as consumers wire
 * (M2-A1-D5 log dump UI will dispatch readTail/query through this concept).
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D4
 * Citation: scpLog.type.ts (M2-P2 types)
 * Citation: scpLog.state.ts (M2-P3 state factory)
 * Citation: model/logRotation.model.ts (M2-P3 rotation port)
 */
import { createConcept } from 'stratimux';
import { scpLogName } from './scpLog.type';
import { createScpLogState } from './scpLog.state';

const scpLogQualities = {};

export const createScpLogConcept = (projectRoot?: string) => {
  return createConcept(
    scpLogName,
    createScpLogState(projectRoot),
    scpLogQualities,
    [],
  );
};
