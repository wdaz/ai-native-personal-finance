# Rules for every T-03 implementer (binding — read before any command)

Working directory: `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain`
(a git worktree on branch `task/T-03-domain`). Run every command from there. Never `cd` to the
main checkout.

## Governance v1.2 (docs/04-process/governance.md), verbatim

- "Any subagent that touches git identity, `.git/config` or hooks stops and reports instead."
- "**Implementer subagents** (those with write tools) never run commands that rewrite the whole
  working tree or shared git state: `git checkout <rev> -- .`, `git reset --hard`,
  `git stash`, `git clean`, argument-less `npm install` (its `prepare` writes git
  configuration). Scoped edits and scoped `git add` only."
- "**Reported output is copied from the run, never from the brief.**" Every count, exit code
  and error you report is pasted from the command you ran. If a result differs from the brief's
  *Expected*, report the real result and say it differs.
- "**Plans mark predictions.**" An Expected line marked *prediction* is verified by your run.

Also: do not install, add or upgrade any dependency (no task in T-03 does). Do not push. Do not
open PRs. Do not touch files outside your task's **Files** list; if you think you must, stop and
report NEEDS_CONTEXT.

## Committing

- Commit exactly as the brief says, with the `GITLEAKS_CACHE_DIR` prefix, **never**
  `--no-verify`. If the pre-commit hook fails, stop and report the hook output — do not bypass.
- Every commit message ends with an attribution trailer as a second `-m`. If your own session
  gives you attribution lines (a system reminder naming your model), use those — they name the
  model that actually wrote the commit. Otherwise use this form:

```bash
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit \
  -m "<subject from the brief>" \
  -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa"
```

- `git add` only the paths the brief names.

## Prettier

After any `npx prettier --write`, run `npx prettier --check` on the same paths again before
committing — one file in the prototype needed a second `--write` to settle.

## No subagents

Do all of this task's work yourself. Never spawn a subagent — not a helper, never a reviewer.
Review is scheduled by the controller after you report.

## Report

Write the full report to the report file named in your dispatch: what you implemented; each
command you ran with its real output (the relevant lines); TDD evidence (RED: command + failing
output + why expected; GREEN: command + passing output); files changed; commits (short SHA +
subject); self-review findings; concerns. Then reply with ONLY (under 15 lines): Status
(DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits, a one-line test summary,
concerns, the report path.

Report hygiene (from Task 1's review): paste output lines literally — for a command that prints
nothing, write `exit 0, no output` rather than a paraphrase; state test counts plainly as
"new tests per file = N, total before → after", checked against the file you wrote, with no
corrections left mid-sentence. The report is copied into the project's process record.

If review findings come back later, fix them, re-run the covering tests, and **append** a fix
report (changes, covering tests, command, output) to the same report file.
