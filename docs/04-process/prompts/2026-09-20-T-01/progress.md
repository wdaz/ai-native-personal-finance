# SDD ledger — plan: docs/04-process/plans/2026-09-20-T-01.md

Spec: docs/03-specs/backlog.md (T-01 row) + ADR-0001/0002/0003/0005/0006/0007,
design-tokens.md, SPEC-overview §4.5, SPEC-webmcp-tools §2.1, definition-of-done.md.
Branch: task/T-01-scaffold, rebased onto master 088be5e.

## Pre-flight conflict scan

| Check                                     | Tasks          | Produces → consumes                                                                                | Finding                                                                                                                                      |
| ----------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| shared file `package.json`                | 1, 3, 4, 7     | 1 creates scripts; 3 adds lint/format; 4 adds test; 7 adds test:api/test:e2e/test:all              | No conflict if run sequentially; never dispatch two implementers in parallel.                                                                |
| shared file `tests/unit/scaffold.test.ts` | 4, 5, 6        | 4 creates placeholder; 5 replaces it with tokens+avatars checks; 6 appends env check               | Sequential 4 → 5 → 6 required. Task 5 must REPLACE, Task 6 must APPEND.                                                                      |
| shared file `app/layout.tsx`              | 1, 5           | 1 creates minimal; 5 adds Public Sans + tokens.css import                                          | Sequential; Task 5 owns the final content.                                                                                                   |
| shared file `app/globals.css`             | 1, 5           | 1 minimal reset; 5 rewrites body rule in tokens                                                    | Sequential; Task 5 owns the final content.                                                                                                   |
| shared `.next/` build dir                 | 5, 7, 9        | 5 runs `npm run build`; 7's Playwright webServer runs `npm run build`; 9 runs the four CI commands | Never run 5 and 7 in parallel — concurrent `next build` writes the same `.next`.                                                             |
| script names                              | 3, 4, 7 → 8, 9 | 8's README table and 9's CI workflow cite script names                                             | 8 and 9 must run after 7. They touch disjoint files and run no build, so 8 ‖ 9 is safe.                                                      |
| Task self-consistency                     | 1              | Step 9 first adds then removes `next-env.d.ts` from .gitignore                                     | Plan text is self-contradictory but resolves itself in the same step; final block is unambiguous. Implemented as the final block. No action. |
| Task self-consistency                     | 3              | Probe files created then deleted in the same task                                                  | Intended: a permanent violation cannot be committed. No action.                                                                              |
| Task self-consistency                     | 5              | Doc states px; plan writes rem                                                                     | Plan documents the conversion and asserts it. Consistent.                                                                                    |
| Plan vs review rubric                     | 4              | Step 4 writes `expect(true).toBe(true)` — a test that asserts nothing                              | Ruling below.                                                                                                                                |

Ruling: Task 4's `expect(true).toBe(true)` placeholder is replaced by Task 5 two tasks
later, but a reviewer will correctly flag an assertion-free test. — Task 4 instead asserts
something real and permanent about the scaffold: that the Vitest config resolves the `@/`
alias and that `tests/unit` is the include root. — If wrong, the cost is one extra trivial
test that Task 5 would otherwise have deleted.

Ruling: ESLint pinned to 9.x, not the plan's 10.x. — `typescript-eslint@8` ships a scope
manager without ESLint 10's `addGlobals`, and `typescript-eslint@9` does not exist; the
lint pipeline is the deliverable, so it must run. — Owner approved explicitly at 11:15.
If wrong, the cost is a later major-version bump when typescript-eslint 9 ships.

Ruling: `eslint-plugin-boundaries` elements use `partialMatch: false` with patterns ending
in `/**`, not the plan's `mode: "full"` with `/**/*`. — `mode` is deprecated in v7, and a
`/**/*` pattern leaves files directly inside a layer folder classified as unknown, which
silently disables every boundary rule. — Verified against deliberate violations in all
three rules before the probes were deleted. If wrong, boundary violations go unreported —
guarded by the probe evidence recorded in commit a37c32a's message.

Ruling: Prettier ignores `/docs`, `/AGENTS.md`, `/CLAUDE.md`, `/README.md`. — A first
`prettier --write .` reformatted 45 approved documents; AGENTS.md makes the documents the
contract and the owner's prompt forbids changing `docs/`. — If wrong, prose files simply
stay hand-formatted.

