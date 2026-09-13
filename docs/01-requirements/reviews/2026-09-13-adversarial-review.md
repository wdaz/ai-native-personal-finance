# Adversarial review — Requirements v0.2 (2026-09-13)

Reviewer: fresh agent session (Claude, no prior context), per `governance.md` "Reviewer" role.
Inputs: PRD v0.1, user stories v0.2, NFRs v0.2, problem statement v1.0, challenge brief, `data.json`, assumptions, WebMCP research note.
Disposition column filled 2026-09-13; "Fix" = agent applies without a decision, "Owner" = needs an owner decision, "Reject" = not accepted (reason in process log).

## Summary

The three requirement documents are broadly aligned with the brief, but they are not yet a safe hand-off to an implementing agent. One quoted seed figure is wrong (Pots Total Saved $850; `data.json` gives $920), the "2024 → 2026" time decision is recorded in OQ-4 but not propagated to the PRD §6, the approved problem statement or the story text, and US-03 sits in no release. The Release 1 scope is internally inconsistent: it requires all five read tools (including `list_transactions` with search/sort/page semantics) to "return exactly the data the UI shows" for pages that do not exist until Release 2. The stories' own convention ("every story lists ≥1 error or boundary criterion") is violated by a dozen stories, and several acceptance criteria defer to "the copy in Figma" even though the Figma file is by constraint never in the repo. WebMCP: the "unavailable" state, the lazy-loaded polyfill vs. "getTools() works on any page", the headless-native-mode test conflict, and what "server acts only after in-UI confirmation" technically means are all left for the implementer to guess.

## Findings

| Id | Severity | Location | Finding | Proposed fix | Disposition |
|----|----------|----------|---------|--------------|-------------|
| R-01 | Blocker | US-05 AC1 | "Total Saved $850". `data.json` pots sum to **$920.00** (159+110+110+10+531). $850 is the design mock figure; US-36 AC2 makes `data.json` the seed. | Change to "$920.00"; state "Total Saved = sum of all pot totals, not only the four displayed". | Owner → data.json wins · applied |
| R-02 | Blocker | PRD §5 R1 vs US-39 AC1 | Release 1 lists US-39, whose AC1 requires parameterised `list_transactions` / `list_recurring_bills` to match UI pages that only exist in Release 2. PRD names `get_overview_summary`, absent from US-39. | Split US-39 (R1: unparameterised read tools; R2: parameterised) or move to R2; make tool names consistent. | Owner → R1 = get_balance + get_overview_summary · applied |
| R-03 | Blocker | US-04 AC1 vs data.json | Expenses $1,700.50 ≠ sum of negative transactions ($1,699.75). Nothing says whether balance/income/expenses are stored or derived. | AC: stored values seeded from `balance`; only pot money moves change Current Balance; Income/Expenses never change. | Fix · applied |
| R-04 | Major | PRD §5 vs US-03 | US-03 (Log out) in no release. | Add to Release 1. | Fix · applied |
| R-05 | Major | PRD §6; PS §7; US-14, US-27 | OQ-4 (2026) not propagated: "2024" remains in PRD §6, problem statement §7, US-14 AC1, US-27 AC2. | Replace 2024→2026 everywhere; erratum line in problem statement §7. | Fix · applied |
| R-06 | Major | Stories header vs US-03/06/08/17/19/20/24/30/33/34/35/41 | Convention "≥1 error or boundary criterion" violated by 12 stories. | Add boundary ACs (see R-14…R-19, R-34…R-36) or drop the convention. | Fix · applied |
| R-07 | Major | US-01 AC2, US-31 AC1 | ACs defer to "copy in Figma"; the Figma file is never in the repo. | Add a copy table (field → message) sourced from `inputs/design/`; ACs reference it. | Fix · applied |
| R-08 | Major | US-21 AC1 | "one decimal, e.g. 7.95 %" is self-contradictory. | Two decimals, round half up. | Owner → two decimals · applied |
| R-09 | Major | US-11, US-30 | Sort tie-breaking undefined; bills Highest/Lowest on unsigned display ambiguous. | Define secondary keys; bills by absolute amount. | Owner → signed (tx) / absolute (bills) · applied |
| R-10 | Major | US-27 AC2 | Paid rule "before today" excludes a same-day transaction; date vs datetime comparison; which transaction's day is shown. | "Paid if any recurring tx in current month (calendar date)"; Due Soon if unpaid and day ≤ today+5; day shown = most recent recurring tx. | Fix · applied |
| R-11 | Major | US-14, US-15, US-18 | Whether income (positive) transactions count in Spent / Latest Spending. | Spent = abs sum of negatives in month; Latest Spending = last three regardless of sign. | Owner → Spent = negatives only; Latest = both signs · applied |
| R-12 | Major | US-33 AC1 | "tablet: top-tab sidebar" — verify against design exports (bottom bar with labels on tablet). | Verify and correct. | Fix · verified: bottom nav on tablet+mobile · applied |
| R-13 | Major | NFR-P3 vs US-38 AC1 / T8 | Lazy-loaded adapter vs "getTools() works on any page": no readiness signal. | Readiness contract (`toolchange` + `window.__webmcpReady`); E2E waits on it. | Fix · applied |
| R-14 | Major | US-41, NFR-W2, research §1 | "unavailable" state undefined; how "absent" mode is produced in tests. | Define states; `WEBMCP_MODE=native\|polyfill\|off` env flag. | Fix · applied |
| R-15 | Major | NFR-B2/T8 vs research F7 | Native path needs a headed tab; headless CI cannot exercise it. | Native verification = headed/manual runbook step; CI modes = polyfill / off. | Fix · applied |
| R-16 | Major | US-40 AC2, NFR-W5 | Server cannot distinguish a confirmed delete; missing cases (other page, dialog busy, abort, unknown id). | Decide client-side confirmation vs server token; add ACs. | Owner → client-side · applied |
| R-17 | Major | US-15/22/25, NFR-S3 | No upper bound on amounts; parsing rules undefined. | 0.01 ≤ x ≤ 999,999,999.99, two decimals; define parsing. | Owner → 999,999,999.99 · applied |
| R-18 | Major | US-16, US-23 | Edit: own category/theme/name must stay selectable; target below total; name uniqueness rules. | Add ACs. | Fix · applied |
| R-19 | Major | US-05, US-07 | "first four" — by what order; >4 behaviour; list order on pages. | Creation order (seed order); cards show first four; totals include all. | Fix · applied |
| R-20 | Major | US-13 vs T2/M2/G1 | US-13 has no AC. | Give it an AC. | Fix · applied |
| R-21 | Major | NFR-D4 vs P1/P2 | Cold-start host vs Lighthouse targets. | "Measured on a warm instance". | Fix · applied |
| R-22 | Minor | PRD header | Version/date stale. | Bump to v0.2 / 2026-09-13. | Fix · applied |
| R-23 | Minor | US-38 AC1 | Page-scoped vs global tool set left open. | Decide: global on every authenticated page. | Owner → **page-scoped** (against recommendation) · applied |
| R-24 | Minor | US-39 vs W3; US-40 | Missing `untrustedContentHint` on list tools; `consequentialHint` on delete. | Add. | Fix · applied |
| R-25 | Minor | US-39 AC2 vs US-38 | Session lifetime undefined; tools on login page? | Define lifetime; tools registered only after login. | Owner → 7 days sliding · applied |
| R-26 | Minor | US-40 | No stable ids for budgets/pots. | Server-generated ids; tools take `id`; `list_*` return ids. | Fix · applied |
| R-27 | Minor | US-09, US-12 | URL parameter names, out-of-range page, mobile ellipsis. | `?q=&category=&sort=&page=`; clamp; ellipsis rule. | Fix · applied |
| R-28 | Minor | US-10 AC1 | Keystroke vs submit; debounce vs T7. | Debounced ≤ 300 ms with `aria-busy`. | Fix · applied |
| R-29 | Minor | US-37, S4/D5 | Storage threshold value/unit; mid-action reset; log target. | Owner sets threshold; 409 + reload; name log. | Owner → 2,000 rows / 50 MB · applied |
| R-30 | Minor | T2 vs M2 | Three different story populations. | Align: 100 % of stories; non-UI via API tests. | Fix · applied |
| R-31 | Minor | B1 | "latest two versions" not measured. | Reword to what is measured. | Fix · applied |
| R-32 | Minor | W3 | "200 chars" ambiguous. | `maxLength` on every string input; descriptions ≤ 200. | Fix · applied |
| R-33 | Minor | W1 | `navigator.modelContext` fallback vs deprecation. | Drop the fallback. | Fix · applied |
| R-34 | Minor | US-06 | <5 / 0 transactions. | Add AC. | Fix · applied |
| R-35 | Minor | US-03 | Logout location; error case. | Sidebar footer; client-side always succeeds. | Fix · applied |
| R-36 | Minor | US-25/26 | >2 decimals; balance = 0; preview >100 %. | Add ACs and message text. | Fix · applied |

