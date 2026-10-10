#!/bin/sh
# The head-branch check behind main's required `release source` status (governance.md, "Branches and
# releases", T-15b): main takes pull requests only from this repository's develop (a release) or a
# hotfix/<name>-main branch (a fix already merged into develop, cherry-picked onto a branch from main).
# .github/workflows/release-source.yml passes the pull request's head branch, its repository and this
# repository from the event; nothing here reads git. Tested by tests/unit/release-source.test.ts.
set -eu
: "${HEAD_REF:?HEAD_REF is not set}" "${HEAD_REPO:?HEAD_REPO is not set}" "${BASE_REPO:?BASE_REPO is not set}"

# A fork can name its branch develop.
if [ "$HEAD_REPO" != "$BASE_REPO" ]; then
  echo "release-source: '$HEAD_REF' is a branch of $HEAD_REPO, not of $BASE_REPO; main takes pull requests only from this repository's develop or a hotfix/<name>-main branch (governance.md, Branches and releases)" >&2
  exit 1
fi

case "$HEAD_REF" in
  develop | hotfix/?*-main)
    echo "release-source: '$HEAD_REF' may open a pull request to main"
    exit 0
    ;;
esac

echo "release-source: '$HEAD_REF' may not open a pull request to main; only develop (a release) or a hotfix/<name>-main branch (a fix from develop, cherry-picked onto main) may (governance.md, Branches and releases)" >&2
exit 1
