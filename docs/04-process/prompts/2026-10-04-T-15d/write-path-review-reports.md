# Reports — the write-path spec's two reviews (T-15d, S1, pull request #87)

The two reviewers' final reports on `write-path.md` v0.1 (`789135b`), **condensed by the agent** — every finding is here with its severity, location and fix, in fewer words; the full texts
are in the session transcript (the harness frames each as model output, not as the owner's words). Both reviewed the files by reading them; neither could run a command. Then, what the agent did with them (section 3).

## 1. Reviewer 1 — facts and figures (1 blocker, 6 important, 18 minor)

**Blocker 1. The route-table guard (7.4) contradicts the Approved route plan.** Spec 2.1 "A write route never answers `GET`"; 7.4 "no write path exports `GET`".
`data-model.md:26` plans `GET|POST /api/budgets` and `GET|POST /api/pots`, so one `route.ts` would export both. Fix: state the rule per handler — "no `GET` handler changes data; a path may export `GET`
alongside write methods" — and make 7.4 assert that.

**Important 2.** The current issue mapping produces none of the codes 4.4 promises, and the spec names only `invalid_value`. Zod's `z.int()` reports a non-integer and a string as `invalid_type`
(`node_modules/zod/v4/core/checks.js:93-110`), which `schemas.ts:138-143` maps to `required`; `too_small` with minimum 1 maps to `required`, `too_big` to `too_long`. So today `1.5`, `"100"` and `0` come
out `required` and an over-maximum amount `too_long`. Changing `invalid_type` everywhere would change auth's documented rule at `schemas.ts:40-44`. Fix: key `too_small`/`too_big` on `issue.origin`, tell
a missing value from a wrong-typed one, say whether auth changes, add the cases to 7.1.

**Important 3.** The 404 row in §3 does not meet US-37 AC3 although 2.9 says it does. AC3 (`user-stories.md:229`): "returns 409/404 with a structured error; the UI shows 'Data was reset' and reloads". Two other
Approved texts the reading departs from are not named in Q5: the copy appendix row `user-stories.md:305` ("Stale write after reset (R2) | 409 | Data was reset — reloading") and `ADR-0005:34`. 2.9 also shortens the
AC3 quotation without marking the cut. Fix: show "Data was reset — reloading" on 404, or say plainly it does not meet AC3 and name both texts in Q5.

**Important 4.** Four changes to Approved documents are made silently: 2.12 adds `method` to the via-log entry (`webmcp-tools.md` §2.8, the `GET /api/test/log` answer in `reset-and-test-support.md` §2.7,
`ViaLogEntry`); 2.10 and §5 add a `WriteAttempt` table (`data-model.md`); 2.9 says the wrapper calls the threshold check while `reset-and-test-support.md` §2.4 says "called by repositories". Fix: list each as a
proposed amendment in §9.

**Important 5.** Plan items S1 (2) and (3) are decided by the agent instead of put to the owner: 2.5 is headed "settled" with no alternative, and the 415 status has none. Fix: a question with options and a recommendation.

**Important 6.** The copy "Already used" is neither an existing `COPY` string nor in the appendix (only inside US-15 AC1 as a label), and the appendix has no "R2 additions" section; Q4 (a) adds three rows only.
Fix: mark it *proposed* and add a fourth row.

**Important 7.** 2.12's claim about proxy logging is false: the proxy logs nothing for an ordinary request; it records only `X-Via: webmcp` requests (`proxy.ts:89`), and that entry has no status
(`request-log.ts:7, 26-30`). Fix: present it as new logging, a build task.

**Minor 8–25.** 8 "a malformed body never costs a query" is not true (rate limit and the proxy's `latestResetAt` query run first) → "never costs a business-rule query". 9 "the first route to use `z.enum`" — `AdminResetSchema`
already does, and `admin-reset.ts:66-71` exists because the mapper throws. 10 "strips unknown keys (as the existing request schemas do)" — `AdminResetSchema` is `z.strictObject`; say "as `LoginSchema`/`SignupSchema` do". 11 "no `.max(36)` exists in the code yet" —
`tests/unit/shared/tool-schema.test.ts:69-70` uses it; say "no schema in `src/`". 12 "Ids are database-generated" — the migration has `"id" UUID NOT NULL` and no default; `@default(uuid())` is Prisma's (server-generated); the conclusion holds. 13 conservation "bounds every sum below
`Number.MAX_SAFE_INTEGER`" — it bounds only balance plus pot totals; budget maximums and pot targets are bounded by count × the NFR-S3 limit; §5 talks about a single value. 14 "reset immediately" is from `ADR-0005:32`, not `reset-and-test-support.md` §2.4. 15 `/api/admin/reset` not rate-limited
is not in §2.7 (which covers `/api/test/*`). 16 cron calls `GET /api/admin/reset`; only the operator sends `POST`. 17 "no `Set-Cookie`" on a 403: the proxy's sliding re-issue (`proxy.ts:173-186`) appends one for any authenticated request older than 1 h unless the path is in `skipsReissue`; the new branches need the skip.
18 "The routes set `no-store` themselves" — only the success path does; the `src/server/http.ts` helpers set none. 19 2.6 says that if Q1 is declined "nothing else changes" but Q1 (b) says the validation codes still need adding. 20 `untrustedContentHint` on mutating tools is not "my decision" — NFR-W3 requires it.
21 `data-model.md` has no numbered sections. 22 `npm run seed:figures` prints neither Holiday's $531.00 nor 575,600; name `prisma/data.json`. 23 "the most a user can create is 25" → "at most 25 user-created rows exist at once". 24 exempting login and signup narrows an owner decision. 25 7.6 and 7.1 assume Q1 (a) and Q3 (a); `busy` is not in `TOOL_ERROR_CODES`.

**Checked, no defect:** every figure of 4.2 recomputed from `prisma/data.json` (balance 483,600; pots 92,000; sum 575,600; the three steps; $4,836.01 exceeds, $4,836.00 leaves $0.00; four seed budgets; Entertainment and Savings share Green); the derivation of 25 and the thresholds, limits and enums;
the proxy facts (the `X-Via` record before any check, `needsSession` with no method term, the 401 before the logout 403, `X-Request-Id` on every response, `no-store` only for non-API responses); the schema and error code lists; `checkThreshold`'s four queries and no call site; `resetToSeed` inserting no ids; the rate-limit key;
every quoted `COPY` string except "Already used"; the ADR, NFR, tech-debt and story citations; the hand-off attributions; the internal order of 2.2.

## 2. Reviewer 2 — the checklist, the stories, the questions (1 blocker, 9 important)

**Clean:** B (all template sections present); the security points that hold (the deny-list on the method, including a lower-case `patch`; Next ignores method-override headers; an exempt path with a suffix does not match; 401 before 403 leaks nothing to a cross-site caller; the three form types listed; the rate-limit key is safe, TD-17 closed);
H1, H5, H6 resolved, H2 subject to Q5, H3 correctly not claimed. **L1 met, L2 met** (figures re-added; Holiday's 531 comes from `data.json`), **L3 partial, L4 partial, L5 not applicable, L6 partial, L7 not met, L8 met.** H7 mostly as decided, with two deviations (the exemptions; the definition of "has a body").

**1. Blocker — 7.4 cannot pass against the Approved API, and 2.1's GET claim is false** (as Reviewer 1's blocker); also `GET /api/admin/reset` (`app/api/admin/reset/route.ts:14`) resets data. Fix: "no GET handler changes data, except the bearer-protected `GET /api/admin/reset`"; an API test that each GET leaves the database unchanged; drop "no write path exports GET" from 7.4.

**2. Important — the boundary codes in 4.4 contradict the current mapper, and the change alters signup's Approved behaviour** (as Reviewer 1's 2). Fix: specify the mapper keyed on Zod's `origin`; define how a missing field is told from a wrong-typed one; limit the new `invalid_type` mapping to amount fields or list the signup change under Q1; add each boundary to 7.1 as an input→code pair.

**3. Important — deleting a pot can break money conservation.** "Deleting a pot adds its `total` to `Balance.current` in the same transaction": under READ COMMITTED a deposit can land between the read and the delete, and that money is lost. Fix: `DELETE … RETURNING total` (or `SELECT … FOR UPDATE`), then the balance update; add "a concurrent deposit and delete conserve the sum" to 7.2.

**4. Important — the content-type rule depends on "has a body", which headers do not reliably signal.** HTTP/2 can send a body with neither `Content-Length` nor `Transfer-Encoding`; the spec does not say how the type is matched, so a prefix match would pass `text/plain; x=application/json` or `application/jsonx`. Fix: every non-DELETE write must declare exactly `application/json` (parameters ignored, case-insensitive); any declared non-JSON type is 415; DELETE may omit it; add those cases to 7.3.

**5. Important (a missing question) — the exempt list goes beyond the owner's decision without asking.** Login writes `LoginAttempt` rows and a cookie; admin reset changes all data. Fix: a §9 question with each exemption, its reason and the alternative.

**6. Important — adding `method` to the via log silently changes `webmcp-tools.md` §2.8, the `GET /api/test/log` answer and `ViaLogEntry`.** Fix: flag it as a proposed amendment.

**7. Important — what the client does on a 401 from a write is undefined, and §3 describes it wrongly.** For a `fetch` to `/api/*` the proxy returns JSON 401, not a redirect. Fix: on a 401 the client reloads the page; the page request gets the proxy's redirect (with `reason=reset` when a reset ended the session); tools return `unauthenticated` (US-39 AC4).

**8. Important — 2.9 and Q5 overstate what the 404 path satisfies:** only the 409 path meets AC3 as worded. Say so plainly.

**9. Important — L7 not met.** US-36 AC1 (reload, second tab) has no assertion; US-40 AC1's shared part (a tool given invalid input returns `validation` with `issues`) has no row. Fix: an E2E row and a WebMCP row.

**10. Important — the copy in 2.7 and Q4 is misdescribed** ("Already used" is not in `COPY`; no "R2 additions" section exists).

**11. Minor — L3 partial:** the search behind Q2 covered `updatedAt` only; list the other hits (H6, the copy appendix rows, `reset-and-test-support.md:83`) with the command and the date. **12. Important (L6) — Q1 bundles four decisions and its option (b) contains its own sub-choice;** split it. **13. Minor (L6) — Q5 bundles two decisions;** split it.
**14. Minor (L6)** — Q3's "a person cannot make 30 writes a minute" is asserted: say what 30 a minute means for an agent loop; Q5 (a) still costs one extra round trip on every write. **15. Minor (L4)** — "no tool echoes raw HTML" (NFR-S7) is not addressed: state that names are plain text and test a `<script>` name.
**16. Minor** — 2.11 (1) mislabels its source (NFR-W3, ADR-0004) and covers too few tools (`add_money_to_pot`, `withdraw_from_pot`, a budget reply with transactions). **17. Minor** — the `taken` row should say "as another pot" so a pot may keep its own name (US-23 AC1).

**E. Guesses an implementer would make:** E1 the 404 and 500 `message` strings; E2 `apiGet`'s pattern would turn a 204 into `invalid_response`; E3 a `DELETE` has no body schema; E4 "an empty body is `required` on each field" vs "not JSON is 400 with the root path"; E5 what happens if `checkThreshold` or `resetToSeed` throws after the commit;
E6 7.2 and 7.5 lower limits but a running server's environment is fixed — pre-fill the database instead; E7 the refusals' log line has no format; E8 `validationErrorResponse` hard-codes 400, a 415 needs a status.

## 3. What the agent did with them (`write-path.md` v0.2)

Everything above that is a defect of the spec is fixed in v0.2; nothing was dismissed. In order of the findings:
- **Blocker (both):** 2.1 and 7.4 rewritten — no `GET` handler changes data (`GET /api/admin/reset` the one exception), a path may export `GET` beside write methods, 7.4 checks that no `GET` handler calls the wrapper, and 7.2 adds an API test that every `GET` leaves the stored rows unchanged.
- **Mapper (R1 2, R2 2):** 2.7 now says the mapper takes the schema family, gives exact input→code pairs, keeps auth's mapping unchanged and says `invalid_value` never throws; 7.1 tests every pair, failing first.
- **Pot deletion (R2 3):** 2.8 reads the total from the delete itself; 7.2 tests a concurrent deposit and delete.
- **Content type (R2 4):** 2.4 compares the media type exactly, requires it on every `POST`/`PUT`/`PATCH`, lets a `DELETE` omit it, drops the body-detection by headers; 7.3 adds the cases.
- **Silent amendments, exemptions, copy (R1 4, 5, 6; R2 5, 6, 10, 12, 13):** put to the owner — nine single-choice questions (Q1 the 403 body, Q2 the validation codes, Q3 the stale-write rule, Q4 the numbers, Q5 four copy strings, Q6 the AC3 reading, Q7 the threshold form, Q8 the exemptions, Q9 the amendments to other Approved documents).
- **401 and 404 (R2 7, 8; R1 3):** §3 and 2.9 say the client reloads on a 401, that only the 409 path meets AC3 as worded, and name the two other texts the 404 reading departs from.
- **Logging, `Set-Cookie`, `no-store` (R1 7, 17, 18):** 2.12 says the refusal log line is new; 2.2 step 10 says the wrapper and the proxy set `no-store` and the refusals skip the cookie re-issue.
- **L7, L3, L4, L6 (R2 9, 11, 14, 15, 16, 17):** rows in 7.5 and 7.6, the search's command and hits in Q3, plain-text names and a `<script>` test, `untrustedContentHint` on every tool that returns user text with its sources, `taken` "as another pot", the explanations in Q3, Q4, Q7.
- **E1–E8, minor 8–25:** each stated or fixed in the text (2.6's message strings, `apiSend` and a 204, `DELETE` without a schema, 4.4's absent/not-JSON/`{}` cases, 2.9's behaviour when the check throws, the tests that fill the database, the refusal log line, `validationErrorResponse` taking a status, the corrected citations).
