/**
 * archiveManifestActionTypes.ts — SE · Epoch Extension · ASMQ shared action-type consts.
 *
 * TQNI silent-no-op gate: the manifest relay action's `type` string must byte-match across
 * (i) the quality export `type`, (ii) the actionExchange.serverToClient `actionType` in
 * scsBridge.muxonomy.ts, and (iii) the muxonomy demometers `type`. Defining the strings ONCE
 * here — imported by the quality files, the watcher, and (by value-equality) the muxonomy —
 * eliminates the independent-spelling drift that hit cadmiumSetMenuStage (S4 Angle 6 TQNI).
 *
 * The camelCase deck-key form is the Stratimux convention: 'Scs Bridge Set Archive Manifest Relay'
 * ⇄ scsBridgeSetArchiveManifestRelay. NEVER edit one without the other.
 *
 * Citation: EPOCH-EXT-SE-S4-GREEN-SCULPT.md §Angle 6 TQNI · EPOCH-EXT-SE-S2-ORANGE-NAMING.md §ASMQ.
 */

// ASMQ Huirth-Base action type (Huirth-only · NOT in actionExchange.serverToClient).
export const SCS_BRIDGE_SET_ARCHIVE_MANIFEST_HUIRTH_BASE_TYPE =
  'Scs Bridge Set Archive Manifest Huirth Base';

// ASMQ Relay action type (dual-deployment · IN actionExchange.serverToClient · crosses WS boundary).
export const SCS_BRIDGE_SET_ARCHIVE_MANIFEST_RELAY_TYPE =
  'Scs Bridge Set Archive Manifest Relay';
