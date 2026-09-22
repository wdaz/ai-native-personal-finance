# tests/fixtures

Seed/reset helpers and the stored `storageState` for authenticated E2E runs (ADR-0003).

T-02: `database.ts` (`storedRows`, `insertedRows`) for the API tests, and the ADR-0002
fixtures in `boundaries/`. T-03: `domain.ts` (`transaction`, a hand-built row for the
domain's unit tests) and `seed-figures/`, copies of SPEC-overview §4.3 that are wrong on
purpose (`tests/unit/seed-figures.test.ts`). T-06 adds the authenticated `storageState`.
