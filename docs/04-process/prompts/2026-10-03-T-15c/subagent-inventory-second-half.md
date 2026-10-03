# Subagent 2 — inventory of the process log, lines 3126–end

Agent type `Explore` (read-only, no write tools), model Opus 5.5, dispatched 2026-10-03 for the T-15c plan.
Copied from the brief the agent sent and the hand-off message that came back. The absolute home path in both is
replaced by the placeholder `/Users/<name>` (the home-path guard, T-15a); nothing else is changed.

## Brief

Read-only task. File: `/Users/<name>/Own/ai-native-personal-finance/.claude/worktrees/task-T-15c/docs/04-process/process-log.md` — read lines 3150 to the end (about 6242) in chunks (entries start with "## YYYY-MM-DD —"). Do NOT edit anything.

Goal: an inventory for a Release 1 retrospective. For EVERY entry in that range, extract from its fields "What the agent got wrong or missed", "Lessons for the process", "Disagreements" (only if not 'none') and "Owner changes and reasoning" (note if it says 'none yet').

Output (English, max ~1400 words, compact):

1. A table: line number of the entry heading | date+short title | one-line lesson(s) / agent errors worth keeping | theme tag (one of: plan-quality, review-process, DoD/template, CI/tooling, git/branching, agent-behaviour, spec-gaps, security, other) | 'owner-none-yet' flag if the Owner changes field is unfilled.
   Skip entries with nothing of substance; do not pad.
2. Then a section "Recurring patterns": 5-10 themes that appear in 3+ entries, each with the entry line numbers as evidence.
3. Then "Explicit hand-offs to the retrospective": every place that says a lesson is for T-15 / T-15c / 'retrospective' / 'retro', with line number and the exact quoted sentence (short).
   Be faithful: quote or closely paraphrase, never invent. Give line numbers so claims can be checked.

## Report

### Release 1 retrospective inventory: process-log.md, lines 3126 to 6242

File: `/Users/<name>/Own/ai-native-personal-finance/.claude/worktrees/task-T-15c/docs/04-process/process-log.md`. I started at 3126 because the entry that begins there runs past line 3150. "Owner flag" in the table means the "Owner changes and reasoning" field was never filled: it reads "none yet", "left for the owner" or "_(owner to fill…)_".

#### 1. Entry table

