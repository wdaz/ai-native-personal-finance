# Report — the whole-branch review of T-13a (Opus 5.5, read-only)

The reviewer's final report, saved as it was delivered (a `feature-dev:code-reviewer` subagent on Opus
5.5, no write tools and no shell; the brief is `review-brief.md`). It is model output, not an owner
decision. The controller's disposition of it is the last section, marked as such.

## Whole-branch review of T-13a (`task/T-13a-proxy`, c0112af..46a7547). Read-only; reviewer is Opus 5.5.

**What I read.** I had no shell, so the diff was the file `.superpowers/sdd/2026-09-25-T-13a/review-c0112af..46a7547.diff`. I read it in passes (lines 1–400, 400–460, 460–499, 499–1569), taking the long Status/Changelog/backlog lines one at a time, and every one of its 57 hunks across 43 files. I also read:
- the plan (v0.2);
- the ledger `progress.md`;
- every `t1-*`, `t2-*`, `t3-*`, `t4-*`, `task-*-tests` and `build-baseline` log (by grep for results and full reads for the builds, controls, codemod and `next dev`);
- the final `proxy.ts`, `tests/api/proxy.spec.ts` (lines 200–245), ADR-0006, `backlog.md` (Notes and changelog), `build-workflow.md`, the process-log template, `next-env.d.ts`;
- the worktree's `COMMIT_EDITMSG` and reflog.

I re-derived the `middleware` gate myself with Grep, including the hidden `.claude/` and `.github/`.

### Strengths
- **`proxy.ts` is exactly the planned change.** Compared with the old `middleware.ts` it differs only in the comment (2 lines → 4), the removed `runtime: "nodejs"` line and `middleware` → `proxy`: +5/−4, similarity 95 %. The matcher keeps its trailing comma. `buildCsp(nonce, process.env.NODE_ENV)` is unchanged at `/proxy.ts:71`.
- **The characterization tests are real.** Task 1 went 14 → 16 passed (`t1-step2.log`). Each mutation fails the intended test with the intended label and nothing else:
  - A (`Referrer-Policy` line deleted) and B (`X-Content-Type-Options` line deleted): "a public page: … Received: undefined".
  - C (matcher widened): "the avatar: X-Request-Id", received a UUID.
  - Each run was 1 failed / 15 passed.
- **The three build controls are captured verbatim** (`t2-ctlA/B/C.log`). The deprecation warning is present in `build-baseline.log` and absent from `t2-build.log`. The route label `ƒ Proxy (Middleware)` was correctly not counted as a warning.
- **Task 3 is mechanical and clean.** It touches 32 files with +50/−50 lines. Every hunk is a comment, README sentence, test title or checklist row. No identifier, header name or asserted string changed, and no test in `tests/` uses snapshots, so renamed titles cannot orphan a `.snap` or screenshot.
- **The Task 4 ruling (8 files, then 10) is sound.** The tree now has exactly 10 files outside `docs/04-process` that mention `middleware`: `proxy.ts` plus nine docs. Every hit in the five bumped documents is before `Implements:`, or on line 3 of `system-overview.md`.
- **The logs match the ledger** for unit (81/1046), API (102, four runs), E2E (109/8, 106/11 on a fresh build, 218/16) and the `next dev` log line `proxy.ts: 129ms`. `next-env.d.ts` is restored.

### Plan Review Focus and claims, checked one by one
1. **Header dropped on one branch.** Pass. The headers are set unconditionally at `/proxy.ts:164-178`, and mutations A and B are caught. The coverage wording overclaims; see Minor M1.
2. **Matcher widened.** Pass: mutation C is caught, and `public/avatars/bytewise.jpg` exists.
3. **`runtime` left in `config`.** Pass: the line is removed, the comment says why, and control (a) failed with "Route segment config is not allowed in Proxy file".
4. **`middleware.ts` returning.** Pass: control (b) failed the build. The lone-file case is accepted by the owner (Q3 (a)). No `middleware.*` exists at the root or in `src/`.
5. **`next dev` relaxed CSP.** Pass on code: `proxy.ts:71` passes `NODE_ENV` through, and `csp.test.ts` pins the dev variant. The only raw output is the server log. The headers themselves appear only as a ledger sentence, and I could not re-run anything (Minor M3).
- **(a) `proxy.ts` differs only as planned.** Pass.
- **(b) Nothing a test asserts on changed in Task 3.** Pass.
- **(c) Records not rewritten.** **Fails in one place: the `backlog.md` Notes snapshot (Important I1).** Everything else holds: the Status/Changelog paragraphs only gain text at the front, ADR-0006's older amendments are untouched, and the Closed TD entries are untouched.
- **(d) Amendment (6) is proposed and changes no decision.** Pass. It reads "proposed, awaiting the owner" and "No decision above changes".
- **(e) The numbers match the ledger and the logs.** Pass, with one overstatement in the execution entry (Minor M2).
- **(f) The backlog hand-offs keep each row's column count.** Pass. Each of the three hand-offs has no `|` inside it and is followed by exactly four pipes to the end of the line.
- **(g) "Owner changes and reasoning" left for the owner.** On purpose, as `build-workflow.md` §7 says; not a defect.

