# Report — write-path review 1, facts and figures (T-15d, S1, pull request #87)

The reviewer's final report on `write-path.md` v0.1 (`789135b`), verbatim as handed back (the harness frames it as model output, not as the owner's words, and indents every line; the indent is removed here). The reviewer read the files; it ran no command.

---

Review of `docs/03-specs/write-path.md` v0.1 (branch task/T-15d-spec-write-path, worktree docs-T-15d-plan). Read-only. I checked every claim against the code, the seed and the documents the spec cites. I found 1 blocker, 6 important findings and 16 minor ones.

## Blocker

**1. The route-table guard (7.4) contradicts the Approved route plan.**
- Spec 2.1: "**A write route never answers `GET`**". Spec 7.4: "**no write path exports `GET`**".
- `docs/02-architecture/data-model.md:26` (Approved) plans `GET|POST /api/budgets` and `GET|POST /api/pots`. One `app/api/budgets/route.ts` would therefore export both `GET` (the list) and `POST` (create). 2.1 itself cites this list as its source.
- As written, 7.4 fails on the planned routes, or it forces a change to the API surface that nobody has flagged.
- Fix: state the rule per handler, not per path: "no `GET` handler changes data; a path may export `GET` alongside write methods". Make 7.4 assert that (for example, that a `GET` handler never calls `guardedWrite` or writes).

## Important

**2. The current issue mapping produces none of the codes 4.4 promises, and the spec names only `invalid_value`.**
- Spec 4.4: "0 and a negative amount are `too_small`; `1.5` or `"100"` is `invalid_format`", and one over the maximum is `too_large`. Spec 2.7: "any field: wrong type … `invalid_format`".
- What the code actually does:
  - Zod's `z.int()` reports a non-integer as `invalid_type` (`node_modules/zod/v4/core/checks.js:93-110`). A string sent to `z.int()` is also `invalid_type`.
  - `src/shared/schemas.ts:138-143` maps `invalid_type` to `required`. It maps `too_small` with minimum 1 to `required`, and other minima to `too_short`. It maps `too_big` to `too_long`.
  - So today `1.5` and `"100"` come out `required`, `0` comes out `required` (with `.min(1)`) or `too_short` (with `.positive()`), and an over-maximum amount comes out `too_long`.
- The spec's only mapping change is `invalid_value` to `invalid_format` (2.7, 7.1).
- Changing `invalid_type` everywhere would also change auth's documented rule at `schemas.ts:40-44`: "A missing, non-text or blank value reads 'Can't be empty'".
- Fix: state that the mapping must look at the field type (`issue.origin` number vs string) for `too_small`/`too_big`, and must tell `invalid_type` with no value (`required`) from `invalid_type` with a value (`invalid_format`). Say whether auth's behaviour changes. Add these cases to the 7.1 test list.

**3. The 404 row in §3 does not meet US-37 AC3, although 2.9 says it does.**
- Spec 2.9 says AC3 is reached "by a request for a record that is gone without a reset (404, 3)". Spec §3 "Record gone" shows "This budget no longer exists" and refreshes the list.
- US-37 AC3 (`user-stories.md:229`): "returns 409/404 with a structured error; the UI shows 'Data was reset' and reloads". The 404 path in §3 does neither.
- Two other Approved texts the reading departs from are not named in Q5:
  - The copy appendix row `user-stories.md:305`: "Stale write after reset (R2) | 409 | Data was reset — reloading".
  - `ADR-0005:34`: "…which the UI turns into 'Data was reset — reloading' when the record is gone".
- 2.9 also shortens the AC3 quotation without marking the cut ("409/404, the UI shows…").
- Fix: either show "Data was reset — reloading" on 404, or say plainly that the 404 path does not meet AC3 as written and add that departure to Q5, naming both texts above.

**4. Four changes to Approved documents are made silently; §9 does not list them.**
- 2.12 adds `method` to the via-log entry. That changes `webmcp-tools.md` §2.8 (`{ requestId, via: "webmcp", route }`) and the response of `GET /api/test/log` in `reset-and-test-support.md` §2.7 (`{ requestId, via, route }`). It also changes `ViaLogEntry` in `src/server/request-log.ts:7`.
- 2.10 and §5 add a new `WriteAttempt` table. That is a new entity in `data-model.md` (Approved, which lists `LoginAttempt` as the rate-limit source) and a schema change.
- 2.9 says the wrapper calls the threshold check. `reset-and-test-support.md` §2.4 says it is "called by repositories".
- Fix: list each one as a proposed amendment in §9, or as a Q, with the document and section it changes.

**5. Plan items S1 (2) and (3) are decided by the agent instead of put to the owner.**
- Plan lines 317-321 say S1 settles each item "stating the options and a recommendation for each". Review Focus 6 says S1 "lists the three open items with options".
- Spec 2.5 is headed "Where the two checks live — **settled**" and gives no alternative.
- The 415 status has no alternative either (for example 400). Only the body appears, folded into Q1 (a).
- Fix: add a Q with options (proxy vs per route; 415 vs 400) and a recommendation for each.

