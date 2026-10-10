# Retrospective — the whole project, from the skeleton to the Release 2 build

Status: **Draft** (v0.1, 2026-10-11) — for the owner's review; only the owner marks it Approved (`AGENTS.md` §3). ·
Author(s): Agent (Claude Code, Sonnet 5.5, cloud thread "Phase 7 README") · Date: 2026-10-11
Phase: 7 (Retrospective and portfolio narrative) · Roadmap outcome 6 (`roadmap.md`, "Release 2 goal") ·
Evidence base: `docs/04-process/process-log.md` (121 entries) at `origin/develop` `953b9bf`; the log is append-only
and is not edited here, except for this task's own entry.

## How this was made, and how far to trust it

- It **builds on** `release-1-retrospective.md` (Release 1, 2026-10-03), which already covers the log up to
  2026-09-29 with line-checked themes A–H. Those themes are not redone; this document cites them by letter.
- The log from 2026-10-03 to 2026-10-10 (lines 6244–7353: T-15c, T-15d, the governance changes, the hotfixes and
  the build tasks T-17…T-26) was read by one read-only Opus subagent, which listed themes with line numbers and
  verbatim quotes. The agent re-opened the quotes it relies on most (lines 6477, 6484, 6608, 6692–6693, 7024,
  7039, 6990) and they match. The other quotes rest on the subagent's reading; a reviewer can check each by line.
- Counts come from `git`, `gh api` (REST) and `npm` commands written next to each number. A line number is a line
  of `process-log.md` at the commit above.
- The "What the owner would change" part (section 6) is **not written by the agent**. It lists what the log shows
  the owner changed, and leaves the owner's own verdict as questions. An agent cannot say what the owner thinks.

## 1. The project in numbers

