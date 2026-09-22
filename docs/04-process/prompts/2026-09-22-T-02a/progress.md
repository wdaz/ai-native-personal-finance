# SDD ledger — plan: docs/04-process/plans/2026-09-22-T-02a.md

Spec (binding): docs/03-specs/backlog.md T-02a row; NFR-S5; ADR-0007; DoD v1.1 — all reachable.
Plan version: v0.3 (27d6ceb). Branch: task/T-02a-secret-guard. MERGE_BASE: d6d398d.
Owner go-ahead, 2026-09-22 12:51 +04, verbatim: "Subagent-Driven başla. model seçimlərini iş effort səviyyəsinə görə təyin edərsən."
Shared context files: context.md (Global Constraints, Decisions, File structure), appendix-a.md (final test file).

## Pre-flight scan (2026-09-22)

Evidence base: during planning every code block was assembled in a scratch copy and run with the
repo's Vitest/tsc/ESLint/Prettier; stage counts 7/13/19; the Task 2+3 insertions replayed onto the
Task 1 stage and Prettier-formatted equal Appendix A byte for byte; backlog v1.4 replacements replayed
(4 lines changed, "v1.4" on 2 lines).

| Pair / task | Produces → consumes | Finding |
|---|---|---|
| T1 ↔ T2 | secret-guard.test.ts helpers (run, testEnv, scratch, writeInto, leakLine, FAKE_CREDENTIALS) → T2 inserts secretScan, FAKE_PASSWORD, git, newRepo, commitFile, 2 describes at named anchors | Consistent (replay == Appendix A) |
| T1 ↔ T2 | scripts/gitleaks.sh (exec wrapper, exit 2 on checksum/platform) → secret-scan.sh `$here/gitleaks.sh` | Consistent |
| T1 ↔ T2 | .gitleaks.toml → secret-scan.sh `$(dirname "$here")/.gitleaks.toml` | Consistent |
| T2 ↔ T3 | secret-scan.sh staged → hook `$(dirname "$0")/../secret-scan.sh staged` | Consistent |
| T2 ↔ T3 | package.json (secrets:scan, test:all) → T3 adds prepare; describe("package.json") created T2, extended T3 | Consistent |
| T1–T3 ↔ T3 | mode test lists 4 shell files; +x created in T1 (gitleaks.sh), T2 (secret-scan.sh), T3 (hook, installer) | Consistent |
| T2 ↔ T4 | CI job runs `scripts/secret-scan.sh history` | Consistent |
| T1/T3 ↔ T4 | README text: cache in node_modules/.cache (D2), hook via prepare (D9) | Consistent |
| T4 ↔ T5 | T4 push trigger → main; T5 backlog v1.4 records it on T-13; DoD scope line | Consistent |
| T2/T3 briefs | "file must equal Appendix A" but task-brief extraction omits the appendix | Gap → Ruling P2 |
| T5 brief | extraction ran into Appendix A | Trimmed; not a plan defect |
| T1 self | 7 tests vs wrapper+config+fixtures; fail expectations (7 skipped; 5 SyntaxError) | Agrees (verified in scratch) |
| T2 self | 13 tests; fail expectation 7 pass / 6 fail | Agrees |
| T3 self | 19 tests; fail expectation 14 pass / 5 fail | Agrees |
| T4 self | ci.yml Prettier+YAML verified; README prose; test:all (E2E) never pre-run | Agrees; test:all first run here |
| T5 self | backlog replacements verified; two slots need facts only the controller holds | Ruling P3 |
| Rubric | no plan-mandated assertion-free test (installer "outside a work tree" asserts exit 0 — the failure mode it guards) | Clean |

