/*<$
For the graph programming framework Stratimux generate a Server Concept, that accepts an initial port.
$>*/
/*<#*/
import { serverPrinciple } from './server.principle';
import { MuxiumDeck, MuxiumState, createConcept, PrincipleFunction, Concept } from 'stratimux';
import express, { Application } from 'express';

export type ServerPortUnion = { port: number; server: Application };

export type ServerState = {
  port: number;
  syncClientState: boolean;
  clientState: unknown;
  servers: ServerPortUnion[];
  server?: Application;
};

export const serverName = 'server';

const initialServerState = (syncClientState: boolean, port?: number): ServerState => {
  return {
    port: port ? port : 7637,
    clientState: {},
    syncClientState,
    server: express(),
    servers: new Array<ServerPortUnion>(),
  };
};

export type ServerDeck = {
  server: Concept<ServerState, unknown>;
};

export type ServerPrinciple = PrincipleFunction<void, MuxiumDeck & ServerDeck, ServerState>;

export const createServerConcept = (syncClientState: boolean, port?: number) => {
  return createConcept(serverName, initialServerState(syncClientState, port), {}, [
    serverPrinciple,
  ]);
};
/*#>*/
