#!/bin/sh
# T-14 Task 8.2–8.4 — the secret-using production checks. Run by the OWNER, after PR #60 has merged and
# plan step 8.1 (production built from Git, the project domain serves it) is confirmed:
#   ! sh /Users/ruslan/.claude/jobs/73df9ce2/tmp/task8-secrets.sh
# Reads ~/.config/personal-finance-deploy/*.env by SOURCING them; each secret reaches curl through a config on
# stdin, never on a command line; prints status codes and non-secret bodies only. It SEEDS production (8.2).
set -eu
umask 077
BASE=${1:-https://personal-finance-cyan-kappa.vercel.app}
D="$HOME/.config/personal-finance-deploy"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

echo "== 8.2 the first seed (production RESET_SECRET) =="
(
  set -a; . "$D/production.env"; set +a
  printf 'header = "Authorization: Bearer %s"\n' "$RESET_SECRET" \
    | curl -sS -K - -X POST -o /dev/null -w 'POST /api/admin/reset -> %{http_code} (expect 204)\n' "$BASE/api/admin/reset"
)
curl -sS -w '\nGET /api/meta -> %{http_code} (expect 200, with lastResetAt)\n' "$BASE/api/meta"

echo "== 8.3 the PREVIEW's RESET_SECRET must not open production =="
(
  set -a; . "$D/preview.env"; set +a
  printf 'header = "Authorization: Bearer %s"\n' "$RESET_SECRET" \
    | curl -sS -K - -X POST -o /dev/null -w 'POST with the preview secret -> %{http_code} (expect 401)\n' "$BASE/api/admin/reset"
)

echo "== 8.4 the cron's own call (CRON_SECRET), just after the seed: not due yet, no redirect =="
(
  set -a; . "$D/production.env"; set +a
  printf 'header = "Authorization: Bearer %s"\n' "$CRON_SECRET" \
    | curl -sS -K - -o "$T/cron.body" -w 'GET /api/admin/reset -> %{http_code} redirect=[%{redirect_url}] (expect 200 and empty redirect)\n' "$BASE/api/admin/reset"
  cat "$T/cron.body"
  echo
)
