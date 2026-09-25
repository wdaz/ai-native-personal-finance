#!/bin/sh
# T-14 6.5 extra: the header form a real Next client sends for a segment prefetch of /overview, cookie-less and
# signed in (control). Same secret handling as td14-get.sh; prints status/size/marker verdict only.
set -eu
umask 077
BASE=${1:?usage: td14-prefetch.sh https://<preview-host>}
MARKER='$4,836.00'
T=/Users/ruslan/.claude/jobs/73df9ce2/tmp/td14
mkdir -p "$T"
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/preview.env"; set +a
BYPASS_CFG="$T/bypass.cfg"; COOKIE_CFG="$T/cookie.cfg"
printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS" > "$BYPASS_CFG"
: > "$COOKIE_CFG"
trap 'rm -f "$BYPASS_CFG" "$COOKIE_CFG" "$T/login.headers"' EXIT

one() { # label
  curl -sS -K "$BYPASS_CFG" -K "$COOKIE_CFG" -H 'RSC: 1' -H 'Next-Router-Prefetch: 1' \
    -H 'Next-Router-Segment-Prefetch: /overview/__PAGE__' -D "$T/pf.headers" -o "$T/pf.body" "$BASE/overview"
  st=$(sed -n '1s/^HTTP[^ ]* \([0-9]*\).*/\1/p' "$T/pf.headers")
  rid=no; grep -qi '^x-request-id:' "$T/pf.headers" && rid=yes
  ct=$(grep -i '^content-type:' "$T/pf.headers" | head -1 | tr -d '\r' | cut -d' ' -f2-)
  mk=absent; grep -qF -- "$MARKER" "$T/pf.body" && mk=CONTAINS
  loc=$(grep -i '^location:' "$T/pf.headers" | head -1 | tr -d '\r' | sed 's/^[Ll]ocation: //')
  echo "$1 | status ${st:-?} | X-Request-Id $rid | ${ct:-none} | $(wc -c < "$T/pf.body" | tr -d ' ') bytes | location ${loc:--} | marker $mk"
}

one "cookie-less  GET /overview (RSC, Next-Router-Prefetch, Next-Router-Segment-Prefetch: /overview/__PAGE__)"

jq -n --arg e "$DEMO_EMAIL" --arg p "$DEMO_PASSWORD_DISPLAY" '{email:$e,password:$p}' \
  | curl -sS -K "$BYPASS_CFG" -X POST -H 'Content-Type: application/json' --data @- -D "$T/login.headers" -o /dev/null "$BASE/api/auth/login"
cookie=$(tr -d '\r' < "$T/login.headers" | sed -n 's/^[Ss]et-[Cc]ookie: \(pf_session=[^;]*\).*/\1/p')
[ -n "$cookie" ] || { echo "login failed"; exit 1; }
printf 'header = "Cookie: %s"\n' "$cookie" > "$COOKIE_CFG"
one "signed-in    GET /overview (same headers) — control"
