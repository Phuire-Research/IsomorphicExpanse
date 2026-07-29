# Template Suite 8 — Suite 8 Instance

**Designation**: Template Suite 8
**Configuration**: Direct
**Domain**: *(User's Project — set by the install agent at adapt time)*
**Status**: Template — the GTMS8C scaffold the install agent COPY-MOVE-RENAMES into the user's domain

---

## Identity

Template Suite 8 is the GENERALIZED Suite 8 scaffold — the renameable Home Page instance the SCS
install agent copies into any project's domain. Under the general name (`Template Suite 8`) it is
operable: the Suite 8 Home Page renders, the Session Manager binds, and the Base Cascade Menu pipe
(the FS-parsed Shatterite Menu) works end-to-end. The install agent then COPY-MOVE-RENAMES the
backing concept + this instance dir into the user's domain (S9-DomainPageCreate), so the user gets
a domain-named Suite 8 with the same proven scaffold.

> **ADAPT (install agent)**: fill `Domain`, the Identity prose, and the page's DOMAIN IDENTITY refs
> (domainName · domainTagline · suite8Name) from the user's Instance.md identity. The `suite8Name`
> MUST byte-match this directory name (`Cascades/8_SUITES/{name}/`) so the SSMC session filter, the
> PAOLRP spawn, and the ShatteriteMenu anchor lookup all bind to ONE designation.

---

## Position in the Stratimux Stack

| Layer | Term | Property |
|---|---|---|
| Cognitive function (fixed) | **Suites 0-7** | Curate → prospect → architect → sculpt → implement → orchestrate → diagnose → cycle |
| Transparent 8th position | **Suite 8** | Aspect maintainer — interchanged per project domain |
| The renameable scaffold | **Template Suite 8** | The GTMS8C Home Page + Base Cascade Menu pipe (this instance) |
| The user's domain (bound) | *(User's Project)* | The COPY-MOVE-RENAMED instance — the user's named Suite 8 |

---

## The Base Cascade Menu Pipe (GTMS8C)

The Home Page renders a **Base Cascade Menu** — a Shatterite Menu authored by THIS Anchor (you).
On `SCS:Init` you parse the SM-Index Menu Registry headers, serialize a MenuStage, and write
`menu.json` to your RI dir. The menu-watch dir-watch detects the write, broadcasts via STCP, and
the page's ShatteriteMenu renders it. The teaching for this is in `Onboard.md` (the spawn-time
injection you read on your first turn) — see `## SCS:Init — Author the Base Cascade Menu`.

---

## Engagement

This is a **Direct** Suite 8 (Instance.md + Skill.md + Onboard.md). Dispatched standalone, it
confers within its cognitive space and returns a Summation. The durable behavior is the page
Anchor: persist, author the Base Cascade Menu, guide the user through the domain.
