# Release 1 retrospective

Status: **Draft — waits for the owner** (v0.1, 2026-10-03). Two things are the owner's to do before this
document is final: correct the table in section 5 (Q2 (a)), and tick or reject each proposal in section 6
(Q3 (b)). · Author(s): Agent (Claude Code, Sonnet 5.5, background session) · Date: 2026-10-03
Task: `docs/03-specs/backlog.md` → **T-15c** · Plan: `docs/04-process/plans/2026-10-03-T-15c.md` (Q1 (b): this
is a document of its own; Phase 7's `retrospective.md` and the README narrative are not written here) ·
Phase: 5 (Build the slice), Release 1 · Evidence base: `docs/04-process/process-log.md` as of
`origin/develop` `88e839b` (the log is append-only and is not edited by this task)

## How this was made, and how far to trust it

- Counts come from a scratch script (Appendix A) and from `git`, `gh` and `grep` commands written next to each
  number. The script was run at the commit above.
- The themes in section 4 come from two read-only subagents (Opus 5.5, `Explore`, no write tools) that each
  read half of the log and listed lessons with line numbers, and two more that **re-read every cited line**
  and ruled it CONFIRMED, WEAK or REJECTED, with an exact quote. Only CONFIRMED lines are cited below. The
  lines dropped after that check are listed in section 4's last paragraph.
- A line number in this document is a line of `process-log.md` at that commit. The verifiers' quotes are
  verbatim; where a claim sits a few lines below an entry's heading, the line given is the line of the quote.
- The agent re-read the quotes it relies on most (log lines 2577, 5440–5441 and the hand-off sentences of the
  T-15 row) itself; the rest rest on the verifiers' reading, which a reviewer can re-check by line.

## 1. What Release 1 was

| Fact | Number | Source |
|---|---|---|
| First commit in the repository | 2026-09-03 | `git log origin/develop --reverse --format=%ad --date=short \| head -1` |
| First and last process-log entry before T-15c | 2026-09-08 · 2026-09-29 | the log's headings |
| Commits on `develop` | 559 | `git rev-list --count origin/develop` (taken at `88e839b`) |
| Pull requests merged · closed unmerged | 78 · 2 | `gh pr list --state merged --limit 300 --json number --jq length` (taken after #81 merged) · the same with `--state closed`, counting those whose `mergedAt` is null (2, taken before #80) |
| Backlog task rows | 25 (T-01 … T-16, with the T-02a, T-13a–d and T-15a–d splits) | `grep -c -E "^\| T-[0-9]+[a-z]* \|" docs/03-specs/backlog.md` |
| Implementation plans, every one with Status **Done** | 21 | `grep -m1 "^Status" docs/04-process/plans/*.md`, read 2026-10-03 (T-15c's own plan is the 22nd) |
| Architecture decision records | 7 (ADR-0001 … 0007), some amended | `ls docs/02-architecture/adr` |
| Process-log entries | 97 | Appendix A |
| Release 1 stories named in a test title | 18 of 18 | `npm run traceability` |
| Unit tests | 1166 in 90 files; statements 99.53 %, branches 96.5 % | `npx vitest run`; `npm run test:coverage` (worktree, `next` 16.3.8) |
| API tests | 110 | `npm run test:api` |
| End-to-end | 218 passed, 16 skipped on Chromium and WebKit locally; Firefox did not launch on the agent's Mac (117 tests, `Could not find profile folder`); CI ran Chromium, Firefox and WebKit green on PRs #79 and #81 | `npm run test:e2e`; `gh pr checks 79` |

Where it stands: production runs `main` on Vercel (T-14; the owner, T-15b plan Q4: "release artıq baş verib və
Verceldə artıq işləyir"); the repository has been public since 2026-09-20 (T-16's done list), T-15a added the
PolyForm Strict licence, and T-15b made `develop` the integration branch and `main` production-only.

## 2. What worked

Each item is something the log shows, not a feeling.

1. **Review caught what the author and the advisor missed.** Line 5100–5101: "the review caught what the
   author's passes and the advisor's did not, in a command that sends a secret" (T-14). Copilot's review of
   PR #71 "found that the `/home/` half of the pattern required a trailing `/`" (5844–5845), and at the end of
   T-15a: "Copilot's reviews found real defects in all three work pull requests" (6024–6025).
2. **Running the real thing found bugs unit tests could not.** T-11: "Every one of this task's 38 unit tests
   passed … It surfaced only when the app was actually run" (2156–2158). T-10: "Caught only because the agent
   took screenshots for the DoD and looked at them, rather than trusting 'all tests green'" (1947–1948).
   T-13 planning: "Running Firefox and WebKit found that `npm run test:all` is red today" (2517–2518).
3. **A rule written after a failure became a Definition-of-Done line.** "A configuration is not verified until
   it has failed on purpose" (1332) is now `definition-of-done.md`'s "a rule is not verified until it has
   failed on purpose" line in the code section. See theme B for how often it still recurred.
4. **Asking the owner changed the outcome.** T-15a: "the owner's answer to a licence question changed the
   licence itself" (6022–6027). The question was asked, not assumed.
5. **A security review turned into a register.** T-13d's review became TD-12 to TD-18, one entry per finding
   (`tech-debt.md` v1.18). Four were closed by PR #47 (TD-12, TD-15, TD-16, TD-18), two by T-14's measurements
   (TD-14, TD-17), and TD-13 (`TRACE`) stays Open as a documented platform limit (`tech-debt.md` v1.19–v1.22).
6. **Housekeeping closed the drift it found.** Before the Status-line housekeeping, "sixteen of nineteen said
   the wrong thing" (5426); today all 21 plans read **Done**.

## 3. What the specs missed

Seven lessons, all CONFIRMED against the log. The first five are about specs and requirements; the last two
are about claims in the tech-debt register and the backlog that were never checked.

| Line | What was missed | Quote |
|---|---|---|
| 62–63 | A design prototype carries only the visible; validation, keyboard and focus requirements must be listed outside it | "it silently omits non-visual requirements (validation, keyboard, focus)" |
| 200 | A figure was copied from the prototype instead of computed from the seed | "the drafting agent copied a figure from the prototype rather than recomputing it from the seed" |
| 281 | The same class of error came back one review later | "two design-vs-seed errors the drafting agent introduced *after* the previous review's lesson" |
| 310 | An amendment to one ADR was not checked against the others | "an amendment to one ADR must be grepped across the others (T9 removal missed ADR-0007)" |
| 5534–5535 | T-14's Goal cited NFR-D4 and nothing compared the runbook with that NFR's text | "no step of the plan compared the runbook with the text of the NFR rows its Goal cites" |
| 3985–3986 | A tech-debt entry's "guarded by" claim stood unchecked | "a tech-debt entry's 'Guarded meanwhile by: … not reachable by a normal request' is itself a claim that needs checking" |
| 4418–4419 | A backlog row stated GitHub's state in the present tense with no date or command | "The backlog row stated GitHub's state in the present tense … with no date or command" |

What these have in common is that the document said something that nobody was made to check against its
source: the prototype, the seed, the other ADRs, the NFR row, the settings page.

## 4. What the agents got wrong

Eight themes. A theme is here only if at least two entries confirm it (plan D4). "Confirmed" counts are the
verifiers' count of cited entries that held; the quotes are the three they chose as strongest.

**A. Defects start in what the plan dictated** — 15 entries confirmed.
The plan's own code or text was wrong, and the reviewers then found the defect in the plan's words. 2735–2736:
"Every Important finding of a first review round … was in code or text the plan dictated" (T-13). 3748:
"Both Important findings of a first review round were in text or code the plan dictated" (T-13c). 1596:
"The v0.1 plan's code had tests that could not fail" (T-08). A rule already exists for the symptom
(`governance.md`: plans mark predictions; scratch verification before the gate is allowed), and the pattern
still recurs from T-02 to T-15a.

**B. A guard or test that was never made to fail** — 12 confirmed; 1332 is where the rule starts, 1531 onward
are repeats. 2830–2831: "Every Important finding was a guard that could not fail" (T-13). 4871–4872: "the new guard
shipped without the violation fixture DoD v1.1 asks … had never been seen to fail" (T-14, Node guard).
5933: "That was a miss by the agent: A's guard had fixtures, and B's licence test did not" (T-15a, 2026-09-29;
the fail-on-purpose line had been in the DoD since T-01, where it is marked "T-01 lesson"). **A written rule did
not stop this one.**

**C. A claim stated as fact before it was measured** — 19 confirmed. 2933–2934: "The claim should have been
measured before it was made." 1798–1799: the log "claimed a run that had not happened". 2720: "Wrong predictions,
labelled 'Prediction' or not". Counts, summaries, "ready", a search summary taken as a source, a plan's expected
pass total.

**D. Questions and reports the owner could not act on** — 9 confirmed. 2870–2873: the agent "asked for these
decisions in shorthand … the owner could not act on them". 6235–6236: "Q5 as first written asked about merge
methods in terms the owner had not met" (T-15b). 3814–3815: "Q1 was worded around the `runtime` option … the owner
did not understand it". It recurred in the middle of this task: the owner answered "4 bunu anlamadım. izah et, 5 bunu izah et"
to the T-15c plan's Q4 and Q5.

**E. Stale state left in documents** — 7 confirmed. 5426: "sixteen of nineteen said the wrong thing" (plan Status
lines). 5125–5126: "two records still said 'owner decision: pending' on entries that were already closed".
6110 and 6199: "v0.2 left v0.1's present-tense lines" / "A plan that is answered in place keeps its v0.1
sentences."

**F. Git and shared-state hazards** — 9 confirmed. 536 (T-02a): `user.name`/`user.email`
("Scratch") were set in the repository's shared `.git/config`. 3086–3087: "The push re-created the deleted branch instead of
reaching the pull request"; 4620–4621: the same, "outside any pull request". 5363: "It ran `npm ci` in the
second worktree with a `cd` from the first." This session too: the shared Postgres container (`compose.yaml` fixes
the project name, so every checkout and session uses one container) was found stopped, with exit code 0, during a
test run; the agent's test commands do not call `docker`, and who stopped it is unconfirmed.

**G. Only running the real thing found the bug** — 9 confirmed (this is both a failure of the plan and the
reason theme 2 of section 2 exists). 2156–2158: 38 unit tests green while every authenticated page was broken.
1947–1948: screenshots beat "all tests green". 2414–2415: "every earlier run — all on Chromium — was green. **T-12
was merged with Firefox and WebKit red**".

**H. Reviews catch what the author missed, and the review process itself slips** — 10 confirmed. 3535:
"Governance v1.3 says code review subagents use Opus 5.5; most reviews here ran on Sonnet." 5222–5223: "the agent
had written the check without reading where the tag comes from, and every reviewer missed it". 4926–4927: "count
the fixes and the deferrals against the report's own totals".

**Lines dropped after verification** (WEAK or REJECTED; not cited above): A — 3993, 6032; B — 704; C — 818;
D — 2990 (rejected: the questions were structured; the miss was advice before asking), 6032; F — 4189, 4431,
6144.

**What the eight add up to.** Themes A, B and C say the same thing three ways: *a statement was accepted
before something could contradict it.* Theme E is the same thing in documents that outlive the work. Theme D
is the same thing at the owner's side: a question that cannot be answered is a statement the owner cannot
contradict. The rules that exist for this (predictions labelled, fail-on-purpose) were written after the
failure and recurred anyway (B, C). None of the proposals in section 6 is a check that fails by itself: they are
lines a reviewer reads. The log does not say whether a mechanical form of any of them (for example a CI step that
fails when a merged task's plan is not Done) would have stopped the recurrences; that would be a larger change and
a decision of its own.

## 5. What the owner changed, and the owner's fields still empty

**The log's 13 non-empty "Disagreements" fields** (`Disagreements` bullets whose text is not "none", Appendix A),
sorted by who disagreed with whom. Quotes are the start of each field.

| Kind | Lines | What the field says |
|---|---|---|
| Owner and agent: the owner decided | 83 | "agent pushed for a single priority; owner declined" |
| | 331 | "agent proposed deleting `apps/` and adding `scripts/` — owner accepted both" |
| | 672 | "the owner chose the npm overrides where the agent had recommended accepting the four advisories" |
| | 3053 | TD-9: "the agent rated a CSS check low-value … the owner wants it" |
| | 3295 and 3714 | Q4: "The plan recommended the unit test … the owner chose the linter" (the planning entry and its execution entry) |
| | 4880 | the region: "The agent recommended US East 1 …" (the owner chose Frankfurt, per the same entry) |
| Agent and a reviewer or Copilot | 541, 1141, 1255, 4167, 5839 | a reviewer's or Copilot's finding the agent did not take, or took in part |
| Not a disagreement with the owner | 2569 | "one open point, not a disagreement with the owner" |

Outcomes the "Disagreements" field says "none" for, but where the owner chose differently from the agent's
recommendation: T-15b follow-up, line 6208 — "(b) instead of the recommended (a)"; T-15b plan Q3, where the
owner gave the hotfix route in their own words; T-15a — "the owner's answer to a licence question changed the licence
itself" (6022–6027). In this task, the owner corrected the agent's first reading of Q7 ("bütün tech-deptlər (sic) sonra
fix olur. istisna o vaxt yaranır ki, eyni hal təkrarlansın. Onda fix edirik.") and set the draft rule recorded in P6.

**The 23 empty "Owner changes" fields** (Q2 (a)). The process log is append-only, so the answers are written
here, one row per entry. The script (Appendix A) found 27 fields whose text matched an "unfilled" marker; four
(794, 3698, 3938, 5435) are filled and were removed after reading them, leaving **23**. The column "Recorded
afterwards" is what the log or the plan says happened to that entry's work — it shows that the pull request
merged or that the owner decided something later, **not what the owner changed**, which is for the owner to
say. A row the owner does not remember is marked "not recalled" and not guessed.

| Field line | Date | Entry | Recorded afterwards | Owner's answer |
|---|---|---|---|---|
| 59 | 09-08 | Design exports analysed and added as inputs | "Phase 0 exit approved; Phase 1 interview started" (heading 70) | |
| 111 | 09-08 | Problem statement v0.1 drafted | "Phase 1 exit approved" (143) | |
| 165 | 09-08 | PRD, user stories and NFRs drafted | "open questions closed by owner" (170); "review findings applied → v0.3" (205); "Phase 2 exit approved" (214) | |
| 330 | 09-20 | T-01 scaffold | T-01 plan Status: Done, merged (PR #1) | |
| 414 | 09-20 | History rewrite: design exports purged | followed by "Migration to a fresh repository after the history rewrite" the same day | |
| 455 | 09-20 | Migration to a fresh repository | no later record read | |
| 540 | 09-22 | T-02a secret guard | "T-02a hand-off: owner dispositions" (566); PR #1, merge `b02fbd7` | |
| 671 | 09-22 | T-02 persistence, seed and test support | "T-02 hand-off: owner dispositions" (696); PR #6, merge `23f6478` | |
| 1171 | 09-23 | T-06 plan F1: 404 pages under the CSP | T-06 Status: Done, PR #17, merge `5d0877f` | |
| 1771 | 09-24 | T-09 Overview server and API | PR #21, merge `a7b938a` | |
| 1957 | 09-24 | T-10 Overview UI | PR #22, merge `099b91b` | |
| 2207 | 09-24 | T-11 WebMCP adapter | PR #24, merge `49740cb` | |
| 2362 | 09-24 | T-12 Release 1 WebMCP tools | PR #27, merge `838e0f5` | |
| 2974 | 09-24 | The first two CodeQL alerts, both in tests | the field says the fix follows "the owner's preference for zero open advisories"; no later record read | |
| 3215 | 09-24 | CodeQL alert #3, a stat-then-read race | same wording; no later record read | |
| 3823 | 09-25 | T-13a middleware → proxy, planning | T-13a Status: Done, PR #44, merge `00e39e9`; "Owner accepts ADR-0006 amendment (6); T-13a closed" | |
| 3891 | 09-25 | T-13a execution | same | |
| 3983 | 09-25 | T-13b `/_global-error`, planning | T-13b Status: Done, PR #46, merge `aad1423` | |
| 4067 | 09-25 | T-13b execution | same | |
| 4166 | 09-25 | T-13b whole-branch review and fix pass | same | |
| 4414 | 09-25 | T-13d, the GitHub-Settings check (plan Q3) | the field says "the decisions below are open"; later entries (branch model; seven required checks) record settings decisions — which open decision each answers was not checked | |
| 5304 | 09-26 | TD-19, the proxy for `.segments/*` and `.json` | PR #63, `dd81c44`, "which the owner merged" (`tech-debt.md` v1.25) | |
| 5484 | 09-26 | T-16 — what is already done, written down | "T-16 closed" entry (owner decision, backlog v1.48) | |

## 6. Proposals — tick or reject each (Q3 (b))

None of these is applied. Each names the document it would change, the wording, and the evidence. If the owner
ticks it, it goes into **one** pull request (`task/T-15c-rules`) with the other ticked ones, and a mechanical
rule ships with a test that fails on purpose. `definition-of-done.md` is mirrored in the PR template and a
unit test reads the mirror, so a DoD line is changed in both.

Checked 2026-10-03 with `grep` across `AGENTS.md`, `definition-of-done.md`, `build-workflow.md`,
`governance.md` and the PR template, with patterns for each proposal (plan Status and done-marker, the three
engines, `gh pr view`, question shape, draft, amendment, tense): **no match for any of P1–P8.** The nearest
text is for P7: DoD line 9 and the PR template's matching line say "No Accepted ADR is contradicted; if a
decision was needed, a new ADR or an amendment with a process-log entry exists", which does not mention
grepping the other ADRs.

| # | Change | Evidence | Owner |
|---|---|---|---|
| **P1** | DoD, Process: a line "the plan's Status reads Done in the pull request that merges the task" | 5443–5446: "only three of nineteen plans were closed when their task merged"; today 21 of 21 read Done only because the housekeeping PR fixed them | ☐ accept ☐ reject ☐ change: |
| **P2** | DoD, Process: a line "the backlog row's done-marker is in the same pull request" | 5487–5490. Measured now: **3 of 25** backlog task rows carry `Done` or `Closed` in their first 200 characters (T-15a, T-15b, T-16); `grep -c -E "^\| T-[0-9]+[a-z]* \| .{0,200}(Done\|Closed)" docs/03-specs/backlog.md` → 3 | ☐ accept ☐ reject ☐ change: |
| **P3** | DoD, Tests: the PR says the result of each of the three browser engines, and says which one could not run locally | T-15 row "from T-13 (v1.22, retro)"; 2414–2415 (T-12 merged with Firefox and WebKit red); this task's PR #80, where Firefox did not launch locally and CI was the check | ☐ accept ☐ reject ☐ change: |
| **P4** | `build-workflow.md`, rules of thumb: before any push to an existing branch run `gh pr view <n> --json state`; never push to a merged PR's branch, open a new branch | 1218 (four commits pushed to a merged PR's branch); 3086–3087 and 4620–4621 (the push re-created the deleted branch) | ☐ accept ☐ reject ☐ change: |
| **P5** | `governance.md` (or AGENTS.md §2): a question to the owner says what is decided, why, the options and a recommendation, and explains any term the owner has not met | theme D (9 confirmed); 2870–2873; 6235–6236; and the owner's "bunu anlamadım" on this task's Q4 and Q5 | ☐ accept ☐ reject ☐ change: |
| **P6** | `governance.md`, "Branches and releases", and the PR template's comment: **a pull request that is not a draft is merge-ready and the owner merges it; unfinished work stays a draft; a ready PR gets no more pushes** | the owner's rule, 2026-10-03: "draftdan çıxmış branchlər merge hazır sayılır və mən merge edirəm" (prompt record) | ☐ accept ☐ reject ☐ change: |
| **P7** | DoD, Scope: an amendment to one ADR is grepped across the other ADRs, with the result in the PR | 310 ("T9 removal missed ADR-0007"); the T-15c row of the backlog names it | ☐ accept ☐ reject ☐ change: |
| **P8** | `build-workflow.md`, rules of thumb: when a plan is answered in place, read the whole text once for tense and mark any question text kept as asked | 6199 (T-15b), and this task's own plan v0.2 had to be re-read for it | ☐ accept ☐ reject ☐ change: |

**Rules that already exist and recurred** (not proposals; a rule that fails is a different problem):
predictions labelled (`governance.md`, "Plans mark predictions") — theme C; fail-on-purpose (DoD) — theme B;
Opus for reviewers (`governance.md` v1.3) — theme H, 3535. The retro's reading is in section 4's last
paragraph: what recurred is what no check enforces.

**Not proposed, noted:** the plan and its code are written before they are run (theme A). The scratch-verification
rule of `build-workflow.md` v1.2 allows running it before the gate; the owner may want a stronger form, but
that is a larger change than a line, and the log gives no single wording.

## 7. Not yet observed

The owner's Q5 answer: these are read at the **end of Release 2**, when the first `develop` → `main` release
runs through the new rules. No pull request with head `develop` has targeted `main` yet (`gh pr list --base main
--state all`, 2026-10-03: the only one after the switch is the probe #76, closed unmerged).

1. The `release source` check's green on a real `develop` → `main` pull request (T-15b's Review Focus 4).
2. That `develop` survives the release: `delete_branch_on_merge` is `true`, and `develop`'s `deletion` rule
   should refuse the deletion; the rule is read from `gh api repos/wdaz/ai-native-personal-finance/rules/branches/develop`
   (seven rule types, 2026-10-03), not observed (Review Focus 5).
3. That a `develop` → `main` pull request can only be merged with a merge commit (`allowed_merge_methods` is
   `["merge"]` on both branches since T-15b's follow-up).
4. The headed native check (NFR-B2): the Release 1 log says `deploy.md` records that nobody has run it.
5. Firefox on the agent's own machine: it did not launch in this session; only CI has run it.

## 8. Found while writing this retro

| Finding | Where it went |
|---|---|
| `npm audit` read 10: 1 critical in `next`, 9 high | the critical one: PR #80 (`next` 16.3.8, merged `0f07f31`) |
| The nine high are one `braces` advisory with no patched release | TD-23, PR #81 (`tech-debt.md` v1.28, backlog v1.56); the owner's rule: all tech debts are fixed at the end, sooner if the same case repeats |
| `develop` already had its protection | read, seven rule types; see section 7, item 2 |
| The shared Postgres container was stopped mid-run | noted under theme F; no change |

## 9. Next

1. The owner corrects section 5's table and ticks section 6.
2. The agent opens one pull request with the ticked rule changes, then closes T-15c: backlog v1.57 (T-15c done-marker,
   a "from T-15c" hand-off on T-15d's row so Release 2's specs start from section 3 and theme D), the plan's
   Status line Done, this document final, and the log entry that points to it.
3. T-15d: Release 2 spec work; its depth is the owner's decision when it is planned.

## Appendix A — the counting script

A scratch script, run once; it is not a file of the repository. Run it as `node count.mjs docs/04-process/process-log.md`.
"Unfilled" is a regular expression on the field's text; its false positives (794, 3698, 3938, 5435) were read
and removed by hand. Its output at `origin/develop` `88e839b` (the same at `0f07f31`: the log did not change): `entries` 97, `ownerChangesFields` 73,
`entriesWithoutOwnerChangesField` 24, `unfilledOwnerChanges` 27 (23 after the four removals),
`lessonsFields` 67, `gotWrongFields` 72, `disagreementsNotNone` 13. Plain `grep -c` on the phrases gives slightly
larger numbers (76, 70 and 75), because it also counts a phrase quoted in running text.

```js
// Scratch, not kept in the repository: counts the process log's entries and fields.
import { readFileSync } from "node:fs";

const file = process.argv[2];
const lines = readFileSync(file, "utf8").split("\n");

const heads = [];
lines.forEach((l, i) => {
  if (/^## 20\d\d-\d\d-\d\d/.test(l)) heads.push(i);
});
heads.push(lines.length);

const fieldRe = (name) => new RegExp(`^- \\*\\*${name}[^:]*:\\*\\*`);
const UNFILLED =
  /none yet|left for the owner|owner to fill|_\(owner|awaiting (the owner'?s? )?review|has not reviewed|owner has not|awaiting review/i;

let withField = 0;
let withoutField = [];
let unfilled = [];
let lessons = 0;
let wrong = 0;
let disagreementsNonNone = 0;
const disList = [];

for (let h = 0; h < heads.length - 1; h++) {
  const start = heads[h];
  const end = heads[h + 1];
  const block = lines.slice(start, end);
  const idx = (re) => block.findIndex((l) => re.test(l));
  const field = (name) => {
    const i = idx(fieldRe(name));
    if (i < 0) return null;
    let j = i + 1;
    while (j < block.length && !/^- \*\*/.test(block[j])) j++;
    return { line: start + i + 1, text: block.slice(i, j).join("\n") };
  };
  const oc = field("Owner changes");
  if (idx(fieldRe("Lessons for the process")) >= 0) lessons++;
  if (idx(fieldRe("What the agent got wrong")) >= 0) wrong++;
  const dis = field("Disagreements");
  if (dis && !/:\*\*\s*none\b/i.test(dis.text.split("\n")[0])) {
    disagreementsNonNone++;
    disList.push(dis.line + " " + lines[start].slice(3, 60) + " >> " + dis.text.replace(/\s+/g, " ").slice(0, 170));
  }
  if (oc) {
    withField++;
    if (UNFILLED.test(oc.text))
      unfilled.push({
        line: oc.line,
        head: lines[start].slice(0, 70) + " >> " + oc.text.replace(/\s+/g, " ").slice(0, 150),
      });
  } else {
    withoutField.push({ line: start + 1, head: lines[start].slice(0, 90) });
  }
}

console.log(
  JSON.stringify(
    {
      entries: heads.length - 1,
      ownerChangesFields: withField,
      entriesWithoutOwnerChangesField: withoutField.length,
      unfilledOwnerChanges: unfilled.length,
      lessonsFields: lessons,
      gotWrongFields: wrong,
      disagreementsNotNone: disagreementsNonNone,
    },
    null,
    1,
  ),
);
console.log("UNFILLED:");
for (const u of unfilled) console.log(u.line, u.head);
console.log("NO FIELD:");
for (const u of withoutField) console.log(u.line, u.head);
console.log("DISAGREEMENTS:");
for (const d of disList) console.log(d);
```

