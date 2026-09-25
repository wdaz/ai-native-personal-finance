#!/bin/sh
# T-14 step 5.6 — run by the OWNER, once per scope:
#   ! sh /Users/ruslan/.claude/jobs/73df9ce2/tmp/set-env.sh production
#   ! sh /Users/ruslan/.claude/jobs/73df9ce2/tmp/set-env.sh preview
# Reads ~/.config/personal-finance-deploy/<scope>.env by SOURCING it (the runbook's rule), pipes each
# value to `vercel env add` through stdin (never on a command line), and prints names and CLI status
# only. Stops at the first failure. Nothing is written inside the repository.
set -eu

SCOPE=${1:-}
case "$SCOPE" in
  production | preview) ;;
  *)
    echo "usage: sh set-env.sh production|preview"
    exit 2
    ;;
esac

W=/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/chore-node-24
F="$HOME/.config/personal-finance-deploy/$SCOPE.env"
P=personal-finance
ERR=$(mktemp)
trap 'rm -f "$ERR"' EXIT

[ -f "$F" ] || { echo "missing $F"; exit 1; }
cd "$W" # only so that `require("bcryptjs")` resolves
set -a
. "$F"
set +a

# Config values first (WEBMCP_MODE is the probe for Preview's non-interactive form), secrets after.
if [ "$SCOPE" = production ]; then
  CONFIG="WEBMCP_MODE DEMO_EMAIL DEMO_PASSWORD_DISPLAY"
  SECRET="SESSION_SECRET RESET_SECRET DEMO_PASSWORD_HASH CRON_SECRET"
else
  CONFIG="WEBMCP_MODE DEMO_EMAIL DEMO_PASSWORD_DISPLAY"
  SECRET="SESSION_SECRET RESET_SECRET DEMO_PASSWORD_HASH"
fi

# 1. Guard: a clean slate for this scope — nothing here overwrites a value.
existing=$(vercel env ls "$SCOPE" --project "$P" 2>&1) || true
for name in $CONFIG $SECRET; do
  if printf '%s' "$existing" | grep -q "$name"; then
    echo "already set in $SCOPE: $name — stop (delete it first if it is wrong)"
    exit 1
  fi
done

# 2. The demo hash must be a raw bcrypt hash that matches the displayed password (booleans only).
node -e 'const b=require("bcryptjs");const h=process.env.DEMO_PASSWORD_HASH;const ok=/^\$2[aby]\$\d\d\$/.test(h)&&b.compareSync(process.env.DEMO_PASSWORD_DISPLAY,h);console.log("demo hash check:",ok);process.exit(ok?0:1)'

add() {
  name=$1
  flag=$2
  eval "value=\${$name}"
  if printf '%s' "$value" | vercel env add "$name" "$SCOPE" "$flag" --project "$P" --yes >/dev/null 2>"$ERR"; then
    echo "set $name ($flag, $SCOPE)"
  else
    echo "FAILED $name ($flag, $SCOPE):"
    cat "$ERR"
    exit 1
  fi
}

for name in $CONFIG; do add "$name" --no-sensitive; done
for name in $SECRET; do add "$name" --sensitive; done

echo "--- vercel env ls $SCOPE (names and scopes) ---"
vercel env ls "$SCOPE" --project "$P"
