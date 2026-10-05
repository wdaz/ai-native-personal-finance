# How the budgets reviews were handled (T-15d, S4)

Reviews of `budgets.md` v0.1 (`1db13be`), the two read-only reviews of plan D7; every fix is in v0.2. Each claim a fix
depends on was checked by the agent before the edit (the command, file or design source named). Under governance v1.10 a
fix that would change what the design draws, or decide a choice an approved document leaves open, became a §9 question
(BU-) instead.

## Review 1 — facts (`budgets-review-1-facts-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | The E2E row leaves out the items `ui-kit.md` §7 gives this page | Checked `ui-kit.md` §7 (the E2E row and the criteria table). Fixed in §7: every item added to the E2E row — the pointer checks in every engine (WebKit included), the "…" menu by click, "No, Go Back" 44 px, the used swatch at 0.25, the destructive hovers, US-34 AC2 (no hover on a used option or a pending button), 320 px with a modal open, 320 px header fit, 1440 px header, and on a 404 focus on `<main>` with the notice announced. The claim at the head of §7 now holds |
| 2 | `app-shell.spec.ts` line 178 and the 98–115 loop missing | Checked `tests/e2e/app-shell.spec.ts` (178: `toHaveURL(…/budgets)`; 98–115 loop over `PAGES` at five widths). Fixed in §7 |
| 3 | "Edit Budget · Delete Budget" sourced to UK-Q1 | Checked `ui-kit.md` 2.12. Fixed in 2.17: two rows, "Budget options: {category}" (UK-Q1) and the items (the design) |
| 4 | `scripts/` may import only `domain` and `shared` | Checked ADR-0002 line 4, `eslint.config.mjs` 136–139, `scripts/seed-figures.ts` (builds rows from `data.json` with domain conversions, `seedOverviewInput`). Fixed in §4, H15 (2) and the figures' `README.md`: the script uses `seedOverviewInput`, `data.json`'s display names and the domain functions; `applyVariant`'s pure rules move to `src/domain`; the donut's segments do not move (`donutSegments` is `ui`; `tests/unit/ui/overview/donut-geometry.test.ts` covers the geometry) |
| 5 | `{}` on `PATCH` is an unstated exception to `write-path.md` 4.4 | Resolved by review 2's finding 1: `PATCH` now takes all three fields, so there is no exception (2.10, 4.7) |
| 6 | "reads the database on each request" is not in `overview.md` 2.1 | Checked `overview.md` line 11 and ADR-0006 (per-request nonce, dynamic rendering). Fixed in 2.9: both cited |
| 7 | H17 is not on this branch or on `develop` | Checked `gh pr view 96 --json state,mergedAt` on 2026-10-05: `MERGED`, `2026-10-05T19:05:20Z`; `git grep H17 origin/develop` finds the row. Fixed in the header and 2.2: the merge's date and command. **Not fixed on the branch:** this branch was cut before #96, and `git merge-tree` shows a conflict in `release-2-handoffs.md` (H15 here, H17 on `develop`, the same place). A merge of `origin/develop` into the branch (keeping both rows) was prepared and the commit was refused by the session's permission check, so it was aborted; the branch must take `develop` before it merges (the PR body says so) |
| 8 | The design was not checked (no design tool named) | Not a defect. The agent re-read the Budgets screen of the designer's live `Finance App.dc.html` on 2026-10-05 for this round and confirmed: the summary row and card markup (one line, the right part `white-space: nowrap`, no wrap rule — which made review 2's finding 6 a question), the bar's 32 px track, 4 px padding, 24 px fill, 4 px radius and `transition: width .4s`, the Latest Spending amounts with no colour of their own (grey-900, the body colour), "No transactions in this category yet.", the 12 px caret after "See All" (a button), the "Budget options" name, "Edit Budget"/"Delete Budget", and "e.g. 2000". Not re-read this round: `renderVals()`'s numbers, the donut's drawing, the changelog §14/§16c quotes, the form descriptions, `CATS[0]`, the 1100 px switch and "22 transactions" — v0.1 read them live on 2026-10-05, and H15 (5) has the build task read the source again |

