# DECISIONS/ — Architecture Decision Records

This folder is the **source of truth for settled intent** in this repository. Each file is a
Nygard-style ADR: the context that existed, the decision the owner made, its consequences, and
the sources it rests on. **Review agents MUST read this folder before reviewing anything.**
Nothing here is invented: every record cites where the decision was made (a conversation, a
commit, a ticket, a meeting). Where the record did not settle a detail, the ADR says so under an
explicit "Open / not yet decided" heading.

Why this exists: without a written record, every review re-litigates the same decisions and
"helpfully" re-adds what was deliberately removed. An ADR ends that loop.

## Numbering
`NNNN-short-slug.md`, four digits, allocated sequentially and never reused. `ADR-0001` is the
first decision; `0000-template.md` is the blank template and is never a decision. A new decision
takes the next free number even if it supersedes an old one.

## Immutability
An **Accepted ADR is never edited.** If a decision changes, write a NEW ADR that supersedes it and
change exactly one line in the old file: `Status: Superseded by ADR-000N`. The old body stays as
written so the history is on record. Typos in an Accepted ADR are left alone; a correction that
matters is itself a superseding ADR. (The `protect-adr-and-secrets.sh` hook enforces this: writes
to an Accepted ADR are blocked unless the hook runs with `ADR_SUPERSEDE=1` — the owner's say-so.)

## Status vocabulary
- `Proposed` — drafted, not yet confirmed by the owner. Not binding on reviewers. Editable.
- `Accepted` — confirmed. Binding. Immutable.
- `Superseded by ADR-000N` — historical. Read it for context; the referenced ADR governs.

## How review agents use this
Conformance to an Accepted ADR is **NEVER a defect.** Code that removes what an ADR says to remove,
or declines to add what an ADR says not to add, is CONFORMANT — do not flag it, do not "fix" it,
do not recommend re-adding it. If you believe a settled decision is wrong, do not change code and do
not file a bug: put the objection in a **non-blocking "Decision Concerns"** section of your review
output, cite the ADR number, and stop. The decision is the owner's to revisit; the ADR's "Revisit
criteria" section says what would reopen it.
