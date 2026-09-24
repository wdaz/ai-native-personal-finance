## Task 11: records — backlog, tech debt, process log, prompts

**Files:**
- Modify: `docs/03-specs/backlog.md` (v1.22: the changelog line, the T-13 row, hand-offs in T-14/T-15/T-16
  rows), `package.json` (the `"//"` overrides note), `docs/04-process/process-log.md` (complete the
  entry appended at planning), `docs/04-process/plans/2026-09-24-T-13.md` (status line: executed, what
  differed), `README.md` if a command changed
- Create: `docs/04-process/prompts/2026-09-24-T-13.md` (+ the briefs/reports directory, per build-workflow §7)

- [ ] **Step 1: The overrides note (F4, Q7).** Rewrite the second `"//"` line to: `"Re-measured 2026-09-24 (T-13): still needed — without them npm audit reports 4 high; prisma@7.10.0 (newest stable 7.x) pins deepmerge-ts 7.1.5 (via @prisma/config) and mysql2 3.15.3. Re-check: remove both overrides in a scratch copy, npm install --package-lock-only, npm audit --audit-level=high. Drop them when it is clean (owner: <task named at Q7>)."`

- [ ] **Step 2: Backlog v1.22.** Changelog line (T-13 execution): what shipped, the F1 defect and PR-A,
  that the Prisma overrides stay (F4). In the T-13 row nothing else changes but a leading
  "**Delivered (v1.22):**" is not added (rows stay descriptions). Hand-offs, in the style of v1.21:
  - **T-14:** Vercel's `npm ci` reads `.npmrc` — `strict-allow-scripts=true` needs npm ≥ 11.19 on
    Vercel's Node 26 image; verify it and that `fsevents` (absent on Linux) is tolerated.
  - **T-15 (retro):** T-12 merged with `npm run test:all` red on Firefox/WebKit (F1/F2 defect) — a
    DoD gap; add "the PR lists the result of all three engines" to the reviewer's checklist; the
    coverage table hides fully covered files (use `json-summary`); a fixture-config trick for
    proving a threshold.
  - **T-16:** required checks are now `E2E (Chromium, polyfill)`, `E2E (Chromium, off)`,
    `E2E (Firefox, polyfill)`, `E2E (WebKit, polyfill)`, `lint · typecheck · unit`,
    `API tests (Postgres)`, `secret scan` (now includes messages if Q5), `npm audit` is
    non-blocking by design; the overrides removal note (Q7).

- [ ] **Step 3: Process log.** Complete the planning entry appended at 16:08 (Produced: the plan;
  what the agent got wrong — list anything found during execution; owner changes: the answers to
  Q1–Q8 **and the owner's request to record the worktree bootstrap**; Lessons: the three F1–F3
  lessons, the T-12 DoD gap, that a symlinked `node_modules` is not a worktree bootstrap). Save the
  execution brief as `docs/04-process/prompts/2026-09-24-T-13.md`.

- [ ] **Step 4: Final verification, copied from the run.** `npm run test:all` on the branch with
  Postgres up (it now runs coverage, traceability and all three engines); `npm audit
  --audit-level=high` (0); actionlint; `npm run format:check`. Then the PR description quotes the
  DoD checklist ticked — the new PR template makes it the default.

- [ ] **Step 5: Commit** — `docs(process): T-13 records — backlog v1.22, overrides re-measured, process log`.

---

## Self-review (run by the planner)

**Spec coverage** — every clause of the T-13 row:

| Backlog clause | Task |
|----------------|------|
| Firefox + WebKit E2E | 10 (needs PR-A; F1) |
| axe gate | 6 (Q4) |
| coverage gate 90 % on `domain` | 2 |
| traceability script scoped to the release's list, generated from PRD §5 | 3 |
| PR template with the DoD checklist | 5 |
| install-script policy: evaluate `strict-allow-scripts=true` after checking the Linux set | 7 (F5) |
| CI triggers on `main` only | already true (`on: push: branches: [main]`; verified in `ci.yml`), no task |
| split the `concurrency` group | 1 |
| `permissions: contents: read` | 1 |
| commit/tag-message secret scan with its own failing fixture | 8 (Q5) |
| drop the `deepmerge-ts`/`mysql2` overrides | **not done** — F4, Q7, note in 11 |
| schema-vs-migrations drift check in CI | 4 |
| narrow `coverage.include` | 2 (as `.{ts,tsx}`, not the backlog's `**/*.ts`) |
| drop `vite-tsconfig-paths` | 2 |
| TD-4 | 9 |
| T-12's hand-off: second matrix dimension or job, decide there | 10 (matrix `include`, Q3) |

**Placeholders:** the only deliberate blanks are values that exist only at execution — the PR number
in TD-4's closing line and the "task named at Q7" in the overrides note; both are marked and
answered at the gate or at PR time.

**Type consistency:** `childEnv` (Tasks 2, 7), `A11Y_ROUTES`/`discoveredRoutes`/`routesMissingFrom`
(Task 6, used by both the spec and the unit test), `checkTraceability`'s `{ release, defined,
sources }` (Task 3's test and CLI agree), `vitest.thresholds.json` (Task 2's config, fixture and
test agree).

**Review Focus:** 1 → Task 10 Step 5; 2 → Task 7 Steps 5, 7 (control test on the owner's platform;
Linux measured); 3 → Task 6; 4 → Task 3 (comment, skip and typo fixtures); 5 → Task 2 Step 6; 6 →
Task 1 Step 5; 7 → Task 8.

**Not verified in the planning session (and therefore predictions):** every line still marked
"Prediction"; the CI runner's npm version and its handling of `strict-allow-scripts`; the
concurrency behaviour and the `permissions` block on a real run; Firefox/WebKit results on the CI
runner; the full Firefox/WebKit suite *with* PR-A's header (the probe showed both tools listed with
it, and the 8 tests of `webmcp.spec.ts` are the run in Task A1 Step 5); Tasks A1–A3 themselves (the
header, the warn, the ADR text were not written); Task 8's three tests *before* the implementation;
Task 9 on Firefox and WebKit; whether Vercel's npm accepts `strict-allow-scripts` (T-14).
Everything else quoted as "Measured" was run in the worktree on `838e0f5` on 2026-09-24.
