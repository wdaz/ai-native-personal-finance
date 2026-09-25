## Task 6: the layer READMEs and the records — tech debt, backlog, spec, process log

**Files:**

- Modify: `tests/unit/README.md`, `tests/fixtures/README.md`, `src/shared/README.md` (Step 1 —
  T-13's review raised "docs out of sync" as an Important finding; these three list each task's
  tests, fixtures and modules)
- Modify: `docs/03-specs/tech-debt.md` (→ v1.12), `docs/03-specs/backlog.md` (→ v1.27),
  `docs/03-specs/reset-and-test-support.md` (→ v1.6), `docs/04-process/process-log.md`
- Create: `docs/04-process/prompts/2026-09-24-T-13c/` (the session's subagent briefs and reports,
  not diffs — build-workflow §7)

- [ ] **Step 1: the layer READMEs** — one paragraph each, in their own T-nn style; then commit.

```diff
--- a/tests/unit/README.md
+++ b/tests/unit/README.md
@@ -65,3 +65,16 @@ or Zod's `.describe()` does not count; each of those has a fixture (built as a s
 that must be reported, next to one positive control per accepted form. A conditional
 `test.skip(cond, …)` is out of scope. `run(root)` is the whole CLI, so the exit code and messages
 are tested against a throwaway repository.
+
+T-13c: `css-grid.test.ts` runs the repository's own `stylelint.config.mjs` (TD-9; the script is
+`npm run lint:css`) over every `.css` under `app/` and `src/`, and over a violation fixture and a
+control in `fixtures/css-grid/`: a bare `fr` column track must be reported, on its line.
+`shared/env.test.ts` holds
+the URL tables of TD-10's `isLocalDatabaseUrl`, `localDatabaseRefusal` and `testEnvRefusal`;
+`server/env.test.ts`, `test-support.test.ts` and `next-config.test.ts` pin where the refusal is
+read (`isTestEnv`, the route list, the config at build and start). `database-guard.test.ts` starts
+child processes — the seed and `playwright test --list` — with another machine's `DATABASE_URL`
+and expects the refusal, not a connection. `fonts.test.ts` checks `app/fonts/` (TD-11): every
+`.woff2` listed in its README with its real hash, used by `app/layout.tsx`, and the OFL beside
+them. `webmcp/adapter.test.ts` gains the TD-7 pair. Test URLs use the password `password`, or a
+`${…}` variable: the secret scan reads a literal `scheme://user:password@host` as a leak.
```

```diff
--- a/tests/fixtures/README.md
+++ b/tests/fixtures/README.md
@@ -25,3 +25,9 @@ expects the 90 % statements gate to fail. `a11y-routes.ts` — `A11Y_ROUTES`, th
 gate scans, with `discoveredRoutes`, `routesMissingFrom` and `listedWithoutPage` (`04dc381`)
 so a unit test can fail both ways: a page missing from the list, and a listed route that has
 no page.
+
+T-13c: `css-grid/` — two `.css.fixture` files for TD-9's Stylelint rule, a violation and a control
+(the extension keeps them out of `npm run lint:css` and Prettier; `tests/unit/css-grid.test.ts`
+hands their text to the linter). `fonts.ts` — `fontProblems` (TD-11): the checks of `app/fonts/` that `tests/unit/fonts.test.ts`
+runs on the real directory and on broken copies. `boundaries/` gains the `next/font/google`
+violation and the `next/font/local` control.
```

```diff
--- a/src/shared/README.md
+++ b/src/shared/README.md
@@ -18,3 +18,8 @@ with the shared Zod schema and knows nothing of tool error codes, which are
 `src/webmcp/tool-result.ts`'s; the login and signup forms keep their own `fetch`) and `via.ts`
 (`VIA_HEADER = "X-Via"`, `VIA_WEBMCP = "webmcp"`, shared by the client that sends the marker and
 the server that records it).
