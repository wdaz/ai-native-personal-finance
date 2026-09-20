---
name: code-review
description: Review conventions for this repository — where the binding documents live, the ADR-0002 import boundaries, the evidence standard a finding has to meet, and the deliberate choices that should not be reported as defects. Use when reviewing any pull request in this repository.
---

# Reviewing this repository

A personal-finance app built document-first: the specification is written and
approved before the code, and the documents under `docs/` are the authority a
review argues from. `AGENTS.md` is the entry point and gives the reading order.

| Question | Document |
| -------- | -------- |
| What may an agent decide, and who merges? | `docs/04-process/governance.md` |
| What is architecturally settled? | `docs/02-architecture/adr/` (Accepted ADRs bind) |
| When is a task finished? | `docs/03-specs/definition-of-done.md` |
| What is this task supposed to do? | `docs/03-specs/backlog.md`, by task id |

A finding that contradicts an Accepted ADR is only useful if it cites the ADR
and argues against it explicitly. Silent divergence is what the process exists
to prevent.

## The evidence standard

**Do not assert a runtime consequence you have not verified.** When a concern
depends on what happens at run time — a build breaking, a check not firing, a
type not resolving — and the review cannot execute it, phrase the finding as a
question and name the command that would settle it. "`tsc --noEmit` will fail
once `.next/` is absent" is a claim. "Would `tsc --noEmit` still pass with
`.next/` absent?" is a finding the author can act on, and it costs nothing if
the answer is yes.

This is not a style preference. Four defects reached the end of task T-01
precisely because they were invisible to reading and only surfaced when
something was run:

- The ESLint boundary rules silently enforced nothing, three separate times,
  while `eslint` exited 0 each time — a missing element `mode`, a `/**/*`
  pattern that classified every source file as unknown, and an import resolver
  installed only in a nested `node_modules`, which quietly reclassified every
  `@/`-aliased cross-layer import as an external package.
- `eslint-config-next/typescript` was never spread into the flat config, so all
  nineteen `@typescript-eslint` rules sat at severity 0.
- A design-token test compared token *names* rather than values, so changing
  `--spacing-50` from `4px` to `400px` still passed.
- A confident but wrong claim about npm's `allowScripts` was written into a code
  comment; npm's own source disproved it.

Each was caught by re-deriving the evidence rather than by reading the diff. The
Definition of Done now requires that any new lint rule, config guard or
document-mirror test ship with a fixture that deliberately violates it and a
test asserting the violation is reported — a rule is not verified until it has
failed on purpose. **A PR that adds such a rule without that fixture is a
finding.**

## Hard rules worth checking

**ADR-0002 layering.** Enforced by `eslint-plugin-boundaries`; check that new
code does not need an exception.

| Layer | May import |
| ----- | ---------- |
| `src/domain` | `src/shared` only — never `app`, `server`, `webmcp` |
| `src/shared` | nothing from the other layers |
| `src/server` | `domain`, `shared`; the only layer that may touch Prisma |
| `src/webmcp` | `shared` only; reaches data through the HTTP API |
| `app` | `server`, `domain`, `shared`, `ui`; never Prisma directly |
| `scripts` | `shared` and `domain` only |

**ADR-0005.** No `new Date()` or `Date.now()` in `src/domain` or `src/server`
business code — inject a clock, so time is testable.

**Money is integer cents** in code and in the database, formatted only at the
edge. A `number` holding a fractional amount, a `parseFloat`, or a `* 100`
conversion in the middle of a calculation is a finding.

**Validation** uses the shared Zod schemas on client, server and tools. User-
facing copy comes from `src/shared/copy.ts`, which mirrors the user-stories
appendix — inline strings in components are a finding.

**Tests** (ADR-0003): unit tests for new `domain`/`shared`/`webmcp` functions;
API tests for new or changed routes including the 401 path; at least one E2E per
story touched, its title starting with the story id; role and label locators,
never `.first()`, never a time-based wait.

## Governance

`governance.md` states plainly: *Merging — Owner: Only, Agent: Never.* Do not
approve pull requests and do not recommend merging. Report what you found and
leave the decision to the owner. Noting that a Definition of Done item looks
unmet is in scope; declaring the PR ready is not.

## Deliberate choices — not defects

These recur in reviews. They are intentional and documented; reporting them
costs the author a round-trip.

- **`tests/fixtures/boundaries/*.ts.fixture`.** The double extension is what
  keeps deliberately-illegal source out of `eslint .`, `tsc`, Prettier and
  Vitest's include globs. The tests feed each file to `ESLint#lintText` with a
  fake `filePath`.
- **Those fixtures import `README.md` files.** `boundaries/dependencies`
  classifies an import by what it resolves to, and an unresolved import is
  treated as external and allowed. `src/server` and `src/domain` hold no modules
  until T-02 and T-04, so the fixtures import the only files that exist there.
  The folder's own README explains this and says to repoint them later.
- **`next-env.d.ts` imports `./.next/types/*`, which is git-ignored.** The file
  is generated by Next.js and says it must not be edited. `tsconfig.json` sets
  `skipLibCheck: true`, so this does not affect `tsc --noEmit`; verified locally
  with `.next` absent and in CI on `ubuntu-latest`, where `.next` has never been
  created at the point the typecheck step runs.
- **`tsconfig.json` includes both `.next/types/**/*.ts` and
  `.next/dev/types/**/*.ts`.** Next uses one or the other depending on whether
  `build` or `dev` ran last; an include pattern matching no file is not an error.
- **`DEMO_PASSWORD_DISPLAY` is rendered on the login page.** That is the point —
  ADR-0006 and NFR-S1 require the demo credentials to be visible. It is not a
  leaked secret.
- **Near-empty `README.md` files under `src/` and `app/`.** They are the
  ADR-0002 layer markers and each names the import rule binding that layer.

## Commands

```
npm run lint        # eslint --max-warnings 0, includes the ADR-0002 boundaries
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run test:all    # lint, format, typecheck, unit, api, e2e
```
