# T-26 — how the review's findings were handled

| # | Decision | What changed |
|---|----------|--------------|
| 1 | Fixed | The poll sorts the names. The order observed in Chromium was already alphabetical (the earlier failure printed it so), but nothing promises it, so the test no longer depends on it. |
| 2 | Fixed | An issue under no `amount` goes to the form's error area ("Something went wrong"); the field stays valid and is not focused. Unit test added. |
| 3 | Fixed | A 400 under no field shows "Something went wrong" in the form's error area. Unit test added. |
| 4 | Comment fixed | `PotsBoard`'s comment says an agent's write refreshes through `PotsTools`, with no `aria-busy`, as Budgets does. The behaviour matches `pots.md` 2.8, which gives `aria-busy` to the page's own writes. |
| 5 | Kept | The two wrappers differ only in their name sets; a shared helper would touch T-24's merged code, so it is left for a later clean-up. |
| 6 | Fixed | `submitForm` answers `gone` with no form open, as `submitMoney` does. |
| 7 | Kept | Moving the types to `src/shared` would change T-25's domain module; the ui copy is two small type aliases. |
| 8 | Kept, checked | The idle notice is visually hidden and out of the flow; the full Chromium E2E suite (every page's layout and axe checks) passed after the change. |
| 9 | Fixed | `tokenColour` resolves `tokens.css` from the script's own URL. |
