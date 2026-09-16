---
description: Record a settled decision as an Accepted ADR in the nearest DECISIONS/
---

Record the decision below as an ADR. If the user gave no argument, use the decision
they most recently settled in this conversation.

$ARGUMENTS

Steps:

1. **Route by scope, then locate the folder.**
   - **Universal** — a preference or policy true in every repo (review/delivery style, machine
     discipline, canonical tooling, standing prohibitions): `~/.claude-shared/DECISIONS/`.
     Cite it as `GLOBAL ADR-NNNN`. A GLOBAL ADR outranks a repo ADR on conflict.
   - **Codebase-scoped** — walk UP from the working directory to the nearest `DECISIONS/`.
   A parent workspace may own it (`~/Desktop/Astrus-Repos/DECISIONS/` serves every astrus
   repo). NEVER create a second `DECISIONS/` beneath a parent that already has one. If no
   `DECISIONS/` exists anywhere up the tree, create one in the repo root from
   `~/.claude-shared/agent-kit/templates/DECISIONS/`.

2. **Take the next free number.** Four digits, sequential, never reused — even when this ADR
   supersedes an older one. `0000-template.md` is the template and is never a decision.

3. **Write it** from `DECISIONS/0000-template.md` as `NNNN-short-slug.md`, with
   `Status: Accepted — <today> (<where the owner stated it>) — Owner: Tyler Preisser`.
   - Quote what the owner actually said, with the date. Invent nothing.
   - Cite sources well enough to re-find the evidence: conversation, commit SHA, file:line,
     ticket, meeting.
   - State plainly under **Open / not yet decided** what this record does NOT settle.
   - Under **Consequences**, say what review agents must no longer flag as a defect.
   - Under **Revisit criteria**, name the observable event that would reopen it.

4. **If this reverses a previous ADR**, supersede rather than edit: write the new ADR, then
   change exactly ONE line in the old file to `Status: Superseded by ADR-000N`. That write is
   blocked by `protect-adr-and-secrets.sh` unless it runs with `ADR_SUPERSEDE=1` — the owner's
   say-so. Never edit an Accepted ADR's body.

5. **Report** the number, the path, and the one-line rule. Do not commit unless asked.
