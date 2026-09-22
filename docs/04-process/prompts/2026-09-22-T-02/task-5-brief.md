### Task 5: CI job, run instructions, document amendments and the process record

**Files:**
- Modify: `.github/workflows/ci.yml` (question 6), `README.md`, `.env.example`,
  `docs/03-specs/reset-and-test-support.md`, `docs/02-architecture/data-model.md`,
  `docs/02-architecture/adr/0005-persistence-and-reset.md`, `docs/03-specs/webmcp-tools.md`,
  `docs/03-specs/backlog.md` (question 7), `docs/04-process/prompts/2026-09-22-T-02.md`,
  `docs/04-process/process-log.md`
- Create: `docs/04-process/prompts/2026-09-22-T-02/` (subagent briefs and reports, if
  executed subagent-driven — build-workflow §7)

- [ ] **Step 1: The CI job (only if question 6 is answered "now")**

In `.github/workflows/ci.yml`, insert before `  secret-scan:`:

```yaml
  api:
    name: API tests (Postgres)
    runs-on: ubuntu-latest
    services:
      # The same image as compose.yaml (T-02).
      postgres:
        image: postgres:18.6-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: personal_finance
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d personal_finance"
          --health-interval 2s --health-timeout 5s --health-retries 30
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/personal_finance
    steps:
      - uses: actions/checkout@v5
        with:
          persist-credentials: false

      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install (generates the Prisma client)
        run: npm ci

      - name: Migrate
        run: npx prisma migrate deploy

      - name: API tests (builds and starts the app with APP_ENV=test)
        run: npm run test:api
```

Run: `npx prettier --check .github/workflows/ci.yml`
Expected: clean. (The URL's host is `localhost`, which the `postgres_connection_string` rule
exempts — E18.)

- [ ] **Step 2: Run instructions**

In `README.md`, replace the sentence "Requires Node 26 (see `.nvmrc`) and, from T-02 onwards, a
local Postgres." and the code block after it with:

````markdown
Requires Node 26 (see `.nvmrc`) and Docker: Postgres runs in a container (`compose.yaml`).

```bash
npm ci                          # install; also generates the Prisma client
npx playwright install --with-deps chromium firefox webkit
cp .env.example .env.local      # local settings; DATABASE_URL already points at the container
docker compose up -d --wait     # Postgres 18 on localhost:5432
npm run db:reset                # apply migrations, then load the seed
npm run dev                     # develop on http://localhost:3000
npm run test:all                # secret scan, lint, format, typecheck, unit, API and E2E
```

`npm run db:reset` applies pending migrations and replaces all data with the seed
(`prisma/data.json`, dates moved two years on), recording a reset of reason `manual`
(SPEC-reset-and-test-support §2.5). The API and E2E tests reset the same database; it holds
demo data only.
````

In the command table, replace the `npm run test:api` row and add one row after it:

```markdown
| `npm run test:api`            | Playwright request-context tests — `tests/api`, one worker, against the app with `APP_ENV=test` and the database |
| `npm run db:reset`            | `prisma migrate deploy`, then the seed (`prisma/seed.ts`)          |
```

Then run `npx prettier --check README.md` — expected: ignored (`/README.md` is in
`.prettierignore`); align the table by hand.

In `.env.example`, replace the two comment lines above `DATABASE_URL` with:

```bash
# Neon pooled connection string in production; locally the Postgres of compose.yaml
# (docker compose up -d --wait).
```