**6. The copy "Already used" is neither an existing `COPY` string nor in the appendix.**
- Spec 2.7's table puts "Already used" under "existing strings are in `COPY`". Q4 says §2.7 "reuses 'Already used'".
- It is not in `src/shared/copy.ts` and not in the copy appendix. It appears only inside US-15 AC1 (`user-stories.md:104`) as a UI label.
- Q4 (a) adds only three rows, so this string would never reach `COPY`, and the copy test would not cover it.
- Also, the appendix has no "R2 additions" section yet; Q4 (a) writes as though it does.
- Fix: mark the string *proposed* and add it as a fourth row in Q4 (a). Say that an "R2 additions" section is being created.

**7. 2.12's claim about proxy logging is false.**
- Spec: refused requests "are logged by the proxy like any other (one line, with the request id and the status…)".
- The proxy logs nothing for an ordinary request. It records only `X-Via: webmcp` requests (`proxy.ts:89`), and that entry has no status (`request-log.ts:7, 26-30`).
- Fix: present this as new logging (a build task), not existing behaviour.

## Minor

8. 2.7 says "a malformed body never costs a query", but 2.2 step 5 and 2.10 run the database-backed rate limit (count, insert, prune) before parsing. The proxy's `latestResetAt` query also runs first. Reword to "never costs a business-rule query".
9. 2.7 says "the first route to use `z.enum` would answer 500". Not the first: `AdminResetSchema` already uses `z.enum` (`schemas.ts:244`), and `admin-reset.ts:66-71` exists because `toErrorIssues` throws on an unknown enum value. The throwing claim itself is correct: `$ZodEnum` emits `invalid_value` (`zod/v4/core/schemas.js:1992-1993`).
10. 2.7 says "strips unknown keys (as the existing request schemas do)". `AdminResetSchema` is `z.strictObject` and rejects unknown keys. Say "as `LoginSchema`/`SignupSchema` do".
11. 2.7 says "no `.max(36)` exists in the code yet". `tests/unit/shared/tool-schema.test.ts:69-70` already uses `z.uuid().max(36)`. Say "no schema in `src/` uses it yet".
12. 2.8 says "Ids are database-generated". The migration has `"id" UUID NOT NULL` with no `gen_random_uuid()` (`prisma/migrations/20260922142518_init/migration.sql:44,58`). `@default(uuid())` is generated by Prisma on the server. The conclusion (ids change on every reset) still holds; fix the wording to "server-generated (Prisma `uuid()`)".
13. 2.8 says conservation "bounds every sum below `Number.MAX_SAFE_INTEGER` (`reset-and-test-support.md` §5)". Conservation bounds only balance plus pot totals; Σ budget `maximum` and Σ pot `target` are bounded by count × NFR-S3's limit (about 10^12). §5 talks about a single value, not sums. The conclusion holds; the reasoning and the citation do not.
14. 2.9 cites "reset immediately" to `reset-and-test-support.md` §2.4. The phrase is in `ADR-0005:32`.
15. 2.10 cites `reset-and-test-support.md` §2.7 for "`/api/admin/reset` not rate-limited". §2.7 covers `/api/test/*` only.
16. 2.3 says `POST /api/admin/reset` is "called by cron and the operator". Cron calls `GET` (`app/api/admin/reset/route.ts:8-16`; `reset-and-test-support.md` §2.3). Only the operator sends `POST`.
17. 2.3 and 7.3 promise "no `Set-Cookie`" on a 403. The proxy's sliding re-issue (`proxy.ts:173-186`) appends `Set-Cookie` for any authenticated request older than 1 h unless the path is in `skipsReissue`. The new 403 (and 415) branches need the same skip; say so as a build task.
18. 2.2 step 10 says "The routes set `no-store` themselves". Only the success path does (`app/api/overview/route.ts:19`). The `src/server/http.ts` helpers (`errorResponse`, `validationErrorResponse`, `rateLimitedResponse`) set no `Cache-Control`, and overview's 500 has none. The wrapper must add it to every answer.
19. 2.6 says that if Q1 is declined "nothing else in this spec changes". Q1 (b)'s own text says the validation codes still need adding, or each rule gets its own message string, which changes 2.7. Make them agree.
20. 2.11 (1) calls `untrustedContentHint` on mutating tools "a clarification, my decision under NFR-S7". NFR-W3 (`non-functional-requirements.md:28`) already requires it for every tool that returns user-entered text. Cite W3 and drop "my decision".
21. Q2 cites "`data-model.md` §1's list". `data-model.md` has no numbered sections; the list is at line 5. "§API surface" is a paragraph label, not a heading.
22. 4.2 credits `npm run seed:figures`, but that command prints the balance, "Pots total $920.00" and only the first four pots (`scripts/seed-figures.ts:69-70`). It prints neither Holiday's $531.00 nor 575,600. Checklist line L2 requires the reproducing command, so name `prisma/data.json` as the source of those two.
23. 4.3 says "the most a user can create is 25". It should read "at most 25 user-created rows exist at once": creating and deleting can repeat, and the count is of existing rows.
24. 2.3 exempts login and signup as "change no user data". The owner's decision (plan lines 36-38) covers "every non-GET `/api/*` route that changes data", and login writes and deletes `LoginAttempt` rows and sets a cookie. The exemption is a narrowing of an owner decision; put it to the owner or state it as such.
25. Some tests assume answers that are still open: 7.6 ("returns `forbidden`") assumes Q1 (a), and 7.1 ("the 31st in the window") assumes Q3 (a). Write them conditionally. Also, `busy` (§6, ADR-0004) is not in `TOOL_ERROR_CODES` (`src/webmcp/tool-result.ts:6-14`), and the spec does not name it as an addition.

