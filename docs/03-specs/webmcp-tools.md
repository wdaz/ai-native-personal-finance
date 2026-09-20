# SPEC-webmcp-tools — Adapter, registries, Release 1 tools, status indicator

Status: **Approved** (v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20
Changelog: v0.2 — S-08 cents in tool output; S-09 env names; S-10 indicator states; S-20 observable via-marker; S-21 `toolchange` rule; S-22 registration generation; S-23 assertions defined; S-31 names aligned with ADR-0004; S-32 page-scope in descriptions; S-33 idle fallback; S-37 execute signature.
Implements: US-38, US-39 (R1 part), US-41; reserves names for R2 · Constrained by: ADR-0004, NFR-W1–W9, NFR-T8 · Spec reference: WebMCP Draft CG Report 2026-09-04 — `document.modelContext`; `execute(input, signal)` is the draft's callback shape (research note F2); the adapter wraps whatever the runtime passes and exposes `{ input, signal }` to our tools.

## 1. Purpose
Expose the app's capabilities to in-browser agents through one adapter, page by page, with the polyfill as baseline, and make it testable without any agent.

## 2. Behaviour
2.1 Configuration: the documented knob is `WEBMCP_MODE` (`native | polyfill | off`, default `polyfill`); `next.config` exposes it to the client as `NEXT_PUBLIC_WEBMCP_MODE`. `native` means *opportunistic native with polyfill fallback* (there is no way to force native). `APP_ENV=test` is exposed as `NEXT_PUBLIC_APP_ENV` for the test hook.
2.2 `src/webmcp/adapter.ts` (names per ADR-0004): `getModelContext()`, `register(tools)`, `unregisterAll()`, `mode()`, `onStatus(cb)`.
  - `off` → `register` no-op; `mode() = "unavailable"`.
  - Otherwise: if `"modelContext" in document` before the app installs anything → `mode = "native"`; else `await import("@mcp-b/webmcp-polyfill")` once → `mode = "polyfill"`; import failure → `mode = "unavailable"`, `console.warn`.
  - `register(tools)` increments a generation counter, awaits the polyfill if needed, then calls `document.modelContext.registerTool(def)` for each tool **only if the generation is still current**; `unregisterAll()` bumps the generation (cancelling any pending registration) and calls `unregisterTool(name)` for every registered name.
  - After a completed `register`: set `document.documentElement.dataset.webmcp = "ready"`, dispatch **one** `toolchange` `Event` on `document` and, if `document.modelContext` is an `EventTarget`, on it too (duplicates with runtime-fired events are harmless; tests wait only on the attribute). `unregisterAll` removes the attribute.
  - Loading: adapter and polyfill chunks load after hydration via `typeof requestIdleCallback === "function" ? requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 0)` (NFR-P3).
2.3 `src/webmcp/WebMcpProvider.tsx` (client) is mounted once in `app/(app)/layout.tsx` and owns the adapter and the indicator state; each page layout renders `<WebMcpTools tools={pageTools}/>`, whose effect calls `register(tools)` on mount and `unregisterAll()` on unmount (React remounts it per route segment because it lives in the page's own `layout.tsx`, not the shared one). Pages without tools (R2 placeholders) render no `<WebMcpTools>`, so `mode()` is still reported with 0 tools. Nothing is mounted in `(auth)`.
2.4 `src/webmcp/tools/<page>.ts` exports `ToolDefinition[]` built with `defineTool({ name, title, description, input: ZodSchema, annotations, execute })`; `defineTool` converts Zod → JSON Schema (`zod-to-json-schema`, `$refStrategy: "none"`), and throws at build time if: name ∉ `^[A-Za-z0-9_.-]{1,128}$`, description > 200 chars, any string property lacks `maxLength`, or annotations are missing.
2.5 `execute({ input, signal })`: validates `input` with the Zod schema → `error("validation")`; calls `src/shared/api-client.ts` (the UI's fetch wrapper) with header `X-Via: webmcp` and the abort signal; maps responses: 2xx → success; 400 → `validation`; 401 → `unauthenticated`; 404 → `not_found`; 409 → `conflict`; 429 → `rate_limited`; abort → `cancelled`; other → `server_error`. Never throws.
2.6 Result shapes (ADR-0004): success `{ content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data }` where `data` is the API DTO **unchanged (money in integer cents)** plus `{ currency: "USD", unit: "cents" }` at the top level; error `{ isError: true, code, message, content: [{ type: "text", text: message }] }`.
2.7 Indicator `<AgentToolsStatus>` (sidebar footer; compact dot on tablet/mobile with `aria-label` = full text), `role="status"`, `aria-live="polite"`:

| State | When | Text | `title` |
|-------|------|------|---------|
| checking | before the adapter resolves | "Agent tools: checking…" | "Detecting WebMCP support" |
| native | `mode() === "native"` | "Agent tools: native · N" | "WebMCP is supported natively by this browser" |
| polyfill | `mode() === "polyfill"` | "Agent tools: polyfill · N" | "Provided by a polyfill; no built-in agent yet" |
| unavailable | off, or import failed | "Agent tools: unavailable" | "WebMCP is disabled or could not load" |

N = number of currently registered tools (0 on pages without tools).
2.8 Via-marker observability: every API response carries `X-Request-Id`; requests with `X-Via: webmcp` are logged as `{ requestId, via: "webmcp", route }`; when `APP_ENV=test`, `GET /api/test/log?requestId=` returns that entry (SPEC-reset-and-test-support §3).

## 3. Release 1 tools (Overview page)
| Tool | Title | Description | Annotations | Input | Output (`structuredContent`) | Calls |
|------|-------|-------------|-------------|-------|------------------------------|-------|
| `get_balance` | Get balance | "Returns the demo account's current balance, income and expenses in USD cents. Available on the Overview page." | `readOnlyHint: true` | `{}` | `{ current: 483600, income: 381425, expenses: 170050, currency: "USD", unit: "cents" }` | `GET /api/overview` (balance part) |
| `get_overview_summary` | Get overview summary | "Returns what the Overview page shows: totals, first four pots and budgets, latest five transactions, bills summary. Money in USD cents. Available on the Overview page." | `readOnlyHint: true`, `untrustedContentHint: true` | `{}` | `OverviewDto` + `{ currency, unit }` | `GET /api/overview` |

## 4. Reserved names (Release 2, defined in their page specs)
`list_transactions`, `list_budgets`, `add_budget`, `edit_budget`, `delete_budget`, `list_pots`, `add_pot`, `edit_pot`, `delete_pot`, `add_money_to_pot`, `withdraw_from_pot`, `list_recurring_bills`. Delete flow per ADR-0004 (`ConfirmDeleteDialog` via `src/webmcp/bus.ts`; results `cancelled | busy | not_found`).

## 5. Data
No storage. Request log entries as in 2.8 (in-memory ring buffer of 200 in test mode; structured stdout otherwise).

## 6. Interfaces
Types in `src/webmcp/types.ts` mirror the draft: `ToolDefinition { name, title?, description, inputSchema, annotations?, execute }`. Test hook: `window.__pf.webmcp = { mode, tools }` only when `NEXT_PUBLIC_APP_ENV === "test"`.

## 7. Tests required
| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Unit (jsdom) | mode detection native/polyfill/unavailable; register/unregister counts; stale-generation registration dropped after `unregisterAll`; readiness attribute set/removed; single `toolchange` dispatch; `defineTool` rejects bad names, long descriptions, strings without `maxLength`, missing annotations; every registry tool has required annotations; `execute` maps 400/401/404/409/429/abort/network and never throws | 2.2, 2.4–2.6, NFR-W3 |
| API | responses carry `X-Request-Id`; `X-Via: webmcp` request appears in `GET /api/test/log` | 2.8 |
| E2E (polyfill) | on `/overview`: `await page.waitForSelector('[data-webmcp="ready"]')`; `getTools()` names = exactly the two R1 names with annotations; `executeTool("get_balance", {})` structuredContent equals the API DTO balance + currency/unit; `executeTool("get_overview_summary", {})` equals `GET /api/overview` + currency/unit; click sidebar "Transactions" (client navigation) → `[data-webmcp]` absent and `(await document.modelContext.getTools()).length === 0`; hard-load `/login` → `document.modelContext === undefined`; indicator text "Agent tools: polyfill · 2" on Overview and "polyfill · 0" on a placeholder page | US-38 AC1–AC3, US-39 AC1/AC3, US-41 |
| E2E (off) | app renders; `document.modelContext === undefined` on every page; indicator "Agent tools: unavailable" | US-38 AC2, US-41 |
| Headed runbook | Chrome ≥149 + flag: indicator "native · 2"; Tool Inspector lists both tools and can call them | NFR-B2 |

## 8. Out of scope
Relay/desktop clients (documented only), declarative form tools, third-party React/Angular hooks.

## 9. Open questions
None.
