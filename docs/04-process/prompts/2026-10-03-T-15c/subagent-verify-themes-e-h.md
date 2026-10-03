# Subagent 4 — verification of themes E–H and the hand-off quotes

Agent type `Explore` (read-only, no write tools), model Opus 5.5, dispatched 2026-10-03 for the T-15c retro.
Copied from the brief the agent sent and the hand-off message that came back. The absolute home path in both is
replaced by the placeholder `/Users/<name>` (the home-path guard, T-15a); nothing else is changed.

## Brief

Read-only verification task. Do NOT edit anything. File: /Users/<name>/Own/ai-native-personal-finance/.claude/worktrees/task-T-15c/docs/04-process/process-log.md (about 6240 lines; entries start with "## YYYY-MM-DD —"). The numbers below are line numbers INSIDE entries (not necessarily the heading); read the surrounding entry (±30 lines) to judge.

For each THEME below, a retrospective claims that the cited lines show the pattern. For EACH cited line decide: CONFIRMED (the entry really shows it), WEAK (related but not clearly this pattern), or REJECTED (does not show it). For CONFIRMED give a SHORT exact quote (<=20 words) from the log with its line number. Then name the 3 strongest lines for the theme. Never invent a quote; if you cannot find the support, say REJECTED.

THEME E — "Stale state left in documents (plan Status lines, 'pending' on closed entries, a backlog row's old tense, a plan's v0.1 sentences after v0.2)". Lines: 3310, 4971, 5107, 5405, 5451, 6032, 6144.
THEME F — "Git and shared-state hazards (push to a merged PR's branch re-creating it, a subagent writing .git/config, cd into another worktree, shared core.hooksPath, an unsafe pkill)". Lines: 466, 598, 1147, 1180, 2604, 3067, 4189, 4431, 4597, 5317, 5717, 6144.
THEME G — "Only running the real thing found the bug (browser, three engines, screenshots, the public URL) while unit tests were green". Lines: 968, 1147, 1180, 1902, 2121, 2386, 2504, 4971, 5136.
THEME H — "Reviews catch what the author missed, and the review process itself slips (wrong reviewer model, miscounted totals, reviewers missing a wrong check)". Lines: 818, 1819, 3310, 4083, 4896, 4971, 5188, 5782, 5872, 5954.