| Line | Entry | Errors and lessons worth keeping | Theme | Owner flag |
|---|---|---|---|---|
| 3126 | 09-24 CodeQL advanced workflow | The agent first offered to record the decision inside PR #37. Lesson: "switching to 'advanced' gives control, not coverage; the suite line decides coverage". "0 results" means nothing without the rules run and the files read. | CI/tooling | The entry has no Owner-changes field, only "Owner decisions". |
| 3188 | 09-24 CodeQL alert #3 | The race cannot be tested from Vitest. Open discrepancy: the PR scan found 0 and the scan of `main` found 1, so "a clean scan of a pull request does not show that the repository is clean". | CI/tooling | owner-none-yet (3215) |
| 3227 | 09-24 T-13c planning, written after the fact | The secret scan stopped the plan's commit on 16 fake URLs. The advisor found 3 defects. Lessons: use placeholder passwords from the start; scratch verification finds what reading does not; when the owner overrules, measure the cost of their choice; "Expected" numbers drift. Disagreement on Q4: the plan recommended a unit test and the owner chose a linter. | plan-quality | — |
| 3310 | 09-25 T-13c execution | The plan's Task 4 URL guard had a parsing gap (pg re-encodes the string). Five planned numbers differed from the measured ones. A README sentence overstated the lint rule's scope. Reviews ran on Sonnet although governance v1.3 says Opus. The plan was not on the task branch. Lessons: L1, read a string as its consumer does and fuzz the two readers; L9, "read `governance.md` first"; L10, "Both Important findings… were in text or code the plan dictated… as in T-13". | plan-quality, review-process | "_(owner to fill after review)_" (3712) |
| 3786 | 09-25 T-13a planning | The backlog and TD-2 were wrong about `runtime`. The codemod's `--dry` is not dry. Q1 did not say what was wrong. Q3 offered a unit test instead of the repo's lint-rule pattern. Lessons: a tech-debt Fix line is a hypothesis; a spec citation in a comment is not evidence; a question says what is wrong before it names options. | spec-gaps, agent-behaviour | "left for the owner" (3823) |
| 3836 | 09-25 T-13a execution | The plan's expected list left out `proxy.ts`. Its commit steps had no trailers. It said "replace" on a dated snapshot. Lesson: read each plan "replace" against the target document's own rules. | plan-quality | left for owner (3891) |
| 3903 | 09-25 ADR-0006 accepted | The closing report did not say what the amendment was, and two numbered lists both had an item "2". Lessons: say what a decision is and where to read it; number only one list. | agent-behaviour | Filled; notes the T-13a fields are still empty (3939). |
| 3949 | 09-25 T-13b planning | A tech-debt "Guarded meanwhile by…" claim had gone unchecked since 09-23. | spec-gaps | left for owner (3983) |
| 3993 | 09-25 T-13b execution | A mutation prediction was off by one assertion. There was no Docker daemon, so plans need a documented fallback. The coverage gate was not confirmed. | plan-quality, CI/tooling | left for owner (4067) |
| 4083 | 09-25 T-13b whole-branch review | The agent inferred a mechanism without tracing the code path. A count was eyeballed ("three" scripts; there are two). A deviation from the plan was not ledgered. Lessons: produce counts with a script; write deviations into the log. Disagreement: the reviewer's Important finding 3 was answered with a ruling, not a text change. | review-process | left for owner (4166) |
| 4189 | 09-25 T-13d security review | Four subagents were dispatched before the plan was merged onto the execution branch. The skill's template self-check does not fit a NOT TESTED item that could be Critical. A curl CSRF test does not show browser exploitability. | git/branching, security | — |
| 4279 | 09-25 T-13d fixes, PR #47 | `findLast` failed against the ES2022 lib. The agent picked the 403 body shape on its own. Lessons: "fix the rest" still includes the investigation; surface a fork in a shared schema. | agent-behaviour | — |
| 4340 | 09-25 GitHub-Settings check | The first CODEOWNERS comment stated an untested rule as settled fact. Lessons: name the exact command that would settle a NOT TESTED item; a settings claim carries its date and command. | security, spec-gaps | owner-none-yet (4414) |
| 4431 | 09-25 branch model | The ruleset source-branch assumption was not checked against GitHub's docs. `main` is hard-coded in governance, AGENTS.md, the workflows and the ruleset. | git/branching | — |
| 4478 | 09-25 SHA pins | The agent did not read the actions' code. Lesson: a required check is "a string contract" between ruleset and workflow. | CI/tooling | — |
| 4542 | 09-25 follow-ups | A web-search summary contradicted itself. Lesson: "a search summary is a lead, not a source". | agent-behaviour | — |
| 4597 | 09-25 addendum | A push just after #49 merged recreated a deleted branch, and the commit edited a merged entry (against the append-only rule). Lesson: guard such pushes with `--force-with-lease`, "Proposed, not yet used". | git/branching | — |
| 4637 | 09-25 seven required checks | A flaky E2E leg now blocks merges. Lesson: change a policy when nothing is running, then prove it with a re-run. | CI/tooling | — |
| 4702 | 09-25 README demo credentials | A `head -50` cut the search results. Lesson: a value that is public by design still needs a warning. | security | — |
| 4801 | 09-25 Node 24, deploy accounts | `vercel mcp` was run from the home directory. Node 26 was never compared with the deploy target. The guard shipped without the violation fixture DoD v1.1 asks for. Lessons: pick the runtime from the target's supported list; vendor onboarding prompts default to the widest scope. Disagreement on region: the owner chose Frankfurt. | DoD/template, CI/tooling | — |
| 4896 | 09-25 Node 24 addendum | The agent misstated the review's totals ("four fixed" when it was five of six), and the PR description was wrong too. Lesson: count fixes and deferrals against the report's totals. | review-process | — |
| 4933 | 09-25 T-14 planning | The v0.1 draft had 3 defects, all caught by the advisor. Lesson: read a platform's first-run behaviour before designing the steps. | plan-quality | — |
| 4971 | 09-26 T-14 deploy | A test was missed. A runbook `grep \| cut` kept the quotes, which would have broken every login. The Lighthouse reports would have published the session cookie. The runbook kept a guess after the fact arrived. The plan gave the agent secret writes without checking the harness allows them. Lessons 1, 5, 6. | plan-quality, security | — |
| 5107 | 09-26 merge-gate addendum | Stale "pending" lines on closed entries. Lesson: grep a closing entry for its own stale words. | DoD/template | — |
| 5136 | 09-26 production | The artifact step was tested only by reading docs. Lessons: check the public URL after every production deploy; run a publishing CI step once on CI. | CI/tooling | — |
| 5188 | 09-26 last checks | The runbook's check was on the wrong page and "every reviewer missed it". The 03:00 cron window passed unobserved. Lessons: write a runbook check from the code that renders the thing; a time window needs an owner; "A permanently red CI check trains people to ignore it." | review-process, plan-quality | — |
| 5246 | 09-26 TD-19 | An unmeasured assumption about `.rsc`. "Green Vitest is not type-green." A stray server would have been reused by Playwright. | CI/tooling | owner-none-yet (5304) |
| 5317 | 09-26 TD-20 | A `cd` into the other worktree locked the harness. The guard read raw text where pg reads decoded values. The reviewer brief got the dependency type wrong. Gitleaks refused new fixtures. Lessons: switch with `EnterWorktree` and a path, never `cd`; a text guard needs a decoded post-condition. | agent-behaviour, git/branching | — |
| 5405 | 09-26 Status-line housekeeping | Wrong "stale" claim; the agent counted 1 stale plan, then 16. Lesson: "only three of nineteen plans were closed when their task merged"; the DoD needs a line. | DoD/template | Owner says the "none yet" fields will be filled at the retro (5440–41). |
| 5451 | 09-26 T-16 done list | The first answer left three things unchecked, and the agent misread the backlog version. Lesson: a backlog row keeps its tense; a done-marker is cheap in the PR and expensive a week later. | DoD/template | owner-none-yet (5484) |
| 5498 | 09-26 NFR-D4 missed | T-14 never checked its runbook against the NFR rows its Goal cites. "Idle" is not "cold". Lesson: when a Goal cites NFR rows, check each row's artefact exists. | spec-gaps, plan-quality | — |
| 5561 | 09-26 T-16 closed | The agent picked one side of conflicting documents instead of asking. A one-line security explanation did not reach the owner. It said "none cancelled" before counting. | agent-behaviour | — |
| 5650 | 09-26 T-15 split | Its letter groups collided with the subtask letters. Lesson: number groups instead of lettering them. | agent-behaviour | — |
| 5717 | 09-26 `gitleaks:allow` | The shared `core.hooksPath` meant worktree commits ran the main checkout's hook. Lesson: a one-off check is weaker than the same check as a gate. | CI/tooling | — |
| 5782 | 09-29 T-15a PR A | The plan's C3 order could not produce its own evidence. The agent widened a recorded decision (code became "code and documentation"); asking about it reversed the licence. The harness refused some commands. Disagreement: some Copilot points not taken; it was right on `/home/` and on `~` inside quotes. Lessons: do not widen a decision recorded in the owner's words; stage before scanning. | agent-behaviour, review-process | — |
| 5872 | 09-29 T-15a PR B | Loose F3 wording. The licence test lacked the DoD's failing fixture, and Copilot caught it. Lessons: say how many files a scan expects; quote markers from `grep`. | DoD/template | "none in B yet" (5929) |
| 5954 | 09-29 T-15a closed | A `sleep` wait was refused by the harness. Lessons addressed to T-15c (section 3). | review-process | — |
| 6032 | 09-29 T-15b PR A | Misread "Develop yaranıb" (the branch had not been created). Misread Q5. v0.2 kept v0.1's present-tense lines. This entry has no Lessons field. | plan-quality | — |
| 6144 | 09-29 T-15b closed | A compound `gh` command was refused. Lessons: a ruleset that targets "the default branch" follows the default when it changes; `pull_request_target` reads the default branch; read an answered plan for tense once. | git/branching | — |
| 6208 | 09-29 merge commits only | Q5 used terms the owner had not met. The owner chose (b), not the recommended (a). This entry has no Lessons field. | agent-behaviour | — |

