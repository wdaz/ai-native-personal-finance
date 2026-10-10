# Hotfix 2 — the designer agent's live read (plan Q2 (b))

The owner answered the plan's Q2 with (b) on 2026-10-10: the design is read live before any code. The cloud
thread session has no Claude Design tools, so it wrote the prompt below, and a Claude Code session on the
owner's Mac, started from the project thread, sent it to the designer agent in *propose* mode. Nothing was
written to Claude Design or to the repository. The report follows the prompt, word for word as that session
relayed it.

## The prompt

    Read-only. Change no file, commit nothing, write nothing to Claude Design.

    Dispatch the designer agent (`designer-agent:designer`) in **propose** mode with this question:

    Read the designer's changelog §6d and the live Overview screen in `Finance App.dc.html` (and `Style Guide.dc.html`, "Tooltip"). For each point below, say "matches the spec" or give the difference with the design's exact values and the changelog section:

    - (a) Overview Pots summary's pot names: one line, cut with "…", with the custom tooltip? Any size or width rule?
    - (b) Overview Transactions card's names: the same question.
    - (c) The donut against `overview.md` v1.3 §2.7 and §4.4: outer ring 24 px at r 96, inner ring 12 px at r 78 at opacity 0.75, beige-100 empty ring, SVG 240 px.
    - (d) The Overview grid against `overview.md` v1.2 §6 and `app-shell.md` v1.5 §2.9: two columns from a content width of 1060 px, a 608 px left column, a 24 px gap.
    - Also: the tooltip's look and behaviour against `transactions.md` 2.9.

    Then paste the designer agent's report, word for word, into the project thread "Hotfix 1 və 2".

## The designer agent's report

MODE: PROPOSE. I wrote nothing to Claude Design or to the repository.

Sources I read live in the designer's Claude Design project:
- CHANGELOG.md (§6, §6d, §8c, §8f, §9b, §12a, §14, §16c).
- "Finance App.dc.html": Overview template lines 208–284; `donut()` near line 1000; `renderVals()` layout lines ~1030–1062; the `_tip*` logic; the `#app-tip` markup at line ~750.
- "Style Guide.dc.html": the "Tooltip" section, lines ~186–222.

Repository files read: `overview.md` (v1.3), `app-shell.md` §2.9 (v1.5), `transactions.md` §2.9 and `release-2-handoffs.md` H12/H17/H18. All the section numbers you cited exist in the files.

QUESTION: Does the live Overview design match the repository specs on five points (a)–(e)? This is the hotfix 2 check before code, from owner answer Q2 (b).

### (a) Overview Pots summary: pot names

The design (changelog §6d, row "236"; Finance App line 236) draws the name like this:
- One line: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.
- `data-tip="{{ p.name }}"`, so the shared custom tooltip applies.
- 12px, line-height 1.5, weight 400, grey-500 `rgb(105,104,104)`.
- The value under it is 14px bold and is never cut.

There is no fixed width or max-width rule. The width comes from the layout:
- Grid `repeat(2, minmax(0, 1fr))` with a 16px gap.
- Each cell is a 4px bar, then a 16px gap, then a text column with `min-width: 0` and a 4px gap between name and value. The cell has `min-height: 43px`.
- The "Total Saved" tile beside it is 247px wide (`auto` on mobile, where it stacks above the grid). The gap between tile and grid is 20px.
- Derived, not a rule: at the 608px desktop column the name has about 110px.

Against the spec: **difference.** `overview.md` §2.3 says nothing about cutting or a tooltip; it says only "name / `$159.00`" in a 2×2 grid. H12 already says this needs an `overview.md` amendment before code. That is an amendment of an Approved document, so the owner approves it.

### (b) Overview Transactions card: names

The design (changelog §6d, row "254"; Finance App line 254) draws the name like this:
- One line, `nowrap` / `overflow: hidden` / `ellipsis`, and `data-tip="{{ t.name }}"`.
- 14px bold, line-height 1.5, grey-900 (inherited).

Again there is no fixed width rule. The width comes from the row:
- The row is `justify-content: space-between` with a 16px gap and 20px 0 padding.
- The left group (40px avatar, 16px gap, name) has `min-width: 0`.
- The right group (amount over date, 8px gap) has `flex-shrink: 0`, so only the name gives way.

