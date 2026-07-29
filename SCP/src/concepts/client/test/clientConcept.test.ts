/**
 * Client Concept Structure Test
 *
 * Tests the basic structure and composition of the client concept
 * which includes muxified CommandDeckInterface and WebSocketClient.
 *
 * @fileoverview This test validates the client concept creation and
 * basic functionality without testing specific features.
 */

import { createClientConcept, type ClientDeck } from '../client.concept';
import { muxification, type Muxium } from 'stratimux';

// Simple test utilities for Stratimux tests
const waitForAsync = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Client Concept', () => {
  let muxium: ReturnType<typeof muxification>;

  beforeEach(async () => {
    const clientConcept = createClientConcept();
    muxium = muxification('Client Test', {
      client: clientConcept,
    });

    await waitForAsync(100);
  });

  afterEach(() => {
    if (muxium) {
      muxium.close();
    }
  });

  describe('Concept Creation', () => {
    it('should create client concept successfully', () => {
      const clientConcept = createClientConcept();

      expect(clientConcept).toBeDefined();
      expect(clientConcept.name).toBe('client');
      expect(clientConcept.state).toBeDefined();
      expect(clientConcept.qualities).toBeDefined();
    });
  });

  describe('Muxified Concepts Access', () => {
    test('should have access to CommandDeckInterface state through client', (done) => {
      try {
        muxium.plan<ClientDeck>('check CommandDeckInterface access', ({ stage, conclude }) => [
          stage(({ d, stagePlanner }) => {
            try {
              // Test if we can access CommandDeckInterface state through client
              const inputBuffer = d.client.d.commandDeckInterface.k.inputBuffer.select();
              const availableCommands =
                d.client.d.commandDeckInterface.k.availableCommands.select();

              expect(typeof inputBuffer).toBe('string');
              expect(Array.isArray(availableCommands)).toBe(true);

              stagePlanner.conclude();
              done();
            } catch (error) {
              console.error('CommandDeckInterface access failed:', error);
              expect(false).toBe(true);
              done();
            }
          }),
          conclude(),
        ]);
      } catch (error) {
        console.error('Test setup failed:', error);
        expect(false).toBe(true);
        done();
      }
    });

    test('should have access to WebSocketClient state through client', (done) => {
      try {
        muxium.plan<ClientDeck>('check WebSocketClient access', ({ stage, conclude }) => [
          stage(({ d, stagePlanner }) => {
            try {
              // Test if we can access WebSocketClient state through client
              const actionQue = d.client.d.webSocketClient.k.actionQue.select();
              const serverSemaphore = d.client.d.webSocketClient.k.serverSemaphore.select();

              expect(Array.isArray(actionQue)).toBe(true);
              expect(typeof serverSemaphore).toBe('number');

              stagePlanner.conclude();
              done();
            } catch (error) {
              console.error('WebSocketClient access failed:', error);
              expect(false).toBe(true);
              done();
            }
          }),
          conclude(),
        ]);
      } catch (error) {
        console.error('Test setup failed:', error);
        expect(false).toBe(true);
        done();
      }
    });
  });

  describe('Basic State Structure', () => {
    test('should have expected initial state properties', (done) => {
      try {
        muxium.plan<ClientDeck>('check client state', ({ stage, conclude }) => [
          stage(({ d, stagePlanner }) => {
            // Test basic client state structure
            expect(typeof d.client.d.commandDeckInterface !== 'undefined').toBe(true);
            expect(typeof d.client.d.webSocketClient !== 'undefined').toBe(true);

            stagePlanner.conclude();
            done();
          }),
          conclude(),
        ]);
      } catch (error) {
        console.error('State structure test failed:', error);
        expect(false).toBe(true);
        done();
      }
    });
  });

  describe('Action Dispatch Capability', () => {
    test('should be able to dispatch actions to muxified concepts', (done) => {
      try {
        muxium.plan<ClientDeck>('test action dispatch', ({ stage, conclude }) => [
          stage(({ dispatch, d, stagePlanner }) => {
            try {
              // Test dispatching to CommandDeckInterface
              dispatch(
                d.client.d.commandDeckInterface.e.commandDeckInterfaceUpdateInputBuffer({
                  inputBuffer: 'test-dispatch',
                  cursorPosition: 12,
                }),
                { iterateStage: true },
              );

              stagePlanner.conclude();
            } catch (error) {
              console.error('Dispatch failed:', error);
              expect(false).toBe(true);
              done();
            }
          }),
          stage(({ d, stagePlanner }) => {
            try {
              // Verify the dispatch actually worked using DECK K pattern
              const inputBuffer = d.client.d.commandDeckInterface.k.inputBuffer.select();
              const cursorPosition = d.client.d.commandDeckInterface.k.cursorPosition.select();

              expect(inputBuffer).toBe('test-dispatch');
              expect(cursorPosition).toBe(12);

              stagePlanner.conclude();
              done();
            } catch (error) {
              console.error('Verification failed:', error);
              expect(false).toBe(true);
              done();
            }
          }),
          conclude(),
        ]);
      } catch (error) {
        console.error('Test setup failed:', error);
        expect(false).toBe(true);
        done();
      }
    });
  });
});
