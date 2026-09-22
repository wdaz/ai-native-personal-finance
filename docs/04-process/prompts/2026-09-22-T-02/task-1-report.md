# Task 1 report — Prisma 7 toolchain, schema and generated client

Branch `task/T-02-persistence-reset`, worktree
`/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-02-persistence-reset`.
Started from HEAD `0eec801` (clean tree). Result committed as `b15e61c`.

## What I implemented, step by step

**Step 1 — Confirm branch and clean tree.** `git branch --show-current` →
`task/T-02-persistence-reset`; `git status --short` → empty. Matched.

**Step 2 — Install pinned Prisma packages and test-only `pg`.** Ran the three installs
exactly as written:
- `npm install --save-exact @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0`
- `npm install --save-dev --save-exact prisma@7.10.0`
- `npm install --save-dev pg@^8.23.0 @types/pg@^8.23.1`

`npx prisma --version` printed `prisma : 7.10.0` and `@prisma/client : 7.10.0`;
`node_modules/@prisma/engines/schema-engine-darwin-arm64` exists. `package.json` gained
`@prisma/adapter-pg`/`@prisma/client` under `dependencies` and `pg`/`@types/pg`/`prisma`
under `devDependencies`, all at the exact versions specified.

**Step 3 — Approve install scripts, add overrides (R1 applied).**
`npm install-scripts approve prisma @prisma/engines` produced the exact expected
`allowScripts` block. `npm audit --audit-level=high` (before overrides) showed the
expected 4 high vulnerabilities (deepmerge-ts, mysql2, both via the `prisma` CLI).
Added the owner-specified `"//"` comment and `"overrides"` block directly after
`allowScripts` (D19/owner answer 9), verbatim.

Ruling **R1**: the brief's own `npm install && npm audit ...` line was replaced with
`npm install --ignore-scripts && npm audit ...`. This was empirically necessary too — the
harness's auto-mode classifier denied the bare `npm install` outright ("Unauthorized
Persistence"), which is exactly the `prepare`/git-hooks concern R1 describes. With
`--ignore-scripts`:
- `npm audit --audit-level=high` → `found 0 vulnerabilities`
- `npm ls deepmerge-ts mysql2` → `deepmerge-ts@8.0.2 overridden`, `mysql2@3.24.4 overridden`
- `npx prisma --version` → still `7.10.0`
- `npx prettier --check package.json` → clean

All matched E24.

**Step 4 — `prisma/schema.prisma`.** Written verbatim from the brief (six models, three
enums, the money-as-BigInt / UTC-instant header comment, generator output pointed at
`../src/server/generated/prisma`).

**Step 5 — `prisma.config.ts`.** Written verbatim.

**Step 6 — Ignore and generate the client.** Appended the two-line block (with leading
blank line) to `.gitignore`. Ran
`npx prisma validate && shasum prisma/schema.prisma && npx prisma format && shasum prisma/schema.prisma && npx prisma generate`:
- "The schema at prisma/schema.prisma is valid"
- both checksums: `230ef2d74a4d2e66cfa0ccc092ebd2976f038ac5` (format changed nothing, E6)
- "Generated Prisma Client (7.10.0) to ./src/server/generated/prisma"
- `git status --short` did not list `src/server/generated/`

**Step 7 — Generate on every install (R2 applied).** Ran only
`npm pkg set scripts.postinstall="prisma generate"`; confirmed it landed in
`package.json`. Per ruling **R2**, did **not** run `rm -rf src/server/generated && npm ci`
— that verification is left to the controller, who runs it after this report.

**Step 8 — `src/server/env.ts`.** Written verbatim (`Env`, `isTestEnv`, `databaseUrl`).

**Step 9 — `src/server/db.ts`.** Written verbatim (`Db`, `createDb`, `getDb`, the
globalThis holder).

**Step 10 — Prisma-generated-client violation fixture + test case.** Created
`tests/fixtures/boundaries/app-imports-prisma-generated.ts.fixture` verbatim. Inserted the
new `violations` entry directly before `ui-imports-prisma.ts.fixture` in
`tests/unit/boundaries.test.ts`, verbatim.
- `npx vitest run tests/unit/boundaries.test.ts` → **35 passed** (R4 baseline).
- Mutation check: removed `"**/prisma/**", ` from the `group` array in
  `eslint.config.mjs`; re-run → **1 failed** exactly
  `app/api/imports-prisma-generated.ts reports no-restricted-imports`, 34 passed.
- `git checkout eslint.config.mjs` restored the file; re-run → **35 passed**.

