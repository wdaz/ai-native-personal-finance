# tests/e2e

Playwright browser tests, one journey per story, on Chromium, Firefox and WebKit
(ADR-0003).

- Test titles start with the story id (`US-01 …`), except this task's scaffold smoke test.
- Role/label locators; `data-testid` only from `src/shared/test-ids.ts`; web-first
  assertions; no `waitForTimeout`; no `.first()`.
- Targets `next build && next start`, never `next dev`.

Run: `npm run test:e2e`.
