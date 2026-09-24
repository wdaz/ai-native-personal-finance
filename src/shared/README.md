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

T-12: `api-client.ts` (`apiGet(path, schema, { headers, signal })` returns an `ApiOutcome` — `ok`,
or `http`, `invalid_response`, `aborted`, `network` — and never throws; it validates a 2xx body
with the shared Zod schema and knows nothing of tool error codes, which are
`src/webmcp/tool-result.ts`'s; the login and signup forms keep their own `fetch`) and `via.ts`
(`VIA_HEADER = "X-Via"`, `VIA_WEBMCP = "webmcp"`, shared by the client that sends the marker and
the server that records it).
