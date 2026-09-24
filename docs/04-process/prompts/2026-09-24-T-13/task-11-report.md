# T-13 Task 11 report: records

Worktree `.claude/worktrees/t-13-ci-hardening`, branch `task/T-13-ci-hardening`, base `ccc71d0`.
Documents task: nothing marked Approved/Accepted by me; the ADR-0003 clarification stays "Proposed".

## What was done

- **Overrides note** (`package.json`, second `"//"` line): the brief's text, with "(owner: T-16)".
  Re-measured first (below).
- **README.md:** rows for `npm run test:coverage` and `npm run traceability` (both commands verified
  against `package.json`; Task 3 had not added a `traceability` row; `db:drift` was already there and
  not duplicated). Two lines that Tasks 2, 3 and 10 had made false were also fixed (deviation 1).
- **Backlog v1.22** (`docs/03-specs/backlog.md`): status-line entry, changelog line, hand-offs in the
  T-14, T-15 and T-16 rows. The dated "Open at v1.18" Notes line is untouched (TD-1/TD-5 precedent);
  the T-13 row is untouched.
  - T-14: npm >= 11.19 on Vercel, older npm only warns `Unknown project config`, read Vercel's
    install log; `fsevents` tolerated (measured on `node:26`, not on Vercel).
  - T-15: the T-12 DoD gap (all three engines in the PR), `json-summary` for hidden 100 % files, the
    fixture-config way to prove a threshold, the review-defect counts (8 of the 9 reviewed tasks).
  - T-16: the required checks (`E2E (Chromium, polyfill)`, `E2E (Chromium, off)`, `E2E (Firefox,
    polyfill)`, `E2E (WebKit, polyfill)`, `lint · typecheck · unit`, `API tests (Postgres)`,
    `secret scan`; `npm audit` non-blocking), the overrides removal (owner: T-16) with the recipe,
    and the four "first CI run must show" items (Linux legs; no `Unknown project config` + case 2 of
    `install-scripts.test.ts` on the runner; concurrency behaviour; the read-only token).
- **Tech debt v1.9** (`docs/03-specs/tech-debt.md`): the TD-4 evidence line now says "the
  network-failure `submitRef.current?.focus()` (line 78) deleted and the 401-vs-other ternary (line
  94, which serves the 429) made `passwordRef : passwordRef`" (lines verified in
  `app/(auth)/login/LoginForm.tsx`; `SignupForm.tsx:71` also checked); the "CI runs Chromium only
  until T-13" sentence keeps its text and gains a dated update clause (Firefox and WebKit run in CI
  since Task 10; Linux confirmed by the first CI run); "the PR number is added when it is opened"
  kept as is; status line bumped to v1.9 in the v1.8 format. No other TD entry touched.
- **Process log:** a new entry "2026-09-24 — Phase 5: T-13 CI hardening — execution", appended after
  PR-A's (which is already on this branch via the rebase). Rebased SHAs by subject from
  `git log origin/main..HEAD`. It states that the planning entry and the plan file are on the plan
  branch and will be updated in a separate docs PR.
- **Prompts** (precedent followed: T-02a — a sibling file `prompts/2026-09-24-T-13.md` plus a folder
  `prompts/2026-09-24-T-13/` with a `README.md` index and the briefs and reports; T-12 saved only a
  sibling file). Copied: `task-1..11-brief.md` (11), `task-1..10-report.md` (10), `pr-a-brief.md`,
  `pra-a1/a2/a3-report.md`, and this report after it was written. Not copied: `progress.md`,
  `preflight.md`, the two `review-*.diff`, `plan-path` (the brief said briefs and reports only; the
  T-02a precedent did copy its ledger, so this is a difference the controller may want to reverse:
  both files stay in the git-ignored session directory). Size added: about 214 KB of copies (well
  under the 600 KB limit) plus the index, README and this report.

## Overrides re-measurement (real)

