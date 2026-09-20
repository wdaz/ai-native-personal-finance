# scripts

Repo tooling run through `npm run`: generators and checks, not application code
(ADR-0002, clarification of 2026-09-20).

- **Imports allowed:** `src/shared`, `src/domain`.
- **Imports forbidden:** `app/`, `src/server`, `src/webmcp`, `src/ui`.

`seed-figures.ts` (T-03) prints the worked example of SPEC-overview §4.3 from
`data.json`; the spec table must equal its output
(`docs/04-process/build-workflow.md`: "Any seed-derived figure in code or tests comes
from `scripts/seed-figures.ts`, never typed").
