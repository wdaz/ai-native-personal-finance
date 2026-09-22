# T-02a secret guard — final whole-branch review

Range: `d6d398d..4a1276b` (10 commits, 39 files) · Branch: `task/T-02a-secret-guard` · Date: 2026-09-22
Reviewer: final whole-branch review (Opus 5). Read-only on the checkout. Every claim below that says
"measured" was run in `final-scratch/` against copies of the shipped scripts, config and cached
gitleaks 8.30.1 binary, and can be re-run with:

- `sh final-scratch/probe.sh <case>`: adversarial probes. Cases: `enc msg allow color merges failclosed seq paths norepo colorhist flags logcfg colorout cleanup errors`.
- `sh final-scratch/suite.sh baseline|failopen|newtests|fixed|failopennew`: builds a scratch
  repository holding the guard and runs the real `tests/unit/secret-guard.test.ts` with the
  repository's own Vitest.
- `final-scratch/fixed/`: prototypes of the fixes proposed below (`secret-scan.sh`,
  `.gitleaks.toml`, the test file with six added tests). These are evidence that the fixes work.
  They are not code to paste in blindly.

The scratch repositories held materialised fake credentials. They were deleted at the end of the
review (`.superpowers/sdd/` is git-ignored in any case, and `git status` stayed clean throughout).

---

## Strengths

- **Premises were measured before anything was built.** E2 shows the default rules miss both URI
  forms, E3–E5 show the default `gitleaks git` skips merge commits and `--first-parent` misses a
  branch's add-then-remove, and E7 shows a shallow clone passes silently. The invocation in
  `secret-scan.sh` follows from those measurements, and the comments say why.
- **The fixture design is correct and clever.** The `{{…}}` placeholders keep every committed byte
  undetectable without opening a path allowlist on the test folder. The committed fixtures serve as
  a control for the placeholder allowlist, and the materialised ones fire on all 7 lines while all
  10 controls stay silent. I re-measured this.
- **The wrapper is careful.** It pins the version and a SHA-256 per platform, downloads next to the
  final location and renames atomically, and exits 2 on a checksum mismatch or an unsupported
  platform. It also fails closed when `sha256sum` and `shasum` are both missing, because an empty
  `actual` never equals the pin. On a mismatch the trap removes `.download.*`; I measured this, and
  only the empty `8.30.1/` directory remains.
- **The hook fails closed today.** With a dead mirror and an empty cache, the commit is blocked with
  the curl error and the D10 message, and no commit is written (measured). It also blocks a leak on
  an initial commit, on `git commit -a` and on `git commit -- <path>` (measured).
- **The CI job is minimal.** It has no Node step and no `npm ci`, uses `fetch-depth: 0` and
  `persist-credentials: false`, runs the script directly, and fails on the exit code. The
  `npm audit` job follows the owner's non-blocking decision exactly.
- **The discipline is visible.** There are mutation tables per task, a ledger with a cost-if-wrong
  line for every ruling, the D10 plan-internal contradiction was caught and resolved in the
  decision's favour, and the process record is thorough.
- **Re-verified here:** 19/19 tests pass in a scratch copy. The shipped history scan of this
  repository reports 59 commits scanned and no leaks. The staged and history scans are unaffected
  by `diff.noprefix`, `diff.mnemonicPrefix`, `diff.external`, `diff.relative`, `diff.srcPrefix`,
  `core.quotePath`, `format.pretty`, `log.abbrevCommit`, `log.decorate`, `log.showSignature`,
  `core.abbrev`, `diff.renames`, `log.date` and `i18n.logOutputEncoding`.

---

## Issues

### Critical

**C1 — The developer's git config silently disables the hook and `npm run secrets:scan`**
(`scripts/secret-scan.sh:29-35`; plan-mandated, Task 2 Step 3).

gitleaks parses the text output of its own `git diff` / `git log -p`, and that output follows the
invoking user's git config. I measured two triggers:

| Config (local or global) | Scan | Result |
|---|---|---|
| `color.ui=always` or `color.diff=always` | `staged` (the hook) | rc 0 with **zero bytes of output** on a staged leak. The hook lets the commit through: commit rc 0, `rev-list --count HEAD` = 2 |
| `color.ui=always` or `color.diff=always` | `history` (`npm run secrets:scan`, the first step of `test:all`) | `0 commits scanned` · `no leaks found` · rc 0 |
| `log.diffMerges=combined` or `dense-combined` | `history` | rc 0 on the conflict-resolution leak (the E4 case, which `-m` exists to catch). `separate`, `first-parent` and `remerge` are still caught |

`-m` means `--diff-merges=on`, which reads `log.diffMerges`. So the one measurement that drove D6
depends on a config key the script does not control.

