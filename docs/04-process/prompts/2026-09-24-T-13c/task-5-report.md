# Task 5 report — TD-11: Public Sans from committed files

Status: DONE_WITH_CONCERNS (concerns are small deviations of measured numbers from the brief and two doc/scope observations; nothing blocks).

Commit: `3c57648` — `fix(build): serve Public Sans from committed files, not Google Fonts (TD-11)` on `task/T-13c-tech-debt`. Not pushed. 13 files, +305 / -7. `git status` clean afterwards; `package.json` / `package-lock.json` untouched.

## What was implemented

- `app/layout.tsx`: `publicSans` now comes from `next/font/local` (two `src` entries, 400 and 700, `style: "normal"`), still `variable: "--font-public-sans"` and `display: "swap"`, so `src/ui/tokens.css` is unchanged. `git diff origin/main -- app/layout.tsx` shows only that change.
- `app/fonts/`: `public-sans-latin-400-normal.woff2` (14 632 bytes), `public-sans-latin-700-normal.woff2` (14 600 bytes), `OFL.txt` (4 390 bytes), `README.md` (source, version, hashes, licence; text verbatim from the brief).
- `eslint.config.mjs`: `next/font/google` and `next/font/google/**` added to the `patterns` of the EXISTING `no-restricted-imports` block (with the explanatory comment); no second block.
- `tests/fixtures/boundaries/`: `app-imports-next-font-google.tsx.fixture` (violation) and `app-imports-next-font-local-allowed.tsx.fixture` (control); `tests/unit/boundaries.test.ts` gets one violation and one allowed entry; `tests/fixtures/boundaries/README.md` gets one row in each table.
- `tests/fixtures/fonts.ts` (`fontProblems(dir, layoutSource)`) and `tests/unit/fonts.test.ts` (4 tests), verbatim from the brief.
- `docs/02-architecture/design-tokens.md` v1.4: Status line, Changelog entry and the Typography heading, with no backticked double-dash name in the new text.

## RED / GREEN evidence

