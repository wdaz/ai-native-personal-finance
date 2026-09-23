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
