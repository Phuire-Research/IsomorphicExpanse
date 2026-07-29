/**
 * SCP Protocol Helpers - JSON-RPC 2.0 utilities
 *
 * Huirth HiFi Design Suite - SCP Pattern Stenciling
 * Suite 5 Cobalt - Professional Implementation
 *
 * Purpose:
 * - Parse incoming JSON-RPC messages
 * - Format outgoing responses
 * - Create standard MCP responses
 * - Pattern Stencil Tools for Stratimux Reference
 */

import type {
  MCPMessage,
  MCPResponse,
  MCPError,
  SCPServerInfo,
  SCPCapabilities,
  SCPToolDefinition,
} from '../scp.types';
import { getClientState } from './clientStateCache';

/**
 * Parse JSON-RPC message from string
 */
export const parseMessage = (line: string): MCPMessage | null => {
  try {
    const parsed = JSON.parse(line);

    return {
      jsonrpc: parsed.jsonrpc || '2.0',
      id: parsed.id ?? null,
      method: parsed.method ?? null,
      params: parsed.params ?? null,
      result: parsed.result ?? null,
      error: parsed.error ?? null,
    };
  } catch (err) {
    console.error('[SCP Protocol] Parse error:', err);
    return null;
  }
};

/**
 * Format response as JSON-RPC string (with newline for stdio)
 */
export const formatResponse = (response: MCPResponse): string => {
  return JSON.stringify(response) + '\n';
};

/**
 * Create initialize response
 */
export const createInitializeResponse = (
  requestId: string | number,
  serverInfo: SCPServerInfo,
  capabilities: SCPCapabilities,
): MCPResponse => ({
  jsonrpc: '2.0',
  id: requestId,
  result: {
    protocolVersion: serverInfo.protocolVersion,
    serverInfo: {
      name: serverInfo.name,
      version: serverInfo.version,
    },
    capabilities: {
      tools: capabilities.tools ? {} : undefined,
      resources: capabilities.resources ? {} : undefined,
      prompts: capabilities.prompts ? {} : undefined,
    },
  },
});

/**
 * Create tools/list response
 */
export const createToolsListResponse = (
  requestId: string | number,
  tools: Record<string, SCPToolDefinition>,
): MCPResponse => ({
  jsonrpc: '2.0',
  id: requestId,
  result: {
    tools: Object.values(tools).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  },
});

/**
 * Create error response
 */
export const createErrorResponse = (
  requestId: string | number,
  code: number,
  message: string,
  data?: unknown,
): MCPResponse => ({
  jsonrpc: '2.0',
  id: requestId,
  error: {
    code,
    message,
    data,
  },
});

/**
 * Standard MCP error codes
 */
export const MCP_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

/**
 * Hello World tool definition
 */
export const helloWorldTool: SCPToolDefinition = {
  name: 'hello_world',
  description: 'Returns a greeting from the Huirth HiFi Design Suite server',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Optional name to greet',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const name = (params.name as string) || 'World';
    return `Hello, ${name}! Welcome to Huirth HiFi Design Suite.`;
  },
};

// ═══════════════════════════════════════════════════════════════════
// PATTERN STENCIL TOOLS - Stratimux Reference Patterns
// ═══════════════════════════════════════════════════════════════════

/**
 * Pattern Stencil: Stratimuxian Manifold A → B → Y → Z
 *
 * Purpose: Returns step-by-step instructions for creating client-server
 * round-trip patterns via WebSocket communication.
 *
 * Tiered Reference: Core Pattern / WebSocket / ActionStrategy
 */
export const manifoldPatternTool: SCPToolDefinition = {
  name: 'pattern_manifold_a_to_z',
  description:
    'Returns step-by-step guide for creating A→B→Y→Z Stratimuxian Manifolds (client-server WebSocket round-trips)',
  inputSchema: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        description:
          'Specific section: overview | a_trigger | b_trigger | b_to_y_decision | y_anchor | z_return | shared_ts | checklist',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const section = (params.section as string) || 'overview';

    const sections: Record<string, string> = {
      overview: `
# A → B → Y → Z Stratimuxian Manifold Pattern

## Architecture Flow:
CLIENT (A) → WebSocket → SERVER (B) → Processing (B→Y) → Anchor (Y) → Return (Z) → CLIENT

## Components:
- A: Client Trigger Quality (creates proxy action, dispatches via webSocketClientAppendToActionQue)
- B: Server Trigger Quality (initialNode of ActionStrategy)
- B→Y: Processing (Quality for atomic ops, Principle for stateful/monitored ops)
- Y: Anchor Quality (adapts DataField → return helper → Z)
- Z: Return Mechanism (webSocketServerAppendToActionQue + destination clientId)

## Key File: .shared.ts
Location: {concept}/{concept}.shared.ts
Contains: Action type constants, shared payload types, DataField types, helper functions

## Decision Point: B→Y Length
- Quality (Single Shot): Atomic, self-contained, no state between calls
- Principle (Extended): Stateful, monitored, lifecycle management needed
- Hybrid: Principle manages resources, Quality uses them`,

      a_trigger: `
# A: Client Trigger Quality

Location: client/src/concepts/{concept}/qualities/

Pattern:
\`\`\`typescript
methodCreator: () => createMethodWithConcepts(({ action, d_ }) => {
  const serverAction = createServerTriggerAction(action.payload)
  d_.webSocketClient.e.webSocketClientAppendToActionQue({
    actionQue: [serverAction]
  })
  // continue or conclude
})
\`\`\`

Responsibilities:
- Creates proxy action for server using helper from .shared.ts
- Accesses muxified webSocketClient deck
- Dispatches via webSocketClientAppendToActionQue`,

      b_trigger: `
# B: Server Trigger Quality (initialNode)

Location: server/src/concepts/{concept}/qualities/

Pattern:
\`\`\`typescript
methodCreator: () => createMethodWithConcepts(({ action, d_ }) => {
  const strategy = create{Concept}Strategy(d_, action.payload)
  return strategyBegin(strategy)
})
\`\`\`

Responsibilities:
- Receives action from client via WebSocket routing
- Serves as initialNode of ActionStrategy
- Kicks off processing chain toward Y`,

      b_to_y_decision: `
# B → Y Length: The Critical Decision Point

## Option 1: Quality (Single Shot)
Use when:
- Operation is atomic and self-contained
- No state maintenance required between calls
- Each request is independent

## Option 2: Principle (Extended Process)
Use when:
- Operation requires maintained state across multiple steps
- Monitoring until completion signal
- Streaming or incremental processing
- Lifecycle management (startup/shutdown)

## Principle Queue Pattern (Critical):
\`\`\`typescript
// Reducer: Add ENTIRE action to queue
reducer: (state, action) => ({
  processingQueue: [...state.processingQueue, action]
})

// Method: Simply conclude (NOT createMethodWithConcepts)
methodCreator: () => createMethod(({ action }) => muxiumConclude())

// Principle: Direct .pop() - Provably Terminating
const actionToProcess = queue.pop()  // NOT via ActionStream
\`\`\``,

      y_anchor: `
# Y: Anchor Quality

Location: server/src/concepts/{concept}/qualities/

Pattern:
\`\`\`typescript
methodCreator: () => createMethodWithConcepts(({ action, d_ }) => {
  if (action.strategy) {
    const dataField = strategyData_select<ConceptDataField>(action.strategy)

    // Adapt DataField to return payload
    const returnAction = createReturnHelper({
      id: dataField.request.id,
      result: dataField.result
    })

    // Compose Z: append return action to WebSocket queue
    d_.webSocketServer.e.webSocketServerAppendToActionQue({
      actionQue: [returnAction],
      targetConnectionId: dataField.request.clientId
    })

    return strategySuccess(action.strategy)
  }
  return action
})
\`\`\``,

      z_return: `
# Z: Return Mechanism

NOT a quality itself - Z is composition of Y's success + webSocketServerAppendToActionQue

Components:
1. Helper Function (from .shared.ts): Creates typed return action
2. webSocketServerAppendToActionQue: Routes action back to client
3. targetConnectionId parameter: Targets specific connection via connectionId

Flow:
Y's methodCreator
  → createReturnHelper(payload) → returnAction
  → d_.webSocketServer.e.webSocketServerAppendToActionQue({
        actionQue: [returnAction],
        targetConnectionId: clientId
    })`,

      shared_ts: `
# The .shared.ts Pattern: Manifold Bounding Symbol Set

Location: {client|server}/src/concepts/{concept}/{concept}.shared.ts

Contents:

1. Action Type Constants (Verbose Split Naming):
\`\`\`typescript
export const CONCEPT_TRIGGER_ACTION = 'Concept Trigger Action'
export const CONCEPT_RETURN_COMPLETE = 'Concept Return Complete'
\`\`\`

2. Shared Payload Types:
\`\`\`typescript
export type ConceptTriggerPayload = { id: string; clientId: string; ... }
export type ConceptReturnCompletePayload = { id: string; result: ResultType }
\`\`\`

3. DataField Types (Strategy Data Flow):
\`\`\`typescript
export type ConceptDataField = {
  request: ConceptTriggerPayload
  result?: ResultType
  error?: string
}
\`\`\`

4. Helper Functions (Action Creators):
\`\`\`typescript
export function createConceptTrigger(payload): AnyAction
export function createConceptReturnComplete(payload): AnyAction
\`\`\``,

      checklist: `
# Implementation Checklist

Before Implementing a Manifold:

1. Identify the A → Z Flow:
   [ ] What triggers from client? (A)
   [ ] What receives on server? (B)
   [ ] What processing occurs? (B → Y)
   [ ] What returns to client? (Z)

2. Determine B → Y Length Location:
   [ ] Is operation atomic? → Quality
   [ ] Does it need state maintenance? → Principle
   [ ] Are there managed resources? → Hybrid

3. Create .shared.ts First:
   [ ] Define action type constants
   [ ] Define shared payload types
   [ ] Define DataField type
   [ ] Create helper functions

4. Implement Qualities in Order:
   [ ] Quality B (server trigger) - placeholder first
   [ ] Processing quality (if single shot)
   [ ] Quality Y (anchor)
   [ ] Circle back to B with ActionStrategy

5. If Using Principle:
   [ ] Define principle lifecycle
   [ ] Implement resource management
   [ ] Connect principle to strategy flow`,
    };

    return sections[section] || sections.overview;
  },
};

// ═══════════════════════════════════════════════════════════════════
// PATTERN STENCIL META-TOOL - Multi-Pattern Query System
// ═══════════════════════════════════════════════════════════════════

type PatternEntry = {
  tier: 0 | 1 | 2 | 3;
  content: string;
  dependencies: string[];
  suggestions: string[];
  references: string[];
};

