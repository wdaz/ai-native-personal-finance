# src/shared

Zod schemas, DTO types, enums (categories, themes), test ids, copy (ADR-0002).

- **Imports allowed:** nothing from the rest of the codebase.
- Used by forms, route handlers and WebMCP tools alike (NFR-Q2).

T-03 wrote the SPEC-overview §4.2 formatters: `money.ts` (`formatMoney`,
`formatSignedMoney`) and `dates.ts` (`formatDate`). T-04 wrote `enums.ts` (the enums of
data-model.md, as the document spells them), `copy.ts` (the user-stories copy appendix),
`schemas.ts` (Zod: auth, the error envelope, the Overview DTO, meta), `test-ids.ts` and
`tool-schema.ts` (`toolInputJsonSchema`, for T-11's `defineTool`). `env.ts` holds
`WEBMCP_MODES`, which the meta schema reuses.