## Progress

Task 1: complete (commits 1986e9c..14ccfbf, controller-implemented before the plan gate,
owner reviewed the deviation at 11:13 and approved continuing)
Task 2: complete (commit 1efb430, same)
Task 3: complete (commits a37c32a..ecf9ba4, same; three lint rules verified against
deliberate violations)

Task 4: implementer returned DONE_WITH_CONCERNS (commit 5b9dfa6). Concern was real and a
scope violation: it added `ignores: ["tests/**/*"]` to the boundaries config block in
eslint.config.mjs — a file Task 3 owns — to silence "Resolve error: typescript with
invalid interface loaded as resolver".

Ruling: the controller fixed it directly instead of resuming the implementer, which
deviates from this skill's "never fix findings yourself". — The defect was in Task 3's
deliverable, not Task 4's, and diagnosing it needed the probe evidence only the controller
had; a resume would have handed a haiku implementer a root-cause hunt across
node_modules. — Cost if wrong: the fix commit 05037f2 was not written by a subagent, so it
carries no implementer self-review; it is included in the Task 4 review package so the
task reviewer still gates it.

Root cause: eslint-import-resolver-typescript was installed only nested under
eslint-config-next, where eslint-plugin-boundaries cannot load it. The visible symptom was
a resolve error on test files; the invisible one was that every tsconfig-aliased import
(`@/src/server/x` from `src/domain`) was classified as an external module and escaped all
boundary policies. Installing the resolver as a direct devDependency fixes both. Verified
against a deliberate violation before the probe files were deleted.

Task 4: minor (deferred): Vite 7 prints "The plugin vite-tsconfig-paths is detected. Vite
now supports tsconfig paths resolution natively via resolve.tsconfigPaths". Dropping the
plugin would remove a dependency and the warning. Not done here — it is Task 4's file and
the change is cosmetic.

Task 4 review (sonnet): Spec ✅, Quality Approved. 2 Important, 3 Minor. Reviewer
independently re-verified the boundary fix against a deliberate alias violation.

Important #1 (tests/** excluded from boundaries) — already fixed at HEAD by 05037f2. Closed.

Important #2 (`src/shared/env.ts` is scope creep; `WEBMCP_MODES` may collide with the
`WEBMCP_MODE` env var that T-04/T-11 will define).
Ruling: keep the file. — It exists only because of my Task 4 ruling, and the alias
assertion it serves is worth having: it proves Vitest resolves `@/*` the same way Next
does, which is a scaffold property, not a feature. The names do not actually collide —
`WEBMCP_MODE` is the env var, `WEBMCP_MODES` is the tuple of values SPEC-webmcp-tools §2.1
lists, and backlog T-04 owns `src/shared` and will grow this file into real env parsing.
— Cost if wrong: T-04 renames a one-line constant.
Consequence carried into Task 5: Task 5 REPLACES `tests/unit/scaffold.test.ts`, which
would orphan `src/shared/env.ts` as dead code. Task 5's dispatch must keep the `@/` alias
assertion.

Task 4: minor (deferred): `.prettierignore` `.superpowers` entry rode along in the fix
commit rather than its own chore commit — commit hygiene only.
Task 4: minor (deferred): task-4-report.md miscounts changed files (says 6 = 4 new + 2
modified; actually 3 new + 3 modified). No effect on the code.
Task 4: minor (deferred): the `NODE_ENV === "test"` assertion tests Vitest's default, not
project code. Low value, but it is a real assertion and it documents the runner contract.

Task 4: complete (commits 5b9dfa6..05037f2, review clean)

Task 5: implementer returned DONE_WITH_CONCERNS (commit 5abd440). 82 unit assertions pass;
build, lint, typecheck, format all clean; public/avatars holds 30 files.

Ruling: the brief's Step 5 test code indexes regex match groups without a guard, which is
a type error under `noUncheckedIndexedAccess: true` and broke `npm run build`. The
implementer filtered out undefined matches instead. — The plan text was wrong and the
tsconfig is the binding constraint; the assertion behaviour is unchanged. — Cost if wrong:
none, the filter cannot hide a real token because the counts are asserted separately.

