/**
 * Action Dehydration Utility
 *
 * Resolves circular references in ActionStrategy structures before JSON serialization.
 *
 * The Issue: strategyDetermine() creates circular references:
 * action.strategy.currentNode.action → action (circular)
 *
 * The Solution: Traverse and replace circular action references with plain object copies.
 * No information loss - just removes the circular structure for serialization.
 */

import type { ActionNode, AnyAction } from 'stratimux';

/**
 * Dehydrates an action by removing circular references from ActionStrategy structures.
 * Creates a deep clone where ActionNode.action references are replaced with plain objects.
 */
export function dehydrateAction(action: AnyAction): AnyAction {
  // If no strategy, action is already serializable
  if (!action.strategy) {
    return action;
  }

  // Deep clone the action to avoid mutating the original
  const dehydrated: AnyAction = {
    type: action.type,
    payload: action.payload,
    semaphore: action.semaphore,
    conceptSemaphore: action.conceptSemaphore,
    keyedSelectors: action.keyedSelectors,
    agreement: action.agreement,
    expiration: action.expiration,
    strategy: {
      topic: action.strategy.topic,
      data: action.strategy.data,
      priority: action.strategy.priority,
      currentNode: action.strategy.currentNode
        ? dehydrateActionNode(action.strategy.currentNode)
        : undefined,
      actionList: action.strategy.actionList,
      stubs: action.strategy.stubs,
    },
    identity: action.identity,
  };

  return dehydrated;
}

/**
 * Dehydrates an ActionNode by replacing the circular action reference with a plain object.
 * Uses Informative-Base pattern: copy entire node, then replace circular action at end.
 */
function dehydrateActionNode(node: any): any {
  if (!node) return undefined;

  // Informative: Copy entire node structure preserving all properties
  const dehydratedNode: ActionNode = { ...node };

  // Recursively dehydrate child nodes
  if (node.successNode) {
    dehydratedNode.successNode = dehydrateActionNode(node.successNode);
  }
  if (node.failureNode) {
    dehydratedNode.failureNode = dehydrateActionNode(node.failureNode);
  }
  if (node.decisionNodes) {
    dehydratedNode.decisionNodes = Object.fromEntries(
      Object.entries(node.decisionNodes).map(([key, decisionNode]) => [
        key,
        dehydrateActionNode(decisionNode),
      ]),
    );
  }

  // Base: Replace circular action reference with plain object
  if (node.action) {
    dehydratedNode.action = {
      type: node.action.type,
      payload: node.action.payload,
      semaphore: node.action.semaphore,
      conceptSemaphore: node.action.conceptSemaphore,
      keyedSelectors: node.action.keyedSelectors,
      agreement: node.action.agreement,
      expiration: node.action.expiration,
      identity: node.action.identity,
      // NOTE: Do NOT include strategy here - that's the circular reference
    };
  }

  return dehydratedNode;
}