| Fact | Number | Source |
|---|---|---|
| First and latest commit on `develop` | 2026-09-03 · 2026-10-11 (38 days) | `git log origin/develop --format=%ad --date=short` (full clone) |
| Commits on `develop` | 938 | `git rev-list --count origin/develop` |
| Release 1 pull requests (to #81) · Release 2 and after (#84–#139) | 78 merged, 2 closed unmerged (R1 retro) · 54 merged | R1 retro §1; `gh api repos/wdaz/ai-native-personal-finance/pulls?state=all` (first 100 pull requests, #41–#141), `merged_at` set |
| Process-log entries | 121 before this task's own entry (97 at the Release 1 retro) | `git show origin/develop:docs/04-process/process-log.md \| grep -c "^## "` |
| Implementation plans | 35 files | `ls docs/04-process/plans/*.md` |
| Architecture decision records | 7 (ADR-0001 … 0007), most amended | `ls docs/02-architecture/adr` |
| User stories traced to a test title | 41 of 41 (Releases 1 and 2) | `npm run traceability` |
| Unit tests | 2156 in 135 files; 2155 pass here | `npx vitest run`, 2026-10-11: the one failure is `install-scripts.test.ts`, which needs npm 11 (this machine has 10.9.4; CI runs 11) |
| WebMCP tools registered | 14 (2 in Release 1, 12 in Release 2) | `docs/03-specs/webmcp-tools.md` §4 |
| API and end-to-end specs | 21 and 17 spec files | `ls tests/api/*.spec.ts tests/e2e/*.spec.ts`; **not run in this session** (no database or browsers), CI is the check |

Where it stands (2026-10-11): production runs Release 1 and its two hotfixes. Release 2 (Transactions, Recurring
Bills, Budgets, Pots and their agent tools) is built and merged into `develop`; its `develop` → `main` pull request,
#141, is open and the owner merges it. Everything below about Release 2 is therefore about the **build**, not about
a release that has run in production.

## 2. What AI-native meant here, phase by phase

| Phase | What the agent did | What the owner did | Evidence |
|---|---|---|---|
| 0–1 Skeleton, Discovery (2026-09-03…08) | Structured the repository, analysed the design exports, interviewed, drafted the problem statement and a research note on WebMCP | Answered the interview, approved each exit | log 8–157 |
| 2 Requirements (09-08…13) | Drafted PRD, stories, NFRs; a fresh agent reviewed them adversarially; findings applied (v0.3) | Closed the open questions, approved | log 158–228 |
| 3 Architecture (09-13) | Proposed ADR-0001 with alternatives, drafted ADR-0002…0007 | Accepted them (agents never mark Accepted) | log 229–266 |
| 4 Specs and plan (09-20) | Wrote the Release 1 specs, the Definition of Done and the backlog; adversarial review; v0.2 | Approved; handed the build to Claude Code | log 267–303 |
| 5 Build, Release 1 (09-20…10-03) | One plan and one pull request per task (T-01…T-16), plan gates, subagent review, CI hardening, deploy | Reviewed and merged every pull request; decided every fork the plan raised | R1 retro §1–§5 |
| 5 and 4 again, Release 2 specs (10-03…10-10) | T-15c (Phase 5), then specs for Transactions, Recurring Bills, Budgets, Pots, the write path and the WebMCP tools; a *designer* agent decides every design question | Approved; set the Release 2 goal; moved to "merge on green CI" for Release 2 | log 6244–6931 (the log heads T-15c and the Vercel change "Phase 5", the rest "Phase 4") |
| 4 (Release 2), the build (10-10) | T-17…T-26: one shared write pipeline, four pages, 12 tools, each task a plan, a draft pull request, an Opus `/code-review`, fixes, merge on green | Standing rules (questions go to the coordinator session; merge on green CI) instead of per-pull-request approval | log 6932–7353; the log heads these entries "Phase 4 (Release 2)", because the roadmap has no Phase 6 exit yet |

The working pattern that the log shows from Phase 5 on is the same in every task: **a plan with predictions, a
gate where the owner answers questions, an implementation, a review by a fresh agent, a log entry**. The
documents were the context: an agent starting a task read `AGENTS.md`, the roadmap, the spec and the plan, and
nothing else was handed over.

## 3. What worked

1. **A reviewer that is not the author finds defects the author missed**, and it kept doing so after the process
   changed. Release 1: R1 retro §2, item 1. Release 2: an Opus review of each spec pull request "found 10 defects
   in total, all wording" (6870); in T-19 it found that pagination moved focus after Back and Forward (7029–7030);
   in T-25 a deadlock under a reset during a move (7275).
2. **Running the real thing found what tests and drawings hid.** T-19: "the E2E test of US-33 found what the drawing
   hides: at 320 px the pagination needed 348 px of 248" (7024). T-17: the API test of `guardedWrite` found a real
   defect through the pg driver adapter (6953). Release 1 had the same finding, but after merge (theme G); in
   Release 2 it came before merge.
3. **Fixes are pinned by a test that fails without them.** T-17: "Each rule was shown red before its code" (6952);
   T-19: "both fixed with unit tests that fail without" the fix (7030).
4. **Shared parts compounded.** T-23's entry says `guardedWrite` from T-17 "made each route a few lines" (7239);
   T-26's says T-22's parts and T-25's domain "made the page an assembly" (7341). Four pages and 12 tools were built
   in one day because the write path, the UI kit and the tool adapter had already been specified and built once.
5. **Design questions have an owner of their own.** From governance v1.11 on (v1.10 routed it through the owner), an agent that meets a design question
   stops and asks the designer agent (*propose*) instead of guessing (6866, 6782). The cost: every design decision
   is a round trip. The gain: no spec value in Release 2 was invented by the drafting agent.
6. **Process was changed when it failed, in a numbered, dated document.** Governance went from v1.8 to v1.15
   during Release 2; each version is an entry (section 5).
7. **Traceability held to the end.** 41 of 41 stories are named in a test title, and every build task has a plan
   and a log entry.

## 4. What went wrong

Release 1's themes A–H (R1 retro §4) are the baseline. Of the ten themes the Release 2 read found, **six are
recurrences** (L1 to L6) and four are new (L7 to L10). Quotes are from `process-log.md`.

| # | Theme | Evidence | Recurrence of |
|---|---|---|---|
| L1 | **Specs written from a second-hand source.** | 6477: "Specs drafted from a stale export. `ui-kit.md` v0.1 and v0.2 were written from the design export of 2026-10-04 22:17, which lacked the designer's changelog §8 and §9"; 6730: a goal "written from a status summary"; 6878: three spec pull requests cited §25 before the designer had written it | C, E |
| L2 | **A plan's prediction or decision that nobody checked.** | 6484: "Plan D3 was not checked against the required checks when it was written; this pull request found it"; 6822: the plan guessed a name would be cut at 375 px "and it was not"; 6833: a layout prediction "is a guess until a browser" shows it | A, C |
| L3 | **The first test expectations were wrong about the code's own output**, in almost every build task. | 7241: "two test expectations in `budgetFillPercent`'s table were wrong"; 7308: "Several first E2E expectations were wrong about the page's own text"; 7345: the first E2E assumed registration order | C |
| L4 | **Only a real browser or driver found the defect** (now before merge). | 6953, 7024 (above); 7083: the first trigger width "left out the 2px border" | G |
| L5 | **A test that passed for the wrong reason.** | 6692–6693: "four of them first passed for the wrong reason (the test had no clock, so the approval never took effect and every "refused" assertion held)"; 6674: a guard claimed three tools and covered fewer | B |
| L6 | **The review process slipped: tools and briefs.** | 6481: workflow agents "had no Agent tool" and could not dispatch reviewers; 6483: two required reviews "ran only after an independent audit found them missing"; 6880: review subagents had no shell | H |
| L7 | **The required external reviewer (Copilot) was unreliable**, so a rule (v1.9) needed repeated exceptions, until v1.15 turned it off for `develop`. | 6457–6458: on #97, "6 of its 8 Copilot reviews read 'Copilot encountered an error'"; 6789: a weekly rate limit; 7039: "Copilot errored on each run, so the Opus review is the only one" | new |
| L8 | **Merge authority drifted from what governance says.** | 6485: "An administrator bypass was attempted on #99", refused by the harness; 6490: six amendments of Approved documents merged by the agent on conditional words; 6608: "The merge permissions are in no governance version" — the Decision-rights row still said Agent "Never" | new |
| L9 | **Agent tooling did not travel.** | 6765: "a check that lives in a local mod does not travel to remote or cloud" sessions; 6784: v1.12 copied the mod's tools without checking what a write needs | new |
| L10 | **The same UI and design slips repeated across tasks.** | 6821, 7212, 7343: state set in an effect or an updater, refused by the lint rule or by StrictMode; 6873, 6876, 7310: design decisions recorded without a technical or spec check | new |

Release 1 themes **with no clear recurrence in Release 2**: D (questions the owner could not act on; the only
instance in the range is T-15c itself, 6275) and F (git and shared-state hazards; none found in 6314–7353).
That is an absence in what the subagent found, not proof that they stopped.

**The through-line is unchanged from the Release 1 retro:** a statement was accepted before something could
contradict it (L1, L2, L3, L5). What did change is *where* it was caught. In Release 1 the contradiction often
arrived after merge or from Copilot; in Release 2 it arrived from a fresh Opus review or a real browser before
merge (L4, section 3). The rules that were added after Release 1 (P1–P8) did not stop the recurrences by
themselves; the review step did.

## 5. How the process itself changed

| Version | Date | Change | Why |
|---|---|---|---|
| governance v1.8 | 10-03 | P5 and P6 of the Release 1 retro (P1–P4, P7, P8 went to DoD v1.2 and build-workflow v1.3) | R1 retro §6 |
| v1.9 | 10-04 | Copilot is the mandatory reviewer; a pull request leaves draft only after Copilot reviewed its head | review had missed things in Release 1 |
| v1.10 | 10-05 | Design questions go agent → owner → designer | L1: specs drafted from a stale export |
| v1.11 | 10-06 | A five-step route through the designer agent in every phase; `DESIGN-Q` returned by implementers | the v1.10 route cost too many hand-offs |
| v1.12, v1.13 | 10-10 | The designer agent moves into the repository (`.claude/agents/designer.md`) and gets Claude Design's `finalize_plan` tool | L9: a mod-held agent did not load remotely |
| v1.14 | 10-10 | The design folder, not Claude Design, is the design source | Claude Design is no longer updated (owner) |
| v1.15 | 10-10 | Copilot review off for `develop`; `/code-review` by a fresh Opus subagent before ready | L7 |
| — | 10-10 | Standing rules (questions go to the coordinator; merge on green CI; at most two work threads) | owner; **recorded in the log and the project's memory, not in a governance version** (6608) |

Two changes are of a different kind from the rest: the owner moved from approving each pull request to merging
on green CI for everything up to this retrospective, and kept two decisions for themselves: marking documents
Approved, and merging **this** pull request.

## 6. What the owner changed, and what is still the owner's to say

Owner decisions and rules recorded in the log (6291–6299, 6595, 6733, 6760, 6823, 7046, 7110); those marked "over" are overrides of the agent's recommendation, the others are new rules or choices: the Release 1
retrospective written as a document of its own (T-15c Q1 (b) over the recommended (a), 6291); the rule that a pull request that is not a draft is merge-ready;
"Repoda hədəf olmalıdır" — a Release 2 goal had to be in the repository (6731); one designer agent that both
proposes and applies (6760, over the agent's recommendation to keep writes behind the mod's guard, 6763); TD-24, a form's message clearing as the person types, fixed after all releases and not as the design's rule had it (6519–6522); stopping
Vercel deploys for `claude/*` branches rather than buying Pro (7046). In the Release 2 range, of five non-empty "Disagreements" fields, four begin "none" and only one records a disagreement (6763: the owner chose one designer agent over the agent's recommendation).

**Questions for the owner** (not answered here; answer in the review of this pull request):

1. Which of Release 2's 10 themes (section 4) would you not accept as written, and which is missing?
2. Merge on green CI saved time in Release 2. Is the rule to be written into `governance.md` (L8), or kept as a
   Release 2 exception?
3. Was the designer agent worth its round trips (section 3, item 5)?
4. What would you change if the project were started again?

## 7. Not yet observed

Carried over from `release-1-retrospective.md` §7; nothing in the Release 2 log contradicts them, and none can be
read before the release pull request #141 is merged:

1. The `release source` check green on a real `develop` → `main` pull request.
2. `develop` surviving the release (`delete_branch_on_merge`, the `deletion` rule).
3. Only a merge commit allowed on `main`.
4. The headed native WebMCP check (NFR-B2) on the owner's machine, with all 14 tools.
5. Firefox on the agent's own machine (the log: "Firefox and WebKit E2E ran only in CI", 7186).
6. New for this document: the Lighthouse rows "(on release)" for Transactions and Budgets, and the claim that every
   Release 2 story passes its acceptance criteria **in production** (roadmap outcome 2): the stories pass in CI on
   `develop`; production is the owner's merge of #141.

## 8. Next

1. The owner reviews this pull request, answers section 6, and merges it. (The agent does not merge it.)
2. The owner merges #141 (T-27); the items of section 7 are then read and this retrospective's section 1 updated
   in a follow-up.
3. Open tech debt stays as the owner ruled: fixed after all releases.
