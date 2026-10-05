# Report — webmcp-tools review 2 (T-15d S6)

As returned by the read-only Opus reviewer for commit a0fbfbc.

**Review of `webmcp-tools.md` v1.0.7 against the review-2 brief (A–F)**

I read the worktree at `a0fbfbc` (`/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/wf_e020d1ba-e8d-3`) and compared it by hand with the `origin/develop` copy (v1.0.6), since I could not run git. I found no blockers, two important findings and six minor ones.

**What changed, and whether it is in scope (A).** Every change is inside items (1)–(5) or follows directly from them:
- Status and Changelog lines.
- "Implements": "reserves names for R2" becomes a pointer.
- §2.5: 403 → `forbidden`, 415 → `validation`, plus a build note for `forbidden`/`busy`. This matches `write-path.md` 2.11 (4) exactly.
- §2.6: `issues` are copied from a 415 body too. This follows from 2.11 (3) and the 415 row of 2.6.
- §2.8: the log entry gains `method`. This matches 2.12.
- §4: the 12-row pointer table, the shared-rules paragraph (a pointer to 2.11 and §6) and the delete-flow pointer to `ui-kit.md`.
- §7: the unit and API rows change, and this is put to the owner as WM-Q1. The E2E row is unchanged (H11 (4)).
- `release-2-handoffs.md`: only the H3 Done cell and the Status line changed.

Sections §2.1–2.4, §2.7, §3, §5, §6 and §8 are byte-identical to v1.0.6. No other spec or ADR was edited.

### Important

**1. §4 sends only some Release 2 acceptance criteria to a spec that tests them** (C, L7)
- Spec text: "The twelve names are fixed by Approved stories — US-38 AC1 …, US-39 AC2 … and US-40 AC1–AC2".
- The gap: nothing says who tests these for the Budgets, Pots and Recurring Bills tools:
  - US-39 AC3 (`readOnlyHint`, and `untrustedContentHint` on `list_budgets`/`list_pots`, `user-stories.md:244`)
  - US-39 AC4 (`unauthenticated`, `user-stories.md:245`)
  - US-40 AC3 (the change shows in the UI at once, `user-stories.md:251`)
  - US-38 AC2/AC3 (modes and readiness on Release 2 pages, `user-stories.md:237-238`)
- §7's E2E row covers `/overview` only. H9 (`release-2-handoffs.md:27`) hands the page specs only US-38 AC1 and US-39 AC2. `transactions.md:4` happened to take US-39 AC2–AC4 for its own tool; S3–S5, drafted in parallel, get no such instruction.
- **Fix:** one sentence in §4: "each page spec's Tests table carries US-38 AC2–AC3, US-39 AC3–AC4 (read tools) and US-40 AC1–AC3 (mutating and delete tools) for its tools; `write-path.md` 7.6 covers the shared part of US-40 AC1 and AC3".

**2. "Abort" in the delete flow has no defined behaviour and no test** (C, D)
- Spec text (§4): "`cancelled` (cancel, or abort) … Cancel is driven through the dialog, not through a signal: the runtime hands a tool no `AbortSignal`".
- US-40 AC2 (`user-stories.md:250`) says "Cancel or abort (`signal`) → structured `cancelled`".
- The spec does not say:
  - what happens to an open dialog when a signal aborts;
  - where abort is tested. §2.5 says this for Release 1 ("unit tests only"); §4 says nothing for delete.
- **Fix:** add "an aborted signal closes the dialog and resolves `cancelled`; tested at unit level with a synthetic signal, as §2.5; specified in `ui-kit.md` **TBD**".

### Minor

**3. L3 is not met: the greps are not recorded** (B)
- Brief item (5) and `release-2-handoffs.md:41` require the grep for the old "reserved" wording and for ADR-0004's delete flow, with the hits listed. Neither the changelog nor anything else in the diff records them.
- The hits I found:
  - "reserved": `plans/2026-10-04-T-15d.md:131`, `:284`, `:332`; `process-log.md:271` (history).
  - `ConfirmDeleteDialog` / `bus.ts`: only `adr/0004-webmcp-adapter.md:18` and `write-path.md:217`.