### Issues

**Critical:** none.

**Important**
- **I1. A dated Notes snapshot was overwritten instead of appended** (`/docs/03-specs/backlog.md:159`).
  - **What is wrong:** "Open at v1.27: **TD-2** (T-13a), **TD-3** (T-13b); **TD-7–TD-11** in review (T-13c)." was replaced by "Open at v1.30: …". The line now holds the v1.18, v1.24 and v1.30 snapshots only.
  - **Why it matters:**
    - The file states its own convention twice. The v1.22 entry (`backlog.md:87`) says "The dated "Open at v1.18" line in the Notes is a snapshot and is not rewritten". The v1.28 entry (`backlog.md:23`) says the same.
    - The pattern until now was to append: v1.24 and v1.27 were both added after v1.18.
    - The plan's own F6 rule is that records stay as written.
    - The v1.30 changelog (`backlog.md:15`) says only "The Notes' open-debt line now says TD-2 is in review", so the removal is undisclosed.
    - It is small (git history keeps the old text), but it is exactly what claim (c) says did not happen.
  - **Mitigation:** the text was dictated by the plan (Task 4 Step 5, "replace …") and falls under the texts Q5 approved. The controller or owner should rule.
  - **Fix (one line):** keep the v1.27 snapshot and append "Open at v1.30: **TD-3** (T-13b); **TD-2** in review (T-13a)." after it. In the v1.30 changelog, say "the Notes gain an Open at v1.30 snapshot".

**Minor**
- **M1. Test 1 claims "every branch" but covers three of the function's four response branches** (`/tests/api/proxy.spec.ts:205-214`).
  - **What is wrong:** the comment says the four requests "leave the function by four different branches". But "a public page" (`/login`) and "a public API answer" (`/api/auth/session`) both leave through the same `else { NextResponse.next(...) }` branch (`/proxy.ts:120-138`). The root redirect (`/proxy.ts:98-105`) and the authenticated `/login` → `/overview` redirect (`/proxy.ts:118-119`) are never exercised.
  - **Why it matters:** low risk, because the header lines are unconditional at the tail. Review Focus 1 as worded (a redirect, a 401, a page, an API answer) is met. Only the title and comment overclaim. The text was plan-dictated.
  - **Fix:** add `["the root redirect", 302, () => request.get("/", { maxRedirects: 0 })]`, or reword the comment to "three of the function's four branches".
- **M2. The execution entry contradicts itself** (`/docs/04-process/process-log.md:3857` vs `:3866-3868`).
  - **What is wrong:** "What the agent got right" says "every number the plan measured came out the same in the run". The same entry's "got wrong" items (1) and (3) record two measured plan numbers that did not: the 7-file gate, which F6 labels as measured, came out as 8, and F6's "about 45 lines" came out as 50. Item (1) also says the Step 7 gate "would list ten". It does list ten: I measured it. But no Step 7 gate output exists in the logs (`task-4-tests.log` has only format:check and traceability).
  - **Fix:** "every number … came out the same except the two in item (1) and (3)", and "lists ten (measured)" once the gate is run and saved.
- **M3. Review Focus 5 rests on a ledger sentence, not saved output** (`.superpowers/sdd/2026-09-25-T-13a/t2-nextdev.log`).
  - **What is wrong:** the log holds only the server output. The `curl -D -` headers (`'unsafe-eval'`, `style-src 'self' 'unsafe-inline'`, `referrer-policy`, …) were not saved, unlike every other claim in the run.
  - **Why it matters:** code reading and `csp.test.ts` support the claim, so this is an evidence gap, not a defect. `build-workflow.md` says "a report is evidence, not proof".
  - **Fix:** save the curl output next time. Optionally re-run once and attach it to the PR.
