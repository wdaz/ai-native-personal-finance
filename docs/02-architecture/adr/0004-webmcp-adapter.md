# 0004 — WebMCP adapter: one module, page-scoped registries, polyfill baseline, client-side confirmation

- Status: **Accepted** (clarified 2026-09-20, 2026-09-23) · Date: 2026-09-13
- Clarification 2026-09-20 (review S-08/S-21/S-22): tool `structuredContent` is the API DTO unchanged (integer cents) plus `{ currency: "USD", unit: "cents" }`; the adapter dispatches one `toolchange` per completed batch on `document` and on the `ModelContext` object; registration carries a generation counter so an unmount cancels pending registration. · Author(s): Agent (proposal; carries forward the prior attempt's ADR-0003), Owner (decisions of 2026-09-13)
- Clarification 2026-09-23 (T-04 plan gate, finding F1): the JSON Schema conversion is Zod 4's own `z.toJSONSchema(schema, { io: "input" })`, not `zod-to-json-schema` — that package returns an empty schema for a Zod 4 object with no error (evidence E7, `docs/04-process/plans/2026-09-23-T-04.md`). `z.toJSONSchema`'s default `reused: "inline"` behaviour already inlines every repeated sub-schema instead of writing a `$ref`, which is what `zod-to-json-schema`'s `$refStrategy: "none"` asked for — no extra option is needed for a tool's flat input object (evidence E17, same plan).
- Driven by: NFR-W1–W9, US-38–US-41, research note (F1–F3, F8, F9), owner decisions R-16 (client-side confirmation) and R-23 (page-scoped)

## Context
The spec entry point is `document.modelContext` (draft 2026-09-04); it was renamed in July 2026 and framework integrations lag. No consumer agent exists yet; testing must drive tools directly. Tools must be page-scoped and must never bypass the API the UI uses. Delete tools require an on-screen confirmation; the owner chose to enforce it client-side.

## Decision
`src/webmcp/` contains:

- `adapter.ts` — `getModelContext()`: returns `document.modelContext` if present at first call (**mode = native**); otherwise dynamically imports `@mcp-b/webmcp-polyfill`, installs it (**mode = polyfill**); if `WEBMCP_MODE=off` or the import fails, returns `null` (**mode = off**). Exposes `register(tools)`, `unregisterAll()`, `mode()`. After registration it sets `document.documentElement.dataset.webmcp = "ready"` and dispatches `toolchange`. No `navigator.modelContext` fallback.
- `tools/<page>.ts` — one registry per page (`overview`, `transactions`, `budgets`, `pots`, `recurring-bills`), each exporting `ToolDefinition[]` built from the shared Zod schemas (`z.toJSONSchema`) with annotations: read → `readOnlyHint`, mutating/delete → `consequentialHint`, user-text outputs → `untrustedContentHint`. Names per spec charset; descriptions ≤ 200 chars; every string input has `maxLength`.
- `WebMcpProvider` (client component) mounted in each page's client layout: on mount `register(pageTools)`, on unmount `unregisterAll()`. Nothing is registered on the login page.
- Tool `execute` functions call the same `fetch` wrappers the UI uses (`src/shared/api-client.ts`), never Prisma. Results are structured content (`{ content: [{ type: "text", text: JSON.stringify(dto) }], structuredContent: dto }`); errors are `{ isError: true, code, message }` — never thrown.
- **Delete flow:** `delete_pot({ id })` → adapter dispatches an app event → the page opens the same `ConfirmDeleteDialog` the UI uses → user confirms → client calls `DELETE /api/pots/:id` → tool resolves `{ deleted: true }`; cancel/abort → `{ code: "cancelled" }`; second call while open → `{ code: "busy" }`; unknown id → `{ code: "not_found" }`. The server sees a normal delete (owner decision R-16).
- Status indicator (US-41): `<AgentToolsStatus/>` in the sidebar footer reads `mode()` and the tool count.
- Server side: the API logs an `X-Via: webmcp` header the tools send, for the "via tool" marker (US-40 AC3); nothing else differs.
- Runbook: native verification in Chrome ≥149 with `chrome://flags/#enable-webmcp-testing` + Model Context Tool Inspector; relay demo with `@mcp-b/webmcp-local-relay` into Claude Code. Origin-trial token is a Vercel env var injected as a `<meta http-equiv="origin-trial">` only on the production origin.

## Alternatives considered
**A. This design — chosen.**
**B. Global registry on every page.** Simpler tests, no unmount logic; rejected by the owner (R-23) in favour of page scope. Consequence accepted: E2E for a page's tools must navigate to that page first.
**C. `@mcp-b/react-webmcp` hooks.** Convenient, but couples registration to a third-party React layer that would have to be replaced on the next spec change; W1 requires our own module. The polyfill package alone is used.
**D. Server-enforced delete confirmation (token).** Safer against a compromised client; rejected by the owner (R-16) as over-engineering for a demo; can be added later without changing the tool surface.
**E. `@mcp-b/global` in-page MCP server.** Would let desktop clients connect without the relay, but adds a second protocol surface to secure; out of scope.

## Consequences
Easier: the app has exactly one place that knows about WebMCP; framework or spec changes touch one file; tests drive tools identically in every mode. Harder: page scoping means agents must navigate before calling (documented in tool descriptions); the delete flow needs an in-page event bus. To watch: origin-trial expiry (~Chrome 156), spec changes to annotations.

## Review
Owner decision: **Accepted**, 2026-09-13. Owner chose alternative A as proposed.
