#!/bin/sh
# block-live-deploy.sh — Claude Code PreToolUse hook (matcher: Bash). Installed by agent-kit.
#
# Mechanizes one rule: a command that changes something LIVE (a production deploy, a record
# mutation in a shared org, a force-push over a trunk) happens only on the owner's explicit
# say-so. Read-only commands, dry-runs, plans, and previews are always allowed.
#
# Contract: reads the PreToolUse event JSON on stdin ({tool_name, tool_input.command}).
#   exit 0 = allow (also on empty/unparseable stdin or any internal error — never block on
#            a parse failure);  exit 2 = BLOCK, stderr is fed back to Claude as the reason.
#
# BLOCKED (per pipeline segment, on the segment's leading tokens):
#   Salesforce:
#     sf project deploy start|quick|resume, sf deploy metadata      unless --dry-run present
#     sfdx force:source:deploy | force:mdapi:deploy                  unless --checkonly / -c
#     sf data create|update|delete|import|upsert ...                 (record, bulk, tree — all)
#     sfdx force:data:*:create|update|delete|upsert|import
#     sf apex run  (anonymous Apex)      — but `sf apex run test` is allowed
#     sfdx force:apex:execute
#   Azure / Kubernetes:
#     func azure functionapp publish, az functionapp deployment|deploy, az webapp deploy|deployment
#     kubectl apply, kubectl rollout restart, kubectl set image      (global flags before the verb ok)
#     helm upgrade|install
#   Generic production deploys:
#     wrangler deploy|publish, wrangler pages deploy|publish, wrangler versions deploy   (Cloudflare)
#     vercel --prod | vercel deploy --prod | --target production                         (Vercel)
#     netlify|ntl deploy --prod | --prod-if-unlocked                                     (Netlify)
#     firebase deploy · fly|flyctl deploy · eas submit · gh release create
#     npm|pnpm|yarn publish · terraform apply|destroy · pulumi up|destroy
#     git push --force|-f|--force-with-lease|+ref  to main|master|cde|dev|production   (or with
#       NO refspec at all — the target cannot be seen, so name the branch explicitly)
# ALLOWED: everything else — sf data query/export, sf apex run test, sf org display,
#   sf project retrieve, kubectl get/exec/logs/describe, wrangler dev, vercel (preview),
#   netlify deploy (draft), terraform plan, pulumi preview, npm run build, gh release list,
#   git push to a feature branch (forced or not), and any command that merely MENTIONS these
#   strings inside echo/grep/comments (only leading tokens of a segment are matched).
#
# OVERRIDE (the owner's explicit say-so): env ALLOW_DEPLOY=1 (or the legacy ASTRUS_ALLOW_DEPLOY=1)
#   in the hook's environment, or the command (or the offending segment) prefixed with it.
#
# LIMITATIONS: the command is split on && || ; | and newlines WITHOUT quote awareness, then
#   each segment is shlex-tokenized after stripping leading env assignments / sudo / env /
#   exec / nohup / time / timeout N / npx / bunx / npm|pnpm|yarn exec|dlx / a path prefix.
#   `sh|bash|zsh -c "<inner>"` is recursed into one level. Not handled: `eval`, `xargs`,
#   `$(...)` substitutions, package scripts (`npm run deploy`), scripts invoked by path
#   (`./deploy.sh`), Makefile targets, or an alias/wrapper binary. Those are gaps a determined
#   author can walk through; the gate is for the honest-mistake path.
#
# DEGRADED MODE (python3 absent): crude grep on the raw stdin — blocks if any live-deploy
#   token is present without --dry-run/--checkonly and no override. False positives are
#   acceptable; a silent gate is not.

