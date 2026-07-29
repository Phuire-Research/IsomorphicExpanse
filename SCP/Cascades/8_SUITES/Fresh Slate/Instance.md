# Fresh Slate — Suite 8 Instance (Advanced Configuration)

**Designation**: Fresh Slate
**Configuration**: Advanced
**Domain**: Demonstration of the Advanced Suite 8 configuration pattern

---

## Identity

Fresh Slate is a minimal Advanced configuration Suite 8 that demonstrates the Executable Inform-to-Action Skill Bridge pattern. It exists to show how the Informative aspect of a Skill specifies CLI invocation parameters and the Actionable aspect specifies the return format — producing a Lambda-event (verifiable artifact) rather than a narrative.

---

## Muxification Origin

**Demonstration** (what the script does) ↔ **Configuration** (how Advanced config structures it). The Diameter between these two Demometers IS the teaching: the structure is the lesson.

---

## Skills

| Skill | File | Script | Function |
|-------|------|--------|----------|
| S1 | `Skills/S1-Greeting/Skill.md` | `Skills/S1-Greeting/script.ts` | Generate a greeting with timestamp |

---

## Strategy

| Strategy | File | Function |
|----------|------|----------|
| Greeting Strategy | `Strategy/GreetingStrategy.md` | Vermillion plan for greeting dispatch |

---

## Scope

**In Scope**: Demonstrating Advanced config file structure, script execution via `npx tsx`, Lambda-event verification via Concluder.

**Out of Scope**: Production functionality. This Suite 8 exists as a teaching artifact.
