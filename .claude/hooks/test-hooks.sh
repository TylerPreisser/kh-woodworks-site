#!/bin/sh
# test-hooks.sh — red/green harness for the two PreToolUse gate hooks in this directory.
# Installed by agent-kit.
#
# Pipes FAKE Claude Code hook payloads (tool_name + tool_input JSON on stdin) through
# block-live-deploy.sh and protect-adr-and-secrets.sh and asserts the exit code
# (0 = allow, 2 = block). Nothing here touches a real org, cluster, host, or repo file —
# the ADR fixtures live in a scratch dir that is created and removed by this script.
#
# Usage:  sh .claude/hooks/test-hooks.sh          (exit 0 = all green, 1 = failures)
#
# RED run: with the hook scripts absent, `sh <missing>` exits 127, so every case FAILS.

HOOKS_DIR=$(cd "$(dirname "$0")" && pwd)
SCRATCH="${TMPDIR:-/tmp}/agent-kit-hook-tests.$$"
mkdir -p "$SCRATCH/DECISIONS"
trap 'rm -rf "$SCRATCH"' EXIT INT TERM

pass=0; fail=0

# json_bash <command>  → PreToolUse payload for the Bash tool
json_bash() {
  python3 -c 'import json,sys; print(json.dumps({"tool_name":"Bash","tool_input":{"command":sys.argv[1]},"cwd":"/tmp"}))' "$1"
}
# json_edit <tool> <path> → PreToolUse payload for Write/Edit/MultiEdit
json_edit() {
  python3 -c 'import json,sys; print(json.dumps({"tool_name":sys.argv[1],"tool_input":{"file_path":sys.argv[2],"old_string":"a","new_string":"b","content":"x"},"cwd":"/tmp"}))' "$1" "$2"
}

# check <label> <expected-exit> <script> <payload> [ENV=VAL ...]
check() {
  label=$1; want=$2; script=$3; payload=$4; shift 4
  err=$(printf '%s' "$payload" | env "$@" sh "$HOOKS_DIR/$script" 2>&1 >/dev/null)
  got=$?
  if [ "$got" -eq "$want" ]; then
    pass=$((pass+1)); printf 'PASS  [%s] want=%s got=%s  %s\n' "$script" "$want" "$got" "$label"
  else
    fail=$((fail+1)); printf 'FAIL  [%s] want=%s got=%s  %s\n      stderr: %s\n' "$script" "$want" "$got" "$label" "$err"
  fi
}

B=block-live-deploy.sh
P=protect-adr-and-secrets.sh
START=$(date +%s)

echo "== block-live-deploy.sh (Salesforce / Azure / k8s) =="
check "sf project deploy start (live)"          2 $B "$(json_bash 'sf project deploy start -o r2 --source-dir x')"
check "sf project deploy start --dry-run"       0 $B "$(json_bash 'sf project deploy start -o r2 --dry-run --test-level RunSpecifiedTests --tests T')"
check "sf project deploy quick (live)"          2 $B "$(json_bash 'sf project deploy quick -o r2 --job-id 0Af')"
check "sfdx force:source:deploy (legacy live)"  2 $B "$(json_bash 'sfdx force:source:deploy -u r2 -p force-app')"
check "sfdx force:source:deploy --checkonly"    0 $B "$(json_bash 'sfdx force:source:deploy -u r2 -p force-app --checkonly')"
check "sf data query (read-only)"               0 $B "$(json_bash 'sf data query -o r2 --query "SELECT Id FROM Account"')"
check "sf apex run test (read-only)"            0 $B "$(json_bash 'sf apex run test -o r2 --tests T')"
check "sf apex run --file (anonymous apex)"     2 $B "$(json_bash 'sf apex run -o r2 --file x.apex')"
check "sf data update record"                   2 $B "$(json_bash 'sf data update record -o r2 -s Account -i 001 -v "Name=x"')"
check "sf data create record"                   2 $B "$(json_bash 'sf data create record -o r2 -s Account -v "Name=x"')"
check "sf data delete bulk"                     2 $B "$(json_bash 'sf data delete bulk -o r2 -s Account -f ids.csv')"
check "sf org display / project retrieve"       0 $B "$(json_bash 'sf org display -o r2 && sf project retrieve start -o r2 -m ApexClass:Foo')"
check "ASTRUS_ALLOW_DEPLOY=1 prefix in command" 0 $B "$(json_bash 'ASTRUS_ALLOW_DEPLOY=1 sf project deploy start -o r2 --source-dir x')"
check "ASTRUS_ALLOW_DEPLOY=1 in environment"    0 $B "$(json_bash 'sf project deploy start -o r2 --source-dir x')" ASTRUS_ALLOW_DEPLOY=1
check "ALLOW_DEPLOY=1 prefix in command"        0 $B "$(json_bash 'ALLOW_DEPLOY=1 sf project deploy start -o r2 --source-dir x')"
check "ALLOW_DEPLOY=1 in environment"           0 $B "$(json_bash 'wrangler deploy')" ALLOW_DEPLOY=1
check "git status && sf project deploy start"   2 $B "$(json_bash 'git status && sf project deploy start -o r2')"
check "echo mentioning deploy (not a deploy)"   0 $B "$(json_bash 'echo "sf project deploy start is gated" | grep deploy')"
check "kubectl get pods"                        0 $B "$(json_bash 'kubectl get pods -l app=astrus-ai')"
check "kubectl exec printenv (read-only)"       0 $B "$(json_bash 'kubectl exec pod/x -- printenv | grep APP_COMMIT')"
check "kubectl rollout restart"                 2 $B "$(json_bash 'kubectl rollout restart deploy/x')"
check "kubectl -n ns apply -f"                  2 $B "$(json_bash 'kubectl -n astrus apply -f k8s/')"
check "helm upgrade"                            2 $B "$(json_bash 'helm upgrade astrus ./chart')"
check "az webapp deploy"                        2 $B "$(json_bash 'az webapp deploy -g rg -n app --src-path a.zip')"
check "func azure functionapp publish"          2 $B "$(json_bash 'func azure functionapp publish fn-astrus')"
check "bash -c wrapping a deploy"               2 $B "$(json_bash 'bash -c "sf project deploy start -o r2"')"
check "empty stdin"                             0 $B ""
check "malformed JSON"                          0 $B '{"tool_name": "Bash", "tool_input": {'
check "non-Bash tool payload"                   0 $B '{"tool_name":"Read","tool_input":{"file_path":"/x"}}'