Ruling: the commit is co-authored "Claude Sonnet 5", not "Claude Opus 5 (1M context)" as my
dispatch asked. — The implementer ran on Sonnet, its own harness attribution names Sonnet,
and attribution should name the model that wrote the code. — Cost if wrong: a one-line
`git commit --amend`.

Task 5: minor (deferred): `--focus-ring-*` and `--font-family-base` are not covered by the
document-consistency test, because design-tokens.md describes the focus indicator in prose
rather than as a backticked `--token`. Their values are correct but unasserted.

Task 5 review (sonnet): Spec ✅, Quality Approved. No Critical, no Important. Reviewer
independently re-ran the extraction against the source documents and confirmed 48/48
tokens, 22/22 hex values, 30/30 avatar basenames, and that no `it.each` runs over an empty
array (each is guarded by a count assertion first).

Task 5: minor (deferred): the hex test uses a `for` loop inside one `it()` instead of
`it.each`, so it stops at the first mismatch instead of listing all.
Task 5: minor (deferred): tokens.css does not carry an in-file comment explaining the px →
rem conversion; the reasoning lives only in the plan and the report.
Task 5: minor (deferred): the document spells hex uppercase, the file lowercase. CSS is
case-insensitive and the test normalises; cosmetic.
Task 5: minor (deferred): `--focus-ring-color-on-dark` and `--font-family-base` are unused
until the sidebar exists (T-07) and are outside the 48-token mirror test.

Task 5: complete (commit 5abd440, review clean)

Task 6: implementer returned DONE (commit baf2436). 96 unit assertions pass (82 + 14);
lint, typecheck, format clean; `.env.example` holds 13 variables.

Ruling: Task 6's review and Task 7's implementation run concurrently, which this skill's
loop does not do. — The review reads a frozen diff file, and the two touch disjoint files
(`.env.example` + `tests/unit/scaffold.test.ts` vs `playwright.config.ts` + `tests/e2e/` +
`package.json` scripts); Task 7's Playwright browser download is several minutes of dead
wall-clock otherwise. Both dispatches carry an explicit instruction naming the other's
files as off limits. — Cost if wrong: a Task 6 fix commit would land after Task 7's,
muddling the history order; the final whole-branch review still sees everything.

Task 6 review (sonnet): Spec ✅, Quality Approved. Reviewer opened all seven source
documents and confirmed all 13 variables are documented and none invented, then proved the
test bites by deleting a variable (exactly one assertion failed) and by adding a
NEXT_PUBLIC_ entry (the negation assertion failed), restoring the file afterwards.

Important (report accuracy, not code): task-6-report.md claims
`git check-ignore -v .env.example` returned exit 0 with output; the reviewer re-ran it and
got exit 1 with no output, which is the correct result and what the brief asked for.
Ruling: park it. — The finding is in a git-ignored scratch report, not in a deliverable;
the behaviour it misdescribes was independently verified correct, and the correction is
now recorded here, which is the file that survives. — Cost if wrong: none to the code;
a future reader trusting that one line of the report would be misled, which this entry
prevents.

Ruling: `RESET_BYTES_THRESHOLD="52428800"` (50 MiB) for the specs' phrase "50 MB". — Byte
thresholds against `pg_database_size` are conventionally binary, and backlog T-02 owns the
implementation that reads it. — Cost if wrong: one constant changes to 50000000.

Task 6: minor (deferred): the test checks required ⊆ declared but not the reverse, so an
undocumented non-NEXT_PUBLIC_ variable added later would not be caught. This is the plan's
own test code, copied literally.

Task 6: complete (commit baf2436, review clean)

Task 7: implementer returned DONE_WITH_CONCERNS (commit dc51092). test:e2e 3/3 across
chromium, firefox and webkit with the web server log showing `next build` then
`next start`; test:api exit 0 with no tests; 96 unit assertions still pass; lint,
typecheck and format clean.

