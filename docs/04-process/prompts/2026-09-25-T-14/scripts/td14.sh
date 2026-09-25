#!/bin/sh
# T-14 step 6.5 (TD-14) against a PREVIEW. Secrets (bypass secret, demo password, session cookie) reach
# curl through 0600 config files that are removed on exit; nothing secret is printed, and bodies are
# never printed — only status, X-Request-Id presence, content-type, size and the marker verdict.
#   sh td14.sh <base-url> control            login + `GET /overview` with `RSC: 1`; body kept for picking a marker
#   sh td14.sh <base-url> probes <marker>    the four cookie-less probes plus two baselines
set -eu
umask 077
BASE=${1:?usage: td14.sh https://<preview-host> control|probes [marker]}
MODE=${2:?control|probes}
MARKER=${3:-}
T=/Users/ruslan/.claude/jobs/73df9ce2/tmp/td14
mkdir -p "$T"
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/preview.env"; set +a
BYPASS_CFG="$T/bypass.cfg"
COOKIE_CFG="$T/cookie.cfg"
printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS" > "$BYPASS_CFG"
trap 'rm -f "$BYPASS_CFG" "$COOKIE_CFG" "$T/login.headers"' EXIT

report() { # label headers-file body-file
  st=$(sed -n '1s/^HTTP[^ ]* \([0-9]*\).*/\1/p' "$2")
  rid=no; grep -qi '^x-request-id:' "$2" && rid=yes
  ct=$(grep -i '^content-type:' "$2" | head -1 | tr -d '\r' | cut -d' ' -f2-)
  bytes=$(wc -c < "$3" | tr -d ' ')
  loc=$(grep -i '^location:' "$2" | head -1 | tr -d '\r' | sed 's/^[Ll]ocation: //' | sed 's|https\{0,1\}://[^/]*||')
  mk="-"
  if [ -n "$MARKER" ]; then
    if grep -qF -- "$MARKER" "$3"; then mk=CONTAINS; else mk=absent; fi
  fi
  echo "$1 | status ${st:-?} | X-Request-Id $rid | content-type ${ct:-none} | ${bytes} bytes | location ${loc:--} | marker $mk"
}

probe() { # label path [extra curl args]
  label=$1; path=$2; shift 2
  curl -sS -K "$BYPASS_CFG" "$@" -D "$T/p.headers" -o "$T/p.body" "$BASE$path"
  report "$label" "$T/p.headers" "$T/p.body"
}

if [ "$MODE" = control ]; then
  jq -n --arg e "$DEMO_EMAIL" --arg p "$DEMO_PASSWORD_DISPLAY" '{email:$e,password:$p}' \
    | curl -sS -K "$BYPASS_CFG" -X POST -H 'Content-Type: application/json' --data @- \
        -D "$T/login.headers" -o /dev/null "$BASE/api/auth/login"
  cookie=$(tr -d '\r' < "$T/login.headers" | sed -n 's/^[Ss]et-[Cc]ookie: \(pf_session=[^;]*\).*/\1/p')
  if [ -z "$cookie" ]; then
    echo "login failed: $(sed -n '1p' "$T/login.headers" | tr -d '\r')"
    exit 1
  fi
  printf 'header = "Cookie: %s"\n' "$cookie" > "$COOKIE_CFG"
  curl -sS -K "$BYPASS_CFG" -K "$COOKIE_CFG" -H 'RSC: 1' -D "$T/c.headers" -o "$T/control.body" "$BASE/overview"
  report "CONTROL signed-in GET /overview (RSC: 1)" "$T/c.headers" "$T/control.body"
  echo "body kept at $T/control.body (public seed data; pick a marker from it)"
else
  probe "GET /overview.rsc (no cookie)" /overview.rsc
  probe "GET /overview.segments/_tree.segment.rsc (no cookie)" /overview.segments/_tree.segment.rsc
  probe "GET /api/overview.json (no cookie)" /api/overview.json
  probe "GET /overview RSC: 1 (no cookie)" /overview -H 'RSC: 1'
  probe "baseline GET /overview (no cookie)" /overview
  probe "baseline GET /api/overview (no cookie)" /api/overview
fi
