# Template Suite 8 — Skill Reference

**Version**: 1.0
**Signatures**: 3 (S1-S3)
**Scaffold**: GTMS8C — the renameable Suite 8 Home Page + Base Cascade Menu pipe

---

## S1: SCS:Init Base Cascade Menu (FKISBCM)

```
Spawn (SCS:Init) → Read SM-Index Menu Registry headers (two-anchor parse: H1 + Menu ID)
                 → serialize a MenuStage (stageIndex 0 · options[] = one per surfaced SM doc)
                 → write menu.json to the RI dir
                 → the menu-watch dir-watch broadcasts → ShatteriteMenu renders
```

The Base Cascade Menu is the Anchor's load-bearing first act. The teaching lives in `Onboard.md`
(`## SCS:Init — Author the Base Cascade Menu`). The file-write IS the Lambda — no menu.json, no menu.

**Lambda**: the `menu.json` write to the RI dir is the verified event; the menu-watch dir-watch +
ShatteriteMenu render is the downstream Demonstration.

---

## S2: Stay-Interactive Loop (UPIDB)

```
Receive scsCommand (stdin) → act on the selection → write the NEXT menu.json stage (stageIndex++)
                           → the dir-watch broadcasts the new stage → the menu advances
```

The Anchor persists as the page's guide. Each user selection curries an `scsCommand` back to the
Anchor; the Anchor acts and authors the next stage. This is the loop-completion invariant.

---

## S3: Domain Adapt (install-agent surface)

```
Install agent → COPY-MOVE-RENAME the suite8 concept + this instance dir into the user's domain
             → fill the page's DOMAIN IDENTITY refs (domainName · domainTagline · suite8Name)
             → SAMLS-swap the renamed page to the / route (S10-HomePageAdapt)
```

The scaffold ships operable under the general name; the install agent adapts it into the user's
domain. The menu pipe + PAOLRP anchor are ALREADY wired — the adapt fills domain CONTENT, not the
pipe. See `Cascades/8_SUITES/SCS Bridge/Strategy/S9-DomainPageCreate.md` + `S10-HomePageAdapt.md`.
