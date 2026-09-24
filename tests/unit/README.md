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
