# Report — webmcp-tools review 1 (T-15d S6)

Home paths in this report are written as `~/…` (the repository's home-path rule); nothing else was changed from the reviewer's text.

As returned by the read-only Opus reviewer for commit a0fbfbc.

**Review of `webmcp-tools.md` v1.0.7 (worktree wf_e020d1ba-e8d-3, commit a0fbfbc): fact check against the repository**

I checked the current text against origin/develop's v1.0.6, `write-path.md`, `reset-and-test-support.md`, ADR-0004, `user-stories.md`, `transactions.md`, `release-2-handoffs.md`, the code and the T-15d plan v0.3. One finding is important and five are minor. There are no blockers.

### Findings

**1. Important: WM-Q1 and the changelog say less changed than did.**
- **Spec text:** the changelog (webmcp-tools.md:4) opens with "the amendments `write-path.md` §9 Q9 assigns to S6" and lists "§2.6: `issues` are copied from a 400 or a 415 body". WM-Q1 (line 108) says `write-path.md` asks for "three things" (§2.5, §2.8, §4) and that only §7 "goes one step beyond what was approved". Option (b) (line 111) says "only §2.5, §2.8 and §4 change".
- **Source:** `write-path.md`:251 (Q9) names only "`webmcp-tools.md` §2.5, §2.8 and §4 in S6". §2.6 (line 48) is still edited, and so is the header's Implements line (line 30). The §2.6 edit can be argued from `write-path.md` 2.11 (3) and 2.6's 415 row (lines 154, 81), but Q9 does not name it. Option (b) is false as written, because §2.6 changes under either answer.
- **Fix:** say in the changelog and in WM-Q1 that §2.6 follows from `write-path.md` 2.11 (3) and 2.6 rather than from Q9. Change (b) to "only §2.5, §2.6, §2.8 and §4 change".

**2. Minor: §7's API row cites the wrong section.**
- **Spec text:** line 99, "a `GET` and a write on the same path give two entries that differ in `method`, `write-path.md` 7.6".
- **Source:** `write-path.md`:230 (7.6) only says each mutating tool "is on record with `method`". The point that a read and a write are otherwise indistinguishable is 2.12 (`write-path.md`:159).
- **Fix:** cite `write-path.md` 2.12 for that point, and 7.6 only for "on record with `method`".

**3. Minor: the header cites the wrong plan decision.**
- **Spec text:** line 3, "proposed in its pull request, which the owner approves by merging it, plan D5".
- **Source:** in plan v0.3 (on the plan branch), D5 (`2026-10-04-T-15d.md`:291) covers only the amendments in the *opening* pull request (PRD v1.3, ADR-0003, roadmap). The rule that a spec pull request is approved by merging it is in "Tasks S1–S6" (line 393) and Q1 (b) (line 27).
- **Fix:** cite "plan, Tasks S1–S6" or "Q1 (b)" instead of D5.

**4. Minor: WM-Q1's list of HTTP methods leaves out PUT.**
- **Spec text:** line 108, "`method` — GET, POST, PATCH or DELETE".
- **Source:** `write-path.md`:21 (2.1) counts PUT as a write method, and 2.2 step 1 (line 37) records the marker for "any method".
- **Fix:** write "the request's HTTP method (GET, POST, PUT, PATCH, DELETE)" or "for example GET or POST".

**5. Minor: one claim cannot be checked.**
- **Spec text:** line 87, "`src/webmcp/bus.ts`, the file name this spec has given since its first version".
- **What is confirmed:** ADR-0004 names no file. Line 18 only describes the event flow, and line 31 says only "an in-page event bus". `src/webmcp/bus.ts` does not exist (glob of `src/webmcp/**`). The name is in v1.0.6 §4 (develop `webmcp-tools.md`:68).
- **What is not confirmed:** whether the name goes back to v0.1. That needs git history, which I could not run with read/grep/glob only.
- **Fix:** confirm with `git log -S'src/webmcp/bus.ts' -- docs/03-specs/webmcp-tools.md`, or write "named in this spec since at least v1.0.6".

**6. Minor: §2.5 names only `apiGet`, but the new rows can only come from writes.**
- **Spec text:** line 47, "calls `src/shared/api-client.ts` (`apiGet`, …) … 403 → `forbidden` … 400 or 415 → `validation`".
- **Source:** the proxy's write rule excludes GET (`write-path.md`:208), so `apiGet` can never receive a 403 or a 415. Those answers reach only write tools, through the write client `apiSend` (`write-path.md` 2.11 (2), lines 153–154; `api-client.ts`:27–39 sends GET only).
- **Fix:** add "Release 2 write tools call the write client (`apiSend`, `write-path.md` 2.11 (2)); only a write can get a 403 or a 415".

**7. Minor: the hand-offs Status line edit goes beyond what the plan allows.**
- **Spec text:** `release-2-handoffs.md`:3 adds "amended by webmcp-tools (T-15d S6: H3 noted for `webmcp-tools.md` §4)".
- **Source:** plan v0.3 D10 (lines 81–83) says each spec pull request edits "only its own new row and the Done cells it fills", so the parallel pull requests do not conflict. The Status line is shared with S1b and S3–S5. The H3 Done cell itself (line 21) is accurate.
- **Fix:** drop the Status-line edit (the H3 Done cell already records it), or add it with the D11 merge just before the pull request goes ready.

### Claim groups found fully correct
- **Group 2:** `reset-and-test-support.md` v1.8 §2.7, line 59, adds `method` from Release 2.
- **Group 4:** the twelve names are identical to v1.0.6 §4. §4's Page column matches US-38 AC1 (`user-stories.md`:236). US-39 AC2 has the four `list_*` tools, US-40 AC1 the six mutating tools, and US-40 AC2 the two delete tools with `cancelled`, `busy` and `not_found`. US-40 AC3 is the "via tool" marker.
- **Group 6:** `TOOL_ERROR_CODES` has neither `forbidden` nor `busy` (`tool-result.ts`:6–14). `codeForStatus` sends 403 and 415 to `server_error` through its default branch (lines 55–70). `fromApiOutcome` copies `issues` for any HTTP status (lines 84–89). `ViaLogEntry` has no `method` (`request-log.ts`:7). `apiGet` accepts a signal and headers (`api-client.ts`:20–37). T-11 Q2 is recorded in `plans/2026-09-24-T-11.md`:71–83.
- **Group 7:** plan v0.3 has S3 being drafted (a `recurring-bills.md` exists only in workflow worktrees). S4 and S5 are not started (no `budgets.md` or `pots.md` anywhere; plan line 76: "S4 and S5 start after S1b is merged"). The merge order ui-kit → recurring-bills → budgets → pots → webmcp-tools matches the "Owner's amendment" (line 76) and D6 (line 298).
- **Group 1, apart from findings 1, 2, 4 and 6:** the 2.11 (4) mapping, the build note, 2.11 (1)–(3) and (6), the 2.6 rows for 403 and 415, 2.3–2.6 as the source of both refusals, the §6 id and tool-kind table, and the claim that no test row covers 415 → `validation` (7.1, 7.3 and 7.6 do not) are all correct. The three Q9 amendments (§2.5, §2.8, §4) are applied exactly.
- **Group 3, apart from finding 5:** the delete flow matches ADR-0004 line 18.
- **Group 5, apart from finding 7:** `transactions.md` 2.14 defines `list_transactions` (line 151), its §6 says "`webmcp-tools.md` §4 points here" (line 265), and H11 (4) gives the E2E row to the first Transactions build task.

Files: `~/Own/ai-native-personal-finance/.claude/worktrees/wf_e020d1ba-e8d-3/docs/03-specs/webmcp-tools.md`, `~/Own/ai-native-personal-finance/.claude/worktrees/wf_e020d1ba-e8d-3/docs/03-specs/release-2-handoffs.md`
