#!/bin/sh
# T-14 step 5.6 pre-check: booleans only, no value printed. Sources the files the way the runbook says.
set -eu
W=/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/chore-node-24
D="$HOME/.config/personal-finance-deploy"
cd "$W"

set -a; . "$D/production.env"; set +a
P_SESSION=$SESSION_SECRET; P_RESET=$RESET_SECRET; P_HASH=$DEMO_PASSWORD_HASH
echo "production: session>=32: $([ ${#SESSION_SECRET} -ge 32 ] && echo true || echo false); cron>=16: $([ ${#CRON_SECRET} -ge 16 ] && echo true || echo false); reset>=16: $([ ${#RESET_SECRET} -ge 16 ] && echo true || echo false)"
echo "production hash check (the runbook's command):"
node -e 'const b=require("bcryptjs");const h=process.env.DEMO_PASSWORD_HASH;console.log({rawBcrypt:/^\$2[aby]\$\d\d\$/.test(h),matchesDisplayedPassword:b.compareSync(process.env.DEMO_PASSWORD_DISPLAY,h)})'

set -a; . "$D/preview.env"; set +a
echo "preview: session>=32: $([ ${#SESSION_SECRET} -ge 32 ] && echo true || echo false); reset>=16: $([ ${#RESET_SECRET} -ge 16 ] && echo true || echo false)"
echo "preview hash check:"
node -e 'const b=require("bcryptjs");const h=process.env.DEMO_PASSWORD_HASH;console.log({rawBcrypt:/^\$2[aby]\$\d\d\$/.test(h),matchesDisplayedPassword:b.compareSync(process.env.DEMO_PASSWORD_DISPLAY,h)})'
echo "distinct per scope: SESSION_SECRET $([ "$P_SESSION" != "$SESSION_SECRET" ] && echo true || echo false); RESET_SECRET $([ "$P_RESET" != "$RESET_SECRET" ] && echo true || echo false)"
echo "preview has no CRON_SECRET / WEBMCP_ORIGIN_TRIAL_TOKEN: $(grep -c '^CRON_SECRET=\|^WEBMCP_ORIGIN_TRIAL_TOKEN=' "$D/preview.env" | sed 's/^0$/true/;s/^[1-9].*/false/')"
