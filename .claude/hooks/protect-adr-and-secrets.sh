#!/bin/sh
# protect-adr-and-secrets.sh — Claude Code PreToolUse hook (matcher: Write|Edit|MultiEdit).
# Installed by agent-kit.
#
# Two deterministic write gates:
#
# 1. ACCEPTED ADRs ARE IMMUTABLE.  A write to */DECISIONS/NNNN-*.md is blocked when the file
#    already exists AND contains a line beginning `Status: Accepted` (leading whitespace and
#    markdown bold around the label are tolerated). Creating a NEW ADR is allowed; editing a
#    `Status: Proposed` one is allowed; DECISIONS/README.md is not an ADR. The ONE legitimate
#    edit to an Accepted ADR — flipping its status line to Superseded — is allowed when the
#    hook runs with ADR_SUPERSEDE=1 (or the legacy ASTRUS_ADR_SUPERSEDE=1) in its environment
#    (the owner's say-so; the override is per-invocation, not a standing setting).
#
# 2. SECRETS / CREDENTIAL MATERIAL.  Blocked paths (case-insensitive):
#      basename `.env` or `.env.*`        (except `*.example`)
#      extensions .pem .key .p12 .jks
#      any path component certs / .sfdx / .sf / .astrus_graph
#      basename containing `credentials` or `secret`   (except `*.example`)
#    Self-exemption: `*.sh` under a `.claude/hooks/` or `templates/hooks/` directory is NOT
#    treated as a secret (this file's own name contains "secrets"; without the carve-out the
#    hook would lock itself — and the agent-kit template it is installed from — against
#    maintenance).
#
# Contract: PreToolUse JSON on stdin ({tool_name, tool_input.file_path, cwd}). Relative
# file_path is resolved against the event's `cwd` (falling back to the process cwd).
#   exit 0 = allow (also on empty/unparseable stdin or any internal error);
#   exit 2 = BLOCK, stderr names the rule and is fed back to Claude.
#
# DEGRADED MODE (python3 absent): crude grep of the raw stdin for the secret-path tokens
# only (the ADR rule needs a file read and is skipped). Loud, not silent.

if ! command -v python3 >/dev/null 2>&1; then
  RAW=$(cat)
  case "$RAW" in
    *"/.env\""*|*"/.env."*|*".pem\""*|*".key\""*|*".p12\""*|*".jks\""*|*"/certs/"*|*"/.sfdx/"*|*"/.sf/"*|*"/.astrus_graph/"*|*"credentials"*|*"secret"*|*"Secret"*|*"SECRET"*)
      case "$RAW" in *".example\""*|*"/.claude/hooks/"*|*"/templates/hooks/"*) exit 0 ;; esac
      echo "Blocked by .claude/hooks/protect-adr-and-secrets.sh: secret/credential path. [DEGRADED MODE: python3 missing, raw-token match]" >&2
      exit 2 ;;
  esac
  exit 0
fi

PYCODE=$(cat <<'PY'
import json, os, re, sys

RULE = "Blocked by .claude/hooks/protect-adr-and-secrets.sh: "
ADR_PATH = re.compile(r"/DECISIONS/\d{4}-[^/]*\.md$")
ADR_ACCEPTED = re.compile(r"^\s*\**Status\**\s*:\s*\**\s*Accepted\b", re.IGNORECASE)
SECRET_EXT = (".pem", ".key", ".p12", ".jks")
SECRET_DIRS = {"certs", ".sfdx", ".sf", ".astrus_graph"}


def adr_is_accepted(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            for line in fh:
                if ADR_ACCEPTED.match(line):
                    return True
    except OSError:
        return False
    return False


def secret_reason(path):
    base = os.path.basename(path)
    low = base.lower()
    parts = path.split(os.sep)
    if low.endswith(".sh") and "hooks" in parts and (".claude" in parts or "templates" in parts):
        return None  # self-exemption for the hook scripts themselves (installed or kit template)
    if low.endswith(".example"):
        return None
    if low == ".env" or low.startswith(".env."):
        return "dotenv file (.env / .env.*)"
    if low.endswith(SECRET_EXT):
        return "private key / certificate material (%s)" % os.path.splitext(low)[1]
    hit = [p for p in parts[:-1] if p.lower() in SECRET_DIRS]
    if hit:
        return "protected directory '%s/' (certs, .sfdx, .sf, .astrus_graph)" % hit[0]
    if "credentials" in low or "secret" in low:
        return "filename contains 'credentials'/'secret'"
    return None


def supersede_allowed():
    return os.environ.get("ADR_SUPERSEDE") == "1" or os.environ.get("ASTRUS_ADR_SUPERSEDE") == "1"


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        return 0
    try:
        data = json.loads(raw)
    except Exception:
        return 0
    if not isinstance(data, dict) or data.get("tool_name") not in ("Write", "Edit", "MultiEdit"):
        return 0
    fp = (data.get("tool_input") or {}).get("file_path")
    if not isinstance(fp, str) or not fp.strip():
        return 0
    fp = os.path.expanduser(fp)
    if not os.path.isabs(fp):
        base = data.get("cwd") if isinstance(data.get("cwd"), str) and data.get("cwd") else os.getcwd()
        fp = os.path.join(base, fp)
    fp = os.path.normpath(fp)

    if ADR_PATH.search(fp) and os.path.isfile(fp) and adr_is_accepted(fp):
        if supersede_allowed():
            return 0
        sys.stderr.write(RULE + "Accepted ADRs are immutable — write a new superseding ADR instead "
                         "(see DECISIONS/README.md). Only the status line may change, to Superseded, "
                         "and only with ADR_SUPERSEDE=1 on the owner's say-so. [" + fp + "]\n")
        return 2

    why = secret_reason(fp)
    if why:
        sys.stderr.write(RULE + "secret/credential path — " + why + ". Never write credential material "
                         "through Claude; hand it to the owner. [" + fp + "]\n")
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
