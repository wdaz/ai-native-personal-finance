# Report — write-path review 3, the final spec and the amendments (T-15d, S1, pull request #87)

The reviewer's final report on `write-path.md` v1.0 and the same-commit amendments (`7545a04`), as handed back (the harness frames it as model output, not as the owner's words, and indents every line). **Edits to the text: none except formatting** — the harness's indent is removed and Prettier has normalised the Markdown; no word of the text is changed. The reviewer read the files; it ran no command.

---

Review of write-path.md v1.0 and the same-commit amendments (worktree docs-T-15d-plan, branch task/T-15d-spec-write-path, 7545a04). Read-only; nothing edited.

Nothing blocks. Two findings are important; the rest are minor.

## Important

**1. The rate-limit test mechanism contradicts itself.**
- `docs/03-specs/write-path.md:221` says: "Tests that lower a limit do it by filling the database, not by changing a running server's environment … `WriteAttempt` rows up to the limit … the API and E2E suites run with the limit raised (2.10)."
- `write-path.md:229` (7.5) says: "a rate-limited burst with the limit lowered for that project".
- `write-path.md:147` says the suites run "with a limit they cannot reach" but gives no value. "Pre-fill up to the limit" (7.3's 429 case) only works if that value is known and finite.
- Fix: choose one mechanism. Either a finite raised value (e.g. `WRITE_RATE_LIMIT_MAX` = N) that 7.3 and 7.5 pre-fill to, or a separate server/project on the default limit. State it once in 2.10/§7 and align 7.3 and 7.5.

**2. ADR-0005's Decision body still states the replaced rule, with no inline marker.**
- `docs/02-architecture/adr/0005-persistence-and-reset.md:35`: "a lightweight optimistic check (`updatedAt`) returns 409 on stale writes, which the UI turns into …". The replacement exists only in the header bullet (l.4).
- The same ADR's l.33 strikes replaced text inline (~~`0 3 */10 * *`~~ … "clarification 2026-09-23"), and so does ADR-0006 l.110. Someone building from the Decision section would implement the old rule.
- Fix: strike the clause on l.35 and add "clarification 2026-10-04".

## Minor

**3. Broken markdown in 7.6** (`write-path.md:230`): "`` `a tool that returns a pot named `<script>alert(1)</script>` returns it unchanged as text ``". The stray leading backtick shifts the code spans, so `<script>alert(1)</script>` ends up outside any span. GitHub strips it, and the named test case disappears when rendered. Fix: delete the backtick before "a tool".

**4. Leftover draft wording** (`write-path.md:142`): "asks that it run as one query instead of four". Q7 is decided. Fix: "runs as **one query** instead of four".

**5. Inexact quotation** (`write-path.md:159`): US-40 AC3's "a mutating tool call appears in the log with a via-tool marker". The source (`user-stories.md:251`) reads: "Every mutating tool call is visible in the UI immediately (same state as a user action) and appears in the server log with a "via tool" marker." Fix: quote it verbatim or drop the quotation marks.

**6. The pipeline never validates the path id.**
- 2.2 step 6 (`write-path.md:42`) says "A `DELETE` has no body and no schema", and §6 (l.209) says "(none for `DELETE`)".
- 4.4 (l.194) makes a non-UUID `id` on `DELETE` or `POST …/deposit` a 400 `invalid_format`.
- Fix: in step 6 and §6, say the wrapper also validates the path `id` with `z.uuid().max(36)`, `DELETE` included.

**7. `forbidden` is missing from the build note.** `src/webmcp/tool-result.ts:6–14` `TOOL_ERROR_CODES` has no `forbidden`, but `write-path.md:156` names only `busy` as a code to add. 2.11 (4) and 7.6 require `forbidden`. Fix: "adding `busy` and `forbidden` is a build note".

**8. ADR clarifications: wrong attribution and too narrow a search.**
- ADR-0006 l.4 credits the exempt list to "owner, T-15d plan gate … §2.3–§2.5". The exemptions are the owner's §9 Q8 (a); the plan gate decided only the rule. Fix: add "and SPEC-write-path §9 Q8 (a), 'bütün suallara cavab a'".
- Both clarifications (ADR-0005 l.4, ADR-0006 l.4) grep only `docs/02-architecture`. Checklist line L3 asks for "the other ADRs and documents". `release-2-handoffs.md:24` (H6, "a lightweight optimistic check") is a hit outside that scope and goes unlisted; the earlier review-2 report flagged the same thing. Fix: widen the search to `docs/` and list the hits.

**9. `WriteAttempt` should be named as excluded from the row count.** ADR-0005's 2026-09-23 note (l.9–10) says the threshold counts transactions, budgets and pots, "not `ResetLog` or `LoginAttempt`". `WriteAttempt` is new and carries `seeded` (data-model l.5: "Every entity has … `seeded`"). Fix: name `WriteAttempt` there, or in write-path 2.9, so the one-query rewrite can't count it by mistake.

**10. The H6 and H8 Done cells don't say the ask was narrowed** (`release-2-handoffs.md:24`, `:26`). The ticks are honest, but H6 still asks for "a lightweight optimistic check" (dropped by Q3), and H8 still says "the UI says 'Data was reset'" (narrowed by Q6). Fix: add one clause to each Done cell, e.g. "optimistic check replaced, §9 Q3 / ADR-0005 clarification 2026-10-04" and "read as §9 Q6".

**11. US-37 AC3 and one appendix row have no pointer to Q6.**
- `user-stories.md:229` (US-37 AC3) and the appendix row `user-stories.md:284` "After reset | stale request | Data was reset — reloading" still describe what Q6's reading departs from: a stale request is now a 401 that leads to the login message.
- A note is safe for CI. `copy.test.ts` parses only from the "## Appendix — validation and message copy" heading and maps only columns 1 and 3. So a dated note on AC3, or an edit to the Condition cell, would not break it. H10's reason for not touching the file doesn't apply here.
- Whether to add the pointer is the owner's call.

**12. Nits.**
- (a) The changelog's "Earlier versions" are out of order (`write-path.md:257`: v0.2, v0.1, v0.2.1…v0.2.6).
- (b) `docs/02-architecture/system-overview.md:19`'s table list lacks `WriteAttempt` (that document says it is "Consistent with ADR-0001…0007").
- (c) `write-path.md:105` says "from four codes to nine … with the copy each maps to", but the table lists eight; `too_short` is absent. Say it is auth-only, or add a row.
- (d) `write-path.md:131` cites "§9 Q9" for reset v1.8 §2.4, while the §9 table files that change under Q7. Cite "Q7, Q9".

## What is clean

- **Point 1:** all nine answers appear in the body exactly as option (a) reads them.
  - Q1: 2.6 403 row, l.85, 2.11 (4).
  - Q2: 2.7's two tables.
  - Q3: 2.8 and §8.
  - Q4: 2.10, 30/60 s per IP, overridable by environment.
  - Q5: §3 and 2.7, four new strings.
  - Q6: 2.9 bullets.
  - Q7: 2.9.
  - Q8: 2.3.
  - Q9: the §9 table.
  - The order of checks in 2.2 matches 2.3–2.6, 2.9, 2.10, §3, §6, 7.3 and 7.4. The Status line and §9 ("None", "Nothing waits for the owner") are consistent. Apart from findings 1, 4 and 6, no leftover conditional wording or contradiction.
  - Every existing COPY string the spec cites is in `src/shared/copy.ts`.
- **Point 2:**
  - auth.md v1.0.10 is clean: the Status and Changelog are in order; §2.10 now lists eight error codes and nine issue codes; the "four-code" text survives only in the dated v1.0.2 history.
  - reset-and-test-support.md v1.8 is clean: Status, Changelog, §2.4 "called by the write wrapper … as one query" and the §2.7 `method` note. No "called by repositories" remains anywhere.
  - data-model.md v1.2 is clean. The `WriteAttempt` row matches 2.10. `enums.test.ts` still passes: its `` `reason` \( `` regex first-matches the ResetLog row (l.13, before `WriteAttempt` at l.15), and the `Enums:` line is untouched. `seed.test.ts`'s Category regex is unaffected.
  - No other test or script reads auth.md, reset-and-test-support.md, the ADRs or release-2-handoffs.md. `copy.test` reads only the user-stories appendix, which is unedited, as H10 intends. traceability reads the PRD, user-stories and release-N-stories.txt.
  - The ADR Status lines and dates are fine.
  - `tech-debt.md:661` and the `proxy.ts:147–148` comment ("not run through ErrorEnvelope") are a dated closed record and code that changes with the build task, so they are not contradictions.
- **Point 3:** ticks are honest. H2, H5 and H7 are ticked; H1, H6 and H8 are unticked with partial annotations; H10 is new and unticked. Apart from finding 10, every Done cell reads correctly. H8's "reset-and-test-support.md line 83" is still l.83 after the edit.
- **Point 4:** clean apart from finding 5.
  - US-37 AC3 matches `user-stories.md:229` (only the first letter's case differs).
  - ADR-0005's Consistency clauses are verbatim.
  - auth.md §2.10's "seven codes" is correct for v1.0.9.
  - The appendix row "Stale write after reset (R2) | 409 | Data was reset — reloading" is exact (l.305).
  - NFR-S3 (1 ≤ x ≤ 99,999,999,999), US-15 AC2 ("0.01 ≤ x ≤ 999,999,999.99"), US-25 AC2, NFR-W3/W5/S4/S7 and US-39 AC3 all match their sources.
  - The code line references I checked match: proxy.ts 141–149 and 173–186, the 401 message, the "Not found" string, `RESET_TABLES` and threshold.ts's three counts.

PR #87's number in the Status line can't be checked with my tools (no `gh`).
