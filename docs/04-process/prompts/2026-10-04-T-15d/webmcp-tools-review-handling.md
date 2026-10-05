# How the webmcp-tools reviews were handled (T-15d, S6)

Reviews of `webmcp-tools.md` v1.0.7 (`a0fbfbc`); every fix is in v1.0.8. The two D7 reviews were dispatched by the
controller session (the drafting session had no subagent tool); a third, independent audit of process and scope ran
beside them. Each claim a fix depends on was checked by the agent before the edit (the command or file named). Line
numbers are v1.0.8's.

## Review 1 — facts (`webmcp-tools-review-1-facts-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | The changelog and WM-Q1 put the §2.6 edit under `write-path.md` §9 Q9, which names only §2.5, §2.8 and §4; WM-Q1 (b) is false | Checked `write-path.md`:251 (Q9) and 2.11 (3), 2.6's 415 row. Fixed: the v1.0.7 changelog entry (line 4) says §2.6 and the header follow from Q9's three and are not named in it; WM-Q1's *What* (§9) names the §2.6 change and why; option (b) reads "only §2.5, §2.6, §2.8 and §4 change" |
| 2 | §7's API row cites 7.6 for the read/write point, which is 2.12's | Checked `write-path.md` 2.12 (:159) and 7.6 (:230). Fixed in §7's API row: 2.12 for the two entries that differ in `method`, 7.6 for each mutating tool on record with `method` |
| 3 | The Status line cites plan D5, which covers only the opening pull request | Checked plan v0.3 (`origin/docs/T-15d-plan-v0.3`): D5 is the opening PR's amendments; "Tasks S1–S6" says "the owner approves it by merging". Fixed in the Status line (line 3): "plan "Tasks S1–S6" and Q1 (b)" |
| 4 | WM-Q1's method list leaves out PUT | Checked `write-path.md` 2.1 (:21). Fixed in WM-Q1: "the request's HTTP method, for example GET or POST" |
| 5 | "the file name this spec has given since its first version" could not be checked | Ran `git log --reverse -S'src/webmcp/bus.ts' -- docs/03-specs/webmcp-tools.md`: the first hit is `32946a9` (2026-09-20), the spec's first commit. Fixed in §4's delete flow: the commit and the command are cited |
| 6 | §2.5 names only `apiGet`, but a 403 or 415 reaches only a write | Checked `write-path.md` §6 "API" (:208, the write predicate excludes `GET`) and 2.11 (2); `src/shared/api-client.ts` sends `GET` only. Fixed in §2.5: Release 2's write tools call the write client (`apiSend`), and only a write can get a 403 or a 415 |
| 7 | The `release-2-handoffs.md` Status-line edit breaks plan D10 | Checked plan v0.3 D10 ("only its own new row and the Done cells it fills"). Fixed: the Status-line edit is reverted to `develop`'s text; the H3 Done cell stays. A Status-line entry, if wanted, goes in with the D11 merge just before ready |

