# tests/e2e

Playwright browser tests, one journey per story, on Chromium, Firefox and WebKit
(ADR-0003).

- Test titles start with the story id (`US-01 …`), except this task's scaffold smoke test.
- Role/label locators; `data-testid` only from `src/shared/test-ids.ts`; web-first
  assertions; no `waitForTimeout`; no `.first()`.
- Targets `next build && next start`, never `next dev`.
- Import `test` and `expect` from `tests/fixtures/e2e.ts`, never from `@playwright/test`:
  its automatic `cspViolations` fixture fails a test whose pages report a CSP violation
  (`test.use({ cspGuard: false })` to opt out, with a reason). The same file has
  `resetDemoData`, `loginViaApi` and `seriousA11yViolations` (NFR-A1).
- One worker for the whole run (`playwright.config.ts`): every test shares one database, and
  each starts from `resetDemoData`.
- `guards.spec.ts` proves the CSP and axe guards fire on a deliberately broken page; like the
  scaffold test, it has no story id.
- Keyboard walkthroughs press Alt+Tab on WebKit: its default Tab skips buttons and links, as
  Safari does with "Press Tab to highlight each item" off.
- `tabTo(page, target)` (`tests/fixtures/e2e.ts`) presses Tab — Alt+Tab on WebKit — and
  asserts focus and a visible ring.
- The app shell: `app-shell.spec.ts` (US-33 layouts at 1440/768/375 and 320, US-34 hover,
  US-35 minimise, titles, placeholders, axe), `app-shell-keyboard.spec.ts` (US-32
  walkthroughs, focus rings), `logout.spec.ts` (US-03 AC1–AC2, the back/forward-cache
  re-check through a synthetic `pageshow`).
- CI runs Chromium (T-06); Firefox and WebKit join in T-13. `npm run test:e2e` runs all three
  locally.

Run: `npm run test:e2e`.
