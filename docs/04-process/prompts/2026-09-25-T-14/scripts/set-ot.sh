#!/bin/sh
# T-14 step 8.5 — run by the OWNER after registering the origin trial for the project domain and adding the token to
# ~/.config/personal-finance-deploy/production.env with an editor (a line WEBMCP_ORIGIN_TRIAL_TOKEN='<token>'):
#   ! sh /Users/ruslan/.claude/jobs/73df9ce2/tmp/set-ot.sh
# Sets it for PRODUCTION only, as a Config variable (the token is printed into every page as a <meta> tag, so it is not
# a secret). It reaches production with the next production deployment. Prints names only.
set -eu
D="$HOME/.config/personal-finance-deploy"
P=personal-finance
set -a; . "$D/production.env"; set +a
if [ -z "${WEBMCP_ORIGIN_TRIAL_TOKEN:-}" ]; then
  echo "WEBMCP_ORIGIN_TRIAL_TOKEN is empty or missing in $D/production.env — add it with an editor first"
  exit 1
fi
if vercel env ls production --project "$P" 2>&1 | grep -q WEBMCP_ORIGIN_TRIAL_TOKEN; then
  echo "WEBMCP_ORIGIN_TRIAL_TOKEN already exists for production — remove or rotate it first (runbook, step 8)"
  exit 1
fi
printf '%s' "$WEBMCP_ORIGIN_TRIAL_TOKEN" | vercel env add WEBMCP_ORIGIN_TRIAL_TOKEN production --no-sensitive --project "$P" --yes >/dev/null
echo "set WEBMCP_ORIGIN_TRIAL_TOKEN (--no-sensitive, production)"
vercel env ls production --project "$P"
