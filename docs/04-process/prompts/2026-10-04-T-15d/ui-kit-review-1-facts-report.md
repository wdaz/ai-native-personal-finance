# Report — ui-kit review 1 (T-15d S1b)

As returned by the read-only Opus reviewer for commit 1cf0c9d685cfc4ef8709d529420794b2931bb6f8.

I reviewed `docs/03-specs/ui-kit.md` **v0.3** at 1cf0c9d (the brief names v0.1, so this is the current version). I checked it against the repository, the specs and ADRs it cites, `ui-kit-figures/` and the "Design re-read (live)" table. I found 8 issues: none is a blocker, 3 are important and 5 are minor.

### Findings

**1. Important: the cited plan v0.3 is not in the branch or on develop**
- **Spec says:** "Plan: `docs/04-process/plans/2026-10-04-T-15d.md` v0.3, Task S1b ("Owner's amendment (v0.3)", D10–D14)". §9 cites "plan D13", H13 (5) cites "plan D14", and the handling file says "Plan D14 applied".
- **Source:** `docs/04-process/plans/2026-10-04-T-15d.md:3` reads "Draft v0.2" both in this branch and in the develop checkout. Neither copy has "Owner's amendment", S1b or D10–D14. They exist only in the `T-15d-plan-v0.3` worktree (lines 51–96).
- **Fix:** merge plan v0.3 into develop and then merge develop into this branch before it goes ready. Otherwise the header and H13 should cite the plan's pull request instead of the file.

**2. Important: UK-Q4 says two tokens share a value with the six; there are four**
- **Spec says:** "Reuse the two tokens that already hold the same numbers (560 px, 150 ms)". The 200 ms and 300 px rows name no existing token.
- **Source:** `design-tokens.md:117` has `--duration-sidebar` = 200ms and `design-tokens.md:84` has `--sidebar-width` = 300px. These sit beside `--auth-card-max-width` 560px (:97) and `--duration-hover` 150ms (:118).
- **Fix:** name all four same-number tokens in the table, the way the 560 and 150 rows already do. Reword option (b) so it is a real choice for the owner.

**3. Important: `Field` needs a fourth prop for pre-filled edit forms**
- **Spec says (2.5):** "`Field` gains three props (a build note): a leading adornment, a `placeholder` and an `inputMode`". It also says edit forms are "Pre-filled … `formatAmountInput(cents)`".
- **Source:** `src/ui/Field.tsx:4-20` has no `defaultValue` or `value` prop, and the input is uncontrolled (`Field.tsx:27-30`, lines 56-68).
- **Fix:** add `defaultValue` to the build note (four props), in 2.5 and §6.

**4. Minor: the `Menu` change conflicts with "used, not changed"**
- **Spec says:** 2.2 has a build note that `Menu` "stops the key there" (Escape). 2.6 says the select's options "fill the field's width" with "the same 150 ms fade". §6 says "Used, not changed: `Menu` and `TruncatedText`".
- **Source:** `transactions.md:95-98` (Approved) says nothing about stopping Escape from propagating. Its panels are "anchored under the trigger's right edge" with fixed widths, and it gives no fade.
- **Fix:** list `Menu` under "Changed" in §6 (Escape stops propagating; panel width and fade passed by `SelectField`). Alternatively, say these are props of `Menu` that `transactions.md` 2.8 leaves open.

**5. Minor: the `PageHeader` desktop rule needs a CSS build note**
- **Spec says (2.8):** "renders it first in its actions group … At 1024 px and up it is the group's only item."
- **Source:** `src/ui/PageHeader.module.css:22-26` sets `.compactActions { display: none }` at ≥ 1024 px, which hides the whole group. As written, the button would disappear on desktop.
- **Fix:** add a build note: at ≥ 1024 px, hide the indicator and "Log out" one by one, not the group.

**6. Minor: the `maxLength` reason uses an input that is refused**
- **Spec says (2.5):** "the longest valid text, `-$999,999,999.99`, has 16 characters".
- **Source:** `output.txt:56` gives `"-$5" -> too_small`, so a leading `-` is never accepted. The longest accepted text without leading zeros is `$999,999,999.99`, which has 15 characters (`output.txt:47`).
- **Fix:** say "the longest text the grammar reads to a code other than `invalid_format`". Or use `$999,999,999.99` (15).

