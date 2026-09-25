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
`childEnv()` strips `VITEST*`, `npm_config_*` (any case) and `NODE_V8_COVERAGE` for child processes. The real
gate runs only under `npm run test:coverage` (CI, `npm run test:all`); `npm test` runs these
checks of it, not the gate itself.

T-13: `install-scripts.test.ts` proves the install-script policy (`.npmrc`'s `strict-allow-scripts=true`
plus package.json's `allowScripts`) by running `npm ci --dry-run` in a staged copy of the lockfile and
package.json (nothing is installed; the staged package.json drops the project's own `postinstall` and
`prepare`, and an empty user and global npmrc keeps the outcome off the contributor's machine): the
repository's own files install, removing an `allowScripts` entry fails with `ESTRICTALLOWSCRIPTS`, and
the same package.json passes without `.npmrc`. `child-env.test.ts` covers `childEnv()`, including
`NPM_CONFIG_*` in upper case.

T-13: `traceability.test.ts` checks the NFR-T2 scan (`scripts/traceability.ts`): every Release 1 story
id is in the title of a `test`/`it`/`describe`/`test.describe` call in some `*.test.ts(x)` or
`*.spec.ts(x)` under `tests/` (`fixtures/` and helper files excluded). The scan reads the syntax
tree, so a story id in a comment, a string, a skipped test or group, a regular expression's `.test()`
or Zod's `.describe()` does not count; each of those has a fixture (built as a string by `call()`)
that must be reported, next to one positive control per accepted form. A conditional
`test.skip(cond, …)` is out of scope. `run(root)` is the whole CLI, so the exit code and messages
are tested against a throwaway repository.

T-13c: `css-grid.test.ts` runs the repository's own `stylelint.config.mjs` (TD-9; the script is
`npm run lint:css`) over every `.css` under `app/` and `src/`, and over a violation fixture and a
control in `fixtures/css-grid/`: a bare `fr` column track must be reported, on its line.
`shared/env.test.ts` holds the URL tables of TD-10's `isLocalDatabaseUrl`, `localDatabaseRefusal`
and `testEnvRefusal`, including the values that `new URL` and node-postgres read differently (a
scheme other than `postgres:`/`postgresql:`, whitespace, a malformed percent escape);
`server/env.test.ts`, `test-support.test.ts` and `next-config.test.ts` pin where the refusal is
read (`isTestEnv`, the route list, the config at build and start). `database-guard.test.ts` starts
child processes — the seed and `playwright test --list` — with another machine's `DATABASE_URL`
and expects the refusal, not a connection. `fonts.test.ts` checks `app/fonts/` (TD-11): every
`.woff2` listed in its README with its real hash, used by `app/layout.tsx`, and the OFL beside
them. `webmcp/adapter.test.ts` gains the TD-7 pair. Test URLs use the password `password`, or a
`${…}` variable: the secret scan reads a literal `scheme://user:password@host` as a leak.
