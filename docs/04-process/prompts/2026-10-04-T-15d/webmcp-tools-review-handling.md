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
| 1 | Important: the D7 reviews were never run — briefs only, no reports, no handling file; the D12 cross-spec brief does not exist; the PR must stay a draft | Fixed: both reviews were dispatched by the controller against `a0fbfbc`; the reports are saved verbatim beside their briefs, each brief records the dispatch, and this file records the handling. Still open before ready: the D12 cross-spec review (S6 against S3–S5), after S5 merges |
| 2 | Minor: the changelog puts the §2.6 and header edits under `write-path.md` §9 Q9, which names only §2.5, §2.8 and §4 | Same as review 1, finding 1. Fixed in the v1.0.7 changelog entry and WM-Q1 |
| 3 | Minor: the spec cites plan v0.3, whose text is only on branch `docs/T-15d-plan-v0.3` (PR #89), not on `develop` | Checked `git show origin/docs/T-15d-plan-v0.3:docs/04-process/plans/2026-10-04-T-15d.md` (S1b, D10–D14 present) against `develop`'s v0.2. Fixed in the Status line: it names PR #89 and the branch until the plan merges. Still open before ready: PR #89 merged |
| 4 | Minor: no fallback text for `forbidden`; the build would invent one | Same as review 2, finding 5. Fixed in §2.5: a citation of `write-path.md` 2.6's 403 message |
| 5 | Minor: §7's API row asserts `method` for US-40 AC3 but traces only 2.8; Implements names no part of US-40 | Checked `write-path.md` 7.6's Traces (US-40 AC1, AC3). Fixed: the API row traces "2.8 · US-40 AC3 (with `write-path.md` 7.6)"; Implements names US-40 AC3 (§2.8) |

## Totals

Review 1: 7 findings, 7 fixed. Review 2: 8 findings, 8 fixed (one part of finding 8 declined with its reason). Audit: 5
findings, 5 handled. No finding changes what the design draws or decides a choice an approved document leaves open,
so no new owner question was opened; WM-Q1 stays the only one.
