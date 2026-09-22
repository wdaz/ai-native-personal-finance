#!/bin/sh
# The two secret scans of T-02a (NFR-S5), with the flags in one place.
#
#   secret-scan.sh history   every commit of the repository in the current directory:
#                            the CI `secret scan` job and `npm run secrets:scan`
#   secret-scan.sh staged    the staged changes only: the pre-commit hook
#
# The repository scanned is the working directory's; the config is always this
# repository's .gitleaks.toml. Output is redacted: CI logs are public once the repository
# is (T-16), and a log line must never be the leak.
set -eu

here="$(cd "$(dirname "$0")" && pwd)"
config="$(dirname "$here")/.gitleaks.toml"

case "${1:-}" in
  history)
    # A shallow clone has only the tip, so the scan below would pass on one commit and
    # say nothing. Stop instead: the CI checkout needs `fetch-depth: 0`.
    if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
      echo "secret-scan: this is a shallow clone; the history scan needs every commit (actions/checkout fetch-depth: 0)" >&2
      exit 2
    fi
    # Passing --log-opts replaces gitleaks' own `git log` options (`--full-history --all
    # --diff-filter=tuxdb`), so `--all` is restated; the other two only narrow the scan.
    # `-m` adds the merge commits, which `git log -p` otherwise prints without a diff: a
    # secret typed while resolving a conflict exists only there. Not `--first-parent`: it
    # skips a secret added and removed inside a merged branch, which was still pushed.
    exec "$here/gitleaks.sh" git --config "$config" --log-opts="--all -m" \
      --redact --no-banner --verbose .
    ;;
  staged)
    # `--log-level warn` keeps a clean commit silent; a finding is still printed (--verbose).
    exec "$here/gitleaks.sh" git --pre-commit --staged --config "$config" \
      --log-level warn --redact --no-banner --verbose .
    ;;
  *)
    echo "usage: secret-scan.sh history|staged" >&2
    exit 2
    ;;
esac