+
+T-13c (TD-10): `env.ts` also holds `isLocalDatabaseUrl`, `localDatabaseRefusal` and
+`testEnvRefusal` — pure, no imports, only the global `URL` — so `next.config.ts`,
+`src/server/env.ts`, `prisma/seed.ts` and `playwright.config.ts` all read one definition of "this
+machine's database" and of where `APP_ENV=test` may run.
```

```bash
npx prettier --check tests/unit/README.md tests/fixtures/README.md src/shared/README.md
git add tests/unit/README.md tests/fixtures/README.md src/shared/README.md
git commit -m "docs(readme): list T-13c's tests, fixtures and shared functions"
```

Expected (measured): Prettier reports all three formatted.

The wording of Steps 2–7 is final except where the owner's answers to Q1–Q7 change a decision;
the dates are the execution date. The documents are Prettier-ignored (`/docs`); keep their
line-break habit.

- [ ] **Step 2: `tech-debt.md` v1.12.** In the Status line add "v1.12 — <date>: TD-7–TD-11 fixed
  in T-13c, in review on `task/T-13c-tech-debt`". In the table, TD-7…TD-11 become **Fix in review**
  (TD-6's own earlier wording). Under each entry add a **Fix in review** bullet — TD-6's shape:
  - TD-7: "`register()` (`src/webmcp/adapter.ts`) calls `notify()` right after `clearFailure()` when
    a failure was cleared. `tests/unit/webmcp/adapter.test.ts` reads the listener's value while
    `registerTool` is still pending — red on the old code, green now — and pins that a `register()`
    after no failure pushes nothing."
  - TD-8: (a) "the doc comment of the keyboard-only login test says what the test does — forward
    order, the field focused directly, Enter — and that reverse order is not walked, because SPEC-auth
    §6 documents the forward order only. No test changed; the owner waived the failing-first line
    for a comment (T-13c plan, Q1)."
  - TD-9: "`stylelint.config.mjs` — Stylelint's `declaration-property-value-disallowed-list` on
    `grid-template-columns` — fails a `fr` track that is not the maximum of a `minmax(<definite>, …)`;
    `npm run lint:css` runs it over every `.css` under `app/` and `src/`, and `npm run lint` runs it
    after ESLint. `tests/unit/css-grid.test.ts` runs the shipped config over a violation fixture and
    a control (`tests/fixtures/css-grid/`) and over the real tree; changing `PotsCard.module.css` and
    `page.module.css` to `1fr 1fr` turned `lint:css` and the real-tree test red. Owner decision
    (Q4): a linter, not the unit test the plan recommended; it adds the dev dependency `stylelint`
    17.15.0 (75 packages, `npm audit` 0). Not read: rows, `grid-auto-columns`, the `grid`
    shorthands."
  - TD-10: "`src/shared/env.ts` — `isLocalDatabaseUrl`, `localDatabaseRefusal`, `testEnvRefusal`.
    `next.config.ts` refuses `APP_ENV=test` on Vercel (`VERCEL`, `VERCEL_ENV`) and with a
    `DATABASE_URL` that is not `localhost`, `127.0.0.1` or `[::1]` (or carries `host`/`hostaddr`);
    `isTestEnv` refuses the same at runtime; `prisma/seed.ts` and `playwright.config.ts` refuse a
    non-local `DATABASE_URL` after their `.env.local` load. `prisma migrate deploy` is not guarded.
    Not keyed on `NODE_ENV`. The `VERCEL` line depends on Vercel's project setting 'Enable access
    to System Environment Variables'; the database line does not."
  - TD-11: "`app/layout.tsx` uses `next/font/local` over `app/fonts/` (`@fontsource/public-sans` 5.3.0,
    latin 400 and 700, sha256 in `app/fonts/README.md`, `OFL.txt` beside them);
    `eslint.config.mjs` restricts `next/font/google`, `tests/unit/fonts.test.ts` checks the files'
    hashes, use and licence. With every outbound HTTPS request blocked, `next build` failed before
    and passes now; the built CSS has no Google URL; screenshots at 1440/768/375 px differ by 6–48
    anti-aliased pixels."
  "Closed" (with the PR number) is written after the merge, as TD-6's was (PR #23).
- [ ] **Step 3: `backlog.md` v1.27.** Changelog (2026-09-25, T-13c plan gate): the owner's answers
  to Q1–Q6 — (a) for TD-8 (the comment; the failing-first line waived), (a) for TD-10's first seed
  and scope, **a linter for TD-9 (Stylelint 17.15.0, a new dev dependency)**, (A) for the font files
  — and that T-13a/b are separate tasks with their own plan gates. Four row edits: **T-13c** —
  "plan: `docs/04-process/plans/2026-09-24-T-13c.md`, in review"; **T-13d** — in item (4),
  dependencies: "`stylelint` (dev), added by T-13c (v1.27)"; **T-14** — after "confirm on the deployment that TD-10's guard refuses APP_ENV=test
  there" add "**from T-13c (v1.27):** the first seed is `POST /api/admin/reset` with `RESET_SECRET`
  and an empty body (reason `manual`), after `prisma migrate deploy`; `npm run db:reset` refuses a
  non-local `DATABASE_URL` (SPEC-reset-and-test-support v1.6); the guard's `VERCEL` line needs the
  Vercel project's 'Enable access to System Environment Variables' setting on, its database line does
  not — read the setting"; **T-16** — in the third-party notices: "Public Sans (SIL OFL 1.1, © 2015
  The Public Sans Project Authors) in `app/fonts/`, text in `app/fonts/OFL.txt`, source in
  `app/fonts/README.md`". Notes: "Open at v1.27: TD-2 (T-13a), TD-3 (T-13b); TD-7–TD-11 in review
  (T-13c)".
- [ ] **Step 4: `reset-and-test-support.md` v1.6** (approved: Q2 (a), 2026-09-25). Status
  and Changelog: "v1.6 (2026-09-25, T-13c, owner decision on TD-10)". §2.5 becomes: "2.5 First
  deploy: `POST /api/admin/reset` with `RESET_SECRET` and an empty body (§2.2) calls
  `resetToSeed(db, "manual")`, so `lastResetAt` always exists (banner is deterministic).
  `npm run db:reset` does the same for a local database only: its seed step refuses a `DATABASE_URL`
  whose host is not `localhost`, `127.0.0.1` or `[::1]` (TD-10)." §2.7's first line becomes: "2.7
  Test support (only when `APP_ENV=test` and the process is neither on a Vercel deployment —
  `VERCEL` or `VERCEL_ENV` set — nor pointed at another machine's database; otherwise the routes do
  not exist — 404 — and a unit test asserts the router has no `test/*` entries in other envs.
  `next.config.ts` refuses that combination at build and start, TD-10):".
- [ ] **Step 5: `process-log.md`.** One entry from `docs/templates/process-log-entry.md`, "Build
  (T-13c): tech debt TD-7–TD-11", listing the plan gate's answers, the commits, the numbers of F7
  and the checks run. Draft the agent-side fields; the owner fills "what the agent got wrong" and
  "owner changes". Lessons to record if they hold at execution: `?host=` beats a URL's host;
  `VERCEL` depends on a project setting; flat-config rules replace, not merge; `scaffold.test.ts`
  reads every backticked double-dash name; a design-fidelity check for a font swap is a pixel
  comparison, not a visual impression; the secret scan reads fake connection strings, so a URL guard's
  tests need placeholder passwords; a regular expression over CSS needs a lookbehind at the number's
  first digit (`11fr`); the owner overruled a recommendation (Q4) and the plan measured what that
  cost — audit, install scripts, the lint chain — instead of arguing.
- [ ] **Step 6: prompts** — copy the subagent briefs and reports (not diffs) to
  `docs/04-process/prompts/2026-09-24-T-13c/`.
- [ ] **Step 7: rebase, the full run, commit, PR.** `git fetch origin`, `git rebase origin/main`
  (T-13a/T-13b may have merged; the three docs above are where it conflicts). Then:

```bash
npm run test:all
```

Expected: green; unit **1 035** tests (or the new baseline plus 77), API and E2E counts equal to a
run on `main` (this task adds none).

```bash
git add docs
git commit -m "docs(specs): record TD-7–TD-11 fixes — tech-debt v1.12, backlog v1.27, SPEC-reset v1.6, process log"
```

Open the PR as a draft; its description is the Definition of Done checklist, ticked, with the
screenshots of Task 5 Step 12, the keyboard walkthrough note for TD-8 ("Tab, Tab, Tab, … as in the
test's comment; reverse order not walked"), "TD-8: no failing-first test — waived by the owner, Q1
(a)", and "TD-9: Stylelint 17.15.0 added as a dev dependency — the owner's answer to Q4; npm audit 0".
Do not merge.

## Self-review (run by the planner)

**Spec coverage.** TD-7 → Task 1; TD-8 → Task 2; TD-9 → Task 3; TD-10 → Task 4 (its two halves:
"`APP_ENV=test` refused on a deployment" — `next.config.ts`, `isTestEnv`; "`db:reset`/`test:api`
refused against a non-local `DATABASE_URL`" — `prisma/seed.ts`, `playwright.config.ts`); TD-11 → Task 5
(the loader, the files with source and version, the licence beside them, `design-tokens.md`, the
check; T-16's notice is a backlog hand-off in Task 6). The backlog row's "moved from T-14's row"
is satisfied by Task 6 Step 3. No gap found.

**Placeholders.** No "TBD", "add appropriate …" or "similar to Task N"; every code step shows the
change, taken from the files that ran. The "predicted" expectations are labelled — Task 2
Step 2 (a comment-only change), Task 4 Step 2 (a module that does not export a function fails
its tests) and Task 5 Step 6 (the provenance test before the layout switch); every other
"Expected" line says "measured".

**Type consistency.** `isLocalDatabaseUrl`, `localDatabaseRefusal`, `testEnvRefusal` (Task 4),
`fontProblems` (Task 5) and Task 3's `lint:css` script and `stylelint.config.mjs` default export are spelled
the same where defined and used.

**Review Focus.** Lines 1–3 → Task 4's `tests/unit/shared/env.test.ts` and `database-guard.test.ts`;
4 → Task 5 Steps 2–3; 5 → Task 3's two fixtures. Not on the list because a test already pins them:
TD-7's spurious `notify()` (Task 1's control test) and a font replaced without its README hash
(Task 5's provenance test).

**Open items for the owner.** The go-ahead ("start") and the execution method. Q1–Q6 are answered
(the two spec edits inside Q2 are approved); Q7's question is answered under Q7.