## Questions only the owner can answer

- `$920` (seed) or `$850` (design) for Pots total — does `data.json` always win over the design where they differ?
- Highest/Lowest: by signed amount (incomes first) or absolute value? Same for bills.
- Do income transactions count toward a budget's Spent and appear in Latest Spending?
- Are parameterised `list_transactions`/`list_recurring_bills` in Release 1 or 2?
- Tool set page-scoped or global?
- Delete confirmation: client-side only, or server-enforced token?
- Max values for amounts; storage threshold; session lifetime.
- Tablet navigation: bottom bar or "top-tab"?
- Log out location and release.
- Pot percentage precision.

## Numbers check

| Figure | Stated | Computed from data.json | Result |
|--------|--------|-------------------------|--------|
| Current Balance | $4,836.00 | 4836.00 (`balance.current`) | OK |
| Income | $3,814.25 | 3814.25 (= sum of positive tx) | OK |
| Expenses | $1,700.50 | 1700.50 stored; sum of negatives = 1699.75 | OK vs stored; MISMATCH if derived (R-03) |
| Pots Total Saved | $850 | 920.00 | MISMATCH (R-01) |
| Savings % | 7.95 % | 159/2000 | OK |
| Budgets limit / spent | $975 / $338 | 975 / 338 | OK |
| Entertainment | $15.00 / $35.00 | OK | OK |
| Dining Out | $133.00 of $75.00 / $0.00 | OK | OK |
| Recurring vendors | 8 | 8 (11 tx, 3 duplicates) | OK |
| Due Soon rows | Nimbus 21st $9.99, ByteWise 23rd $49.99 | OK | OK |
| Total / Paid / Upcoming / Due Soon | 384.98 / 4·190.00 / 4·194.98 / 2·59.98 | OK | OK |
| Transactions | 10 per page | 49 tx → 5 pages, last 9 rows | OK |
| Categories | 10 | 10 | OK |
| Latest overall tx | Emma Richardson 19 Aug | Savory Bites 19 Aug 20:23 is later (same date) | Note (R-10) |