I skipped 4758 (T-13d closed): it reports nothing wrong and "Lessons: none beyond the entries above".

#### 2. Recurring patterns

1. **Defects come from what the plan dictated, and the plan's expectations drift.** 3227, 3310 (L10), 3836, 3993, 4083, 4933, 4971, 5782, 6032.
2. **Claims are stated as fact, or counted, before being measured.** 3786, 4083, 4340, 4542, 4801, 4896, 4971 (L3, L6), 5188, 5246, 5405, 5561.
3. **Owner questions and reports were not understandable.** 3786 (Q1), 3903, 5561, 5650, 6032 (Q5), 6208.
4. **Documents keep stale state: Status lines, "pending", guesses, old tense.** 3310 (item 5), 4971 (L6), 5107, 5405, 5451, 6032, 6144.
5. **The harness and environment refused or constrained work.** Docker missing at 3993; refusals at 4971, 5317, 5782, 5954, 6032, 6144.
6. **Reviews caught what the author missed, but the review process itself slipped.** Wrong model at 3310. Reviewer misreads at 4083. Totals miscounted at 4896. Reviewers missed things at 4971 and 5188. Copilot found real defects at 5782, 5872 and 5954.
7. **The secret scan and gitleaks clashed with fixtures and plans.** 3227, 3310 (L6), 5317, 5717.
8. **The DoD and templates have gaps.** Guard fixtures at 4801 and 5872; plan Status at 5405; done-markers at 5451; NFR artefact check at 5498.
9. **Branch, worktree and push hazards.** 4189, 4431, 4597, 5317, 5717, 6144.
10. **Owner fields were left unfilled.** 3215, 3712, 3823, 3891, 3939, 3983, 4067, 4166, 4414, 5304, 5484, 5929. The owner deferred these to the retro at 5441.

