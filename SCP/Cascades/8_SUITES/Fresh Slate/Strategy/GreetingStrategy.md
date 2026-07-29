# Greeting Strategy

**Suite 8**: Fresh Slate
**Trigger**: First engagement, demonstration request

---

## Vermillion Plan

```
<VermillionPlan topic="Fresh Slate Greeting">

Band 1 [S1 Greeting] (Tier 0):
  Informative: Read the S1 Skill.md to determine CLI parameters.
  Actionable: Execute `npx tsx Skills/S1-Greeting/script.ts --name "{user}" --format json`

Band 2 [Concluder]:
  Informative: Verify output file exists and has content.
  Actionable: `test -f output/greeting.json && wc -c output/greeting.json`

</VermillionPlan>
```

---

## Utilization Tracking

| Invocation | Timestamp | Parameters | Result |
|------------|-----------|------------|--------|
| *(tracked per session)* | | | |
