# Node 24 (PR #57) — subagent brief and report: whole-branch review

Dispatched: Agent tool, `subagent_type: feature-dev:code-reviewer` (tools: read, grep, glob,
web fetch — no write, no shell), `model: opus` (governance.md v1.3), background, against branch
`chore/node-24` at `4f3d450`. Brief and report are copied word for word below, re-wrapped to the
repository's line width, with the report's headings one level down. What the main session did
with each finding is in `process-log.md` ("Phase 5: before T-14 — the deploy accounts, and Node
24", and its addendum) and commit `ee8c345`.

## Brief (verbatim)

Adversarial, read-only review of a small change in the repository at
/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/chore-node-24 (branch
`chore/node-24`, base `59e7a68` = origin/main). You have read-only tools; do not attempt to write
anything or run git. Read `AGENTS.md` first for the project's rules.

The change moves the project's Node runtime from 26 to 24, because Vercel (the deploy target,
ADR-0007) builds and runs only Node 24.x/22.x/20.x, and Node 26 is not LTS until 2026-10-28.
Owner-approved. Three commits:

1. `tests/unit/node-version.test.ts` (new): asserts `.nvmrc` major ∈ [20,22,24] (Vercel's list,
   cited with URL + read date), `package.json` `engines.node` === `${major}.x`, `@types/node`
   range starts with `^${major}.`. Claimed to have failed first on the old tree (26) with
   `expected [ 20, 22, 24 ] to include 26` and `expected '>=26' to be '26.x'`, then pass after the
   change.
2. `.nvmrc` (26 → 24), `package.json` (`engines.node` ">=26" → "24.x"; `@types/node` "^26.6.2" →
   "^24.13.6"), `package-lock.json` (claimed: only root engines/devDeps, `node_modules/@types/node`
   26.6.2→24.13.6, and `node_modules/undici-types` 8.9.0→7.18.2 changed), `README.md` "Run
   locally" paragraph.