#### 3. Explicit hand-offs to the retrospective

- **5440–41:** "The 'Owner changes: none yet' fields of earlier entries are left for the owner to fill at the general retrospective ('Ümumi retroda danışacam')."
- **5445–46:** "A line in the DoD … would have kept the drift from starting; it is a template question for T-15's retrospective."
- **5489–90:** "It is a template and Definition-of-Done question for T-15's retrospective, next to the plan Status lines of the previous entry."
- **5664:** "**T-15c**, the retrospective, with the lessons the log has sent to it."
- **6022–27:** "Lessons for the process: for T-15c's retrospective:" The three items are: one backlog row became a plan and four PRs (#70–#73); "Copilot's reviews found real defects in all three work pull requests"; and "the owner's answer to a licence question changed the licence itself."
- **6194:** "Lessons for the process (for T-15c's retrospective):" These cover the default-branch rulesets, `pull_request_target`, and stale v0.1 sentences.
- **6205–06:** "T-15c, the Release 1 retrospective. The first release after T-15b is where the check's green and `develop`'s survival are read."
- **6241:** "T-15c, the retrospective, when the owner starts it."

Three proposals are still open, though none is addressed to the retro:

- **3746–47:** "Proposal for the owner: the controller's first ruling starts from `governance.md`'s Agent constraints".
- **4631–32:** the `--force-with-lease` guard, "Proposed, not yet used".
- **4268–71:** lines suggested for the owasp skill itself.