if ! command -v python3 >/dev/null 2>&1; then
  RAW=$(cat)
  [ "${ALLOW_DEPLOY:-0}" = "1" ] && exit 0
  [ "${ASTRUS_ALLOW_DEPLOY:-0}" = "1" ] && exit 0
  case "$RAW" in *"ALLOW_DEPLOY=1 "*) exit 0 ;; esac
  case "$RAW" in
    *"sf project deploy start"*|*"sf project deploy quick"*|*"sf project deploy resume"*|*"force:source:deploy"*|*"force:mdapi:deploy"*|*"sf data create"*|*"sf data update"*|*"sf data delete"*|*"sf data import"*|*"sf data upsert"*|*"functionapp publish"*|*"functionapp deployment"*|*"webapp deploy"*|*"kubectl apply"*|*"rollout restart"*|*"kubectl set image"*|*"helm upgrade"*|*"helm install"*|*"wrangler deploy"*|*"wrangler publish"*|*"wrangler pages deploy"*|*"wrangler versions deploy"*|*"vercel"*"--prod"*|*"netlify deploy"*"--prod"*|*"firebase deploy"*|*"fly deploy"*|*"flyctl deploy"*|*"eas submit"*|*"gh release create"*|*"npm publish"*|*"pnpm publish"*|*"yarn publish"*|*"terraform apply"*|*"terraform destroy"*|*"pulumi up"*|*"pulumi destroy"*|*"git push"*"--force"*|*"git push -f"*)
      case "$RAW" in *"--dry-run"*|*"--checkonly"*) exit 0 ;; esac
      echo "Blocked by .claude/hooks/block-live-deploy.sh: live deploy/mutation. Use --dry-run, or prefix the command with ALLOW_DEPLOY=1 on the owner's explicit say-so. [DEGRADED MODE: python3 missing, raw-token match]" >&2
      exit 2 ;;
  esac
  exit 0
fi

