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

T-13c (TD-10): `env.ts` also holds `isLocalDatabaseUrl`, `localDatabaseRefusal` and
`testEnvRefusal` — pure, no imports, only the global `URL` — so `next.config.ts`,
`src/server/env.ts`, `prisma/seed.ts` and `playwright.config.ts` all read one definition of "this
machine's database" and of where `APP_ENV=test` may run. `isLocalDatabaseUrl` fails closed: it
reads a URL the way node-postgres does, so a scheme other than `postgres:`/`postgresql:`,
whitespace, or a malformed percent escape (what node-postgres would re-encode before parsing) is
refused, as is a `host` or `hostaddr` parameter.
