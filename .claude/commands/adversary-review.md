---
description: Adversarial review of a PR or git range — cited-code bugs vs non-blocking decision concerns. Read-only; never posts to GitHub.
allowed-tools: Bash(gh auth status:*), Bash(gh pr view:*), Bash(gh pr diff:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Agent
argument-hint: [PR number | git range]   (default: HEAD~1)
---

# Adversarial review: `$ARGUMENTS`

## Pre-computed context

- Working tree: !`pwd`
- Branch: !`git branch --show-current 2>/dev/null || echo "(not a git repo)"`
- `gh` account: !`gh auth status 2>&1 | grep -E 'Logged in|account' | head -3`
- DECISIONS folder: !`d=$PWD; while [ "$d" != / ]; do [ -d "$d/DECISIONS" ] && { echo "$d/DECISIONS"; ls "$d/DECISIONS"; break; }; d=$(dirname "$d"); done; [ -d "$d/DECISIONS" ] || echo "(none found walking up from $PWD)"`

### PR metadata (only when `$ARGUMENTS` is a PR number)
!`case "$ARGUMENTS" in ''|*[!0-9]*) echo "(not a PR number — reviewing a git range)";; *) gh pr view "$ARGUMENTS" --json number,title,body,baseRefName,headRefName,url 2>&1;; esac`

### The diff
!`case "$ARGUMENTS" in '') git diff HEAD~1;; *[!0-9]*) git diff $ARGUMENTS;; *) gh pr diff "$ARGUMENTS" 2>&1;; esac`

## Instructions

Check the "gh account" line above: it must be the account that can read this repo (if the
repo's CLAUDE.md names a required account, it must be that one — `gh auth switch --user <name>`
and re-run). A concurrent Claude session on this machine can flip the active account under you.
If the diff above is empty or an error, stop and say so — do not review the wrong thing.

Spawn the **`adversary`** subagent (`Agent` tool, `subagent_type: "adversary"`) with the PR
metadata and diff above pasted in verbatim, plus these orders:

1. **Read `DECISIONS/*.md` first** (path listed above) and the root CLAUDE.md "Settled
   decisions" section. Anything recorded there is settled intent — conformance to an Accepted
   ADR is never a defect, and you may not recommend changing a settled decision.
2. Apply the per-finding verdict from your agent definition — `AGREE` /
   `DISAGREE_EVIDENCE` / `DISAGREE_CONCERN` — to every observation before writing it down.
3. Return exactly two lists inside the standard report:
   - **Bugs** — `DISAGREE_EVIDENCE` only: each cites `file:line` and the quoted code in the
     diff (or the quoted ADR / CLAUDE.md rule it violates). These are the only BLOCKING items.
   - **Decision Concerns (non-blocking)** — `DISAGREE_CONCERN` items, one or two sentences
     each, citing the ADR number when one exists. Never bugs, never blocking.
4. `needs a decision` only when no ADR covers the question.
5. **Do NOT post anything to GitHub** — no `gh pr comment`, no `gh pr review`, no MCP
   `pull_request_review_write`. Report back in chat only; the human decides what gets posted.

Relay the subagent's report unchanged. Do not soften, merge, or re-grade its findings — the
verifier is not the author, and neither are you.

<!-- OPTIONAL — project-specific facts. Delete or replace for your repo.
     Astrus example: `gh` must be on the `tpreisser` account (the only account whose pushes
     land); if the line above shows anything else run `gh auth switch --user tpreisser`. -->
