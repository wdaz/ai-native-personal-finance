# tests/unit

Vitest: `src/domain`, `src/shared`, `src/webmcp` adapter (ADR-0003).

Default environment is `node`; a file that needs a DOM starts with
`// @vitest-environment jsdom`.

- `ui/` — component tests (ADR-0003's Component layer, from T-07): Testing Library on jsdom
  (`// @vitest-environment jsdom` per file, `afterEach(cleanup)`), `next/navigation` and
  `next/link` mocked. Class assertions match Vitest's CSS-module names (`_active_<hash>`);
  hover and focus styles are E2E's (`toHaveCSS`) — jsdom applies no CSS.

- `server/` — pure `src/server` logic and the env accessors; code that needs Postgres is tested
  in `tests/api` instead (`checkThreshold`, `latestReset`), with its decision logic split out
  here (`evaluateThreshold`, `isAuthorized`, `parseAdminResetBody`).

Run: `npm test`.
