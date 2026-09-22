# Task 1 review — spec + quality (feature-dev:code-reviewer, sonnet, read-only)

Range 0eec801..b15e61c. Copied verbatim from the reviewer's hand-back by the controller (read-only reviewers cannot write files).

## Reviewing: Task 1 — Prisma 7 toolchain, schema and generated client (T-02)
Diff 0eec801..b15e61c, against task-1-brief.md and global-constraints.md (rulings R1–R7 applied).

### Spec Compliance
✅ Spec compliant. All 18 changed files match the brief's Files list exactly (nothing missing, nothing extra — confirmed against both the Modify and Create lists in the brief and the diff's own file-stat header, "18 files changed, 1995 insertions(+), 73 deletions(-)"). Every hand-authored code block (`prisma.config.ts`, `prisma/schema.prisma`, `src/server/env.ts`, `src/server/db.ts`, the new violation fixture, the six repointed fixtures, `boundaries.test.ts`, and the three READMEs) is byte-for-byte identical to the brief's prescribed text. `package.json`'s `allowScripts`, the `"//"` comment, and the `overrides` block match D19/owner-answer-9 verbatim, placed directly after `allowScripts` as required, and the lockfile shows `deepmerge-ts@8.0.2` and `mysql2@3.24.4` resolved (the fixed releases named in the override comment).

I additionally verified the brief's "Interfaces" contract against the actual generated output in the working tree (present because the controller ran Step 7's `rm -rf src/server/generated && npm ci` per R2, with `DATABASE_URL` unset):
- `src/server/generated/prisma/enums.ts` exports `Category`, `Theme`, `ResetReason` — present.
- `src/server/generated/prisma/client.ts` exports `PrismaClient` and re-exports `Prisma` (imported from `./internal/prismaNamespace`) — present.
- `src/server/generated/prisma/internal/prismaNamespace.ts:53` — `export const raw = runtime.raw`; `:399-408` — `export const ModelName = {...}` / `export type ModelName = ...` — both present.

All four generated symbols the brief promises (`PrismaClient`, `Prisma` incl. `.raw` and `.ModelName`, and the three enums) exist exactly where the brief says. This matters because Task 2's `resetToSeed` (D9) depends on `Prisma.ModelName` to validate `RESET_TABLES` against the schema — that dependency is satisfied.

The schema (`prisma/schema.prisma`) matches `data-model.md`/ADR-0005 exactly: `Category` (10 values, `DiningOut`/`PersonalCare` mapped), `Theme` (15 values, `NavyGrey`/`ArmyGreen` mapped), `ResetReason` (4 values), all six models with `id`/`createdAt`/`updatedAt`/`seeded`, money as `BigInt` (owner answer 2, 64-bit), `Pot.name` as `@db.Citext @unique`, `Budget.theme`/`Pot.theme` unique, `seq` columns per owner answer 1.

No ⚠️ items — the diff is self-contained enough to verify against the brief's Files and Interfaces sections without needing to inspect code outside the diff, and the one place that did require an out-of-diff check (the generated client's actual exports) came back matching.

### Strengths
- Full 1:1 compliance with the brief's Files list and every prescribed code/text block, verified verbatim, not just by report claim.
- Rulings R1 (`--ignore-scripts` on the argument-less install), R2 (deferring `rm -rf ... && npm ci` to the controller), and R4 (161-test baseline) are correctly applied and consistent with the diff and the controller's stated facts.
- The two mutation checks (Step 10: removing `"**/prisma/**"` from the ESLint `group` array; Step 11: moving `db.ts` away) are real and internally consistent — Step 11's predicted "6 failed" is exactly right because `app-imports-server-allowed.ts.fixture` is a must-report-nothing control fixture, distinct from the five violation/control fixtures that import `src/server/db`, plus the `importTargets` existence check — the arithmetic in the report holds up against the diff.
- Good judgment on scope: the implementer noticed that `eslint.config.mjs`'s `ignores` array does not exclude `src/server/generated/`, correctly did not fix it (out of scope per the brief and DoD v1.1's "nothing outside the task is changed"), and flagged it for a decision rather than silently living with or silently fixing it.

### Issues
#### Critical (Must Fix)
None.

#### Important (Should Fix)
None.

#### Minor (Nice to Have)
1. **ESLint `ignores` gap — needs an explicit owner/controller decision, not just praise.** `eslint.config.mjs`'s `ignores` array (which already special-cases `.superpowers/**`, `.remember/**`, `.claude/worktrees/**` because flat-config ESLint reads no `.gitignore`) does not include `/src/server/generated/**`. Concretely: `boundaries/include: ["src/**/*"]` classifies files under `src/server/generated/` as the `server` element type, and `npm run lint` currently lints the generated Prisma client. It is green today only because the current generated output happens to be clean; Task 2 onward regenerates the client repeatedly, so a future Prisma release that trips a rule (e.g. `no-explicit-any`) will fail `npm run lint` on files nobody commits — the exact failure mode the `ignores` array exists to prevent everywhere else in this repo. This was correctly left out of this task's diff (not a defect in what's here), but since the implementer explicitly punted the decision ("flagging it for the controller to decide whether it belongs in this task, an immediate follow-up, or T-02's later tasks" — task-1-report.md), it needs an explicit answer, not silent inheritance into Task 2.
2. **Plan-documentation drift, not a code issue.** Global-constraints.md's D17 states `allowScripts` should additionally record `esbuild@0.28.2` (postinstall). The brief's own Step 3 "Expected" block (the operative instruction) lists only `unrs-resolver@1.12.2`, `prisma@7.10.0`, and `@prisma/engines@7.10.0` — no esbuild appears anywhere in the diff, and the implementation matches Step 3 exactly. This is drift between the Decisions table and the brief it's supposed to summarize, not something the implementer got wrong; worth a one-line reconciliation in the plan docs.

### Assessment
**Task quality:** Approved
**Reasoning:** Every file in the diff matches the brief's prescribed content verbatim, the generated Prisma client (verified directly, not just via `prisma generate` succeeding) exposes all four interface symbols the brief and Task 2 depend on, both mandated mutation checks are real and their reported results are internally consistent with the diff, and the rulings (R1, R2, R4) are correctly and visibly applied. The only two open items are non-blocking: a scope decision the implementer correctly deferred (ESLint `ignores` for the generated directory) and a pre-existing documentation inconsistency in the plan (D17 vs. brief Step 3) that predates this diff.
