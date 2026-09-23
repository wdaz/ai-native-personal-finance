### Task 7: Documents, the full gates and the process record

**Files:**
- Modify: `src/shared/README.md`, `tests/fixtures/README.md`, `tests/fixtures/boundaries/README.md`
- Modify: `docs/03-specs/backlog.md` (v1.9), `docs/04-process/process-log.md`
- Create: `docs/04-process/prompts/2026-09-23-T-04.md`, `docs/04-process/prompts/2026-09-23-T-04/`
  (the ledger, briefs, reports and reviews of the session, not diffs — build-workflow §7)

- [ ] **Step 1: The three READMEs**

```diff
--- a/src/shared/README.md
+++ b/src/shared/README.md
@@ -6,5 +6,7 @@
 - Used by forms, route handlers and WebMCP tools alike (NFR-Q2).
 
 T-03 wrote the SPEC-overview §4.2 formatters: `money.ts` (`formatMoney`,
-`formatSignedMoney`) and `dates.ts` (`formatDate`). T-04 adds `copy.ts`, `test-ids.ts`, the
-schemas and the enums.
+`formatSignedMoney`) and `dates.ts` (`formatDate`). T-04 wrote `enums.ts` (the enums of
+data-model.md, as the document spells them), `copy.ts` (the user-stories copy appendix),
+`schemas.ts` (Zod: auth, the error envelope, the Overview DTO, meta) and `test-ids.ts`.
+`env.ts` holds `WEBMCP_MODES`, which the meta schema reuses.
```

```diff
--- a/tests/fixtures/README.md
+++ b/tests/fixtures/README.md
@@ -5,4 +5,7 @@
 T-02: `database.ts` (`storedRows`, `insertedRows`) for the API tests, and the ADR-0002
 fixtures in `boundaries/`. T-03: `domain.ts` (`transaction`, a hand-built row for the
 domain's unit tests) and `seed-figures/`, copies of SPEC-overview §4.3 that are wrong on
-purpose (`tests/unit/seed-figures.test.ts`). T-06 adds the authenticated `storageState`.
+purpose (`tests/unit/seed-figures.test.ts`). T-04: `copy/` and `enums/`, copies of the
+user-stories copy appendix and of data-model.md's enum lists that are wrong on purpose
+(`tests/unit/shared/copy.test.ts`, `enums.test.ts`), and the test-id fixtures in
+`boundaries/`. T-06 adds the authenticated `storageState`.
```

`tests/fixtures/boundaries/README.md` — the paragraph under "What is covered" and one row in each
table (Prettier re-pads the tables):

```diff
--- a/tests/fixtures/boundaries/README.md
+++ b/tests/fixtures/boundaries/README.md
@@ -18,10 +18,10 @@
 
 ## What is covered
 
-Every rule ADR-0002 and ADR-0005 state has at least one fixture that violates it, and
-every layer pair they permit has one that must stay silent. The two halves matter equally:
-a config that reported nothing would pass no violation case, and a config that reported
-everything would pass no control.
+Every rule ADR-0002, ADR-0003 (test ids) and ADR-0005 state has at least one fixture that
+violates it, and every layer pair they permit has one that must stay silent. The two halves
+matter equally: a config that reported nothing would pass no violation case, and a config
+that reported everything would pass no control.
 
 | Violates                                   | Fixtures                                                                                                                              |
 | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
@@ -31,16 +31,18 @@
 | `scripts` → anything but `shared`/`domain` | `server`                                                                                                                              |
 | Prisma outside `src/server`                | from `app` (`@prisma/client`, the `/edge` sub-path and the generated client in `src/server/generated/prisma`), `src/ui`, `src/shared` |
 | ADR-0005's clock rule                      | `new Date()`, `Date()` and `Date.now()`, in `src/domain` **and** `src/server`                                                         |
+| ADR-0003's test-id rule                    | a string as `data-testid` in `src/ui` and as `getByTestId`'s argument in `tests/e2e`                                                  |
 
-| Must report nothing                                           | Fixture                          |
-| ------------------------------------------------------------- | -------------------------------- |
-| `domain` → `shared`                                           | `domain-imports-shared-allowed`  |
-| `app` → `server`                                              | `app-imports-server-allowed`     |
-| `server` → `domain`                                           | `server-imports-domain-allowed`  |
-| `scripts` → `shared`                                          | `scripts-imports-shared-allowed` |
-| `scripts` → `domain`                                          | `scripts-imports-domain-allowed` |
-| `webmcp` → `shared`                                           | `webmcp-imports-shared-allowed`  |
-| `new Date(<value>)` in `domain` — a fixed date, not the clock | `domain-parses-date-allowed`     |
+| Must report nothing                                                   | Fixture                                                   |
+| --------------------------------------------------------------------- | --------------------------------------------------------- |
+| `domain` → `shared`                                                   | `domain-imports-shared-allowed`                           |
+| `app` → `server`                                                      | `app-imports-server-allowed`                              |
+| `server` → `domain`                                                   | `server-imports-domain-allowed`                           |
+| `scripts` → `shared`                                                  | `scripts-imports-shared-allowed`                          |
+| `scripts` → `domain`                                                  | `scripts-imports-domain-allowed`                          |
+| `webmcp` → `shared`                                                   | `webmcp-imports-shared-allowed`                           |
+| `new Date(<value>)` in `domain` — a fixed date, not the clock         | `domain-parses-date-allowed`                              |
+| a `data-testid` taken from `TEST_IDS`, in `src/ui` and in `tests/e2e` | `ui-shared-test-id-allowed`, `e2e-shared-test-id-allowed` |
 
 The violation cases also assert `severity === 2`. ADR-0002 says "CI must fail on
 violations"; a rule demoted to a warning would still be reported, and `eslint` would still
```

