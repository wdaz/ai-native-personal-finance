# How the pots reviews were handled (T-15d, S5)

Reviews of `pots.md` v0.1 (`88a2dd2`); every fix is in v0.2. Each claim a fix depends on was checked by the agent
before the edit (the command or file named). A fix that would change what the design draws, or decide a choice an
approved document leaves open, became a §9 question for the owner instead (governance v1.10).

## Review 1 — facts (`pots-review-1-facts-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | The E2E row misses `ui-kit.md` §7's items for this page | Checked `ui-kit.md` §7 (the E2E row and the criterion table). Fixed in §7: the Theme field by pointer in every engine (WebKit included) and a server `taken` kept after a click choice; the "…" menu opened by a click; a message kept while typing; the Theme trigger's `toHaveCSS`; "No, Go Back" ≥ 44 px; the used swatch at 0.25; the destructive hovers; a 404 on an edit and on a move; the header at 320 px and 1440 px; the tool delete's `X-Via: webmcp` (WebMCP row) |
| 2 | The bus contract contradicts `budgets.md` v0.1 | Checked `budgets.md` at `1db13be` (2.13: `router.refresh()` from `BudgetsTools`). Fixed in 2.8, 2.13, §6, H16 (4): `router.refresh()` from `PotsTools`, no bus contract; §9 re-reads `budgets.md` (with review 2's 7 and 14) |
| 3 | Test line 244 is the US-34 phone test | Checked `tests/e2e/app-shell.spec.ts` (147, 170, 185; 240/244). Fixed in §7 |
| 4 | R-08 is the decimals rule | Checked the adversarial review (R-08 line 22, R-19 line 33). Fixed in 2.2: R-19 only |
| 5 | "Add a pot" is US-05 AC2 | Checked `user-stories.md` US-05. Fixed in the header: "See Details" only |
| 6 | `overview.md` 2.1 does not say "every request" | Checked `app/(app)/layout.tsx` (`connection()`, ADR-0006) and `tests/api/app-pages.spec.ts`. Fixed in 2.8: cites them |
| 7 | 2 px tokens exist (the focus ring's) | Checked `src/ui/tokens.css`. Fixed in PO-Q6: no spacing token is 2 px |
| 8 | `delete_pot`'s results are incomplete | Checked `ui-kit.md` 2.3 (`DeleteResult`, items 4 and 7). Fixed in 2.13: every code, mapped by item 7 |
| 9 | 2.14's intro misnames two rows | Fixed in 2.14: the intro names every row's kind (with review 2's 2) |
| 10 | Two claims not in `output.txt` | Fixed: `figures.ts` prints the numerator (111,511,999,999, within `Number.MAX_SAFE_INTEGER`), re-run, `output.txt` replaced; 4.7 says the text fit is asserted by E2E only, and §7 asserts it at 320 px and 1024 px expanded |
| 11 | The hand-offs status line not amended | Fixed in `release-2-handoffs.md` line 3: "amended by the Pots spec's PR #97 …" |
| — | `formatAmountInput` examples are `ui-kit.md` 4.1's | Fixed in 2.5 (with the seed's five targets) |
| — | "Test data through the API" is NFR-T3's | Checked `non-functional-requirements.md` T3. Fixed in 4.5: NFR-T3 quoted; ADR-0003's test-support route named for what it does |
| Design facts | For the controller to check live | Not a finding. Re-read live on 2026-10-05 for v0.2 (read only): `L.potsCols` is `isMobile ? '1fr' : 'repeat(2, …)'`, the card text `pct.toFixed(pct >= 10 ? 1 : 2)`, the preview bar `transition: width .3s ease`, "characters left" — as v0.1 states. The other values were not re-read in this round; no repository document contradicts them (the reviewer's check) |

## Review 2 — the spec (`pots-review-2-spec-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | The window breakpoint contradicts `app-shell.md` §2.9 (Approved v1.5) | Checked `app-shell.md` on `origin/develop` (`28ad970`, §2.9 and its table). Not decided in the spec: **PO-Q7** (a: a 644 px content width, recommended; b: an `app-shell.md` exception; c: another width the designer names); 2.4, 4.1, 4.7 and the figures script (PO-Q7 (a)'s widths) follow |
| 2 | Design departures decided without a question | **PO-Q8** lists rows 1–4 (two decimals, "$2,000.00", stacking, the duplicate check) with a recommendation; the error state's button is PO-Q9 (3). The 2.14 intro is rewritten: `type="text"` and the timing rows cite `ui-kit.md` 2.11 (merged), "1 character left" is PO-Q1 |
| 3 | The error state's missing header button contradicts `ui-kit.md` §3 | Checked `ui-kit.md` §3 and `budgets.md` 2.6, 2.12 (the same choice). **PO-Q9** (a: no button in that state, `ui-kit.md` §3 amended in its own PR, recommended; b: the button stays, server checks only); PO-Q3's premise reworded; 2.9, §3 and H16 (4) follow |
| 4 | §7 misses `ui-kit.md` §7's items | Fixed as review 1's 1 |
| 5 | A server 400 leaves the page's data stale | Checked `ui-kit.md` 2.6 ("refreshed from the page's data"). Fixed in 2.5, 2.6, 2.8 (a 400 with `taken`, `exceeds_balance` or `exceeds_total` calls `router.refresh()`) and in §7 (component and E2E "stale data") |
| 6 | `PotsDto.total` is not shown; the parity sentence omits it | Fixed: `total` removed from `PotsDto` (2.12, 4.2, §7's API row); the parity sentence (2.13) quotes "including ids" and says why the balance is data the page shows. `list_pots`'s description never named the sum, so its count (171) is unchanged |
| 7 | The bus contract is not needed | Fixed as review 1's 2 |
| 8 | Typing cannot be observed through `Field` | Checked `src/ui/Field.tsx` (only `onBlur`). Fixed differently from the suggestion, with no `Field` change: `PotForm` and `MoneyModal` read the text from the `input` events that bubble to their `<form>` (React's `onInput`), 2.5, 2.6; `Field` stays uncontrolled with `ui-kit.md` 2.5's four props, so no `ui-kit.md` mirror is needed |
| 9 | H6 and H8 Done cells mix ☐ and ☑ | Fixed: both ☑, with every part's section |
| 10 | Test line attribution | Fixed as review 1's 3 |
| 11 | US-05 citation | Fixed as review 1's 5 |
| 12 | US-36 AC1 partly traced | Fixed in §7: a create, an edit, a delete and a move each survive a reload and show in a second tab |
| 13 | PO-Q4 (a): two messages under one field | Fixed: under (a) "All themes already have a pot" is the field's one message from the opening, and submit adds no "Can't be empty" (as `budgets.md` 2.6 does); 2.5 follows |
| 14 | The `budgets.md` read must be redone | Fixed in §9: re-read at `1db13be` (BU-Q1–BU-Q4 unanswered, nothing to reuse) and the D12 points listed (tool refresh, page refresh, the error header, the empty and error texts, the column switch, the animation question). `budgets.md` 2.9, not 2.8, holds its `startTransition` refresh (checked) |