Both concerns are about the shared worktree, not about the code:
(a) `reuseExistingServer: !process.env.CI` would silently reuse a stray server on port
3000 if another agent had one bound. Port 3000 was free at every check.
(b) `npm run format` is repo-wide and could rewrite a file another agent is mid-edit.
Ruling: neither changes the diff. — Both are artefacts of my decision to run subagents
concurrently in one worktree, not properties of the deliverable; ADR-0003 fixes the E2E
contract and says nothing about concurrent local runs. — Cost if wrong: a future
concurrent run could test against the wrong server; mitigated by dropping back to
sequential dispatch, which is the default. Acted on immediately: the Task 8+9 dispatch
forbids `npm run format` and `git add -A`.

Tasks 8 and 9 batched into one implementer dispatch (README section, CI workflow) — small,
independent, disjoint files, two separate commits.

Task 7 review (sonnet): Spec ✅, Quality Approved. No Critical, no Important. Reviewer
byte-compared the em dash (U+2014) between app/page.tsx and the assertion with xxd, and
re-ran lint, tsc and a scoped prettier check itself.

⚠️ raised by the reviewer: `src/shared/test-ids.ts`, which ADR-0003's `data-testid` rule
names, does not exist yet. Resolved by the controller: backlog T-04 creates it
("`src/shared`: … `test-ids.ts` …"). Not a gap in this task, which uses role locators.

Task 7: minor (deferred): the scaffold E2E title carries no story id, against ADR-0003's
rule that E2E titles start with one. Deliberate and explained in the test's own comment —
it verifies the scaffold, not a story, and T-13's traceability script checks that every
release story HAS a test, not that every test has a story.
Task 7: minor (deferred): `reuseExistingServer: !process.env.CI` on a fixed port 3000 is a
theoretical hazard only when several agents share one machine.

Task 7: complete (commit dc51092, review clean)

Tasks 8+9: implementer returned DONE_WITH_CONCERNS (commits 47327e3, 0931290). lint,
format:check, typecheck clean; 96 unit assertions pass; both brief sanity checks printed
their exact expected strings.

Ruling: the plan's Task 8 Step 2 contains a nested code fence that closes the outer block
early; read literally it would have truncated the README section to the heading, intro and
bash block, dropping the `test:all` sentence, the command table and the `.env.example`
line. The implementer included the full section. — I wrote that fence and the truncation is
a markdown artefact, not an instruction; the backlog's T-01 row asks for "README run
instructions" and the table is the part that makes them followable. — Cost if wrong: a
longer README section than intended, trivially trimmed.

Tasks 8+9 review (sonnet): Spec ✅, Quality Approved. No Critical, no Important. Reviewer
cross-checked every README command against package.json's real scripts, parsed the
workflow with PyYAML, and independently derived the CommonMark fence-counting that
confirms the brief's stray 4-backtick line is an authoring error, not an instruction.

Tasks 8+9: minor (deferred): the new README table's separator row is padded to column
width while the file's existing table uses minimal dashes. Both render identically.
Tasks 8+9: minor (deferred, real contradiction, FOR THE FINAL REVIEW): package.json says
`"engines": { "node": ">=24" }` while `.nvmrc` says 26 and the new README says "Requires
Node 26". Introduced in Task 1, not by these tasks.

Tasks 8+9: complete (commits 47327e3..0931290, review clean)

## Final whole-branch review (opus, 088be5e..0931290)

Method: 14 deliberate boundary-violation files, 13 mutations of the unit suite, and a real
clean clone via `git archive HEAD` with every CI step plus `next build` run inside it.
No Critical findings. 16 findings total.

Important: (1) `eslint-config-next/typescript` never imported — not one @typescript-eslint
rule is active, so `any` and unused locals pass; (2) CI `push: branches: [main]` but the
repo's branch is `master`; (3) README "Run locally" fails on a clean clone because `npm ci`
does not download Playwright browsers; (4) the tokens test checks names and a bag of hex
strings, not values — swapping two colours, `--spacing-50: 4px`→`400px`,
`--text-preset-1: 2rem`→`3rem` and `--sidebar-width: 300px`→`999px` all PASS today, so 26
of 48 documented tokens have no value coverage; (5) engines `>=24` vs `.nvmrc` 26 vs README
"Node 26"; (6) nothing guards that the boundary rules still fire, though they have silently
self-disabled three times on this branch.
Minor: (7) `@prisma/client/edge` evades the restriction and the rule covers only `app/**`
though src/server's README claims exclusivity; (8) `lint` lacks `--max-warnings 0`;
(9) dead `@media` comment in tokens.css; (10) `--font-family-base` inner `var()` has no
fallback, so a missing next/font class drops the whole `font:` shorthand; (11) no
process-log entry for the build; (12) README still says tokens "will be extracted during
Phase 3" and the layout row omits `scripts/` and `public/`; (13) `allowScripts` may be dead
config; (14) avatars and env checks are one-directional; (15) `src/shared/env.ts` will
duplicate T-04's Zod enum; (16) backlog T-05 does not record deleting `app/page.tsx`.

