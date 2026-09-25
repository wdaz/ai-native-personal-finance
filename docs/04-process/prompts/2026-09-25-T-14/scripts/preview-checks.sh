#!/bin/sh
# T-14 steps 6.4, 6.6, 6.8, 6.9 on a PREVIEW. Non-destructive GETs. The bypass secret goes to curl through a
# 0600 config file removed on exit; bodies are not printed; the session cookie (6.6, 6.9) never is.
set -eu
umask 077
BASE=${1:?usage: preview-checks.sh https://<preview-host>}
HOST=${BASE#https://}
T=/Users/ruslan/.claude/jobs/73df9ce2/tmp/pc
mkdir -p "$T"
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/preview.env"; set +a
BYPASS_CFG="$T/bypass.cfg"; COOKIE_CFG="$T/cookie.cfg"
printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS" > "$BYPASS_CFG"
: > "$COOKIE_CFG"
trap 'rm -f "$BYPASS_CFG" "$COOKIE_CFG" "$T/login.headers"' EXIT

hdr() { # label file names...   prints which of the named headers are present, and their values for non-nonce ones
  label=$1; f=$2; shift 2
  out=""
  for n in "$@"; do
    if grep -qi "^$n:" "$f"; then out="$out $n=yes"; else out="$out $n=NO"; fi
  done
  echo "$label |$out"
}

echo "== 6.4 Deployment Protection: no bypass header =="
curl -sS -D "$T/h" -o /dev/null "$BASE/login"
echo "GET /login without header -> $(sed -n '1p' "$T/h" | tr -d '\r') location=$(grep -i '^location:' "$T/h" | tr -d '\r' | sed 's|^[Ll]ocation: \(https://[^/?]*\).*|\1|')"

echo "== 6.6 proxy on Vercel =="
curl -sS -K "$BYPASS_CFG" -D "$T/h" -o /dev/null "$BASE/"
echo "GET / (no session) -> $(sed -n '1p' "$T/h" | tr -d '\r') location=$(grep -i '^location:' "$T/h" | tr -d '\r' | sed 's/^[Ll]ocation: //')"
NAMES="content-security-policy referrer-policy x-content-type-options x-request-id"
for p in /login /api/meta; do
  curl -sS -K "$BYPASS_CFG" -D "$T/h" -o /dev/null "$BASE$p"
  hdr "GET $p ($(sed -n '1p' "$T/h" | tr -d '\r'))" "$T/h" $NAMES
  grep -qi '^x-powered-by:' "$T/h" && echo "  x-powered-by PRESENT" || echo "  x-powered-by absent"
done

# signed in
jq -n --arg e "$DEMO_EMAIL" --arg p "$DEMO_PASSWORD_DISPLAY" '{email:$e,password:$p}' \
  | curl -sS -K "$BYPASS_CFG" -X POST -H 'Content-Type: application/json' --data @- -D "$T/login.headers" -o /dev/null "$BASE/api/auth/login"
cookie=$(tr -d '\r' < "$T/login.headers" | sed -n 's/^[Ss]et-[Cc]ookie: \(pf_session=[^;]*\).*/\1/p')
[ -n "$cookie" ] || { echo "login failed"; exit 1; }
printf 'header = "Cookie: %s"\n' "$cookie" > "$COOKIE_CFG"
SC=$(tr -d '\r' < "$T/login.headers" | grep -i '^set-cookie: pf_session' | sed 's/^[^;]*;//')
echo "session cookie attributes:$SC"
curl -sS -K "$BYPASS_CFG" -K "$COOKIE_CFG" -D "$T/h" -o /dev/null "$BASE/overview"
hdr "GET /overview signed in ($(sed -n '1p' "$T/h" | tr -d '\r'))" "$T/h" $NAMES
grep -qi '^x-powered-by:' "$T/h" && echo "  x-powered-by PRESENT" || echo "  x-powered-by absent"

echo "== nonce freshness: CSP nonce of two requests to /login =="
n1=$(curl -sS -K "$BYPASS_CFG" -D - -o /dev/null "$BASE/login" | grep -i '^content-security-policy' | grep -o "nonce-[A-Za-z0-9+/=_-]*" | head -1)
n2=$(curl -sS -K "$BYPASS_CFG" -D - -o /dev/null "$BASE/login" | grep -i '^content-security-policy' | grep -o "nonce-[A-Za-z0-9+/=_-]*" | head -1)
[ "$n1" != "$n2" ] && [ -n "$n1" ] && echo "nonces differ: true" || echo "nonces differ: FALSE ($n1 / $n2)"

echo "== 6.8 TD-3: /_global-error twice =="
for i in 1 2; do
  curl -sS -K "$BYPASS_CFG" -D "$T/g$i.h" -o "$T/g$i.body" "$BASE/_global-error"
  echo "req $i: $(sed -n '1p' "$T/g$i.h" | tr -d '\r') | x-vercel-cache: $(grep -i '^x-vercel-cache:' "$T/g$i.h" | tr -d '\r' | cut -d' ' -f2) | cache-control: $(grep -i '^cache-control:' "$T/g$i.h" | tr -d '\r' | cut -d' ' -f2-) | age: $(grep -i '^age:' "$T/g$i.h" | tr -d '\r' | cut -d' ' -f2) | csp nonce: $(grep -i '^content-security-policy' "$T/g$i.h" | grep -o 'nonce-[A-Za-z0-9+/=_-]*' | head -1 | cut -c1-14)... | $(wc -c < "$T/g$i.body" | tr -d ' ') bytes"
done
cmp -s "$T/g1.body" "$T/g2.body" && echo "HTML byte-identical: true" || echo "HTML byte-identical: false"

echo "== 6.9 host items =="
echo "http:// -> $(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' "http://$HOST/login")"
curl -sS -D "$T/h" -o /dev/null "$BASE/login"
echo "HSTS on the preview host: $(grep -i '^strict-transport-security:' "$T/h" | tr -d '\r' | cut -d' ' -f2-)"
echo "robots.txt (with bypass): $(curl -sS -K "$BYPASS_CFG" -o /dev/null -w '%{http_code}' "$BASE/robots.txt")"
echo "TLS: $(curl -sS -v -o /dev/null "$BASE/login" 2>&1 | grep -E 'SSL connection using|subject:|issuer:|expire date' | tr -d '\r' | sed 's/^\* *//' | tr '\n' ';')"
