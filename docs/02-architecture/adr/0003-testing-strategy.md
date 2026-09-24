# 0003 — Testing strategy: pyramid, tooling and rules

- Status: **Accepted** (amended; clarified 2026-09-23; clarification 2026-09-24 proposed, not yet accepted) · Date: 2026-09-13 · Author(s): Agent (proposal; carries forward the prior attempt's ADR-0002 thinking), Owner (decision)
- Clarification 2026-09-23 (owner decision at the T-06 plan gate, Q4): E2E authenticates **per test** through `loginViaApi` (`tests/fixtures/e2e.ts`) — `POST /api/auth/login` from the page's own request context, which shares the browser's cookies, after the test's reset — instead of one stored `storageState` per run. A reset ends every session (ADR-0006, 2026-09-20 amendment) and every E2E test starts from one, so a state saved once per run would be dead by the second test.
- Clarification 2026-09-24 — **Proposed by the agent, awaiting the owner's acceptance** (T-13 plan gate, Q6: the owner answered that the clarification is wanted; its wording is not yet accepted): the traceability script checks the stories of the release being built — `docs/03-specs/release-1-stories.txt`, generated from PRD §5 — instead of every id in `user-stories.md`; an id in a test title that `user-stories.md` does not define also fails it. The next release regenerates the list.
- Driven by: NFR-T1–T10, NFR-A1–A5, PRD M1/M2/M5, US-38 AC3, research note §Implications 3

## Context
Testing is a headline claim (S1). The suite must be readable, traceable to stories, runnable from a clean clone, and must exercise WebMCP tools without a consumer agent existing.

## Decision
| Layer | Tool | Scope | Rules |
|-------|------|-------|-------|
| Unit | Vitest | `src/domain`, `src/shared`, `src/webmcp` adapter (jsdom) | ≥ 90 % statements on `domain`; pure functions take the `Clock` explicitly |
| API | Playwright `request` context | route handlers against a seeded test DB | one file per resource; asserts status, body schema (Zod), side effects via DB |
| Component | Vitest + Testing Library | `src/ui` primitives: focus trap, menu keyboard, validation rendering | no snapshot tests of markup |
| E2E | Playwright (Chromium, Firefox, WebKit) | one journey per story; title starts with the story id | role/label locators; `data-testid` only from `src/shared/test-ids.ts`; web-first assertions; no `waitForTimeout` |
| Accessibility | `@axe-core/playwright` inside E2E | every page, every modal open | zero serious/critical |
| WebMCP | E2E | wait for `data-webmcp="ready"`, then `page.evaluate` `getTools()` / `executeTool()`; assert result *and* UI/DB state | runs in `WEBMCP_MODE=polyfill` and `off`; native mode is a headed runbook step |
| Performance | Lighthouse CI | Overview, Transactions on the deployed warm instance | on release |

Test data: a `test-support` route (`/api/test/reset`, `/api/test/seed`) exists only when `APP_ENV=test`; a unit test asserts it is absent otherwise. Auth in E2E via ~~a stored `storageState` created once per run~~ a per-test API login after the test's reset (clarification 2026-09-23). E2E targets `next build && next start` on a throwaway Neon branch (or local Postgres in Docker) — never `next dev`.

Commands: `npm test` (unit + component), `npm run test:api`, `npm run test:e2e`, `npm run test:all` (what CI runs). Traceability: a script ~~greps `US-\d\d` across `tests/` and fails CI if any story id from `user-stories.md` is missing~~ fails CI if any story id of the release being built (`docs/03-specs/release-1-stories.txt`) is not named in a test title (clarification 2026-09-24, proposed).

## Alternatives considered
**A. This pyramid — chosen.**
**B. Cypress for E2E.** Mature, good DX; loses multi-engine (WebKit) coverage, `request` API tests and the agentic `playwright-cli` workflow the owner wants to practise.
**C. Jest instead of Vitest.** Works, but Vitest shares Vite's TS/ESM handling, is faster, and matches Playwright's expect API.
**D. Mock the WebMCP API in tests instead of the polyfill.** Faster, but proves nothing about real registration; the polyfill path is the production baseline, so tests must use it.

## Consequences
Easier: every story has a named test; reviewers can read the suite as documentation. Harder: WebKit E2E flakiness must be handled by fixing locators, not retries (max 1 retry in CI, 0 locally). The traceability script makes forgetting a test a CI failure.

## Review
Owner decision: **Accepted with one change**, 2026-09-13: visual snapshot testing removed ("not needed"). Consequence: NFR-T9 is withdrawn in NFR v1.1 and the Release 3 "visual regression baseline" item is dropped from the PRD; design fidelity (S3) is verified by manual review against the design exports and by the E2E layout assertions of US-33.
