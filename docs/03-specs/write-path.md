# SPEC-write-path — the rules every writing endpoint and tool shares

Status: **Draft** (v0.2, 2026-10-04, revised after two read-only reviews; the owner's answers to §9 are pending and the pull request stays a draft until they are in) ·
Author(s): Agent (Claude Code, Sonnet 5.5, background session) · Date: 2026-10-04
Implements: US-36 (AC1 persistence), US-37 (AC1's threshold, AC3), US-40 (the shared parts of AC1 and AC3), the server side of
US-31 · Constrained by: ADR-0001, ADR-0004, ADR-0005, ADR-0006, NFR-S2, NFR-S3, NFR-S4, NFR-S6, NFR-S7, NFR-W3 to NFR-W6, NFR-Q2 · Resolves hand-offs H1 (the limits),
H2, H5, H6 (the shared transaction rule), H7, H8 (US-37 AC3) of `release-2-handoffs.md` · Plan: `docs/04-process/plans/2026-10-04-T-15d.md`,
Task S1
Design: none — this spec has no screen. §3 and §6 say what each page shows when a write fails; the page specs draw it.

## 1. Purpose

Release 2 is the first release that changes data: budgets and pots are created, edited and deleted, and money moves between a pot
and the balance. Budgets, pots and the agent tools each need the same answers — who may write, what a request must look like, how it
is validated, what happens when the data changed underneath it, when the demo resets itself, and how an error reaches the user — and
three page specs written separately would give three. This spec states them once; `budgets.md`, `pots.md` and `webmcp-tools.md` §4
cite its sections by number and add only what is specific to their page.

## 2. Behaviour

**2.1 The write routes.** A *write route* is a handler for `POST`, `PUT`, `PATCH` or `DELETE` under `app/api` that is not on the exempt
list of 2.3. The planned set (`data-model.md`, the "API surface" paragraph), each defined in its page spec:

| Method and path | Page spec | Does |
|---|---|---|
| `POST /api/budgets` · `PATCH /api/budgets/:id` · `DELETE /api/budgets/:id` | `budgets.md` | create · edit · delete a budget |
| `POST /api/pots` · `PATCH /api/pots/:id` · `DELETE /api/pots/:id` | `pots.md` | create · edit · delete a pot (deleting adds its total back to the balance) |
| `POST /api/pots/:id/deposit` · `POST /api/pots/:id/withdraw` | `pots.md` | move money between the balance and a pot |

Transactions have no write route: they are read-only in this product (`data-model.md`). **No `GET` handler changes data**, with one
exception that exists today: the bearer-protected `GET /api/admin/reset` the cron calls. A path may export `GET` beside its write methods
(`GET|POST /api/budgets` and `GET|POST /api/pots` share a file); `SameSite=Lax` (ADR-0006) protects a write only while no `GET` can
change data, so 7.4 tests it.

**2.2 The order of work for one write request.** Each step either ends the request with the answer shown or passes it on.

1. `proxy.ts`: the `X-Via` marker is recorded (`recordViaRequest`, any method, before any check, so a refused request is on record too).
2. `proxy.ts`: no valid session → **401** `unauthenticated` (existing; it comes first, so an unauthenticated caller learns nothing else).
3. `proxy.ts`: the cross-site rule (2.3) → **403**, body 2.6 (the envelope code `forbidden` with Q1 (a); logout's `{ message }` body with Q1 (b)).
4. `proxy.ts`: the content-type rule (2.4) → **415**.
5. The handler, through one shared wrapper (`src/server/write.ts`, a build task's name): the rate limit (2.10) → **429** `rate_limited`. It runs before the body is read, so a flood costs one small query and no parsing.
6. The wrapper reads the body as JSON and validates it with the shared schema (2.7) → **400** `validation`. A `DELETE` has no body and no schema.
7. One database transaction applies the change (2.8); a missing record → **404** `not_found`; a broken business rule → **400** `validation`.
8. After the commit the threshold check runs (2.9); when exceeded the demo resets and the answer is **409** `conflict`.
9. Otherwise **201** (create, with the record), **200** (edit, deposit, withdraw, with what the page spec names) or **204** (delete).
10. Every answer, including the refusals of steps 2–4 and every error the wrapper builds, carries `X-Request-Id` and `Cache-Control: no-store`. Today the proxy sets `no-store` only on authenticated
    **page** responses (not on any `/api/*` answer, its own 401 included), and a route sets it on its *success* path (`app/api/overview/route.ts`, `app/api/meta/route.ts`); the `errorResponse`, `validationErrorResponse` and `rateLimitedResponse` helpers (`src/server/http.ts`) and the proxy's own 401 set
    none, so the wrapper and the proxy must (a build task; 7.3 tests every refusal). A refusal of step 3 or 4 must also not re-issue the session cookie: the proxy's sliding re-issue
    (`proxy.ts` 173–186) skips only `/api/auth/logout`, `/api/auth/login` and the logout fallback today, so the new branches join that skip.

**2.3 The cross-site rule** (owner decision, 2026-10-04, T-15d plan gate — taken, not reopened). Every write route refuses a request
whose `Sec-Fetch-Site` header is exactly `cross-site`: status **403**, body 2.6, no `Set-Cookie`, nothing written. Exactly the
`POST /api/auth/logout` precedent (`proxy.ts`, TD-15): `same-origin`, `same-site`, `none` and an **absent** header pass — an old client
that sends no fetch metadata is defended by `SameSite=Lax`, as before. **Exempt from both this rule and 2.4** (a narrowing of the owner's
"every route that changes data", put to the owner in §9, Q8): `POST /api/auth/login` and `POST /api/auth/signup` (they run before a session exists; login writes only its own
`LoginAttempt` row and the cookie; the demo credentials are public), `POST /api/auth/logout` (its own rule, same outcome), `POST /api/admin/reset`
(a bearer secret; cron calls `GET`, the operator `POST`, neither sends fetch metadata) and `/api/test/*` (exists only with `APP_ENV=test`, no session). The exempt list is the *only*
list: a new route is a write route until a spec says otherwise (7.4 guards it). The match is on the exact path; `/api/auth/login.json` is not exempt.

**2.4 The content-type rule** (owner decision, 2026-10-04; made exact here). The media type is compared exactly and case-insensitively, parameters ignored: `application/json` and
`application/json; charset=utf-8` pass; `application/jsonx`, `text/plain; x=application/json` and every other type do not. A `POST`, `PUT` or `PATCH` must declare it, and one that declares
anything else or nothing is refused with **415**, body 2.6, nothing written (stricter than "a body whose type is not JSON" in one case — a bodiless `POST` with no type — and no planned route sends one). A `DELETE`
has no body and may omit the header, but one that declares a type other than JSON is refused too. This avoids reading `Content-Length`/`Transfer-Encoding` to decide whether there is a body, which HTTP/2 does not
reliably carry. The refused types include the three a plain HTML form can send cross-site: `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data`.

**2.5 Where the two checks live.** In `proxy.ts`, for every `/api/*` path (my recommendation, options below), because the proxy already runs before every handler, sees headers only, and a new route cannot forget it.
Alternatives: *per route* (each handler calls a guard — one forgotten line from no check, so the route-table guard of 7.4 would be the only net) and *in the wrapper* (the same, plus the 401 and the `X-Via` record would not
precede it). The rate limit, the validation and the threshold stay in the wrapper: they need the database and the parsed body. The proxy's `needsSession` has no method term today; the new branch keys on the method and the exempt
list and sits after the 401 branch. **415 or 400?** 415 is the status HTTP defines for an unsupported media type, and a client that gets it knows what to fix; `/api/admin/reset` answers 400 for a body that is not JSON, which stays as it is.

**2.6 Answers.** All use `ErrorEnvelope` (`auth.md` §2.10, `src/shared/schemas.ts`) — except the 403 if the owner answers Q1 (b), which keeps logout's `{ message }` body; `message` is a fixed string, `validation` carries
`issues` and no `message`, and no answer echoes the input.

| Status | `error` | When | Body beyond `error` |
|---|---|---|---|
| 400 | `validation` | the body is not JSON, or fails the schema, or breaks a business rule (2.7) | `issues: { path, code }[]` |
| 401 | `unauthenticated` | no valid session, including after a reset (2.9) | `message: "Log in to continue"` (existing) |
| 403 | `forbidden` with Q1 (a); none with Q1 (b) | 2.3 | `message: "This request must be same-origin"` (with Q1 (b) the body is `{ message }` alone, as logout's is today) |
| 404 | `not_found` | the record in the path does not exist (anymore) | `message: "Not found"` (the string `/api/test/log` already uses) |
| 409 | `conflict` | the write triggered the threshold reset (2.9) | `message: "Data was reset"` |
| 415 | `validation` | 2.4 | `issues: [{ path: [], code: "invalid_format" }]` — the shape `/api/admin/reset` already uses for a body that is not JSON |
| 429 | `rate_limited` | 2.10 | `message`, `retryAfter` (seconds) and a `Retry-After` header |
| 500 | `server_error` | anything unexpected (logged with the request id) | `message: "Something went wrong"`, or the route's own fixed string |

`forbidden` is not in `ErrorEnvelope` today: `auth.md` §2.10 lists seven codes and logout's 403 answers `{ message }` outside the envelope (`proxy.ts` 141–149). Adding the code, and moving logout's 403 body onto the envelope,
is an amendment to an Approved spec: **§9, Q1**. If the owner declines it, a 403 keeps logout's body `{ "message": "This request must be same-origin" }`, 7.3 asserts that body, and the tool mapping of 2.11 (4) stays as it is.
`validationErrorResponse` hard-codes 400 today; a 415 needs it to take a status (a build note).

**2.7 Validation.** One Zod schema per request body in `src/shared/schemas.ts`, used by the form, the route and the tool (NFR-Q2, S3); the server validates again whatever the client did. A request schema strips unknown keys,
as `LoginSchema` and `SignupSchema` do. Money travels as **integer cents** in every body; the client turns the typed text (`$1,234.50`, with its optional leading `$` and thousands separators) into cents before sending, and
the typed-text message ("Enter an amount with up to two decimals") is the client's. An id is `z.uuid().max(36)`: the `.max` is what `toolInputJsonSchema` needs to give a tool a `maxLength` (it throws without one); no schema in `src/` uses it yet,
only `tests/unit/shared/tool-schema.test.ts`. Names are stored and returned as plain text: nothing renders or interprets a name as markup, and a tool never returns HTML (NFR-S7); 7.1 and 7.6 test a name that looks like a script tag.

**The issue mapper must change.** Today `toErrorIssues` maps Zod's `invalid_type` to `required`, `too_small` with a minimum of 1 to `required` and any other to `too_short`, `too_big` to `too_long`, `invalid_format` to `invalid_format`, and
**throws** on any other Zod code (`schemas.ts` 136–149). That gives, for an amount sent as `1.5` or `"100"`, `required`; for `0`, `required`; for a too-large amount, `too_long` — and a category not in its enum (`invalid_value`) answers 500 (`/api/admin/reset` works around this
with its own mapper, `admin-reset.ts` 66–71). Login and signup are an Approved contract that reads a non-text value as "Can't be empty" (`schemas.ts` 40–44), and that does **not** change. So the mapper takes the family of the schema: the **write schemas** map to exactly the pairs below
(the numeric/string kind of a size issue comes from Zod's `origin`; a missing value is told from a wrong-typed one by whether the input holds the property), the **auth schemas** keep today's mapping, and `invalid_value` never throws.

| Input to an amount field | Code | Input to a pot `name` | Code | Input to a `category` or `theme` | Code |
|---|---|---|---|---|---|
| absent, `null` | `required` | absent, `""`, only spaces | `required` | absent | `required` |
| `"100"`, `1.5`, `true` | `invalid_format` | a number | `invalid_format` | a value not in its enum | `invalid_format` |
| `0`, `-5` | `too_small` | 30 characters | accepted | the enum value | accepted |
| `1`, `99999999999` | accepted | 31 characters | `too_long` | | |
| `100000000000` | `too_large` | | | | |

The `issues` vocabulary then needs more than today's four codes; the proposal, with the copy each maps to (an existing `COPY` string unless marked *proposed*):

| Code (proposed new in bold) | On field | Meaning | Copy |
|---|---|---|---|
| `required` | any | missing or empty after trim | Can't be empty |
| `invalid_format` | an amount | not a whole number of cents | Enter an amount with up to two decimals |
| **`too_small`** | an amount | less than 1 cent | Amount must be greater than 0 |
| **`too_large`** | an amount | more than 99,999,999,999 cents | Amount is too large |
| `too_long` | a pot name | more than 30 characters | Maximum 30 characters |
| **`exceeds_balance`** | a deposit | more than the balance | Amount exceeds your current balance |
| **`exceeds_total`** | a withdrawal | more than the pot's total | Amount exceeds this pot's total |
| **`taken`** | a pot `name` | the same name as *another* pot, case-insensitive after trim (a pot may keep its own name when edited, US-23 AC1) | A pot with this name already exists |
| **`taken`** | a `category` or `theme` | already used by another budget (category, theme) or another pot (theme) | Already used (*proposed*, §9 Q5) |

A business rule that is true or false of the stored data at the moment of the write (`exceeds_*`, `taken`) is a **400 `validation`**, not a 409: it names a field the user can fix. The path is the JSON property name. A pot name is trimmed and counted in UTF-16 code units
(JS `.length`), which is what the live "N characters left" counter counts. Order of checks inside one request: shape first, then the rules that need the database, so a malformed body never costs a business-rule query.

**2.8 Consistency** *(clarifies ADR-0005's "Consistency" line — §9, Q3).* A write is one database transaction. The rules that read stored data are *conditional updates*, so two requests racing cannot both succeed: a deposit is
`UPDATE Balance SET current = current − x WHERE current ≥ x` together with `UPDATE Pot SET total = total + x WHERE id = …` — zero rows updated on either means the whole transaction is rolled back and the answer is `exceeds_balance` (re-read to tell it from
a missing pot, which is 404). A withdrawal is the mirror, `WHERE total ≥ x`. **Deleting a pot** takes its total from the delete itself — `DELETE FROM Pot WHERE id = … RETURNING total` (or `SELECT … FOR UPDATE` first) — and adds exactly that to `Balance.current` in the same transaction, so a deposit
landing between a read and the delete cannot be lost. Budgets never touch the balance (US-04 AC3). The unique constraints already in the schema (`Budget.category`, `Budget.theme`, `Pot.name` case-insensitive, `Pot.theme`) are the last line of defence for `taken`:
a violation caught from the database maps to the same 400. **Money is conserved**: `Balance.current + Σ Pot.total` is unchanged by a deposit, a withdrawal and a pot deletion (4.2). Every sum stays far below `Number.MAX_SAFE_INTEGER`: that sum is conserved, and the sums of
budget maximums and pot targets are at most 25 values of at most 99,999,999,999 cents, about 2.5 × 10¹² (`reset-and-test-support.md` §5 states the limit for a single value). Ids are **server-generated** (Prisma `uuid()`) and **change on every reset**
(`resetToSeed` inserts without ids), so an id from before a reset never names a record after it: a stale `PATCH` or `DELETE` is a 404, it cannot edit the re-seeded data by accident. The request carries no `updatedAt`; an edit is last-write-wins, which is safe for one
shared demo account whose only invariant (conservation) is held by the conditional updates.

**2.9 The storage threshold and reset** (resolves H2; US-37 AC1). After the transaction commits, the wrapper calls `checkThreshold` (`src/server/threshold.ts`, no call site today; `reset-and-test-support.md` §2.4 says "called by repositories", which becomes "by the write wrapper", §9 Q9).
When it reports `exceeded`, the wrapper calls `resetToSeed(db, "threshold")` and answers **409** `conflict` `{ message: "Data was reset" }` — the write the user just made is wiped with the rest, which is what "reset immediately" means (ADR-0005, Reset). The client shows `COPY.dataWasReset`
("Data was reset — reloading") and reloads. If `checkThreshold` itself throws, the write has committed: it is logged and the answer is the write's own success (the check is a guard, not part of the write); if `resetToSeed` throws after `exceeded`, the answer is 500.

**How US-37 AC3 is met — and where it is not.** The reset writes a new `ResetLog` row and every session is older than it, so **the next request of this or any other tab is a 401**. AC3 says "a request that arrives after a reset for a record that no longer exists returns 409/404 with a structured error; the UI shows 'Data was reset' and reloads". Read against the code:
- the request that **causes** a threshold reset gets the 409, and the UI shows "Data was reset — reloading" and reloads — AC3 as worded, and the copy appendix row "Stale write after reset (R2) | 409 | Data was reset — reloading";
- a request after the reset meets the proxy's **401** first; the client reloads the page and the proxy's redirect lands on `/login?reason=reset` ("The demo data was reset — please log in again"), not on "Data was reset";
- a request for a record that is **gone without a reset** (deleted in another tab) is a 404, and the page shows the record-gone message and refreshes (3). That departs from AC3's wording and from ADR-0005's "which the UI turns into 'Data was reset — reloading' when the record is gone": a deleted record is not a reset, and the two messages say different things.
§9, Q6 asks the owner to confirm this reading.

The check as written costs four queries (three counts of rows with `seeded = false`, and `pg_database_size`) and, in Release 2, **its row trigger cannot fire**: user-created rows are budgets and pots only (`Transaction` has no write route); at most 10 budgets (one per category) and 15 pots (one per theme) exist at once, 25 against a threshold of 2,000.
Only the byte trigger can, through database growth (the login and write-limiter tables, 2.10). The spec keeps the per-write check because US-37 AC1 and ADR-0005 require it, asks that it run as **one query** instead of four (H2's "cheaper" option; it still adds one round trip to the database to every write),
and offers the alternatives in §9, Q7. A tool call is a write like any other and is checked the same way.

**2.10 The rate limit** (resolves H5; NFR-S4). A write route, through the wrapper, counts the request against a key before it does anything else. The key is the **client IP** (the first `x-forwarded-for` entry, as the login limiter reads it; on Vercel the platform sets it, TD-17), not the session:
the demo credentials are public, so a fresh session is free. The limit is **N writes per window**, set in §9, Q4 (recommended: 30 per 60 s; creating every row the demo allows takes 25 writes, so a person or an agent filling it in one go stays under it), both overridable by environment
(`WRITE_RATE_LIMIT_MAX`, `WRITE_RATE_LIMIT_WINDOW_SECONDS`) so the API and E2E suites — every test comes from one IP — are run with a limit they cannot reach. Over the limit: **429** 2.6, nothing written. State is in the database (ADR-0001: no in-memory state on serverless), in a table of its own
(`WriteAttempt`, a build task's name; `LoginAttempt` is for failed logins), which is pruned by the check itself (rows older than the window are deleted when it runs — TD-18's lesson) and is added to `RESET_TABLES`, so a reset empties it. Refusals of 2.3 and 2.4 are not counted (they write nothing);
`/api/test/*` (`reset-and-test-support.md` §2.7) and `/api/admin/reset` (a bearer secret) are not rate-limited.

**2.11 Agent tools** (US-40, ADR-0004, NFR-W3–W6). Every mutating tool goes through the same routes and the same pipeline as the UI, never around them.
(1) `consequentialHint: true` on all of them, and `untrustedContentHint: true` on every tool whose output holds user-entered text — NFR-W3 and ADR-0004 require it, US-39 AC3 lists only the read tools: here that is `add_pot`, `edit_pot`, `add_money_to_pot` and `withdraw_from_pot`
(they return the pot with its name) and `add_budget` and `edit_budget` if a budget reply carries its latest transactions (US-15 AC3). (2) The client sends `X-Via: webmcp` on every write, so the request is on record (US-40 AC3); today only `apiGet` exists and sends it, so a write client helper is needed
(`apiSend`, a build task's name) that sets `Content-Type: application/json` on `POST`/`PUT`/`PATCH` and treats a 204 as success (`apiGet`'s pattern would read a 204 as an invalid response). (3) A tool validates its input with the same schema and returns the server's `validation` answer with its `issues`; it never throws (NFR-W6).
(4) The error codes map from the HTTP status: 400 `validation`, 401 `unauthenticated`, 404 `not_found`, 409 `conflict`, 429 `rate_limited`, abort `cancelled`, **403 `forbidden`** (new with Q1 (a); today `webmcp-tools.md` §2.5 sends a 403 to `server_error`, which stays if Q1 is (b)), other `server_error`.
`TOOL_ERROR_CODES` (`src/webmcp/tool-result.ts`) has no `busy`, which ADR-0004 and US-40 AC2 name for a delete tool called while its dialog is open; adding it is a build note. (5) `delete_budget` and `delete_pot` send `DELETE` only after the user confirms in the on-screen dialog (R-16, ADR-0004) —
the server sees an ordinary delete, so 2.3 is the only server-side guard against a cross-site delete. (6) The registry unit test asserts `consequentialHint` (the polyfill's `getTools()` drops it, H3) and the page spec says how.

**2.12 Logging.** An `X-Via: webmcp` request is logged as `{ requestId, via, route }`. A write and a read on the same path are indistinguishable in it; the entry gains `method`, so US-40 AC3's "a mutating tool call appears in the log with a via-tool marker" is testable per method
(an amendment of `webmcp-tools.md` §2.8 and of the `GET /api/test/log` answer in `reset-and-test-support.md` §2.7, §9 Q9). The proxy logs nothing about an ordinary request today, only `X-Via` entries; the refusals of 2.3 and 2.4 get **one new structured line** each, `{ requestId, status, method, route }`, printed the way the via
entry is (a build task); a body is never logged.

## 3. States

What the user sees when a write does not succeed; `COPY` strings exist unless marked *proposed* (§9, Q5).

| State | Trigger | What the user sees | Exit |
|---|---|---|---|
| Pending | request sent | the submit control is disabled and says it is working; the form stays | any answer below |
| Success | 201 / 200 / 204 | the page shows the new state with no reload (US-15 AC3, US-16 AC2, US-17 AC2…); the modal closes and focus returns to its trigger | — |
| Validation error | 400 | each `issues` entry becomes the message under its field (2.7's table), the first invalid field is focused (US-31 AC2) | the user fixes the field |
| Record gone | 404 | a message that the budget/pot no longer exists (*proposed*: "This budget no longer exists", "This pot no longer exists"), the modal closes, the list refreshes (US-17 AC3, US-24 AC2) | the refreshed list |
| Data was reset | 409 | "Data was reset — reloading", then a reload, which the proxy redirects to the login page, with "The demo data was reset — please log in again" | log in again |
| Session ended | 401 on a `fetch` | **the client reloads the current page**; the page request meets the proxy's redirect to `/login` (with `reason=reset` when a reset ended the session). A tool returns `unauthenticated` and no data (US-39 AC4) | log in again |
| Rate limited | 429 | *proposed*: "Too many changes. Try again in {N} seconds" (`{N}` from `retryAfter`; 1 is "1 second"); nothing changes | wait, retry |
| Refused | 403, 415 | "Something went wrong. Try again" — the app's own client never sends either, so this is a bug or an attack, not a user path | — |
| Server error | 500 | "Something went wrong. Try again" (existing) | retry |
| Network error | no response | "Can't reach the server. Check your connection and try again" (existing) | retry |

Empty state and loading are the page's (`budgets.md`, `pots.md`); a write route has neither.

## 4. Rules and boundaries

**4.1 Limits.** An amount: an integer, `1 ≤ cents ≤ 99,999,999,999` (NFR-S3; US-15 AC2's "0.01 ≤ x ≤ 999,999,999.99"). A pot name: 1–30 characters after trim; a budget has no name. At most 10 budgets (one per category) and 15 pots (one per theme); a budget's theme is unique among budgets, a pot's among pots
(so a pot and a budget may share a theme — the seed's Savings pot and Entertainment budget are both Green). A category and a theme come from their enums (10 and 15 values, `src/shared/enums.ts`).

**4.2 Conservation, with the seed** (`prisma/data.json`, read 2026-10-04; `npm run seed:figures` prints the balance `$4,836.00`, "Pots total `$920.00`" and the first four pots, and the fifth, Holiday `$531.00`, is in `data.json`): the balance is 483,600 cents and the five pots hold 92,000 cents (Savings 15,900, Concert Ticket 11,000, Gift 11,000,
New Laptop 1,000, Holiday 53,100), so **`Balance.current + Σ Pot.total` = 575,600 cents** in the seed. Three writes in a row on the seed, the sum checked after each: deposit `$100.00` into Savings (balance `$4,736.00`, Savings `$259.00`, pots `$1,020.00`, sum `$5,756.00`); withdraw `$30.00` from Concert Ticket (`$110.00` → `$80.00`;
balance `$4,766.00`, pots `$990.00`, sum `$5,756.00`); delete New Laptop (`$10.00`; balance `$4,776.00`, pots `$980.00`, sum `$5,756.00`). The sum is the same each time, 575,600 cents; an API test asserts it after such a sequence (7.2). A deposit of `$4,836.01` is `exceeds_balance`; a deposit of `$4,836.00` is allowed and leaves the balance at `$0.00`,
after which any deposit is `exceeds_balance` (US-25 AC2).

**4.3 The threshold in numbers.** The seed holds 0 user-created rows (`seeded = false`); at most 25 exist at once (4.1; creating and deleting can repeat); the row threshold is 2,000 (`RESET_ROW_THRESHOLD`) and the byte threshold 50 MB (`RESET_BYTES_THRESHOLD`, 52,428,800). Both are positive integers read from the environment (`positiveInt` throws on anything else).

**4.4 Boundaries.** The input-to-code pairs of 2.7 are the boundaries of an amount, a pot name and an enum. A body that is absent, not JSON or not an object is 400 with `[{ path: [], code: "invalid_format" }]` (as `/api/admin/reset`); `{}` is `required` on each missing field. A `DELETE` or a `POST …/deposit` of an id that is not a UUID is 400 `invalid_format` on `id`
(`z.uuid().max(36)`), not a 404.

## 5. Data

Written: `Budget` (`category`, `maximum`, `theme`), `Pot` (`name`, `target`, `total`, `theme`), `Balance.current` (pot movements and pot deletion only); `ResetLog` by a threshold reset. New: the write-limiter table of 2.10 (`ip`, `at`), pruned by the check, in `RESET_TABLES`; a migration and a new entity in `data-model.md` (§9 Q9), a build task.
The source of truth for every value is the database; `data.json` is only the seed (US-36 AC2). Money is `BigInt` in the database and `Number` in every body and DTO (`reset-and-test-support.md` §5).

## 6. Interfaces

### UI
No component of its own. A page shows the rows of §3 in its modal or its list; the focus, `aria-describedby` and keyboard rules are US-31/US-32's and the page specs'.

### API
The routes of 2.1, the order of 2.2, the answers of 2.6. The proxy's write predicate: method not `GET`, `HEAD` or `OPTIONS`, path under `/api/`, not on the exempt list of 2.3 (a list in `proxy.ts`, tested); it matches a method of any letter case, since `fetch` does not upper-case `patch`.
A write handler is `guardedWrite(request, { schema, run })` (a build task's name): it applies 2.10, reads and validates the body (none for `DELETE`), runs `run` in one transaction, applies 2.9 and builds the answer with 2.2 step 10's headers.

### WebMCP tools
The tool tables are the page specs'. Common to all of them: 2.11. Mutating tools of Release 2: `add_budget`, `edit_budget`, `delete_budget`, `add_pot`, `edit_pot`, `delete_pot`, `add_money_to_pot`, `withdraw_from_pot` (US-40, `webmcp-tools.md` §4); every one takes the record `id` (R-26), as `z.uuid().max(36)`.

| Tool kind | `consequentialHint` | `untrustedContentHint` | Safety rule |
|---|---|---|---|
| add / edit / money movement | true | true when the output holds user-entered text (2.11 (1)) | validation twice; same routes; `X-Via` |
| delete | true | no (returns `{ deleted: true }`) | dialog first; `cancelled`, `busy`, `not_found` before any request |

## 7. Tests required

Tests that lower a limit do it by filling the database, not by changing a running server's environment: 2,001 non-seed rows (as `tests/api/threshold.spec.ts` does) for the threshold, and `WriteAttempt` rows up to the limit for the rate limit; the API and E2E suites run with the limit raised (2.10). A test that depends on an open question of §9 is written for the recommended answer and changes with it.

| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| 7.1 Unit | the mapper: every input→code pair of 2.7, failing first (today `1.5`, `"100"` and `0` give `required`, an over-maximum gives `too_long`, an unknown enum value throws), and the auth schemas' mapping **unchanged**; the schemas' bounds; a pot name of `<script>alert(1)</script>` is stored and returned unchanged as text; the pure rate-limit evaluation (the window edge, `retryAfter`); the write client sets the JSON content type and `X-Via` and reads a 204; the registry asserts `consequentialHint` and `untrustedContentHint` on every mutating tool | 2.6, 2.7, 2.10, 2.11, 4.4 |
| 7.2 API (real database) | conservation after a sequence of deposits, withdrawals and a pot deletion = 575,600 cents; **a deposit and a delete of the same pot at the same time conserve the sum**; two concurrent deposits that together exceed the balance: one succeeds, one is `exceeds_balance`; an id from before a reset is 404; a unique-constraint violation maps to `taken`; every `GET` route leaves the stored rows unchanged; the threshold at a pre-filled database: the write commits, the answer is 409, `ResetLog` has a `threshold` row, the next request is 401; a throwing check does not fail the write | 2.8, 2.9, 4.2 · US-36, US-37 AC1, AC3 |
| 7.3 API (refusals) — failing first, each shown red before the check exists | for **every** write route: `Sec-Fetch-Site` of `cross-site` → 403 and no `Set-Cookie`, nothing written; `same-origin`, `same-site`, `none` and absent → not 403; unauthenticated + cross-site → 401; `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain; x=application/json`, `application/jsonx` and (on `POST`, `PUT` and `PATCH`) no content type → 415, nothing written; `application/json`, `Application/JSON` and `application/json; charset=utf-8` pass; a bodiless `DELETE` passes and a `DELETE` declaring `text/plain` is 415; a lower-case method is refused the same way; the 429 with `Retry-After` and `retryAfter`, the window's end, the limiter pruned and emptied by a reset, `/api/test/*` and `/api/admin/reset` not limited; **every refusal carries `Cache-Control: no-store`, `X-Request-Id`** and the security headers (`proxy.spec.ts`'s matrix) and the refusal log line of 2.12 | 2.2–2.4, 2.10, 2.12 · NFR-S2, S4, S6 |
| 7.4 Route-table guard (unit) | a test reads `app/api/**/route.ts`: every exported non-`GET` handler is either under the proxy's write predicate or on the exempt list, every write handler goes through `guardedWrite`, and **no `GET` handler calls `guardedWrite`**; a path may export `GET` beside its write methods; `GET /api/admin/reset` is named as the one exception; a fixture route violating each rule fails it | 2.1, 2.3, 2.5 |
| 7.5 E2E | a write is on the page after a reload and in a second tab (US-36 AC1); the failure rows of §3 as the user meets them, per page spec (a record deleted in another tab, a rate-limited burst with the limit lowered for that project, a threshold reset → the login page with the reset message) | §3 · US-31, US-36 AC1, US-37 AC3 |
| 7.6 WebMCP | each mutating tool in polyfill and off modes writes through the same route and is on record with `method`; a tool given an invalid input, and one that gets a server 400, returns `validation` with `issues` and does not throw (US-40 AC1); `untrustedContentHint` as 2.11; a tool refused with 403 returns `forbidden`, not `server_error` (if Q1 is (a)) | 2.11, 2.12 · US-40 AC1, AC3 |

## 8. Out of scope

Idempotency keys and double-submit protection (the UI disables the submit control while a request is pending; a tool that sends the same deposit twice deposits twice, as a person who clicks twice would not); optimistic locking with `updatedAt` (2.8); an `Origin` check beside `Sec-Fetch-Site` (the owner chose the logout check);
a request-body size limit (the platform's); a write route for transactions; the page specs' fields, DTOs and screens; the build tasks' names (`guardedWrite`, `apiSend`, `WriteAttempt`) are working names.

## 9. Open questions

Each is answered with its letter; "a" is my recommendation in every case, so **"all (a)" answers all nine**. The spec is not Approved while this section is non-empty. A word first: an *envelope* is the JSON shape every API error uses, so the client and the tools read all errors one way.

**Q1 — What body does a 403 carry?** *What:* `ErrorEnvelope` (`auth.md` §2.10, `src/shared/schemas.ts`) lists seven error codes and none is "forbidden"; logout's existing 403 answers `{ message }` outside the envelope. *Why it matters:* it amends an Approved spec and the shared schema; the alternative leaves two error shapes in the API.
- (a) **Add the code `forbidden` and move logout's 403 body onto the envelope; the tools map a 403 to `forbidden` — recommended.**
- (b) Keep `{ "message": "This request must be same-origin" }` for every 403; no new error code.

**Q2 — Which validation codes does the API send for amounts, balances and duplicate names?** *What:* the API sends codes and the client turns each into a message (the 2026-09-23 rule); there are four codes (`required`, `invalid_format`, `too_short`, `too_long`) and the Release 2 rules need distinct messages ("Amount must be greater than 0" is not "Amount is too large"). *Why it matters:* it amends `auth.md` §2.10.
- (a) **Add `too_small`, `too_large`, `exceeds_balance`, `exceeds_total` and `taken` (2.7) — recommended.**
- (b) Add no code; the API answers each business rule as 409 `conflict` with a fixed `message` per rule (the API would then carry copy, against the 2026-09-23 rule, and 409 would mean two things).

**Q3 — Is the stale-write rule "the record is gone" instead of an `updatedAt` check?** *What:* ADR-0005's Consistency line says "a lightweight optimistic check (`updatedAt`) returns 409 on stale writes". 2.8 replaces it: conditional updates make money moves safe, an old id is a 404, an edit is last-write-wins, and 409 is only for the threshold reset.
*Why it matters:* it clarifies an Accepted ADR. A search on 2026-10-04 (`grep -rn "updatedAt\|optimistic\|stale" docs/02-architecture docs/03-specs docs/01-requirements`) finds ADR-0005 line 34, `release-2-handoffs.md` H6, `reset-and-test-support.md` line 83, `data-model.md` line 5 (a list of entity fields, which stays true) and the copy appendix's "After reset | stale request" and "Stale write after reset (R2)" rows (which stay true for the 409).
- (a) **2.8 as written; the clarification goes into ADR-0005 in this pull request — recommended.**
- (b) Keep `updatedAt` on edits and money moves; a mismatch is 409 and the page tells the user the item changed.

**Q4 — How many writes a minute?** *What:* NFR-S4 says "write endpoints rate-limited" and gives no figure. *Why it matters:* too low blocks a legitimate burst (an agent filling the demo takes 25 writes); too high is no limit.
- (a) **30 per 60 seconds per IP, overridable by environment — recommended.**
- (b) 10 per 60 seconds (an agent creating budgets in a loop would meet it).
- (c) 120 per 60 seconds.

**Q5 — Approve the new copy?** *What:* the copy appendix (`user-stories.md`) is the owner-approved source of every message and has an "R1 additions" table only; this adds an "R2 additions" table with four strings: "This budget no longer exists", "This pot no longer exists" (US-17 AC3 and US-24 AC2 say "a message says so" with no text), "Too many changes. Try again in {N} seconds" and
"Already used" (today only a label in US-15 AC1, for a category or theme taken in a race). *Why it matters:* `COPY` mirrors the appendix and a unit test holds them equal.
- (a) **Add the four rows as worded — recommended.**
- (b) Give me other wording.

**Q6 — Is this the right reading of US-37 AC3?** *What:* 2.9: after a reset every session is dead, so only the request that *causes* a threshold reset gets the 409 and "Data was reset — reloading"; a later request is a 401 and the login page says "The demo data was reset — please log in again"; a record deleted in another tab is a 404 with its own message, which departs from AC3's wording and from ADR-0005's "…'Data was reset — reloading' when the record is gone". *Why it matters:* it decides how AC3 is tested.
- (a) **Yes, that reading — recommended.**
- (b) A record gone (404) also shows "Data was reset — reloading" and reloads (AC3 as worded, ADR-0005 as written; the message would be wrong for a record deleted in another tab).

**Q7 — What form does the threshold check take?** *What:* in Release 2 its row trigger cannot fire (25 user rows against 2,000); only database growth can trip the bytes trigger; today the check is four queries. *Why it matters:* dropping the per-write check amends US-37 AC1 and ADR-0005.
- (a) **Keep it on every write, as one query instead of four (a "round trip" is one request to the database; this still adds one to every write) — recommended.**
- (b) Check on every tenth write (the guard fires later, by at most nine writes).
- (c) Drop the per-write check and rely on the daily cron's interval reset; amends US-37 AC1 and ADR-0005.

**Q8 — Which routes are exempt from your cross-site and content-type rules?** *What:* your rule says "every non-GET `/api/*` route that changes data". 2.3 exempts `POST /api/auth/login` and `/signup` (before any session; login writes only its own attempt row and a cookie), `/api/auth/logout` (own rule), `POST /api/admin/reset` (bearer secret, called without browser fetch metadata) and `/api/test/*` (test env only).
*Why it matters:* it narrows an owner decision.
- (a) **Exactly that list — recommended.**
- (b) As (a), but login and signup are held to the content-type rule too (the app's client already sends JSON; a form-post login is refused 415; the cross-site rule stays off for them). This changes two Approved auth behaviours.
- (c) Tell me another list.

**Q9 — Approve the changes this spec makes to other Approved documents?** *What:* (1) the via-log entry gains `method` — `webmcp-tools.md` §2.8 and the `GET /api/test/log` answer in `reset-and-test-support.md` §2.7; (2) a `WriteAttempt` table — a new entity in `data-model.md`; (3) the threshold is called by the write wrapper, not "by repositories" — `reset-and-test-support.md` §2.4;
(4) the tool error codes gain `forbidden` (Q1 (a)) and `busy` — `webmcp-tools.md` §2.5 and `src/webmcp/tool-result.ts`; (5) a 403, 415 and 429 are new answers of the API — `auth.md` §2.10 for the envelope; (6) the proxy sets `Cache-Control: no-store` on its own answers. Each is applied in the spec that owns the document (`webmcp-tools.md` §4 in S6, the rest in the page specs' pull requests or the build tasks).
*Why it matters:* an Approved document changes only when you approve it.
- (a) **Approve all six — recommended.**
- (b) Tell me which not.

---

Changelog: v0.2 (2026-10-04) — after two read-only reviews (briefs and reports in `docs/04-process/prompts/2026-10-04-T-15d/`): the `GET` rule corrected (a path may export `GET` beside write methods; `GET /api/admin/reset` the one exception); the issue mapper specified with exact input→code pairs; a pot deletion reads its total from the delete; the content-type rule made exact; the 401 client behaviour, the 404 departure from AC3, the proxy's logging and `Set-Cookie` re-issue, the missing-`no-store` helpers and the copy string "Already used" stated; the exemptions, amendments and copy put to the owner; Q1 and Q5 split into single-choice questions; tests made conditional on the answers and not dependent on a running server's environment; wrong or loose citations fixed. v0.1 (2026-10-04) — first draft. v0.2.1 (2026-10-04) — Copilot's review of v0.2: 7.3's 415 case names `PUT` and `PATCH`, the constraints list names each NFR in full, the owner question's shorthand is English. v0.2.2 (2026-10-04) — Copilot's second review: 2.2 step 10 states the real `no-store` baseline (pages only in the proxy; `/api/overview` and `/api/meta` on success), 2.6 says the 403 body depends on Q1. v0.2.3 (2026-10-04) — Copilot's third review: 2.2 step 3 and 2.6's 403 row depend on Q1 too.