Reviewer's triage of the deferred minors: fix before merge — the px→rem comment and the
Node version contradiction. All others can stand. The `NODE_ENV` assertion is already gone
(Task 5 replaced the file).

Verdict: the branch satisfies the T-01 backlog row. The only defects touching the row's own
words are #3 and #5.

Ruling: finding #2 is fixed as `branches: [main, master]` with a comment, not by renaming
the branch. — ADR-0007 says `main`, the repo says `master`; renaming a default branch is an
outward-facing repo change and the owner's call, and covering both costs nothing. — Cost if
wrong: one redundant trigger line after the owner decides.

Ruling: finding #11 (process-log entry) is NOT fixed in code. — The owner's prompt forbids
changing `docs/` and asks for the entry as a draft for them to place; AGENTS.md makes the
log the owner's record. — Cost if wrong: none; the draft is delivered in the final report.

Ruling: finding #13 (`allowScripts`) must be proven inert before removal, not removed on
inspection. — npm 11 wrote that field via `npm install-scripts approve unrs-resolver`, and
that postinstall builds the native binding `eslint-import-resolver-typescript` needs;
deleting it could reproduce exactly the silent boundary-disabling regression that finding
#6 exists to catch. — Cost if wrong: the field stays and is merely redundant.

Fix wave dispatched as ONE opus agent covering findings 1-10, 12, 13, 14 and the two
fix-before-merge minors. Findings 11, 15 and 16 are ruled out of the wave above.

