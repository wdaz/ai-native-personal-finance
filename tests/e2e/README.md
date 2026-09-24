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
  re-check through a synthetic `pageshow`). T-08 adds US-37 AC2 (the reset banner's date,
  its dismissal for the tab, 320 px) to `app-shell.spec.ts`, and the banner's tab stop and
  focus hand-off to `app-shell-keyboard.spec.ts`.
- CI runs Chromium (T-06); Firefox and WebKit join in T-13. `npm run test:e2e` runs all three
  locally.
- `overview.spec.ts` (T-10): US-04…08 against the default seed and the seed variants
  (`empty-pots`, `few-transactions`, `empty-budgets`, `no-recurring`, `empty-all`) SPEC-overview
  §7 names, US-32's keyboard walkthrough of the page's own four card links (picking up where
  `app-shell-keyboard.spec.ts`'s own walkthrough leaves off, at the reset banner's dismiss
  button, rather than re-proving the shell's earlier stops), US-34 hover/focus on those links,
  and axe on the default seed, `empty-all` and a phone width. `main img` (not a role query)
  counts transaction avatars specifically — the sidebar logo and the donut are both
  `<svg role="img">`, not `<img>`.

- `axe-routes.spec.ts` (T-13) scans every route once per engine, the 404 page included, and fails
  on a serious or critical axe violation. The route list is `tests/fixtures/a11y-routes.ts`;
  `tests/unit/a11y-routes.test.ts` fails when a page under `app/` is not on it.

Run: `npm run test:e2e`.

- `webmcp.spec.ts` and `webmcp-off.spec.ts` (T-12): the two Release 1 tools in a real browser.
  The helper `tests/fixtures/webmcp.ts` (`listTools`, `callTool`, `expectToolsReady`, `RUN_MODE`)
  calls a tool the way the installed polyfill allows: find it in `getTools()`, pass
  `executeTool(tool, JSON.stringify(input))`, parse the returned JSON string (plan F2).
  `WEBMCP_MODE` is inlined when the app is built, so a spec cannot switch it: each file skips
  itself unless `RUN_MODE` matches and its first test asserts which build it is talking to, so
  a reused server built in the other mode fails with a named message instead of a timeout. CI
  runs the whole Chromium suite once per mode. Locally the off leg is
  `WEBMCP_MODE=off npx playwright test --project=chromium` — stop any running server first,
  because Playwright reuses one and it would still be the polyfill build.