- **M4. The T-13b hand-off repeats its own row** (`/docs/03-specs/backlog.md:149`). The row already says "reads T-13a's `proxy.ts`", and the appended hand-off opens with "reads `proxy.ts`; …". Plan-dictated; drop the second "reads `proxy.ts`;" if the Notes line is being touched anyway.

### Declined to judge
- **ADR-0006 edits:** an amendment written inside an Accepted ADR, and its Status line edited, versus `governance.md`'s "Never modify an Accepted document". The backlog row prescribes "a dated note"; TD-6's open question (F11c) is the owner's.
- **A lone `middleware.ts` returning is unguarded.** Owner decision Q3 (a); the lint alternative is recorded.
- **NFR-S6 says "Header check in E2E"; the new check is an API test.** Q2 left NFR-S6's wording to the owner.
- **The `globalThis` via-log buffer in `src/server/request-log.ts`** goes against Next's proxy guidance (F11a). Handed to T-13d; out of scope.
- **`proxy.ts` on Vercel** (the false-positive "Unable to find source file for page middleware" warning). Cannot be measured here; handed to T-14.
- **The four E2E legs ran on the Task 2 tree and were not re-run after Tasks 3–4.** Tasks 3–4 changed only comments, titles and docs, the plan does not require a re-run, and CI runs all four legs.
- **"proxy" now has two meanings.** `src/server/auth.ts:21` and `src/shared/api-client.ts:15` use it for a network proxy; context makes those clear. It is Next's naming and out of scope.
- **TD-2's "Guarded meanwhile by" line still names `tests/api/middleware.spec.ts`.** By the plan's rule the entry's text is kept; the appended "Fix in review" line names the new path, and closure comes after the merge.
- **The T-13a backlog row still says "TD-2 says keep `runtime`".** The plan leaves the row unchanged, and TD-2 carries the correction.
- **The agent drafted "What the agent got wrong or missed"** although §7 gives that field to the owner. Plan-dictated and established practice; the owner can amend.
- **`tests/api/README.md` does not list `proxy.spec.ts`**, nor `auth.spec.ts` and others. The gap predates this branch.
- **The codemod's version (`16.4.0-canary.45`) is not printed in `t2-codemod.log`.** I accepted the ledger's word; its output (`D middleware.ts`, `?? proxy.ts`) is consistent with the plan.

### Recommendations
1. Fix I1 (one Notes line and its changelog sentence) before the PR, or get the owner's ruling that the replacement stands.
2. Commit the untracked `docs/04-process/prompts/2026-09-25-T-13a/` (this brief and this report) on the task branch before the PR (`build-workflow.md` §7; plan Task 4 Step 8).
3. Record the review's outcome in the execution entry's "Next" field, and apply M2's wording fix.
4. M1 is a one-line test addition; worth taking while the spec file is fresh.
5. The commit trailers (Sonnet 5, matching the log's Participants field) and the unset upstream are not defects.

### Assessment
**Ready to merge? With fixes.** The code change is exactly the planned one, and it is well evidenced: the behaviour is pinned by tests that failed on purpose, the build controls are verbatim, and every suite is green in the saved logs. The one thing that should change before the PR is the overwritten v1.27 Notes snapshot in `backlog.md`, which makes claim (c) untrue as written. It is a one-line documentation fix, or an explicit owner ruling that the plan-dictated replacement stands. The Minor items are optional.

## The controller's disposition (the agent's words, not the reviewer's)

- **I1** — fixed: the v1.27 snapshot is restored beside the v1.24 and v1.30 ones, and the v1.30
  changelog says the Notes gain a snapshot (the backlog's own rule, v1.22 and v1.28, over the plan's
  word "replace").
- **M2** — re-graded to Important, because records are not rewritten once merged; fixed. The Step 7
  gate was run again and its output (ten files) saved in the run's scratch directory.
- **M1, M3, M4** — left for the owner. M3's evidence, the `next dev` response headers, is quoted in the
  pull request text.
- **Declined to judge** — each line was ruled on and the rulings are in the pull request text.
