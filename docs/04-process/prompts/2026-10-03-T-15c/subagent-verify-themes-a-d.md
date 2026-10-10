# Subagent 3 — verification of themes A–D and the spec-gap lessons

Agent type `Explore` (read-only, no write tools), model Opus 5.5, dispatched 2026-10-03 for the T-15c retro.
Copied from the brief the agent sent and the hand-off message that came back. The absolute home path in both is
replaced by the placeholder `/Users/<name>` (the home-path guard, T-15a); nothing else is changed.

## Brief

Read-only verification task. Do NOT edit anything. File: `/Users/<name>/Own/ai-native-personal-finance/.claude/worktrees/task-T-15c/docs/04-process/process-log.md` (about 6240 lines; entries start with "## YYYY-MM-DD —"). The numbers below are line numbers INSIDE entries (not necessarily the heading); read the surrounding entry (±30 lines) to judge.

For each THEME below, a retrospective claims that the cited lines show the pattern. For EACH cited line decide: CONFIRMED (the entry really shows it), WEAK (related but not clearly this pattern), or REJECTED (does not show it). For CONFIRMED give a SHORT exact quote (<=20 words) from the log with its line number. Then name the 3 strongest lines for the theme. Never invent a quote; if you cannot find the support, say REJECTED.

THEME A — "Defects start in what the plan dictated (plan code/text that does not work, tests that cannot fail, expected numbers that drift)". Lines: 466, 598, 704, 1327, 1541, 1678, 2288, 2504, 2604, 3227, 3310, 3836, 3993, 4933, 4971, 5782, 6032.
THEME B — "A guard or test that was never made to fail (the 'fail on purpose' rule), recurring after the rule existed". Lines: 314, 466, 704, 1180, 1541, 1819, 1902, 2386, 2604, 2906, 2946, 4801, 5872.
THEME C — "A claim stated as fact before it was measured (counts, predictions, 'ready', summaries taken as sources)". Lines: 314, 598, 704, 818, 1678, 2288, 2386, 2604, 2906, 3786, 4083, 4340, 4542, 4801, 4896, 4971, 5188, 5246, 5405, 5561.
THEME D — "Questions and reports to the owner that the owner could not act on (spec terms, shorthand, unexplained terms)". Lines: 170, 466, 1327, 2504, 2844, 2990, 3786, 3903, 5561, 5650, 6032, 6208.
SPEC-GAP LESSONS (what the SPECS/requirements missed): 41 (prototype omits non-visual requirements), 193 (figure copied from prototype instead of computed from seed), 277 (same class of error returned), 304 (ADR amendment not grepped across other ADRs), 5498 (a task's Goal cites NFR rows whose artefact was never checked), 3949 (tech-debt 'guarded by' claim unchecked), 4340.

Output (English, max ~1000 words): per theme a compact table 'line | CONFIRMED/WEAK/REJECTED | quote', then 'strongest 3'. End with one line per theme: 'HOLDS' (>=2 confirmed entries) or 'DOES NOT HOLD'.

## Report

I checked every cited line against its full entry in process-log.md (6242 lines). Quotes are exact; where a quote runs across lines, the line numbers are given as a range. Some quotes are cut with "…", and those are noted.

**THEME A: defects start in what the plan dictated**

| line | verdict | quote |
|---|---|---|
| 466 | CONFIRMED | 1528: "The final review found four defects in code the plan mandated and E17 had verified" |
| 598 | CONFIRMED | 654: "Six items the final review found were in the plan's own text" |
| 704 | CONFIRMED | 776: "Two guarantees the plan stated were broken by the plan's own code" |
| 1327 | CONFIRMED | 1408: "The plan's own code had them, so the plan text lost to the binding rule." |
| 1541 | CONFIRMED | 1596: "The v0.1 plan's code had tests that could not fail." |
| 1678 | CONFIRMED | 1737–38: "the plan's Task 1 code block just did not implement what its own paragraph one line above it claimed" |
| 2288 | CONFIRMED | 2336: "The plan's Task 4 code did not compile under the repository's `noUncheckedIndexedAccess`" |
| 2504 | CONFIRMED | 2527: "The first draft's code had six defects that only running it showed" |
| 2604 | CONFIRMED | 2735–36: "Every Important finding of a first review round … was in code or text the plan dictated." |
| 3227 | CONFIRMED | 3305–06: "A plan's "Expected" numbers are measured on a scratch tree and drift" |
| 3310 | CONFIRMED | 3748: "Both Important findings of a first review round were in text or code the plan dictated" |
| 3836 | CONFIRMED | 3878–79: "Nothing was wrong in the tree; the plan's expectation was." |
| 3993 | WEAK | 4054–57: the plan predicted the wrong assertion would fail, but the entry stresses "same conclusion … different line" |
| 4933 | CONFIRMED | 4958–59: "v0.1's first draft had a TD-14 positive control that could not work" |
| 4971 | CONFIRMED | 5071–72: "The plan gave the agent secret-store writes and a production deployment without checking whether the harness would allow them" |
| 5782 | CONFIRMED | 5823–24: "The plan's v0.1 went out with a C3 order that could not produce its own evidence" |
| 6032 | WEAK | 6110: "v0.2 left v0.1's present-tense lines" — stale plan prose; the entry does not tie the test defects (6129–34) to plan code |

Strongest 3: **2604** (2735–36), **3310** (3748), **1541** (1596).

**THEME B: a guard or test never made to fail**

| line | verdict | quote |
|---|---|---|
| 314 | CONFIRMED (where the rule starts, not a repeat) | 1332: "a configuration is not verified until it has failed on purpose"; 1324: config "wrong three times while `eslint` exited 0" |
| 466 | CONFIRMED | 1531–32: "the D10 fail-closed guarantee had no test that could fail" |
| 704 | WEAK | 779–80: "The prototype's 20 mutations and 100 % coverage tested what the code did, not what the plan promised" (a gap between plan and code, not a guard never made to fail) |
| 1180 | CONFIRMED | 1288: "The sign-up `noValidate` pin had never been proved; the plan had no mutation step for it." |
| 1541 | CONFIRMED | 1596: "The v0.1 plan's code had tests that could not fail." |
| 1819 | CONFIRMED | 1878–79: "compared the result against the very same object, so it could not have caught a real leak" |
| 1902 | CONFIRMED | 2003: "`ThemeBar`'s "violation fixture" could not fail." |
| 2386 | CONFIRMED | 2443: "A1's first test could pass without a session" |
| 2604 | CONFIRMED | 2702: "The PR template's "all unticked" check (Task 5, plan code) never failed on purpose" |
| 2906 | CONFIRMED | 2924–26: "the logout test in `auth.spec.ts` passed … without a session it proved nothing" |
| 2946 | CONFIRMED (CodeQL found it, not the team's own check) | 2979: "meant "passes when it should fail"" |
| 4801 | CONFIRMED | 4871–72: "the new guard shipped without the violation fixture DoD v1.1 asks … had never been seen to fail" |
| 5872 | CONFIRMED | 5933: "That was a miss by the agent: A's guard had fixtures, and B's licence test did not." |

Strongest 3: **2604** (2830–31: "Every Important finding was a guard that could not fail"; the asterisks are dropped), **4801** and **5872**. 4801 and 5872 are repeats long after DoD v1.1, and 5872 cites DoD line 18 itself.

**THEME C: a claim stated as fact before it was measured**

| line | verdict | quote |
|---|---|---|
| 314 | CONFIRMED | 1327: "A false claim about npm `allowScripts` blocking scripts was written into a code comment" |
| 598 | CONFIRMED | 664–65: "reported a mutation check's failing tests as the brief predicted them, not as observed" |
| 704 | CONFIRMED | 757: "the v1.8 changelog overclaimed" |
| 818 | WEAK | 882–83: the controller "said "+5 new tests" when the design is "+7"" (a sum done wrong, not an unmeasured claim) |
| 1678 | CONFIRMED | 1798–99: "claimed a run that had not happened" |
| 2288 | CONFIRMED | 2334: "The plan said the API suite had 91 tests; the real baseline was 92" |
| 2386 | CONFIRMED | 2434: "The plan's pass prediction was wrong: it said 16 passed" |
| 2604 | CONFIRMED | 2720: "Wrong predictions, labelled "Prediction" or not" |
| 2906 | CONFIRMED | 2933–34: "The claim should have been measured before it was made." |
| 3786 | CONFIRMED | 3811–13: "The backlog row and TD-2 were wrong about `runtime` … neither had been checked" |
| 4083 | CONFIRMED | 4148–49: "The inline `<script>` count (F4: "three") was never counted programmatically" |
| 4340 | CONFIRMED | 4409–10: "stated as settled fact that turning code-owner review on would block every merge" |
| 4542 | CONFIRMED | 4590: "a search summary is a lead, not a source" |
| 4801 | CONFIRMED | 4874: "this entry said the npm floor "holds" on Vercel without evidence" |
| 4896 | CONFIRMED | 4926–27: "count the fixes and the deferrals against the report's own totals" |
| 4971 | CONFIRMED | 5070: "stated things as measured that were predictions, or measured elsewhere" |
| 5188 | CONFIRMED | 5222–23: "the agent had written the check without reading where the tag comes from" |
| 5246 | CONFIRMED | 5295–96: "claimed Vercel "normalises `.rsc`" for the segment form as well; neither was measured" |
| 5405 | CONFIRMED | 5431: "It first counted one stale plan (T-14's), then sixteen" |
| 5561 | CONFIRMED | 5624: "said no `main` run had ever been cancelled, before it counted" |

Strongest 3: **2906** (2933–34), **1678** (1798–99), **2604** (2720).

**THEME D: owner could not act on questions or reports**

| line | verdict | quote |
|---|---|---|
| 170 | CONFIRMED | 182–83: "questions to the owner must be phrased in product terms, not in spec terms" |
| 466 | CONFIRMED | 520–21: "the owner could not answer it and it was re-asked in plain terms" |
| 1327 | CONFIRMED | 1451–52: "The owner did not understand the question about the gate-PR path" |
| 2504 | CONFIRMED | 2553: "The owner asked what Q2 meant before answering" |
| 2844 | CONFIRMED | 2870–73: "asked for these decisions in shorthand … the owner could not act on them" |
| 2990 | REJECTED | The questions were structured and the owner answered them all. The miss (3046–48) was giving advice before asking, not unclear wording. |
| 3786 | CONFIRMED | 3814–15: "Q1 was worded around the `runtime` option … the owner did not understand it" |
| 3903 | CONFIRMED | 3930–31: "The owner had to ask, and the agent explained it in plain words." |
| 5561 | CONFIRMED | 5622–23: "Its first explanation of the rotation item … did not reach the owner" |
| 5650 | CONFIRMED | 5655: "The owner asked what "home path" meant" |
| 6032 | WEAK | 6106–07: the agent misread Q5's answer (a misreading by the agent, not an unexplained term) |
| 6208 | CONFIRMED | 6235–36: "Q5 as first written asked about merge methods in terms the owner had not met" |

Strongest 3: **2844** (2870–73), **6208** (6235–36), **3786** (3814–15).

**SPEC-GAP LESSONS** (all CONFIRMED)

- 41 — 62–63: "it silently omits non-visual requirements (validation, keyboard, focus)"
- 193 — 200: "the drafting agent copied a figure from the prototype rather than recomputing it from the seed"
- 277 — 281: "two design-vs-seed errors the drafting agent introduced *after* the previous review's lesson"
- 304 — 310: "an amendment to one ADR must be grepped across the others (T9 removal missed ADR-0007)"
- 5498 — 5534–35: "no step of the plan compared the runbook with the text of the NFR rows its Goal cites"
- 3949 — 3985–86: "a tech-debt entry's "Guarded meanwhile by: … not reachable by a normal request" is itself a claim that needs checking"
- 4340 — 4418–19: "The backlog row stated GitHub's state in the present tense … with no date or command"

Theme A: HOLDS (15 confirmed, 2 weak)
Theme B: HOLDS (12 confirmed, 1 weak; 314 is where the rule starts, and 466 onward are repeats after it)
Theme C: HOLDS (19 confirmed, 1 weak)
Theme D: HOLDS (9 confirmed, 1 weak, 1 rejected)