echo "== block-live-deploy.sh (generic production deploys) =="
check "wrangler deploy"                         2 $B "$(json_bash 'wrangler deploy')"
check "wrangler publish (legacy)"               2 $B "$(json_bash 'wrangler publish --env production')"
check "npx wrangler deploy"                     2 $B "$(json_bash 'npx wrangler deploy --env production')"
check "wrangler pages deploy"                   2 $B "$(json_bash 'wrangler pages deploy ./dist')"
check "wrangler dev (allowed)"                  0 $B "$(json_bash 'wrangler dev --port 8787')"
check "wrangler tail (allowed)"                 0 $B "$(json_bash 'wrangler tail')"
check "vercel --prod"                           2 $B "$(json_bash 'vercel --prod')"
check "vercel deploy --prod"                    2 $B "$(json_bash 'vercel deploy --prod --yes')"
check "vercel (preview, allowed)"               0 $B "$(json_bash 'vercel')"
check "vercel deploy (preview, allowed)"        0 $B "$(json_bash 'vercel deploy')"
check "netlify deploy --prod"                   2 $B "$(json_bash 'netlify deploy --prod --dir=dist')"
check "netlify deploy (draft, allowed)"         0 $B "$(json_bash 'netlify deploy --dir=dist')"
check "firebase deploy"                         2 $B "$(json_bash 'firebase deploy --only hosting')"
check "firebase emulators:start (allowed)"      0 $B "$(json_bash 'firebase emulators:start')"
check "fly deploy"                              2 $B "$(json_bash 'fly deploy')"
check "flyctl deploy"                           2 $B "$(json_bash 'flyctl deploy --remote-only')"
check "fly status (allowed)"                    0 $B "$(json_bash 'fly status')"
check "eas submit"                              2 $B "$(json_bash 'eas submit -p ios')"
check "eas build (allowed)"                     0 $B "$(json_bash 'eas build -p ios --profile preview')"
check "gh release create"                       2 $B "$(json_bash 'gh release create v1.2.0 --notes x')"
check "gh release list (allowed)"               0 $B "$(json_bash 'gh release list')"
check "npm publish"                             2 $B "$(json_bash 'npm publish --access public')"
check "pnpm publish"                            2 $B "$(json_bash 'pnpm publish')"
check "npm run build (allowed)"                 0 $B "$(json_bash 'npm run build')"
check "npm run publish (a script, allowed)"     0 $B "$(json_bash 'npm run publish')"
check "terraform apply"                         2 $B "$(json_bash 'terraform apply -auto-approve')"
check "terraform destroy"                       2 $B "$(json_bash 'terraform destroy')"
check "terraform plan (allowed)"                0 $B "$(json_bash 'terraform plan -out=tf.plan')"
check "pulumi up"                               2 $B "$(json_bash 'pulumi up --yes')"
check "pulumi preview (allowed)"                0 $B "$(json_bash 'pulumi preview')"
check "git push --force origin main"            2 $B "$(json_bash 'git push --force origin main')"
check "git push -f origin master"               2 $B "$(json_bash 'git push -f origin master')"
check "git push origin main --force"            2 $B "$(json_bash 'git push origin main --force')"
check "git push -f origin HEAD:cde"             2 $B "$(json_bash 'git push -f origin HEAD:cde')"
check "git push --force-with-lease origin dev"  2 $B "$(json_bash 'git push --force-with-lease origin dev')"
check "git push origin +production"             2 $B "$(json_bash 'git push origin +production')"
check "git push --force (no refspec: unseen)"   2 $B "$(json_bash 'git push --force')"
check "git -C repo push -f origin main"         2 $B "$(json_bash 'git -C /some/repo push -f origin main')"
check "git push origin feature/x (allowed)"     0 $B "$(json_bash 'git push origin feature/x')"
check "git push --force origin feature/x (ok)"  0 $B "$(json_bash 'git push --force origin feature/x')"
check "git push -u origin fix/iss-1 (allowed)"  0 $B "$(json_bash 'git push -u origin fix/iss-1')"
check "git push origin main (not forced, ok)"   0 $B "$(json_bash 'git push origin main')"
check "git fetch --force (not a push)"          0 $B "$(json_bash 'git fetch --force origin')"
check "echo 'wrangler deploy' (mention only)"   0 $B "$(json_bash 'echo "run wrangler deploy later"')"
check "npm test && wrangler deploy"             2 $B "$(json_bash 'npm test && wrangler deploy')"