- **Step 1 (red, offline build on today's layout):** `env NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 NEXT_TELEMETRY_DISABLED=1 npx next build` exited 1: `next/font: error: Failed to fetch Public Sans from Google Fonts. If you are offline or behind a proxy, self-host the font with next/font/local, or set HTTP_PROXY/HTTPS_PROXY so Next.js can reach fonts.googleapis.com.` Import trace ended at `./app/layout.tsx` (via `[next]/internal/font/google/public_sans_24b30443.module.css`).
- **Step 2 (red):** `npx vitest run tests/unit/boundaries.test.ts` -> `1 failed | 45 passed`; the failure is `app/imports-next-font-google.tsx reports no-restricted-imports`, `expected [] to deeply equal [ 'no-restricted-imports' ]`.
- **Step 3 (green):** same command -> `Tests 46 passed` (Prisma cases included).
- **Step 6 (red, layout still on `next/font/google`):** `npx vitest run tests/unit/fonts.test.ts` -> `4 failed`. Deviation from the brief's prediction ("the first test fails"): ALL four fail, because the fixture cases also run `fontProblems` against the real layout source. Every failure is the predicted sentence: `public-sans-latin-400-normal.woff2 is not used by app/layout.tsx` (and the 700 one), so the fixture cases carry one or two extra problems until the layout switches.
- **Step 7 (green, after the layout switch):** `Tests 4 passed`.
- **Step 8 (offline build, green):** same offline `next build` as Step 1: exit 0, `Compiled successfully`, only the `middleware` -> `proxy` deprecation warning. `grep -rlE "fonts\.(gstatic|googleapis)\.com" .next/static .next/server` printed nothing. `ls .next/static/media`:
  - `public_sans_latin_400_normal-s.p.0dfhr30pzjgke.woff2`
  - `public_sans_latin_700_normal-s.p.1ccm_jb9ry_v5.woff2`

## Step 4: hashes (all three match the brief exactly)

```text
36274b5787b4f03b27e65ae971d6c808a96838ccd60c9dabaee154889b6bba82  app/fonts/public-sans-latin-400-normal.woff2
dace741613696827f61dbee2d984e8685f14a2846136783f3ad1c8950914bf1d  app/fonts/public-sans-latin-700-normal.woff2
157a9e77f7580246e97c769490e2e977ae94399f9d30f4556015c41fe8c28bac  app/fonts/OFL.txt
```

The file sizes (14 632, 14 600) also match what the README states. The scratch directory `node_modules/.tmp-fontsource` was removed.

## Step 9: scaffold

`npx vitest run tests/unit/scaffold.test.ts` -> `Tests 114 passed`.

## Step 10: browser, three engines (scratch spec, deleted afterwards)

`env PORT=3113 npx playwright test --project=chromium --project=firefox --project=webkit tests/e2e/zz-scratch-font.spec.ts` -> `3 passed`.

- FACES, identical on all three engines: `["publicSans|400|loaded","publicSans|700|loaded","publicSans Fallback|normal|unloaded"]`.
- BODY font-family: `publicSans, "publicSans Fallback", ui-sans-serif, system-ui, sans-serif` (quoting differs slightly per engine).
- FONT REQUESTS:
  - Chromium and WebKit: two, `http://127.0.0.1:3113/_next/static/media/public_sans_latin_400_normal-s.p.0dfhr30pzjgke.woff2` and `…_700_normal-s.p.1ccm_jb9ry_v5.woff2`.
  - **Firefox: four** — the same two URLs each listed twice. The brief says two on each engine. Same origin and same URLs, so it does not affect the result; most likely Firefox reports both the preload fetch and the `@font-face` fetch as `font` requests. Recorded as measured.
- FOREIGN: `[]` on all three engines.

## Step 11: secret scan and checks

- `git add app/fonts` then `sh scripts/secret-scan.sh staged`: no output, exit 0. The final commit was made with the repo's pre-commit hook active (`git config core.hooksPath` = `/Users/ruslan/Own/ai-native-personal-finance/scripts/git-hooks`, which holds `pre-commit`) and without `--no-verify`; the hook printed nothing and the commit succeeded. I did not read the hook's own output beyond that, so "passed" is inferred from the successful commit.
- `npx prettier --check .`: clean.
- `npx tsc --noEmit`: clean.
- `npm run lint` (ESLint `--max-warnings 0`, then Stylelint): clean.
- `npx vitest run`: `Test Files 81 passed (81)`, `Tests 1043 passed (1043)`. Expected by the controller: 1043 tests (matches), 82 files. Actual is 81 files: 80 + the new `fonts.test.ts`; the boundaries test was already a file, so 82 was a miscount. The brief's stale 1 035 is +8 lower than the real tree, as the controller said.

## Step 12: pixels (Chromium; baseline = `origin/main`'s Google Fonts layout; compare = the committed local layout)

The first run with `--update-snapshots` wrote six baselines (`6 passed`, "snapshot doesn't exist, writing actual"). After `git checkout -- app/layout.tsx` (confirmed `next/font/local` restored) the second run failed all six cases, each with only a small differing-pixel count and NO size mismatch (`sips` confirms every expected/actual pair has identical dimensions):

| Screenshot | Differing pixels | Brief's measured value | Image size |
| --- | --- | --- | --- |
| login 1440 | 46 | 46 | 1440 x 900 |
| login 768 | 6 | 6 | 768 x 900 |
| login 375 | 6 | 6 | 375 x 900 |
| overview 1440 | 49 | 48 | 1440 x 1153 |
| overview 768 | 41 | 40 | 768 x 1974 |
| overview 375 | 28 | 25 | 375 x 2558 |

Login matches the brief exactly; overview is +1 / +1 / +3 pixels. Still "a handful", no layout shift (identical image heights). I did not edit any expectation. I opened `login-1440-diff.png`: the page is faded and only a few glyph edges are marked, as the brief says. I did not open the overview diffs.

Cleanup: `tests/e2e/zz-scratch-font.spec.ts`, `tests/e2e/zz-scratch-shot.spec.ts`, `tests/e2e/zz-scratch-shot.spec.ts-snapshots/` and `test-results/` are deleted. Final `git status --short` is empty; `git diff origin/main --stat -- app/layout.tsx` -> `1 file changed, 9 insertions(+), 4 deletions(-)` (the `next/font/local` change only). Port 3113 has no listener.

## Screenshots saved for the PR (git-ignored, in `.superpowers/sdd/2026-09-24-T-13c/screenshots/`)

These are the `-actual.png` files of the second run (committed local-font layout):

- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt/.superpowers/sdd/2026-09-24-T-13c/screenshots/login-1440.png`
- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt/.superpowers/sdd/2026-09-24-T-13c/screenshots/login-768.png`
- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt/.superpowers/sdd/2026-09-24-T-13c/screenshots/login-375.png`
- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt/.superpowers/sdd/2026-09-24-T-13c/screenshots/overview-1440.png`
- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt/.superpowers/sdd/2026-09-24-T-13c/screenshots/overview-768.png`
- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt/.superpowers/sdd/2026-09-24-T-13c/screenshots/overview-375.png`

## Files changed (in the commit)

Created: `app/fonts/OFL.txt`, `app/fonts/README.md`, `app/fonts/public-sans-latin-400-normal.woff2`, `app/fonts/public-sans-latin-700-normal.woff2`, `tests/fixtures/fonts.ts`, `tests/unit/fonts.test.ts`, `tests/fixtures/boundaries/app-imports-next-font-google.tsx.fixture`, `tests/fixtures/boundaries/app-imports-next-font-local-allowed.tsx.fixture`.
Modified: `app/layout.tsx`, `eslint.config.mjs`, `tests/unit/boundaries.test.ts`, `tests/fixtures/boundaries/README.md`, `docs/02-architecture/design-tokens.md`.
Also written, outside the commit: `.superpowers/sdd/2026-09-24-T-13c/commit-msg-5.txt`, this report, the screenshots.

## Self-review

- Followed the brief's 12 steps in order, red before green at Steps 1, 2 and 6; text, code, diffs and README verbatim.
- The eslint rule is in the existing block (Prisma cases still pass at 46/46), and the control fixture (`next/font/local`) reports nothing.
- `git add` used the brief's explicit paths (Step 11's list); one commit; no push; message = brief's subject, blank line, the two trailer lines.
- Nothing from the network was used beyond Step 4's two fetches and Step 12's baseline build, which fetches Google Fonts through `origin/main`'s layout (online).
- A short reading of the diff against the brief found no drift.

