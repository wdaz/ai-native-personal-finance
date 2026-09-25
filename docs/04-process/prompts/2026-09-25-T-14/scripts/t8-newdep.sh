#!/bin/sh
# T-14 Task 8.1: the NEW production deployment, through the team alias (SSO-protected → bypass header via stdin).
# Status codes and header presence only.
set -eu
BASE=${1:?usage: t8-newdep.sh https://<team-alias-or-deployment-url>}
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/production.env"; set +a
T=$(mktemp)
trap 'rm -f "$T"' EXIT
for p in /login /api/meta /; do
  printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS" | curl -sS -K - -D "$T" -o /dev/null "$BASE$p"
  out=""
  for n in content-security-policy referrer-policy x-content-type-options x-request-id strict-transport-security x-powered-by; do
    if grep -qi "^$n:" "$T"; then out="$out $n=yes"; else out="$out $n=NO"; fi
  done
  echo "GET $p -> $(sed -n '1p' "$T" | tr -d '\r') | location: $(grep -i '^location:' "$T" | tr -d '\r' | cut -d' ' -f2-)|$out | $(grep -i '^x-vercel-id:' "$T" | tr -d '\r' | cut -d' ' -f2 | cut -c1-16)"
done
