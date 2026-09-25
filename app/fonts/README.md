# app/fonts

Public Sans, served by `next/font/local` from `app/layout.tsx` (weights 400 and 700, latin
subset, `variable: "--font-public-sans"`). It replaced `next/font/google` in T-13c (TD-11,
`docs/03-specs/tech-debt.md`): that loader downloads the font while `next build` runs, so a
Google Fonts outage failed CI builds (PR #36) and would fail a Vercel deploy. `eslint.config.mjs`
forbids importing `next/font/google` in `app/` and in every `src/` layer except `server` (fixture:
`tests/fixtures/boundaries/app-imports-next-font-google.tsx.fixture`).

## Files

| File                                  | Weight | sha256                                                             |
| ------------------------------------- | ------ | ------------------------------------------------------------------ |
| `public-sans-latin-400-normal.woff2`  | 400    | `36274b5787b4f03b27e65ae971d6c808a96838ccd60c9dabaee154889b6bba82` |
| `public-sans-latin-700-normal.woff2`  | 700    | `dace741613696827f61dbee2d984e8685f14a2846136783f3ad1c8950914bf1d` |
| `OFL.txt` (the font's licence, below) | —      | `157a9e77f7580246e97c769490e2e977ae94399f9d30f4556015c41fe8c28bac` |

`tests/unit/fonts.test.ts` checks that every `.woff2` here is listed with its real hash, that
`app/layout.tsx` uses each one, and that `OFL.txt` is present.

## Source

- **Files:** `files/public-sans-latin-400-normal.woff2` and `…-700-normal.woff2` of the npm
  package [`@fontsource/public-sans`](https://www.npmjs.com/package/@fontsource/public-sans)
  **5.3.0** (published from `github.com/fontsource/font-files`; its metadata: Google Fonts
  version `v21`, last modified 2025-09-16), fetched 2026-09-24 with `npm pack`. The package is
  **not** a dependency of this project — the two files were copied once.
- **Font:** "Version 2.001" in both files' `name` table (`head.fontRevision` 2.001), Public Sans
  by the USWDS team (`github.com/uswds/public-sans`), a fork of Libre Franklin. Each file is a
  static instance of the family's variable font at one weight (`OS/2` `usWeightClass` 400 and
  700), latin subset. The family name inside the files is "Public Sans Thin", the name of the
  variable font's default instance (Google's own file says the same); the CSS family is the one
  `next/font/local` generates, so the name does not reach the page.
- **Not byte-identical to what `next/font/google` fetched.** Google serves one variable file for
  the latin subset (`fonts.gstatic.com/s/publicsans/v21/…`, 26 636 bytes, also "Version 2.001").
  These two files are the same design and version at the two weights the app uses, 14 632 and
  14 600 bytes.

## Licence

SIL Open Font License, Version 1.1 — `OFL.txt` is the text at tag `v2.001` of
`github.com/uswds/public-sans` (`OFL.txt`, unchanged there since commit `6317b0d`, 2021-11-01),
fetched 2026-09-24. That repository's `LICENSE.md` says GSA's modifications are CC0 and "users
of this Modified Version (Public Sans) should use Public Sans according to the terms of the SIL
Open Font License, Version 1.1".
Condition 2 of the OFL — every copy carries the copyright notice and the licence — is what
`OFL.txt` beside the files is for. T-16's third-party notices list the font.

## Replacing a file

Copy the new file, update the table above (source, version, hash) in the same commit, and
open the page at 320 px and 1440 px: `tests/unit/fonts.test.ts` fails until the hash agrees.