Against the spec: **difference.** `overview.md` §2.4 fixes "name (preset 4 bold)", which matches the look, but says nothing about cutting or the tooltip. The same H12 amendment covers it.

Side finding in the same row:
- `overview.md` §2.4 says the avatar has "`alt` = name".
- The design hides it from assistive technology (`aria-hidden="true"`, changelog §8c), and `transactions.md` §2.9 uses `alt=""` for this reason.
- This is also an Approved-document point for the owner.

### (c) Donut, against `overview.md` §2.7 and §4.4 (v1.3)

**Matches the spec.** In `donut(budgets, spentBy, 240)` (Overview passes 240 at every viewport):

| Part | Design value |
|---|---|
| Outer ring | r = 240 × 0.4 = **96**, stroke 240 × 0.1 = **24** |
| Inner ring | r = 240 × 0.325 = **78**, stroke 240 × 0.05 = **12**, each segment `opacity 0.75` in its theme colour |
| No budgets | one circle at r 96, stroke 24, stroke beige-100 `rgb(248,244,240)`, no inner ring |
| SVG | width = height = 240, `viewBox 0 0 240 240`, rotated −90° so segments start at 12 o'clock |

Two more details the spec does not hand to hotfix 2:
- The segments transition `stroke-dasharray` / `stroke-dashoffset` over 0.4s ease. That is S45-4, which comes with the first Budgets build task, not H18.
- The centre text is about 32px bold grey-900, with 12px grey-500 under it.

One fix is needed in my changelog, not in the design: §12a still says the Overview inner ring "uses its own 25% `color-mix`". That has been out of date since `overview.md` v1.3, and the drawn file is correct.

### (d) Overview grid, against `overview.md` §6 (v1.2) and `app-shell.md` §2.9 (v1.5)

**Matches the spec.** In `renderVals()`:
- `cw = s.w - (s.sidebarMin ? 88 : 300) - 80`, the same formula as `app-shell.md` §2.9.
- Two columns when `ovTwo = isDesktop && cw >= 1060`.
- Left column: `leftColW: '608px'` and `leftColFlex: '0 0 608px'`.
- Gap between the columns: **24px**. The right column is `flex: 1; min-width: 0`.
- Below the threshold the cards stack in the order Pots, Transactions, Budgets, Bills, as the spec says.

Two notes, neither a difference in what is drawn:
1. **Desktop threshold.** The design's desktop mode starts at a 1100px window; `app-shell.md` uses 1024px. This cannot change the Overview grid: a content width of 1060px needs at least a 1228px window.
2. **Columns versus grid rows.** The design draws two independent flex columns: Pots over Transactions, and Budgets over Bills. The spec writes a grid with row placement: Pots row 1, Transactions rows 2–3, Budgets rows 1–2, Bills row 3. In the design, Bills always sits 24px under Budgets. In a row grid, Bills' top follows the row lines, so with some content heights it can sit lower than drawn. Matching the design's look is an implementation choice for the code, not a design change.

### (e) Tooltip, against `transactions.md` §2.9

**The Finance App tooltip matches the spec on every value and behaviour** (`#app-tip`, changelog §6b, §6c, §8f, §9b).

Look:
- Fill `rgb(32,31,36)`; white text 12px/1.5, weight 400; padding 8px 12px; radius 8px.
- `max-width: min(240px, calc(100vw - 32px))`, with `overflow-wrap: anywhere`.
- Arrow is an 8×8 square rotated 45°, 4px outside the edge. Its left edge sits 16px right of the name's start, clamped to 12–220px.
- No shadow; `position: fixed`; `z-index: 1000`.

Placement:
- Above the name: y = top − 8 with `translateY(-100%)`.
- Below the name (y = bottom + 8) when `r.top < 72`.
- x is clamped to 16px from the viewport edges.

Behaviour:

| Input | Design |
|---|---|
| Mouse | opens after 400ms; the pointer can move onto the tooltip (no `pointer-events: none`); hides 150ms after leaving, cancelled if the pointer returns to the name or tooltip |
| Touch | a tap toggles it; a tap elsewhere closes it; no timer |
| Keyboard | opens on focus; Esc closes; blur closes (except after touch) |
| Any | closes on scroll (captured) and on resize |

