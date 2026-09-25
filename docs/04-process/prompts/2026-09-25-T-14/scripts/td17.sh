#!/bin/sh
# T-14 step 6.7 (TD-17) on a PREVIEW, bounded: 10 failed logins under one spoofed X-Forwarded-For, an 11th under
# ANOTHER spoofed value, then one preview reset (clears LoginAttempt) and one sanity login. 13 requests in all.
# If Vercel overwrites the header, the key is the real client address, so the 11th is 429 whatever it says.
set -eu
umask 077
BASE=${1:?usage: td17.sh https://<preview-host>}
T=/Users/ruslan/.claude/jobs/73df9ce2/tmp/td17
mkdir -p "$T"
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/preview.env"; set +a
BYPASS_CFG="$T/bypass.cfg"; RESET_CFG="$T/reset.cfg"
printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS" > "$BYPASS_CFG"
{ printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS"; printf 'header = "Authorization: Bearer %s"\n' "$RESET_SECRET"; } > "$RESET_CFG"
trap 'rm -f "$BYPASS_CFG" "$RESET_CFG"' EXIT

attempt() { # xff-value password
  jq -n --arg e "$DEMO_EMAIL" --arg p "$2" '{email:$e,password:$p}' \
    | curl -sS -K "$BYPASS_CFG" -X POST -H 'Content-Type: application/json' -H "X-Forwarded-For: $1" --data @- \
        -D "$T/h" -o /dev/null "$BASE/api/auth/login"
  printf '%s' "$(sed -n '1s/^HTTP[^ ]* \([0-9]*\).*/\1/p' "$T/h")"
}

printf 'ten failures under X-Forwarded-For 198.51.100.7:'
for i in 1 2 3 4 5 6 7 8 9 10; do printf ' %s' "$(attempt 198.51.100.7 'wrong-password-td17')"; done
echo
printf '11th under a DIFFERENT spoofed X-Forwarded-For 203.0.113.9: %s' "$(attempt 203.0.113.9 'wrong-password-td17')"
echo " | Retry-After: $(grep -i '^retry-after:' "$T/h" | tr -d '\r' | cut -d' ' -f2)"

curl -sS -K "$RESET_CFG" -X POST -o /dev/null -w 'preview reset (clears LoginAttempt) -> %{http_code}\n' "$BASE/api/admin/reset"
printf 'sanity: correct password after the reset -> %s\n' "$(attempt 203.0.113.9 "$DEMO_PASSWORD_DISPLAY")"