DoD split (reviewer's, adopted): N/A to T-01 — domain purity/clock, integer cents, Zod and
copy, client/server boundary and WebMCP placement, API tests, story-id E2E, axe, WebMCP
coverage, domain coverage gate, keyboard walkthrough and 1440/768/375 screenshots, spec
amendment. Applicable and met — TS strict, lint, format, import boundaries, a unit test for
the new `src/shared` export, values from tokens only, prompts saved, no Accepted ADR
contradicted. Applicable and unmet — the process-log entry (delivered as a draft) and owner
review/merge (the owner's step).

Fix wave (opus, one dispatch + two follow-up rounds): commits c3690e4, 292a50c, 47916be,
3d7d5f2, b8705a0, 2383490, b4e9498, d90dacf. Unit assertions 96 → 112; e2e 3/3; lint,
typecheck, format clean; git status clean. Every finding it was given is closed.

Evidence the fixer produced rather than asserted:
- Tokens value test: four mutations of tokens.css each failed the suite (green↔red → 2
  failed; --spacing-50 4px→400px; --text-preset-1 2rem→3rem, failing as "expected 48 to be
  32", i.e. the rem→px conversion is checked; --sidebar-width 300px→999px). tokens.css diff
  0 bytes afterwards.
- Boundary regression test: all three historical silent failures re-created (removing
  ...nextTypescript, the `/**/*` element pattern, an unloadable resolver) and each broke
  the suite. Fixtures live under tests/fixtures/boundaries/ with a `.ts.fixture` extension,
  invisible to `eslint .`, tsc, Prettier and Vitest, so no ignore lists changed.
- Avatars reverse: a stray `zz-unreferenced.jpg` failed the suite with
  "expected [ 'zz-unreferenced' ] to deeply equal []".
- src/shared Prisma rule: removing `src/shared/**` from the files list failed the fixture
  test with "expected [] to deeply equal [ 'no-restricted-imports' ]".

Ruling: `allowScripts` KEPT, reversing the final review's suggestion to delete it. — The
fixer ran `npm ci` twice on `git archive HEAD` copies outside the repo: with the field npm
warns only about fsevents, without it `unrs-resolver@1.12.2 (postinstall)` joins the
blocked list. npm 11 reads the field, so it is not dead config. — Honest limit the fixer
recorded: on macOS arm64 the native binding comes from a platform optionalDependency, not
from the postinstall, so the postinstall's necessity is unproven there; the field is kept
because the cost of being wrong is every boundary policy going silent, and because CI runs
ubuntu-latest. The breakage is no longer silent either: removing the resolver now drops
tests/unit/boundaries.test.ts from 13/13 to 6/13, and `npm test` is a CI step.

Ruling: `src/shared` added to the Prisma restriction (the fixer had left it open as a
question). — ADR-0002 says shared "imports nothing from the rest", so it is the layer that
must stay dependency-free, and T-04 writes its Zod schemas by hand rather than deriving
them from Prisma types. `src/server` is now literally the only layer that may import
Prisma, which is what src/server/README.md claims. — Cost if wrong: if T-04 needs Prisma
types in shared, that is an ADR conversation, which is the point.

Open, deliberately not fixed, for the owner: the `master` / `main` contradiction is covered
by the workflow triggering on both, not resolved. ADR-0007 says `main`; the repository uses
`master`. Renaming a default branch is the owner's call.

Scoped re-review of the fix wave (opus, 0931290..d90dacf): 13 of 14 findings ADDRESSED,
no new Critical or Important breakage. The reviewer re-ran the proofs itself rather than
trusting the fix report: four tokens.css mutations (each failed, file restored byte-exact)
and all three historical boundary regressions (commenting out ...nextTypescript → 1 failed;
`src/domain/**` → `src/domain/**/*` → 3 failed; renaming the resolver package → 7 failed).
It also validated the fixture approach by placing the fixture contents as real `.ts` files
under src/domain, src/ui, src/shared, app/(app)/overview and app/api and running
`npx eslint`: identical messages to the synthetic `filePath`, so the synthetic path does
not make the test easier — `toEqual([ruleId])` makes it stricter.

Finding 12 NOT ADDRESSED — the decision was right, the reasoning written into the code was
wrong.
Ruling: I was wrong, and so was the fix wave's evidence. npm's `npm ci` output lists
scripts "not yet covered by allowScripts" — that is not a blocked list. npm 11.19.0 skips a
script only on an explicit `false` (arborist/lib/arborist/rebuild.js:206-208); an
unreviewed script is `null` and RUNS with a warning. `strict-allow-scripts` defaults to
false and this repo has no `.npmrc`. The reviewer confirmed it offline with a local package
whose postinstall writes a marker: field present → ran; field absent → ran; explicit false
→ blocked. So `allowScripts` is a policy record, not a gate, and the comment claiming npm
blocks unapproved scripts is false. — Correction dispatched as a comment-only change; the
field stays, because it records a real review and makes enabling strict mode a one-line
change. — Cost if wrong: none to behaviour; the earlier ruling in this ledger that called
the field "load-bearing" is superseded by this one.

Ruling: take the reviewer's option (a), correct the comment, rather than option (b), adding
`.npmrc` with `strict-allow-scripts=true`. — Option (b) would make the original claim true
and harden CI, but the reviewer notes the Linux binding set must be checked first, and
tightening install policy is a change with its own risk arriving at the end of a scaffold
task. — Cost if wrong: an unreviewed install script can still run; recorded below as an
option for the owner.

For the ledger, residual and accepted:
- Five tokens sit outside value coverage — `--focus-ring-width/-offset/-color/-color-on-dark`
  and `--font-family-base` — because design-tokens.md states the focus indicator in prose,
  not in a table, so `--focus-ring-width: 2px` → `999px` would pass. All 48 tabled tokens
  are fully value-checked. Asserting the five would mean typing their values into the test,
  which is the duplication the test exists to prevent.
- The negative control (`domain` importing `shared`, expecting no report) cannot carry
  weight alone: `lintText` on an ignored path returns an empty array, so if someone added
  `src/domain/**` to `ignores`, "reports nothing" would pass vacuously. Low risk — the nine
  violation cases would all fail at once.
- The boundary fixtures import `README.md` files because src/domain and src/server hold no
  modules yet; T-02/T-04 should repoint them at real modules.
- `main` / `master` remains open for the owner.

Reviewer's verdict: the branch is ready for the owner's review.