Run: `npx prettier --write tests/fixtures src/shared && npm run format:check`
Expected (*measured*): exit 0.

- [ ] **Step 2: `backlog.md` v1.9** (the hand-offs; F3)

The status line's parenthesis starts with
`v1.9 — 2026-09-23: T-04 hand-offs written into T-05/T-06/T-07/T-08/T-09/T-10/T-11/T-12/T-13/T-15, owner decisions at the T-04 plan gate; `
before `v1.8 — …`. The changelog starts with:

```md
Changelog: v1.9 (2026-09-23, owner decisions at the T-04 plan gate) — T-04 adds `zod` 4.6.5 as a dependency and writes `src/shared/enums.ts`, `copy.ts`, `schemas.ts`, `tool-schema.ts` and `test-ids.ts`; `src/server/http.ts` takes `ApiErrorCode` from the shared `ErrorEnvelope`; an ESLint rule keeps every `data-testid` in `test-ids.ts`; SPEC-auth v1.0.1, SPEC-app-shell v1.1 and user-stories v1.2 ride in the same PR. Every hand-off the T-04 plan addresses to a later task sits in that task's row, as in v1.7 and v1.8. v1.8 (2026-09-22, owner decisions at the T-03 plan gate) — …
```

(the existing text from "v1.8" on stays unchanged). The T-04 row's task cell gains, at the end:
`; `toolInputJsonSchema` (`src/shared/tool-schema.ts`) for T-11's `defineTool` (plan finding F1); `src/server/http.ts`'s `ApiErrorCode` from the shared `ErrorEnvelope`; the ADR-0003 test-id lint rule with fixtures`.

Each of these rows' task cells gains, at the end:
- T-05: `; **from T-04:** parse bodies with `LoginSchema`/`SignupSchema`; 400 = `{ error: "validation", message, issues: toErrorIssues(error) }`; 401 `message` "Email or password is incorrect" (`COPY.loginIncorrect`), 429 `message` "Too many attempts" with `retryAfter` equal to the `Retry-After` seconds (SPEC-auth v1.0.1); banner text `COPY.loginRateLimited(retryAfterMinutes(retryAfter))`; API tests parse bodies with the response schemas and `ErrorEnvelopeSchema`, which refuse unlisted fields`
- T-06: `; **from T-04:** the forms validate with `LoginSchema`/`SignupSchema` and show each field's one issue, focusing the first; `EMAIL_MAX`, `NAME_MAX`, `PASSWORD_MAX` for `maxLength`; copy from `COPY`; test ids only from `TEST_IDS` (lint rule)`
- T-07: `; **from T-04:** the shell's copy (`skipToContent`, `minimizeMenu`/`expandMenu`, `dismissNotice`, `comingInRelease2`) from `COPY``
- T-08: `; **from T-04:** `GET /api/meta` answers `MetaDtoSchema`; the banner is `COPY.resetBanner(meta.resetIntervalDays, formatDate(meta.lastResetAt))` — the interval from `GET /api/meta`, never a literal 10; the admin reset body's `reason` is one of `RESET_REASONS` (T-08 writes that schema)`
- T-09: `; **from T-04:** `GET /api/overview` answers `OverviewDtoSchema`, which is strict — map each row field by field (no `seq`; no `category` or `recurring` on transactions); categories and themes as data-model.md spells them, mapped in `src/server` from Prisma's identifiers with one map, tested against `CategorySchema.options` / `ThemeSchema.options`; avatar keys, not paths`
- T-10: `; **from T-04:** empty and error copy from `COPY`; any `data-testid` from `TEST_IDS``
- T-11: `; **from T-04:** `defineTool` takes `inputSchema` from `toolInputJsonSchema` (`src/shared/tool-schema.ts`), which throws on an empty schema and on a string without `maxLength` (ADR-0004 as amended by the F1 PR); read `WEBMCP_MODE` with `WebMcpModeSchema`; indicator text from `COPY.agentTools*`, and its four `title`s (§2.7) join the copy appendix before `COPY``
- T-12: `; **from T-04:** tool output is the `OverviewDto` plus `{ currency, unit }`; validation errors as `toErrorIssues``
- T-13: `; **from T-04:** drop `vite-tsconfig-paths` for Vite's own `resolve.tsconfigPaths` — every Vitest run prints its deprecation notice (T-04 plan F3)`
- T-15: `; **from T-04:** T-02 D5 left name lengths and amount ranges (NFR-S3) to the shared schemas — Release 2's write schemas carry them in `src/shared/schemas.ts` (ids with `.max(36)` for `toolInputJsonSchema`); the amount copy is already in `COPY``

