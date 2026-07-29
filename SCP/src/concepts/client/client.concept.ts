/**
 * Client Concept - Server-Side Version
 *
 * Minimal server-side client concept for SSR Base Client composition.
 * This version excludes client-only concepts (hifi, slideComposer, etc.)
 * and provides the essential types and creators for SSR pages.
 *
 * Citation: Cascading Change Approach - Server version of Base Client
 * Pattern: Re-exports from client.muxonomy.ts which has the core implementation
 *
 * For full client with all concepts, see the client-side client.concept.ts
 */

import { createConcept, muxifyConcepts } from 'stratimux';
import type { MuxiumDeck, Concept, PrincipleFunction } from 'stratimux';
import {
  createWebSocketClientConcept,
  type WebSocketClientDeck,
  type WebSocketClientState,
} from '../webSocketClient/webSocketClient.concept';
import { clientSetDarkMode, type ClientSetDarkMode } from './qualities/setDarkMode.quality';
import { clientInitializationPrinciple } from './initialization.principle';
import createLocalStorageConcept from '../localStorage/localStorage.concept';
import type { LocalStorageDeck } from '../localStorage/localStorage.model';
// MTCD · ScsBridgeDeck intersection · Cycle 159 D1 D4 verdict · IUPA Adoption
import type { ScsBridgeDeck } from '../scsBridge/scsBridge.type';

// ============================================
// CLIENT STATE (Server/SSR Version)
// ============================================

export type ClientState = {
  darkMode: boolean;
} & WebSocketClientState;

export const clientName = 'client';

// ============================================
// CLIENT QUALITIES
// ============================================

export const clientQualities = {
  clientSetDarkMode,
};

export type ClientQualities = {
  clientSetDarkMode: ClientSetDarkMode;
};

// ============================================
// CLIENT DECK
// ============================================

// MTCD · Cycle 159 D1 · ScsBridgeDeck composed at Tier 2 (d.client.d.scsBridge.*)
// per Cycle 159 D4 verdict · NotificationDeck DEFERRED following ADMIN_ICP precedent.
export type ClientDeck = {
  client: Concept<
    ClientState,
    ClientQualities,
    WebSocketClientDeck & LocalStorageDeck & ScsBridgeDeck
  >;
};

export type ClientConcept = Concept<
  ClientState,
  ClientQualities,
  ClientDeck & WebSocketClientDeck & LocalStorageDeck & ScsBridgeDeck
>;

/**
 * ClientMuxiumDeck - Full deck type for Muxium<ClientMuxiumDeck>
 *
 * Includes:
 * - ClientDeck (d.client.*)
 * - WebSocketClientDeck (d.client.d.webSocketClient.*)
 * - LocalStorageDeck (d.client.d.localStorage.*)
 * - MuxiumDeck (d.muxium.*)
 *
 * Usage:
 *   const muxium = createClientMuxiumInstance<StrativerseDeck>([...]);
 *   muxium.plan<ClientMuxiumDeck & StrativerseDeck>('op', ...)
 */
export type ClientMuxiumDeck = ClientDeck & MuxiumDeck;

/**
 * ExtendedClientDeck<T> - Generic type for extending ClientDeck with additional concepts
 *
 * Use this when muxifying additional concepts into the client:
 *   type MyDeck = ExtendedClientDeck<StrativerseDeck & OtherConceptDeck>;
 *
 * @template T - Additional concept decks to muxify into client
 */
export type ExtendedClientDeck<T = {}> = ClientMuxiumDeck & T;

export type ClientPrinciple = PrincipleFunction<
  ClientQualities,
  MuxiumDeck & ClientDeck,
  ClientState
>;

// ============================================
// INITIAL STATE
// ============================================

const initialClientState = (filterKeys?: string[]): ClientState => {
  return {
    darkMode: false,
    actionQue: [],
    filterKeys: filterKeys ? filterKeys : [],
    serverSemaphore: -1,
    clientStateId: null,
    isConnected: false,
  };
};

// ============================================
// CONCEPT CREATOR
// ============================================

export const createClientConcept = (state?: Partial<ClientState>, filterKeys?: string[]) => {
  return muxifyConcepts(
    [createWebSocketClientConcept(filterKeys), createLocalStorageConcept()],
    createConcept<ClientState, typeof clientQualities>(
      clientName,
      state
        ? (Object.assign({}, initialClientState(filterKeys), state) as ClientState)
        : initialClientState(filterKeys),
      clientQualities,
      [clientInitializationPrinciple],
    ),
  );
};
