#!/bin/sh
# T-14 step 6.5 helper: fetch ONE path from a PREVIEW, optionally signed in as the demo account.
#   sh td14-get.sh <base-url> <path> [signed]  -> report line; the body is kept at td14/get.body (seed data / route metadata)
# Secrets go through 0600 config files removed on exit; nothing secret is printed.
set -eu
umask 077
BASE=${1:?usage: td14-get.sh https://<preview-host> </path> [signed]}
P=${2:?path}
SIGNED=${3:-}
MARKER=${MARKER:-}
T=/Users/ruslan/.claude/jobs/73df9ce2/tmp/td14
mkdir -p "$T"
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/preview.env"; set +a
BYPASS_CFG="$T/bypass.cfg"
COOKIE_CFG="$T/cookie.cfg"
printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS" > "$BYPASS_CFG"
: > "$COOKIE_CFG"
trap 'rm -f "$BYPASS_CFG" "$COOKIE_CFG" "$T/login.headers"' EXIT

if [ "$SIGNED" = signed ]; then
  jq -n --arg e "$DEMO_EMAIL" --arg p "$DEMO_PASSWORD_DISPLAY" '{email:$e,password:$p}' \
    | curl -sS -K "$BYPASS_CFG" -X POST -H 'Content-Type: application/json' --data @- \
        -D "$T/login.headers" -o /dev/null "$BASE/api/auth/login"
  cookie=$(tr -d '\r' < "$T/login.headers" | sed -n 's/^[Ss]et-[Cc]ookie: \(pf_session=[^;]*\).*/\1/p')
  [ -n "$cookie" ] || { echo "login failed"; exit 1; }
  printf 'header = "Cookie: %s"\n' "$cookie" > "$COOKIE_CFG"
fi

set --
[ -n "${RSC:-}" ] && set -- -H 'RSC: 1'
curl -sS -K "$BYPASS_CFG" -K "$COOKIE_CFG" "$@" -D "$T/get.headers" -o "$T/get.body" "$BASE$P"
st=$(sed -n '1s/^HTTP[^ ]* \([0-9]*\).*/\1/p' "$T/get.headers")
rid=no; grep -qi '^x-request-id:' "$T/get.headers" && rid=yes
ct=$(grep -i '^content-type:' "$T/get.headers" | head -1 | tr -d '\r' | cut -d' ' -f2-)
mk="-"
if [ -n "$MARKER" ]; then
  if grep -qF -- "$MARKER" "$T/get.body"; then mk=CONTAINS; else mk=absent; fi
fi
echo "${SIGNED:-cookie-less} GET $P${RSC:+ (RSC: 1)} | status ${st:-?} | X-Request-Id $rid | ${ct:-none} | $(wc -c < "$T/get.body" | tr -d ' ') bytes | marker $mk"