**7. Minor: the modal's height cap does not match its edge gap**
- **Spec says (2.2):** "kept `--spacing-500` from the viewport's edges (`--spacing-200` below 768 px), at most the viewport's height minus `2 × --spacing-200`".
- **Source:** the handling table gives "overlay padding 40 / 16". At 768 px and up, the cap should be minus `2 × --spacing-500`.
- **Fix:** make the cap follow the edge gap at each width.

**8. Minor: `transactions.md` still lists budgets.md and pots.md as the direct users of `Menu`**
- **Source:** `transactions.md:90` says "`recurring-bills.md`, `budgets.md` and `pots.md` cite this section". `transactions.md:289` says "its other uses are `recurring-bills.md`'s, `budgets.md`'s and `pots.md`'s". The form fields now use `Menu` through `ui-kit.md` 2.6.
- **Fix:** optional. Name `ui-kit.md` 2.6 in the same v1.0.13 amendment, or leave it as is; it is not wrong in substance.

### Notes (not findings)
- **Figures:** UK-Q5's "2.9 : 1" and "3.4 : 1" are correct roundings of 2.93 and 3.44 (`output.txt:90, 92`).
- **Trimming in `figures.py`:** line 68 trims an explicit list of characters, while `String.prototype.trim` in `figures.ts` trims every Unicode space. No input in the list depends on the difference, so the output is the same. A short comment in `figures.py` would record this.
- **Not run:** I could not run `figures.py`. I re-derived the seed lines, the grammar results, the pre-fill values and four of the contrast ratios (5.55, 4.73, 2.93, 3.44) by hand, and all match `output.txt`.

### Claim groups found fully correct
- **Group 1, except finding 3 (`Field` props) and finding 5 (`PageHeader` CSS).** All other named files, symbols and props are correct: the `Button` primary look and full width, `Field`'s label preset, live region and `aria-describedby`, `MAIN_CONTENT_ID` and focus to `<main>`, `CloseCircleIcon`, the `ThemeBar` `data-theme` selector, `themeVar`, the `globals.css` focus ring, `money.ts` holding formatters only, the `COPY` keys, the order of `CATEGORIES` and `THEMES`, `TOOL_ERROR_CODES` without `busy`, no `bus.ts`, the ESLint layer rules, and jsdom chosen per file.
- **Group 2, except finding 2 (UK-Q4).** All named tokens exist with the stated values. "Component states" (input hover grey-500, destroy at 80 %) is correct, and the icons `dots-three-outline`, `caret-down` and `check-circle` are listed.
- **Group 3: correct.** The stories and ACs, NFR-A1 to A8, W5, W6 and S7 (used the same way as `write-path.md:90`), R-16, R-17, R-18, and ADR-0002, 0003, 0004 and 0006 say what the spec says they say.
- **Group 4, except finding 4 (`Menu`).** `write-path.md` (2.7, 2.8, 2.11 (2) and (4), §3, §6, 4.1, §9 Q5), `transactions.md` (2.8, 2.9, §9 Q1 and Q2), `app-shell.md` (2.5, 2.6, §4), `webmcp-tools.md` (2.3, 2.5, §4) and `release-2-handoffs.md` (H3, H10, H11 (2) and (6), H12, H13) are cited accurately.
- **Group 5: correct.** Every figure in 4.1–4.4 and UK-Q5 is in `output.txt`. `figures.py` mirrors `figures.ts` (same inputs and rules; `seedRows`, `toCents` and the label map agree with `seed.ts`).
- **Group 6: correct.** `transactions.md:91`, its Status line and the v1.0.13 changelog entry are right. No document still says `pots.md` specifies the "…" menu, apart from the historical review records in `prompts/`.
- **Consistency with the "Design re-read (live)" table: correct** for every row the spec uses (modal, "…" menu, select, delete dialog, header button, colours, hit area, departures, UK-Q5 and UK-Q6).
