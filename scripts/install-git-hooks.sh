#!/bin/sh
# Points git at the versioned hooks in scripts/git-hooks (T-02a). Run by `npm install` and
# `npm ci` through the `prepare` script; safe to re-run. Outside a git work tree (a build
# image without .git) there is nothing to configure, so it does nothing.
set -eu
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git config core.hooksPath scripts/git-hooks
fi
