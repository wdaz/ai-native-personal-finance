#!/bin/sh
# T-14 Q3 = (a): the agent generates the deploy secrets into 0600 files outside the repository.
# Prints names, modes and nothing else. Refuses to overwrite an existing file.
set -eu
umask 077
W=/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/chore-node-24
D="$HOME/.config/personal-finance-deploy"
mkdir -p "$D"
chmod 700 "$D"

for scope in production preview; do
  if [ -e "$D/$scope.env" ]; then
    echo "refusing: $D/$scope.env already exists"
    exit 1
  fi
done

rand() { openssl rand -base64 48 | tr -d '\n'; }

# One throwaway demo password for both scopes (public by design, NFR-S1); the owner approves it.
DEMO_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=\n' | cut -c1-16)
cd "$W"
DEMO_PASSWORD_HASH=$(node -e 'require("bcryptjs").hash(process.argv[1], 10).then(console.log)' "$DEMO_PASSWORD")

{
  echo "SESSION_SECRET='$(rand)'"
  echo "RESET_SECRET='$(rand)'"
  echo "CRON_SECRET='$(rand)'"
  echo "DEMO_EMAIL='demo@example.com'"
  echo "DEMO_PASSWORD_DISPLAY='$DEMO_PASSWORD'"
  echo "DEMO_PASSWORD_HASH='$DEMO_PASSWORD_HASH'"
  echo "WEBMCP_MODE='polyfill'"
  echo "VERCEL_BYPASS=''"
} > "$D/production.env"

{
  echo "SESSION_SECRET='$(rand)'"
  echo "RESET_SECRET='$(rand)'"
  echo "DEMO_EMAIL='demo@example.com'"
  echo "DEMO_PASSWORD_DISPLAY='$DEMO_PASSWORD'"
  echo "DEMO_PASSWORD_HASH='$DEMO_PASSWORD_HASH'"
  echo "WEBMCP_MODE='polyfill'"
  echo "VERCEL_BYPASS=''"
} > "$D/preview.env"

chmod 600 "$D/production.env" "$D/preview.env"
echo "dir mode: $(stat -f '%Lp' "$D")"
for scope in production preview; do
  echo "$scope.env: mode $(stat -f '%Lp' "$D/$scope.env"), names: $(cut -d= -f1 "$D/$scope.env" | tr '\n' ' ')"
done