## Concerns (none blocking)

1. Measured numbers that differ from the brief (all reported, no expectation edited): Step 6 red is 4 failures, not 1; Step 10 Firefox lists 4 font requests (two URLs, twice); Step 12 overview is 49 / 41 / 28 pixels vs 48 / 40 / 25.
2. `app/fonts/README.md` (verbatim from the brief) says `eslint.config.mjs` forbids `next/font/google` "in `app/` and `src/`". The existing block's `files` are `app/**`, `src/domain`, `src/shared`, `src/ui` and `src/webmcp` — NOT `src/server`. So the README slightly overstates the scope. Practically harmless (no font import belongs in `src/server`), but the controller may want to say "in `app/` and every `src/` layer except `server`".
3. `tests/fixtures/README.md` keeps a per-task index of the fixture helpers (`database.ts`, `child-env.ts`, `a11y-routes.ts`, ...); the new `tests/fixtures/fonts.ts` is not listed there. The brief does not list that README under "Modify", so I left it alone; a one-line addition would keep the index complete.
4. Other docs still describe the Google loader in the present tense or as open: `docs/03-specs/tech-debt.md` (TD-11 still "Open", v1.11) and `docs/03-specs/backlog.md` (the T-13c row); the T-01 plan/prompts and `process-log.md` are historical. Those look like the plan's later doc/bookkeeping work, not this task's.
5. Not measured (as the brief also says): whether gitleaks reads the `.woff2` bytes; a font holds no secret.

## Fix round 1 (review finding: the README overstated the ESLint rule's scope)

Commit: `5d015bf` — `docs(fonts): say which layers the next/font/google restriction covers (TD-11)`, a new commit on top of `3c57648` (not amended), not pushed. It resolves concern 2 above.

**What changed:** one line pair in `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt/app/fonts/README.md` (1 insertion, 1 deletion). The sentence now reads: "`eslint.config.mjs` forbids importing `next/font/google` in `app/` and in every `src/` layer except `server` (fixture: `tests/fixtures/boundaries/app-imports-next-font-google.tsx.fixture`)." The rest of the paragraph, the table and the hashes are untouched.

**Search for the same claim elsewhere in the commit's files:** the brief's `grep -rn "app/ and src"` returned nothing, because the README wraps the words in backticks (`` `app/` and `src/` ``), so the literal string never occurs. A broader regex over `app/fonts`, `app/layout.tsx`, `eslint.config.mjs`, `tests/unit/boundaries.test.ts`, `tests/unit/fonts.test.ts`, `tests/fixtures/fonts.ts`, `tests/fixtures/boundaries/README.md`, the two new fixtures and `docs/02-architecture/design-tokens.md` found only `app/fonts/README.md:7` stating the scope. The other hits were unrelated (the Prisma, clock and test-id rows of the boundaries README, a `src/shared/enums.ts` path in design-tokens). `tests/fixtures/boundaries/README.md`'s new row says "imported in `app`", which is accurate; the eslint comment says "over `app/**`", also accurate; design-tokens v1.4 makes no scope claim. Nothing else changed.

**Covering checks:**
- `npx prettier --check app/fonts/README.md` -> `All matched files use Prettier code style!`
- `npx vitest run tests/unit/fonts.test.ts tests/unit/boundaries.test.ts tests/unit/scaffold.test.ts` -> `Test Files 3 passed (3)`, `Tests 164 passed (164)` (4 + 46 + 114).
- `git add app/fonts/README.md` only; `sh scripts/secret-scan.sh staged` -> no output, exit 0; commit made without `--no-verify` (hook active, as before); message file `.superpowers/sdd/2026-09-24-T-13c/commit-msg-5-fix1.txt` (subject, blank line, the two trailer lines).
- `git status --short` is empty afterwards; branch `task/T-13c-tech-debt`.

**Concerns:** none new. Concern 3 (`tests/fixtures/README.md` does not index `fonts.ts`) and concern 4 (`tech-debt.md` / `backlog.md` bookkeeping) are unchanged and out of this round's scope.
