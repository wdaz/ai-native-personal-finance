# src/shared

Zod schemas, DTO types, enums (categories, themes), test ids, copy (ADR-0002).

- **Imports allowed:** nothing from the rest of the codebase.
- Used by forms, route handlers and WebMCP tools alike (NFR-Q2).

T-03 wrote the SPEC-overview §4.2 formatters: `money.ts` (`formatMoney`,
`formatSignedMoney`) and `dates.ts` (`formatDate`). T-04 adds `copy.ts`, `test-ids.ts`, the
schemas and the enums.
