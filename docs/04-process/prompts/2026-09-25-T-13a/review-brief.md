# Brief — the whole-branch review of T-13a (Opus 5.5, read-only)

This is the brief the controller gave the reviewer subagent, saved as it was written. The reviewer had
no write tools and no shell (`governance.md` v1.1), only read, grep and glob.

You are a Senior Code Reviewer. Review the whole branch `task/T-13a-proxy` of the repository
`ai-native-personal-finance` against its plan, and report before it goes to a pull request.

## What was implemented

T-13a (TD-2): Next 16 renamed the `middleware` file convention to `proxy`. Four commits on top of
`origin/main` `c0112af`:

1. `6df4cda` — `test(api)`: two new tests in `tests/api/middleware.spec.ts` (headers on every branch;
   the matcher's exclusion of files with an extension), green on the old code, red by mutation.
2. `2002327` — `refactor(proxy)`: `middleware.ts` becomes `proxy.ts` through Next's codemod; `runtime`
   removed (a proxy refuses it); the comment above `config` rewritten.
3. `18002d1` — `refactor(proxy)`: every live reference says "proxy" (32 files, four substitutions), the
   spec is renamed `tests/api/proxy.spec.ts`.
4. `46a7547` — `docs(specs)`: nine live lines in five documents, five wording-only version bumps,
   ADR-0006 amendment (6) marked *proposed*, `tech-debt.md` v1.14, `backlog.md` v1.30, two process-log
   entries, the prompt record.

## Requirements / plan

- The plan: `docs/04-process/plans/2026-09-25-T-13a.md` (v0.2, on `main`; its Status still says
  "awaiting the go-ahead" — the plan is a record and is updated after the merge, not by this branch).
  Read it first: findings F1–F11, the owner's answers to Q1–Q6, Tasks 1–4.
- The backlog row T-13a in `docs/03-specs/backlog.md` and `docs/03-specs/tech-debt.md` TD-2 are the
  requirement; ADR-0006 (Accepted) constrains it. Rules: `AGENTS.md`, `docs/04-process/governance.md`
  ("Never modify an Approved/Accepted document — propose a new version or a superseding ADR").
- The plan's "live reference vs record" rule (F6) decides which mentions of `middleware` had to change
  and which had to stay.

## Where to read

- The diff of the whole branch: `.superpowers/sdd/2026-09-25-T-13a/review-c0112af..46a7547.diff`
  (about 178 KB; it contains very long single-line diffs — the specs' Status and Changelog paragraphs
  and the backlog's rows). You have no shell, so this file is the diff. Review it in passes yourself
  and say so in your report. The working tree is at the head commit, so `Read`, `Grep` and `Glob`
  show the final files.
- The controller's ledger: `.superpowers/sdd/2026-09-25-T-13a/progress.md` — per-task evidence and every
  `Ruling:` line (there is one, on Task 4: the plan expected 7 and 9 files in its `middleware` gate
  and left out `proxy.ts` itself). Weigh it.
- Command outputs of the run (unit, API, four E2E legs, builds, the three controls, `next dev`):
  `.superpowers/sdd/2026-09-25-T-13a/t1-*.log`, `t2-*.log`, `t3-*.log`, `t4-*.log`. You cannot run
  anything; read them.
- Other deviations from the plan that are not rulings: the commit messages carry the session's
  `Co-Authored-By` and `Claude-Session` trailers (the plan's commands had none); Task 4's substring
  edits were made by small scripts that asserted each substring occurs exactly once; the branch's
  upstream was unset so a bare `git push` cannot target `main`.

## Review Focus (from the plan, verbatim)

The inputs and conditions the backlog row implies but the existing tests would not exercise, most
likely to bite first. Check each deliberately.

1. **A security header dropped on one branch of the function.** `Referrer-Policy` and
   `X-Content-Type-Options` are set at the function's tail; no test reads either (F4), so a rename
   that lost a line would stay green. A redirect, a 401, a page and an API answer must each carry
   both, and `X-Request-Id`. Task 1, test "NFR-S6, ADR-0006: every branch's response …".
2. **The matcher widened by accident.** A logged-in visitor's request for `/avatars/*.jpg` must not
   meet the session check, the reset-epoch query, `no-store` or the proxy's headers (review finding
   M6). Nothing pinned it. Task 1, test "review finding M6 …".
3. **A `runtime` option left in `config`** — TD-2's own Fix line tells the implementer to keep it, and
   Next refuses it: `Route segment config is not allowed in Proxy file`. Task 2, Step 4 (the
   violation controls) and the comment that now says why.
4. **`middleware.ts` coming back** — from an agent or a tool that predates Next 16. Beside
   `proxy.ts` Next fails the build; alone it only warns and still runs (F3). Task 2, Step 4 (control
   b) and Q3 — answered (a): no guard for the second case; the build-log warning is accepted.
5. **`next dev`'s relaxed CSP.** The API suite runs the production build only, so nothing but a
   look at one `next dev` response shows that `buildCsp(nonce, process.env.NODE_ENV)` still gets the
   development variant from the renamed file. Task 2, Step 7. (`next dev` also rewrites the tracked
   `next-env.d.ts` — restore it, F7.)

Also check, as the plan's own claims: (a) `proxy.ts` differs from the old `middleware.ts` only by the
rename, the removed `runtime` line, the comment and the function name (`git`'s similarity is 95 %);
(b) no identifier, header name or string a test asserts on changed in Task 3; (c) records were not
rewritten — the `Status`/`Changelog` paragraphs keep every earlier version, the older amendments of
ADR-0006 are untouched, Closed entries of `tech-debt.md` keep their text; (d) ADR-0006 amendment (6)
is worded *proposed, awaiting the owner* and claims no decision changed; (e) the numbers in the new
process-log entries, in `tech-debt.md` v1.14 and in `backlog.md` v1.30 match the ledger and the logs;
(f) the new hand-offs in the backlog rows leave every table row with its original number of columns;
(g) the two "Owner changes and reasoning" fields of the log entries are left for the owner on purpose
(`build-workflow.md` §7) and are not a defect.

## The spec is a vision document

The spec says what the software must do. It does not enumerate every input, environment, or condition
the software will meet. For behavior the spec is silent on, judge by what a reasonable person using
this software would expect: a reasonable person's expectation is a requirement, and a spec's silence is
not permission. Grade such findings by their effect on that person, not by whether the spec mentions
the trigger.

## Declined to judge

Before your verdict, list every behavior you considered and set aside as outside the plan or spec, one
line each, with the reason. The controller rules on each line; nothing you set aside is dropped
silently. An empty list means you set nothing aside.

## Read-only, and no subagents

Your review is read-only. You have no write tools and no shell; do not try to obtain them. Do all of
this review yourself. Never spawn a subagent, and never spawn another reviewer.

## Calibration and output

Categorize issues by actual severity; not everything is Critical. Acknowledge what was done well
before listing issues. For each issue give file:line, what is wrong, why it matters, how to fix.
Format: Strengths; Issues (Critical / Important / Minor); Declined to judge; Recommendations;
Assessment (**Ready to merge?** Yes | No | With fixes, and one or two sentences of reasoning). Give a
clear verdict. Do not say "looks good" without checking, and do not give feedback on code you did not
read.
