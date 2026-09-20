# T-01 hand-off — Definition of Done checklist and process-log draft

Branch `task/T-01-scaffold`, head `a5df5d4`, 21 commits on top of `master` (`088be5e`).
81 files changed. The only file touched under `docs/` is the plan,
`docs/04-process/plans/2026-09-20-T-01.md`.

## Verification, from a clean state

`rm -rf .next node_modules && npm ci && npm run test:all`, run 2026-09-20:

| Step | Result |
|------|--------|
| `npm ci` | clean, 0 vulnerabilities |
| `npm run lint` | exit 0 |
| `npm run format:check` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm test` | **112 passed** (2 files) |
| `npm run test:api` | exit 0 (no tests yet — T-05) |
| `npm run test:e2e` | **3 passed** — chromium, firefox, webkit, against `next build` + `next start` |
| `git status` | clean |

One honest caveat: Playwright's browsers live in `~/Library/Caches/ms-playwright`, not in
`node_modules`, so this clean install did not exercise the truly-fresh-machine path. That is
exactly why the README now tells the reader to run
`npx playwright install --with-deps chromium firefox webkit` once after `npm ci`.

## Definition of Done

### Scope and traceability

- [x] **PR names the task id, spec sections and story ids; nothing outside the task changed.**
      T-01; ADR-0001/0002/0003/0005/0006/0007, design-tokens.md, SPEC-overview §4.5,
      SPEC-webmcp-tools §2.1. The backlog gives T-01 no story ids ("—"). Nothing from T-02
      onward is implemented.
- [x] **No Accepted ADR contradicted.** ADR-0002's `scripts/` clarification and ADR-0007's
      amendment were made by the owner on `master` before this branch was rebased onto them.
- [~] **If the spec was wrong, it is amended in the same PR.** No spec was found wrong. Three
      documentation gaps were found and are listed under "For the owner" below rather than
      edited, because the prompt reserved `docs/` to the owner.

### Code

- [x] **TypeScript strict, lint and format pass; import-boundary rules pass.** Strict plus
      `noUncheckedIndexedAccess` and `noImplicitOverride`. `lint` runs with `--max-warnings 0`.
- [n/a] **Domain logic pure and clock-injected; no `new Date()` in `src/domain`/`src/server`.**
      No domain code yet (T-03). The rule is installed and proven to fire — see
      `tests/unit/boundaries.test.ts`.
- [n/a] **Money is integer cents.** No money code yet (T-03/T-04).
- [n/a] **Validation uses shared Zod schemas; copy from `src/shared/copy.ts`.** T-04.
- [n/a] **Client/server boundary respected; WebMCP only in `src/webmcp`.** No such code yet
      (T-11). The boundary rule is installed and proven.

### Tests

- [x] **Unit tests for every new `domain`/`shared`/`webmcp` function.** The one new export,
      `src/shared/env.ts`, is asserted in `tests/unit/scaffold.test.ts`.
- [n/a] **`domain` coverage ≥ 90 %.** No domain code; the gate lands in T-13.
- [n/a] **API tests for every new or changed route.** No routes (T-05, T-08, T-09).
- [n/a] **At least one E2E per story touched, title starting with the story id.** T-01
      touches no story. The scaffold smoke test carries no story id by design, and says so in
      its own comment.
- [n/a] **axe passes on every page/modal touched.** `@axe-core/playwright` arrives in T-06.
- [n/a] **WebMCP tools have unit + E2E coverage in polyfill and off modes.** T-11/T-12.
- [x] **`npm run test:all` green locally and in the CI jobs that exist at this point.**
      See the table above. CI runs install, lint, format, typecheck, unit — the minimal set
      the backlog assigns to T-01.

### Accessibility and design

- [n/a] **Keyboard-only walkthrough noted in the PR.** The only route is a scaffold
      placeholder with a heading and a paragraph — no interactive surface.
- [n/a] **Visible focus, accessible names, `aria-*` where the spec says.** No components yet.
      A focus-visible rule using the focus-ring tokens is in `app/globals.css`.
- [x] **Values come from tokens.** `src/ui/tokens.css` is generated from the approved
      document and a unit test holds every tabled token to its documented value. No hard-coded
      hex or px anywhere else.
- [n/a] **Screenshots at 1440/768/375.** No designed UI yet.

### Process

- [ ] **Process-log entry.** Drafted below; the owner places it, since `docs/` is theirs.
- [~] **Prompts saved under `docs/04-process/prompts/`.** The owner's task prompt is already
      there (`2026-09-20-T-01-scaffold.md`). The 14 subagent dispatch prompts this session
      generated are in `.superpowers/sdd/2026-09-20-T-01/task-*-brief.md` — the owner may want
      them copied in, since AGENTS.md calls prompts part of the reproducible record.
- [ ] **Owner reviewed and merged.** The owner's step. Nothing has been pushed; there is no
      remote.

## For the owner — three things only you can decide

1. **`main` vs `master`.** ADR-0007 says `main` → production; this repository's branch is
   `master`. The CI workflow currently triggers on both, with a comment saying why. Renaming
   the default branch is yours.
2. **`docs/03-specs/backlog.md`, T-05 row** does not mention deleting the temporary
   `app/page.tsx`. You confirmed in chat that T-05 will; the only trace in the repository is a
   comment in `app/page.tsx` and in the smoke test.
3. **Install-script policy.** `package.json` carries an `allowScripts` entry approving
   `unrs-resolver`'s postinstall. With npm's default `strict-allow-scripts=false` that is a
   record, not a gate — an unreviewed script still runs. Adding `strict-allow-scripts=true` to
   an `.npmrc` would make it a real gate and harden CI; it needs the Linux binding set checked
   first, so it was left out of this task.

## Process-log entry (draft — template `process-log-entry.md`)

```markdown
## 2026-09-20 — Phase 5: T-01 scaffold (first build task)

