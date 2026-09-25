#!/bin/sh
# T-14 review follow-up (findings 4 and 13): which of the proxy's headers do the responses that skip the proxy
# carry, and does /_global-error's response carry X-Request-Id? Prints header presence only, never a value.
# The bypass secret reaches curl through a config on stdin.
set -eu
umask 077
BASE=${1:?usage: td19-headers.sh https://<preview-host>}
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/preview.env"; set +a
T=$(mktemp)
trap 'rm -f "$T"' EXIT
for p in /overview.segments/_tree.segment.rsc /api/overview.json /_global-error /login; do
  printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS" | curl -sS -K - -D "$T" -o /dev/null "$BASE$p"
  out=""
  for n in content-security-policy referrer-policy x-content-type-options x-request-id x-powered-by; do
    if grep -qi "^$n:" "$T"; then out="$out $n=yes"; else out="$out $n=NO"; fi
  done
  echo "GET $p ($(sed -n '1p' "$T" | tr -d '\r')) |$out"
done
