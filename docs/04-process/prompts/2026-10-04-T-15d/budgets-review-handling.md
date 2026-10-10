# How the budgets reviews were handled (T-15d, S4)

Reviews of `budgets.md` v0.1 (`1db13be`), the two read-only reviews of plan D7, with every fix in v0.2; and of v0.2 (`a122984`), the cross-spec review of plan D12 (review 3), with every fix in v0.3. Each claim a fix
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

## Review 3 — cross-spec, plan D12 (`budgets-review-3-crossspec-report.md`)

Reviewed `budgets.md` v0.2 (`a122984`) and `pots.md` v0.2 (`6927a5a`); fixed in `budgets.md` v0.3. This branch applies
the `budgets.md` findings, the hand-off findings that touch H15 and the shared questions; the `pots.md` findings (P1–P8)
and H-c are the Pots branch's. Where a question is asked in both specs, the Budgets question is worded for both pages and
names its Pots sibling (§9, "Asked in both specs").

| # | Finding | Handling |
|---|---|---|
| B1 | The agent-write refresh contradicts `pots.md` and the bus contract | Confirmed: `pots.md` 2.8 (`6927a5a`, line 61) keeps `bus.ts` unchanged and refreshes from `PotsTools`; `ui-kit.md` 2.3 defines only `requestDelete`/`onDeleteRequest`; H15 had neither. Fixed by taking the mechanism that amends no merged spec: `BudgetsTools` calls `useRouter()` and memoises `PAGE_TOOLS.budgets` with `add_budget`'s and `edit_budget`'s `execute` wrapped to call `router.refresh()` after a result without `isError` (checked against `src/webmcp/tools/registry.ts`, `OverviewTools.tsx`, `WebMcpTools.tsx` — its effect depends on `[tools]` — and `types.ts`/`tool-result.ts` for `isError`); the registry keeps the unwrapped tools. 2.1, 2.13, §6, the Component and WebMCP rows; `notifyWrite`/`onWrite` removed; an agent's write no longer sets `aria-busy` (it runs outside `BudgetsView`'s transition). H15 says `bus.ts` is unchanged. `pots.md` already states this mechanism, so P1's alignment needs only its citations |
| B2 | The error-state header button dropped without asking | Confirmed (`ui-kit.md` §3, line 165: "always on Budgets and Pots"). Not decided here: **§9 BU-Q6**, worded for both pages as `pots.md` PO-Q9; 2.6, 2.12, 2.16, §3 and the Component row follow its answer (recommended (a): no button); H15 (6) carries the shared `ui-kit.md` §3 amendment |
| B3 | A window breakpoint inside the page against `app-shell.md` §2.9 | Confirmed: re-read the designer's live `renderVals()` on 2026-10-05 — `budgetSummaryDir: !isMobile && !budTwo ? 'row' : 'column'`, keyed on the window's mobile mode (< 768 px). Evidence for both readings exists (`overview.md` v1.2 keeps the stat-card row on `@media (min-width: 768px)`, `app/(app)/overview/page.module.css`), so the choice is the owner's: **§9 BU-Q8**, asked with PO-Q7; recommended (a) a 644 px content width, the number PO-Q7 (a) gives the grid (the narrowest content where the design draws the row: 1024 px with the sidebar expanded); at 676 px each half is at least 286 px for the 240 px donut. 2.2, 2.16, the E2E layout row |
| B4 | Animation defaults differ from `pots.md` | Confirmed (live source: the bar's `transition: width .4s`, the donut's `stroke-dasharray .4s`). The bars' animation leaves BU-Q3 for **§9 BU-Q7**, worded for both pages with PO-Q6 (1)–(2) and (b); its recommendation now matches PO-Q6 (a) (animate as drawn, `--duration-progress`, none under reduced motion), and the spec's behaviour is conditional on the answer (2.4, 2.16, §7, §8). BU-Q3 keeps the donut only. 2.4 says how the SVG `rect` animates (a CSS transition of `width`, a CSS property of `rect` in SVG 2) and that the build confirms it in every engine, reporting to the owner if one does not |
| B5 | The token rule stated against `pots.md` | Confirmed: `src/ui/overview/ThemeBar.module.css` line 9 `inline-size: 4px` (and this spec's own summary list reuses it), `overview.md` v1.2's 608 px. The claim "the token rule forbids" is removed; **§9 BU-Q4** asks one rule for both pages' four values (= PO-Q6 (3)–(4)) with options new token / nearest token / the design's number with a comment / value by value; recommended (a), new tokens (the designer's changelog §10, "prefer separate tokens over reuse") |
| B6 | The description suffix | Confirmed (`webmcp-tools.md` lines 64–65, S-32). Fixed: "Available on the Budgets page." on all four; `edit_budget` drops "Returns the budget as the page shows it."; recounted by `budgets-figures/figures.ts` (`output.txt` regenerated: 192, 196, 167, 176 — only those four lines changed) |
| B7 | The create answer and schema names | Confirmed (`write-path.md` 2.2 step 9 leaves the shape to the page spec; `src/shared/schemas.ts` names noun first). Fixed: `POST` and `PATCH` answer `{ budget: BudgetItemDto }`, as Pots' `{ pot }`; `BudgetUpdateSchema` becomes `BudgetEditSchema` (noun first, the tools' verb); 2.10, 2.13, §6, the unit row. The Pots names are the Pots branch's |
| B8 | `delete_budget`'s results incomplete | Confirmed against `ui-kit.md` 2.3 items 4 and 7. Fixed in 2.13: the full list, as `pots.md` 2.13 |
| B9 | The empty-state key not named | Confirmed (`src/shared/copy.ts` line 52, `budgetsEmpty: "No budgets yet"`). Fixed in 2.12, 2.17 and BU-Q2 |
| B10 | The walkthrough and the notice's place | Confirmed (`ui-kit.md` 2.9: a stop "Dismiss notice", under the page header). Fixed: 2.12 places the notice under the header, above both columns at full width; 2.14 adds its stop in both orders |
| B11 | The forbidden-tool test | Confirmed (`write-path.md` 7.6). Fixed in the WebMCP row: an `add_budget` answered 403 returns `forbidden`, not `server_error`, and the page does not refresh |
| H-a | H15 and H16 contradict on `bus.ts`; H15 lacks the `ui-kit.md` §3 amendment | Fixed in H15: `bus.ts` unchanged for Budgets, and (6) the shared §3 amendment under BU-Q6 (a) |
| H-b | Shared form strings in H15 (1) and H16 (1) | Fixed in H15 (1): "Save Changes", "Theme", "e.g. 2000" are added once by whichever first build task comes first and reused by the second; H15 (3) does the same for `--duration-progress` |
| H-c | H16 omits the H17 dependency | Not this branch's: H16 is the Pots row (plan D10) |
| H-d | Done cells to reconcile at merge | No change now: Budgets merges first (plan D7 order S4 → S5) and keeps H6 ☐ with its note; the Pots branch, merging second, keeps ☑ with both notes (plan D11) |
| P1–P8 | `pots.md` findings | Not this branch's (P8, the after-write pattern: Budgets keeps 2.9's `startTransition` with `aria-busy` for its own writes; the Pots branch chooses its side) |
| List 1 | BU-Q2 and PO-Q3 | BU-Q2 is worded for both pages, with four options covering both specs' third options ((c) nothing, (d) the designer draws one) |
| List 2 | PO-Q9 and 2.12 | BU-Q6 (B2) |
| List 3 | BU-Q3 and PO-Q6 (1)–(2)/(b) | BU-Q7 (B4) |
| List 4 | BU-Q4 and PO-Q6 (3)–(4) | BU-Q4 (B5) |
| List 5–6 | BU-Q1 and PO-Q1 | BU-Q1 names PO-Q1 #1 and #2–3 and the UK-Q1 principle, so (a) on both approves each pattern once |
| List 7 | PO-Q7 and the summary row | BU-Q8 (B3) |
| List 8 | PO-Q8 #2 and the two decimals | Kept as decided by an approved requirement (`user-stories.md` "Conventions", `overview.md` S-02; governance v1.10); 2.3, 2.16 and §9's preamble name PO-Q8 #2 and say an answer there that keeps whole dollars reopens the donut's centre — one ruling |
| List 9 | BU-Q5 and PO-Q8 #3 | BU-Q5 states the one rule — what does not fit moves to the next line, whole — as its recommended (a), which is PO-Q8 #3's stacking for the Pots buttons |

## Outside the findings

- `npm audit` after `npm ci --ignore-scripts` on this branch reports 9 high-severity advisories. They are in the
  dependency tree this branch shares with `develop` (this change touches documents only); reported to the controller,
  not handled here.
