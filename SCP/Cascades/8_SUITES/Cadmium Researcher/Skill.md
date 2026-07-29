# Cadmium Researcher — Skill Reference

**Version**: 1.0
**Signatures**: 5 (S1-S5)
**Lineage**: ActionStrategy (2018) → Planned Query (2025) → Vermillion (2026)

---

## S1: Memory-First Absorb

```
Receive request → Read Diamond + Onyx BEFORE web_search
               → identify what's grounded in accumulated context
               → identify gaps requiring external retrieval
               → only THEN engage external research
```

The Stage 0 of any research engagement is Memory. Read what the system already knows before reaching outward. Cold-start handling: when no prior context exists, S1 acknowledges the cold start explicitly and proceeds to external search. The pattern is not "always find prior context" — the pattern is "always check first."

**Lambda**: The Read/Grep operations that verify prior context ARE the Lambda-event. If nothing is found, the cold-start acknowledgment is the verified state.

---

## S2: Curry Forward Protocol

```
At session-end or before context-limit:
  → compress accumulated Diamond into Transfer Initialization Block
  → encode pending work, current state, methodological context
  → produce as portable Markdown that resumes the cascade
  → reconstitutes the working state when loaded
```

Curry Forward is the operational mechanism by which Cadmium Researcher maintains continuity across Rotations when conversation context approaches limits. It is the Lambda artifact that survives context pruning.

**Output format**: A self-contained Markdown block that, when read at the start of a new session, provides sufficient context to resume the research cascade without re-reading the full prior conversation.

---

## S3: Citation-Grade Multi-Stage Rigor

For research-class requests, execute via Planned Query:

### Structured Query — Single Stage

```
<StructuredQuery>
1. Query Explanation — purpose and search process
2. Structured Queries
   search [topic] as Step1 {
       success: proceed to Step2
       failure: attempt Step1a
   }
   Intent: [why this information is needed]
   Transformation: [data presentation spec]
3. Output Refinements — data tables, visualization guidelines
</StructuredQuery>
```

### Planned Query — Multi-Stage Orchestration

```
<PlannedQuery>
System Overview: [Research objective and how stages achieve it]

[
search [topic] as Step1 {
    success: proceed to Step2
    failure: attempt Step1a
}

Intent: [Purpose for this stage]
Transformation: [Data processing specification]
],

[
search [topic] as Step2 {
    success: proceed to Step3
    failure: attempt Step2a
}

Intent: [Purpose for this stage]
Transformation: [Data processing specification]
],

[Additional stages as needed...]
</PlannedQuery>
```

### Decision Block — Dynamic Routing

```
decide: {
    "high_confidence": → deep_investigation
    "medium_confidence": → validation_required
    "low_confidence": → exploration_needed
    "insufficient_data": → pivot_strategy
}
```

### Rigor Standards

- 3-6 stages for complex investigations
- Success/failure branching at each stage
- Transformation specifications declared in advance
- Citation density as quality gate — every claim sourced
- Synthesis stage closes with Practice IS Proof

---

## S4: Banded↔Planned Casting

When a Banded Plan is received from the SCS, cast each Band as an Actionable-gated query stage:

| Banded Plan Element | Planned Query Casting |
|---|---|
| Band N [Suite] | Stage N with Suite-specific cognitive function |
| Informative aspect | Intent statement — what to gather/read/understand |
| Actionable aspect | Transformation specification — what to produce |
| Conference | Decision Block — dynamic routing based on findings |
| Success → next Band | `success: proceed to StepN+1` |
| Failure pathway | `failure: attempt StepNa` (alternative approach) |

Casting template:

```
<PlannedQuery>
System Overview: [From the Banded Plan topic]

[
Band 1 cast as Stage 1:
search [Band 1 Informative scope] as Step1 {
    success: proceed to Step2
    failure: attempt Step1a
}

Intent: [Band 1 Informative aspect]
Transformation: [Band 1 Actionable aspect]
],

[
Band 2 cast as Stage 2:
search [Band 2 Informative scope] as Step2 {
    success: proceed to Step3
    failure: attempt Step2a
    decide: {
        [Conference options if Band specifies Conference]
    }
}

Intent: [Band 2 Informative aspect]
Transformation: [Band 2 Actionable aspect]
],

[Additional Bands cast as stages...]
</PlannedQuery>
```

This interoperation means Banded Plans authored in the SCS can be executed by Cadmium Researcher through the Planned Query casting — same cognitive composition, different execution format.

---

## S5: Muxonomic Reasoning

```
For any research domain:
  → identify distinct Demometers (measurable elements with own properties)
  → map Diameters (similarities drawn between UNLIKE Demometers)
  → recognize Muxameters (integrated regions where Diameters converge)
  → resist taxonomic hierarchy collapse (parent→child reduction)
  → maintain bidirectional relationships (↔ not →)
```

The reasoning substrate. Governs how Cadmium Researcher identifies patterns and maps connections across research domains. Never appears verbatim in deliverable output — **Output Firewall enforced**. The framework vocabulary (Demometer, Diameter, Muxameter, Muxonomy) shapes internal reasoning but does not leak into research deliverables.

---

## Execution Sequence

**Standard Research**:
```
S1 (Absorb) → S3 (Planned Query) → S5 (Muxonomic substrate) → Synthesis
```

**SCS-Dispatched Research**:
```
S1 (Absorb) → S4 (Cast Banded Plan) → S3 (Execute stages) → S5 (substrate) → S2 (Curry Forward if needed) → Return to SCS Clinician
```

**Context-Limit Recovery**:
```
S2 (Curry Forward) → [new session] → S1 (Absorb Transfer Block) → Resume
```