- **Scope:** CI is unaffected, because the runner is fresh and has no user config; PR #1's run
  scanned 59 commits. The owner's machine is also unaffected today: `git config --show-origin
  --get-regexp` finds no colour or `diffMerges` keys, only `core.hookspath`. Any other contributor,
  agent sandbox or future machine with forced colour gets a hook that never blocks and a local
  "no leaks found".
- **Why the tests cannot see it:** `testEnv` sets `GIT_CONFIG_GLOBAL=/dev/null` and no test sets a
  local colour key.
- **Fix:** in `secret-scan.sh`, export command-scope config, which outranks every config file:
  `GIT_CONFIG_COUNT=2`, `color.ui=never`, `color.diff=never`. Then replace `-m` with
  `--diff-merges=separate`, or add `log.diffMerges=separate` to the same variables; both are
  measured to work. Add two tests. The hook must block a staged leak with `color.ui=always`, and
  the history scan must find the merge-conflict leak with `log.diffMerges=dense-combined` plus
  `color.ui=always`. Both tests are red on the shipped script and green with the prototype.

### Important

**I1 — `--redact` prints most of a password that contains `@` once gitleaks percent-decodes it**
(`.gitleaks.toml:21`; plan-mandated, Task 1 Step 7).

Measured on fixture line 4 committed and scanned by `secret-scan.sh history`:

```
Finding:     const url = 'postgresql://app:{{PASSWORD}}@10.0.0.12/app';
Finding:     postgresql://app:{{PASSWORD}}@10.0.0.12      <- Tags: [decoded:percent]
```

gitleaks re-scans the decoded text `T3st@Only!N0tReal`. The password class `[^@/…]` stops at the
first `@`, so the "secret" is only `T3st`, and `Only!N0tReal` is matched as the host and printed in
clear.

- **Which claims this breaks:** D13, the `secret-scan.sh:9-10` header ("a log line must never be
  the leak"), and `ci.yml:52-53` ("output redacted").
- **Why the tests miss it:** the only redaction assertion (`secret-guard.test.ts:192`) checks
  `npg_T3stOnlyN0tReal` from line 1, which has no special characters. E9 measured the double report
  but not its redaction.
- **Why it is Important, not Critical:** detection still fires, so the job goes red. The production
  Neon password (`npg_` plus alphanumerics) is unaffected. And the log line only appears after the
  secret has been pushed, when it needs rotating anyway. But the log outlives any history rewrite
  and becomes public at T-16.
- **Fix:** let the password take `@` and keep it out of the host: password `([^/\s'"`]+)`, host
  `([^@/:?\s'"`]+)`. Then add a test that commits the whole materialised violations fixture and
  asserts that neither `N0tReal` nor `T3st` appears in the output. With the prototype, all 7
  violations are still reported, all 10 controls stay silent, and all 25 tests pass.
- **Residual:** a query string with `@localhost` after a remote host would now be read as local.
  That case is contrived; say so in the config comment.

**I2 — `secret-scan.sh history` outside a git work tree says "no leaks found" and exits 0**
(`scripts/secret-scan.sh:20`; plan-mandated, Task 2 Step 3).

Measured output: `fatal: not a git repository`, then `ERR error="stderr is not empty"`, then
`0 commits scanned`, then `no leaks found`, with **rc 0**. gitleaks also exits 0 on an invalid
`--log-opts`.

The Task 2 deferred Minor says this case "falls through to gitleaks' own error". It does not. It
falls through to a pass, so the ledger mis-describes it.

- **Failure scenario:** `actions/checkout` falls back to downloading a REST API tarball when git
  2.18 or later is not on `PATH`, for example on a self-hosted runner or in a container job. The
  checkout then has no `.git`, and the `secret scan` check is green having scanned nothing. That is
  the same silent pass E7 guarded against for shallow clones.
- **Fix:** add `git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "secret-scan: not
  inside a git work tree" >&2; exit 2; }` before the shallow check. Test it with
  `GIT_CEILING_DIRECTORIES`, expecting status 2. Prototyped: the test is red on the shipped script
  and green with the fix.

**I3 — D10's fail-closed guarantee has no test that can fail**
(`tests/unit/secret-guard.test.ts:253-295`; plan-mandated, D10 and Appendix A).

I wrote a hook that blocks only on rc 1 and lets a tool failure through, which is exactly the
"warn and let the commit through" alternative D10 rejects. **It passes all 19 tests** (measured
with `suite.sh failopen`).

The ledger's Task 3 "⚠️ resolved (a)" argues that every "cannot run" path exits non-zero, but
argues it without a test. DoD v1.1 says a guarantee is not verified until it has failed on
purpose. The argument is also incomplete: see C1 and I2, where gitleaks "runs" and exits 0.