const patternRegistry: Record<string, PatternEntry> = {
  // TIER 0: Foundation
  'essential:four_pillars': {
    tier: 0,
    content: `
# Essential: The Four Pillars of Quality StratiDECK Concepts

## 1. Type-First Architecture
- Define types BEFORE implementation
- Use explicit Quality type mapping (never typeof)
- All state properties must have defined types

## 2. Higher-Order Reactive Paradigm
- All logic operates within planning scope
- Never use direct state access (muxium.getState())
- State changes through dispatched actions only

## 3. Compositional Quality Design
- Qualities are independent, composable units
- Each quality handles one concern
- Reducers return ONLY changed properties

## 4. Strategic State Management
- No optional properties in state (KeyedSelector requirement)
- Design state for reactivity
- Normalize complex data structures
`,
    dependencies: [],
    suggestions: ['essential:anti_patterns', 'essential:success_indicators'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:155-177'],
  },

  'essential:anti_patterns': {
    tier: 0,
    content: `
# Essential: Critical Anti-Patterns to Avoid

## Never Do These:
1. **typeof for Qualities**: \`typeof conceptQualities\` causes compilation failures
2. **Direct State Access**: \`muxium.getState()\` violates higher-order paradigm
3. **Spread in Reducers**: \`{ ...state, prop: value }\` causes unnecessary updates
4. **Multiple Dispatches**: More than one dispatch per stage causes lockup
5. **Optional State Properties**: Breaks KeyedSelector functionality

## Correct Patterns:
\`\`\`typescript
// ❌ WRONG
export type ConceptQualities = typeof conceptQualities;
return { ...state, property: newValue };

// ✅ CORRECT
export type ConceptQualities = { action: ActionType };
return { property: newValue };
\`\`\`
`,
    dependencies: [],
    suggestions: ['essential:four_pillars', 'reducer:partial_return'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:187-194'],
  },

  'essential:success_indicators': {
    tier: 0,
    content: `
# Essential: Core Success Indicators

## A successful StratiDECK concept demonstrates:

1. **Zero TypeScript compilation errors** in strict mode
2. **Complete type safety** from state definition through quality implementation
3. **Reactive responsiveness** to state changes through proper selector usage
4. **Compositional flexibility** allowing integration via \`muxifyConcepts\`
5. **Clear separation of concerns** between state management (qualities) and reactive logic (principles)

## Verification Checklist:
- [ ] All qualities export explicit Quality types
- [ ] Concept uses explicit quality mapping (NOT typeof)
- [ ] State access uses DECK K Constant pattern
- [ ] Plans operate within higher-order scope
- [ ] Reducers return ONLY changed properties
`,
    dependencies: ['essential:four_pillars'],
    suggestions: ['essential:anti_patterns', 'quality:type_definition'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:178-186'],
  },

  // TIER 1: Core Patterns
  'dispatch:pattern_differences': {
    tier: 1,
    content: `
# Dispatch: Critical Pattern Differences (ESSENTIAL)

## Two Distinct Dispatch Patterns

### 1. Outer Muxium Dispatches (One-Shot)
\`\`\`typescript
// ✅ CORRECT: No stage options - immediate one-shot dispatch
muxium.dispatch(action);

// From UI components or external contexts
const handleClick = () => {
  muxium.dispatch(
    muxium.deck.d.concept.e.userAction({ data: buttonData })
  );
};
\`\`\`

### 2. Stage Dispatches (Flow-Controlled)
\`\`\`typescript
// ✅ CORRECT: Explicit stage options required
stage(({ dispatch, d }) => {
  dispatch(d.concept.e.action({ data: 'value' }), {
    iterateStage: true // REQUIRED
  });
});

// Stage options:
{ iterateStage: true }   // Move to next stage
{ iterateStage: false }  // Stay on current stage
{ }                      // Complete plan iteration
\`\`\`

## ⚠️ Critical Anti-Pattern (System Lockup)
\`\`\`typescript
// ❌ WRONG: Stage options with outer dispatch
muxium.dispatch(action, {}); // undefined errors

// ❌ WRONG: Missing stage options in stage
stage(({ dispatch, d }) => {
  dispatch(d.concept.e.action()); // lockup risk!
});
\`\`\`

## When to Use Each Pattern
- **Outer Dispatch**: UI events, external triggers, simple state updates
- **Stage Dispatch**: Planning scope, reactive logic, multi-stage workflows
`,
    dependencies: ['essential:four_pillars'],
    suggestions: ['dispatch:shortest_path', 'dispatch:single_dispatch', 'planning:stage_options'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:2033-2147'],
  },

  'dispatch:shortest_path': {
    tier: 1,
    content: `
# Dispatch: Shortest Path Pattern (Efficiency)

## Principle: Use minimal complexity for the requirement

### ✅ Efficient Direct Dispatch
\`\`\`typescript
// When you only need to dispatch, not observe state changes
const handleSimpleAction = () => {
  muxium.dispatch(
    muxium.deck.d.myConcept.e.myAction({ data: 'value' })
  );
};
\`\`\`

### ❌ Unnecessary Planning Overhead
\`\`\`typescript
// INEFFICIENT: Full planning scope just to dispatch
const handleSimpleAction = () => {
  muxium.plan<ConceptDeck>('simple action', ({ stage, conclude }) => [
    stage(({ dispatch, d, stagePlanner }) => {
      dispatch(d.myConcept.e.myAction({ data: 'value' }), {
        iterateStage: true
      });
      stagePlanner.conclude();
    }),
    conclude()
  ]);
};
\`\`\`

## Decision Matrix
| Need | Pattern | Complexity |
|------|---------|------------|
| Simple trigger | \`muxium.dispatch()\` | LOW |
| Single reactive stage | \`muxium.plan()\` single stage | MEDIUM |
| Multi-stage logic | \`muxium.plan()\` full | HIGH |

## Key Insight
Use the shortest path that meets functional requirements.
Don't create unnecessary complexity when a simple dispatch suffices.
`,
    dependencies: ['dispatch:pattern_differences'],
    suggestions: ['planning:stage_options'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:2148-2213'],
  },

  'dispatch:single_dispatch': {
    tier: 1,
    content: `
# Dispatch: Single Dispatch Rule (CRITICAL)

## Each stage must have exactly ONE dispatch

### ✅ Correct Single Dispatch Pattern
\`\`\`typescript
stage(({ dispatch, d }) => {
  const value = d.myConcept.k.property.select();

  if (value === 'condition') {
    // SINGLE dispatch with early return
    dispatch(d.myConcept.e.actionOne({ data: value }), {
      iterateStage: true
    });
    return; // Explicit early return
  }

  // SINGLE dispatch for alternate path
  dispatch(d.myConcept.e.actionTwo({ data: 'default' }), {
    iterateStage: false
  });
})
\`\`\`

### ❌ Wrong Multiple Dispatch Pattern
\`\`\`typescript
stage(({ dispatch, d }) => {
  // WRONG: Multiple dispatches in same stage
  dispatch(d.myConcept.e.actionOne());   // First dispatch
  dispatch(d.myConcept.e.actionTwo());   // CAUSES ERRORS
  dispatch(d.myConcept.e.actionThree()); // CAUSES ERRORS

  return { iterateStage: true }; // WRONG: return object
})
\`\`\`

## Key Insight
Dispatch acts like a final return statement.
Use conditional early returns for branching logic.
`,
    dependencies: ['dispatch:pattern_differences'],
    suggestions: ['planning:flow_control'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:510-545'],
  },

  'quality:payload': {
    tier: 1,
    content: `
# Quality: Payload Quality Pattern

Use when quality needs input parameters.

## Pattern:
\`\`\`typescript
import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { MyState, MyPayload, MyQuality } from './types';

export type { MyQuality };

export const myQuality = createQualityCardWithPayload<MyState, MyPayload>({
  type: 'My Quality Action',  // Verbose Split of variable name
  reducer: (state, action) => {
    const payload = selectPayload<MyPayload>(action);

    // Return ONLY changed properties
    return {
      targetProperty: payload.value
    };
  }
});
\`\`\`

## Key Points:
- Use \`selectPayload<T>(action)\` to extract typed payload
- Return only changed properties (never spread state)
- Type string is Verbose Split of variable name
`,
    dependencies: ['essential:four_pillars', 'reducer:partial_return'],
    suggestions: ['quality:type_definition', 'deck_k:principle_context'],
    references: ['/server/src/concepts/scp/qualities/scpRegisterTool.quality.ts'],
  },

  'quality:type_definition': {
    tier: 1,
    content: `
# Quality: Type Definition Pattern

Define quality types in a separate types.ts file.

## Pattern (types.ts):
\`\`\`typescript
import type { Quality } from 'stratimux';
import type { ConceptState } from '../concept.types';

// Payload type
export type MyActionPayload = {
  requiredField: string;
  optionalField?: number;
};

// Quality type (for concept mapping)
export type MyAction = Quality<ConceptState, MyActionPayload>;
\`\`\`

## Concept Mapping (concept.ts):
\`\`\`typescript
export type ConceptQualities = {
  myAction: MyAction,
  otherAction: OtherAction,
};
\`\`\`

## Key Points:
- Never use \`typeof\` for quality type mapping
- Export Quality types explicitly
- Concept uses explicit type mapping object
`,
    dependencies: ['essential:four_pillars'],
    suggestions: ['quality:payload'],
    references: ['/server/src/concepts/scp/qualities/types.ts'],
  },

  'deck_k:principle_context': {
    tier: 1,
    content: `
# DECK K: Principle Context Pattern

State access within principle using k (concept's own state).

## Pattern:
\`\`\`typescript
export const myPrinciple: PrincipleFunction<
  MyQualities, MyDeck, MyState
> = ({ plan, k }) => {

  return plan('My Principle', ({ stage, conclude }) => [
    stage(({ dispatch, d, k }) => {
      // Access concept's own state via k
      const value = k.myProperty.select();

      if (someCondition(value)) {
        dispatch(d.myConcept.e.myAction({ data: value }), { iterateStage: true });
      } else {
        dispatch(d_.muxium.e.muxiumKick(), { iterateStage: true });
      }
    }, { beat: 100 }),

    conclude()
  ]);
};
\`\`\`

## Key Points:
- \`k\` provides direct access to concept's own state
- \`k.property.select()\` returns current value
- Use within principle context (not outer plan)
`,
    dependencies: ['essential:four_pillars'],
    suggestions: ['deck_k:outer_plan_context', 'planning:stage_options'],
    references: ['/server/src/concepts/scp/principles/scpExpressTransport.principle.ts'],
  },

  'deck_k:outer_plan_context': {
    tier: 1,
    content: `
# DECK K: Outer Plan Context Pattern

State access in muxium.plan() using d.concept.k pattern.

## Pattern:
\`\`\`typescript
muxium.plan<MyDeck>('Outer Plan', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    // Access state through deck composition
    const value = d.myConcept.k.myProperty.select();
    const other = d.otherConcept.k.otherProperty.select();

    dispatch(d.myConcept.e.myAction({ data: value }), { iterateStage: true });
  }),

  conclude()
]);
\`\`\`

## Key Points:
- Use \`d.conceptName.k.property.select()\` pattern
- Access any concept's state through deck
- Different from principle context (k vs d.concept.k)
`,
    dependencies: ['essential:four_pillars'],
    suggestions: ['deck_k:principle_context', 'planning:outer_vs_principle'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:2592-2904'],
  },

  'reducer:partial_return': {
    tier: 1,
    content: `
# Reducer: Partial Return Pattern (CRITICAL)

Reducers must return ONLY changed properties for performance.

## ✅ CORRECT Pattern:
\`\`\`typescript
reducer: (state, action) => {
  const { value } = selectPayload(action);

  // Return ONLY the changed property
  return {
    targetProperty: value
  };
}
\`\`\`

## ❌ WRONG Pattern:
\`\`\`typescript
reducer: (state, action) => {
  const { value } = selectPayload(action);

  // NEVER spread state - causes full tree comparison
  return {
    ...state,
    targetProperty: value
  };
}
\`\`\`

## Why This Matters:
- Stratimux compares returned object with current state
- Spreading state causes comparison of ALL properties
- Partial return only compares changed properties
- Performance impact: O(1) vs O(n) state comparison
`,
    dependencies: ['essential:four_pillars'],
    suggestions: ['quality:payload'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:3642-3860'],
  },

  'planning:outer_vs_principle': {
    tier: 1,
    content: `
# Planning: Outer Plan vs Principle Context (CRITICAL)

## Two Distinct Planning Contexts

### 🚨 Outer Plan Context (via muxium.plan())
\`\`\`typescript
muxium.plan<ConceptDeck>('operation name', ({ stage, conclude }) => [
  stage(({ dispatch, d, k }) => {
    // ❌ WRONG: k refers to MUXIUM global state
    const wrongValue = k.someProperty.select(); // Won't work!

    // ✅ CORRECT: Use d.conceptName.k for concept state
    const correctValue = d.myConcept.k.someProperty.select();

    dispatch(d.myConcept.e.myAction({ data: correctValue }), {
      iterateStage: true
    });
  }),
  conclude()
]);
\`\`\`

### 🏗️ Principle Context (within concept principles)
\`\`\`typescript
export const myPrinciple: MyConceptPrinciple = ({ d_, k_, plan }) => {
  return plan('principle operation', ({ stage, conclude }) => [
    stage(({ dispatch, d, k }) => {
      // ✅ CORRECT: k refers directly to concept's own state
      const conceptValue = k.someProperty.select();

      dispatch(d.myConcept.e.myAction({ data: conceptValue }), {
        iterateStage: true
      });
    }),
    conclude()
  ]);
};
\`\`\`

## Key Rules
- **Outer plans**: Use \`d.conceptName.k\` for state access
- **Principle plans**: Use \`k\` directly for concept's own state
- This understanding prevents the most common planning errors
`,
    dependencies: ['dispatch:pattern_differences'],
    suggestions: ['deck_k:principle_context', 'deck_k:outer_plan_context'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:463-508'],
  },

  'planning:flow_control': {
    tier: 1,
    content: `
# Planning: Flow Control Patterns

## Conditional Stage Progression
\`\`\`typescript
stage(({ dispatch, d }) => {
  const needsProcessing = d.myConcept.k.needsProcessing.select();

  if (needsProcessing) {
    // Continue to next stage for processing
    dispatch(d.myConcept.e.startProcessing(), {
      iterateStage: true
    });
    return;
  }

  // Skip processing, complete plan
  dispatch(d.myConcept.e.markComplete(), {
    iterateStage: false
  });
})
\`\`\`

## Stage Recursion Pattern
\`\`\`typescript
stage(({ dispatch, d }) => {
  const items = d.myConcept.k.itemsToProcess.select();

  if (items.length > 0) {
    // Process one item, stay on this stage
    dispatch(d.myConcept.e.processNextItem(), {
      iterateStage: false // Recurse on this stage
    });
    return;
  }

  // All items processed, move forward
  dispatch(d.myConcept.e.processingComplete(), {
    iterateStage: true
  });
})
\`\`\`

## Flow Control Summary
- \`iterateStage: true\` → Move to next stage
- \`iterateStage: false\` → Stay on current stage (recurse)
- Early \`return\` → Prevents multiple dispatches
`,
    dependencies: ['dispatch:single_dispatch', 'planning:stage_options'],
    suggestions: ['planning:outer_vs_principle'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:558-598'],
  },

  // TIER 2: Orchestration Patterns
  'planning:stage_options': {
    tier: 2,
    content: `
# Planning: Stage Options Pattern

Every dispatch requires explicit stage options.

## Options:
\`\`\`typescript
// Move to next stage
dispatch(action, { iterateStage: true });

// Stay in current stage (requires beat or selectors)
dispatch(action, { throttle: 0 });

// Jump to specific stage
dispatch(action, { setStage: 2 });

// Fire and forget (no stage control)
dispatch(action, {});
\`\`\`

## Stage Configuration:
\`\`\`typescript
stage(({ dispatch, d, k }) => {
  // stage logic
}, {
  beat: 100,  // Milliseconds between fires (required for throttle: 0)
  selectors: [k__.property]  // Fire only when selector changes
})
\`\`\`

## Critical Rule:
- If using \`throttle: 0\`, stage MUST have \`beat\` or \`selectors\`
- Without protection: infinite recursion overflow
`,
    dependencies: ['deck_k:principle_context'],
    suggestions: ['planning:outer_vs_principle', 'dispatch:single_dispatch'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:463-608'],
  },

  'strategy:data_field': {
    tier: 2,
    content: `
# Strategy: DataField Pattern

Pass data through ActionStrategy using strategyData functions.

## Pattern:
\`\`\`typescript
// Define DataField type
type MyDataField = {
  request: RequestPayload;
  result?: ResultType;
  error?: string;
};

// Create strategy with initial data
const strategy = createStrategy<MyDataField>({
  topic: 'My Strategy',
  initialNode: createActionNode(
    d.concept.e.triggerAction({ request }),
    {
      successNode: nextNode,
      failureNode: errorNode
    }
  ),
  data: { request }
});

// Access data in quality
methodCreator: () => createMethodWithConcepts(({ action }) => {
  if (action.strategy) {
    const dataField = strategyData_select<MyDataField>(action.strategy);

    // Use dataField.request
    const result = process(dataField.request);

    // Update strategy data
    return strategySuccess(action.strategy, strategyData_muxify({
      ...dataField,
      result
    }));
  }
  return action;
})
\`\`\`
`,
    dependencies: ['quality:payload', 'planning:stage_options'],
    suggestions: ['strategy:inline_creation', 'manifold:b_to_y_decision'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:926-1666'],
  },

  'ownership:core': {
    tier: 2,
    content: `
# Ownership: Bi-Directional Coordination System (v0.3.29)

## Core Concepts

Ownership provides deterministic mutex-like coordination for concurrent
ActionStrategies via stake-based coordination with FIFO priority.

### Understanding Ownership Coordination
\`\`\`typescript
// Ownership creates bi-directional blocking within stake trees
// Example: Resource paths like 'app.data.users.profile'
// - Blocking is BI-DIRECTIONAL (both directions coordinate)
// - Independent branches execute in parallel (app.data and app.ui simultaneously)
\`\`\`

### Enabling Ownership
\`\`\`typescript
import { createOwnershipConcept } from 'stratimux';

const muxium = muxification('Your App', {
  yourConcept: createYourConcept(),
  ownership: createOwnershipConcept() // Just add this!
});
\`\`\`

### Use stageO() for Ownership-Aware Stages
\`\`\`typescript
muxium.plan<YourDeck>('ownership-aware', ({ stageO, stage, conclude }) => [
  stageO(),      // Waits for ownership initialization (default)
  // OR
  stageO(true),  // Skip ownership check

  stage(({ dispatch, d }) => {
    dispatch(d.concept.e.action(), { iterateStage: true });
  }),
  conclude()
]);
\`\`\`
`,
    dependencies: ['strategy:data_field'],
    suggestions: ['ownership:keyed_selectors', 'ownership:stageo'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:1668-1720'],
  },

  'ownership:keyed_selectors': {
    tier: 2,
    content: `
# Ownership: KeyedSelector Attachment Patterns

## Pattern 1: Direct Action Attachment
\`\`\`typescript
// Attach KeyedSelector to any action to opt into ownership
const action = d.concept.e.someAction({ data: 'value' });
action.keyedSelectors = [
  createKeyedSelector('your.ownership.path')
];
muxium.dispatch(action);
\`\`\`

## Pattern 2: Dynamic KeyedSelector Creation
\`\`\`typescript
methodCreator: () => createMethod(({ action }) => {
  const path = action.payload.resourcePath;
  const selector = createConceptKeyedSelector('concept', path);

  if (action.strategy) {
    const nextAction = strategySuccess(action.strategy);
    nextAction.keyedSelectors = [selector];
    return nextAction;
  }
})
\`\`\`

## Pattern 3: KeyedSelector Cascading in Strategies
\`\`\`typescript
// KeyedSelectors automatically cascade through strategy chains
const strategy = createStrategy({
  topic: 'cascading example',
  initialNode: createActionNode(
    action1({ data }, {
      keyedSelectors: [selector1] // Cascades to all nodes
    }),
    {
      successNode: createActionNode(action2()),  // Inherits selector1
      failureNode: createActionNode(action3())   // Also inherits selector1
    }
  )
});
\`\`\`
`,
    dependencies: ['ownership:core'],
    suggestions: ['strategy:data_field'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:1722-1768'],
  },

  // TIER 3: Integration Patterns
  'muxified:base_informative': {
    tier: 3,
    content: `
# Muxified: Base-Informative Composition Pattern (CRITICAL)

## NOT Parent-Child (Uni-Directional) - Base-Informative (Bi-Directional)

### The Compositional Relationship
- **Base Concept**: The scaffold representing the output form
- **Informative Concept**: Provides information to compose the Base
- **Bi-Directional**: Base informs Informative, Informative informs Base
- **Independence**: Both maintain logical independence
- **Individuation**: Informative can become its own Base elsewhere

### Base Concept Access (Tier 1 - Direct)
\`\`\`typescript
muxium.plan<ConceptDeck>('direct access', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    // Direct concept access via DECK
    const value = d.myConcept.k.property.select();

    dispatch(d.myConcept.e.myAction({ data: value }), {
      iterateStage: true
    });
  }),
  conclude()
]);
\`\`\`

### Muxified Concept Access (Tier 2 - Through Base Scaffold)
\`\`\`typescript
muxium.plan<BaseDeck>('composed access', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    // Accessing informative concept through base scaffold
    const value = d.baseConcept.d.informativeConcept.k.property.select();

    // Dispatching to informative through base composition
    dispatch(d.baseConcept.d.informativeConcept.e.action({ data: value }), {
      iterateStage: true
    });
  }),
  conclude()
]);
\`\`\`

### Why NOT Parent-Child
- Uni-Directional: Parent does NOT take on parts of Child
- Bi-Directional: Base CAN be informed by Informative (and vice versa)
- The Base scaffold is composed FROM informatives, not owning them
`,
    dependencies: ['deck_k:outer_plan_context'],
    suggestions: ['muxified:decision_matrix'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:2214-2291'],
  },

  'muxified:decision_matrix': {
    tier: 3,
    content: `
# Muxified: Access Decision Matrix

## TypeScript Cannot Distinguish Automatically
\`\`\`typescript
// Both are valid TypeScript, but only one works at runtime:
d.concept.k.property.select()              // Direct Base access
d.base.d.informative.k.property.select()   // Muxified access through Base
\`\`\`

## Decision Matrix (Base-Informative Terminology)
| Composition Relationship | Access Pattern | Description |
|--------------------------|----------------|-------------|
| Direct Base | \`d.concept.k\` | Concept directly in muxium |
| Muxified Informative | \`d.base.d.informative.k\` | Via muxifyConcepts() |
| Nested Composition | \`d.outer.d.inner.d.deep.k\` | Multiple composition levels |

## Implementation Strategy
\`\`\`typescript
// 1. Understand composition structure
const baseConcept = createConcept('base', {
  // ...base state and qualities
}, [
  // informativeConcept is COMPOSED INTO base (not owned by)
  muxifyConcepts([informativeConcept])
]);

// 2. Access pattern reflects composition, not hierarchy
muxium.plan<BaseDeck>('operation', ({ stage, conclude }) => [
  stage(({ dispatch, d }) => {
    // Informative accessed through base scaffold boundary
    const value = d.base.d.informative.k.buffer.select();
  }),
  conclude()
]);
\`\`\`

## Key Insights (Higher-Order Composition)
- Composition structure determines access pattern
- Informative concepts retain independence (can individuate)
- Access is through compositional boundary, not hierarchical traversal
- Bi-directional: Both Base and Informative can inform each other
`,
    dependencies: ['muxified:base_informative'],
    suggestions: ['deck_k:principle_context', 'essential:four_pillars'],
    references: ['/+Outlines/STRATIMUX-REFERENCE.md:2292-2400'],
  },

  'manifold:overview': {
    tier: 3,
    content: `
# Manifold: A→B→Y→Z Overview

Client-server round-trip pattern via WebSocket.

## Architecture:
\`\`\`
CLIENT (A) → WebSocket → SERVER (B) → Processing → Anchor (Y) → Return (Z) → CLIENT
\`\`\`

## Components:
- **A**: Client Trigger Quality - creates proxy action, dispatches to server
- **B**: Server Trigger Quality - initialNode of ActionStrategy
- **B→Y**: Processing - Quality (atomic) OR Principle (stateful)
- **Y**: Anchor Quality - adapts DataField to return format
- **Z**: Return Mechanism - webSocketServerAppendToActionQue

## Key File: .shared.ts
Contains: Action types, payload types, DataField type, helper functions

## Use pattern_manifold_a_to_z tool for detailed section guides.
`,
    dependencies: ['quality:payload', 'strategy:data_field'],
    suggestions: ['manifold:shared_ts', 'manifold:b_to_y_decision'],
    references: ['/+Outlines/STRATIMUX/CONCEPTS/STRATIMUXIAN-MANIFOLD-A-TO-Z-PATTERN.concept.md'],
  },
};

function generateSuggestions(requested: string[], fulfilled: string[]): string[] {
  const suggestions = new Set<string>();

  for (const patternId of fulfilled) {
    const pattern = patternRegistry[patternId];
    if (!pattern) continue;

    for (const dep of pattern.dependencies) {
      if (!requested.includes(dep) && !fulfilled.includes(dep)) {
        suggestions.add(dep);
      }
    }

    for (const sug of pattern.suggestions) {
      if (!requested.includes(sug) && !fulfilled.includes(sug)) {
        suggestions.add(sug);
      }
    }
  }

  return Array.from(suggestions).sort((a, b) => {
    const tierA = patternRegistry[a]?.tier ?? 99;
    const tierB = patternRegistry[b]?.tier ?? 99;
    return tierA - tierB;
  });
}

// ═══════════════════════════════════════════════════════════════════
// TOOL MAINTENANCE GUIDE - How to Update and Maintain Huirth MCP Tools
// ═══════════════════════════════════════════════════════════════════

const maintenanceSections: Record<string, string> = {
  overview: `
# Huirth MCP Tool Maintenance Guide

## Architecture Overview

Huirth MCP tools are defined in the SCP (Suite Cascade Protocol) concept.

### Key Files:
\`\`\`
/server/src/concepts/scp/
├── model/
│   └── scp.protocol.ts      # Tool definitions (YOU ARE HERE)
├── principles/
│   └── scpExpressTransport.principle.ts  # Tool registration
├── qualities/
│   ├── scpRegisterTool.quality.ts        # Registration reducer
│   └── types.ts                          # Payload types
└── scp.types.ts             # Core type definitions
\`\`\`

### Tool Registration Flow:
1. Define tool in \`scp.protocol.ts\` (SCPToolDefinition)
2. Export from \`scp.protocol.ts\`
3. Import in \`scpExpressTransport.principle.ts\`
4. Add to tools array in registration dispatch

Use section parameter for specific guides:
- add_tool: How to add a new tool
- update_tool: How to modify existing tools
- add_pattern: How to add pattern stencils
- type_safety: Type system requirements
- testing: How to test tools
`,

  add_tool: `
# Adding a New Huirth MCP Tool

## Step 1: Define the Tool (scp.protocol.ts)

\`\`\`typescript
export const myNewTool: SCPToolDefinition = {
  name: 'my_new_tool',  // snake_case for MCP compatibility
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description'
      },
      param2: {
        type: 'boolean',
        description: 'Optional flag'
      }
    },
    required: []  // or ['param1'] if required
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const param1 = (params.param1 as string) || 'default';
    // Tool logic here
    return 'Result string or JSON.stringify(object)';
  }
};
\`\`\`

## Step 2: Register the Tool (scpExpressTransport.principle.ts)

\`\`\`typescript
// Add import
import {
  // ... existing imports
  myNewTool
} from '../model/scp.protocol';

// Add to registration array (Stage 2)
dispatch(d.scp.e.scpRegisterTool({
  tools: [helloWorldTool, manifoldPatternTool, patternStencilTool, myNewTool]
}), { iterateStage: true });
\`\`\`

## Step 3: Restart Server
The server will auto-reload with nodemon. Verify with tools/list.
`,

  update_tool: `
# Updating an Existing Tool

## Modifying Tool Behavior

1. **Find the tool** in \`scp.protocol.ts\`
2. **Update the handler** function logic
3. **Update inputSchema** if parameters change
4. **Server auto-restarts** on save

## Example: Adding a Parameter

\`\`\`typescript
// Before
inputSchema: {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Name to greet' }
  },
  required: []
}

// After - adding 'format' parameter
inputSchema: {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Name to greet' },
    format: { type: 'string', description: 'Output format: text | json' }
  },
  required: []
}
\`\`\`

## Updating Handler Logic

\`\`\`typescript
handler: (params: Record<string, unknown>) => {
  const name = (params.name as string) || 'World';
  const format = (params.format as string) || 'text';

  const greeting = \`Hello, \${name}!\`;

  if (format === 'json') {
    return JSON.stringify({ greeting, timestamp: Date.now() });
  }
  return greeting;
}
\`\`\`

## Breaking Changes
- Changing \`name\` requires client updates
- Removing required parameters is safe
- Adding required parameters is breaking
`,

  add_pattern: `
# Adding Pattern Stencils

## Adding to pattern_stencil Registry

Locate \`patternRegistry\` in \`scp.protocol.ts\`:

\`\`\`typescript
const patternRegistry: Record<string, PatternEntry> = {
  // Add new pattern here
  'category:section': {
    tier: 1,  // 0=Foundation, 1=Core, 2=Orchestration, 3=Integration
    content: \`
# Category: Section Name

## Pattern Description
What this pattern does...

## Implementation
\\\`\\\`\\\`typescript
// Code example
\\\`\\\`\\\`

## Key Points
- Point 1
- Point 2
\`,
    dependencies: ['essential:four_pillars'],  // Required patterns
    suggestions: ['related:pattern'],           // Commonly paired
    references: ['/path/to/implementation.ts']  // Real file references
  }
};
\`\`\`

## Pattern ID Convention
- Format: \`category:section\`
- Categories: essential, quality, deck_k, reducer, dispatch, planning, strategy, principle, muxified, ownership, manifold, testing, state_design
- Sections: descriptive snake_case

## Tier Classification
- **Tier 0**: Foundation (always needed)
- **Tier 1**: Core patterns (building blocks)
- **Tier 2**: Orchestration (composition)
- **Tier 3**: Integration (system design)

## Adding to manifold_a_to_z

Add new section to \`sections\` object in \`manifoldPatternTool\`:

\`\`\`typescript
const sections: Record<string, string> = {
  // existing sections...
  new_section: \`
# New Section Title
Content here...
\`
};
\`\`\`

Update description to include new section name.
`,

  type_safety: `
# Type System Requirements

## SCPToolDefinition Structure

\`\`\`typescript
type SCPToolDefinition = {
  name: string;           // Tool identifier (snake_case)
  description: string;    // Human-readable description
  inputSchema: JSONSchema;
  registeredAt: number;   // Date.now() at definition
  handler: (params: Record<string, unknown>) => unknown;
};
\`\`\`

## JSONSchema for inputSchema

\`\`\`typescript
type JSONSchema = {
  type: string;  // Usually 'object'
  properties: Record<string, Partial<JSONSchemaProperty>>;
  required: string[];
};

type JSONSchemaProperty = {
  type: string;       // 'string' | 'boolean' | 'number' | 'array'
  description: string;
  enum: string[];     // For enumerated values
  default: unknown;
  items: { type: string };  // For array types
};
\`\`\`

## Array Parameter Example

\`\`\`typescript
inputSchema: {
  type: 'object',
  properties: {
    patterns: {
      type: 'array',
      items: { type: 'string' },
      description: 'Array of pattern IDs'
    }
  },
  required: []
}
\`\`\`

## Handler Type Safety

\`\`\`typescript
handler: (params: Record<string, unknown>) => {
  // Always cast and provide defaults
  const stringParam = (params.myString as string) || 'default';
  const boolParam = params.myBool === true;
  const arrayParam = (params.myArray as string[]) || [];
  const numParam = (params.myNum as number) ?? 0;

  // Return string or JSON.stringify(object)
  return result;
}
\`\`\`
`,

  testing: `
# Testing Huirth MCP Tools

## Manual Testing via curl

\`\`\`bash
# List all tools
curl -s -X POST http://localhost:7111/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq

# Call a tool
curl -s -X POST http://localhost:7111/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"hello_world",
      "arguments":{"name":"Test"}
    }
  }' | jq
\`\`\`

## Testing pattern_stencil

\`\`\`bash
# List available patterns
curl -s -X POST http://localhost:7111/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc":"2.0","id":1,"method":"tools/call",
    "params":{"name":"pattern_stencil","arguments":{"list_available":true}}
  }' | jq

# Query multiple patterns
curl -s -X POST http://localhost:7111/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc":"2.0","id":1,"method":"tools/call",
    "params":{
      "name":"pattern_stencil",
      "arguments":{"patterns":["quality:payload","deck_k:principle_context"]}
    }
  }' | jq
\`\`\`

## Testing via Claude Code

Once configured in .mcp.json, tools appear as:
- mcp__huirth__hello_world
- mcp__huirth__pattern_manifold_a_to_z
- mcp__huirth__pattern_stencil
- mcp__huirth__tool_maintenance

## Verification Checklist
- [ ] Tool appears in tools/list
- [ ] Tool executes without error
- [ ] Parameters are correctly parsed
- [ ] Output format is correct
- [ ] Error cases return proper error responses
`,
};

export const toolMaintenanceTool: SCPToolDefinition = {
  name: 'tool_maintenance',
  description:
    'Guide for updating and maintaining Huirth MCP tools - covers adding tools, updating existing tools, adding patterns, type safety, and testing',
  inputSchema: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        description:
          'Specific section: overview | add_tool | update_tool | add_pattern | type_safety | testing',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const section = (params.section as string) || 'overview';
    return maintenanceSections[section] || maintenanceSections.overview;
  },
};

// ═══════════════════════════════════════════════════════════════════
// CLIENT STATE TOOL - Query ClientState Properties via SCP
// ═══════════════════════════════════════════════════════════════════

/**
 * ExposedClientState properties available via SCP
 *
 * Source: client/src/concepts/client/client.shared.ts
 */
const EXPOSED_CLIENT_STATE_KEYS = [
  'darkMode',
  'count',
  'renderResults',
  'generationResults',
  'pendingRenders',
  'pendingGenerations',
  'slides',
  'activeSlideId',
  'fullScreenMode',
  'assetDisplayOpen',
  'assetDisplaySlideId',
] as const;

type ExposedClientStateKey = (typeof EXPOSED_CLIENT_STATE_KEYS)[number];

// ═══════════════════════════════════════════════════════════════════
// GENERATION INSTRUCTIONS - Shared across tools accessing ClientState
// ═══════════════════════════════════════════════════════════════════

const GENERATION_INSTRUCTIONS = `
## SlideImageHelper Generation Instructions

### Architecture: Stop Gap Pattern (Static Slides)

Each slide is a **static Vue component** in \`/client/src/components/slides/\`.
State is **lazily hydrated** on first interaction with a slide.

**Key Concept**: Static components are source of truth for what slides CAN exist.
State is populated on-demand, then persisted via localStorage.

### Component Location
\`/client/src/components/slides/SlideImageHelper.vue\`

### SlideImageHelper Props Interface
\`\`\`typescript
type Props = {
  renderId?: string          // Direct render ID (required for image)
  stateKey?: string          // State key to read renderId from (alternative)
  width?: string | number    // CSS width (default: auto)
  height?: string | number   // CSS height (default: auto)
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  alt?: string               // Alt text for image
  showLoading?: boolean      // Show loading indicator (default: true)
}
\`\`\`

### Static Slide Integration Points

1. **Slide Components**: \`/client/src/components/slides/*Slide.vue\`
   - Each slide is its own Vue component with full lifecycle
   - Embed SlideImageHelper directly in component templates

2. **Slide Definition Mapping**: \`/client/src/views/slides/index.vue\`
   - \`slideIdToDefinition\` maps slide IDs to component names + metadata
   - Used for direct rendering (ID → Component) independent of state

3. **Lazy Hydration**: When a slide is selected but not in state
   - \`slideComposerAddSlide\` quality dispatches automatically
   - Creates state entry with defaults from \`slideIdToDefinition\`

### Workflow for Adding Image to Existing Slide

1. Query \`available_renders\` to get completed render IDs
2. Query \`slide_composition\` to see current slide state
3. Drag render from Available to Included in Asset Panel (UI)
   - OR programmatically dispatch \`slideComposerAddAssetToSlide\`
4. SlideImageHelper automatically renders the image reactively
`;

/**
 * Client State Tool - Query client state properties
 *
 * Pattern: Reverse Manifold (Server → Client → Server)
 * Citation: SUITE-1-2-CLIENT-STATE-BOUNDARY-PROSPECTION.md
 *
 * Current Implementation: Returns schema and available properties
 * Full Implementation: Requires WebSocket reverse Manifold for live state
 */
export const clientStateTool: SCPToolDefinition = {
  name: 'client_state',
  description:
    'Query live client state cached on server. Actions: query (live data), render_metadata (CSS info), schema, describe, generation_instructions',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description:
          'Action: query | render_metadata | schema | describe | generation_instructions',
      },
      properties: {
        type: 'array',
        items: { type: 'string' },
        description: 'Properties to query (empty = all)',
      },
      render_id: {
        type: 'string',
        description: 'Specific render ID for render_metadata action',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const action = (params.action as string) || 'query';
    const properties = (params.properties as string[]) || [];
    const renderId = params.render_id as string | undefined;

    const validProperties =
      properties.length > 0
        ? properties.filter((p) => EXPOSED_CLIENT_STATE_KEYS.includes(p as ExposedClientStateKey))
        : [...EXPOSED_CLIENT_STATE_KEYS];

    // Get live cached client state
    const clientState = getClientState() as Record<string, unknown>;

    // Query action - return live state
    if (action === 'query') {
      const result: Record<string, unknown> = {};
      for (const prop of validProperties) {
        if (prop in clientState) {
          result[prop] = clientState[prop];
        }
      }
      return JSON.stringify(
        {
          action: 'query',
          timestamp: Date.now(),
          properties: validProperties,
          state: result,
        },
        null,
        2,
      );
    }

    // Render metadata action - get CSS info for Slide Composer
    if (action === 'render_metadata') {
      const renderResults = (clientState.renderResults || {}) as Record<
        string,
        Record<string, unknown>
      >;

      if (renderId) {
        // Single render metadata
        const render = renderResults[renderId];
        if (!render) {
          return JSON.stringify(
            { error: `Render not found: ${renderId}`, available: Object.keys(renderResults) },
            null,
            2,
          );
        }
        // Return metadata without base64
        const { base64, ...metadata } = render;
        return JSON.stringify(
          {
            action: 'render_metadata',
            id: renderId,
            metadata,
          },
          null,
          2,
        );
      }

      // All render metadata (without base64)
      const allMetadata: Record<string, unknown> = {};
      for (const [id, render] of Object.entries(renderResults)) {
        const { base64, ...metadata } = render;
        allMetadata[id] = metadata;
      }
      return JSON.stringify(
        {
          action: 'render_metadata',
          count: Object.keys(allMetadata).length,
          renders: allMetadata,
        },
        null,
        2,
      );
    }

    if (action === 'describe') {
      return JSON.stringify(
        {
          title: 'ExposedClientState - SCP-Accessible Properties',
          source: 'client/src/concepts/client/client.shared.ts',
          properties: {
            darkMode: {
              type: 'boolean',
              description: 'UI theme state (true = dark mode)',
              category: 'Client-Specific',
            },
            count: {
              type: 'number',
              description: 'Counter value from Stratimux builtin',
              category: 'Stratimux Builtin',
            },
            renderResults: {
              type: 'Record<string, RenderResult>',
              description: 'HiFi render cache - keyed by render ID',
              category: 'HiFi Design Suite',
            },
            generationResults: {
              type: 'Record<string, GenerationResult>',
              description: 'PPTX generation cache - keyed by generation ID',
              category: 'HiFi Design Suite',
            },
            pendingRenders: {
              type: 'string[]',
              description: 'IDs of active render requests',
              category: 'HiFi Design Suite',
            },
            pendingGenerations: {
              type: 'string[]',
              description: 'IDs of active generation requests',
              category: 'HiFi Design Suite',
            },
          },
          excludedCategories: [
            'Transport State (actionQue, filterKeys, serverSemaphore)',
            'LocalStorage State (client-only persistence)',
          ],
        },
        null,
        2,
      );
    }

    if (action === 'generation_instructions') {
      return GENERATION_INSTRUCTIONS;
    }

    if (action === 'query_pattern') {
      return `
# Client State Query Pattern (Reverse Manifold)

## Architecture
\`\`\`
SERVER (SCP Tool) → Query → CLIENT (Select State) → Response → SERVER (Return to Tool)
       A                         B→Y                              Z
\`\`\`

## Implementation Files

### Server Side:
- \`server/src/concepts/scp/model/scp.protocol.ts\` - This tool definition
- \`server/src/concepts/scp/qualities/\` - Add query dispatch quality

### Client Side:
- \`client/src/concepts/client/client.shared.ts\` - Shared types and helpers
- \`client/src/concepts/client/qualities/\` - Add state response quality

### Shared Types (client.shared.ts):
\`\`\`typescript
export const CLIENT_STATE_QUERY = 'Client State Query'
export const CLIENT_STATE_RESPONSE = 'Client State Response'

export type ClientStateQueryPayload = {
  queryId: string
  properties: ExposedClientStateKey[]
}

export type ClientStateResponsePayload = {
  queryId: string
  state: Partial<ExposedClientState>
  timestamp: number
}
\`\`\`

## Flow:
1. SCP tool receives query request
2. Dispatch CLIENT_STATE_QUERY to client via WebSocket
3. Client selects requested properties from state
4. Client dispatches CLIENT_STATE_RESPONSE back to server
5. Server returns response to SCP tool caller

## Helper Functions:
- \`createClientStateQuery(queryId, properties)\` - Create query payload
- \`createClientStateResponse(queryId, state)\` - Create response payload
- \`selectExposedState(fullState, properties)\` - Extract exposed properties
`;
    }

    // Default: schema action
    return JSON.stringify(
      {
        availableProperties: validProperties,
        requestedProperties: properties,
        validationResult:
          properties.length > 0
            ? {
                valid: validProperties,
                invalid: properties.filter(
                  (p) => !EXPOSED_CLIENT_STATE_KEYS.includes(p as ExposedClientStateKey),
                ),
              }
            : 'All properties available',
        usage: {
          describe: 'Get detailed property descriptions',
          query_pattern: 'Get implementation pattern for live state queries',
          schema: 'Get available property names (default)',
          generation_instructions: 'Get SlideImageHelper component usage instructions',
        },
        sharedTypesFile: 'client/src/concepts/client/client.shared.ts',
      },
      null,
      2,
    );
  },
};

// ═══════════════════════════════════════════════════════════════════
// SLIDE COMPOSITION TOOL - Query Slide Composition State for Placement
// ═══════════════════════════════════════════════════════════════════

/**
 * Slide Composition Tool - Query slide composition state
 *
 * Purpose: Provide SCP access to slide composition state for:
 * - Viewing current slides and their configurations
 * - Understanding asset placements on slides
 * - Getting slide metadata for composition decisions
 *
 * Citation: Suite 5 Cobalt - Professional Implementation
 */
export const slideCompositionTool: SCPToolDefinition = {
  name: 'slide_composition',
  description:
    'Query slide composition state - view slides, their assets, placements, and composition details. Use generation_instructions for SlideImageHelper usage.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action: list | detail | placements | active | generation_instructions',
      },
      slide_id: {
        type: 'string',
        description: 'Specific slide ID for detail/placements action',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const action = (params.action as string) || 'list';
    const slideId = params.slide_id as string | undefined;

    const clientState = getClientState() as Record<string, unknown>;
    const slides = (clientState.slides || []) as Array<{
      id: string;
      name: string;
      order: number;
      background: { type: string; value: string };
      htmlContent: string;
      includedAssets: Array<{
        id: string;
        name: string;
        renderId: string;
        placement: { x: number; y: number; width: number; height: number };
      }>;
    }>;
    const activeSlideId = clientState.activeSlideId as string | null;
    const fullScreenMode = clientState.fullScreenMode as boolean;

    if (action === 'list') {
      return JSON.stringify(
        {
          action: 'list',
          timestamp: Date.now(),
          activeSlideId,
          fullScreenMode,
          slideCount: slides.length,
          slides: slides.map((s) => ({
            id: s.id,
            name: s.name,
            order: s.order,
            background: s.background,
            assetCount: s.includedAssets?.length || 0,
          })),
        },
        null,
        2,
      );
    }

    if (action === 'detail') {
      if (!slideId) {
        return JSON.stringify(
          {
            error: 'slide_id required for detail action',
            availableSlides: slides.map((s) => ({ id: s.id, name: s.name })),
          },
          null,
          2,
        );
      }

      const slide = slides.find((s) => s.id === slideId);
      if (!slide) {
        return JSON.stringify(
          {
            error: `Slide not found: ${slideId}`,
            availableSlides: slides.map((s) => ({ id: s.id, name: s.name })),
          },
          null,
          2,
        );
      }

      return JSON.stringify(
        {
          action: 'detail',
          timestamp: Date.now(),
          slide: {
            id: slide.id,
            name: slide.name,
            order: slide.order,
            background: slide.background,
            htmlContent: slide.htmlContent || '<empty>',
            includedAssets: slide.includedAssets || [],
          },
        },
        null,
        2,
      );
    }

    if (action === 'placements') {
      if (!slideId) {
        // Return all placements across all slides
        const allPlacements = slides.map((s) => ({
          slideId: s.id,
          slideName: s.name,
          assets: (s.includedAssets || []).map((a) => ({
            assetId: a.id,
            name: a.name,
            renderId: a.renderId,
            placement: a.placement,
          })),
        }));

        return JSON.stringify(
          {
            action: 'placements',
            timestamp: Date.now(),
            allPlacements,
          },
          null,
          2,
        );
      }

      const slide = slides.find((s) => s.id === slideId);
      if (!slide) {
        return JSON.stringify(
          {
            error: `Slide not found: ${slideId}`,
            availableSlides: slides.map((s) => ({ id: s.id, name: s.name })),
          },
          null,
          2,
        );
      }

      return JSON.stringify(
        {
          action: 'placements',
          timestamp: Date.now(),
          slideId: slide.id,
          slideName: slide.name,
          placements: (slide.includedAssets || []).map((a) => ({
            assetId: a.id,
            name: a.name,
            renderId: a.renderId,
            placement: a.placement,
          })),
        },
        null,
        2,
      );
    }

    if (action === 'active') {
      if (!activeSlideId) {
        return JSON.stringify(
          {
            action: 'active',
            timestamp: Date.now(),
            hasActiveSlide: false,
            fullScreenMode,
            message: 'No slide currently active',
          },
          null,
          2,
        );
      }

      const activeSlide = slides.find((s) => s.id === activeSlideId);
      return JSON.stringify(
        {
          action: 'active',
          timestamp: Date.now(),
          hasActiveSlide: true,
          fullScreenMode,
          slide: activeSlide
            ? {
                id: activeSlide.id,
                name: activeSlide.name,
                order: activeSlide.order,
                background: activeSlide.background,
                assetCount: activeSlide.includedAssets?.length || 0,
              }
            : null,
        },
        null,
        2,
      );
    }

    if (action === 'generation_instructions') {
      return GENERATION_INSTRUCTIONS;
    }

    // Default: return usage
    return JSON.stringify(
      {
        error: `Unknown action: ${action}`,
        availableActions: ['list', 'detail', 'placements', 'active', 'generation_instructions'],
        usage: {
          list: 'Get all slides with basic info',
          detail: 'Get full slide details (requires slide_id)',
          placements: 'Get asset placements (optional slide_id)',
          active: 'Get currently active slide info',
          generation_instructions: 'Get SlideImageHelper component usage instructions',
        },
      },
      null,
      2,
    );
  },
};

// ═══════════════════════════════════════════════════════════════════
// AVAILABLE RENDERS TOOL - Query Renders Available for Slide Placement
// ═══════════════════════════════════════════════════════════════════

/**
 * Available Renders Tool - Query renders that can be placed on slides
 *
 * Purpose: Provide SCP access to completed renders for:
 * - Listing available renders for slide composition
 * - Getting render metadata without base64 data
 * - Checking render status for pending operations
 *
 * Citation: Suite 5 Cobalt - Professional Implementation
 */
export const availableRendersTool: SCPToolDefinition = {
  name: 'available_renders',
  description:
    'Query available HiFi renders that can be placed on slides - lists completed renders with metadata. Use generation_instructions for SlideImageHelper usage.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action: list | pending | detail | generation_instructions',
      },
      render_id: {
        type: 'string',
        description: 'Specific render ID for detail action',
      },
      include_dimensions: {
        type: 'boolean',
        description: 'Include CSS dimension info (default: true)',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const action = (params.action as string) || 'list';
    const renderId = params.render_id as string | undefined;
    const includeDimensions = params.include_dimensions !== false;

    const clientState = getClientState() as Record<string, unknown>;
    const renderResults = (clientState.renderResults || {}) as Record<
      string,
      {
        status: string;
        base64?: string;
        cssWidth?: string;
        cssHeight?: string;
        aspectRatio?: string;
        timestamp?: number;
      }
    >;
    const pendingRenders = (clientState.pendingRenders || []) as string[];

    if (action === 'list') {
      const completedRenders = Object.entries(renderResults)
        .filter(([, r]) => r.status === 'complete')
        .map(([id, r]) => {
          const result: Record<string, unknown> = {
            id,
            status: r.status,
            timestamp: r.timestamp,
          };
          if (includeDimensions) {
            result.cssWidth = r.cssWidth;
            result.cssHeight = r.cssHeight;
            result.aspectRatio = r.aspectRatio;
          }
          return result;
        });

      return JSON.stringify(
        {
          action: 'list',
          timestamp: Date.now(),
          completedCount: completedRenders.length,
          pendingCount: pendingRenders.length,
          renders: completedRenders,
        },
        null,
        2,
      );
    }

    if (action === 'pending') {
      const pendingDetails = pendingRenders.map((id) => {
        const render = renderResults[id];
        return {
          id,
          status: render?.status || 'unknown',
          inProgress: true,
        };
      });

      return JSON.stringify(
        {
          action: 'pending',
          timestamp: Date.now(),
          pendingCount: pendingRenders.length,
          renders: pendingDetails,
        },
        null,
        2,
      );
    }

    if (action === 'detail') {
      if (!renderId) {
        return JSON.stringify(
          {
            error: 'render_id required for detail action',
            availableRenders: Object.keys(renderResults),
          },
          null,
          2,
        );
      }

      const render = renderResults[renderId];
      if (!render) {
        return JSON.stringify(
          {
            error: `Render not found: ${renderId}`,
            availableRenders: Object.keys(renderResults),
          },
          null,
          2,
        );
      }

      // Return metadata without base64 to avoid massive response
      const { base64, ...metadata } = render;
      return JSON.stringify(
        {
          action: 'detail',
          timestamp: Date.now(),
          id: renderId,
          hasBase64: !!base64,
          metadata,
        },
        null,
        2,
      );
    }

    if (action === 'generation_instructions') {
      return GENERATION_INSTRUCTIONS;
    }

    // Default: return usage
    return JSON.stringify(
      {
        error: `Unknown action: ${action}`,
        availableActions: ['list', 'pending', 'detail', 'generation_instructions'],
        usage: {
          list: 'Get all completed renders available for placement',
          pending: 'Get renders currently being processed',
          detail: 'Get specific render metadata (requires render_id)',
          generation_instructions: 'Get SlideImageHelper component usage instructions',
        },
      },
      null,
      2,
    );
  },
};

// ═══════════════════════════════════════════════════════════════════
// HIFI STENCILS TOOL - Query HiFi design stencils (Origin data)
// ═══════════════════════════════════════════════════════════════════

/**
 * HiFi Stencils Tool - Query design stencils by category, color, or ID
 *
 * Key Insight: "The image is the preview, the stencil is the product."
 *
 * Stencils contain the Origin data (HTML + CSS) that can be actualized
 * anywhere, while the rendered PNG is just the preview proving it works.
 *
 * Citation: Suite 5 Cobalt - Stencil Integration Implementation
 */
export const hifiStencilsTool: SCPToolDefinition = {
  name: 'hifi_stencils',
  description:
    'Query HiFi design stencils by category, color, or ID. Stencils contain HTML+CSS Origin data for actualization. The image is the preview, the stencil is the product.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action: list | detail | by_category | by_color',
      },
      stencil_id: {
        type: 'string',
        description: 'Specific stencil/render ID for detail action',
      },
      category: {
        type: 'string',
        description: 'Filter by category: button | card | logo | typography | element',
      },
      suite_color: {
        type: 'string',
        description:
          'Filter by prismatic color: obsidian | maroon | rust | ochre | viridian | cobalt | amethyst | rose',
      },
      include_source: {
        type: 'boolean',
        description:
          'Include HTML/CSS source in response (default: false for list, true for detail)',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const action = (params.action as string) || 'list';
    const stencilId = params.stencil_id as string | undefined;
    const category = params.category as string | undefined;
    const suiteColor = params.suite_color as string | undefined;
    const includeSource = params.include_source as boolean | undefined;

    const clientState = getClientState() as Record<string, unknown>;
    const renderResults = (clientState.renderResults || {}) as Record<
      string,
      {
        id: string;
        status: string;
        htmlSource?: string;
        cssSource?: string;
        elementSelector?: string;
        suiteColor?: string;
        category?: string;
        subCategory?: string;
        name?: string;
        base64?: string;
        width?: number;
        height?: number;
        createdAt?: number;
      }
    >;

    // Filter to only stencils (renders with htmlSource)
    const stencils = Object.entries(renderResults)
      .filter(([, r]) => r.status === 'complete' && r.htmlSource)
      .map(([, r]) => r);

    if (action === 'list') {
      let filtered = stencils;

      // Apply filters
      if (category) {
        filtered = filtered.filter((s) => s.category === category);
      }
      if (suiteColor) {
        filtered = filtered.filter((s) => s.suiteColor === suiteColor);
      }

      const results = filtered.map((s) => {
        const result: Record<string, unknown> = {
          id: s.id,
          name: s.name,
          category: s.category,
          subCategory: s.subCategory,
          suiteColor: s.suiteColor,
          elementSelector: s.elementSelector,
          previewWidth: s.width,
          previewHeight: s.height,
          createdAt: s.createdAt,
        };
        if (includeSource) {
          result.htmlSource = s.htmlSource;
          result.cssSource = s.cssSource;
        }
        return result;
      });

      return JSON.stringify(
        {
          action: 'list',
          timestamp: Date.now(),
          stencilCount: results.length,
          filters: { category, suiteColor },
          stencils: results,
        },
        null,
        2,
      );
    }

    if (action === 'detail') {
      if (!stencilId) {
        return JSON.stringify(
          {
            error: 'stencil_id required for detail action',
            availableStencils: stencils.map((s) => ({
              id: s.id,
              name: s.name,
              category: s.category,
            })),
          },
          null,
          2,
        );
      }

      const stencil = stencils.find((s) => s.id === stencilId);
      if (!stencil) {
        return JSON.stringify(
          {
            error: `Stencil not found: ${stencilId}`,
            availableStencils: stencils.map((s) => ({
              id: s.id,
              name: s.name,
              category: s.category,
            })),
          },
          null,
          2,
        );
      }

      // Return full stencil with source (excluding base64 to reduce size)
      return JSON.stringify(
        {
          action: 'detail',
          timestamp: Date.now(),
          stencil: {
            id: stencil.id,
            name: stencil.name,
            category: stencil.category,
            suiteColor: stencil.suiteColor,
            elementSelector: stencil.elementSelector,
            htmlSource: stencil.htmlSource,
            cssSource: stencil.cssSource,
            previewWidth: stencil.width,
            previewHeight: stencil.height,
            createdAt: stencil.createdAt,
            hasPreview: !!stencil.base64,
          },
        },
        null,
        2,
      );
    }

    if (action === 'by_category') {
      // Group stencils by category
      const byCategory: Record<string, typeof stencils> = {};
      for (const stencil of stencils) {
        const cat = stencil.category || 'uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(stencil);
      }

      const summary = Object.entries(byCategory).map(([cat, items]) => ({
        category: cat,
        count: items.length,
        colors: [...new Set(items.map((i) => i.suiteColor).filter(Boolean))],
      }));

      return JSON.stringify(
        {
          action: 'by_category',
          timestamp: Date.now(),
          totalStencils: stencils.length,
          categories: summary,
        },
        null,
        2,
      );
    }

    if (action === 'by_color') {
      // Group stencils by suite color
      const byColor: Record<string, typeof stencils> = {};
      for (const stencil of stencils) {
        const color = stencil.suiteColor || 'uncolored';
        if (!byColor[color]) byColor[color] = [];
        byColor[color].push(stencil);
      }

      const summary = Object.entries(byColor).map(([color, items]) => ({
        suiteColor: color,
        count: items.length,
        categories: [...new Set(items.map((i) => i.category).filter(Boolean))],
      }));

      return JSON.stringify(
        {
          action: 'by_color',
          timestamp: Date.now(),
          totalStencils: stencils.length,
          colors: summary,
        },
        null,
        2,
      );
    }

    // Default: return usage
    return JSON.stringify(
      {
        error: `Unknown action: ${action}`,
        availableActions: ['list', 'detail', 'by_category', 'by_color'],
        usage: {
          list: 'List all stencils (can filter by category, suite_color)',
          detail: 'Get full stencil data including HTML/CSS source (requires stencil_id)',
          by_category: 'Summary of stencils grouped by category',
          by_color: 'Summary of stencils grouped by prismatic color',
        },
        insight:
          'The image is the preview, the stencil is the product. Query stencils to get HTML+CSS Origin data for actualization.',
      },
      null,
      2,
    );
  },
};

// ═══════════════════════════════════════════════════════════════════
// ASSET PRODUCTION MANIFOLD TOOL - Guided generation workflow
// ═══════════════════════════════════════════════════════════════════

export const assetProductionManifoldTool: SCPToolDefinition = {
  name: 'asset_production_manifold',
  description:
    'Guide for HiFi asset production workflow. Covers stencil creation (A→B→Y→Z manifold), metadata extraction, category taxonomy, and agnostic actualization patterns. The image is the preview, the stencil is the product.',
  inputSchema: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        description:
          'Section: overview | a_trigger | b_processing | z_receiver | categories | actualization | update_guide | static_components',
      },
      category: {
        type: 'string',
        description:
          'Filter guidance by category: button | card | logo | badge | typography | layout | element',
      },
      paradigm: {
        type: 'string',
        description: 'Target paradigm for actualization: vue | react | html | pptx | pdf',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const section = (params.section as string) || 'overview';
    const category = params.category as string | undefined;
    const paradigm = params.paradigm as string | undefined;

    const sections: Record<string, string> = {
      overview: `# Asset Production Manifold Overview

## Core Paradigm
**The image is the preview, the stencil is the product.**

## A→B→Y→Z Manifold Flow

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                     HTML RENDER MANIFOLD (Asset Production)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  A: CLIENT TRIGGER (Workshop index.vue:exportToPng)                          │
│  ├─ Extract: html, css (stencil origin data)                                │
│  ├─ Extract: elementSelector, suiteColor, subCategory, category, name       │
│  ├─ Dispatch: hifiRequestRender → client state (stencil metadata)           │
│  └─ Dispatch: webSocketClientAppendToActionQue → server (render request)    │
│                              │                                               │
│                              ▼ WebSocket                                     │
│  B: SERVER TRIGGER (htmlRenderer.principle.ts)                               │
│  ├─ Receive: HtmlRendererRenderElement action                               │
│  ├─ Queue render request                                                     │
│  └─ Puppeteer browser renders HTML+CSS → base64 PNG                         │
│                              │                                               │
│                              ▼                                               │
│  Y: ANCHOR (createHtmlRendererRenderComplete)                                │
│  └─ Package result: { id, base64, width, height } → client                  │
│                              │                                               │
│                              ▼ WebSocket                                     │
│  Z: CLIENT RECEIVER (htmlRendererRenderComplete.quality.ts)                  │
│  ├─ Merge: stencil metadata + preview data = complete stencil               │
│  └─ Persist: localStorage for MCP access                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## Stencil Data Structure

\`\`\`typescript
type RenderResult = {
  id: string
  status: 'pending' | 'complete' | 'failed'

  // Stencil Data (Origin) - The product
  htmlSource?: string          // HTML template for actualization
  cssSource?: string           // CSS styling (includes HiFi variables)
  elementSelector?: string     // Primary selector e.g., '.hifi-btn-cobalt'
  suiteColor?: string          // Prismatic color e.g., 'cobalt'
  category?: string            // Asset category e.g., 'button', 'card'
  subCategory?: string         // Sub-category e.g., 'primary', 'outline'
  name?: string                // Human-readable name

  // Preview Data (Expression) - The proof
  base64?: string              // PNG preview image
  width?: number
  height?: number

  createdAt?: number
}
\`\`\`

## Quick Actions
- Use section=a_trigger for client-side capture guidance
- Use section=b_processing for server-side render guidance
- Use section=z_receiver for client-side result merge guidance
- Use section=categories for taxonomy reference
- Use section=actualization with paradigm=vue|react|html|pptx for output patterns
- Use section=update_guide for adding new categories/colors
- Use section=static_components for Vue component library guidance`,

      a_trigger: `# A Trigger: Client-Side Stencil Capture

## Location
\`client/src/views/creation/index.vue\` → \`handleExportPng()\`

## Responsibilities
1. Find export target element (.export-target)
2. Extract HTML (outerHTML)
3. Extract CSS (extractFullCSS with HiFi variables)
4. Extract metadata:
   - elementSelector: Primary HiFi class selector
   - suiteColor: Prismatic color from class name
   - subCategory: Optional sub-categorization
   - category: Derived from route
   - name: Generated from color + category

## Key Functions
- \`extractFullCSS(element)\`: Captures computed styles + HiFi base CSS
- Route-based category derivation
- Class-based metadata extraction

## Extraction Logic (Lines 407-451)
\`\`\`typescript
const hifiSelectors = [
  '[class*="hifi-btn"]',
  '[class*="hifi-card"]',
  '[class*="hifi-logo"]',
  '[class*="hifi-badge"]',
  '[class*="hifi-"]'
]

let hifiElement: Element | null = null
for (const selector of hifiSelectors) {
  hifiElement = targetEl.querySelector(selector)
  if (hifiElement) break
  if (targetEl.matches(selector)) {
    hifiElement = targetEl
    break
  }
}

// Extract from class name: hifi-{type}-{color} or hifi-{type}-{sub}-{color}
if (hifiClass) {
  elementSelector = '.' + hifiClass
  const parts = hifiClass.split('-')
  if (parts.length >= 3) {
    const suiteColors = ['obsidian', 'maroon', 'rust', 'ochre', 'viridian', 'cobalt', 'amethyst', 'rose', 'red']
    const lastPart = parts[parts.length - 1]
    if (suiteColors.includes(lastPart)) {
      suiteColor = lastPart
      if (parts.length > 3) {
        subCategory = parts.slice(2, -1).join('-')
      }
    }
  }
}
\`\`\`

## Update Points
- Add new HiFi selectors: Line 407 (hifiSelectors array)
- Add new suite colors: Line 439 (suiteColors array)
- Add new categories: Route handling in deriveCategory()`,

      b_processing: `# B Processing: Server-Side Rendering

## Location
\`server/src/concepts/htmlRenderer/\`

## Files
- \`htmlRenderer.shared.ts\`: Payload types, action creators (Manifold bounding symbols)
- \`htmlRenderer.principle.ts\`: Browser lifecycle management
- \`renderElement.quality.ts\`: B trigger ActionStrategy

## Manifold B→Y Length: Principle (Extended)
Uses Principle because:
- Browser instance requires lifecycle management
- State maintained between renders (browser reuse for performance)
- Resource cleanup on shutdown

## Key Files
| File | Purpose |
|------|---------|
| htmlRenderer.shared.ts | HtmlRendererRenderElementPayload, createHtmlRendererRenderElement |
| htmlRenderer.principle.ts | Puppeteer browser lifecycle, render queue |
| renderElement.quality.ts | B trigger ActionStrategy, queues processing |

## Server Flow
1. Receive HtmlRendererRenderElement action via WebSocket
2. Queue render request in principle
3. Puppeteer creates page with HTML + CSS
4. Screenshot element → base64 PNG
5. Capture dimensions (width, height)
6. Create HtmlRendererRenderComplete action
7. Return to client via WebSocket

## Update Points
- Modify render behavior: \`renderElement.quality.ts\`
- Change browser settings: \`htmlRenderer.principle.ts\`
- Add new payload fields: \`htmlRenderer.shared.ts\``,

      z_receiver: `# Z Receiver: Client-Side Result Merge

## Location
\`client/src/concepts/hifi/qualities/renderComplete.quality.ts\`

## Responsibilities
1. Receive base64 + dimensions from server
2. Find pending render by ID in client state
3. Merge stencil metadata with preview data
4. Update status to 'complete'
5. Trigger localStorage persistence (via localStorage principle)

## Key Pattern: Stencil + Preview Merge
The Z receiver MERGES server preview with client stencil:

**Client holds (from A Trigger):**
- htmlSource, cssSource
- elementSelector, suiteColor
- category, subCategory, name
- createdAt

**Server returns (from Y Anchor):**
- base64 (PNG preview)
- width, height

**Result:** Complete stencil with proof of actualization

## Reducer Pattern
\`\`\`typescript
reducer: (state, action) => {
  const { id, base64, width, height } = action.payload
  const renderResults = { ...state.renderResults }
  const existing = renderResults[id]

  if (existing) {
    // MERGE: Keep stencil data, add preview data
    renderResults[id] = {
      ...existing,
      status: 'complete',
      base64,
      width,
      height
    }
  }

  return {
    renderResults,
    pendingRenders: state.pendingRenders.filter(pid => pid !== id)
  }
}
\`\`\`

## Update Points
- Add new result fields: Modify reducer merge logic
- Change persistence behavior: Check localStorage principle`,

      categories: `# Asset Category Taxonomy

## Primary Categories (from route)
| Category    | Route Pattern         | Description                    |
|-------------|----------------------|--------------------------------|
| button      | /creation/buttons    | Interactive button elements    |
| card        | /creation/cards      | Content container cards        |
| logo        | /creation/logos      | Brand/identity elements        |
| badge       | /creation/badges     | Status/notification badges     |
| typography  | /creation/typography | Text styling components        |
| layout      | /creation/layouts    | Structural layout elements     |
| element     | /creation/elements   | Generic UI elements            |

## Sub-Categories (from class name)
| Category | SubCategory | Class Pattern                    |
|----------|-------------|----------------------------------|
| button   | primary     | hifi-btn-primary-{color}         |
| button   | outline     | hifi-btn-outline-{color}         |
| button   | icon        | hifi-btn-icon-{color}            |
| button   | ghost       | hifi-btn-ghost-{color}           |
| card     | elevated    | hifi-card-elevated-{color}       |
| card     | flat        | hifi-card-flat-{color}           |
| badge    | dot         | hifi-badge-dot-{color}           |
| badge    | count       | hifi-badge-count-{color}         |

## Suite Colors (Prismatic Spectrum)
| Color     | CSS Variable          | Hex       | Suite |
|-----------|-----------------------|-----------|-------|
| obsidian  | --color-obsidian      | #0a0a0a   | 0     |
| maroon    | --color-maroon        | #800020   | 1     |
| rust      | --color-rust          | #b7410e   | 2     |
| ochre     | --color-ochre         | #cc7722   | 3     |
| viridian  | --color-viridian      | #4aa685   | 4     |
| cobalt    | --color-cobalt        | #0047ab   | 5     |
| amethyst  | --color-amethyst      | #7c17e0   | 6     |
| rose      | --color-rose          | #ff1a8f   | 7     |

## Naming Convention
\`\`\`
hifi-{type}-{color}           → category, no subCategory
hifi-{type}-{sub}-{color}     → category + subCategory

Examples:
hifi-btn-cobalt               → button, "", cobalt
hifi-btn-outline-maroon       → button, outline, maroon
hifi-card-elevated-viridian   → card, elevated, viridian
\`\`\``,

      actualization: `# Agnostic Stencil Actualization Patterns

## Core Principle
Stencils are paradigm-agnostic. The htmlSource + cssSource can be actualized anywhere.

${
  paradigm === 'html' || !paradigm
    ? `## Pattern: Vanilla HTML
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <style>{stencil.cssSource}</style>
</head>
<body>
  {stencil.htmlSource}
</body>
</html>
\`\`\`
`
    : ''
}
${
  paradigm === 'vue' || !paradigm
    ? `## Pattern: Vue Component
\`\`\`vue
<template>
  <div v-html="stencilHtml"></div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps<{ stencil: RenderResult }>()
const stencilHtml = computed(() => props.stencil.htmlSource)
</script>

<style>
/* Inject stencil.cssSource via <style> tag or CSS-in-JS */
</style>
\`\`\`
`
    : ''
}
${
  paradigm === 'react' || !paradigm
    ? `## Pattern: React Component
\`\`\`tsx
function StencilComponent({ stencil }: { stencil: RenderResult }) {
  return (
    <>
      <style>{stencil.cssSource}</style>
      <div dangerouslySetInnerHTML={{ __html: stencil.htmlSource }} />
    </>
  )
}
\`\`\`
`
    : ''
}
${
  paradigm === 'pptx' || !paradigm
    ? `## Pattern: PPTX Slide (via pptxgenjs)
\`\`\`typescript
// For PPTX, use the base64 preview (stencils need browser to render)
slide.addImage({
  data: \\\`data:image/png;base64,\\\${stencil.base64}\\\`,
  x: placement.x,
  y: placement.y,
  w: placement.width,
  h: placement.height
})
\`\`\`
`
    : ''
}
${
  paradigm === 'pdf' || !paradigm
    ? `## Pattern: PDF (Server-Side HTML Rendering)
\`\`\`typescript
// Compose HTML document with stencil(s)
const html = \\\`
<!DOCTYPE html>
<html>
<head><style>\\\${stencil.cssSource}</style></head>
<body>\\\${stencil.htmlSource}</body>
</html>
\\\`
// Render via Puppeteer → PDF output
await page.setContent(html)
await page.pdf({ path: 'output.pdf' })
\`\`\`
`
    : ''
}
## CSS Deduplication Strategy
When composing multiple stencils:
1. Extract :root CSS variables (shared across all)
2. Extract component-specific styles
3. Deduplicate shared rules
4. Compose final CSS: variables + unique rules`,

      update_guide: `# Manifold Update Guide

## Adding a New Category

### Step 1: Update Route Derivation
File: \`client/src/views/creation/index.vue\`
Add route pattern matching for new category.

### Step 2: Create Category View
File: \`client/src/views/creation/newcategory.vue\`
- Copy structure from buttons.vue
- Modify component class patterns
- Add to router

### Step 3: Update MCP Tool Categories
File: \`server/src/concepts/scp/model/scp.protocol.ts\`
- Update hifi_stencils category list
- Update asset_production_manifold categories section

## Adding a New SubCategory

### Step 1: Define Class Pattern
Convention: \`hifi-{type}-{subcategory}-{color}\`
Example: \`hifi-btn-outline-cobalt\`

### Step 2: Verify Extraction Logic
File: \`client/src/views/creation/index.vue\` (lines 407-451)
The current extraction automatically handles subCategories.

### Step 3: Create Component Variant
Add CSS for new subCategory pattern in HiFi base styles.

## Adding a New Suite Color

### Step 1: Update CSS Variables
File: HiFi base CSS (HIFI_BASE_CSS constant)
\`\`\`css
/* Suite N: NewColor */
--color-newcolor: #hexvalue;
--color-newcolor-light: #hexvalue;
--color-newcolor-dark: #hexvalue;
\`\`\`

### Step 2: Update Extraction Array
File: \`client/src/views/creation/index.vue\` (line 439)
\`\`\`typescript
const suiteColors = ['obsidian', 'maroon', ..., 'newcolor']
\`\`\`

### Step 3: Add Component Styles
Add \`.hifi-btn-newcolor\`, \`.hifi-card-newcolor\`, etc.

## Key Files Reference
| File | Purpose |
|------|---------|
| client/src/views/creation/index.vue | A Trigger, extraction logic |
| client/src/concepts/hifi/hifi.shared.ts | RenderResult type |
| client/src/concepts/hifi/qualities/types.ts | Payload types |
| server/src/concepts/htmlRenderer/htmlRenderer.shared.ts | Manifold bounding symbols |
| server/src/concepts/scp/model/scp.protocol.ts | MCP tools |`,

      static_components: `# Static Vue Components for HiFi Library

## Architecture Overview
Static Vue components serve as:
1. **Design Templates**: Pre-configured stencil sources
2. **Workshop Presets**: Quick-start configurations
3. **Library Organization**: Categorized component inventory

## Planned Component Structure
\`\`\`
client/src/components/hifi/
├── buttons/
│   ├── HifiButtonPrimary.vue
│   ├── HifiButtonOutline.vue
│   ├── HifiButtonIcon.vue
│   └── index.ts (exports all)
├── cards/
│   ├── HifiCardElevated.vue
│   ├── HifiCardFlat.vue
│   └── index.ts
├── badges/
│   ├── HifiBadgeDot.vue
│   ├── HifiBadgeCount.vue
│   └── index.ts
└── index.ts (master export)
\`\`\`

## Component Template Pattern
\`\`\`vue
<script setup lang="ts">
/**
 * HifiButtonPrimary - Primary action button
 * Category: button
 * SubCategory: primary
 * Compatible Colors: all suite colors
 */
defineProps<{
  color?: 'obsidian' | 'maroon' | 'rust' | 'ochre' | 'viridian' | 'cobalt' | 'amethyst' | 'rose'
  text?: string
}>()
</script>

<template>
  <button :class="\\\`hifi-btn-\\\${color || 'cobalt'}\\\`">
    <slot>{{ text || 'Click Me' }}</slot>
  </button>
</template>
\`\`\`

## Workshop Integration
Static components populate Workshop category views:
- Route \`/creation/buttons\` renders button component variants
- User selects color, modifies text
- Export captures stencil with full metadata

## Dynamic Data Flow
\`\`\`
Static Component (Template)
    ↓ props: { color, text, ... }
Workshop Preview (Rendered)
    ↓ handleExportPng()
Stencil (Origin + Preview)
    ↓ localStorage + MCP access
Slide Composition / External Use
\`\`\`

## Implementation Status
- [ ] Create components/hifi/ directory
- [ ] Implement button variants
- [ ] Implement card variants
- [ ] Implement badge variants
- [ ] Export master index
- [ ] Integrate into Workshop views`,
    };

    // Category-specific filtering
    if (category && section === 'categories') {
      const categoryInfo: Record<string, string> = {
        button: `# Button Category

## Overview
Interactive button elements for actions and navigation.

## SubCategories
| SubCategory | Class Pattern              | Description           |
|-------------|----------------------------|-----------------------|
| (none)      | hifi-btn-{color}           | Standard button       |
| primary     | hifi-btn-primary-{color}   | Primary action        |
| outline     | hifi-btn-outline-{color}   | Outlined style        |
| icon        | hifi-btn-icon-{color}      | Icon-only button      |
| ghost       | hifi-btn-ghost-{color}     | Minimal/ghost style   |

## Available Colors
obsidian, maroon, rust, ochre, viridian, cobalt, amethyst, rose`,
        card: `# Card Category

## Overview
Content container cards for displaying information.

## SubCategories
| SubCategory | Class Pattern              | Description           |
|-------------|----------------------------|-----------------------|
| (none)      | hifi-card-{color}          | Standard card         |
| elevated    | hifi-card-elevated-{color} | Elevated with shadow  |
| flat        | hifi-card-flat-{color}     | Flat style            |

## Available Colors
obsidian, maroon, rust, ochre, viridian, cobalt, amethyst, rose`,
        badge: `# Badge Category

## Overview
Status and notification badges.

## SubCategories
| SubCategory | Class Pattern              | Description           |
|-------------|----------------------------|-----------------------|
| (none)      | hifi-badge-{color}         | Standard badge        |
| dot         | hifi-badge-dot-{color}     | Dot indicator         |
| count       | hifi-badge-count-{color}   | Count badge           |

## Available Colors
obsidian, maroon, rust, ochre, viridian, cobalt, amethyst, rose`,
      };

      if (categoryInfo[category]) {
        return categoryInfo[category];
      }
    }

    // Return the requested section
    if (sections[section]) {
      return sections[section];
    }

    // Default: return available sections
    return JSON.stringify(
      {
        error: `Unknown section: ${section}`,
        availableSections: Object.keys(sections),
        usage: {
          overview: 'Complete manifold flow diagram and structure',
          a_trigger: 'Client-side stencil capture guidance',
          b_processing: 'Server-side render processing',
          z_receiver: 'Client-side result merge pattern',
          categories: 'Asset category taxonomy (add category param for specific)',
          actualization: 'Agnostic output patterns (add paradigm param for specific)',
          update_guide: 'How to add new categories/colors/subcategories',
          static_components: 'Vue component library structure',
        },
        coreInsight: 'The image is the preview, the stencil is the product.',
      },
      null,
      2,
    );
  },
};

// ═══════════════════════════════════════════════════════════════════
// SLIDE IMAGE GENERATION TOOL - Instructions for using SlideImageHelper
// ═══════════════════════════════════════════════════════════════════

/**
 * Slide Image Generation Tool - Provides instructions for SlideImageHelper usage
 *
 * Purpose: Guide AI assistants on how to use the SlideImageHelper component
 * for reactive image rendering in slides.
 *
 * Citation: Suite 5 Cobalt - Professional Implementation
 */
export const slideImageGenerationTool: SCPToolDefinition = {
  name: 'slide_image_generation',
  description:
    'Get instructions for using SlideImageHelper and creating new slides. Sections: overview | props | examples | workflow | new_slide | locations',
  inputSchema: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        description: 'Section: overview | props | examples | workflow | new_slide | locations',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const section = (params.section as string) || 'overview';

    const sections: Record<string, string> = {
      overview: GENERATION_INSTRUCTIONS,

      props: `
# SlideImageHelper Props Reference

## Required (one of)
- \`renderId\`: string - Direct UUID from renderResults
- \`stateKey\`: string - State path to read renderId from

## Sizing
- \`width\`: string | number - CSS width (e.g., '100%', 400, 'auto')
- \`height\`: string | number - CSS height
- \`objectFit\`: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'

## Display
- \`alt\`: string - Alt text for accessibility
- \`showLoading\`: boolean - Show spinner during load (default: true)

## Component States
- **Loading**: Shows spinner while render is pending
- **Error**: Shows warning if render failed
- **Empty**: Shows message if no renderId provided
- **Ready**: Displays image from base64 data
`,

      examples: `
# SlideImageHelper Examples

## Basic Render Display
\`\`\`vue
<SlideImageHelper :render-id="'abc123-def456-...'" />
\`\`\`

## Sized Container
\`\`\`vue
<SlideImageHelper
  :render-id="renderId"
  width="300"
  height="200"
  object-fit="cover"
  alt="HiFi Button Render"
/>
\`\`\`

## Responsive Full Width
\`\`\`vue
<SlideImageHelper
  :render-id="renderId"
  width="100%"
  height="auto"
  object-fit="contain"
/>
\`\`\`

## In Placed Asset Context (slides/index.vue)
\`\`\`vue
<div
  v-for="asset in activeSlide.includedAssets"
  :key="asset.id"
  class="placed-asset"
  :style="{ left: asset.placement.x + 'px', ... }"
>
  <SlideImageHelper
    :render-id="asset.renderId"
    :alt="asset.name"
    width="100%"
    height="100%"
    object-fit="contain"
  />
</div>
\`\`\`
`,

      workflow: `
# Workflow: Adding Rendered Image to Slide

## Step 1: Create a Render
- Use Creation Workshop (/creation)
- Design HiFi element (button, logo, etc.)
- Click "Export to PNG" to trigger render pipeline
- Render completes via A→B→Y→Z manifold

## Step 2: Query Available Renders
\`\`\`bash
curl -X POST http://localhost:7111/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"available_renders","arguments":{"action":"list"}}}'
\`\`\`

## Step 3: View Slide Composition
\`\`\`bash
curl -X POST http://localhost:7111/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"slide_composition","arguments":{"action":"list"}}}'
\`\`\`

## Step 4: Add Render to Slide
**Via UI**: Open Asset Panel, drag from Available to Included
**Via Code**: Dispatch slideComposerAddAssetToSlide action

## Step 5: View Result
- Navigate to Slides page (/slides)
- Click slide to enter full-screen view
- SlideImageHelper reactively displays the placed render
`,

      new_slide: `
# Workflow: Creating a New Static Slide

## Architecture: Stop Gap Pattern
Each slide is a **static Vue component** that renders independently.
State is **lazily hydrated** on first interaction via \`slideComposerAddSlide\`.

## Step 1: Create Vue Component
Create new file: \`/client/src/components/slides/[Name]Slide.vue\`

\`\`\`vue
<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import type { Muxium } from 'stratimux'
import type { ClientDeck } from '../../concepts/client/client.concept'
import type { ComposedSlide, SlideAsset } from '../../concepts/slideComposer/slideComposer.shared'
import SlideImageHelper from './SlideImageHelper.vue'

const SLIDE_ID = 'slide-N-name'  // Match your ID

const muxium = inject<Muxium<ClientDeck>>('muxium')
const slides = ref<ComposedSlide[]>([])
const renderResults = ref<Record<string, { status: string; base64?: string }>>({})

let stagePlanner: { conclude: () => void } | null = null

onMounted(() => {
  if (muxium) {
    stagePlanner = muxium.plan<ClientDeck>('slideSubscription', ({ staging, stage, d__ }) => staging(() => {
      return [
        stage(
          ({ d }) => {
            slides.value = d.client.k.slides.select()
            renderResults.value = d.client.k.renderResults.select()
          },
          {
            selectors: [d__.client.k.slides, d__.client.k.renderResults]
          }
        )
      ]
    })) as { conclude: () => void }
  }
})

onUnmounted(() => {
  if (stagePlanner?.conclude) stagePlanner.conclude()
})

const currentSlide = computed(() => slides.value.find(s => s.id === SLIDE_ID) || null)
const includedAssets = computed((): SlideAsset[] => currentSlide.value?.includedAssets || [])
</script>

<template>
  <div class="your-slide">
    <h2>YOUR SLIDE TITLE</h2>
    <!-- Use SlideImageHelper for assets -->
    <div v-for="asset in includedAssets" :key="asset.id">
      <SlideImageHelper :render-id="asset.renderId" :alt="asset.name" />
    </div>
  </div>
</template>

<style scoped>
/* Your scoped styles */
</style>
\`\`\`

## Step 2: Add to Slide Definition Mapping
Edit: \`/client/src/views/slides/index.vue\`

Add to \`slideIdToDefinition\` object:
\`\`\`typescript
'slide-N-name': {
  component: 'NameSlide',
  name: 'Slide Name',
  order: N,
  background: { type: 'color', value: 'var(--color-obsidian)' }
}
\`\`\`

## Step 3: Add to INITIAL_SLIDES (Optional)
Edit: \`/client/src/concepts/slideComposer/slideComposer.shared.ts\`

Add to \`INITIAL_SLIDES\` array:
\`\`\`typescript
{
  id: 'slide-N-name',
  name: 'Slide Name',
  order: N,
  background: { type: 'color' as const, value: 'var(--color-obsidian)' },
  component: 'NameSlide',
  htmlContent: ''
}
\`\`\`

## Step 4: Lazy Hydration (Automatic)
When user clicks the new slide:
1. \`selectSlide()\` checks if slide exists in state
2. If not → dispatches \`slideComposerAddSlide\` with metadata from \`slideIdToDefinition\`
3. Slide is added to state and persisted via localStorage
4. Future visits load from localStorage

## Key Files
- **Component**: \`/client/src/components/slides/[Name]Slide.vue\`
- **Mapping**: \`/client/src/views/slides/index.vue\` (slideIdToDefinition)
- **Initial State**: \`/client/src/concepts/slideComposer/slideComposer.shared.ts\`
- **Quality**: \`/client/src/concepts/slideComposer/qualities/addSlide.quality.ts\`
`,

      locations: `
# File Locations for Static Slide Architecture

## Slide Components (Static)
\`/client/src/components/slides/\`
- \`SlideImageHelper.vue\` - Reactive image loader
- \`CoverSlide.vue\` - Title/intro slide
- \`RenderPreviewSlide.vue\` - Render pipeline demo
- \`CompositionSlide.vue\` - Multi-asset composition
- \`SummarySlide.vue\` - Summary slide
- Add new slides here as \`[Name]Slide.vue\`

## Slide Renderer & Definition Mapping
\`/client/src/views/slides/index.vue\`
- \`slideIdToDefinition\` - Maps slide IDs to component metadata
- \`selectSlide()\` - Lazy hydration check
- Directory-based component iterator via import.meta.glob

## State & Qualities
\`/client/src/concepts/slideComposer/\`
- \`qualities/types.ts\` - SlideComposerState, ComposedSlide types
- \`qualities/addSlide.quality.ts\` - Lazy hydration quality
- \`slideComposer.shared.ts\` - INITIAL_SLIDES config
- \`principles/localStorageRegistration.principle.ts\` - Persistence

## State Sources
\`/client/src/concepts/hifi/\`
- renderResults: Record<string, RenderResult>
- Contains base64 data for completed renders

## MCP Tools
- \`available_renders\`: Query completed renders
- \`slide_composition\`: Query slide state
- \`slide_image_generation\`: This tool (use section: "new_slide" for creating slides)
`,
    };

    return sections[section] || sections.overview;
  },
};

// ═══════════════════════════════════════════════════════════════════
// HUIRTH TOOLS DISPLAY - List all available Huirth MCP tools
// ═══════════════════════════════════════════════════════════════════

/**
 * Huirth Tools Display - Shows all available MCP tools with descriptions
 *
 * Purpose: Provide a single entry point for discovering all Huirth tools
 * and their purposes. Includes generation instructions where relevant.
 */
export const huirthToolsDisplayTool: SCPToolDefinition = {
  name: 'huirth_tools',
  description:
    'Display all available Huirth MCP tools with descriptions and usage. Start here to discover capabilities.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by category: all | state | patterns | generation | maintenance',
      },
      include_generation_instructions: {
        type: 'boolean',
        description: 'Include SlideImageHelper generation instructions (default: false)',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const category = (params.category as string) || 'all';
    const includeGenInstructions = params.include_generation_instructions === true;

    const tools = {
      state: [
        {
          name: 'client_state',
          description: 'Query live client state cached on server',
          actions: ['query', 'render_metadata', 'schema', 'describe'],
          usage: 'Get client state properties like darkMode, renderResults, slides',
        },
        {
          name: 'slide_composition',
          description: 'Query slide composition state',
          actions: ['list', 'detail', 'placements', 'active'],
          usage: 'View slides, their assets, and placement information',
        },
        {
          name: 'available_renders',
          description: 'Query available HiFi renders for placement',
          actions: ['list', 'pending', 'detail'],
          usage: 'List completed renders that can be placed on slides',
        },
        {
          name: 'hifi_stencils',
          description: 'Query HiFi design stencils (Origin: HTML+CSS)',
          actions: ['list', 'detail', 'by_category', 'by_color'],
          usage:
            'The image is the preview, the stencil is the product. Query stencils to get HTML+CSS Origin data for actualization.',
        },
      ],
      patterns: [
        {
          name: 'pattern_stencil',
          description: 'Query multiple Stratimux patterns',
          usage: 'Get implementation patterns like quality:payload, deck_k:principle_context',
          hint: 'Use list_available: true to see all patterns',
        },
        {
          name: 'pattern_manifold_a_to_z',
          description: 'Step-by-step guide for client-server round-trips',
          sections: [
            'overview',
            'a_trigger',
            'b_trigger',
            'b_to_y_decision',
            'y_anchor',
            'z_return',
            'shared_ts',
            'checklist',
          ],
          usage: 'Learn A→B→Y→Z Stratimuxian Manifold pattern',
        },
      ],
      generation: [
        {
          name: 'slide_image_generation',
          description: 'Instructions for using SlideImageHelper and creating static slides',
          sections: ['overview', 'props', 'examples', 'workflow', 'new_slide', 'locations'],
          usage: 'Learn how to generate reactive slide images and create new slides',
        },
      ],
      maintenance: [
        {
          name: 'tool_maintenance',
          description: 'Guide for updating and maintaining Huirth MCP tools',
          sections: [
            'overview',
            'add_tool',
            'update_tool',
            'add_pattern',
            'type_safety',
            'testing',
          ],
          usage: 'Learn how to add or modify MCP tools',
        },
        {
          name: 'hello_world',
          description: 'Simple greeting tool for testing',
          usage: 'Verify MCP connection is working',
        },
      ],
    };

    let output = `# Huirth MCP Tools\n\n`;
    output += `Available tools for interacting with Huirth HiFi Design Suite.\n\n`;

    const categoriesToShow = category === 'all' ? Object.keys(tools) : [category];

    for (const cat of categoriesToShow) {
      if (!(cat in tools)) continue;

      output += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)} Tools\n\n`;

      for (const tool of tools[cat as keyof typeof tools]) {
        output += `### ${tool.name}\n`;
        output += `${tool.description}\n\n`;

        if ('actions' in tool) {
          output += `**Actions**: ${tool.actions.join(', ')}\n\n`;
        }
        if ('sections' in tool && tool.sections) {
          output += `**Sections**: ${tool.sections.join(', ')}\n\n`;
        }
        if ('hint' in tool) {
          output += `**Hint**: ${tool.hint}\n\n`;
        }

        output += `**Usage**: ${tool.usage}\n\n`;
      }
    }

    // Add generation instructions if requested
    if (includeGenInstructions) {
      output += `---\n\n`;
      output += GENERATION_INSTRUCTIONS;
    }

    output += `---\n\n`;
    output += `## Quick Start\n\n`;
    output += `1. **Discover**: Call \`huirth_tools\` (this tool) to see available tools\n`;
    output += `2. **State**: Use \`client_state\`, \`slide_composition\`, \`available_renders\` to query state\n`;
    output += `3. **Patterns**: Use \`pattern_stencil\` for Stratimux implementation patterns\n`;
    output += `4. **Generation**: Use \`slide_image_generation\` for SlideImageHelper instructions\n`;
    output += `5. **Maintenance**: Use \`tool_maintenance\` to learn how to modify tools\n`;

    return output;
  },
};

export const patternStencilTool: SCPToolDefinition = {
  name: 'pattern_stencil',
  description:
    'Query multiple Stratimux patterns and receive combined stencils with dependency suggestions',
  inputSchema: {
    type: 'object',
    properties: {
      patterns: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Array of pattern identifiers in "category:section" format (e.g., ["quality:payload", "strategy:data_field"])',
      },
      include_suggestions: {
        type: 'boolean',
        description: 'Include suggested dependency patterns (default: true)',
      },
      list_available: {
        type: 'boolean',
        description: 'List all available pattern identifiers',
      },
    },
    required: [],
  },
  registeredAt: Date.now(),
  handler: (params: Record<string, unknown>) => {
    const patterns = (params.patterns as string[]) || [];
    const includeSuggestions = params.include_suggestions !== false;
    const listAvailable = params.list_available === true;

    if (listAvailable) {
      const available = Object.keys(patternRegistry).reduce((acc, id) => {
        const entry = patternRegistry[id];
        const [category] = id.split(':');
        if (!acc[category]) acc[category] = [];
        acc[category].push({ id, tier: entry.tier });
        return acc;
      }, {} as Record<string, Array<{ id: string; tier: number }>>);

      return JSON.stringify(
        {
          available,
          usage: 'Call with patterns: ["category:section", ...] to get stencil content',
        },
        null,
        2,
      );
    }

    if (patterns.length === 0) {
      return JSON.stringify(
        {
          error: 'No patterns specified',
          usage: 'Provide patterns array: ["quality:payload", "deck_k:principle_context"]',
          hint: 'Use list_available: true to see all available patterns',
        },
        null,
        2,
      );
    }

    const fulfilled: string[] = [];
    const unfulfilled: string[] = [];
    const contentParts: string[] = [];
    const references: Record<string, string[]> = {};

    for (const patternId of patterns) {
      const entry = patternRegistry[patternId];
      if (entry) {
        fulfilled.push(patternId);
        contentParts.push(entry.content);
        references[patternId] = entry.references;
      } else {
        unfulfilled.push(patternId);
      }
    }

    const suggestions = includeSuggestions ? generateSuggestions(patterns, fulfilled) : [];

    let output = `# Pattern Stencil Response\n\n`;
    output += `## Requested: ${patterns.length} | Fulfilled: ${fulfilled.length}\n\n`;

    if (unfulfilled.length > 0) {
      output += `### Unfulfilled Patterns\n`;
      output += unfulfilled.map((p) => `- ${p}`).join('\n');
      output += '\n\n';
    }

    if (suggestions.length > 0) {
      output += `### Suggested Dependencies\n`;
      output += `Consider also querying:\n`;
      output += suggestions.map((s) => `- ${s}`).join('\n');
      output += '\n\n';
    }

    output += `---\n\n`;
    output += contentParts.join('\n---\n');

    output += `\n\n---\n\n## References\n\n`;
    for (const [id, refs] of Object.entries(references)) {
      output += `### ${id}\n`;
      output += refs.map((r) => `- ${r}`).join('\n');
      output += '\n';
    }

    return output;
  },
};