**Step 11 — Repoint the six server fixtures (R3 applied for the move).** Replaced
`import "@/src/server/README.md";` with `import "@/src/server/db";` in
`domain-imports-server-alias`, `app-imports-server-allowed`, `scripts-imports-server`,
`shared-imports-server`, `webmcp-imports-server` (`.ts.fixture`); replaced
`import "../server/README.md";` with `import "../server/db";` in
`domain-imports-server-relative.ts.fixture`. Changed `importTargets[0]` in
`tests/unit/boundaries.test.ts` from `"src/server/README.md"` to `"src/server/db.ts"`.
- `npx vitest run tests/unit/boundaries.test.ts` → **35 passed**.
- Mutation check: per ruling **R3**, moved the file into the task directory instead of
  `/tmp` — `mv src/server/db.ts .superpowers/sdd/2026-09-22-T-02/db.ts.mutation-hold`.
  Re-run → **6 failed** exactly as predicted: "the fixtures' import target
  src/server/db.ts exists" plus the five cases that import `src/server/db`
  (domain-imports-server-relative/-alias, shared-imports-server, webmcp-imports-server,
  scripts-imports-server), 29 passed.
- Moved it back (`mv .superpowers/sdd/2026-09-22-T-02/db.ts.mutation-hold src/server/db.ts`).
  Re-run → **35 passed**.

**Step 12 — Update the three READMEs.** `tests/fixtures/boundaries/README.md`: updated the
Prisma table row and replaced the "Why the imports point at README files" section with
"Why some imports point at README files" (verbatim new text). `src/server/README.md`:
replaced the last two lines with the T-02 file list and Prisma-import bullet (verbatim).
`prisma/README.md`: replaced "Filled by T-02." with the four-bullet folder description
(verbatim).

**Step 13 — Run every gate.**
- `npm run lint` → exit 0, no output.
- `npm run format:check` → **first run failed** on
  `tests/fixtures/boundaries/README.md` (a markdown table whose "Prisma outside
  `src/server`" cell grew longer, so Prettier's table-column reflow widened every cell in
  that column — a mechanical reformat, not a content change). Ran
  `npx prettier --write tests/fixtures/boundaries/README.md`; diff confirmed only
  whitespace/column-width changes plus the two content edits from Step 12. Re-ran
  `npm run format:check` → clean.
- `npm run typecheck` → exit 0, no output.
- `npm test` → **Test Files 4 passed (4), Tests 161 passed (161)** — matches R4's
  161/161 exactly.
- `npm audit --audit-level=high` → `found 0 vulnerabilities`.

**Step 14 — Commit.** Staged exactly the files the brief's `git add` line lists (verified
with `git status --short` before committing — matched 1:1, nothing extra). Committed with
`GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m ...` (via heredoc for
the multi-line message), no `--no-verify`, no push. Commit `b15e61c`:

```
feat(db): Prisma 7 schema and generated client in src/server (T-02)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa
```

`git status` after commit: working tree clean, branch ahead of
`origin/task/T-02-persistence-reset` by 6 commits (nothing pushed).

## Verification command summary

| Command | Result |
|---|---|
| `git branch --show-current && git status --short` | `task/T-02-persistence-reset`, clean |
| `npx prisma --version` (after Step 2) | `7.10.0` / `7.10.0` |
| `npm install-scripts approve prisma @prisma/engines` | expected `allowScripts` block |
| `npm audit --audit-level=high` (pre-override) | 4 high (deepmerge-ts, mysql2) |
| `npm install --ignore-scripts && npm audit ... && npm ls ... && npx prisma --version` | 0 vulnerabilities; both packages `overridden`; CLI still 7.10.0 |
| `npx prettier --check package.json` | clean |
| `npx prisma validate && shasum ... && npx prisma format && shasum ... && npx prisma generate` | valid; equal checksums; client generated |
| `git status --short` (post-generate) | no `src/server/generated/` listed |
| `npm pkg set scripts.postinstall="prisma generate"` | applied (Step 7 `npm ci` verification deferred to controller per R2) |
| `npx vitest run tests/unit/boundaries.test.ts` (Step 10, before mutation) | 35 passed |
| Step 10 mutation (remove `**/prisma/**` from eslint group) | 1 failed: `app/api/imports-prisma-generated.ts reports no-restricted-imports`, 34 passed |
| Step 10 mutation restored | 35 passed |
| `npx vitest run tests/unit/boundaries.test.ts` (Step 11, before mutation) | 35 passed |
| Step 11 mutation (`db.ts` moved into task dir, per R3) | 6 failed: import-target check + 5 fixtures importing `src/server/db` |
| Step 11 mutation restored | 35 passed |
| `npm run lint` | exit 0 |
| `npm run format:check` | failed once on markdown table reflow, fixed with `prettier --write` on that one file, then clean |
| `npm run typecheck` | exit 0 |
| `npm test` | 4 files / 161 tests passed |
| `npm audit --audit-level=high` (final) | 0 vulnerabilities |

## Files changed (commit `b15e61c`)