- **Fix:** add a test, "blocks the commit when gitleaks cannot run". Commit from a hooked repo with
  `GITLEAKS_CACHE_DIR=scratch()` and `GITLEAKS_BASE_URL=file://<empty scratch>`, then expect a
  non-zero status, `commit blocked` on stderr, and no `HEAD`. It is green on the shipped hook and
  red on the mutant (`suite.sh failopennew`).

**I4 — Commit messages and tag messages are never scanned**
(`scripts/secret-scan.sh:29`, `tests/fixtures/secret-scan/README.md:56`, `README.md:74`; a gap in
the plan, not plan-mandated).

Measured: a leak that exists only in a commit message gives rc 0, and so does a leak only in an
annotated tag's message. `gitleaks git` reads diffs only.

Neither the backlog row nor the plan claims message coverage. But `README.md:74` says "Gitleaks
over every commit", and T-16 will make this check its full-history gate before the repository goes
public. In this repository agents write long commit messages that quote measurements, and E18
records an agent already writing a URI with a password into a document once.

- **Required before merge:** state the limitation. Add "commit and tag messages" to the fixture
  README's "Not covered" section and one clause to `scripts/README.md`.
- **Owner decision (scope beyond the backlog row):** add a second pass that feeds
  `git log --all --format=%B` plus the tag contents through `gitleaks stdin` with the same config
  and `--redact`. Prototyped: on this repository's 59 commits and about 29 KB of messages it
  reports no leaks, so no false positives. Its test is red on the shipped script and green with
  it. If the owner declines, T-16's scan wording should say messages are covered by rotation, not
  by the scan.

### Minor

**M1 — Two process-log claims are inaccurate** (`docs/04-process/process-log.md:477`, `:482`).

- "19 tests, each guarantee mutation-checked" is false. D10 (I3) and the redaction of encoded
  passwords (I1) were never made to fail.
