# tests/fixtures

Seed/reset helpers and the E2E fixtures, including the per-test login (ADR-0003, clarified
2026-09-23).

T-02: `database.ts` (`storedRows`, `insertedRows`) for the API tests, and the ADR-0002
fixtures in `boundaries/`. T-03: `domain.ts` (`transaction`, a hand-built row for the
domain's unit tests) and `seed-figures/`, copies of SPEC-overview §4.3 that are wrong on
purpose (`tests/unit/seed-figures.test.ts`). T-04: `copy/` and `enums/`, copies of the
user-stories copy appendix and of data-model.md's enum lists that are wrong on purpose
(`tests/unit/shared/copy.test.ts`, `enums.test.ts`), and the test-id fixtures in
`boundaries/`. T-06: `e2e.ts` — the E2E `test` with its automatic CSP-violation guard,
`resetDemoData`, `loginViaApi` (a per-test login after the reset, not a stored
`storageState`: a reset ends every session — ADR-0003 clarification 2026-09-23) and
`seriousA11yViolations`.

T-07: `csp.ts` — `scriptNonce` and `inlineTags` for the API tests that check a page renders
per request; `e2e.ts` gains `tabTo`.

T-13: `child-env.ts` — `childEnv()`, the environment for a child process a unit test starts
(drops `VITEST*`, `npm_config_*` in any case and `NODE_V8_COVERAGE`); the coverage-gate test uses it, and so
will the later CI-guard tests that spawn a process. `coverage-gate/` — a Vitest config and a
mostly-untested "domain" file, wrong on purpose: `tests/unit/coverage-gate.test.ts` runs it and
expects the 90 % statements gate to fail. `a11y-routes.ts` — `A11Y_ROUTES`, the routes the axe
gate scans, with `discoveredRoutes` and `routesMissingFrom` so a unit test can fail when a page
is missing from the list.
