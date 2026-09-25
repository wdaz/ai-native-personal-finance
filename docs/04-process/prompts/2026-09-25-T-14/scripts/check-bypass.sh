#!/bin/sh
# T-14 step 5.3 check: booleans and status codes only; the secret is never printed. The header goes
# to curl through a config on stdin, not argv.
set -eu
D="$HOME/.config/personal-finance-deploy"
for scope in production preview; do
  set -a; . "$D/$scope.env"; set +a
  v=$VERCEL_BYPASS
  echo "$scope.env: VERCEL_BYPASS non-empty: $([ -n "$v" ] && echo true || echo false); length>=16: $([ ${#v} -ge 16 ] && echo true || echo false); no quotes/spaces: $(printf '%s' "$v" | grep -q "[[:space:]'\"]" && echo false || echo true)"
  eval "B_$scope=\$v"
done
echo "same value in both files: $([ "$B_production" = "$B_preview" ] && echo true || echo false)"

URL=https://personal-finance-ruslan-496a.vercel.app/login
without=$(curl -sS -o /dev/null -w '%{http_code}' "$URL")
with=$(printf 'header = "x-vercel-protection-bypass: %s"\n' "$B_production" | curl -sS -K - -o /dev/null -w '%{http_code}' "$URL")
echo "team alias /login without header: $without ; with header: $with"
