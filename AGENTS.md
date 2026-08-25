<!-- agent-kit -->
# Agent instructions (every agent, every tool — Claude Code, Codex, Gemini, …)

This repo's agent instructions live in `CLAUDE.md` — read it in full before doing anything.
Settled decisions live in `DECISIONS/` (or the nearest parent directory's `DECISIONS/`) — read them before reviewing or changing code.

- Conformance to an Accepted ADR is never a defect. Do not "fix", re-add, or recommend re-adding what an ADR removed.
- A reviewer may report a finding as BLOCKING only with cited code (file:line). Objections to a settled decision go in a non-blocking "Decision Concerns" section citing the ADR — never as a bug, never as a code change.
- Accepted ADRs are immutable: supersede with a new numbered ADR, never edit the old one.
- Never run a live deploy, record mutation, or force-push to a trunk without explicit human say-so. Dry-runs, plans, and previews are always fine.