ALSO verify these hand-off sentences exist as quoted (give the exact line and the exact text, shortened to the key clause): 310 ('amendment to one ADR must be grepped across the others'), 5440-5441 ('Owner changes: none yet' fields left for the owner at the general retrospective, 'Ümumi retroda danışacam'), 5443-5446 (a DoD line closing a plan's Status; 'only three of nineteen plans were closed'), 5489-5490 (backlog row done-marker in the PR), 6022-6027 (T-15a lessons for T-15c), 6194-6206 (T-15b lessons for T-15c).

Output (English, max ~1000 words): per theme a compact table 'line | CONFIRMED/WEAK/REJECTED | quote', then 'strongest 3'. End with one line per theme: 'HOLDS' (>=2 confirmed entries) or 'DOES NOT HOLD'. Then the hand-off verification list.

## Report

All four themes hold. I read every cited entry in full or in ±30-line windows. Most cited numbers are entry headings, so each quote below gives the line where the evidence actually sits.

**THEME E: stale state left in documents**

| line | verdict | quote |
|---|---|---|
| 3310 | CONFIRMED | 3319: "The plan's status line still reads "awaiting the go-ahead and the execution method"" |
| 4971 | CONFIRMED | 5069: "The runbook kept a guess (`personal-finance.vercel.app`) after Task 5 replaced it with a fact" |
| 5107 | CONFIRMED | 5125-5126: "two records still said "owner decision: pending" on entries that were already closed" |
| 5405 | CONFIRMED | 5426: "sixteen of nineteen said the wrong thing" |
| 5451 | CONFIRMED | 5456: "found the row describing finished work as future work" |
| 6032 | CONFIRMED | 6110: "v0.2 left v0.1's present-tense lines ("`develop` does not exist yet", "nothing has been changed")" |
| 6144 | CONFIRMED | 6199: "A plan that is answered in place keeps its v0.1 sentences." |

Strongest 3: 5405 (16 of 19 plans), 5107 ("pending" on closed TD-14/TD-17), 6032/6144 (v0.1 sentences after v0.2).

**THEME F: git and shared-state hazards**

| line | verdict | quote |
|---|---|---|
| 466 | CONFIRMED | 536: "set `user.name`/`user.email` ("Scratch") in the repository's shared `.git/config`" |
| 598 | CONFIRMED | 667-668: "ran `git checkout 0eec801 -- .` and then `git reset --hard HEAD` in a worktree that shares `.git`". Also 631: "its `prepare` set the shared `core.hooksPath`" |
| 1147 | CONFIRMED | 1167: "`pkill -f "next start"`, which could have hit another session's server" |
| 1180 | CONFIRMED | 1218: "Pushed four commits to a branch whose PR had already merged." (the commits never reached `main`; it does not say the branch was re-created) |
| 2604 | CONFIRMED | 2740-2741: "session's working directory flipped to another worktree ... because other agents called `EnterWorktree`" |
| 3067 | CONFIRMED | 3086-3087: "The push re-created the deleted branch instead of reaching the pull request" |
| 4189 | WEAK | 4237-4239: subagents were dispatched from a branch "before that branch had the plan merged onto it". This is a branch-ordering problem, not a git or shared-state hazard. |
| 4431 | WEAK | 4455-4456: "the agent pushes with the owner's account and a bypass right would be the agent's too". This is about a shared identity in a design decision; no incident happened. |
| 4597 | CONFIRMED | 4620-4621: "the push recreated the deleted branch `docs/T-13d-github-check` outside any pull request" |
| 5317 | CONFIRMED | 5363: "It ran `npm ci` in the second worktree with a `cd` from the first." |
| 5717 | CONFIRMED | 5767: "`core.hooksPath` is shared and absolute" |
| 6144 | WEAK | 6195-6196: "A ruleset that targets "the default branch" follows the default when it changes." This is a GitHub-settings hazard, not git or worktree state. |

Strongest 3: 466 (.git/config), 3067 and 4597 (push re-creating a merged PR's branch; same pattern twice), 5317 (cd into another worktree).

**THEME G: only running the real thing found the bug**

| line | verdict | quote |
|---|---|---|
| 968 | CONFIRMED | 1062-1063: the reviewer "actually exercised the running app (forged iron-session cookies, real Chromium/Firefox...)". Also 1037-1038: "A plan's own unit tests can encode the same off-box-one (sic) the code has" (the subagent's quote read "off-by-one"; the log's line 1037 reads "off-box-one", restored here after Copilot's review) |
| 1147 | CONFIRMED | 1166: "the tab read "Personal Finance". The browser check caught it" |
| 1180 | CONFIRMED | 1210-1211: "No review of the code would have found this; only running it under the real policy did." |
| 1902 | CONFIRMED | 1947-1948: "Caught only because the agent took screenshots for the DoD and looked at them, rather than trusting "all tests green"" |
| 2121 | CONFIRMED | 2156-2158: "Every one of this task's 38 unit tests passed ... It surfaced only when the app was actually run" |
| 2386 | CONFIRMED | 2414-2415: "every earlier run — all on Chromium — was green. **T-12 was merged with Firefox and WebKit red**" |
| 2504 | CONFIRMED | 2517-2518: "Running Firefox and WebKit found that `npm run test:all` is red today" |
| 4971 | CONFIRMED | 5097-5098: "Run the artefact you are about to publish before publishing it: the Lighthouse cookie leak was invisible" |
| 5136 | CONFIRMED | 5172-5173: "the review, the advisor and the local dry runs all missed a hidden-directory default that the first real run exposed". Also 5177-5178 on the public URL. |

Strongest 3: 2121 (38 unit tests green, every authenticated page broken), 1902 (screenshots beat a full green E2E run), 2386 (merged with two engines red).

**THEME H: reviews catch misses; the review process slips**

| line | verdict | quote |
|---|---|---|
| 818 | CONFIRMED | 866: "The Task 5 task review misread decision D17's table row". 873-874: "The final whole-branch review ... caught it" |
| 1819 | CONFIRMED | 1854-1855: "dispatched before the governance v1.3 change above, so it ran on whichever model that agent type defaults to" |
| 3310 | CONFIRMED | 3535: "Governance v1.3 says code review subagents use Opus 5.5; most reviews here ran on Sonnet." |
| 4083 | CONFIRMED | 4148-4149: "The inline `<script>` count (F4: "three") was never counted programmatically ... it is two". 4155: "The reviewer's own miss" |
| 4896 | CONFIRMED | 4916-4917: "says ... "All four were fixed." ... The review had six findings". 4926-4927: "count the fixes and the deferrals against the report's own totals" |
| 4971 | CONFIRMED | 5100-5101: "the review caught what the author's passes and the advisor's did not, in a command that sends a secret" |
| 5188 | CONFIRMED | 5222-5223: "the agent had written the check without reading where the tag comes from, and every reviewer missed it" |
| 5782 | CONFIRMED | 5844-5845: "Copilot's review of PR #71 found that the `/home/` half of the pattern required a trailing `/`" |
| 5872 | CONFIRMED | 5933: "That was a miss by the agent: A's guard had fixtures, and B's licence test did not." |
| 5954 | CONFIRMED | 6024-6025: "Copilot's reviews found real defects in all three work pull requests" |

Strongest 3: 4971 (a Critical secret-sending command the author and advisor missed), 3310 (wrong reviewer model on most task reviews), 5188 (every reviewer missed a wrong check).

THEME E: HOLDS
THEME F: HOLDS (9 confirmed, 3 weak)
THEME G: HOLDS
THEME H: HOLDS

**Hand-off sentences**

- **310: EXISTS.** "Lesson: an amendment to one ADR must be grepped across the others (T9 removal missed ADR-0007). Added to the retrospective list for T-15."
- **5440-5441: EXISTS.** "(3) The "Owner changes: none yet" fields of earlier entries are left for the owner to fill at the general retrospective ("Ümumi retroda danışacam")."
- **5443-5446: EXISTS.** 5443-5444: "only three of nineteen plans were closed when their task merged, and the Definition of Done has no line that closes it." 5445-5446: "A line in the DoD ("the plan's Status reads Done with the PR and merge") would have kept the drift from starting; it is a template question for T-15's retrospective."
- **5489-5490: EXISTS,** but the done-marker clause starts on 5487-5488: "A row of many sub-items gets its done-marker cheaply in the pull request that finishes each one, and expensively — GitHub's API plus the log — a week later." 5489-5490: "It is a template and Definition-of-Done question for T-15's retrospective, next to the plan Status lines of the previous entry."
- **6022-6027: EXISTS.** "Lessons for the process: for T-15c's retrospective". The three bullets are:
  - one backlog row "became a plan and four pull requests (#70–#73)"
  - "Copilot's reviews found real defects in all three work pull requests"
  - "the owner's answer to a licence question changed the licence itself"
- **6194-6206: EXISTS.** "Lessons for the process (for T-15c's retrospective)". The bullets are:
  - "Before any default switch, read every ruleset's `conditions`."
  - "`pull_request_target` now reads the default branch."
  - "A plan that is answered in place keeps its v0.1 sentences. ... Read the whole plan for tense once, when writing v0.2."
  - 6205-6206 (under Next, not Lessons): "T-15c, the Release 1 retrospective."

All quotes come from `/Users/<name>/Own/ai-native-personal-finance/.claude/worktrees/task-T-15c/docs/04-process/process-log.md`. Nothing was edited.
