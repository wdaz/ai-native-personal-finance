# tests/fixtures/route-table

T-17: route files that break one rule of SPEC-write-path 7.4 each, plus `allowed.ts.fixture`,
the control. The first line names the path the file stands in for (`// route: …`);
`tests/unit/route-table.test.ts` hands each to `routeTableViolations` (`../route-table.ts`).
The `.fixture` extension keeps them out of the type check, ESLint and Prettier.
