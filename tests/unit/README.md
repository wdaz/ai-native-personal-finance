# tests/unit

Vitest: `src/domain`, `src/shared`, `src/webmcp` adapter (ADR-0003).

Default environment is `node`; a file that needs a DOM starts with
`// @vitest-environment jsdom`.

- `ui/` — component tests (ADR-0003's Component layer, from T-07): Testing Library on jsdom
  (`// @vitest-environment jsdom` per file, `afterEach(cleanup)`), `next/navigation` and
  `next/link` mocked. `@testing-library/jest-dom` is not installed — assert with `.toBeTruthy()`/
  `.toBeNull()`/`.getAttribute()`, not `.toBeInTheDocument()`/`.toHaveAttribute()`. Class
  assertions match Vitest's CSS-module names (`_active_<hash>`); hover and focus styles are
  E2E's (`toHaveCSS`) — jsdom applies no CSS. `ui/overview/donut-geometry.test.ts` is the one
  exception with no jsdom pragma: `donutSegments` is a pure function, nothing to render.

- `ui/overview/` (T-10): `StatCard`, `PotsCard`, `TransactionsCard`, `BudgetsCard`, `Donut`,
  `BillsCard`, `OverviewError`, `ThemeBar`, `theme-color.ts`, `donut-geometry.ts` — one file
  per module, matching `src/ui/overview/`.

- `server/` — pure `src/server` logic and the env accessors; code that needs Postgres is tested
  in `tests/api` instead (`checkThreshold`, `latestReset`, `getOverview`), with its decision
  logic split out here (`evaluateThreshold`, `isAuthorized`, `parseAdminResetBody`, `labelMap`
  and the `CATEGORY_LABEL`/`THEME_LABEL` maps it builds, `toOverviewDto`).

- `webmcp/` (T-11): `// @vitest-environment jsdom` throughout — `adapter.ts` touches
  `document`/`window`. `adapter.test.ts` uses `vi.resetModules()` and a fresh dynamic
  `import("@/src/webmcp/adapter")` per test (module-level singleton state — generation, mode,
  registered names — would otherwise leak between cases in the same file) and mocks
  `@mcp-b/webmcp-polyfill` with `vi.mock`. `defineTool.test.ts` is a plain function-call suite,
  no DOM needed but the pragma is kept for the file's consistency with its siblings.
  `WebMcpProvider.test.tsx` and `AgentToolsStatus.test.tsx` follow `ui/`'s own Testing Library
  convention above.

Run: `npm test`.

T-12: `webmcp/` gains `tool-result.test.ts` (the status → code mapping; `toolError` omits `issues`
and `retryAfter` when absent), `overview-tools.test.ts` (both tools' `execute` against a stubbed
`fetch`: success shape, each error code, never rejects), `registry.test.ts` (iterates
`PAGE_TOOLS` for the NFR-W3 annotations — the rule `getTools()` cannot show, plan F3),
`OverviewTools.test.tsx` and two cases in `defineTool.test.ts` (validation `issues`).
`shared/api-client.test.ts` covers `apiGet`'s outcomes and `server/request-log.test.ts` the ring
buffer (cap, exact-match, stdout outside test); `test-support.test.ts` gains the `GET log` cases.

T-13: `coverage-gate.test.ts` checks the ≥ 90 % statements gate on `src/domain` (NFR-T1) three ways —
`vitest.thresholds.json` names the domain glob at 90; the real `vitest.config.ts` imports it and
its `coverage.include` selects a domain file (a glob that selects nothing would pass silently);
and a nested Vitest on `tests/fixtures/coverage-gate/` must fail with the threshold named.
`childEnv()` strips `VITEST*`, `npm_config_*` and `NODE_V8_COVERAGE` for child processes. The real
gate runs only under `npm run test:coverage` (CI, `npm run test:all`); `npm test` runs these
checks of it, not the gate itself.

T-13: `traceability.test.ts` checks the NFR-T2 scan (`scripts/traceability.ts`): every Release 1 story
id is in a `test`/`it`/`describe` title of some suite under `tests/`. The scan reads this very file
too, so its fixtures are built by a `call(fn, title)` helper — a literal `test("US-…")` here would
name a story no real test names, and mask a missing one.