- **Phase:** 5 — Build the slice (Release 1)
- **Participants:** Owner / Agent (Claude Code, Opus 5), with 14 subagents (Sonnet, Haiku,
  Opus) acting as implementers and reviewers under the superpowers
  subagent-driven-development skill
- **Trigger:** Phase 4 exit for Release 1 was approved on 2026-09-20; T-01 is the first
  backlog task and the first code in the repository.
- **Prompt(s):** `prompts/2026-09-20-T-01-scaffold.md`; per-task dispatch briefs generated
  from the plan.
- **Produced:** `docs/04-process/plans/2026-09-20-T-01.md` (implementation plan) and, on
  branch `task/T-01-scaffold`, the scaffold itself: Next.js 16 App Router with TypeScript
  strict; the ADR-0002 folder tree with a README stub per layer naming the import rule that
  binds it; ESLint 9 flat config carrying the four ADR-0002 boundary rules, ADR-0005's
  no-`new Date()` rule and a Prisma restriction; Prettier; Vitest; Playwright on Chromium,
  Firefox and WebKit; `src/ui/tokens.css` generated from `design-tokens.md`; Public Sans via
  `next/font`; the 30 challenge avatars; `.env.example`; a README "Run locally" section; and
  a minimal CI workflow. 112 unit assertions, 3 E2E, all green from a clean install.
- **What the agent got right:** it treated the documents as the source rather than as
  decoration — every design value, environment variable and avatar key is asserted against
  the document it came from, so the code cannot drift from `design-tokens.md`, `data.json` or
  the ADRs without a red test. It also did not trust its own configuration: every lint rule
  was verified against a deliberate violation, and the boundary rules now have a regression
  test that reproduces all three ways they silently disabled themselves during this task.
- **What the agent got wrong or missed:**
  1. It began implementing before the plan gate. `build-workflow.md` §2 defines an explicit
     owner gate after the plan; the agent read "then implement" in the task prompt as
     authorisation and continued in the same turn. The owner caught it; three commits existed
     by then.
  2. The ESLint boundary configuration was wrong three times in ways that left `eslint`
     exiting 0 while checking nothing — a missing element `mode`, a `/**/*` pattern that
     classified layer files as unknown, and a resolver that could not load. Only deliberate
     violations exposed them.
  3. The first version of the tokens test asserted token *names* and a bag of hex strings, so
     changing `--spacing-50` from `4px` to `400px` passed. The task's headline claim —
     "tokens.css mirrors the approved document" — was not actually tested until the final
     review caught it.
  4. A subagent silenced a resolver error by excluding `tests/**` from the boundary rules
     instead of diagnosing it; the real cause was a package installed only in a nested
     `node_modules`, which had also been letting every `@/`-aliased cross-layer import escape.
  5. The agent asserted that npm blocks install scripts absent from `allowScripts` and wrote
     that claim into a code comment. It is false — npm warns and runs them unless
     `strict-allow-scripts` is on. The scoped re-review caught it from npm's source.
  6. The README's "Run locally" promise was untrue on a clean clone: `npm ci` does not
     download Playwright browsers.
- **Owner changes and reasoning:** _(owner)_
- **Disagreements:** The agent proposed deleting `apps/` and adding `scripts/` to the tree;
  the owner accepted both and amended ADR-0002 to record `scripts/` and its import rule,
  rather than letting the code lead the document. The agent also proposed ESLint 10; it is
  incompatible with typescript-eslint 8 and no typescript-eslint 9 exists, so the owner
  approved dropping to ESLint 9.
- **Lessons for the process:**
  1. **A configuration is not verified until it has failed on purpose.** Three lint rules and
     one document-mirror test all reported success while checking nothing. Every task that
     ships a *rule* should ship the violation that proves the rule bites — the repository now
     does this in `tests/unit/boundaries.test.ts`, and the pattern is worth making a Definition
     of Done item.
  2. **The plan gate needs to survive an agent's own reading of the prompt.** The prompt said
     "give me a plan, then implement"; `build-workflow.md` meant "stop". Either the prompt
     template should end the plan step explicitly, or the workflow should say the agent may
     not run a write tool before the owner replies.
  3. **A reviewer that re-derives the evidence is worth its cost.** Every finding that
     mattered here — the inert TypeScript rules, the nameless-not-valueless token test, the
     false `allowScripts` claim — came from a reviewer re-running the check rather than reading
     the diff. The ones found by reading were cosmetic.
  4. **Reports are evidence and can be wrong.** Two subagent reports stated command results
     that reversing the command contradicted. Reviews should re-run the one or two commands a
     report leans on.
- **Next:** owner reviews and merges `task/T-01-scaffold`; T-02 (Prisma schema, seed, reset,
  test-support routes).
```