3. `docs/03-specs/backlog.md` v1.40 (Status line changelog; T-14 row "on Vercel's Node 24 image
   …"; T-16 row "whatever ships with Node 24.x (`.nvmrc` is `24` since v1.40)") and a new entry at
   the END of `docs/04-process/process-log.md` ("## 2026-09-25 — Phase 5: before T-14 — the deploy
   accounts, and Node 24").

Check, with evidence (file:line), and report only real problems ranked by severity:

- Correctness of the test: does it actually enforce what it claims? Edge cases in parsing
  `.nvmrc` (e.g. `v24`, `24.20.0`, trailing newline) and the `@types/node` regex (e.g. would
  `^240.0.0` wrongly match? would `~24.1.0` or `24.13.6` fail — is that intended?). Does it follow
  the style of sibling tests in `tests/unit/` (e.g. `next-config.test.ts`)?
- Anything else in the repo that still assumes Node 26 and would now be wrong (search:
  `.github/workflows/*.yml`, `scripts/`, `tests/`, `README.md`, `docs/` excluding historical
  plans/prompts/process-log entries which must NOT be edited, any `node:26` Docker references,
  `@types/node` usages, Node APIs used in `src/`, `scripts/`, `prisma/`, config files that exist
  only in Node ≥25/26 — e.g. check `process.loadEnvFile` usage in `prisma.config.ts` is available
  in 24).
- Whether `engines.node: "24.x"` interacts badly with anything (e.g.
  `tests/unit/install-scripts.test.ts` which copies package.json and runs `npm ci --dry-run`; CI's
  setup-node with `node-version-file: .nvmrc`).
- Docs: is the backlog Status-line entry consistent with the file's existing changelog style? Are
  the process-log entry's factual claims consistent with the repo (e.g. file names, versions,
  counts it quotes are plausible and internally consistent; it must follow
  `docs/templates/process-log-entry.md`'s fields)? Does it leak anything that should not be in a
  public repo (personal emails, account usernames, secrets)? Verify the two cited Vercel/Node facts
  if you can via WebFetch: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions and
  https://raw.githubusercontent.com/nodejs/Release/main/schedule.json.
- Anything the change forgot that a reviewer would expect (e.g. a lint/format rule, a DoD item in
  `docs/03-specs/definition-of-done.md`).

Output: a short list of findings, each with severity (Critical/Important/Minor), file:line, the
evidence, and a suggested fix. If you find nothing Important or Critical, say so explicitly. Do not
pad.

## Report (verbatim)

### Review of `chore/node-24` (base 59e7a68): Node runtime moves from 26 to 24

I found no Critical issues. There is one Important finding and five Minor ones. Nothing was
written and git was not run.

#### Important

**1. The new config guard has no violation fixture, which DoD v1.1 requires. One of its three
checks has never been seen to fail. (confidence 85)**

- Rule:
  `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/chore-node-24/docs/03-specs/definition-of-done.md:18`
  says: "Any new lint rule, config guard or document-mirror test ships with a fixture that
  deliberately violates it and a test asserting the violation is reported — a rule is not verified
  until it has failed on purpose."
- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/chore-node-24/tests/unit/node-version.test.ts:24-38`
  has only positive assertions. Its sibling guards each ship a failing case:
  - `next-config.test.ts:43,76,93,153` ("violation fixture, DoD v1.1")
  - `pr-template.test.ts:35-57` ("(fixture) …")
  - `coverage-gate.test.ts:40`
  - `install-scripts.test.ts:66,73`
- The "failed first" evidence (process-log.md:4814-4815) covers only two of the three checks. On
  the old tree `@types/node` was `^26.6.2` and `.nvmrc` was `26`. The pattern at line 36 becomes
  `/^\^26\./`, which matches `^26.6.2`, so that assertion passed on the old tree. The `^240.0.0`
  edge case is only correct by reasoning, not by a test.
- Fix: move the `.nvmrc` parse (line 17) and the two package.json checks (lines 32 and 36) into
  small pure functions. Then add `(fixture)` cases:
  - `"26\n"` gives a major that is not in `VERCEL_NODE_MAJORS`.
  - `"v24.20.0\n"` parses to 24, and `"lts/*"` gives NaN and is rejected.
  - `">=24"` and `"^24.0.0"` are rejected for engines.
  - `"^26.6.2"` and `"^240.0.0"` are rejected for `@types/node`.

#### Minor

**2. The process log says the npm floor "holds", but nothing shows that for Vercel.**

- Where:
  `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/chore-node-24/docs/04-process/process-log.md:4845-4847`,
  "Node 24.21.0 bundles npm 11.19.0 (nodejs.org/dist/index.json), so `engines.npm >=11.19` and
  `strict-allow-scripts` hold". The backlog T-14 row (`backlog.md:226`) adds "(v1.40; Node 24.21.0
  bundles npm 11.19.0, exactly that floor)".
- The bundling fact is correct. In index.json, 24.20.0 is the first 24.x with npm 11.19.0; 24.19.0
  has 11.17.0.
- For Vercel it is only an inference:
  - Vercel's version page says "Only major versions are available. Vercel automatically rolls out
    minor and patch updates when needed", so its 24.x minor is Vercel's choice.
  - Vercel's package-managers page lists npm "8, 9, 10" and has no Node 24 row.
  - The Node 24 changelog (2025-11-25) says only "an updated version of npm" (npm v11, no minor
    given).
- The T-14 row keeps "read Vercel's install log … and confirm the npm version", so the safeguard
  is still there. Only the conclusion in the log goes too far.
- Fix: reword to "holds on CI and locally (≥ 24.20.0); unverified on Vercel, whose 24.x minor and
  npm are Vercel's; T-14 reads the install log".

**3. CI now takes the runner's cached 24.x instead of the newest release. It is fine today.**

- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/chore-node-24/.github/workflows/ci.yml:37-40,101-104,164-167,217-219`
  use `node-version-file: .nvmrc` without `check-latest`. setup-node therefore uses a matching
  toolcache version first.
- Node 26 was never in the Ubuntu toolcache, so CI used to download the newest 26.x. Node 24 is
  cached.
- Runner image 20260920.314.1 caches 24.21.0 (npm 11.19.0), so CI is fine today.
- If an image ever carries a 24.x below 24.20, `install-scripts.test.ts` case 2
  (ESTRICTALLOWSCRIPTS) fails loudly, so this cannot fail silently.
- Optional fix: `check-latest: true`, or nothing.

**4. `VERCEL_NODE_MAJORS` includes 20, which this repo's dependencies reject and Vercel is about
to block.**

- Where:
  `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/chore-node-24/tests/unit/node-version.test.ts:14`.
- Dependency evidence from package-lock.json:
  - `iron-session` (prod) needs `"node": ">=22.13.0"` (line 7272).
  - `jsdom` and `@asamuzakjp/*` need `^22.22.2 || ^24.15.0 || >=26.0.0` (lines 66, 92, 7850).
- Vercel's changelog (2026-07-14) says: "we are deprecating Node.js 20 for Builds and Functions on
  October 1, 2026". That is six days from now.
- So the guard would accept `.nvmrc` = 20, which is broken for this repo.
- Fix: use `[22, 24]` and cite the deprecation changelog. Alternatively, keep the list as a copy
  of Vercel's page and add a separate floor check.

**5. An exact `@types/node` pin fails a check whose name says it only compares the major.**

- Where: `node-version.test.ts:36`. The pattern `^\^24\.` rejects `24.13.6` and `~24.1.0`,
  although the test is named "describes the same major". The repo does exact-pin some
  dependencies (`prisma`/`@prisma/*` 7.10.0 in package.json).
- Fix: `new RegExp(`^[\\^~]?${nvmrcMajor}\\.`)`. Either way `^240.0.0` is correctly rejected.

**6. "back to 26 once Vercel offers it" is a plan nobody tracks.**

- Where: `backlog.md:6`.
- No owner quote in the process-log entry backs it, and no task or TD item will trigger it. The
  test comment's "re-read that page" rule is the only reminder.
- Fix: either attribute it to the owner or drop it, or make it a tracked item.

#### Checked and clean

- **No remaining Node 26 assumptions outside historical entries.** I searched `.github/`,
  `scripts/`, `tests/`, `src/`, `prisma/`, config files, `.claude/`, `README.md` and
  non-historical `docs/`. The only hits are old process-log entries and `node:26` measurements
  that are labelled as such. There are no Docker `node:26` references. `vercel.json` has no
  runtime key, and `codeql.yml` does not set up Node.
- **Node APIs.** `process.loadEnvFile` (`prisma.config.ts:7`, `playwright.config.ts:18`),
  `import.meta.main` (`scripts/seed-figures.ts:104`, needs ≥ 24.2) and `path.matchesGlob`
  (`coverage-gate.test.ts:3`) all exist in 24.x. All three are typed in the installed
  `@types/node` 24.13.6 (`module.d.ts:661`, `process.d.ts:1471`, `path.d.ts:105`). tsconfig `lib`
  is ES2022. No main dependency's engines excludes 24.x (next ≥20.9, @prisma/client ≥24.0).
- **Lockfile.** `@types/node` 24.13.6 and `undici-types` 7.18.2 sit at the same line numbers as in
  the main checkout's 26.6.2 / 8.9.0 lockfile, which is consistent with a minimal diff.
- **`install-scripts.test.ts`.** Not affected by `"24.x"`. `.npmrc` has no `engine-strict`, and
  `childEnv()` plus the empty user and global npmrc keep it off. A mismatch only gives an
  EBADENGINE warning.
- **Test parsing.** `.nvmrc` values `24\n`, `v24` and `24.20.0` all parse to 24, and an alias
  gives NaN, which fails the check. The style matches its siblings (`import.meta.dirname`, a JSDoc
  citing the ADR). The engines comment matches Vercel's precedence table (`>=20.0.0` resolves to
  the latest 24.x).
- **Docs.** The v1.40 Status-line entry matches the v1.36–v1.39 style. The process-log entry has
  every field in `docs/templates/process-log-entry.md`, and its extra fields have precedent
  (`process-log.md:1764`, `:3574`). "82 files" matches the 82 `tests/unit/**/*.test.{ts,tsx}`
  files. "Four weeks from LTS" matches 2025-10-28 to 2025-11-25.
- **Leaks.** None found: no emails, usernames, secrets or tokens. The Neon project ID
  `solitary-truth-56663324` (line 4824) is an identifier, not a credential.
- **The two cited facts are verified.** Vercel lists "24.x (default), 22.x, 20.x". schedule.json
  gives v26 `"lts": "2026-10-28"`.

Sources:

- [nodejs.org/dist/index.json](https://nodejs.org/dist/index.json)
- [Vercel: Supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel: Package Managers](https://vercel.com/docs/package-managers)
- [Vercel changelog: Node.js 24 LTS is now generally available (2025-11-25)](https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions)
- [Vercel changelog: Node.js 20 is being deprecated (2026-07-14)](https://vercel.com/changelog/node-js-20-is-being-deprecated)
- [Vercel KB: latest npm version](https://vercel.com/kb/guide/how-do-i-use-the-latest-npm-version-for-my-vercel-deployment)
- [nodejs/Release schedule.json](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json)
- [actions/runner-images Ubuntu 24.04 readme](https://raw.githubusercontent.com/actions/runner-images/main/images/ubuntu/Ubuntu2404-Readme.md)
