#!/bin/sh
# The two secret scans of T-02a (NFR-S5), with the flags in one place.
#
#   secret-scan.sh history   every commit of the repository in the current directory, and
#                            every commit and tag message:
#                            the CI `secret scan` job and `npm run secrets:scan`
#   secret-scan.sh staged    the staged changes only: the pre-commit hook
#
# The repository scanned is the working directory's; the config is always this
# repository's .gitleaks.toml. Output is redacted: CI logs are public once the repository
# is (T-16), and a log line must never be the leak.
set -eu

here="$(cd "$(dirname "$0")" && pwd)"
config="$(dirname "$here")/.gitleaks.toml"

# gitleaks parses the text output of its own `git log -p` / `git diff`, and that output
# follows the invoking user's git config: with `color.ui=always` or `color.diff=always` it
# is ANSI text, and both scans then pass having read nothing (measured in the T-02a final
# review: no output at all on a staged leak, "0 commits scanned" on a history). Config
# given on the command scope outranks every config file, so both keys are pinned here.
export GIT_CONFIG_COUNT=2
export GIT_CONFIG_KEY_0=color.ui GIT_CONFIG_VALUE_0=never
export GIT_CONFIG_KEY_1=color.diff GIT_CONFIG_VALUE_1=never

case "${1:-}" in
  history)
    # Outside a git work tree gitleaks prints "no leaks found" and exits 0 having scanned
    # nothing (for example an actions/checkout tarball fallback, which has no .git). Stop.
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo "secret-scan: not inside a git work tree; nothing to scan" >&2
      exit 2
    fi
    # A shallow clone has only the tip, so the scan below would pass on one commit and
    # say nothing. Stop instead: the CI checkout needs `fetch-depth: 0`.
    if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
      echo "secret-scan: this is a shallow clone; the history scan needs every commit (actions/checkout fetch-depth: 0)" >&2
      exit 2
    fi
    # Passing --log-opts replaces gitleaks' own `git log` options (`--full-history --all
    # --diff-filter=tuxdb`), so `--all` is restated; the other two only narrow the scan.
    # `--diff-merges=separate` adds the merge commits, which `git log -p` otherwise prints
    # without a diff: a secret typed while resolving a conflict exists only there. Not `-m`:
    # it means `--diff-merges=on`, which follows `log.diffMerges`, and `combined` or
    # `dense-combined` there hide a conflict resolution from the parser. Not
    # `--first-parent`: it skips a secret added and removed inside a merged branch, which
    # was still pushed.
    # Each scan's own exit status is kept (1 is a finding, anything else is the tool failing,
    # which gitleaks.sh explains on stderr); the first failure wins and both always run.
    status=0
    echo "secret-scan: commit diffs" >&2
    "$here/gitleaks.sh" git --config "$config" --log-opts="--all --diff-merges=separate" \
      --redact --no-banner --verbose . || status=$?
    # T-13: commit and annotated-tag messages are text the scan above never reads, and a
    # connection string pasted into one is as public as one in a file (T-02a's documented
    # limitation; the pass measured clean on this repository and failing on a leaky message,
    # 2026-09-24). Both scans always run, so one finding never hides the other.
    messages="$(mktemp)"
    trap 'rm -f "$messages"' EXIT
    git log --all --format='%B' >"$messages"
    git for-each-ref refs/tags --format='%(contents)' >>"$messages"
    echo "secret-scan: commit and tag messages" >&2
    "$here/gitleaks.sh" stdin --config "$config" --redact --no-banner --verbose \
      <"$messages" || { rc=$?; [ "$status" -ne 0 ] || status=$rc; }
    exit "$status"
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
