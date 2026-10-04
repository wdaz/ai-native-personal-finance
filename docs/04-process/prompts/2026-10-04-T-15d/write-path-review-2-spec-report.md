# Report — write-path review 2, the spec against the checklist, the stories and the questions (T-15d, S1, pull request #87)

The reviewer's final report on `write-path.md` v0.1 (`789135b`), verbatim as handed back (the harness frames it as model output, not as the owner's words, and indents every line; the indent is removed here). The reviewer read the files; it ran no command. The only edit: the home-directory prefix of the one worktree path it names is written `~` (the repository's home-path guard, T-15a).

---

I reviewed `~/Own/ai-native-personal-finance/.claude/worktrees/docs-T-15d-plan/docs/03-specs/write-path.md` (v0.1, Draft) in read-only mode against points A–E. The spec is mostly sound, but it has 1 blocker and 9 important findings.

**Clean (A–E):**
- **Category B** has no findings of its own. All template sections are present and numbered. The spec explains why it has no empty or loading state of its own (the page specs own them). Its gaps are listed under C and E.
- **Security points that hold up:**
  - The write check matches every method except GET, HEAD and OPTIONS. That deny-list also catches a lower-case `patch`, which fetch does not upper-case. HEAD and OPTIONS change nothing, and preflights carry no cookie, so they still get today's 401.
  - Next does not honour method-override headers.
  - An exempt path with a suffix, such as `/api/auth/login.json`, does not match the exempt list, so it gets the full checks (fails closed).
  - Putting 401 before 403 leaks nothing to a cross-site caller, who cannot read the answer.
  - The three content types a plain HTML form can send cross-site are all listed.
  - The rate-limit key (first `x-forwarded-for` entry) is safe; TD-17 is closed.
- **Hand-offs:** H1, H5 and H6 are resolved (H6's optimistic check goes to Q2). H2 is resolved subject to Q5. H3 is not claimed, which is correct (it belongs to the page specs and `webmcp-tools.md`).

## A. Checklist L1–L8 and hand-offs
- **L1 – met.** Validation is in 2.7 and 4.4. Keyboard and focus are in §3 (focus the first invalid field) and in §6 UI, which delegates to US-31/32 and the page specs.
- **L2 – met.** 4.2 names `npm run seed:figures` and `prisma/data.json`. I re-added the figures: 159+110+110+10+531 = 920, and 4,836 + 920 = 5,756. All three steps of the worked example are correct. The script prints only the first four pots; Holiday's 531 comes from `data.json`, which 4.2 also cites, so this is fine.
- **L3 – partially met.** See finding 11.
- **L4 – partially met.** NFR-S7's second clause, "no tool echoes raw HTML", is not addressed (finding 15).
- **L5 – not applicable.** The spec makes no claim about GitHub state and no "guarded by" claim.
- **L6 – partially met.** See findings 12–14.
- **L7 – not met.** See finding 9.
- **L8 – met.** §3 covers errors, 4.4 covers boundaries, and empty and loading states are delegated with a reason.
- **H7 – mostly as the owner decided.** The 403 body goes to Q1, proxy-or-per-route is settled in 2.5, and the tests are in 7.3, which mirrors `logout-fallback.spec.ts`. Two deviations: finding 5 (exemptions the owner did not take) and finding 4 (how the content-type rule is defined).
- **H8 – named in 7.2 and 7.5.** But the reading in 2.9 is overstated (finding 8).

## Findings

**1. Blocker – the route-table test (7.4) cannot pass against the Approved API, and 2.1's GET claim is false.**
- The spec says: "**A write route never answers `GET`**, and a `GET` never changes data" (2.1). Test 7.4 checks that "**no write path exports `GET`**".
- `data-model.md` (Approved) defines `GET|POST /api/budgets` and `GET|POST /api/pots`. The list GETs (used by `list_budgets` and `list_pots`) share their `route.ts` files with create, so 7.4 fails by design.
- `GET /api/admin/reset` (`app/api/admin/reset/route.ts:14`) resets data.
- **Fix:** state the rule as "no GET handler changes data, except the bearer-protected `GET /api/admin/reset`". Test it with an API test that each GET leaves the database unchanged. In 7.4, drop the "no write path exports GET" check.

**2. Important – the boundary codes in 4.4 contradict the current mapper, and the change also alters signup's Approved behaviour.**
- The spec says: "0 and a negative amount are `too_small`; `1.5` or `"100"` is `invalid_format`"; one more than 99,999,999,999 is `too_large`. The table also gives `invalid_format` for "any field: wrong type".
- What the code does today (`validationIssueCode`, schemas.ts:136, with Zod's code in `node_modules/zod/v4/core/checks.js:103`):
  - `z.int()` on 1.5 or on a string raises `invalid_type`, which maps to `required`.
  - `.min(1)` on 0 raises `too_small` with minimum 1, which maps to `required`.
  - `too_big` maps to `too_long`.
- Mapping "wrong type" to `invalid_format` for every field changes signup's answer. The current mapper and its doc comment give `required` ("Can't be empty") for a non-text value. That is an unflagged change to an Approved contract.
- **Fix:**
  - Specify the mapper. Zod 4's `too_small`/`too_big` issues carry `origin` (`"number"` vs `"string"`), so key the code on that.
  - Define how a missing field is told apart from a wrong-typed one. The issue does not carry the input by default.
  - Either limit the new `invalid_type` mapping to amount fields, or list the signup change under Q1.
  - Add each 4.4 boundary to 7.1 as an exact input→code pair.

**3. Important – deleting a pot can break money conservation.**
- The spec says: "Deleting a pot adds its `total` to `Balance.current` in the same transaction."
- Under READ COMMITTED, reading the total and then deleting lets a concurrent deposit land in between. That money is lost, breaking the invariant 2.8 relies on.
- **Fix:** require `DELETE … RETURNING total` (or `SELECT … FOR UPDATE`), then the balance update. Add "a concurrent deposit and delete conserve the sum" to 7.2.

**4. Important – the content-type rule depends on "has a body", which headers do not reliably signal.**
- The spec says: "'Has a body' means a `Content-Length` greater than 0 or a `Transfer-Encoding` header."
- HTTP/2 can send a body with neither header. The spec also does not say how the type is matched. A substring or prefix check would pass `text/plain; x=application/json` (which browsers treat as a simple `text/plain` request) or `application/jsonx`.
- `Sec-Fetch-Site` already covers modern browsers, so this is a fragility rather than a proven exploit.
- **Fix:** every non-DELETE write must declare a type whose media type (ignoring parameters, case-insensitive) is exactly `application/json`. Any declared non-JSON type gets 415. DELETE may omit the header. Add the `text/plain; x=application/json` case and an upper-case `Application/JSON` case to 7.3.

**5. Important (D: a missing question) – the exempt list goes beyond the owner's decision without asking.**
- The owner's rule: "every non-GET `/api/*` route that changes data refuses `Sec-Fetch-Site: cross-site`… and a body whose `Content-Type` is not application/json is refused."
- The spec says: "*Exempt from this rule*… `POST /api/auth/login` and `POST /api/auth/signup` (… change no user data…)… `POST /api/admin/reset`". The exemptions cover both rules.
- Login does change data: it writes `LoginAttempt` rows and sets a session cookie. Admin reset changes all data. The reasons given are plausible, but this narrows an owner decision.
- **Fix:** add a §9 question listing each exemption, its reason and the alternative (for example, apply the content-type rule to login and signup, which the client already sends as JSON).

**6. Important (C: a silent change to Approved specs) – adding `method` to the via log.**
- The spec says: "the entry gains `method`".
- This changes `webmcp-tools.md` §2.8 (`{ requestId, via: "webmcp", route }`) and the `GET /api/test/log` answer in `reset-and-test-support.md` §2.7, plus `ViaLogEntry`. It is not flagged as an amendment.
- **Fix:** flag it as a proposed amendment, as was done for Q1/Q2, or move it into Q1.

**7. Important (E) – what the client does on a 401 from a write is undefined, and §3 describes it wrongly.**
- §3 says: "Session ended | 401 | the proxy's redirect to `/login` (with `reason=reset` after a reset)". 2.9 says: "the next request… is a 401 and the proxy sends a page to `/login?reason=reset`".
- For a fetch to `/api/*`, the proxy returns JSON 401 `{ error: "unauthenticated", message }` with no reset reason, not a redirect.
- **Fix:** specify that on a 401 the client reloads the current page (or calls `location.assign`). The page request then gets the proxy's redirect, with `reason=reset` when the session was ended by a reset. Tools return `unauthenticated` (US-39 AC4).

**8. Important – H8 / Q5: 2.9 overstates what the 404 path satisfies.**
- The spec says that US-37 AC3 "is reached by… a request for a record that is gone without a reset (404, 3)".
- AC3 requires the UI to show "Data was reset" and reload. The 404 row in §3 shows "This budget no longer exists" and refreshes the list, so it does not meet AC3.
- **Fix:** say plainly in 2.9 and in Q5's text that only the 409 path meets AC3 as worded. After a scheduled reset, the user instead sees the login page's reset message.

**9. Important – L7 not met.**
- US-36 AC1 ("When I reload or open the app in another tab, Then the change is present") has no assertion. 7.2 traces US-36, but what it asserts is conservation. M2 asks for E2E for a UI story.
- US-40 AC1's shared part ("validated with the same rules… on the server; errors… structured") has no row. 7.6 does not test a tool getting a `validation` error with `issues`.
- **Fix:** add a row for each: an E2E write followed by a reload and a second tab, and a WebMCP row for an invalid input and a server 400.

**10. Important – the copy in 2.7 and Q4 is misdescribed.**
- 2.7 says "existing strings are in `COPY`", and Q4 says "§2.7 reuses 'Already used'".
- "Already used" is not in `COPY` (`src/shared/copy.ts`) or in the appendix table; it appears only in the text of US-15 AC1.
- Q4 also says "the appendix's 'R2 additions'". No such section exists; the appendix has only "R1 additions".
- **Fix:** make "Already used" a fourth proposed string and say Q4 creates an "R2 additions" table.

**11. Minor – L3 is partial.**
- The search behind Q2 covered `updatedAt` only. The meaning that changes is "a stale write gets 409 / an optimistic check".
- Unlisted hits: `release-2-handoffs.md` H6 ("a lightweight optimistic check"), the copy appendix rows "After reset | stale request" and "Stale write after reset (R2) | 409", and `reset-and-test-support.md:83`. No command is given.
- **Fix:** list the hits, with the command and the date.

**12. Important (L6) – Q1 bundles four decisions, and its option (b) contains its own sub-choice.**
- The four decisions: a `forbidden` code, five new issue codes, moving logout's 403 onto the envelope, and 415 as `validation`.
- Option (b): "the new validation codes still need adding, or each rule gets its own message string".
- **Fix:** split it into Q1a (403 body: envelope or `{message}`) and Q1b (issue codes), each with single-choice options.

**13. Minor (L6) – Q5 bundles two decisions.**
- They are the reading of AC3 and the form of the threshold check. Choosing (d) gives up the threshold choice.
- **Fix:** split it in two. The recommendations themselves are sound.

**14. Minor (L6) – the Q3 and Q5 recommendations.**
- Q3: "A person cannot make 30 writes in a minute" is asserted, not measured. Say what 30 per minute means for an agent loop: creating all 25 rows takes under a minute.
- Q5 (a): say that the one-query check still costs one extra database round trip on every write. That matters on Neon's cold path.

**15. Minor (L4 / NFR-S7) – "no tool echoes raw HTML" is not addressed.**
- Pot names are free text and are returned by tools. State that names are stored and returned as plain text (or restrict their characters), and add a test with a `<script>` name.

**16. Minor – 2.11(1) mislabels its source and covers too few tools.**
- The spec says: "a clarification, my decision under NFR-S7". NFR-W3 and ADR-0004 already require `untrustedContentHint` on any tool returning user text, so it is not the agent's decision; cite them.
- The parenthesis lists only `add_pot` and `edit_pot`. `add_money_to_pot` and `withdraw_from_pot` presumably return the pot with its name. A budget reply that includes the latest transactions (US-15 AC3) also carries text that is treated as untrusted.

**17. Minor – the `taken` row for pot names is ambiguous.**
- It says "same name, case-insensitive after trim". Say "as another pot", as the category row does, so that editing a pot and keeping its own name passes (US-23 AC1).

## E. Other places an implementer would have to guess (one line each)
- **E1.** The 404 and 500 `message` strings are unspecified ("`message`").
- **E2.** `apiGet`'s pattern would turn a 204 delete into `invalid_response`. `apiSend` needs a no-body success.
- **E3.** The wrapper's step 6 reads JSON. Say that DELETE has no body schema and skips it.
- **E4.** 4.4's "An empty body… is `required` on each missing field" contradicts "not JSON is 400 with the root path". Say `{}`.
- **E5.** It is unspecified what happens if `checkThreshold` or `resetToSeed` throws after the commit (500, or the write's own success).
- **E6.** 7.2 and 7.5 lower the threshold and rate limit, but a running server's environment is fixed. Say the tests pre-fill the database instead: 2,001 non-seed rows (as `tests/api/threshold.spec.ts` does) and 30 `WriteAttempt` rows.
- **E7.** 2.12 says refusals "are logged by the proxy like any other". The proxy logs nothing except X-Via entries today, so give the new line's format.
- **E8.** `validationErrorResponse` (`src/server/http.ts`) hard-codes 400. A 415 needs a status parameter (a build note).
