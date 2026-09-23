# Final whole-branch review (opus)

Range: `90440a1..9ac2df8` (12 commits, the branch as it stood before the fix wave below).

T-04 final whole-branch review (90440a1..9ac2df8): the verdict is With fixes. The uuid half of
Task 5's fix round implemented an alternative the plan rejected, and 3 records repeat that
misreading.

## Declined to Judge
- Login password has no max: SPEC-auth §4 says it only has to be present. Abuse is T-05's rate limit.
- The 400 envelope's `message` text: T-05 chooses it.
- `retryAfterMinutes(undefined)` returns NaN, but its `number` type makes the caller handle a missing value.
- `unrecognized_keys` repeats key names back, but only on the strict response schemas. Request schemas strip unknown keys.
- Symbol path segments inside nested union issues are not converted. No current schema has a union.
- `getByTestId` in `tests/unit` is outside the rule. NFR-T6 is about E2E only.
- A later `no-restricted-syntax` block for the same files would replace this one (flat config). The boundaries fixtures would catch that.
- Prisma's `Category`/`Theme` types and the shared ones share names. T-09's hand-off already covers the mapping.

## Strengths
- ADR-0002 holds: `src/shared` imports only `zod` and its own sibling files. `http.ts` takes the type through `import type`.
- Nothing secret is echoed back. Checked by running it: `toErrorIssues` output carries no `input` (password "short1" is absent), and `abort`/`continue` do not leak.
- The document-mirror tests read the real documents and each has a fixture that fails on purpose (enums: missing-pink and no-enums; copy: reworded and no-appendix; tokens.css: a broken copy of the file).
- The Overview DTO matches SPEC-overview §6. The domain's bill and spent values are never negative. Seed data fits the bounds (longest transaction name 24, longest pot name 14). Every Prisma `@id` is `uuid() @db.Uuid`, so the strict `z.uuid()` fields will not block T-09.
- zod: only one copy (4.6.5) in the tree, `^4.6.5` moved from dev to dependencies correctly, and all peer ranges are `^3.25||^4`.
- The nullable type-array fix is present and correct (tool-schema.ts:23-24).

## Issues

### Critical
None.

### Important
1. **The `z.uuid()` exemption (tool-schema.ts:30, test at tool-schema.test.ts:64) contradicts D17.**
   - The decision table header is plan line 212: `| # | Decision | Why | Alternative rejected |`.
   - D17's fourth column, "Alternative rejected", reads: "`z.uuid()` exempt from `maxLength` (SPEC-webmcp-tools §2.4 says "any string" — Release 2's id inputs add `.max(36)`)".
   - So the exemption was rejected. The Task 5 reviewer read that column as the decision. The plan's code block was consistent with D17 all along.
   - Four other sources agree with the plan: E17 (plan line 204, "no `maxLength` until `.max(36)`"); SPEC-webmcp-tools §2.4 ("any string property lacks `maxLength`" → throw); ADR-0004 ("every string input has `maxLength`"); this branch's own backlog v1.9 T-15 hand-off ("ids with `.max(36)` for `toolInputJsonSchema`").
   - Fix: remove the `format === "uuid"` clause and the JSDoc mention of uuid; flip the test to expect the throw; add a test that `z.uuid().max(36)` passes (emits `maxLength: 36`, confirmed).
   - Correct the same misreading where it is recorded: process-log "got wrong" #1 and its Lessons paragraph, the fix-round paragraph in the execution-record README, and the ruling in progress.md.
   - **Resolution (fix wave):** reverted in commit `211188c`; re-reviewed clean (`final-rereview.md`). Documentation corrected by the controller (process-log.md, progress.md, README.md, the prompt record).

### Minor
2. **The fail-open walker gap is wider than recorded.** The anyOf case was deferred, agreed it can wait for T-11. Probe shows 5 shapes pass silently: `z.record`, `.catchall`, `z.tuple` (prefixItems), `.meta({id})` (a `$ref` to `$defs`), and a nullable object. The T-11 note should list all 5. A cheaper fix is to fail closed: throw on any keyword the walker does not handle, which fits "checked rather than trusted". — **Resolution:** widened in process-log.md's "Next" and the ledger's Final review section; not fixed in this branch (T-11 out of scope).
3. SPEC-auth §6's 400 cell still shows `{ error: "validation", issues }` without `message`, although §2.10 requires one. The owner's F2 answer named only 401 and 429, so this goes to the owner. — **Resolution:** routed to the owner in process-log.md's "Next"; not fixed here.
4. The branch starts before PR #9, so this tree does not have the ADR-0004/§2.4 wording that the code comments and the T-11 row cite. The merge is clean, but merge `main` in before opening the PR. — **Resolution:** `main` (with PR #9) merged into the branch before opening the PR.
5. The test-id rule does not cover `src/webmcp/**/*.tsx` (WebMcpProvider, WebMcpTools). — **Resolution:** parked; not in scope for T-04 (no `.tsx` exists under `src/webmcp` yet; T-11 adds them).
6. `ERROR_CODES` are typed into the test by hand, not read from §2.10, so a new code in the spec would not fail anything. — **Resolution:** parked, Minor, no downstream dependency.

## Recommendations
Revert the uuid exemption and fix the 3 records in one small commit. Add the 5 shapes to the T-11 note. Merge main in before the PR.

## Assessment
**Ready to merge?** With fixes
**Reasoning:** The product code is sound, well tested and inside its boundaries. But the guard now breaks an owner-approved decision, the spec and the ADR, and the process log records a wrong lesson. The fix is a few lines, and no R1 tool takes a uuid input.
