# Third-party notices

`LICENSE` covers this repository's own code and documents. The material below is not the licensor's
and keeps its own terms. `tests/unit/licence.test.ts` fails if a `.tsx` file under `src/` whose header
says it draws a challenge asset or a Phosphor icon is missing from this list, and if any other path
named in that test is missing. A third-party file anywhere else is listed here by hand.

## Frontend Mentor challenge material

© Frontend Mentor (https://www.frontendmentor.io), from the
[Personal finance app challenge](https://www.frontendmentor.io/challenges/personal-finance-app-JfjtZgyMt1),
used under the Frontend Mentor licence (https://www.frontendmentor.io/license). The challenge's design
files are not included in this repository.

| Path                                            | What it is                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `public/avatars/`                               | the 30 avatar images of the starter                                          |
| `public/images/illustration-authentication.svg` | the login illustration of the starter                                        |
| `docs/00-discovery/inputs/data.json`            | the starter's seed data                                                      |
| `prisma/data.json`                              | a byte-identical copy of it, read by the seed                                |
| `docs/00-discovery/inputs/challenge-brief.md`   | the starter's README, the functional brief                                   |
| `docs/02-architecture/design-tokens.md`         | the design values (colours, type, spacing) taken from the challenge's design |
| `src/ui/tokens.css`                             | the same values as CSS custom properties, generated from `design-tokens.md`  |
| `src/ui/Logo.tsx`                               | the starter's `logo-large.svg` and `logo-small.svg`, drawn inline            |
| `src/ui/icons/EyeIcon.tsx`                      | the starter's `icon-show-password.svg`, drawn inline                         |
| `src/ui/icons/EyeSlashIcon.tsx`                 | the starter's `icon-hide-password.svg`, drawn inline                         |
| `src/ui/icons/MinimizeMenuIcon.tsx`             | the starter's `icon-minimize-menu.svg`, drawn inline                         |
| `src/ui/icons/NavBudgetsIcon.tsx`               | the starter's `icon-nav-budgets.svg`, drawn inline                           |
| `src/ui/icons/NavOverviewIcon.tsx`              | the starter's `icon-nav-overview.svg`, drawn inline                          |
| `src/ui/icons/NavPotsIcon.tsx`                  | the starter's `icon-nav-pots.svg`, drawn inline                              |
| `src/ui/icons/NavRecurringBillsIcon.tsx`        | the starter's `icon-nav-recurring-bills.svg`, drawn inline                   |
| `src/ui/icons/NavTransactionsIcon.tsx`          | the starter's `icon-nav-transactions.svg`, drawn inline                      |

## Open-source components

### Phosphor Icons — MIT

| Path                              | Icon                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `src/ui/icons/SignOutIcon.tsx`    | `assets/fill/sign-out-fill.svg`                           |
| `src/ui/icons/JarIcon.tsx`        | `assets/fill/jar-fill.svg`                                |
| `src/ui/icons/SearchIcon.tsx`     | `magnifying-glass`, as the design export draws it         |
| `src/ui/icons/CaretDownIcon.tsx`  | `caret-down`, as the design export draws it               |
| `src/ui/icons/CaretRightIcon.tsx` | `caret-right`, as the design export draws it              |
| `src/ui/icons/SortIcon.tsx`       | the style guide's `sort`, as the design export draws it   |
| `src/ui/icons/FilterIcon.tsx`     | the style guide's `filter`, as the design export draws it |

From https://github.com/phosphor-icons/core (the last five through the designer's Claude Design export, `components/icons/icon-data.js`, read 2026-10-10, T-19); the notice and licence below are its `LICENSE` file as of
commit `6cb9423` (2023-01-08), read 2026-09-29.

```text
MIT License

Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Public Sans — SIL Open Font License 1.1

`app/fonts/public-sans-latin-400-normal.woff2` and `app/fonts/public-sans-latin-700-normal.woff2`:
Copyright 2015 The Public Sans Project Authors (https://github.com/uswds/public-sans). The licence
text is `app/fonts/OFL.txt`; the files' source and hashes are in `app/fonts/README.md`.

## Recorded source, no third-party licence

`src/ui/icons/CloseCircleIcon.tsx` — the close control of the Claude Design prototype's modals
(`closeCircle`, drawn inline there). It is not a Phosphor file and not one of the Frontend Mentor
design's icons (`docs/02-architecture/design-tokens.md` v1.3).
