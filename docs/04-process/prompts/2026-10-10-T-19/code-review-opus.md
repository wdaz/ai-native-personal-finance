# T-19 — the `/code-review` skill on Opus

## Brief

> You are a read-only code reviewer. Invoke the `/code-review` skill (Skill tool, skill name "code-review", effort high) on the diff of branch `claude/project-thread-cb1uuf` against `origin/develop` in the repository (PR #124 in wdaz/ai-native-personal-finance: "T-19 Transactions — UI and list_transactions"). If the skill is unavailable, perform an equivalent thorough review yourself.
>
> Do NOT edit files, commit, push, or post anything to GitHub. Only read (git diff origin/develop...HEAD, read files).
>
> Context: read AGENTS.md first for project rules. The spec is docs/03-specs/transactions.md (v1.0.19), the plan is docs/04-process/plans/2026-10-10-T-19.md. Key constraints: CSP forbids inline `style` attributes (ADR-0006; element.style from JS is OK); layer rules ADR-0002 (`ui` imports only `ui` and `shared`; `shared` only `shared`); all user-visible copy comes from `COPY` (src/shared/copy.ts) mirrored by the appendix in docs/01-requirements/user-stories.md; tokens in design-tokens.md mirrored by src/ui/tokens.css. Focus areas: src/ui/Menu.tsx, src/ui/transactions/* (TransactionsNav navigation/debounce/popstate logic, pagination focus, ResultsRegion status line), app/(app)/transactions/page.tsx, src/webmcp/tools/transactions.ts, src/shared/pagination.ts, src/ui/useDebouncedValue.ts, and the tests (tests/e2e/transactions.spec.ts, tests/e2e/webmcp.spec.ts, unit tests). Known non-issues to ignore: local install-scripts unit test fails on npm 10; github-advanced-security check failing on GitHub's side.
>
> Report: a list of findings, each with severity (blocking / should-fix / nit), file:line, a concrete failure scenario, and a suggested fix. Verify each finding against the code before reporting; drop speculative ones. Also say plainly if you found nothing blocking. Save the brief you were given and your full report as markdown to docs/04-process/prompts/2026-10-10-T-19/code-review-opus.md (that one file write IS allowed), with a header "# T-19 — the `/code-review` skill on Opus", sections "Brief" and "Report".

## Report

The `/code-review` skill ran at effort high on `origin/develop...HEAD` (54 files, +3560/−39) and returned 10 candidate findings. I checked each one against the code and the spec. I adjusted or downgraded some, dropped one claim that was wrong, and added one scenario the skill missed (Back while a push is still pending). Nothing was run: no app, no tests. Every finding comes from reading the code.

**Nothing blocking was found.** I also checked the hard constraints, and all of them hold. No changed file under `src/ui` or `app/(app)/transactions` uses an inline `style=` attribute. The new `ui` files import only from `ui`, `@/src/shared`, React and Next, and `src/shared/pagination.ts` imports nothing. Menu.tsx gets its user-visible text from `COPY` (`menuTriggerName`). The option labels come in from the caller.

### should-fix

**1. Pagination focus effect takes focus (and scrolls) when no pagination control was activated.** `src/ui/transactions/TransactionsPagination.tsx:29-43`
- The effect runs every time `current` changes, and it counts `activeElement === document.body` as "lost". So it also runs when the page change came from Back/Forward or from a link. It also runs in Safari, macOS and iOS, where a tapped or clicked `<button>` does not take focus.
- Scenario: in iOS Safari the user taps "Page 3". Focus stays on `<body>`. They scroll to the top and press Back. `current` changes from 3 to 2, `lost` is true, and `.focus()` (no `preventScroll`) scrolls the viewport down to the pagination. That undoes the `{ scroll: false }` the navigation asked for.
- Spec 2.7 "Focus" talks about *an activated control*. Its "never left on `<body>`" applies after a pagination control was used.
- Fix: in Previous/Next/number `onClick`, set a ref such as `activated.current = true` before calling `nav.setPage`. In the effect, act only when that ref is set (and clear it), or when `root.contains(active)`. Pass `{ preventScroll: true }` as well when the target is already in view.

**2. `fromHistory` is consumed only when `effectiveKey` changes, so a Back/Forward that does not change the effective query leaves the intended query (and the flag) stale.** `src/ui/transactions/TransactionsNav.tsx:127-147`
- (a) Back during a pending push. On page 1 the user clicks Next. `go()` sets `intended`/`query` to page 2 and pushes. Before the answer arrives, the user presses Back. The popstate sets `fromHistory = true`, and the router renders the `?` (page 1) entry. `effective` is still page 1, so `effectiveKey` does not change and the effect never runs. `query.page` stays 2: the pagination marks page 2 as current over page 1's rows until the next control is used. (This assumes Next abandons the in-flight push on popstate, which is the app router's normal behaviour.)
- (b) Stuck flag. Going Back from `?page=99` (clamped to 5) to `?page=5` gives the same key, so `fromHistory` stays `true`. If the next navigation comes from a link rather than a control (sidebar or Budgets "See All"), it is handled as a history navigation and `setText(effective.q)` runs even though `q` did not change. Spec 2.5 says the text is reset on a link "only when its `q` differs".
- Fix: make popstate a state change, not only a ref. For example, `const [historyTick, setHistoryTick] = useState(0)`, with the handler calling `setHistoryTick(t => t + 1)`, and the effect depending on `[effectiveKey, historyTick]`. On a history tick, always resync `intended`/`query`/`text` from `effective`. Add a unit test in `tests/unit/ui/transactions/TransactionsNav.test.tsx` for "popstate with an unchanged effective query resets a stale intended page".

### nit

**3. Enter during IME composition submits the search.** `src/ui/transactions/TransactionsToolbar.tsx:54-58`
- In CJK input, the Enter that commits a candidate fires `keydown` with `key === "Enter"` and `nativeEvent.isComposing === true`. `submitSearch()` then applies the search at once, so the commit itself becomes a search. The harm is small because the text being committed is what gets searched.
- Fix: `if (event.key === "Enter" && !event.nativeEvent.isComposing)`.

**4. ResultsRegion advances `spoken` before the announcement frame fires.** `src/ui/transactions/ResultsRegion.tsx:19-25`
- `spoken.current = changes` runs before the `requestAnimationFrame`. If the effect re-runs before that frame (because `status` changes inside the same frame, for example from a popstate render), the cleanup cancels the frame and the re-run returns early. The status line then stays empty for that change. The window is one frame, so this is unlikely. When a new control navigation starts, its own announcement covers it.
- Fix: set `spoken.current = changes` inside the rAF callback, or set `announced` from a `useLayoutEffect` keyed on `changes`.

**5. A second full read just to choose the empty message.** `app/(app)/transactions/page.tsx:39-46`
- With no match, `getTransactions` is called again with no filter. `getTransactions` (`src/server/transactions.ts:45`) runs `findMany` with no `where`, so every empty search reads the whole table twice. The spec allows this, and the cost is trivial with 49 demo rows.
- Fix (optional): have `toTransactionsDto`/`getTransactions` return the unfiltered row count next to `total` (the rows are already loaded), or use `db.transaction.count()`.

**6. A page click while a search is still pending keeps the clicked page number.** `src/ui/transactions/TransactionsNav.tsx:112-122`
- The user types `xyz` and clicks "Page 4" within 250 ms. The push is `?q=xyz&page=4`. The server clamps it to page 1 of 1, but the URL keeps `page=4`. This follows spec 2.5 to the letter ("first apply a pending debounce, then change"), and the URL is lenient by design. It is only worth a spec decision on whether a pending search should reset the clicked page to 1.

**7. Duplicates that will drift.**
- `src/ui/transactions/TransactionsError.tsx` and `.module.css` are line-for-line copies of `src/ui/overview/OverviewError.*` (diffed: only the copy key and the doc comment differ). Suggestion: one `LoadError({ message })` in `src/ui`.
- `src/webmcp/tools/transactions.ts:24-32` `listTransactionsPath` rebuilds the `/api/transactions` query string by hand, next to `transactionsSearch()` in `src/shared/transactions-query.ts`. Reuse it, or add a unit test that pins the two to the same parameter names and order.
- The visually-hidden rule is copied in `TransactionTable.module.css:115`, `TransactionsToolbar.module.css:65` and `ResultsRegion.module.css` (`.status`). One shared class would do.

**8. `pageItems`' `maxNumbers` is a mode switch, not a maximum.** `src/shared/pagination.ts:17-19`
- `maxNumbers < 5` picks the narrow layout. Otherwise the wide layout comes out (up to 7 items) whatever the value. For example, `pageItems(10, 20, 5)` returns `1 … 9 10 11 … 20`, which is 7 items. The only callers pass `PAGE_NUMBERS_WIDE` (7) and `PAGE_NUMBERS_NARROW` (3), so nothing breaks today.
- Fix: take `"wide" | "narrow"`, or rename the parameter.

### Dropped from the skill's output
- The skill described `pageItems(1, 20, 5)` as returning the "7-item layout". It actually returns `[1, 2, "gap", 20]`. The underlying point is kept, with a corrected example, as finding 8.
- The skill rated the page-number-with-pending-search case as a behaviour bug. It is downgraded to a nit, because the code matches spec 2.5 as written.
