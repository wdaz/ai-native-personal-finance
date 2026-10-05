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
next to its brief and every finding gets a row below, fixed or with a reason; the spec then moves to v0.2. **The
pull request stays a draft until then.**

## The drafting agent's own check (not a review)

Before the briefs were written the agent re-read the spec against its sources. This does not replace the
independent reviews; it is listed so that the reviewers can see what was already changed.

| # | Found | Handling (v0.1.1) |
|---|---|---|
| 1 | 2.3 called the lenient/strict split "a decision you may override" in §9's decisions list, but §9 asks it as RB-Q7 | 2.3 now points to RB-Q7 |
| 2 | The header named NFR-A8, which the body never uses | removed from the header |

## Design source

The design facts were read from the designer's export of 2026-10-04 22:17 (the Recurring Bills screen of
`Finance App.dc.html`, `Style Guide.dc.html`, the designer's changelog). While the draft was being written, the
scratch copy of that export was marked stale: the note left beside it says the export lacked the designer's
changelog sections 8 (WCAG fixes: dropdown `aria-haspopup`/`aria-expanded`, placeholder grey-500, `:focus-visible`
rules and others) and 9 (page titles, the touch tooltip that stays open). The spec does not take those values from
the export: the placeholder colour, the avatars and the tooltip come from `transactions.md` (Approved), which read
those sections. The note also asked the agent to read the live project itself; the agent did not, because its brief
named only the local export. Every design fact is re-read from the designer's live source before the pull request
goes ready (the pull request's "Not yet checked").