echo "== protect-adr-and-secrets.sh =="
printf '# ADR 0001\n\nStatus: Accepted\n' > "$SCRATCH/DECISIONS/0001-x.md"
printf '# ADR 0003\n\nStatus: Proposed\n' > "$SCRATCH/DECISIONS/0003-p.md"
check "Edit Accepted ADR"                       2 $P "$(json_edit Edit  "$SCRATCH/DECISIONS/0001-x.md")"
check "Write over Accepted ADR"                 2 $P "$(json_edit Write "$SCRATCH/DECISIONS/0001-x.md")"
check "MultiEdit Accepted ADR"                  2 $P "$(json_edit MultiEdit "$SCRATCH/DECISIONS/0001-x.md")"
check "Write NEW ADR (file absent)"             0 $P "$(json_edit Write "$SCRATCH/DECISIONS/0002-new.md")"
check "Edit Proposed ADR"                       0 $P "$(json_edit Edit  "$SCRATCH/DECISIONS/0003-p.md")"
check "Edit Accepted ADR w/ ASTRUS_ADR_SUPERSEDE=1" 0 $P "$(json_edit Edit "$SCRATCH/DECISIONS/0001-x.md")" ASTRUS_ADR_SUPERSEDE=1
check "Edit Accepted ADR w/ ADR_SUPERSEDE=1"    0 $P "$(json_edit Edit "$SCRATCH/DECISIONS/0001-x.md")" ADR_SUPERSEDE=1
check "Edit DECISIONS/README.md (not an ADR)"   0 $P "$(json_edit Edit  "$SCRATCH/DECISIONS/README.md")"
check ".env"                                    2 $P "$(json_edit Write /some/path/.env)"
check ".env.local"                              2 $P "$(json_edit Write /some/path/.env.local)"
check ".env.example (allowed)"                  0 $P "$(json_edit Write /some/path/.env.example)"
check "certs/a.pem"                             2 $P "$(json_edit Write /x/certs/a.pem)"
check "server.key"                              2 $P "$(json_edit Write /x/tls/server.key)"
check ".sfdx/sfdx-config.json"                  2 $P "$(json_edit Edit  /x/.sfdx/sfdx-config.json)"
check ".astrus_graph/token.json"                2 $P "$(json_edit Edit  "$HOME/.astrus_graph/token.json")"
check "aws_credentials.txt"                     2 $P "$(json_edit Write /x/aws_credentials.txt)"
check "Secret.yaml (case-insensitive)"          2 $P "$(json_edit Write /x/k8s/Secret.yaml)"
check "secrets.example (allowed)"               0 $P "$(json_edit Write /x/secrets.example)"
check "installed hook script (self-exempt)"     0 $P "$(json_edit Edit  /x/.claude/hooks/protect-adr-and-secrets.sh)"
check "kit template hook script (self-exempt)"  0 $P "$(json_edit Edit  /x/agent-kit/templates/hooks/protect-adr-and-secrets.sh)"
check "random secrets.sh elsewhere (blocked)"   2 $P "$(json_edit Write /x/scripts/rotate-secrets.sh)"
check "src/main.py (allowed)"                   0 $P "$(json_edit Write /x/src/main.py)"
check "relative path resolved via cwd"          0 $P "$(json_edit Write src/main.py)"
check "empty stdin"                             0 $P ""
check "malformed JSON"                          0 $P '{"tool_name": "Edit", "tool_input": {'

END=$(date +%s)
echo "== $pass passed, $fail failed, $((END-START))s total =="
[ "$fail" -eq 0 ]
