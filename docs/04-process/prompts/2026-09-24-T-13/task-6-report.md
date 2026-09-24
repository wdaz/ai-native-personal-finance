# T-13 Task 6 report: the axe gate (Q4 = B)

Status: DONE. Commit `13b3928` on `task/T-13-ci-hardening`: `test(a11y): scan every route, and fail when a page is not on the list`.

## What was done

Brief code used verbatim (prettier only re-wrapped the `routesMissingFrom` call in the unit test, as the brief predicted).

- Created `tests/fixtures/a11y-routes.ts`, `tests/e2e/axe-routes.spec.ts`, `tests/unit/a11y-routes.test.ts`.
- Documented in `tests/e2e/README.md` (one bullet: what the spec scans and where the list is) and `tests/fixtures/README.md` (an `a11y-routes.ts` sentence).

## TDD evidence

RED (before the fixture existed), copied from the run:

    FAIL tests/unit/a11y-routes.test.ts
    Error: Cannot find module '../fixtures/a11y-routes' imported from .../tests/unit/a11y-routes.test.ts
    Test Files  1 failed (1)   Tests  no tests

Matches the brief's prediction.

GREEN: `Test Files 1 passed (1)`, `Tests 2 passed (2)`. Matches the brief's "2 passed".

Route-list guard failing on purpose against the real tree (a temporary `app/(app)/unlisted-mutation/page.tsx`, removed afterwards):

    x lists every page under app/ and the 404 page
    AssertionError: expected [ '/unlisted-mutation' ] to deeply equal []
    Tests  1 failed | 1 passed (2)

The second test is the committed fixture: a temp `app/` tree with pages the list lacks, asserting they are reported and that route groups are dropped from the paths.

Axe scan failing on purpose (a temporary `<img src="/mutation.png" />` without `alt` added to `app/not-found.tsx`; run `--project=chromium -g "no-such-page"`; Playwright rebuilt the app):

    1) [chromium] > tests/e2e/axe-routes.spec.ts:11:3 > US-01 US-02 US-33 NFR-A1 axe gate: /no-such-page has no serious or critical violation
    Error: /no-such-page
    - Expected  - 1
    + Received  + 3
    - Array []
    + Array [
    +   "image-alt: img",
    + ]
    1 failed

The mutation was reverted; `app/not-found.tsx` shows no diff and nothing is committed under `app/`.

Three-engine axe run, after the rebase onto PR-A's main (real):

    npx playwright test --project=chromium --project=firefox --project=webkit tests/e2e/axe-routes.spec.ts
    24 passed (17.5s)

All eight routes (`/login`, `/signup`, `/no-such-page`, `/overview`, `/transactions`, `/budgets`, `/pots`, `/recurring-bills`) on chromium, firefox and webkit. This matches the brief's earlier measurement (24 passed, 17.5 s). No axe violation was found on any real page, so nothing was suppressed or excluded.

## Gates (each run as its own command)

- `npm run typecheck`: clean.
- `npm run lint`: clean (`--max-warnings 0`).
- `npm run format:check`: all matched files use Prettier code style.
- `npm test`: 75 files, 945 tests passed. Baseline was 74 files / 943 tests; the two new tests are the two in `a11y-routes.test.ts`.
- `npm run traceability`: all 18 Release 1 stories are named in a test title.

## Deviations

None from the brief's code. Two process notes:
- While reverting the `not-found.tsx` mutation one edit dropped a newline; I noticed it in `git diff` and restored it. The commit does not touch `app/`.
- `tests/e2e/README.md` still says "Firefox and WebKit join in T-13" in an older bullet. It is another task's line to update, so I left it.

## Concerns

None blocking. The route guard is filesystem-based (`page.tsx` files and `not-found.tsx`); a route added another way (a `route.ts` returning HTML, or a rewrite) would not be discovered. Pages are the only kind the project has today.

## Follow-up round (M1, M2, M4): commit `04dc381`

`test(a11y): make the route guard two-way and prove the axe spec scanned the page it names`

- M1a: new `listedWithoutPage(discovered, listed)` in `tests/fixtures/a11y-routes.ts`; the unit test now has "lists no route that has no page under app/" (real tree) and a fixture case "(fixture) reports a listed route whose page is gone" (temp trees under `os.tmpdir()`, never `app/`). `discoveredRoutes` adds the 404 path only when `app/not-found.tsx` exists, so `NOT_FOUND_PATH` needs no special case in the two-way check; the fixture proves both directions of that.
- M1b: `tests/e2e/axe-routes.spec.ts` now does `const response = await page.goto(path)`, `expect(response?.status()).toBe(path === NOT_FOUND_PATH ? 404 : 200)`, `await expect(page).toHaveURL(path)` before the h1 check and the axe poll.
- M2: `PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/` (`next.config.ts` has no `pageExtensions`; grep confirmed). Fixture case: `page.ts/.jsx/.js/.tsx` found; `page.test.tsx`, `layout.tsx`, `mypage.tsx` ignored.
- M4: the bullet moved into the existing list before "Run:" and now also names the status/URL check and the two-way guard. The "Firefox and WebKit join in T-13" line was not touched.

Mutation RED (all reverted, none committed).

Unit, with a bogus `{ path: "/does-not-exist-mutation" }` in `A11Y_ROUTES` and the regex temporarily back to `/^page\.tsx$/`:

    × lists no route that has no page under app/
    AssertionError: expected [ '/does-not-exist-mutation' ] to deeply equal []
    × (fixture) finds a page in any extension Next serves, and nothing else
    AssertionError: expected [ '/d' ] to deeply equal [ '/a', '/b', '/c', '/d' ]
    Tests  2 failed | 3 passed (5)

E2E, the same bogus route listed as authenticated (`--project=chromium -g "does-not-exist-mutation"`):

    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 200
    Received: 404
    > 20 |     expect(response?.status()).toBe(path === NOT_FOUND_PATH ? 404 : 200);
    1 failed

E2E, `/overview` listed as `authenticated: false` (redirect to login; `-g "/overview"`):

    Error: expect(page).toHaveURL(expected) failed
    Expected: "http://127.0.0.1:3000/overview"
    Received: "http://127.0.0.1:3000/login?next=%2Foverview"
    1 failed

Without the new pin, both mutations would have passed the old spec: the 404 page and the login page each have one h1 and no axe violation.

After restoring:
- `npx vitest run tests/unit/a11y-routes.test.ts`: 5 passed (5).
- `npx playwright test --project=chromium --project=firefox --project=webkit tests/e2e/axe-routes.spec.ts`: 24 passed (17.4s).
- `npm run typecheck`, `npm run lint`: clean. `npm run traceability`: all 18 stories named.
- `npm test`: 77 files, 957 tests passed.
- `npm run format:check`: FAILS on `tests/fixtures/child-env.ts`, which is not mine. Another agent has uncommitted edits in the shared worktree (`tests/fixtures/child-env.ts`, `tests/unit/install-scripts.test.ts`, `tests/unit/child-env.test.ts`). `npx prettier --check` on my four files passes. I staged and committed only my files; the 957-test count includes those in-progress edits.