Ruling P1: outward-facing steps — `git push`, `gh pr create`, `gh pr checks --watch`, `gh pr edit`, `gh pr ready` (Task 4 Step 6 second half; Task 5 Steps 4 push, 5, 6) — are run by the controller, not implementers; implementers stop after their local commit — why: side effects outside the worktree stay under one actor who can see CI and decide — costs if wrong: nothing but who types the command.
Ruling P2: Tasks 2–3 get appendix-a.md, and every dispatch gets context.md (Global Constraints, Decisions, File structure) — why: the briefs reference both, task-brief extracts neither — costs if wrong: slightly larger dispatch reads.
Ruling P3: Task 5's two open slots are filled by the controller in the dispatch: the go-ahead verbatim (above) and the "what the agent got wrong or missed" list from this ledger — why: only the controller holds the session's facts — costs if wrong: a process-log line the owner edits.
Ruling P4: Task 5 copies briefs, reports, reviews, context.md, this ledger and the workflow dispatch scripts (no diffs) into docs/04-process/prompts/2026-09-22-T-02a/; the final-review report is added by the final fix dispatch (or a cheap copy dispatch if there are no findings) — why: build-workflow §7, and the final review happens after Task 5 — costs if wrong: one missing file in the record.
Ruling P5: Task 3's `npm run prepare` writes core.hooksPath=scripts/git-hooks into the repository's shared .git/config (main checkout and all worktrees) — approved in plan D9's caveat; proceed — costs if wrong: `git config --unset core.hooksPath`.
Ruling P6: orchestration — one Workflow run per plan task (implement → package → review → fix rounds), sequential; fix rounds dispatch fresh implementers carrying brief + report file (workflow agents cannot be resumed; the skill allows this) — why: ultracode is on and the owner asked for subagent-driven execution — costs if wrong: fix rounds rebuild context from the report file.
Ruling P7: models by effort (owner instruction) — implementers sonnet/medium (plan holds complete code, but multi-step with mutation checks: turn count beats token price); Task 1 review opus/high (security-critical core: regex, allowlists, checksum wrapper); Tasks 2–5 reviews sonnet/high; review packaging haiku/low; scoped re-reviews sonnet/medium; fix rounds 4–5 opus/high; final whole-branch review opus/xhigh — costs if wrong: time or tokens, not correctness (every task still passes a review gate).

