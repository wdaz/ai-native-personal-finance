# How the transactions reviews were handled (T-15d, S2)

Reviews of `transactions.md` v0.1 (`60aab24`); every fix is in v0.2. Each claim a fix depends on was checked by the
agent before the edit (the command or file named).

## Review 1 — facts (`transactions-review-1-facts-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | US-11 gives no name direction | Fixed in 2.4: Latest's A to Z is `compareLatest`'s; Oldest's is this spec's decision |
| 2 | Menu inventory: "filter", Recurring Bills' sort | Fixed in 2.8 and §8: AC1 quoted; `recurring-bills.md` cites 2.8 |
| 3 | NFR-A5 is about errors | Fixed in 2.15: NFR-A1 only |
| 4 | WCAG 2.5.3 / NFR-A2 for unnamed buttons | Fixed in 2.15: WCAG 4.1.2, NFR-A1 |
| 5 | NFR-D1 unused | Fixed in the header: D2, D3 |
| 6 | `app-shell.spec.ts` 321–325 stay valid | Fixed in §7 |
| 7 | The route list is a fixture | Fixed in §7: `tests/fixtures/a11y-routes.ts` |
| 8 | "only source for UI values" is in `docs/02-architecture/README.md` | Fixed in §9 Q2 |
| 9 | `PAGE_NAMES` lives in `src/ui/nav.ts`; "48 of 49 rows" | Fixed in 2.16 and 2.5 |
| 10 | Q1 miscounted | Fixed: eight new strings, one visible, seven heard |

## Review 2 — the spec (`transactions-review-2-spec-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | Layers: `ui` cannot import `domain` | Checked `eslint.config.mjs` 111–113. Fixed in 2.1: `pageItems` and `TRANSACTIONS_PAGE_SIZE` in `src/shared` |
| 2 | One listbox cannot serve the pot action menu; forms need disabled options | Fixed in 2.8: the `Menu` chooses one value; `aria-disabled` options; the pot "…" menu is `pots.md`'s menu button |
| 3 | `reset()` does not re-fetch | Checked Next 16.3.8's `10-error-handling.md` (`retry`) and that no `error.tsx` exists in `app/`. Fixed in 2.10: no `error.tsx`, as on Overview |
| 4 | Debounce and pushes race; Back with focus | Fixed in 2.5: one intended query; a choice applies a pending search first; `popstate` resets the field; current option pushes nothing; `{ scroll: false }` |
| 5 | Truncated names vs US-09 AC3, NFR-A8 | Fixed in 2.9 and 2.15: names wrap (a departure with its source); 4.7 updated |
| 6 | Q1 count and terms; missing questions | Fixed: Q1 rewritten with the terms explained; the two reuses of approved messages are Q4. The truncation question was not asked: the stories decide it (5) |
| 7 | Missing test rows | Fixed in §7: the status line, page reset by search and by category, US-19 AC2 with `few-transactions` (checked: its 3 rows are Dining Out, General, General), one page, disabled hover, the busy state held with `page.route`; `empty-all` wins over a filter (2.10) |
| 8 | `webmcp-tools.md` §7 text | Fixed: H11 (4) |
| 9 | Mobile window ambiguous | Fixed in 2.7: centred, then shifted; page 2 and 4 examples |
| 10 | Focus target in two lists | Fixed in 2.7: the visible list |
| 11 | Integer parse; empty values | Fixed in 2.3: `/^[1-9]\d*$/`; every empty value reads as absent |
| 12 | Two accessible names | Fixed in 2.8: one `aria-label` at every width |
| 13 | Silent status after a sort | Fixed in 2.10: emptied, then set |
| 14 | Enter submits a form | Fixed in 2.5: a `div role="search"`; Enter applies the search at once |
| 15 | Smaller gaps | Fixed: Tab and Shift+Tab, same option, pending trigger, scroll into view, CSS-only positioning (checked ADR-0006's `style-src`), the toolbar rule, the `colspan` row, `{ scroll: false }` |
| 16 | `no-store` on errors | Checked `src/server/http.ts`. Fixed in 2.13 |
| 17 | `page: 0` → `required` | Checked `validationIssueCode` in `src/shared/schemas.ts`. Fixed in 2.3 and §7 |
| 18 | Safety rule; registry assertion | Fixed in 2.14 and §7 |

## The owner, during the review

A side note pointed out that 2.3 narrowed US-39 AC2 (the tool returns what the page shows) to valid parameters
without asking. The owner said "sual olaraq yolla" ("send it as a question"): it became §9 Q3. The owner wrote "agent də api
və alət kimi eyni işləməlidir" ("the agent must also work the same as the API and the tool"); the agent asked which
option that meant, and the owner replied "Yalnış dəyər olmamalıdır. Bu hansı hallarda baş verə bilər?" ("There
should be no wrong value. In which cases can this happen?"). The agent answered when a wrong value can happen, and the owner then wrote: "Agent səhv etdikdə əvvəlki seçimə qayıdır və agentdə bu
səhvi gələcəkdə etməməsi üçün öyrənmək təklif olunur". Recorded in §9 Q3 as answer (a) with an addition, applied in
2.3 (checked: Zod 4's `z.enum` message is `Invalid option: expected one of "latest"|"oldest"|…`, and `defineTool`
sends it as `message`).