- [ ] **Step 3: The document amendments (question 7, with the owner's answers)**

`docs/03-specs/reset-and-test-support.md`:
- Status line → `Status: **Approved** (v1.1 — 2026-09-22: owner decisions at the T-02 plan
  gate; v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20 (added after
  review S-04/S-05/S-25)`
- New line under it: `Changelog: v1.1 (2026-09-22, owner, T-02 plan gate) — §2.1 29 February
  moves to 28 February in a year without one; §2.7 `empty-all` = no pots, budgets or
  transactions, balance unchanged, `variant` is required, and `GET /api/test/log` lands in
  T-12; §5 money columns are 64-bit and become `Number` at the DTO boundary; §7 the checksum
  test runs in the unit suite, and the variant shapes are asserted in the database until
  `/api/overview` exists (T-09).`
- §2.1: after "`seeded = true`," insert "29 February → 28 February when the target year has
  none,".
- §2.7: `empty-all` → "`empty-all` (no pots, budgets or transactions; balance unchanged)";
  "400 unknown variant" → "400 unknown or missing variant"; directly under the `GET
  /api/test/log` item, the one-line note of owner answer 5:
  `  - Note: `GET /api/test/log` lands in T-12, with the via-marker logging that writes its entries (backlog v1.6).`
- §5: append the sentence of owner answer 2: "Money columns are 64-bit (`BigInt`) and are
  converted to `Number` at the DTO boundary; NFR-S3's limit, 99,999,999,999 cents, is far below
  `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991)."
- §7, API row: "(via `/api/overview`)" → "(in the database; via `/api/overview` from T-09)";
  move "checksum of `prisma/data.json` vs `docs/…/data.json`" to the Unit row.

`docs/02-architecture/data-model.md`:
- Status line → `Status: **Approved** (v1.1 — 2026-09-22: `seq` and 64-bit money, owner
  decisions at the T-02 plan gate; v1.0, owner approval 2026-09-13) · …` (rest unchanged)
- The document has no changelog line yet; add one directly under the Status line (DoD: "version
  bump and a changelog line under the header"): `Changelog: v1.1 (2026-09-22, owner, T-02 plan
  gate) — `Budget` and `Pot` gain `seq`, their creation order, because rows created in one
  transaction share `createdAt` (US-05/07/15/22); money columns are 64-bit, because NFR-S3's
  99,999,999,999 cents does not fit a 32-bit integer (R-17).`
- The line "Money is integer cents." → "Money is integer cents, stored 64-bit (NFR-S3 allows
  99,999,999,999)."
- `Budget` and `Pot` rows: prepend "`seq` (creation order, assigned by the database — rows
  created in one transaction share `createdAt`)," to the Fields column.

`docs/02-architecture/adr/0005-persistence-and-reset.md` — a new line after the Status line:

```markdown
- Clarification 2026-09-22 (owner, T-02 plan gate): money columns are integer cents stored as
  64-bit (Prisma `BigInt`) — a Prisma `Int` is 32-bit and stops at 2,147,483,647 cents, below
  the 99,999,999,999 that NFR-S3 allows (R-17). The seed routine is `resetToSeed` in
  `src/server/reset.ts`, which reads `prisma/data.json` (a checksum-tested copy of the
  challenge's `data.json`); `prisma/seed.ts` is its command-line entry (`npm run db:reset`).
```

`docs/03-specs/webmcp-tools.md` §2.8: "(SPEC-reset-and-test-support §3)" →
"(SPEC-reset-and-test-support §2.7)"; Status line → "(v1.0.1 — 2026-09-22: §2.8
cross-reference corrected; v1.0, owner approval 2026-09-20)"; at the front of its `Changelog:`
line, insert "v1.0.1 (2026-09-22, T-02 plan gate) — §2.8 pointed at SPEC-reset-and-test-support
§3 (States); the test-support routes are §2.7. ".

`docs/03-specs/backlog.md`:
- Status → `**Approved** (v1.6 — 2026-09-22: T-02/T-05/T-12 test-support and CI scope, T-13
  overrides removal, owner decisions at the T-02 plan gate; v1.5 — …` (the rest of the existing
  parenthesis unchanged)
- At the front of the `Changelog:` line, insert "v1.6 (2026-09-22, owner decisions at the T-02
  plan gate) — `GET /api/test/log` moves from T-02 to T-12, which writes the entries it returns;
  the CI API job (Postgres service) moves from T-05 to T-02, where the first database code
  lands, and T-05's API tests join it; T-13 drops the `package.json` overrides T-02 adds for
  the Prisma CLI's `deepmerge-ts` and `mysql2` once Prisma ships fixed versions. "
- T-13 row: append "; **drop the `deepmerge-ts`/`mysql2` `overrides`** (and their `"//"` note)
  from `package.json` once Prisma ships fixed versions — `npm audit --audit-level=high` must
  stay at 0 (T-02, owner decision 2026-09-22)".
- T-02 row: `/api/test/reset|seed|log` → `/api/test/reset|seed`; append "; **CI API job**
  (Postgres service, `API tests (Postgres)`)".
- T-05 row: "**CI API job** (Postgres service)" → "its API tests join the CI API job (T-02)".
- T-12 row: "via-marker logging + `/api/test/log`" stays; append "(moved from T-02)".

- [ ] **Step 4: The process record**

Append the owner's plan-gate replies, verbatim with a translation, to
`docs/04-process/prompts/2026-09-22-T-02.md` (§ "Owner's replies at the plan gate"), and append
to `docs/04-process/process-log.md` an entry in the template's shape:

```markdown
## 2026-09-22 — Phase 5: T-02 persistence, seed and test support

- **Phase:** 5 — Build the slice (Release 1)
- **Participants:** Owner / Agent (Claude Code, Opus 5)
- **Trigger:** backlog T-02, the task after T-02a; the first real `DATABASE_URL`.
- **Prompt(s):** `prompts/2026-09-22-T-02.md`; plan `plans/2026-09-22-T-02.md`
- **Produced:** Prisma 7.10.0 schema (six tables, three enums), first migration with the
  `citext` extension, the generated client in `src/server/generated/prisma` (git-ignored,
  `postinstall`); `compose.yaml` (Postgres 18.6); `src/server/{env,db,seed,variants,reset,http,test-support}.ts`;
  `prisma/seed.ts` and `npm run db:reset`; `app/api/test/[...path]/route.ts`; 69 unit tests
  and 16 API tests; the six server fixtures repointed and one added; <CI job if Q6>;
  <document amendments per Q7>.
- **What the agent got right:** <filled at the end of execution from the task reviews>
- **What the agent got wrong or missed:** <filled at the end of execution from the task reviews>
- **Owner changes and reasoning:** _(owner)_
- **Disagreements:** <from the plan gate>
- **Lessons for the process:** <filled at the end of execution>
- **Next:** owner review and merge; T-03/T-04; findings F1, F2 and question 8 if deferred.
```

The angle-bracket fields are filled from the execution record before the PR opens — they are
facts that do not exist yet, not placeholders in the design.

- [ ] **Step 5: Final gates, the full suite, CI**

Run: `npm run test:all`
Expected: secret scan clean, lint, format, typecheck, Vitest 226/226, Playwright api 16 passed,
E2E scaffold test passed on three engines. `test:e2e` runs with several workers outside CI while
`test:api` runs with one; that is safe at T-02 because the only E2E test,
`tests/e2e/scaffold.spec.ts`, never touches the database. The first E2E test that seeds (T-06)
must decide between one worker and a database per worker (hand-off note).

Commit:

```bash
git add .github/workflows/ci.yml README.md .env.example docs
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "docs: T-02 amendments, run instructions and process record; ci: API tests against Postgres"
```

(Split into `ci: …` and `docs(…): …` commits if the owner prefers one concern per commit.)
Push and open a draft PR whose description is the Definition of Done below, ticked, plus the
two `overrides` and why they exist (owner answer 9, D19). Watch CI: `gh pr checks --watch`.
Expected: `lint · typecheck · unit`, `secret scan`, `npm audit` (0 vulnerabilities, no warning
annotation) and `API tests (Postgres)` all pass. The owner merges.

---

## Definition of Done — how each line is met

| DoD line | Where |
|----------|-------|
| PR names task, spec sections, stories; nothing outside the task | PR description; out-of-scope list above; question 8 kept out unless the owner says otherwise |
| No Accepted ADR contradicted | ADR-0005 clarification (question 2, 7); ADR-0002 layers kept (E10) |
| Spec amended in the same PR if wrong or incomplete | Task 5 Step 3 |
| TypeScript strict, lint, format, boundaries | Every task's gate step |
| No `new Date()` in `src/server` business code | D7; the lint rule is unchanged and passes |
| Money integer cents in code and DB | `toCents`, `BigInt` columns, the NFR-S3 test |
| Shared Zod schemas; copy from `copy.ts` | Not applicable yet — no product validation or copy in this task (D11) |
| New rule, guard or mirror test ships with a violating fixture | Generated-client import fixture; checksum, theme, category and `RESET_TABLES` violation cases; the absence test's control |
| Unit tests for new functions; `domain` coverage | `seed`, `variants`, `test-support`, `reset` unit tests; no `domain` code in this task |
| API tests for every new route | `tests/api/test-support.spec.ts` (+ `reset`, `schema`) |
| E2E per story touched; axe; keyboard; screenshots | Not applicable — no UI; US-36's E2E (Overview after reset) needs T-10 |
| `npm run test:all` green locally and in existing CI jobs | Task 5 Step 5 |
| Process-log entry; prompts saved | Task 5 Step 4; this session's prompt already saved |
| Owner reviewed and merged | Owner |
