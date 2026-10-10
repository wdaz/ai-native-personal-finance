#!/bin/sh
# Vercel's Ignored Build Step (vercel.json `ignoreCommand`; ADR-0007, amendment 2026-10-05, owner
# decision): skip the build of a commit that changes nothing outside docs/, on every branch,
# production (main) included. Tested by tests/unit/vercel-ignore-build.test.ts.
#
# Vercel's contract (vercel.com/docs/project-configuration/project-settings#ignored-build-step and
# vercel.com/docs/environment-variables/system-environment-variables, both read 2026-10-05):
# - exit 0 skips the build and sets the deployment to CANCELED; exit 1 builds;
# - VERCEL_GIT_PREVIOUS_SHA is the commit of the last *successful* deployment of this project and
#   branch, and is empty on a branch's first deployment;
# - the repository is a shallow clone, `git clone --depth=10`
#   (vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel, read 2026-10-05),
#   so the previous commit may be missing.
#
# The rule: build whenever unsure. Skip only when the previous commit is present and the diff from
# it to HEAD is non-empty and every changed path, before and after a move, is under docs/.
set -u

build() {
  echo "vercel-ignore-build: building: $1"
  exit 1
}

previous="${VERCEL_GIT_PREVIOUS_SHA:-}"

[ -n "$previous" ] || build "no previous successful deployment of this branch (VERCEL_GIT_PREVIOUS_SHA is empty)"

# A full lowercase SHA only: nothing else (a ref name, an option) reaches git below.
case "$previous" in
  *[!0-9a-f]*) build "VERCEL_GIT_PREVIOUS_SHA is not a commit SHA" ;;
esac
[ "${#previous}" -eq 40 ] || build "VERCEL_GIT_PREVIOUS_SHA is not a full commit SHA"

git cat-file -e "${previous}^{commit}" 2>/dev/null ||
  build "the previous deployment's commit $previous is not in this clone"

# --no-renames lists a move as a deletion and an addition, so a file moved from src/ into docs/
# still names its src/ path.
changed=$(git diff --no-renames --name-only "$previous" HEAD --) ||
  build "git diff from $previous failed"

[ -n "$changed" ] || build "nothing changed since $previous (a redeploy)"

# A path git quotes (unusual characters) starts with '"', not docs/, and so counts as outside.
outside=$(printf '%s\n' "$changed" | grep -v '^docs/')
[ -z "$outside" ] || build "changed outside docs/ since $previous: $(printf '%s' "$outside" | head -n 5 | tr '\n' ' ')"

echo "vercel-ignore-build: skipping: only docs/ changed since $previous"
exit 0