## Review 2 — the spec (`webmcp-tools-review-2-spec-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | §4 does not say who tests US-38 AC2–AC3, US-39 AC3–AC4 and US-40 AC3 for the Budgets, Pots and Recurring Bills tools | Checked `user-stories.md` (US-38–US-40), H9 (`release-2-handoffs.md`:27) and `transactions.md` §7's WebMCP row. Fixed in §4: a new paragraph, "Where the Release 2 acceptance criteria are tested" — each page spec's Tests table carries US-38 AC1–AC3, US-39 AC2–AC4 (read tool) and US-40 AC1–AC3 (mutating and delete tools); `write-path.md` 7.6 the shared part. The D12 cross-spec review checks that S3–S5 carry it |
| 2 | Abort in the delete flow has no defined behaviour and no test | Checked ui-kit's draft (`origin/task/T-15d-spec-ui-kit`, PR #92, its 2.3 item 6: "if a signal is ever given and aborts while the dialog is open, the dialog closes and the result is `cancelled`"). Fixed in §4's delete flow: abort resolves `cancelled` (US-40 AC2), exercised only by tests with a synthetic signal, as §2.5; what the open dialog does is the dialog contract's, `ui-kit.md` **TBD**, with its test. This spec does not decide the dialog's behaviour: `ui-kit.md` owns the dialog (plan v0.3, S1b) |
| 3 | L3: the greps for the old "reserved" wording and ADR-0004's delete flow are not recorded | Ran `grep -rn -i -E "reserved\|reserves names" docs` and `grep -rn -E "ConfirmDeleteDialog\|src/webmcp/bus.ts" docs` on 2026-10-05. Fixed: the hits are listed in the v1.0.8 changelog entry, none edited (history, the plan, or the ADR that is the source). Correction: the reviewer's `write-path.md:217` is not a hit (that line says "dialog first"); the grep finds `plans/2026-10-04-T-15d.md`:131 and `plans/2026-09-24-T-12.md`:171 instead |
| 4 | The letter case of the logged `method` is not specified | Checked `write-path.md` §6 "API" (`fetch` does not upper-case `patch`) and 7.3 (lower-case methods on purpose). Fixed in §2.8: `method` is the method as the server receives it (`request.method`) — the literal reading of "the request's HTTP method"; upper-casing would be a new choice, and none is made |
| 5 | No fallback message for `forbidden` or `busy` (`DEFAULT_TOOL_MESSAGE` is a `Record<ToolErrorCode, string>`) | Checked `src/webmcp/tool-result.ts`:18–26 and `write-path.md` 2.6 (the 403 row). Fixed in §2.5's build note: `forbidden`'s fallback is the 403 body's own message, "This request must be same-origin" (a citation, no new text); `busy` never has an API answer, and its message belongs to the delete flow's contract in `ui-kit.md` **TBD**. No new string in this spec, so no "seen / heard" question: both texts are read by agents, not seen or heard by a person. The D12 cross-spec review checks that `ui-kit.md` gives `busy`'s text |
| 6 | §2.5 still names only `apiGet` | Same as review 1, finding 6. Fixed in §2.5 |
| 7 | WM-Q1 uses terms it does not explain | Checked `governance.md` ("A question to the owner can be answered as written"). Fixed in WM-Q1: `write-path.md` is explained, §4 is "the list of Release 2 agent tools", the E2E row is "the browser test of the Overview page", H11 (4) is "a list of work the first Transactions build task must do" |
| 8 | Small gaps: "§4's TBD cells"; the hand-offs Status entry has no PR number; Implements omits US-40 AC3; undated status claims | Fixed: the Status line says "every **TBD** in §4"; Implements names "US-40 AC3 (the server-log part, §2.8)"; the S3–S5 cells and the S1b mention are dated 2026-10-05 with their PR numbers (#91, #92). **Declined:** the PR number in the hand-offs Status entry — the entry is dropped (review 1, finding 7; plan D10), so there is nothing to number |

## Audit — process and scope (independent, not copied here)

| # | Finding (summary) | Handling |
|---|---|---|
| 1 | Important: the D7 reviews were never run — briefs only, no reports, no handling file; the D12 cross-spec brief does not exist; the PR must stay a draft | Fixed: both reviews were dispatched by the controller against `a0fbfbc`; the reports are saved verbatim beside their briefs, each brief records the dispatch, and this file records the handling. The D12 cross-spec review (S6 against S3–S5) is done: v1.0.10, after S5 (`pots.md`, #97) merged on 2026-10-05 |
| 2 | Minor: the changelog puts the §2.6 and header edits under `write-path.md` §9 Q9, which names only §2.5, §2.8 and §4 | Same as review 1, finding 1. Fixed in the v1.0.7 changelog entry and WM-Q1 |
| 3 | Minor: the spec cites plan v0.3, whose text is only on branch `docs/T-15d-plan-v0.3` (PR #89), not on `develop` | Checked `git show origin/docs/T-15d-plan-v0.3:docs/04-process/plans/2026-10-04-T-15d.md` (S1b, D10–D14 present) against `develop`'s v0.2. Fixed in the Status line: it names PR #89 and the branch until the plan merges. PR #89 merged on 2026-10-05T03:32:09Z (`gh pr view 89 --json state,mergedAt`, read 2026-10-06; the v1.0.10 entry) |
| 4 | Minor: no fallback text for `forbidden`; the build would invent one | Same as review 2, finding 5. Fixed in §2.5: a citation of `write-path.md` 2.6's 403 message |
| 5 | Minor: §7's API row asserts `method` for US-40 AC3 but traces only 2.8; Implements names no part of US-40 | Checked `write-path.md` 7.6's Traces (US-40 AC1, AC3). Fixed: the API row traces "2.8 · US-40 AC3 (with `write-path.md` 7.6)"; Implements names US-40 AC3 (§2.8) |

## Totals

Review 1: 7 findings, 7 fixed. Review 2: 8 findings, 8 fixed (one part of finding 8 declined with its reason). Audit: 5
findings, 5 handled. No finding changes what the design draws or decides a choice an approved document leaves open,
so no new owner question was opened; WM-Q1 stays the only one.

## Independent stand-in review of `344060b` (v1.0.10; fixes in v1.0.11)

An independent read-only Opus review of the branch's head `344060b` (v1.0.10, after the D11 merge of `develop`),
dispatched by the controller session before the pull request goes ready. Its findings and their handling (each
claim checked against the file named before the edit, 2026-10-06):

| # | Finding | Handling |
|---|---|---|
| 1 | The `id` rule contradicts two Approved documents: `write-path.md` §6, "WebMCP tools" (line 212), and US-40's header (`user-stories.md`, line 248) say every mutating tool takes the record `id`; `budgets.md` 2.13 and `pots.md` 2.13, merged, give `add_budget` and `add_pot` none, and §4 followed them while citing `write-path.md` §6 as the source | Checked the four lines, `user-stories.md` line 5, NFR-S3 and R-26's row in `docs/01-requirements/reviews/2026-09-13-adversarial-review.md`. Not an agent's decision (amending Approved documents): opened as **§9 WM-Q2**, open, no answer applied. §4 now says the page specs decide the rule and `write-path.md` §6 disagrees; the v1.0.8 changelog claim that `write-path.md`:212 "stays true" is corrected in the v1.0.11 entry, the v1.0.8 text unchanged. `write-path.md` and `user-stories.md` are not edited |
| 2 | The placeholder-page E2E checks are lost: once the four Release 2 pages are built every page of `app/(app)` has tools, so §7's "polyfill · 0 on a placeholder page" and "0 tools after a client navigation" have no page — and become false, since the destination page registers its own tools — and US-38 AC1's "leaving a page unregisters its tools" loses its browser trace; `recurring-bills.md` §7's WebMCP row has the same check | Checked §3, §4 (2, 1, 4, 6, 1 tools on the five pages), `app/(app)/` on this branch, H11 (4) and `recurring-bills.md` §7 (its WebMCP row and its "Tests that change when the placeholder goes"). Opened as **§9 WM-Q3**, open; its interim rule keeps §7's E2E row as approved, moved by H11 (4). §2.3's "Pages without tools (R2 placeholders)" and §4's "How many" now point to it. `recurring-bills.md` is not edited (below, "For other PRs") |
| 3 | H3's Done cell is still unticked though every resolver it names has merged | Checked each cited section on `origin/develop` with `git grep` (`transactions.md` 2.14, `recurring-bills.md` 2.12, `ui-kit.md` 2.3, `budgets.md` 2.13, `pots.md` 2.13 and §7, `write-path.md` 2.11 (6)); this spec's §4 is the last. Fixed: ☑, notes kept; `git diff origin/develop -- docs/03-specs/release-2-handoffs.md` shows the H3 row only, no Status-line hunk (plan D10) |
| 4 | Nits: the Status line said "nothing else waits for the owner"; its list of merged specs §4 points to left out `transactions.md` (#88); §2.3 still spoke of "R2 placeholders" as if they last | Fixed in v1.0.11: the Status line names WM-Q2 and WM-Q3 as waiting and adds `transactions.md` (#88, merged 2026-10-04T19:17:18Z, `gh pr view 88`); §2.3's sentence folds into WM-Q3's interim rule |

This round opened two owner questions, WM-Q2 and WM-Q3 (the Totals above, "WM-Q1 stays the only one", were true of
the first round). Both are in the governance v1.8 form (what is decided, why it matters, options, a recommendation,
every new term explained, who decides) with the prefix of plan D13.

### For other PRs

Found in this round, outside this pull request (it edits only `webmcp-tools.md`, H3's Done cell and this file):

- `budgets.md` 2.13: `delete_budget`'s description says it returns `busy` "if a dialog is already open", narrower
  than `ui-kit.md` 2.3 item 2 (any modal of the page open, or a write in flight).
- `write-path.md` §6, "WebMCP tools": the `id` wording — the edit WM-Q2's answer asks for, in its own small pull
  request.
- `release-2-handoffs.md` H11 (4) (and the Budgets and Pots build notes): say which page each build moves the
  placeholder check to, and what the last build does (WM-Q3); `recurring-bills.md` §7's WebMCP row ("→
  `[data-webmcp]` absent and 0 tools") follows WM-Q3's answer.
- `release-2-handoffs.md` H1 and H9: every resolver they name has merged, but both Done cells are still ☐.
- `release-2-handoffs.md` H15 (3) says `--duration-preview` is "each added once as in (1)", as if shared; H16 says
  it is Pots only, added by the first Pots build task.
- `release-2-handoffs.md` H18: "the circumference, the segments' dash values and `Donut.tsx`'s `INNER_SCALE`
  follows" — the verb should be "follow".