- **Fix:** list the hits in the changelog or the PR body, with "none edited, reason: history or plan".

**4. The letter case of the logged `method` is not specified** (D, L8)
- Spec text (§2.8): "`method` is the request's HTTP method"; WM-Q1 says "GET, POST, PATCH or DELETE".
- `write-path.md:208` notes that `fetch` does not upper-case `patch`, and 7.3 sends lower-case methods on purpose. A test comparing `"PATCH"` could then fail.
- **Fix:** state "recorded upper-cased" (or "as received") in §2.8.

**5. No message is defined for `forbidden` or `busy`** (D, F)
- Spec text (§2.5): "`TOOL_ERROR_CODES` … has neither `forbidden` nor `busy` … adding both is a build note".
- `src/webmcp/tool-result.ts:18-26`: `DEFAULT_TOOL_MESSAGE` is a `Record<ToolErrorCode, string>`, so the build must invent two new strings.
  - `busy` never has an API body, so it always uses the fallback.
  - `forbidden` uses the fallback when the 403 body carries no message.
- These strings reach agents, not users, but they are new text the spec does not give.
- **Fix:** name both fallback strings in the build note, or say explicitly that they are agent-facing and the build task chooses them. List them for the owner either way (D14).

**6. §2.5 still names only `apiGet` as the client** (A, D)
- Spec text: "calls `src/shared/api-client.ts` (`apiGet`, …)".
- The new 403 and 415 rows can only come from write routes, which go through the write client (`apiSend`, `write-path.md:153-154`).
- **Fix:** add "(write tools: the write client of `write-path.md` 2.11 (2))".

**7. WM-Q1 uses terms it does not explain** (E, L6)
- The question has all the required parts: what, why, options and a recommendation.
- Unexplained: "E2E row" and "hand-off H11 (4)" in option (a), and "and §4" in *What*, which says nothing about what §4 is.
- **Fix:** add "(the browser test of the Overview page)" after "E2E row", "(a list of work the first Transactions build task must do)" after H11 (4), and "§4 (the list of Release 2 tools)".

**8. Small wording and traceability gaps**
- Status: "until … §4's **TBD** cells hold section numbers". The `ui-kit.md` **TBD** sits in a paragraph, not a table cell. Say "every **TBD** in §4".
- `release-2-handoffs.md:3`: "amended by webmcp-tools (T-15d S6 …)". The earlier entries name their PR (#87, #88). Add the PR number.
- The "Implements" line omits US-40, although §2.8's `method` serves US-40 AC3. Add "US-40 AC3 (the server-log part, §2.8)".
- "(S3, being drafted)" and "(S4, not started)" are undated status claims (L5). Date them or drop them when the cells are filled.

### Checks that came back clean

- **A (scope):** clean. Nothing goes beyond (1)–(5) without being asked in §9. §2.5 and §2.8 apply `write-path.md` 2.11 (4) and 2.12 exactly. The twelve names and their pages match US-38 AC1 (`user-stories.md:236`).
- **B, section 1:** the H3 Done cell says only what §4 does, and its box rightly stays ☐. Rows H1, H2 and H4–H12 are unchanged.
- **B, section 2:**

  | Line | Result |
  |---|---|
  | L1, L2 | not applicable: no design, no seed figures |
  | L3 | not met (finding 3) |
  | L4 | not applicable |
  | L5 | minor (finding 8) |
  | L6 | met, with finding 7 |
  | L7 | partial (finding 1) |
  | L8 | partial (findings 2, 4, 5) |

- **C:** nothing in §2.5, §2.8 or §7 contradicts US-38–US-40, NFR-W3 or NFR-W6.
- **D:** the **TBD** handling is clear. The spec stays a draft until S5 is merged and the cells are filled, so a build agent cannot act on it.
- **E:** WM-Q1 is needed, and no owner question is missing.
- **F:** clean. The design source is never named by its address, there are no new user-facing strings, and the changelog cites the owner's specific answer to `write-path.md` §9 Q9 rather than a general instruction.
