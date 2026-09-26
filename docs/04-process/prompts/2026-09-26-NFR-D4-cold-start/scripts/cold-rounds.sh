#!/bin/sh
# NFR-D4 cold-start measurement: three rounds, 10 minutes idle before each.
# Public URL, GET only, no credentials. Output: one line per request.
# Usage: sh cold-rounds.sh [output-file]     (BASE overrides the URL)
BASE=${BASE:-https://personal-finance-cyan-kappa.vercel.app}
OUT=${1:-cold-rounds.txt}
: > "$OUT"

probe() {
  # $1 = round, $2 = path
  curl -s -o /dev/null -w "round=$1 path=$2 http=%{http_code} connect=%{time_connect}s ttfb=%{time_starttransfer}s total=%{time_total}s\n" "$BASE$2" >> "$OUT"
}

for round in 1 2 3; do
  sleep 600
  echo "round=$round start=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$OUT"
  if [ "$round" = "2" ]; then
    probe $round /api/meta
    probe $round /login
    probe $round /api/meta
  else
    probe $round /login
    probe $round /api/meta
    probe $round /login
  fi
done
echo "done=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$OUT"