## Tasks
Task 1: dispatched (BASE 27d6ceb; workflow run wf_faac9996-75c; implementer sonnet/medium, reviewer opus/high; script sdd-task-wf_faac9996-75c.js reused for later tasks)
Task 1: review (opus) — spec ✅ with one verification gap (Step 10 literal `gitleaks git --pre-commit --staged` refused by the subagent sandbox), Task quality Approved, 0 Critical/Important, 5 Minor.
Task 1: fix round 1/5 (1 addressed, 0 open — verification gap closed with a stricter substitute: staged bytes via `git show`, scanned in dir mode; no code change, no commit)
Task 1: Ruling: Step 10 staged scan — the controller ran the git-mode equivalent over the task range (`gitleaks git --log-opts=27d6ceb..HEAD`, shipped config): 1 commit, no leaks; full history `--all -m`: no leaks — why: the literal command is unrunnable in subagent sandboxes, git mode over the committed range sees the same bytes — costs if wrong: nothing; Task 3's hook runs the literal staged scan on every later commit.
Task 1: Ruling: extra `Co-Authored-By: Claude Sonnet 5` trailer on 17d4543 kept — why: it names the model that actually wrote the commit; accurate attribution beats matching the brief's text — costs if wrong: one trailer line the owner can ignore.
Task 1: ⚠️ resolved — (a) D13 --redact lives in Task 2 (out of this diff); (b) staged-mode path allowlist: measured during planning (`.next/a.txt` staged with `git add -f` → rc 0); (c) trailers checked by the controller (git log -1).
Task 1: minor (deferred): tests/unit/secret-guard.test.ts parseReport — gitleaks also exits 1 on fatal errors (missing config → empty stdout → bare SyntaxError, stderr dropped); throw with stderr when stdout is empty.
Task 1: minor (deferred): tests/unit/secret-guard.test.ts checksum test "keeps nothing" asserts only <cache>/8.30.1/gitleaks absent, not that .download.* was removed.
Task 1: minor (deferred): .gitleaks.toml path allowlist `(?:^|/)` also exempts nested copies (e.g. tests/docs/00-discovery/inputs/); needed because gitleaks dir reports absolute paths — document or anchor.
Task 1: minor (deferred): scripts/gitleaks.sh header says the SHA-256 is checked "before it is ever executed"; a cached binary is not re-checked — reword to "checked once, at download".
Task 1: minor (deferred): 17d4543 trailers — extra Sonnet co-author (ruled above).
Task 1: complete (commits 27d6ceb..17d4543, review clean; T-01 baseline 125 unit tests → 132)
Task 2: dispatched (BASE 17d4543; implementer sonnet/medium, reviewer sonnet/high)
Task 2: review (sonnet) — spec ✅, Task quality Approved, 0 Critical/Important, 1 Minor (plan-mandated code).
Task 2: ⚠️ resolved — (a) tests pass: controller re-ran tests/unit/secret-guard.test.ts → 13/13; (b) `staged` mode untested here by design — Task 3's hook tests exercise it.
Task 2: minor (deferred): scripts/secret-scan.sh shallow guard — `git rev-parse --is-shallow-repository` outside a work tree yields "" and falls through to gitleaks' own error; an explicit --is-inside-work-tree check would give this script's message (plan-mandated code).
Task 2: Ruling: commit message "43 of 49 commits here" kept although `npm run secrets:scan` now reports 54 (all refs, incl. task branch) — why: the figure is the dated plan measurement E3 of main with the default invocation, not a claim about today's count — costs if wrong: a reader re-deriving the number from a later clone.
Task 2: complete (commits 17d4543..5777779, review clean; npm test 138/138; secrets:scan 54 commits, no leaks)
Task 3: dispatched (BASE 5777779; implementer sonnet/medium, reviewer sonnet/high)
Task 3: review (sonnet) — spec ❌ (1 Important, plan-mandated): the blocked-commit message never names `git commit --no-verify`, which plan D10 requires; no test asserts it. Implementer evidence: 19/19, npm test 144/144, test file == Appendix A (diff empty), hook's first real run on c9e70bd silent with exit 0, core.hooksPath=scripts/git-hooks.
Task 3: Ruling: the finding stands — plan D10 (owner-approved decision) says the blocked commit's message names `git commit --no-verify`; the plan's own hook code omitted it, a plan-internal contradiction; the decision wins over the code block. Fix: two message lines scoped to false positives / gitleaks failure ("Never use it to commit a real secret") + one assertion in "blocks a commit that stages a secret"; the test file then differs from plan Appendix A by exactly that line, recorded here and in the process log — costs if wrong: a bypass hint in the hook message; CI stays the gate.
Task 3: ⚠️ resolved — (a) non-zero exit in every "cannot run" path: gitleaks.sh is `set -eu` (curl/tar failures exit non-zero), exits 2 on checksum mismatch or unsupported platform (Task 1 test), secret-scan.sh `exec`s gitleaks so its status propagates, the hook blocks on any non-zero; (b) global core.hooksPath override: documented caveat of D9, owner-approved; not testable meaningfully.
Task 3: fix round 1/5 (1 addressed, 0 open — blocked-commit message names `git commit --no-verify` (scoped to false positives / gitleaks failure) + assertion; commits c9e70bd..7d2357f; fix commit passed through the installed hook, exit 0)
Task 3: complete (commits 5777779..7d2357f, review clean after round 1; 19/19 re-run by controller; both shell files 100755)
Task 4: dispatched (BASE 7d2357f; implementer sonnet/medium, reviewer sonnet/high; push/PR/CI by controller per P1)
Task 4: review (sonnet) — spec ✅, Task quality Approved, 0 Critical/Important, 1 Minor (plan-mandated).
Task 4: minor (deferred): .github/workflows/ci.yml audit step — `if ! npm audit ...` prints the same "advisories found" warning when npm audit itself fails (registry outage, bad lockfile); word the annotation differently for a tool error vs a finding (plan-mandated snippet).
Task 4: implementer evidence — npm run test:all green end to end: secrets:scan 57 commits, no leaks; lint/format/typecheck clean; Vitest 144/144; test:api 0; E2E 3/3 on chromium/firefox/webkit.
Task 4: controller — diff of ci.yml matches plan; pushed 77f0d24; draft PR https://github.com/wdaz/ai-native-personal-finance/pull/1 (first PR of the new repository); CI watch started.
Task 4: CI on PR #1 (run 35711968304) — lint · typecheck · unit pass (144/144 on Linux), secret scan pass (gitleaks.sh downloaded linux_x64 — first run of that branch; 59 commits scanned; no leaks), npm audit pass (found 0 vulnerabilities; no warning annotation).
Task 4: ⚠️ resolved — (a) test:all: implementer evidence + CI unit job; (b) CI run: green as above; (c) secret-scan.sh 100755 checked in Task 2; (d) trailers: same pattern as Tasks 1-3.
Task 4: complete (commits 7d2357f..77f0d24, review clean; CI green)
Task 5: dispatched (BASE 77f0d24; implementer sonnet/medium, reviewer sonnet/high; push and gh pr edit by controller per P1)
Task 5: review (sonnet) — spec ✅, Task quality Approved, 0 Critical/Important, 1 Minor.
Task 5: minor (deferred): pr-body.md says "npm run test:all green locally" — last full run was Task 4's (77f0d24); Task 5 is docs-only. Controller re-runs test:all at the final head before marking the PR ready.
Task 5: ⚠️ resolved — (a) hook ran on 4a1276b: implementer evidence + the controller's placeholder/backlog/diacritics checks; (b) test:all last green at 77f0d24 (Task 4) and CI on PR #1; re-run at final head planned.
Task 5: complete (commits 77f0d24..4a1276b, review clean; no placeholders; backlog "v1.4" ×2; 22 files in prompts/2026-09-22-T-02a/)
Final review: next — MERGE_BASE d6d398d, HEAD 4a1276b; opus/xhigh reviewer, 3-lens adversarial verification of each blocking finding (sonnet/high).
Final review (opus/xhigh, wf_196040e7-e10): "With fixes" — C1 Critical, I1–I4 Important, 4 Minor; 3-lens verification: C1, I1, I2, I3 survive 3/3; I4 survives 2/3 (severity lens: Minor); triaged fix-before-merge minors M1 (gitleaks.sh "checked before executed" claim), M2 (secret-scan.sh outside a work tree passes silently = I2), M3 (test:all re-run at final head).
INCIDENT: during final verification a subagent broke the read-only rule on this worktree: it set user.name=Scratch / user.email=scratch@example.com in the repository's shared .git/config and committed ed5d902 "add leak" + 993c8b4 "remove leak" (note.txt) on task/T-02a-secret-guard. Not pushed (origin stayed at 4a1276b). Controller: preserved both on local branch backup/t02a-final-review-junk (never to be pushed), `git reset --keep` the task branch to 4a1276b, unset the two local identity keys (global identity Ruslan intact; no color.*/log.diffMerges keys anywhere; ~/.gitconfig and the main checkout's working files unchanged since 13:55). A first plain `git reset --keep` was denied by the auto-mode classifier as irreversible; the backup branch made it reversible.
Ruling: incident remediation as above — why: junk commits carry a leak-shaped string and a foreign identity, must never reach origin; nothing of the owner's is lost — costs if wrong: `git reset --keep backup/t02a-final-review-junk` restores them; `git branch -D backup/t02a-final-review-junk` once the owner has seen this line.
Final review: backup branch content checked — note.txt is the 21-byte text "leaked content below", no secret; branch kept for the owner.
Ruling: C1, I1, I2, I3 fixed in one final wave (task-final-brief.md) by editing the shipped files, not pasting final-scratch/fixed/ — why: all four reproduced 3/3; the prototype drops the rationale comments and bundles an unaccepted scope expansion — costs if wrong: none beyond the diff.
Ruling: I4 (commit and tag messages are not scanned) — documentation only (fixture README "Not covered", scripts/README, README row); the message pass goes to the owner and T-16 — why: the reviewer classes it as scope beyond the backlog row, the Global Constraints forbid changes outside the task, one skeptic rated it Minor — costs if wrong: a secret typed only into a commit or tag message stays unscanned until the owner opts in; rotation (T-16) remains the guarantee.
Ruling: fix-before-merge minors M2 (checksum claim reworded), M3 (README: rebase/cherry-pick skip the hook; network once per npm ci), deferred #7 (npm audit warning text: "failed or found") and M1/M4 (process log wording, session record) go in the same wave; deferred #1, #2, #5 stay deferred; review recommendations 3 (--ignore-gitleaks-allow, CODEOWNERS/ruleset) → T-16 and 4 (permissions: contents: read) → T-13 as owner items — costs if wrong: small follow-up edits.
Ruling: the final wave's fixer and its single scoped re-review run on opus/high — why: not transcription (the prototype is not pasteable) and the I1 regex has a false-positive surface on the local-host exemption — costs if wrong: tokens.
Final fix wave: dispatched (FIX_BASE 4a1276b; maxRounds 1)