- [ ] **Step 3: The full gates**

Run: `npm run test:all`
Expected: secret scan, lint, format, typecheck and Vitest exit 0 (*measured* in the prototype,
E10: 427/427); the API and E2E suites pass unchanged (*prediction*, E16: API 17/17, E2E 3/3).
Then: `npm audit` → "found 0 vulnerabilities" (*measured*, E2).

- [ ] **Step 4: The process record**

`docs/04-process/prompts/2026-09-23-T-04.md` (the owner's messages verbatim, as in the T-03
record), the session folder, and the process-log entry below with the owner's corrections
filled in.

- [ ] **Step 5: Commit, push, draft PR**

```bash
git add src/shared/README.md tests/fixtures/README.md tests/fixtures/boundaries/README.md docs/03-specs/backlog.md
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "docs(backlog): v1.9 — T-04 hand-offs; READMEs for src/shared and the fixtures (T-04)"
git add docs/04-process
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "docs(process): T-04 — prompt record, execution record, process-log entry"
git push -u origin task/T-04-shared
```

The PR description is the Definition of Done, ticked, and lists the document changes separately:
user-stories v1.2, app-shell v1.1, auth v1.0.1, backlog v1.9 (answer 6).

---

## Process-log entry (draft for Task 7)

```md
## 2026-09-23 — Phase 5: T-04 shared schemas, enums, copy and test ids

- **Asked:** "T-04 plan hazırla" (plan only); the plan-gate answers (pasted; "Yalnız plan v0.2");
  <the go-ahead>.
- **Produced:** `src/shared/enums.ts`, `copy.ts`, `schemas.ts`, `tool-schema.ts`, `test-ids.ts`;
  `zod` 4.6.5; `ApiErrorCode` from the shared envelope; the ADR-0003 test-id lint rule; document
  mirrors for the copy appendix and data-model.md's enums, each with violation fixtures;
  user-stories v1.2, app-shell v1.1, auth v1.0.1, backlog v1.9. Vitest 341 → 427.
- **Agent got wrong:** <filled by the owner>. In planning: two tests read the schema's own
  constants and passed when the constants were wrong (E11, D14); two ESLint selectors missed or
  over-matched before a third form was measured (E9); v0.1 removed the `ApiErrorCode` name the
  owner wanted kept.
- **Owner changed:** the test-id rule narrowed to string literals, 1 + 1 fixtures per side; the
  F1 check moved into T-04 as a shared helper; SPEC-auth §6 amended in this PR (F2).
- **Lessons:** a converter that fails silently is worse than one that throws — E7 found
  `zod-to-json-schema` returning an empty schema with no error, in a path ADR-0004 had approved;
  the owner's answer turned the finding into a guard that fails at build time.
- **Next:** owner review and merge; T-05.
```

---

## Definition of Done — how each line is met

| DoD line | How |
|----------|-----|
| Task id, spec sections, stories named; nothing outside the task changed | PR title and description; `http.ts` by answer 5; F1's ADR amendment in its own PR |
| No Accepted ADR contradicted | ADR-0002 (shared imports nothing), ADR-0003 (test ids) kept; ADR-0004 amended by the F1 PR before T-04, not worked around |
| Spec amended in the same PR if wrong or incomplete | user-stories v1.2, app-shell v1.1 (Task 2), auth v1.0.1 (Task 3), backlog v1.9 (Task 7) |
| Strict TS, lint, format, boundaries | Every task's step "All unit gates" |
| Domain pure and clock-injected | Not touched |
| Money integer cents, formatted at the edge | `z.int()` for every amount in the DTO (Task 4) |
| Shared Zod schemas; copy from `copy.ts` mirroring the appendix | Tasks 2–5; the mirror test in Task 2 |
| Client/server boundary; WebMCP only in `src/webmcp` | No component or WebMCP code; `toolInputJsonSchema` is a shared function T-11 calls |
| New rule / mirror ships with a failing fixture | Copy and enums mirrors (Tasks 1–2), the converter guard with E7's output (Task 5), the test-id rule (Task 6), each reported on purpose |
| Unit tests for every new shared function | `toErrorIssues`, `retryAfterMinutes`, `toolInputJsonSchema`, the `COPY` functions, every schema; coverage 100 % (E10) |
| API, E2E, axe, WebMCP tests | No route, page or tool in T-04; `test:all` still runs them (Task 7) |
| `npm run test:all` green | Task 7 Step 3 |
| Keyboard, focus, tokens, screenshots | No UI in T-04 |
| Process-log entry, prompts saved, owner merges | Task 7 Step 4; the owner merges |
