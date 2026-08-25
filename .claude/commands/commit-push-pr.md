---
description: Commit only this session's edited files (conventional commit, no trailer), push the branch, and open a PR against the repo's trunk. Never merges.
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git remote:*), Bash(git log:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(gh auth status:*), Bash(gh repo view:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr list:*)
argument-hint: [ticket id and a short summary, e.g. "ISS-143 remove monopolistic WC payroll"]
---

# Commit, push, open PR: `$ARGUMENTS`

## Pre-computed context

- Working tree: !`pwd`
- Repo: !`basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "(not a git repo)"`
- Branch: !`git branch --show-current 2>/dev/null`
- Upstream: !`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "(no upstream yet)"`
- `gh` account: !`gh auth status 2>&1 | grep -E 'Logged in|account' | head -3`
- Default branch: !`gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo "(gh repo view failed)"`
- Trunk named in CLAUDE.md (if any): !`d=$PWD; while [ "$d" != / ]; do [ -f "$d/CLAUDE.md" ] && grep -inE 'trunk|default branch|base branch' "$d/CLAUDE.md" | head -5; d=$(dirname "$d"); done; true`

### `git status --short`
!`git status --short 2>&1`

## Instructions

Work through these in order. Every step's command and output stays in the transcript.

1. **Guard rails first.**
   - The "gh account" line above must show the account that has push rights to this repo. If
     the repo's CLAUDE.md names one, it must be that one — `gh auth switch --user <name>`. A
     concurrent Claude session on this machine can flip the active account under you.
   - If the branch is the default branch, a trunk named in CLAUDE.md, or any of `main`, `master`,
     `dev`, `cde`, `production`, STOP — create a feature branch first
     (`git checkout -b <type>/<ticket>-<slug>`); never commit straight to a trunk.
   - Other sessions may write to this clone concurrently. The status list above may include
     files you did not touch. **Commit ONLY the files edited in this session**, each path listed
     explicitly on the `git add` line. Never `git add -A`, `git add .`, or `git commit -a`.
     Never stage `.env`, credentials, or anything under `DECISIONS/` you did not author.

2. **Commit.** Conventional-commit format, ticket id in the subject when one exists
   (e.g. `fix(wc): drop monopolistic-state payroll from WC ratable total (ISS-143)`), a body
   that says what changed and why in plain prose. **No `Co-Authored-By` trailer** — the Bash
   tool's default template suggests one; omit it.

3. **Push.** `git push -u origin <branch>`. If the remote rejects (non-fast-forward), fetch and
   rebase — never force-push.

4. **Base branch.** Use the trunk the repo's CLAUDE.md names, if it names one. Otherwise use the
   "Default branch" line above (`gh repo view --json defaultBranchRef`). Never guess.

5. **Open the PR.** `gh pr create --base <base> --head <branch> --title "<title>" --body "<body>"`.
   - Title references the ticket id from `$ARGUMENTS`.
   - Body: what changed and why, how it was verified (the actual commands and results — a
     red-then-green test, a live read from the target environment), and the relevant
     `DECISIONS/NNNN-*.md` entries by number so the reviewer reads the settled intent first.
   - Do not assign reviewers or request review unless CLAUDE.md says who. **Do not merge.**
     The owner drives merges and promotion.

6. **Report** the PR URL, the commit SHA, and the exact file list committed. A PR opened is not
   a deploy — do not describe the change as live or "working" from this command alone.

<!-- OPTIONAL — project-specific facts. Delete or replace for your repo.
     Astrus example (three repos, one workspace):
       | repo                    | base                                                        |
       |-------------------------|-------------------------------------------------------------|
       | astrus-ai               | cde  (integration trunk; dev is retired — never target it)  |
       | astrus1                 | dev  (QA tracks dev, not main)                              |
       | astrus-ai-integration   | the default branch (gh repo view --json defaultBranchRef)   |
     gh must be on the tpreisser account (pushes only land as tpreisser).
     Never assign or request review from Nate (no --assignee / --reviewer naming him). -->
