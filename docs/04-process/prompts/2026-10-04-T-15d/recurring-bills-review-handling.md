# How the recurring-bills reviews were handled (T-15d, S3)

Draft reviewed: `recurring-bills.md` v0.1 (`9b7776e`).

## The two read-only reviews (plan D7) — not yet run

The drafting session ran without the Agent tool: a `ToolSearch` for it on 2026-10-05 found only unrelated tools
(Vercel's agent-run readers, Notion's agent search). So the reviews of `governance.md` v1.1 and v1.3 (Opus, read only)
could not be sent from that session. Their briefs are written and ready to send as they are:

- `recurring-bills-review-1-facts-brief.md` — every file, symbol, line, token, requirement id and figure;
- `recurring-bills-review-2-spec-brief.md` — F7's checklist (`release-2-handoffs.md` §2), every acceptance
  criterion, the template's quality bar and S2's lessons (plan D14).

The `-report.md` files do not exist yet. When the controller runs the reviews, each report is saved word for word
next to its brief and every finding gets a row below, fixed or with a reason; the spec then moves to its next
version (v0.3; v0.2 is the live design re-read below). **The pull request stays a draft until then.**

## The drafting agent's own check (not a review)

Before the briefs were written the agent re-read the spec against its sources. This does not replace the
independent reviews; it is listed so that the reviewers can see what was already changed.

| # | Found | Handling (v0.1.1) |
|---|---|---|
| 1 | 2.3 called the lenient/strict split "a decision you may override" in §9's decisions list, but §9 asks it as RB-Q7 | 2.3 now points to RB-Q7 |
| 2 | The header named NFR-A8, which the body never uses | removed from the header |

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
