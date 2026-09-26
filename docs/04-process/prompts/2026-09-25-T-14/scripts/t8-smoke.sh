#!/bin/sh
# T-14 Task 8.3: smoke on the PUBLIC production domain (no bypass header). Signs in as the demo account (public
# credentials, NFR-S1). Cookie goes through a 0600 config file removed on exit. Prints statuses, header presence and
# booleans only.
set -eu
umask 077
BASE=${1:-https://personal-finance-cyan-kappa.vercel.app}
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/production.env"; set +a
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

hdrs() { # label headers-file
  out=""
  for n in content-security-policy referrer-policy x-content-type-options x-request-id x-powered-by; do
    if grep -qi "^$n:" "$2"; then out="$out $n=yes"; else out="$out $n=NO"; fi
  done
  echo "$1 -> $(sed -n '1p' "$2" | tr -d '\r') |$out"
}

curl -sS -D "$T/l.h" -o /dev/null "$BASE/login"; hdrs "GET /login" "$T/l.h"
echo "HSTS: $(grep -i '^strict-transport-security:' "$T/l.h" | tr -d '\r' | cut -d' ' -f2-)"
curl -sS -D "$T/r.h" -o /dev/null "$BASE/"; echo "GET / -> $(sed -n '1p' "$T/r.h" | tr -d '\r') location: $(grep -i '^location:' "$T/r.h" | tr -d '\r' | cut -d' ' -f2-)"
echo "GET /robots.txt -> $(curl -sS -o /dev/null -w '%{http_code}' "$BASE/robots.txt")"
curl -sS -D "$T/m.h" -o "$T/meta.body" "$BASE/api/meta"; hdrs "GET /api/meta" "$T/m.h"; echo "  body: $(cat "$T/meta.body")"

jq -n --arg e "$DEMO_EMAIL" --arg p "$DEMO_PASSWORD_DISPLAY" '{email:$e,password:$p}' \
  | curl -sS -X POST -H 'Content-Type: application/json' --data @- -D "$T/login.h" -o /dev/null "$BASE/api/auth/login"
echo "POST /api/auth/login (demo) -> $(sed -n '1p' "$T/login.h" | tr -d '\r')"
cookie=$(tr -d '\r' < "$T/login.h" | sed -n 's/^[Ss]et-[Cc]ookie: \(pf_session=[^;]*\).*/\1/p')
[ -n "$cookie" ] || { echo "no session cookie"; exit 1; }
echo "session cookie attributes:$(tr -d '\r' < "$T/login.h" | grep -i '^set-cookie: pf_session' | sed 's/^[^;]*;//')"
printf 'header = "Cookie: %s"\n' "$cookie" > "$T/cookie.cfg"

curl -sS -K "$T/cookie.cfg" -D "$T/o.h" -o "$T/overview.body" "$BASE/overview"; hdrs "GET /overview (signed in)" "$T/o.h"
echo "  the seed's balance \$4,836.00 is in the page: $(grep -qF '$4,836.00' "$T/overview.body" && echo true || echo false); bytes: $(wc -c < "$T/overview.body" | tr -d ' ')"
curl -sS -K "$T/cookie.cfg" -o /dev/null -w 'GET /api/overview (signed in) -> %{http_code}\n' "$BASE/api/overview"
curl -sS -D "$T/e.h" -o /dev/null "$BASE/overview"; echo "GET /overview (no session) -> $(sed -n '1p' "$T/e.h" | tr -d '\r') location: $(grep -i '^location:' "$T/e.h" | tr -d '\r' | cut -d' ' -f2-)"
echo "origin-trial meta tag on /login (expect 0 until step 8.5): $(curl -sS "$BASE/login" | grep -c 'http-equiv="origin-trial"' || true)"