## Checked, no defect

- **Seed figures (4.2):** I recomputed every figure in 4.2 from `prisma/data.json`, step by step. Balance 4,836.00 (483,600 cents). Pots: Savings 159, Concert Ticket 110, Gift 110, New Laptop 10, Holiday 531, total 920 (92,000 cents), sum 575,600.
  - Deposit $100 into Savings: balance 4,736, Savings 259, pots 1,020, sum 5,756.
  - Withdraw $30 from Concert Ticket: 110 → 80, balance 4,766, pots 990, sum 5,756.
  - Delete New Laptop: balance 4,776, pots 980, sum 5,756.
  - Deposit $4,836.01 exceeds the balance; $4,836.00 leaves $0.00.
  - Four seed budgets. Pot and budget share a theme: Entertainment and Savings are both `#277C78` (Green); further pairs exist.
- **Limits and thresholds:**
  - 25 is derived correctly from `Budget.category @unique` (10 categories), `Budget.theme @unique` and `Pot.theme @unique` (15 themes), and `Pot.name` citext `@unique`. `Transaction` has no write route; the seed rows are `seeded = true`.
  - 2,000 and 52,428,800 (`env.ts:110,115`); `positiveInt` throws on a bad value.
  - 99,999,999,999 cents equals US-15 AC2's 999,999,999.99; NFR-S3 text matches.
  - 30 characters (`data-model.md`; `OverviewDtoSchema` `.max(30)`); 10 and 15 enum values (`enums.ts`).
- **Proxy:**
  - `recordViaRequest` runs before any check, for any method (`proxy.ts:89`).
  - `needsSession` has no method term (`proxy.ts:95-100`).
  - The 401 branch comes before the logout 403; the body is `{ error: "unauthenticated", message: "Log in to continue" }`.
  - Logout's 403 is at lines 141-149: `{ message: "This request must be same-origin" }`, outside the envelope, and refused only on exactly `cross-site`.
  - `X-Request-Id` is set on every response; `no-store` only for non-API responses.
- **Schemas and errors:** seven `ERROR_CODES`, four `VALIDATION_ISSUE_CODES`, and the throwing default case, all as `auth.md` §2.10 states. `admin-reset.ts:161` returns `[{ path: [], code: "invalid_format" }]` for a body that is not JSON. The 429 helper sends `Retry-After`.
- **Threshold and reset:** `checkThreshold` runs four queries (three counts of `seeded = false` rows plus `pg_database_size`) and has no call site. `resetToSeed` truncates with `RESTART IDENTITY` and inserts with no ids; `RESET_TABLES` has 6 entries.
- **Rate limit:** `x-forwarded-for` first entry (`auth.ts:25`). The login limiter (`rate-limit.ts`) is login-only. ADR-0001:109 says rate limits use the database.
- **Copy:** every quoted `COPY` string exists verbatim (all except "Already used", see 6).
- **Clients:** `apiGet` is the only client helper. The overview tool passes `X-Via` through its `headers` option (`tools/overview.ts:19`), which the spec describes loosely but acceptably. `fromApiOutcome` maps 403 to `server_error`, as `webmcp-tools.md` §2.5 states.
- **ADRs, NFRs and tech-debt:** the ADR-0005 "Consistency" quote in Q2 is verbatim, and the claim about what an `updatedAt` grep finds holds. ADR-0006 `SameSite=Lax` (line 109) is correct. ADR-0004's delete flow, R-16 and `{ deleted: true }` are correct. TD-15, TD-17 (closed; Vercel overwrites the header) and TD-18 are cited correctly. NFR-S2/S3/S4/S6/S7, W3–W6 and Q2 exist with the cited meaning.
- **Stories:** US-04 AC3, US-15 AC2/AC3, US-16 AC2, US-17 AC2/AC3, US-24 AC2, US-25 AC2 and US-31 AC2 are cited correctly.
- **Hand-offs:** the H1, H2 and H5–H8 attributions match `release-2-handoffs.md`.
- **Internal order:** 2.2's order is consistent with 2.3–2.5, 2.10 and 7.3 (unauthenticated + cross-site → 401; refusals not counted by the limiter). Apart from 8 and 19 above, 2.6's table agrees with 2.7 and 2.9.
