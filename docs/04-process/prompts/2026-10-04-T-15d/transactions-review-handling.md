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
| 5 | Truncated names vs US-09 AC3, NFR-A8 | v0.2 made names wrap (a departure from the design decided by the agent without asking). **Overruled by the owner** on v1.0.1: truncated as drawn, with a tooltip (v1.0.2, §9) |
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

## Copilot on PR #88 (head `fe43b5c`)

| Comment | Handling |
|---|---|
| 2.2 says "the longest name is 60", 4.7 says 24 | Fixed in v0.2.1: "the name limit is 60" |
| 2.15: two departure rows merged into one | Fixed in v0.2.1 (the line break was lost when a row was removed in v0.2) |

A side note then pointed out that the owner's "learn for the future" cannot be promised by the app: an agent
keeps no memory between conversations. v0.2.1 says so in 2.3 (the refusal helps within one conversation; the input
schema with the allowed values is what every agent sees), and the owner was told.

## The owner on v0.2.1

The owner answered Q2 ((a), with the note that the shadow is for popovers and dropdown menus only — recorded
verbatim in §9 Q2), found Q1 unclear (rewritten in v0.2.2 as a table: each text, where it is used, seen or heard,
with "screen reader" and "voice control" explained), and remarked on Q3 that seeing the schema may prevent mistakes
to some degree (recorded in §9 Q3).

## The owner on v0.2.2

"Q1 və Q4-ə cavab a" ("answer a to Q1 and Q4"). v1.0 records both answers in §9; nothing waits for the owner.

## The owner on v1.0.1 — a decision the agent should have asked

"Spec uzun adları dizayndakı kimi "…" ilə kəsmir, sətirdən-sətrə keçirir; bu qərarı səndən soruşmadan agent verib.
Orda tooltip olmalıdır." The agent had answered review 2's finding 5 by departing from the design on its own reading
of US-09 AC3 and NFR-A8; a departure from what the design explicitly draws is the owner's call, even when a story
seems to support it. v1.0.2 truncates as drawn and adds a native tooltip (`title`), recorded in §9. The owner also
said the designer's sidebar and favicon changes go in as the second hotfix ("hotfix 2"), after T-15d.

## The owner on v1.0.2 — the tooltip is custom

"Tooltip custom olacaq və dizaynerə bu haqda tapşırıq verdim" ("The tooltip will be custom, and I have given the
designer a task about it"). v1.0.3 replaces `title` with a custom tooltip: the spec states its behaviour (only when
the name is cut; pointer, keyboard focus and tap; WCAG 1.4.13), the look comes from the designer (H11 (5)). Copilot
could not review `3a4ae8c` ("encountered an error"); it was not re-requested by hand (the owner's rule), the next
push re-runs it.

## The owner: "Tooltip haqda changeloga bax"

The designer's local `CHANGELOG.md` (21:59) has no tooltip section; the exports of 22:17 do (style guide, section
"Tooltip": style, mouse, touch, keyboard). v1.0.4 follows it in 2.9 and asks §9 Q5 about the two points where it does
not meet WCAG 1.4.13 (NFR-A1 is WCAG 2.1 AA): the tooltip is not hoverable (`pointer-events: none`, closes when the
pointer leaves the name) and closes by itself after 3 s on touch. The agent did not decide them (see the long-names
lesson above). Copilot errored on `3a4ae8c` and `ecf51c9`; the owner was asked how to proceed.

## Copilot on PR #88 (head `387a65e`)

| Comment | Handling |
|---|---|
| §6 still lists `error.tsx` and omits `TruncatedName` | Fixed in v1.0.5 |

## Copilot on PR #88 (head `72ce91b`)

| Comment | Handling |
|---|---|
| 2.9: the row's second half renders under the tooltip's last sub-point | Fixed in v1.0.6: one list item, then the sub-points |
| §7: the E2E row spans three physical lines and breaks the table | Fixed in v1.0.6: one line; a script checked that no table row is left unterminated |

## Copilot on PR #88 (head `ca266fb`)

| Comment | Handling |
|---|---|
| 2.9: the joined sentence starts with a lowercase "the" | Fixed (v1.0.6, wording only) |

## The designer's changelog in Claude Design (read 2026-10-04)

The owner pointed at the designer's `CHANGELOG.md` in the Claude Design project; the `claude_design` MCP did not load
into this session, and after the owner started `/design-sync` the agent read the one file with `DesignSync`
(`get_file`, read only; nothing synced or written). Its §6 (custom tooltip) is newer than the local copy in
`~/Own/design-exports`. v1.0.7 applies it to 2.9 (`TruncatedText`, `tabindex="0"`, `aria-describedby` only while
open, one tooltip in a portal, `position: fixed`, flip at 72 px, 16 px clamp, close on scroll and resize) and adds
H12 (the designer applies the tooltip on Overview too: hotfix 2). §9 Q5 stands: the changelog keeps "pointer leaves"
and the 3 s touch timer.
