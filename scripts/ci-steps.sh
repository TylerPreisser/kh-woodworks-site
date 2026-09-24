#!/usr/bin/env bash
# THIS REPO'S CI GATE. A static site with no build system, no package.json, no tests and no workflow: the one
# honest step is that the checkout is whole, i.e. its entry file index.html is tracked at this commit. Nothing is
# invented here that the repo never had. Run by the canonical runner (_workspace/tools/ci-local/run.sh, through
# the global pre-push hook) inside a CLEAN worktree ($WT).
# Helpers: run <name> <dir> <command...>; $CI_PYTHON3 is /usr/bin/python3 (3.9); $LOG is the gate's log.
CI_NODE=22
ci_steps() {
  run checkout-whole . git ls-files --error-unmatch index.html
}
ci_summary() { printf 'index.html tracked; no build or tests defined'; }