## Review 2 — the spec (`budgets-review-2-spec-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | `PATCH` with optional fields contradicts `write-path.md` 4.4 and the spec's 4.7 | Checked `write-path.md` 4.4 and its 2.7 table, and `pots.md` on PR #97's branch (`PATCH` takes all three; partial edits out of scope). Fixed: `BudgetUpdateSchema` requires all three (2.10); 4.7, §8, the unit and API rows; `edit_budget`'s description re-counted by `figures.ts` (191 characters, `output.txt` regenerated). The `{ pot }` vs bare DTO difference is left to the cross-spec review of plan D12 (`write-path.md` 2.2 step 9 says only "with the record") |
| 2 | Tools cannot call `router.refresh()` | Checked `src/webmcp/tools/registry.ts` and `OverviewTools.tsx` (module-level tools, no hooks). Fixed in 2.13: `notifyWrite("budget")` on the bus, `BudgetsView` subscribes with `onWrite` and runs 2.9's refresh with `aria-busy` — the contract `pots.md` 2.8 states (PR #97; H16 (4) checks the two specs agree); the `not_found` window for a just-added id is stated. Component and WebMCP rows test it |
| 3 | E2E items of `ui-kit.md` §7 missing | As review 1 #1; H9 line now names US-34 AC2 |
| 4 | "Without reload" never asserted | Checked `tests/e2e/webmcp.spec.ts` 169–181 (the window marker). Fixed in §7: a marker before each write of US-15 AC3, US-16 AC2, US-17 AC2 and `add_budget` |
| 5 | Walkthrough order wrong below 1024 px; banner missing | Checked `src/ui/Shell.tsx` (`BottomNav` after `<main>`; `ResetBanner` first in `<main>`), `tests/e2e/app-shell-keyboard.spec.ts` 26–50, `src/ui/PageHeader.tsx` and `src/webmcp/AgentToolsStatus.tsx` (the compact indicator is a `role="status"` span with no stop — v0.1's "indicator" stop was also wrong). Fixed in 2.14: two orders; E2E walks both |
| 6 | Two 320 px layouts decided without the owner | Confirmed against the designer's live source (no wrap rule; the right part `nowrap`). Not decided: **§9 BU-Q5** (2.3, 2.4, 2.15, 2.16, §7) |
| 7 | The error state is never tested | Checked `tests/unit/ui/overview/OverviewError.test.tsx` (Overview tests only the component). Fixed in the Component row: `BudgetsError` and `page.tsx` with `getBudgets` mocked to throw (header without the add button, the card, the log line with the request id) |
| 8 | 2.16 leaves out additions | Fixed: rows for the "See All" tap target (`app-shell.md` §4), `aria-busy`, the labelled `<section>`/`<ul>` and no empty `<ul>`, and the error state's header without the button (merged into the existing error row) |
| 9 | Unexplained terms in BU-Q2, BU-Q3; BU-Q3 (b)'s route | Fixed: BU-Q2 says what "No budgets yet" is and describes the text style in words; BU-Q3 (b) explains the reduce-motion setting and routes Overview's change as H12/H17 do (an `overview.md` amendment in its own pull request, the code in hotfix 2) |
| 10 | Focus after an edit assumes a stable card | Fixed in 2.7: cards keyed by `id`; tested in the Component row |
| 11 | §3 has no Loading row | Fixed |
| 12 | L5: PR #92 / #96 claims without date or command | Checked `gh pr view 92` / `96 --json state,mergedAt` on 2026-10-05. Fixed in the header and 2.2 |
| 13 | Only one side of the expanded threshold | Fixed in §7: 1332 px (content 952) two columns |
| 14 | Tests that change: line 178, `app-shell-keyboard.spec.ts:26` | Checked both. Fixed in §7 (with the 98–115 loop, review 1 #2) |
| 15 | US-19 AC2's expected state unnamed | Checked `transactions.md` 2.10, §3 and §9 Q4. Fixed: "No results", "No transactions match your search" |
| 16 | `readOnlyHint` on `list_budgets` not named | Checked `tests/unit/webmcp/registry.test.ts` 32–37. Fixed in the WebMCP row |

## Outside the findings

- `npm audit` after `npm ci --ignore-scripts` on this branch reports 9 high-severity advisories. They are in the
  dependency tree this branch shares with `develop` (this change touches documents only); reported to the controller,
  not handled here.
