#!/bin/sh
# Prints ONLY the origin, feature and expiry date encoded in the origin-trial token (its payload is not secret: it is
# printed into every page). Never prints the token.
set -eu
D="$HOME/.config/personal-finance-deploy"
set -a; . "$D/production.env"; set +a
node -e '
const t = process.env.WEBMCP_ORIGIN_TRIAL_TOKEN || "";
if (!t) { console.log("no token in production.env"); process.exit(1); }
const b = Buffer.from(t, "base64");
const len = b.readUInt32BE(65);
const p = JSON.parse(b.subarray(69, 69 + len).toString("utf8"));
console.log(JSON.stringify({ version: b[0], origin: p.origin, feature: p.feature, isSubdomain: !!p.isSubdomain, expiry: new Date(p.expiry * 1000).toISOString() }));
'
