# SPEC-write-path — the rules every writing endpoint and tool shares

Status: **Draft** (v0.1, 2026-10-04) — the owner's answers to §9 are pending; the PR stays a draft until they are in ·
Author(s): Agent (Claude Code, Sonnet 5.5, background session) · Date: 2026-10-04
Implements: US-36 (AC1 persistence), US-37 (AC1's threshold, AC3), US-40 (the shared parts of AC1 and AC3), the server side of
US-31 · Constrained by: ADR-0001, ADR-0004, ADR-0005, ADR-0006, NFR-S2, S3, S4, S6, S7, W3–W6, Q2 · Resolves hand-offs H1 (the limits),
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
list of 2.3. The planned set (`data-model.md` §API surface), each defined in its page spec:

| Method and path | Page spec | Does |
|---|---|---|
| `POST /api/budgets` · `PATCH /api/budgets/:id` · `DELETE /api/budgets/:id` | `budgets.md` | create · edit · delete a budget |
| `POST /api/pots` · `PATCH /api/pots/:id` · `DELETE /api/pots/:id` | `pots.md` | create · edit · delete a pot (deleting adds its total back to the balance) |
| `POST /api/pots/:id/deposit` · `POST /api/pots/:id/withdraw` | `pots.md` | move money between the balance and a pot |

Transactions have no write route: they are read-only in this product (`data-model.md`). **A write route never answers `GET`**, and a
`GET` never changes data — `SameSite=Lax` (ADR-0006) protects a write only while that holds, so 7.4 tests it.

**2.2 The order of work for one write request.** Each step either ends the request with the answer shown or passes it on.

1. `proxy.ts`: the `X-Via` marker is recorded (`recordViaRequest`, any method, before any check, so a refused request is on record too).
2. `proxy.ts`: no valid session → **401** `unauthenticated` (existing; it comes first, so an unauthenticated caller learns nothing else).
3. `proxy.ts`: the cross-site rule (2.3) → **403** `forbidden`.
4. `proxy.ts`: the content-type rule (2.4) → **415**.
5. The handler, through one shared wrapper (`src/server/write.ts`, a build task's name): the rate limit (2.10) → **429** `rate_limited`.
6. The wrapper reads the body as JSON and validates it with the shared schema (2.7) → **400** `validation`.
7. One database transaction applies the change (2.8); a missing record → **404** `not_found`; a broken business rule → **400** `validation`.
8. After the commit the threshold check runs (2.9); when exceeded the demo resets and the answer is **409** `conflict`.
9. Otherwise **201** (create, with the record), **200** (edit, deposit, withdraw, with what the page spec names) or **204** (delete).
10. Every answer, including the refusals of steps 2–4, carries `X-Request-Id` and `Cache-Control: no-store`. The routes set `no-store`
    themselves (`app/api/overview/route.ts`); the proxy does not set it for any `/api/*` response today, so the proxy's own 401, 403 and
    415 must (a build task; 7.3 tests every refusal).

**2.3 The cross-site rule** (owner decision, 2026-10-04, T-15d plan gate — taken, not reopened). Every write route refuses a request
whose `Sec-Fetch-Site` header is exactly `cross-site`: status **403**, body 2.6, no `Set-Cookie`, nothing written. Exactly the
`POST /api/auth/logout` precedent (`proxy.ts`, TD-15): `same-origin`, `same-site`, `none` and an **absent** header pass — an old client
that sends no fetch metadata is defended by `SameSite=Lax`, as before. *Exempt from this rule*, and why: `POST /api/auth/login` and
`POST /api/auth/signup` (they run before a session exists and change no user data; the demo credentials are public), `POST /api/auth/logout`
(its own rule, same outcome), `POST /api/admin/reset` (a bearer secret, called by cron and the operator, which send no fetch metadata)
and `/api/test/*` (exists only with `APP_ENV=test`, no session). The exempt list is the *only* list: a new route is a write route
until a spec says otherwise (7.4 guards it).

**2.4 The content-type rule** (owner decision, 2026-10-04). A write request that *has a body* must declare `Content-Type: application/json`
(parameters such as `; charset=utf-8` are allowed); otherwise **415**, body 2.6, nothing written. "Has a body" means a `Content-Length` greater
than 0 or a `Transfer-Encoding` header, so a bodiless `DELETE` passes and a body with no `Content-Type` is refused. The refused types include
the three a plain HTML form can send cross-site — `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data`. The exempt list is
2.3's.

**2.5 Where the two checks live — settled.** In `proxy.ts`, for every `/api/*` path, because the proxy already runs before every
handler, can see headers only, and cannot be forgotten by a new route; a per-route check is one forgotten line from no check (the
route-table guard of 7.4 would then be the only net). The rate limit, the validation and the threshold stay in the shared wrapper: they
need the database and the parsed body. The proxy's `needsSession` has no method term today; the new branch keys on the method and the
exempt list, after the 401 branch.

**2.6 Answers.** All use `ErrorEnvelope` (`auth.md` §2.10, `src/shared/schemas.ts`); `message` is a fixed string, `validation` carries
`issues` and no `message`, and no answer echoes the input.

| Status | `error` | When | Body beyond `error` |
|---|---|---|---|
| 400 | `validation` | the body is not JSON, or fails the schema, or breaks a business rule (2.7) | `issues: { path, code }[]` |
| 401 | `unauthenticated` | no valid session, including after a reset (2.9) | `message: "Log in to continue"` (existing) |
| 403 | `forbidden` | 2.3 | `message: "This request must be same-origin"` |
| 404 | `not_found` | the record in the path does not exist (anymore) | `message` |
| 409 | `conflict` | the write triggered the threshold reset (2.9) | `message: "Data was reset"` |
| 415 | `validation` | 2.4 | `issues: [{ path: [], code: "invalid_format" }]` — the shape `/api/admin/reset` already uses for a body that is not JSON |
| 429 | `rate_limited` | 2.10 | `message`, `retryAfter` (seconds) and a `Retry-After` header |
| 500 | `server_error` | anything unexpected (logged with the request id) | `message` |

`forbidden` is not in `ErrorEnvelope` today: `auth.md` §2.10 lists seven codes and logout's 403 answers `{ message }` outside the envelope
(`proxy.ts` 141–149). Adding the code, and moving logout's 403 body onto the envelope, is an amendment to an Approved spec: **§9, Q1**.
If the owner declines it, 403 keeps logout's body `{ "message": "This request must be same-origin" }` and nothing else in this spec changes.

**2.7 Validation.** One Zod schema per request body in `src/shared/schemas.ts`, used by the form, the route and the tool (NFR-Q2, S3);
the server validates again whatever the client did. A request schema is strict about types and strips unknown keys (as the existing
request schemas do). Money travels as **integer cents** in every body; the client turns the typed text (`$1,234.50`, with its optional
leading `$` and thousands separators) into cents before sending, and the typed-text messages ("Enter an amount with up to two decimals")
are the client's. An id is `z.uuid().max(36)` — the `.max` is what `toolInputJsonSchema` needs to give a tool a `maxLength` (it throws
without one); no `.max(36)` exists in the code yet.

The `issues` vocabulary today is four codes (`required`, `invalid_format`, `too_short`, `too_long`), and `toErrorIssues` **throws** on
any other Zod code — a category or theme that is not in its enum is `invalid_value`, so the first route to use `z.enum` would answer 500.
Whatever Q1 decides, `toErrorIssues` must map `invalid_value` to `invalid_format` (a build task with a failing-first test). The
Release 2 rules need more than four codes; the proposal, with the copy each maps to (existing strings are in `COPY`):

| Code (proposed new in bold) | On field | Meaning | Copy |
|---|---|---|---|
| `required` | any | missing or empty after trim | Can't be empty |
| `invalid_format` | an amount | not a whole number of cents; any field: wrong type or not in its enum | Enter an amount with up to two decimals |
| **`too_small`** | an amount | less than 1 cent | Amount must be greater than 0 |
| **`too_large`** | an amount | more than 99,999,999,999 cents | Amount is too large |
| `too_long` | a pot name | more than 30 characters | Maximum 30 characters |
| **`exceeds_balance`** | a deposit | more than the balance | Amount exceeds your current balance |
| **`exceeds_total`** | a withdrawal | more than the pot's total | Amount exceeds this pot's total |
| **`taken`** | a pot `name` | same name, case-insensitive after trim | A pot with this name already exists |
| **`taken`** | a `category` or `theme` | already used by another budget (category, theme) or pot (theme) | Already used |

A business rule that is true or false of the stored data at the moment of the write (`exceeds_*`, `taken`) is a **400 `validation`**, not a
409: it names a field the user can fix. The path is the JSON property name. A pot name is trimmed and counted in UTF-16 code units (JS
`.length`), which is what the live "N characters left" counter counts. Order of checks inside one request: shape first, then the rules that
need the database, so a malformed body never costs a query.

**2.8 Consistency** *(clarifies ADR-0005's "Consistency" line — §9, Q2).* A write is one database transaction. The rules that read stored
data are *conditional updates*, so two requests racing cannot both succeed: a deposit is `UPDATE Balance SET current = current − x WHERE current ≥ x`
together with `UPDATE Pot SET total = total + x WHERE id = …` — zero rows updated on either means the whole transaction is rolled back and the
answer is `exceeds_balance` (re-read to tell it from a missing pot, which is 404). A withdrawal is the mirror, `WHERE total ≥ x`. Deleting a pot
adds its `total` to `Balance.current` in the same transaction. Budgets never touch the balance (US-04 AC3). The unique constraints already in the
schema (`Budget.category`, `Budget.theme`, `Pot.name` case-insensitive, `Pot.theme`) are the last line of defence for `taken`: a violation caught
from the database maps to the same 400. **Money is conserved**: `Balance.current + Σ Pot.total` is unchanged by a deposit, a withdrawal and
a pot deletion (4.2) — which also bounds every sum below `Number.MAX_SAFE_INTEGER` (`reset-and-test-support.md` §5), so no new overflow rule is needed.
Ids are database-generated and **change on every reset** (`resetToSeed` inserts without ids), so an id from before a reset never names a record
after it: a stale `PATCH` or `DELETE` is a 404, it cannot edit the re-seeded data by accident. The request carries no `updatedAt`; an edit is
last-write-wins, which is safe for one shared demo account whose only invariant (conservation) is held by the conditional updates.

**2.9 The storage threshold and reset** (resolves H2; US-37 AC1). After the transaction commits, the wrapper calls `checkThreshold`
(`src/server/threshold.ts`, no call site today). When it reports `exceeded`, the wrapper calls `resetToSeed(db, "threshold")` and answers **409**
`conflict` `{ message: "Data was reset" }` — the write the user just made is wiped with the rest, which is what "reset immediately" means
(`reset-and-test-support.md` §2.4). The client shows `COPY.dataWasReset` ("Data was reset — reloading") and reloads. **What happens next is
not "a 409 again":** the reset writes a new `ResetLog` row, every session is older than it, so the next request of this or any other tab is a 401 and the
proxy sends a page to `/login?reason=reset` ("The demo data was reset — please log in again"). So US-37 AC3's "409/404, the UI shows 'Data was reset' and reloads"
is reached by **the request that causes a threshold reset** (409) and by a request for a record that is gone without a reset (404, 3); every later request meets
401. §9, Q5 asks the owner to confirm that reading.

The check as written costs four queries (three counts of rows with `seeded = false`, and `pg_database_size`) and, in Release 2, **its row trigger cannot
fire**: user-created rows are budgets and pots only (`Transaction` has no write route), at most 10 budgets (one per category) and 15 pots (one per theme) — 25
against a threshold of 2,000. Only the byte trigger can, through database growth (the login and write-limiter tables, 2.10). The spec keeps the
per-write check because US-37 AC1 and ADR-0005 require it, asks that it run as **one round trip** instead of four (H2's "cheaper" option), and offers the
alternatives in §9, Q5. A tool call is a write like any other and is checked the same way.

**2.10 The rate limit** (resolves H5; NFR-S4). A write route, through the wrapper, counts the request against a key before it does anything else. The key is
the **client IP** (the first `x-forwarded-for` entry, as the login limiter reads it; on Vercel the platform sets it, TD-17), not the session: the demo
credentials are public, so a fresh session is free. The limit is **N writes per window**, N and the window set in §9, Q3 (recommended: 30 per 60 s), both
overridable by environment (`WRITE_RATE_LIMIT_MAX`, `WRITE_RATE_LIMIT_WINDOW_SECONDS`) so the API and E2E suites — every test comes from one IP — are run with a limit
they cannot reach, and the limiter itself is tested against the database directly. Over the limit: **429** 2.6, nothing written. State is in the database
(ADR-0001: no in-memory state on serverless), in a table of its own (`WriteAttempt`, a build task's name — `LoginAttempt` is for failed logins), which is pruned by
the check itself (rows older than the window are deleted when it runs — TD-18's lesson) and is added to `RESET_TABLES`, so a reset empties it. Refused requests of 2.3 and 2.4
are not counted (they write nothing); `/api/test/*` and `/api/admin/reset` are not rate-limited (`reset-and-test-support.md` §2.7).

**2.11 Agent tools** (US-40, ADR-0004, NFR-W3–W6). Every mutating tool goes through the same routes and the same pipeline as the UI, never around them.
(1) `consequentialHint: true` on all of them, **and `untrustedContentHint: true` on every mutating tool that returns user-entered text** (`add_pot` and
`edit_pot` return a pot name; NFR-S7 treats tool output as untrusted), which US-39 AC3 states for the read tools only — a clarification, my decision
under NFR-S7. (2) The client sends `X-Via: webmcp` on every write, so the request is on record (US-40 AC3); today only `apiGet` exists and sends it, so a
write client helper is needed (`apiSend`, a build task's name) that always sets `Content-Type: application/json` when there is a body. (3) A tool validates its input with the
same schema and returns the server's `validation` answer with its `issues`; it never throws (NFR-W6). (4) The error codes map from the HTTP status: 400 `validation`, 401 `unauthenticated`,
404 `not_found`, 409 `conflict`, 429 `rate_limited`, abort `cancelled`, **403 `forbidden`** (new with Q1 (a); today `webmcp-tools.md` §2.5 sends a 403 to `server_error`, which stays if Q1 is (b)), other `server_error`.
(5) `delete_budget` and `delete_pot` send `DELETE` only after the user confirms in the on-screen dialog (R-16, ADR-0004) — the server sees an ordinary delete, so 2.3 is
the only server-side guard against a cross-site delete. (6) The registry unit test asserts `consequentialHint` (the polyfill's `getTools()` drops it, H3) and the page spec says how.

**2.12 Logging.** An `X-Via: webmcp` request is logged as `{ requestId, via, route }`. A write and a read on the same path are indistinguishable in it; the entry gains
`method` (`POST`, `PATCH`, `DELETE`, `GET`), so US-40 AC3's "a mutating tool call appears in the log with a via-tool marker" is testable per method. The refused requests of 2.3–2.4
are logged by the proxy like any other (one line, with the request id and the status; the body is never logged).

## 3. States

What the user sees when a write does not succeed; `COPY` strings exist unless marked *proposed* (§9, Q4).

| State | Trigger | What the user sees | Exit |
|---|---|---|---|
| Pending | request sent | the submit control is disabled and says it is working; the form stays | any answer below |
| Success | 201 / 200 / 204 | the page shows the new state with no reload (US-15 AC3, US-16 AC2, US-17 AC2…); the modal closes and focus returns to its trigger | — |
| Validation error | 400 | each `issues` entry becomes the message under its field (2.7's table), the first invalid field is focused (US-31 AC2) | the user fixes the field |
| Record gone | 404 | a message that the budget/pot no longer exists (*proposed*: "This budget no longer exists", "This pot no longer exists"), the modal closes, the list refreshes (US-17 AC3, US-24 AC2) | the refreshed list |
| Data was reset | 409 | "Data was reset — reloading", then a reload, which lands on the login page with "The demo data was reset — please log in again" | log in again |
| Session ended | 401 | the proxy's redirect to `/login` (with `reason=reset` after a reset) | log in again |
| Rate limited | 429 | *proposed*: "Too many changes. Try again in {N} seconds" (`{N}` from `retryAfter`; 1 is "1 second"); nothing changes | wait, retry |
| Refused | 403, 415 | "Something went wrong. Try again" — the app's own client never sends either, so this is a bug or an attack, not a user path | — |
| Server error | 500 | "Something went wrong. Try again" (existing) | retry |
| Network error | no response | "Can't reach the server. Check your connection and try again" (existing) | retry |

Empty state and loading are the page's (`budgets.md`, `pots.md`); a write route has neither.

## 4. Rules and boundaries

**4.1 Limits.** An amount: an integer, `1 ≤ cents ≤ 99,999,999,999` (NFR-S3; US-15 AC2's "0.01 ≤ x ≤ 999,999,999.99"). A pot name: 1–30 characters after trim; a budget has no name.
At most 10 budgets (one per category) and 15 pots (one per theme); a budget's theme is unique among budgets, a pot's among pots (so a pot and a budget may share a theme).
A category and a theme come from their enums (10 and 15 values, `src/shared/enums.ts`).

**4.2 Conservation, with the seed** (`npm run seed:figures`, `prisma/data.json`; read 2026-10-04): the balance is `$4,836.00` (483,600 cents) and the five pots
hold `$920.00` (92,000 cents: Savings 15,900, Concert Ticket 11,000, Gift 11,000, New Laptop 1,000, Holiday 53,100), so **`Balance.current + Σ Pot.total` = 575,600 cents**
in the seed. Three writes in a row on the seed, the sum checked after each: deposit `$100.00` into Savings (balance `$4,736.00`, Savings `$259.00`, pots `$1,020.00`, sum `$5,756.00`); withdraw `$30.00` from Concert Ticket (`$110.00` → `$80.00`; balance `$4,766.00`, pots `$990.00`, sum `$5,756.00`); delete New Laptop (`$10.00`; balance `$4,776.00`, pots `$980.00`, sum `$5,756.00`). The sum is the same each time, in cents 575,600; an API test asserts it after such a sequence (7.2). A deposit of `$4,836.01` is `exceeds_balance`; a deposit of `$4,836.00` is allowed and leaves the balance at `$0.00`, after which any deposit is `exceeds_balance`
(US-25 AC2).

**4.3 The threshold in numbers.** The seed holds 0 user-created rows (`seeded = false`); the most a user can create is 25 (4.1); the row threshold is 2,000 (`RESET_ROW_THRESHOLD`) and the byte
threshold 50 MB (`RESET_BYTES_THRESHOLD`, 52,428,800). Both are positive integers read from the environment (`positiveInt` throws on anything else).

**4.4 Boundaries.** An amount of exactly 99,999,999,999 is accepted and one more is `too_large`; 0 and a negative amount are `too_small`; `1.5` or `"100"` is `invalid_format`. A name of exactly 30 characters is
accepted, 31 is `too_long`; a name of only spaces is `required`. An empty body where one is needed is `required` on each missing field, a body that is not JSON is 400 with the root path.

## 5. Data

Written: `Budget` (`category`, `maximum`, `theme`), `Pot` (`name`, `target`, `total`, `theme`), `Balance.current` (pot movements and pot deletion only); `ResetLog` by a threshold reset. New:
the write-limiter table of 2.10 (`ip`, `at`), pruned by the check, in `RESET_TABLES`; a migration, a build task. The source of truth for every value is the database; `data.json` is only the seed
(US-36 AC2). Money is `BigInt` in the database and `Number` in every body and DTO (`reset-and-test-support.md` §5).

## 6. Interfaces

### UI
No component of its own. A page shows the rows of §3 in its modal or its list; the focus, `aria-describedby` and keyboard rules are US-31/US-32's and the page specs'.

### API
The routes of 2.1, the order of 2.2, the answers of 2.6. The proxy's write predicate: method not in `GET`, `HEAD`, `OPTIONS`, path under `/api/`, not on the exempt list of 2.3 (a list in `proxy.ts`, tested). A write handler is
`guardedWrite(request, { schema, run })` (a build task's name): it applies 2.10, reads and validates the body, runs `run` in one transaction, applies 2.9 and builds the answer.

### WebMCP tools
The tool tables are the page specs'. Common to all of them: 2.11. Mutating tools of Release 2: `add_budget`, `edit_budget`, `delete_budget`, `add_pot`, `edit_pot`, `delete_pot`,
`add_money_to_pot`, `withdraw_from_pot` (US-40, `webmcp-tools.md` §4); every one takes the record `id` (R-26), as `z.uuid().max(36)`.

| Tool kind | `consequentialHint` | `untrustedContentHint` | Safety rule |
|---|---|---|---|
| add / edit / money movement | true | true when the output holds a pot name | validation twice; same routes; `X-Via` |
| delete | true | no (returns `{ deleted: true }`) | dialog first; `cancelled`, `busy`, `not_found` before any request |

## 7. Tests required

| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| 7.1 Unit | the issue mapping: every new code, and `invalid_value` → `invalid_format` (failing first: today it throws); the schemas' bounds at 99,999,999,999 / 1 / 0 and a 30- and 31-character name; the pure rate-limit evaluation (the 31st in the window, the window edge, `retryAfter`); the write client sets the JSON content type and `X-Via`; the registry asserts `consequentialHint` and `untrustedContentHint` on every mutating tool | 2.6, 2.7, 2.10, 2.11, 4.1, 4.4 |
| 7.2 API (real database) | conservation after a sequence of deposits, withdrawals and a pot deletion = 575,600 cents; two concurrent deposits that together exceed the balance: one succeeds, one is `exceeds_balance`; an id from before a reset is 404; a unique-constraint violation maps to `taken`; the threshold at a low limit: the write commits, the answer is 409, `ResetLog` has a `threshold` row, the next request is 401; one round trip for the check | 2.8, 2.9, 4.2 · US-36, US-37 AC1, AC3 |
| 7.3 API (refusals) — failing first, each shown red before the check exists | for **every** write route: `Sec-Fetch-Site` of `cross-site` → 403 and no `Set-Cookie`, nothing written; `same-origin`, `same-site`, `none` and absent → not 403; unauthenticated + cross-site → 401; a body with `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data` or no content type → 415, nothing written; `application/json; charset=utf-8` passes; a bodiless `DELETE` passes; the 429 with `Retry-After` and `retryAfter`, the window's end, the limiter pruned and emptied by a reset, `/api/test/*` and `/api/admin/reset` not limited; **every refusal carries `Cache-Control: no-store`, `X-Request-Id`** and the security headers (`proxy.spec.ts`'s matrix) | 2.2–2.4, 2.10, 2.2 step 10 · NFR-S2, S4, S6 |
| 7.4 Route-table guard (unit) | a test reads `app/api/**/route.ts`: every exported non-`GET` handler is either under the proxy's write predicate or on the exempt list, **no write path exports `GET`**, and every write handler goes through `guardedWrite`; a fixture route that violates each fails it | 2.1, 2.3, 2.5 |
| 7.5 E2E | the failure rows of §3 as the user meets them, per page spec (a record deleted in another tab, a rate-limited burst with the limit lowered for that project, a threshold reset → the login page with the reset message) | §3 · US-31, US-37 AC3 |
| 7.6 WebMCP | each mutating tool in polyfill and off modes writes through the same route and is on record with `method`; `untrustedContentHint` as 2.11; a tool refused with 403 returns `forbidden`, not `server_error` | 2.11, 2.12 · US-40 AC3 |

## 8. Out of scope

Idempotency keys and double-submit protection (the UI disables the submit control while a request is pending; a tool that sends the same deposit twice deposits twice, as a person who clicks twice
would not); optimistic locking with `updatedAt` (2.8); an `Origin` check beside `Sec-Fetch-Site` (the owner chose the logout check); login and signup CSRF (2.3); a request-body size limit (the platform's);
a write route for transactions; the page specs' fields, DTOs and screens.

## 9. Open questions

Each is answered with its letter; "a" is my recommendation in every case. The spec is not Approved while this section is non-empty.

**Q1 — Does the API get a `forbidden` code and five more validation codes?** *What:* `ErrorEnvelope` (`auth.md` §2.10, `src/shared/schemas.ts`) lists seven error codes and four validation-issue codes; "an *envelope*"
is the JSON shape every API error uses, so the client and the tools read all errors one way. Your cross-site rule needs a 403 body, and amounts, balances and duplicate names need distinct messages.
*Why it matters:* it amends an Approved spec and the shared schema; the alternative leaves two error shapes in the API.
- (a) **Add `forbidden` (403) and the issue codes `too_small`, `too_large`, `exceeds_balance`, `exceeds_total`, `taken` (2.7); move logout's 403 onto the envelope; a 415 is a `validation` answer — recommended.**
- (b) Keep logout's `{ message }` body for every 403 and add no error code; the new validation codes still need adding, or each rule gets its own message string instead (the API would then carry copy, which the 2026-09-23 rule keeps in the client).

**Q2 — Is the stale-write rule "the record is gone" instead of an `updatedAt` check?** *What:* ADR-0005's Consistency line says "a lightweight optimistic check (`updatedAt`) returns 409 on stale writes". 2.8 replaces it: conditional updates make money moves safe, ids change on every reset so an old id is a 404, an edit is last-write-wins,
and 409 is only for the threshold reset. *Why it matters:* it clarifies an Accepted ADR (once you answer, the clarification goes into ADR-0005 in this pull request; a search for `updatedAt` across the ADRs, specs and requirements, 2026-10-04, finds only that ADR line and `data-model.md` §1's list of what every entity has, which stays true); `updatedAt` would add a field to every edit request and to the deposit and withdraw bodies.
- (a) **2.8 as written — recommended.**
- (b) Keep `updatedAt` on edits and money moves; a mismatch is 409 and the page tells the user the item changed.

**Q3 — How many writes a minute?** *What:* NFR-S4 says "write endpoints rate-limited" and gives no figure. *Why it matters:* too low blocks a person (or an agent doing a legitimate burst through tools); too high is no limit. A person cannot make 30 writes in a minute.
- (a) **30 writes per 60 seconds per IP, both overridable by environment — recommended.**
- (b) 10 per 60 seconds (stricter; an agent creating budgets in a loop would meet it).
- (c) 120 per 60 seconds (looser).

**Q4 — Approve the new copy?** *What:* the copy appendix (`user-stories.md`) is the owner-approved source of every message; §3 proposes three additions: "This budget no longer exists", "This pot no longer exists" (US-17 AC3 and US-24 AC2 say "a message says so" with no text) and
"Too many changes. Try again in {N} seconds"; and §2.7 reuses "Already used" for a category or theme taken in a race. *Why it matters:* `COPY` mirrors the appendix and a unit test holds them equal.
- (a) **Add the three rows as worded to the appendix's "R2 additions" — recommended.**
- (b) Give me other wording.

**Q5 — Confirm the reading of US-37 AC3, and the form of the threshold check.** *What:* (1) after a reset every session is dead, so only the request that *causes* a threshold reset gets the 409 "Data was reset"; every later request is a 401 and lands on the login page with "The demo data was reset — please log in again" (2.9). (2) In Release 2 the row trigger cannot fire (25 user rows against 2,000), so the per-write check costs a query for a guard that only database growth can trip.
*Why it matters:* (1) decides how AC3 is tested; (2) is the "cheaper check" of H2, and dropping the check would amend US-37 AC1 and ADR-0005.
- (a) **The reading in 2.9, and keep the check on every write, as one query to the database instead of four (a "round trip" is one such request) — recommended.**
- (b) The reading in 2.9, and run the check only on every tenth write (a sampled check; the guard fires later, by at most nine writes).
- (c) The reading in 2.9, and drop the per-write check, leaving the daily cron's interval reset and the bytes check there; this amends US-37 AC1 ("whenever storage exceeds") and ADR-0005.
- (d) A different reading of AC3 — say how.

---

Changelog: v0.1 (2026-10-04) — first draft, from the T-15d plan's Task S1, the `release-2-handoffs.md` list and a read of `proxy.ts`, `src/server/`, `src/shared/`, `prisma/` and the ADRs, specs and NFRs on that day.
