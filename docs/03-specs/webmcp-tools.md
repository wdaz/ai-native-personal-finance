# SPEC-webmcp-tools — Adapter, registries, Release 1 tools, status indicator

Status: Draft (v0.1) · Author(s): Agent · Date: 2026-09-20
Implements: US-38, US-39 (R1 part), US-41; reserves names for US-39 (R2) and US-40 · Constrained by: ADR-0004, NFR-W1–W9, NFR-T8, research note `webmcp-status.md` · Spec reference: WebMCP draft 2026-09-04 (`document.modelContext`)

## 1. Purpose
Expose the app's capabilities to in-browser agents through one adapter, page by page, with the polyfill as baseline, and make it testable without any agent.

## 2. Behaviour
2.1 `src/webmcp/adapter.ts` — `createAdapter({ mode })`:
  - `mode` from `NEXT_PUBLIC_WEBMCP_MODE` (`native | polyfill | off`, default `polyfill`).
  - `off` → `register()` is a no-op, `status()` = `{ mode: "off", tools: 0 }`.
  - Otherwise: if `"modelContext" in document` before the app touches it → `mode = "native"`; else if configured `native`, treat as `polyfill` (opportunistic native only); install polyfill via `await import("@mcp-b/webmcp-polyfill")` once. If the import fails → `mode = "off"`, warning logged.
  - `register(tools: ToolDefinition[])`: for each, `document.modelContext.registerTool(def)`; keeps handles; `unregisterAll()` calls `unregisterTool(name)` for each.
  - After `register` resolves: `document.documentElement.dataset.webmcp = "ready"`, `document.dispatchEvent(new Event("toolchange"))` (only if the runtime did not already fire it), and an internal `status` event for the indicator. `dataset.webmcp` is removed on `unregisterAll`.
2.2 `src/webmcp/WebMcpProvider.tsx` (client): `useEffect(() => { adapter.register(tools); return () => adapter.unregisterAll(); }, [pageKey])`. Mounted in each `(app)/<page>/layout.tsx` with that page's registry; not mounted in `(auth)`.
2.3 `src/webmcp/tools/<page>.ts` exports `ToolDefinition[]` built with `defineTool({ name, title, description, input: ZodSchema, annotations, execute })`; `defineTool` converts Zod → JSON Schema (`zod-to-json-schema`, `$refStrategy: "none"`), enforces `maxLength` on every string, description ≤ 200 chars, name `^[A-Za-z0-9_.-]{1,128}$`.
2.4 `execute(input, { signal })`: validates `input` with the Zod schema (returns `error("validation")` on failure), calls `src/shared/api-client.ts` (same fetch wrapper as the UI) with header `X-Via: webmcp` and the abort signal, maps HTTP → results (below).
2.5 Results: success `{ content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data }`; error `{ isError: true, content: [{ type: "text", text: message }], structuredContent: { code, message } }`. Codes: `validation`, `unauthenticated` (401), `not_found` (404), `conflict` (409), `rate_limited` (429), `cancelled`, `busy`, `server_error`. Never throws.
2.6 Indicator `<AgentToolsStatus>`: text "Agent tools: native · 2" / "polyfill · 2" / "off"; `title` explains ("WebMCP is supported natively by this browser" / "Provided by a polyfill; no built-in agent yet" / "Disabled"); `role="status"`, `aria-live="polite"` on change.
2.7 Loading: the adapter chunk and polyfill are dynamically imported after hydration (`requestIdleCallback` with 2 s fallback) so first paint is unaffected (NFR-P3).

## 3. Release 1 tools (Overview page)
| Tool | Annotations | Input | Output (`structuredContent`) | Calls |
|------|-------------|-------|------------------------------|-------|
| `get_balance` — "Returns the current balance, income and expenses of the demo account in USD." | `readOnlyHint: true` | `{}` | `{ current: "4836.00", income: "3814.25", expenses: "1700.50", currency: "USD" }` (decimal strings) | `GET /api/overview` |
| `get_overview_summary` — "Returns what the Overview page shows: totals, first four pots and budgets, latest five transactions, bill summary." | `readOnlyHint: true`, `untrustedContentHint: true` | `{}` | `OverviewDto` with money as decimal strings and dates ISO | `GET /api/overview` |

Money in tool outputs is a decimal string (`"4836.00"`), never cents or floats. `title` = "Get balance" / "Get overview summary".

## 4. Reserved names (Release 2, definitions in their page specs)
`list_transactions`, `list_budgets`, `add_budget`, `edit_budget`, `delete_budget`, `list_pots`, `add_pot`, `edit_pot`, `delete_pot`, `add_money_to_pot`, `withdraw_from_pot`, `list_recurring_bills`. Delete flow per ADR-0004 (`ConfirmDeleteDialog` via the in-page event bus `src/webmcp/bus.ts`, results `cancelled | busy | not_found`).

## 5. Data
No storage. `X-Via: webmcp` is logged server-side with the request id.

## 6. Interfaces
Adapter API: `createAdapter`, `register`, `unregisterAll`, `status`, `onStatus(cb)`. Types in `src/webmcp/types.ts` mirror the spec: `ToolDefinition { name, title?, description, inputSchema, annotations?, execute }`. Test hook: `window.__pf.webmcp = { status }` only when `APP_ENV=test`.

## 7. Tests required
| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Unit (jsdom) | mode detection for native/polyfill/off; register/unregister call counts; readiness attribute and `toolchange`; `defineTool` rejects bad names, long descriptions, strings without `maxLength`; every registry tool has required annotations; `execute` maps 401/404/429/network to codes and never throws | 2.1–2.5, NFR-W3 |
| API | requests with `X-Via: webmcp` are logged with the marker | 5 |
| E2E (polyfill mode) | on `/overview`: wait `[data-webmcp="ready"]`; `getTools()` returns exactly the two names with annotations; `executeTool("get_balance", {})` equals the UI values; `executeTool("get_overview_summary", {})` equals the DTO; navigating to `/transactions` (R1: placeholder page) removes the tools; on `/login` no tools; indicator text "polyfill · 2" | US-38 AC1–AC3, US-39 AC1/AC3, US-41 |
| E2E (off mode) | app renders; `document.modelContext` undefined; indicator "off" | US-38 AC2 |
| Headed runbook | Chrome ≥149 + flag: indicator "native"; Tool Inspector lists the tools | NFR-B2 |

## 8. Out of scope
Relay/desktop clients (documented, not tested), declarative form tools, Angular/React third-party hooks.

## 9. Open questions
None.