Accessibility hooks:
- Only cut names (`scrollWidth > clientWidth + 1`) get `tabindex="0"`.
- `aria-describedby="app-tip"` is set only while the tooltip is open.
- `role="tooltip"`.

The design's cut test allows 1px more than the spec's `scrollWidth > clientWidth`. That is harmless.

**Differences inside the design itself.** These are stale text in my Style Guide, not differences against the spec:
1. The "Mouse" rule says "closes when the pointer leaves". It is missing §8f: the tooltip stays open while the pointer is on it, then hides after 150ms.
2. The live demo `#sg-tip` still has `pointer-events: none`.
3. The "Keyboard" rule names Esc but not blur.

The spec follows the changelog and the Finance App, so it is correct. Only the Style Guide is out of date.

**44px tap target.** `transactions.md` §2.9 and the Style Guide's "Touch" rule both ask that a cut name's tap target be at least 44px tall. The Overview drawing does not show it: the Pots name is 18px tall and the Transactions name 21px. How to reach 44px without moving the layout is not mine to decide. It belongs in the spec's departures table, with the Style Guide "Touch" rule and NFR-A1 as its source.

### OPTIONS
1. Change nothing in the design. Points (c), (d) and (e) already match. (a) and (b) need an `overview.md` amendment, which is the owner's.
2. Option 1, plus fix the stale text in my own sources: the changelog §12a donut sentence, and the Style Guide Tooltip "Mouse" and "Keyboard" rules and the demo's `pointer-events: none`. This changes no value or behaviour.
3. Redraw Overview so the 44px tap target shows. I reject this: it is an accessibility addition and belongs in the spec.

### DECISION
Option 2. The design values stand, and the code for hotfix 2 can follow the Finance App as it is. Fixing the stale text stops the next reader of the Style Guide or §12a from building the old tooltip or the old inner ring.

**ESCALATE-TO-OWNER: amendment of an Approved document.** Two things in `overview.md` need the owner:
- §2.3 and §2.4 must gain the cut-name rule and the tooltip (H12).
- §2.4's avatar "`alt` = name" contradicts the design's `aria-hidden` (changelog §8c). This is a separate amendment for the owner to approve.

### CHANGES (only in APPLY, after the owner's approval)
- CHANGELOG.md, §12a: replace the "Not this token" sentence about the 25% `color-mix` with the v1.3 inner ring (12px, opacity 0.75), and say that `--opacity-unavailable` stays a separate token.
- "Style Guide.dc.html", Tooltip section:
  - "Mouse" text: "Opens after 400ms of hovering over the name. Stays open while the pointer is on the name or the tooltip; closes 150ms after it leaves both."
  - "Keyboard" text: "Opens on focus; closes on blur or Esc."
  - Remove `pointer-events: none` from `#sg-tip`.

### CHANGELOG ENTRY (DRAFT, not recorded)
"## 17. Stale text brought in line (no value changes). Decision: §12a's note on the Overview donut now describes `overview.md` v1.3's inner ring: 12px, theme colour at opacity 0.75. The `color-mix` tint is gone, and `--opacity-unavailable` stays a separate token. The Style Guide Tooltip rules and demo now follow §8f: the tooltip is hoverable, hides 150ms after the pointer leaves both the name and the tooltip, and the keyboard closes it on blur or Esc. The demo no longer sets `pointer-events: none`. Finance App unchanged."

## What the session did with it

- (c), (d) and (e) match the specs: Task B coded H17 and H18 word for word, and `TruncatedText` to
  `transactions.md` 2.9.
- (a) and (b): the `overview.md` v1.4 amendment, the first commit of #109 (plan Q1 (b)).
- Two points went to the owner as their own questions and are not part of hotfix 2: the avatar's `alt` in
  `overview.md` §2.4 against the design's `aria-hidden`, and the designer's option 2 (the stale text in its
  changelog §12a and the Style Guide's Tooltip section), which the designer applies only after the owner's
  approval.
- The 44 px tap target is built as `transactions.md` 2.9 states it (a `::after` on the cut name), with no change
  to the layout.