PYCODE=$(cat <<'PY'
import json, os, re, shlex, sys

MSG = ("Blocked by .claude/hooks/block-live-deploy.sh: live deploy/mutation. "
       "Use --dry-run, or prefix the command with ALLOW_DEPLOY=1 on the owner's explicit say-so.")
OVERRIDES = ("ALLOW_DEPLOY=1", "ASTRUS_ALLOW_DEPLOY=1")
WRAPPERS = {"sudo", "env", "exec", "nohup", "time", "command", "npx", "bunx", "pnpx", "builtin"}
PKG_RUNNERS = {"npm", "pnpm", "yarn", "bun"}
PKG_EXEC = {"exec", "dlx", "x"}
ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
TRUNKS = {"main", "master", "cde", "dev", "production"}
FORCE_FLAGS = {"--force", "-f", "--force-with-lease", "--force-if-includes"}
GIT_GLOBAL_WITH_ARG = {"-C", "-c", "--git-dir", "--work-tree", "--namespace"}


def tokens_of(segment):
    seg = segment.strip().lstrip("({").strip()
    try:
        toks = shlex.split(seg, posix=True)
    except ValueError:
        toks = seg.split()
    allow = False
    # strip leading env assignments (the override lives here), wrappers, `timeout N`
    while toks:
        t = toks[0]
        if ASSIGN.match(t):
            if t in OVERRIDES:
                allow = True
            toks.pop(0)
        elif t in WRAPPERS:
            toks.pop(0)
        elif t == "timeout":
            toks.pop(0)
            while toks and (toks[0].startswith("-") or re.match(r"^\d+[smhd]?$", toks[0])):
                toks.pop(0)
        elif t in PKG_RUNNERS and len(toks) > 2 and toks[1] in PKG_EXEC:
            toks.pop(0)
            toks.pop(0)
        else:
            break
    if toks:
        toks[0] = os.path.basename(toks[0])
    return toks, allow


def kubectl_verb(toks):
    i = 1
    while i < len(toks) and toks[i].startswith("-"):
        i += 1 if "=" in toks[i] else 2
    return toks[i:i + 2]


def git_force_push_to_trunk(t):
    i = 1
    while i < len(t) and t[i].startswith("-"):
        i += 2 if t[i] in GIT_GLOBAL_WITH_ARG else 1
    if i >= len(t) or t[i] != "push":
        return False
    args = t[i + 1:]
    force = any(a in FORCE_FLAGS or a.startswith("--force-with-lease=") for a in args)
    positional = [a for a in args if not a.startswith("-")]
    refspecs = positional[1:]  # positional[0] is the remote
    if any(r.startswith("+") for r in refspecs):
        force = True
    if not force:
        return False
    if not refspecs:
        return True  # forced push with no visible target: name the branch explicitly
    for r in refspecs:
        r = r.lstrip("+")
        dst = r.split(":", 1)[1] if ":" in r else r
        if dst.startswith("refs/heads/"):
            dst = dst[len("refs/heads/"):]
        if dst in TRUNKS:
            return True
    return False


def is_live_mutation(t):
    if not t:
        return False
    n = len(t)
    if t[0] == "sf":
        if n >= 4 and t[1] == "project" and t[2] == "deploy" and t[3] in ("start", "quick", "resume"):
            return "--dry-run" not in t
        if n >= 3 and t[1] == "deploy" and t[2] == "metadata":
            return "--dry-run" not in t
        if n >= 3 and t[1] == "data" and t[2] in ("create", "update", "delete", "import", "upsert"):
            return True
        if n >= 3 and t[1] == "apex" and t[2] == "run":
            return not (n >= 4 and t[3] == "test")
    if t[0] == "sfdx" and n >= 2:
        sub = t[1]
        if sub in ("force:source:deploy", "force:mdapi:deploy"):
            return not ("--checkonly" in t or "-c" in t)
        if sub.startswith("force:data:") and re.search(r":(create|update|delete|upsert|import)$", sub):
            return True
        if sub == "force:apex:execute":
            return True
    if t[0] == "func" and t[1:4] == ["azure", "functionapp", "publish"]:
        return True
    if t[0] == "az" and n >= 3 and t[1] in ("functionapp", "webapp") and t[2] in ("deploy", "deployment"):
        return True
    if t[0] == "kubectl":
        v = kubectl_verb(t)
        if v[:1] == ["apply"] or v == ["rollout", "restart"] or v == ["set", "image"]:
            return True
    if t[0] == "helm" and n >= 2 and t[1] in ("upgrade", "install"):
        return True
    # --- generic production deploys -------------------------------------------------
    if t[0] == "wrangler" and n >= 2:
        if t[1] in ("deploy", "publish"):
            return True
        if n >= 3 and t[1] in ("pages", "versions") and t[2] in ("deploy", "publish"):
            return True
    if t[0] == "vercel":
        if "--prod" in t or "--target=production" in t:
            return True
        if "--target" in t and t[t.index("--target") + 1:t.index("--target") + 2] == ["production"]:
            return True
    if t[0] in ("netlify", "ntl") and n >= 2 and t[1] == "deploy":
        return "--prod" in t or "--prod-if-unlocked" in t
    if t[0] == "firebase" and n >= 2 and t[1] == "deploy":
        return True
    if t[0] in ("fly", "flyctl") and n >= 2 and t[1] == "deploy":
        return True
    if t[0] == "eas" and n >= 2 and t[1] == "submit":
        return True
    if t[0] == "gh" and n >= 3 and t[1] == "release" and t[2] == "create":
        return True
    if t[0] in ("npm", "pnpm") and n >= 2 and t[1] == "publish":
        return True
    if t[0] == "yarn" and n >= 2 and (t[1] == "publish" or t[1:3] == ["npm", "publish"]):
        return True
    if t[0] == "terraform" and n >= 2 and t[1] in ("apply", "destroy"):
        return True
    if t[0] == "pulumi" and n >= 2 and t[1] in ("up", "destroy"):
        return True
    if t[0] == "git" and git_force_push_to_trunk(t):
        return True
    return False


def offending_segment(command, depth=0):
    for seg in re.split(r"\|\||&&|;|\||\n", command):
        toks, allow = tokens_of(seg)
        if not toks or allow:
            continue
        if is_live_mutation(toks):
            return seg.strip()
        if toks[0] in ("sh", "bash", "zsh") and "-c" in toks and depth < 2:
            i = toks.index("-c")
            if i + 1 < len(toks):
                hit = offending_segment(toks[i + 1], depth + 1)
                if hit:
                    return hit
    return None


def main():
    if os.environ.get("ALLOW_DEPLOY") == "1" or os.environ.get("ASTRUS_ALLOW_DEPLOY") == "1":
        return 0
    raw = sys.stdin.read()
    if not raw.strip():
        return 0
    try:
        data = json.loads(raw)
    except Exception:
        return 0
    if not isinstance(data, dict) or data.get("tool_name") != "Bash":
        return 0
    cmd = (data.get("tool_input") or {}).get("command")
    if not isinstance(cmd, str) or not cmd.strip():
        return 0
    for ov in OVERRIDES:
        if cmd.lstrip().startswith(ov + " "):
            return 0
    hit = offending_segment(cmd)
    if hit:
        sys.stderr.write(MSG + " [matched: " + hit[:160] + "]\n")
        return 2
    return 0


try:
    sys.exit(main())
except SystemExit:
    raise
except Exception:
    sys.exit(0)
PY
)
exec python3 -c "$PYCODE"
