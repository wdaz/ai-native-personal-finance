#!/bin/sh
# TD-19: what a PREVIEW answers for a protected page's and API's transport forms, cookie-less and signed in
# as the demo account. Prints, per path: status, whether the proxy's X-Request-Id and Content-Security-Policy
# are there, the redirect target (a relative path) and the size. Never prints a secret or the cookie.
# The bypass header and the cookie reach curl through 0600 config files in a temporary directory.
#   sh preview-probe.sh https://<preview-host>
set -eu
umask 077
BASE=${1:?usage: preview-probe.sh https://<preview-host>}
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/preview.env"; set +a
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS" > "$T/bypass.cfg"
: > "$T/cookie.cfg"

probe() {
  label=$1; path=$2
  curl -sS -K "$T/bypass.cfg" -K "$T/cookie.cfg" -D "$T/h" -o "$T/b" "$BASE$path"
  st=$(sed -n '1s/^HTTP[^ ]* \([0-9]*\).*/\1/p' "$T/h")
  rid=no; grep -qi '^x-request-id:' "$T/h" && rid=yes
  csp=no; grep -qi '^content-security-policy:' "$T/h" && csp=yes
  loc=$(grep -i '^location:' "$T/h" | head -1 | tr -d '\r' | cut -d' ' -f2- | sed 's#^https\{0,1\}://[^/]*##')
  ct=$(grep -i '^content-type:' "$T/h" | head -1 | tr -d '\r' | cut -d' ' -f2- | cut -d';' -f1)
  printf '%-10s %-60s %s | rid=%s csp=%s | %s | %s bytes%s\n' "$label" "$path" "${st:-?}" "$rid" "$csp" "${ct:-none}" "$(wc -c < "$T/b" | tr -d ' ')" "${loc:+ | -> $loc}"
}

PATHS='/overview
/overview.rsc
/overview.segments/_tree.segment.rsc
/overview.segments/_full.segment.rsc
/overview.segments/(app)/overview/__PAGE__.segment.rsc
/transactions.segments/_tree.segment.rsc
/api/overview
/api/overview.json
/avatars/bytewise.jpg
/login'

echo "== cookie-less"
echo "$PATHS" | while IFS= read -r p; do probe cookie-less "$p"; done

jq -n --arg e "$DEMO_EMAIL" --arg p "$DEMO_PASSWORD_DISPLAY" '{email:$e,password:$p}' \
  | curl -sS -K "$T/bypass.cfg" -X POST -H 'Content-Type: application/json' --data @- -D "$T/login.h" -o /dev/null "$BASE/api/auth/login"
cookie=$(tr -d '\r' < "$T/login.h" | sed -n 's/^[Ss]et-[Cc]ookie: \(pf_session=[^;]*\).*/\1/p')
[ -n "$cookie" ] || { echo "login failed: no session cookie"; exit 1; }
printf 'header = "Cookie: %s"\n' "$cookie" > "$T/cookie.cfg"

echo "== signed in (demo account)"
echo "$PATHS" | while IFS= read -r p; do probe signed "$p"; done
