# How the recurring-bills reviews were handled (T-15d, S3)

Drafts reviewed: `recurring-bills.md` v0.1.1 (the scope audit) and v0.2 (`53b2d02`, the two read-only reviews).
Handled in v0.3. The design re-read for v0.6 (the designer's changelog §12–§16, RB-Q9 answered) is the last section.

## The two read-only reviews (plan D7) — run, and handled in v0.3

The drafting session ran without the Agent tool (a `ToolSearch` for it on 2026-10-05 found only unrelated tools), so
the controller session sent both briefs as written (Opus, read only; `governance.md` v1.1 and v1.3) against
`53b2d02c62304c835ca3ae999220ad29bc32d837`. Each report is saved word for word next to its brief:

- `recurring-bills-review-1-facts-brief.md` → `recurring-bills-review-1-facts-report.md` — 1 important, 7 minor;
- `recurring-bills-review-2-spec-brief.md` → `recurring-bills-review-2-spec-report.md` — 2 important, 8 minor.

A third, independent audit of process and scope (checks 1–8: design addresses, Status, allowed edits, strings,
figures, tests, tool inputs) ran on v0.1.1; its file is outside the repository and its five findings are summarised
below. Every finding was checked against the repository (and, for a design fact, against the designer's live source)
before it was acted on. The tables say where each one was fixed (the spec's section in v0.3) or why it was declined.
The pull request stays a draft until the items in its description are done.

### Review 1 — facts

| # | Finding | Handling (v0.3) |
|---|---|---|
| 1 (important) | `billsSummary` gives three cent sums only — no counts, no Total Bills — so the DTO's four `{ count, amount }` rows need code the spec does not name; 4.2 calls the totals repository code | **Fixed.** Confirmed: `src/domain/bills.ts:55-70`; `figures.ts` computes the counts and the total by hand. 2.1 and §6 name a new pure `billsTotals` (counts and cents; `billsSummary`, the Overview DTO and `get_overview_summary` unchanged); 2.4 builds the summary with it; §7's domain row tests it; 4.2 now says the three cent sums are repository code and the counts and Total Bills are the script's (the build's `billsTotals`). The figures README says so too. Same as review 2 #2 |
| 2 | §7 lists day 24 and 25 as "not yet covered"; `tests/unit/domain/bills.test.ts:43-49` covers them (and 23:59:59Z, 20 Aug, 10 Jul) | **Fixed** (§7, Unit — domain): "not yet covered (day 31, a recurring income)", naming the cases already covered |
| 3 | 2.13 states one shell tab order; it depends on the width and leaves out the reset banner's "Dismiss notice" | **Fixed** (2.13). Confirmed in `tests/e2e/app-shell-keyboard.spec.ts`: 1440 px — skip link, five nav items, "Log out", "Minimize Menu", "Dismiss notice"; 375 px — skip link, "Dismiss notice", header "Log out", five bottom-bar items. 2.13 now gives both. `transactions.md` 2.11 has the same wording; it is Approved and outside this task, so it is **not** changed here — a follow-up for the owner (a one-line fix in its own pull request) |
| 4 | 2.6 cites the style guide's "Contrast pairs" for 4.73:1; no such section was recorded as read | **Fixed** (2.6): the ratio is cited from the figures script only (`output.txt` "CONTRAST"), which computes it |
| 5 | Design values in 2.6, 2.9 and 2.13 (11 px, the 20 px heading gap, the list card's paddings and 24 px gap, the 32 px avatar, the 16 px avatar–name gap, the 24 px column gaps) have no row in the re-read table | **Fixed**: each was re-read from the designer's live source on 2026-10-05 and recorded in "Design re-read for the reviews" below; every value holds, so the spec's numbers are unchanged |
| 6 | 2.14's 44 px row cites `transactions.md` 2.8; the 44 px trigger is in 2.9 | **Fixed** (2.14): "`transactions.md` 2.8, 2.9" |
| 7 | The header lists W3–W7 (W5 is about destructive tools) and leaves out NFR-A8, whose "no horizontal scroll ≥ 320 px" 2.13 and 4.6 use | **Fixed** (header): "W3, W4, W6, W7" and "A8 (no horizontal scroll at 320 px, 2.13)". This reverses v0.1.1's own-check item 2, which had read A8 as unused |
| 8 | RB-Q5 leaves out R-24, which asked for `untrustedContentHint` on list tools in general | **Fixed** (RB-Q5): R-24 cited in the question and in option (a) |

### Review 2 — the spec

| # | Finding | Handling (v0.3) |
|---|---|---|
| 1 (important) | RB-Q4 (a) promises the output says "upcoming = every unpaid bill", but the DTO key `summary.upcoming` (4 bills) and the filter `status: "upcoming"` (2 rows) share a name and nothing tells them apart | **Fixed** (2.11, 2.12, RB-Q4 (a), §9 decisions): the summary key is `totalUpcoming`, the card's label, so it cannot be read as the row status. The tool description is unchanged (192 characters). The key is part of RB-Q4 (a), which the owner answers |
| 2 (important) | No source for the summary's counts and total; changing `billsSummary` would change the approved Overview DTO | **Fixed**, as review 1 #1: a new `billsTotals`; `billsSummary` and Overview stay unchanged (2.1, §6, §7) |
| 3 | The status list has no home that `shared` and `webmcp` may import (`eslint.config.mjs`: `shared` → `shared`; `webmcp` → `webmcp`, `shared`) | **Fixed** (2.1, 2.11, §6, §7): `BILL_STATUSES` in `src/shared/recurring-bills-query.ts`; the domain's `BillStatus` is its type (`domain` may import `shared`); the DTO schema, the parser and the tool's `z.enum` read it |
| 4 | 2.14's intro says no row changes what the design draws, but the hover border, the full stop and the 44 px button do | **Fixed** (2.14 intro): it now names the rows that change what is drawn because an approved document differs — and a fourth the reviewer did not list, the desktop layout from 1024 px instead of 1100 px (US-33 AC1, `--bp-desktop`). **Declined:** asking the hover colour as an RB- question. Each of these rows follows an approved document the owner already applied to Transactions (the tokens' "Component states", `transactions.md` 2.12; the copy appendix; `--tap-target-min`, `transactions.md` 2.9), so no choice is left open; plan D14's rule is about departures that no approved document carries |
| 5 | The separator before the hidden status word is not specified ("Monthly - 21stDue soon") | **Fixed** (2.9, §7 Component, RB-Q1 #3): the due text `span`, one space, the visually hidden status `span`, then the decorative icon; the cell's exact accessible text is "Monthly - 21st Due soon" (and "… Paid", "… Upcoming"). The space is markup, not a new string |
| 6 | The toolbar below 768 px says both "the full row" and "beside the icon button", with no wrap rule | **Fixed** (2.9): the field takes the rest of the row beside the 44 px button, 24 px apart (the design: `max-width: 100%`, `gap: 24px`, re-read live); at 320 px it gets 320 − 32 − 40 − 44 − 24 = 180 px ≥ 160 px (shell padding 16 px, `src/ui/Shell.module.css`; card padding 20 px), so the button never wraps |
| 7 | §7 does not cover US-38 AC1's "leaving a page unregisters its tools", US-34 AC2, or "a refused call changes nothing" | **Fixed** (§7 WebMCP row and H9 line): a client navigation away → `[data-webmcp]` absent and 0 tools; the page unchanged after a refused call; "US-34 AC2 — not applicable: no disabled control" |
| 8 | H14 misses RB-Q8 (c)'s US-30 AC1 amendment; the build order after Transactions is implicit; `ResultsRegion` undecided; `tests/e2e/webmcp.spec.ts` missing from the placeholder list | **Fixed**: `release-2-handoffs.md` H14 gains (4) (RB-Q8 (c) amends US-30 AC1 in this pull request) and the build order; RB-Q8 (c) points to it; §6 states the order and decides `ResultsRegion` — Transactions' one, moved to `src/ui/ResultsRegion.tsx` by this build with no change of behaviour; §7 adds the conditional `webmcp.spec.ts` / `webmcp-tools.md` §7 line (today the check navigates to Transactions, line 173) |
| 9 | RB-Q7 asks about `q` and `sort` only; 2.3 also decides `status` | **Fixed** (RB-Q7): one sentence on `status` (ignored by the page; refused by the API and the tool, naming the allowed values) |
| 10 | 4.6's "no name is non-ASCII" is not printed by the figures script; "the design computes it the same way" and "the design draws no pagination" have no recorded source | **Fixed**: `figures.ts` prints the non-ASCII check (`output.txt` "LENGTHS": 0), and 4.6 cites it. The two design facts are re-read live and recorded below; 2.4 cites the record |

### The scope audit (on v0.1.1)

| # | Finding (summary) | Handling |
|---|---|---|
| 1 (blocker) | The two D7 reviews had not run; no report files existed, so no findings could be handled | **Fixed**: both ran on v0.2 (above); the reports are saved word for word; every finding has a row; the spec is v0.3 |
| 2 (important) | The spec's A to Z tie-break puts Aqua Flow Utilities before Spark Electric Solutions in Highest and Lowest, while the design (no tie-break, a stable sort over its fixed list) shows Spark first — a change to what the design draws without an RB- question | **Already handled in v0.2**: §9 **RB-Q8** asks it (three options with the seed effect of each; (a) recommended), the tie-break left the "decisions" list, and 2.4, 2.14 and 4.3 point to it. Re-checked live on 2026-10-05: `billSortFns` still has no tie-break, and `BILLS` still lists Spark (2nd) first and Aqua (30th) last |
| 3 (important) | The design facts came from a stale export (2026-10-04 22:17) without the changelog's §8–§9 | **Already handled in v0.2** ("Design re-read (live)" below); the reviews' design values were re-read live once more for v0.3 ("Design re-read for the reviews") |
| 4 | The spec cites plan decisions D10, D13 and D14, which exist only in plan v0.3 (PR #89, not on this branch) | **Open, by design:** plan D11 — once PR #89 merges, `develop` is merged into this branch once, just before the pull request goes ready, and the references are checked then. Listed in the pull request as still open |
| 5 | RB-Q3 (a) would amend the Approved `data-model.md`; the plan's file table does not list it | **Fixed** (RB-Q3 (a), H14 (3)): if the owner answers (a), the edit is a separate commit, named in `data-model.md`'s Status line and in the pull request's description, so the merge visibly approves it |

### Design re-read for the reviews

Read on 2026-10-05 from the designer's Claude Design project, `Finance App.dc.html` (the Recurring Bills screen, its
layout values `L` and the bills script), for the values the reviews could not trace. Every value holds; the spec's
numbers are unchanged.

| Fact the spec states | Live design |
|---|---|
| 2.6: the Total Bills label and total 11 px apart | `gap: 11px` between "Total Bills" and the total |
| 2.6: Summary card padding 20 px, 20 px between the heading and the rows | `padding: 20px; gap: 20px` |
| 2.9: list card padding 32 px (24 px 20 px below 768 px), 24 px between the toolbar and the rows | `padding: L.cardPad` (`32px`; below 768 px `24px 20px`), `gap: 24px` |
| 2.9: the row avatar 32 px at every width | `width: 32px; height: 32px` in both row layouts |
| 2.9: below 768 px, the avatar and the name 16 px apart | `gap: 16px` |
| 2.9: below 768 px, the search field beside the Sort button | `flex: 1; max-width: 100%` beside the button, `gap: 24px` |
| 2.13: desktop two columns 24 px apart; the left column 337 px, its cards 24 px apart and as tall as the list card; tablet the two cards side by side | `gap: 24px`; `L.billsLeftW` `337px`; left column `gap: 24px`, `align-self: stretch`; `L.billsLeftDir` `row` on tablet, each card `flex: 1` |
| 2.4 and §9: the summary is over all bills, not the searched rows | `paidBills`, `upcoming` and `dueSoon` filter `BILLS`; only `billsView` applies the search |
| 2.7: no pagination | the Recurring Bills section has none (the Transactions section has) |
| RB-Q8: no tie-break | `billSortFns` compares only the day, the name or the amount |

## The drafting agent's own check (not a review)

Before the briefs were written the agent re-read the spec against its sources. This does not replace the
independent reviews; it is listed so that the reviewers can see what was already changed.

| # | Found | Handling (v0.1.1) |
|---|---|---|
| 1 | 2.3 called the lenient/strict split "a decision you may override" in §9's decisions list, but §9 asks it as RB-Q7 | 2.3 now points to RB-Q7 |
| 2 | The header named NFR-A8, which the body never uses | removed from the header (reversed in v0.3: review 1 #7 showed that 2.13 uses A8's "no horizontal scroll") |

## Design source

The draft (v0.1, v0.1.1) read its design facts from the designer's export of 2026-10-04 22:17 (the Recurring Bills
screen of `Finance App.dc.html`, `Style Guide.dc.html`, the designer's changelog). That export was stale: its changelog
ended at §6 and lacked §8 (WCAG 2.1 AA fixes) and §9 (page titles, the touch tooltip that stays open). The drafting agent
did not read the live project, because its brief named only the export; the placeholder colour, the avatars and the
tooltip were taken from `transactions.md` (Approved), which had read those sections.

On 2026-10-05, after the owner gave access to the designer's live Claude Design project for this session, the
controller asked for a re-read. It is recorded below and applied in v0.2.

## Design re-read (live)

Read on 2026-10-05 from the designer's Claude Design project: `Finance App.dc.html` (the Recurring Bills screen — the
summary cards, the toolbar, the rows at 768 px and up and below, the empty text — the shell around it, the bills
script: `BILLS`, `billSortFns`, `billsView`, `billsSummary`, the layout values), `Style Guide.dc.html` (the
Accessibility, Tooltip and Shadow sections) and the designer's changelog §1–§9 in full. Compared with the stale export
of 2026-10-04 22:17 and with every design fact v0.1.1 states.

| Fact | Stale export | Live | What the spec does now (v0.2) |
|---|---|---|---|
| Layout: left column 337 px on desktop (Total Bills above Summary), side by side on tablet, Total Bills' icon beside its text below 768 px; prototype switches at 768 and 1100 px | as stated | unchanged | unchanged (2.13); the 1100 px switch stays a departure (2.14) |
| Total Bills card: padding 32 px (24 px 20 px on mobile), icon 40 px, 32 px gap, label 14 px, total 32 px bold | as stated | unchanged | 2.6 now states the paddings and gaps |
| Summary card: padding 20 px, `<h2>` 16 px bold, rows 16 px 0, label 12 px, value 12 px bold, grey-100 lines; Paid Bills and Total Upcoming grey-500, Due Soon red; values "{count} ({amount})" | as stated | unchanged | unchanged; 2.6 adds the paddings and says the whole Due Soon row is red |
| List tracks | `1fr 120px 100px`, 32 px gap | unchanged | 2.9 said "`minmax(0, 1fr)` … (the design's)"; now: the design's `1fr`, written `minmax(0, 1fr)` so a long name is cut (as Transactions) |
| Header row 12 px 16 px, preset 5 grey-500; rows 20 px 16 px; mobile rows 20 px 0, two lines 8 px apart | as stated | unchanged | 2.9 adds the mobile paddings |
| Search: placeholder "Search bills", max width 320 / 215 / 100 %, height 45 px, magnifying glass at the right | as stated | unchanged | unchanged |
| Search placeholder colour | beige-500 (the helmet's `input::placeholder`) | grey-500 (`input::placeholder`, changelog §8a) | 2.5 says the design now draws grey-500 too; 2.14's row no longer lists it as a departure |
| Search input `outline: none`; hover border grey-900 | both | `outline: none` removed (§8b); hover still grey-900 | the focus ring is now the design's too (2.13); hover grey-500 stays a departure (tokens, `transactions.md` 2.12) |
| Focus indicator | none | `:focus-visible` 2 px grey-900, 2 px offset; white on dark (§8b) | 2.13 says the design draws it; 2.14's "No focus indicator" row is gone |
| Sort trigger: "Sort by" label, 114 × 45 px, panel 114 px under the right edge, `--shadow-popover`, current option bold | as stated | unchanged | 2.8 states the sizes and the bold current option |
| Sort triggers' attributes (`toggleBillSort`, two triggers) | none | `aria-haspopup="listbox"`, `aria-expanded`; Escape closes and returns focus to the trigger (§8e) | 2.8 says the `Menu` does the same and adds `role="option"`, `aria-selected` and the arrow keys; 2.14's menu row re-worded |
| Mobile sort button | 20 × 20 px, `aria-label="Sort"` | the same, plus `aria-haspopup` and `aria-expanded` | 44 px and "Sort by: {current}" stay (2.8, 2.14) |
| Sort order (`billSortFns`) | no tie-break; ties keep the fixed list's day order | unchanged | the spec's A to Z tie-break changes the order the design shows (Aqua before Spark in Highest and Lowest, the design Spark before Aqua): **new §9 RB-Q8**; the tie-break leaves the "decisions" list; 2.4, 2.14 and 4.3 point to it |
| Status marks: paid green due text + green check-circle; due soon red warning-circle + red amount; upcoming nothing; 16 px icons, 8 px gap | as stated | unchanged (the icons still have no name) | unchanged; the hidden status text stays (RB-Q1) |
| Avatars | `div` with `role="img"`, no name | `div` with `aria-hidden="true"` (§8c) | 2.9 and 2.14: decorative in both; the spec's `<img alt="">` is the same for a screen reader |
| Names | `data-tip`, one line, "…"; the tooltip had `pointer-events: none` and closed after 3 s on touch | the same names (§6d); the tooltip is hoverable (§8f, no `pointer-events: none`) and has no touch timer (§9b) | 2.9 says the design's tooltip now matches `transactions.md` 2.9 |
| Empty text | "No bills match your search." (full stop), 48 px 16 px, 14 px grey-500 | unchanged | unchanged; the appendix's text without the full stop stays (2.14); no "no bills at all" screen, so RB-Q2 stays |
| Page title | not set by the export | "Personal Finance - Recurring Bills" (`PAGE_TITLES`, §8c, §9a) | 2.1 states it (`app-shell.md` 2.5 already says so, and the placeholder page has it); 2.15 and the E2E row add it |
| Skip link, `<main id="main">`, labelled navigation | absent | "Skip to content", `main` focusable, `nav aria-label="Main"` (§8c) | 2.13's walkthrough cites it; the shell's (`app-shell.md`) |
| Search box label, hidden status text, status line | none | none | RB-Q1 unchanged |

**What the live source raised for §9.** One new question, RB-Q8 (above). No changelog proposal that touches this page
is still waiting on an approved document: the placeholder rule is `transactions.md` 2.5 plus H11 (6) for
`design-tokens.md`; the focus ring is the tokens' focus indicator; the page title is `app-shell.md` 2.5; the dropdown
attributes and the avatars are `transactions.md` 2.8 and 2.9; the tooltip is `transactions.md` 2.9 (its §9 Q5). No
question RB-Q1 to RB-Q7 was settled by the live design.

## Design re-read for v0.6 (the designer's changelog §12–§16)

Read on 2026-10-05 from the designer's Claude Design project: the designer's changelog §12–§16 (it had changed
since v0.5: §15 and §16 are new, and §14's status now reads "accepted by the owner") and, in `Finance App.dc.html`,
the Recurring Bills toolbar and `renderVals()`. Process (governance, owner 2026-10-05, recorded in PR #94): a design
question goes to the owner, the owner discusses it with the designer, the designer records the decision in the
designer's changelog, and the agent applies the recorded decision, citing its section.

| Changelog section | Live design | What the spec does (v0.6) |
|---|---|---|
| §16c (with §14): the content-width two-column layout is accepted; Recurring Bills ≥ 961 px content width; container queries on the content area; breakpoint tokens "a separate decision" | `cw = s.w - (s.sidebarMin ? 88 : 300) - 80`; `billsTwo = isDesktop && cw >= 961`; `billsLeftDir: !isMobile && !billsTwo ? 'row' : 'column'`; `billsLeftW: billsTwo ? '337px' : '100%'` | **RB-Q9 answered (b)**: 2.13 rewritten (two columns from a content width of 961 px by `@container` on `main`; stacked with the summary cards in a row from 768 px; below 768 px unchanged, still a window query); 2.9 (the list card's widths); 2.14 (the §14 row "No longer a departure"; a row for the shell's 1024 px against the design's 1100 px); §7 (E2E at content widths below and from 961 px, sidebar expanded and collapsed). 961 px is written as a number: no token is invented |
| — (the v0.5 caveat) | — | Checked: content ≥ 961 px from a 1341 px window (sidebar expanded) and 1129 px (collapsed); a tablet window (768–1023 px, no sidebar) has at most 943 px. The list card is ≥ 600 px beside the summary and ≥ 644 px stacked at a desktop window, against the table's 380 px, so the 1024–1120 px overflow is gone; the caveat is removed and the 380 px fact kept (2.13) |
| §15b: the toolbar triggers back to 45 px | the Bills Sort trigger `height: 45px`, its panel `top: 53px` (8 px under it) | 2.8 says it matches the design; 2.14's 47 px row is removed |
| §15a: "Amount must be greater than 0" | the modal's `errs.amount` | none: the page has no form |
| §15c, §15d: Style Guide field samples at 47 px; placeholder grey-500 | — | none: the search field is a 45 px toolbar control with a grey-500 placeholder already (2.5, 2.9) |
| §16a: a field's message clears as soon as the user types | the modal's `updateModal()` | none: the page has no field message (2.13, US-31 does not apply) |
| §16b: the modal's backdrop scrolls, the panel never clips | — | none: the page has no modal |
| §12a, §12b: `--opacity-unavailable`; `--filter-menu-max-height` with a wording-only `transactions.md` 2.8 amendment | — | none: a modal's swatch and the Transactions Category menu; this page's Sort menu has no maximum height |

The shared container rule (the content area as a size container, and Overview's 1060 px) is amended in `overview.md`
and `app-shell.md` by the app-shell.md amendment, own pull request; the spec cites it and edits neither document.
Budgets' 952 px is for `budgets.md`.
