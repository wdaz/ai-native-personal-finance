#!/bin/sh
# T-14 6.5: cookie-less fetch of every segment form of /overview, marker = the formatted seed balance.
# Usage: sh td14-segments.sh <base-url> [signed]
set -eu
BASE=${1:?base url}
SIGNED=${2:-}
T=/Users/ruslan/.claude/jobs/73df9ce2/tmp
for p in \
  /overview.segments/_full.segment.rsc \
  /overview.segments/_head.segment.rsc \
  /overview.segments/_index.segment.rsc \
  /overview.segments/__PAGE__.segment.rsc \
  /overview.segments/overview/__PAGE__.segment.rsc \
  '/overview.segments/(app)/overview/__PAGE__.segment.rsc' \
  '/overview.segments/(app)/__PAGE__.segment.rsc' \
  ; do
  MARKER='$4,836.00' sh "$T/td14-get.sh" "$BASE" "$p" $SIGNED
done