Scratch copy in `/Users/ruslan/.claude/jobs/fbf96237/tmp/overrides/` (package.json, package-lock.json,
.npmrc; nothing in the repo touched): both overrides removed, then
`npm --prefix <scratch> install --package-lock-only --ignore-scripts` ("up to date, audited 618
packages … 4 high severity vulnerabilities"), then `npm audit --audit-level=high` (exit 1):
**4 high** — `deepmerge-ts` < 8.0.0 (GHSA-ggr8-5vv4-36mx, at
`node_modules/@prisma/config/node_modules/deepmerge-ts`) and `mysql2` <= 3.23.0 (GHSA-3f6p-5ww8-9rcr,
GHSA-rgwj-5xj2-c3m3, at `node_modules/prisma/node_modules/mysql2`). The scratch lockfile holds
`deepmerge-ts` 7.1.5 and `mysql2` 3.15.3, so the count is not vacuous (npm did not carry the
override versions over). `npm view prisma versions`: the newest stable 7.x is 7.10.0; the `latest`
dist-tag is `8.0.0-rc.15` (a release candidate), `prev` is 7.10.0. The note's "4 high" therefore
stands as the brief wrote it.

## Verification (real, from the run)

On `ccc71d0` plus this task's uncommitted edits; Postgres up (compose, healthy), port 3000 free
before the run (`lsof -i :3000` empty):

- `npm run test:all` exit 0: secret scan 337 commits, no leaks (diffs) and no leaks (messages, labelled
  in the output); lint, format:check, typecheck clean; unit + coverage 77 files / 958 tests, statements
  99.5 % (401/403); traceability "all 18 Release 1 stories are named in a test title"; API 100 passed;
  E2E 327 passed, 24 skipped (351 runs = 117 per engine x 3, 8 skipped per engine), 0 failed.
- `npm audit --audit-level=high`: found 0 vulnerabilities.
- actionlint (`rhysd/actionlint:latest`, script in the job tmp dir): empty output, `exit=0`.
- Separately, after the last document edit: `npm run typecheck`, `npm run lint`, `npm run format:check`
  ("All matched files use Prettier code style!"), `npm test` (77 files, 958 tests), `npm run
  traceability` (18/18) all clean/passing.

## Deviations

1. README: two extra lines updated that the brief did not list: the `test:all` comment (line 57 now
   names coverage and traceability) and the `test:e2e` row ("CI runs Chromium" -> "CI runs all
   three"). Same defect class as Task 8's Important finding (a doc that says the opposite of what
   shipped).
2. Process log: a new execution entry instead of completing the planning entry (controller ruling 1);
   the plan file was not edited.
3. Prompts: the ledger and the pre-flight scan were not copied (see above).
4. The count "eight of nine tasks reviewed" is mine, from the ledger: Tasks 2-8 each got a follow-up
   commit, Task 9's wording defect was fixed here, Task 1 was clean (one deferred minor), Task 10's
   review was pending. The controller's "8 of 10" is not what the ledger supports yet.

## Could not verify

- Any CI verdict (no PR; the branch is pushed); Linux Firefox/WebKit; the runner's or Vercel's npm.
- Task 10's review verdict (pending when written).
- The owner's verbatim answers to Q1, Q3-Q8: the entry uses the controller's relay and marks Q4, Q5,
  Q7, Q8 as "recommended, then start" per the ledger; only Q2 is quoted verbatim (from the PR-A entry).
- The controller's model and any owner wording of the execution go-ahead beyond the ledger's summary.
- The process-log entry says the branch is "pushed, no PR open": true per the ledger, not re-checked
  against GitHub.

## Fix wave (after the whole-branch review)

Commit `bb059dc` `docs(process): correct the T-13 records after the whole-branch review` (earlier
commits not amended). Line numbers were re-read from the files before each edit.

- **I-1 (a) counts.** Recounted against the ledger and `git log`: all ten task reviews found
  something; Tasks 2-8 and 10 (`c8cf471`) got follow-up commits, Task 9's wording was fixed in Task 11,
  Task 1's `persist-credentials` minor was deferred, so nine led to a fix. The ledger agrees with the
  controller's text; the process-log "Counts" paragraph and the T-15 hand-off in `backlog.md` now say
  so, and "Task 10's review verdict" is gone from "Not verified" (the sentence reads well without it).
  This corrects my own earlier "8 of 9" (Task 10's review was finished by then).
- **I-1 (b)** `git log --oneline origin/main..HEAD` gives 20 commits before Task 11's first commit
  (19 + `c8cf471`); "20 commits precede", Task 10 is `ccc71d0`, `c8cf471`, Task 11 follows `c8cf471`;
  the "Task 10's own wording" bullet was added with the controller's text.
- **I-1 (c)** "scoped re-review" claim corrected in the process-log Participants line and in
  `prompts/2026-09-24-T-13.md`: only Task 3's two fix rounds had one (ledger lines for `rereview-t13-3`
  and `rereview-t13-3b`; no other T-13 task had a scoped re-review).
- **I-1 (d)** "except the two cases under 'Not shown failing' below".
- **M-1** the Linux Docker check also passed the flag on the command line; added with the case-2 pointer.
- **M-2** "Task 3 assumed 875; it was 878 after Task 2's follow-up (888 after its own 10)".
- **M-3** the reviewer's `secrets:scan` at `94b7c3a` (340 commits, no leaks) is in the entry, attributed
  to the whole-branch reviewer. My own runs: at `94b7c3a` 340 commits, no leaks (diffs and messages);
  after `bb059dc` 341 commits, no leaks (diffs 10.93 MB, messages 159.98 KB).
- **M-4** Task 5's accepted deviation (stale fixture built from the DoD) added to the entry.
- **M-5** README `db:drift` row padded and closed with ` |` (checked: same length as the other ASCII rows).
- **M-6** `tests/fixtures/README.md` names `listedWithoutPage` (`04dc381`, unchanged by the rebase).
- **M-7** `tests/api/README.md` names the `LoginAttempt`-dropped fixture.
- **First-CI-run risks 1-3** added to the T-16 hand-off in `backlog.md` as items (5)-(7) and to the
  entry's "Not verified": Chromium-off never ran the new specs (only Firefox off measured, 106/11/0),
  the drift spec first meets the CI Postgres service container, the message scan reads every ref.
  Item 3 was checked against `scripts/secret-scan.sh` (`git log --all`, tags via `for-each-ref`);
  `postgres:18.6-alpine` is the image of the `api` and `e2e` service containers in `ci.yml` (lines 56
  and 125) and of the local compose database, so the difference is the container, not the version.
- **Verified-section wording:** the entry now says `c8cf471` (committed 19:17:01) may or may not have
  been in the tree the `test:all` run started from; the run's secret-scan output is stamped 7:17PM.
  `format:check` and actionlint were re-run afterwards, at the final head.
- **Not done, as ruled:** M-8 — a blank line between the T-15 and T-16 rows of `backlog.md`
  (line 80 now; it existed before this task) breaks the table so T-16 renders as text; a separate small
  PR. M-9 is the controller's.
- **Checks after the commit (each its own command):** `npm run secrets:scan` clean (above),
  `npm run format:check` "All matched files use Prettier code style!" (before the commit; only the
  report copy changed after), `npm run typecheck` clean, actionlint `exit=0`.
- The copy of this report in `docs/04-process/prompts/2026-09-24-T-13/task-11-report.md` was
  refreshed to this text in a follow-up commit.