- "One fix round (Task 3)" contradicts the session record. Task 1 also had fix round 1, a
  verification-only round with no code (`task-1-rereview-1.md`, and the session README's "one fix
  round on the rereview").
- **Fix:** after the fixes land, reword to "N tests; each mutation listed in the PR body turned a
  test red" and "two fix rounds (Task 1 verification only; Task 3)". Update the test count in the
  PR body too. Record the deviations from Appendix A in the process log and ledger, as was done
  for Task 3, and do not rewrite the plan.

**M2 — Security claim: "checked … before it is ever executed"** (`scripts/gitleaks.sh:3-4`,
`scripts/README.md:21`; plan-mandated text; Task 1 deferred Minor).

A binary already in `node_modules/.cache/gitleaks/8.30.1/` is executed without any re-check. So
anything that can write to `node_modules` (a dependency's code during `lint` or `test`) can plant
a binary that always exits 0, and every later hook run uses it. CI is not exposed, because the
job has no `node_modules` and always downloads.

- **Fix:** reword to "checked once, when downloaded; a cached binary is trusted". A stronger
  alternative is to pin the extracted binary's hash and check it on each run (about 50 ms).

**M3 — The hook does not run for commits git writes itself** (`README.md:60`; plan-mandated text,
Task 4 Step 3).

Measured: resolving a rebase conflict with a leak and running `git rebase --continue` commits it
with the hook installed (rc 0, leak in the tip). `README.md:60` says the hook "blocks a commit
that contains a secret". CI catches it after push.

- **Fix:** one clause, "on `git commit`; commits written by `git rebase`/`cherry-pick` skip it, CI
  does not". While there, `README.md:62` says "a network connection once"; it is once per
  `npm ci`, which wipes the cache (D12).

**M4 — The session record is incomplete** (`docs/04-process/prompts/2026-09-22-T-02a/README.md:18`,
`:33-40`).

- The folder has no `task-5-review.md`.
- Its `progress.md` ends five lines before the live ledger: the Task 5 review, the deferred
  Minor, the ⚠️ line, completion and "Final review: next".
- The README lists only two deliberate absences, and says "Sonnet for the Task 2–4 reviews", but
  Task 5 was also reviewed by Sonnet.
- **Fix:** the final dispatch (ruling P4) copies `task-5-review.md`, this `final-review.md` and the
  final `progress.md`, and corrects that line.

---

## Deferred-minor triage (every `minor (deferred)` line in the ledger)

| # | Deferred minor | Verdict | Reason |
|---|---|---|---|
| 1 | Task 1: `parseReport` gives a bare `SyntaxError` and drops stderr when gitleaks exits 1 on a fatal error (measured: missing config gives rc 1 and 0 bytes on stdout) | defer | Diagnostics only. The test still goes red, just with a worse message. Fold it in the next time the test file is touched |
| 2 | Task 1: the checksum test asserts only that `<cache>/8.30.1/gitleaks` is absent, not that `.download.*` was removed | defer | Measured: the EXIT trap does remove `.download.*`, leaving only an empty `8.30.1/`. The behaviour is right; only the assertion is narrow |
| 3 | Task 1: `(?:^|/)` in the path allowlist also exempts nested copies | defer | Measured in git mode: `src/.next/x.ts` and `tests/docs/00-discovery/inputs/n.md` are exempt. Anchoring with `^` would break the dir-mode test, which sees absolute paths. The risk is low: nested `.next/` is git-ignored build output, and a nested inputs copy is unlikely. Add a one-line comment to `.gitleaks.toml` in the same edit as I1 |
| 4 | Task 1: the `gitleaks.sh` header says the SHA-256 is checked "before it is ever executed" | **fix-before-merge** | It is a security claim, false for a cached binary, and repeated in `scripts/README.md:21`. The fix is a one-line reword (M2) |
| 5 | Task 1: extra Sonnet `Co-Authored-By` trailer on 17d4543 | defer | The ruling stands (accurate attribution). Nothing to do |
| 6 | Task 2: the shallow guard outside a work tree "falls through to gitleaks' own error" | **fix-before-merge** | Mis-described. It falls through to rc 0 and "no leaks found" (I2). The fix is one guard and one test |
| 7 | Task 4: the `npm audit` annotation says "advisories found" when `npm audit` itself fails | defer | This is the owner's non-blocking design. On a tool error the warning is misworded but not silent, and the step log shows npm's error. Optionally word it "npm audit failed or found advisories" |
| 8 | Task 5: `pr-body.md` says "`npm run test:all` green locally", but the last full run was 77f0d24 | **fix-before-merge** | Re-run `npm run test:all` at the final head, after this review's fixes, before `gh pr ready`, and update the test counts in the PR body |

## Rulings

Every `Ruling:` line in the ledger holds: P1–P7; Task 1's Step 10 substitute and trailer; Task 2's
"43 of 49"; Task 3's "the finding stands".

- **P5 / D9, for information:** `core.hooksPath=scripts/git-hooks` now sits in the shared
  `.git/config` (confirmed). The owner's main checkout on `main` therefore points at a directory
  that does not exist there, so it has no hook, and any `.git/hooks/*` are ignored, until the
  merge. This is owner-approved.
- **Not a ruling, but disputed:** Task 3's "⚠️ resolved (a) non-zero exit in every 'cannot run'
  path" was reasoned, not tested, and is untrue as a general statement. It is addressed by I3, with
  C1 and I2 as counterexamples.

## Recommendations

1. **Apply C1, I1, I2 and I3 together.** They touch `scripts/secret-scan.sh`, one regex in
   `.gitleaks.toml`, and add five tests to `tests/unit/secret-guard.test.ts`. The prototype in
   `final-scratch/fixed/` also carries the I4 second pass and its test, and passes 25/25. Six new tests are red on the fail-open mutant, and five are
   red on the shipped code; the sixth, the D10 test, is green there because the shipped hook is
   correct. For each change, run the mutation it guards, as the plan's tables do.
2. **I4:** the documentation now. The second pass over messages is the owner's call; it is cheap
   and measured clean on this repository.
3. **In-band bypasses, for T-16.** An inline `gitleaks:allow` and a `.gitleaksignore` fingerprint
   each silence the CI gate (measured rc 0 for both). A PR can also edit `.gitleaks.toml` or
   `scripts/secret-scan.sh` and pass its own check. All of these need intent, but agents under
   pressure to go green are exactly that intent. Two options:
   - add `--ignore-gitleaks-allow` to the history scan (measured: rc 1 with it), so false
     positives must go through the reviewed config;
   - list these five paths as owner-review items: CODEOWNERS, or the `main` ruleset in T-16.
4. **For T-13:** add workflow-level `permissions: contents: read`. The new jobs run code from the PR
   and need no token.
5. **Process lesson for the log.** C1, I1, I2 and I3 are all in plan text that was assembled and
   measured in a scratch copy (E17), but measured only under a neutral git config
   (`GIT_CONFIG_GLOBAL=/dev/null`) and only against the one fixture line with no special
   characters. The evidence proved what it measured, and the harness hid the environment the hook
   actually runs in.

## Assessment

**Ready to merge: With fixes.**

The core guarantee is sound and well evidenced. On a clean runner, the rule catches the URI forms
the default rules miss, the history scan reads merges and deleted branches, the checksum wrapper
fails closed, and the CI gate is correct today.

What must change before merge is small, localised and already prototyped:

- C1: pin colour and `diffMerges` for the scans;
- I1: the regex, so redaction holds for `@` in a password;
- I2: the work-tree guard;
- I3: the fail-closed test;
- I4: the documentation line, with the second pass left to the owner;
- M2: the reword;
- a fresh `npm run test:all` at the final head, with the counts updated in the PR body and the
  process log (M1).

The rest can follow the merge. None of it needs a redesign, and none of it contradicts an owner
decision.
