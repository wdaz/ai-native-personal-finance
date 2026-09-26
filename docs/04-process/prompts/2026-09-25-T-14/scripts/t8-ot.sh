#!/bin/sh
# T-14 step 8.5 check: the origin-trial <meta> is rendered by the (app) layout, so it is on signed-in pages, not /login.
# Signs in as the demo account (public credentials); prints counts and booleans only, never the token.
set -eu
umask 077
BASE=${1:-https://personal-finance-cyan-kappa.vercel.app}
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/production.env"; set +a
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
echo "/login  tags: $(curl -sS "$BASE/login" | grep -o 'http-equiv="origin-trial"' | wc -l | tr -d ' ') (expected 0: outside the (app) layout)"
jq -n --arg e "$DEMO_EMAIL" --arg p "$DEMO_PASSWORD_DISPLAY" '{email:$e,password:$p}' \
  | curl -sS -X POST -H 'Content-Type: application/json' --data @- -D "$T/l.h" -o /dev/null "$BASE/api/auth/login"
cookie=$(tr -d '\r' < "$T/l.h" | sed -n 's/^[Ss]et-[Cc]ookie: \(pf_session=[^;]*\).*/\1/p')
[ -n "$cookie" ] || { echo "login failed"; exit 1; }
printf 'header = "Cookie: %s"\n' "$cookie" > "$T/c.cfg"
curl -sS -K "$T/c.cfg" -o "$T/overview.html" "$BASE/overview"
echo "/overview (signed in) tags: $(grep -o 'http-equiv="origin-trial"' "$T/overview.html" | wc -l | tr -d ' ') (expected 1)"
echo "the tag's content equals the configured token: $(grep -qF "content=\"$WEBMCP_ORIGIN_TRIAL_TOKEN\"" "$T/overview.html" && echo true || echo false)"
echo "sidebar indicator text in the page: $(grep -o 'Agent tools[^<]*' "$T/overview.html" | head -1)"