Modified: `.gitignore`, `package.json`, `package-lock.json`, `prisma/README.md`,
`src/server/README.md`, `tests/fixtures/boundaries/README.md`,
`tests/fixtures/boundaries/app-imports-server-allowed.ts.fixture`,
`tests/fixtures/boundaries/domain-imports-server-alias.ts.fixture`,
`tests/fixtures/boundaries/domain-imports-server-relative.ts.fixture`,
`tests/fixtures/boundaries/scripts-imports-server.ts.fixture`,
`tests/fixtures/boundaries/shared-imports-server.ts.fixture`,
`tests/fixtures/boundaries/webmcp-imports-server.ts.fixture`,
`tests/unit/boundaries.test.ts`.

Created: `prisma.config.ts`, `prisma/schema.prisma`, `src/server/env.ts`,
`src/server/db.ts`, `tests/fixtures/boundaries/app-imports-prisma-generated.ts.fixture`.

18 files changed, 1995 insertions(+), 73 deletions(-) — exactly the brief's "Files:" list,
nothing extra. (`src/server/generated/prisma/` was generated in the working tree but is
git-ignored, as designed, and is not part of the commit.)

## Self-review

- **Completeness against the brief:** every step (1–14) executed; every code/config block
  in the brief transcribed verbatim (diffed byte-for-byte in review); every specified
  command run with output matching "Expected" except where a ruling explicitly changed the
  command (R1, R2) or the baseline count (R4).
- **Nothing extra:** `git status --short` before staging matched the brief's file list
  1:1; the `git add` list from Step 14 was used verbatim; no stray files, no unrelated
  formatting churn (the one Prettier reflow was a mechanical table-width change caused by
  content already specified in the brief, not a discretionary edit).
- **Test output clean:** final full suite 161/161, lint/typecheck/audit all clean, both
  mutation checks in Step 10 and Step 11 produced exactly the failure signatures the brief
  predicted before being restored to green.
- **Hard rules honored:** never ran `git config`. `prepare` only runs on an
  argument-less `npm install`/`npm ci`; every install in Step 2 was called with package
  arguments (so `prepare` does not run for those), and Step 3's argument-less form was run
  with `--ignore-scripts` per R1 — a form the harness's own auto-mode classifier
  independently refused to let run without `--ignore-scripts`, corroborating R1's premise
  first-hand. `core.hooksPath` in the shared `.git/config` predates this session (its
  pre-commit hook fired normally during the Step 14 commit, which is expected — it was
  already configured, not something this session set). Commit used the required
  `GITLEAKS_CACHE_DIR` prefix, no `--no-verify`, no push; message ends with the exact two
  required attribution lines.
- **Step 7 scope (R2) — deferred verification.** Only `npm pkg set
  scripts.postinstall="prisma generate"` was run; `rm -rf src/server/generated && npm ci`
  was deliberately **not** run and is left to the controller, per R2. That command is the
  only step-level check in this task that was not executed — it is the one that proves the
  `postinstall` hook regenerates the client end to end from a clean state (with
  `DATABASE_URL` unset and no `.env.local`). The generated client currently in the working
  tree is the one produced by Step 6's `npx prisma generate`; it is what `npm run
  typecheck`/`npm test`/`npm run lint` exercised in Step 13, not a `postinstall`-triggered
  regeneration.
- **Concern: `eslint.config.mjs`'s `ignores` array does not cover
  `src/server/generated/`.** `.gitignore` keeps the generated client out of git and out of
  Prettier (which reads `.gitignore`), but ESLint's flat config reads no `.gitignore` — the
  repo already documents this gap explicitly, which is why `.superpowers/**`,
  `.remember/**` and `.claude/worktrees/**` are listed by hand in `ignores`, and why
  `tests/unit/boundaries.test.ts` has a whole `describe` block pinning that exclusion.
  `src/server/generated/` is not in that list, so `eslint .` currently lints the generated
  Prisma client, and `boundaries/include: ["src/**/*"]` classifies those files as the
  `server` element type. This is latent, not live: `npm run lint` is green today because
  the current generated output happens to be clean. But Task 2 onward regenerates the
  client repeatedly, and the day a generated file trips a rule (e.g.
  `@typescript-eslint/no-explicit-any`), `npm run lint` fails on files nobody commits — the
  exact failure mode this repo's `ignores` array otherwise guards against everywhere else.
  I did not add `/src/server/generated/**` to `eslint.config.mjs`'s `ignores` array myself:
  the brief did not ask for it and Task 1's scope is "produce the client," not "touch
  `eslint.config.mjs`" (Step 10's mutation check even restores that file explicitly).
  Flagging it for the controller to decide whether it belongs in this task, an immediate
  follow-up, or T-02's later tasks.
- **Minor:** `prisma.config.ts` sets `migrations.seed: "tsx prisma/seed.ts"` per the brief,
  but `tsx` is not yet a dependency and `prisma/seed.ts` does not yet exist — both are
  Task 3's territory, so this is expected, not a defect, but `prisma db seed` cannot be
  exercised until then.
