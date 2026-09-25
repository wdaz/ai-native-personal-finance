#!/bin/sh
# T-14 step 6.3: seed the PREVIEW's own Neon branch. Secrets go to curl through a config on stdin
# (never argv) and are never printed. Prints status codes and the (non-secret) /api/meta body.
set -eu
BASE=${1:?usage: preview-seed.sh https://<preview-host>}
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/preview.env"; set +a

bypass() { printf 'header = "x-vercel-protection-bypass: %s"\n' "$VERCEL_BYPASS"; }

{ bypass; printf 'header = "Authorization: Bearer %s"\n' "$RESET_SECRET"; } \
  | curl -sS -K - -X POST -o /dev/null -w 'POST /api/admin/reset -> %{http_code}\n' "$BASE/api/admin/reset"

bypass | curl -sS -K - -w '\nGET /api/meta -> %{http_code}\n' "$BASE/api/meta"
