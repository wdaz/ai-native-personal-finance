# src/webmcp

WebMCP adapter, per-page tool registry, polyfill loader, readiness signal (ADR-0002/0004).

- **Imports allowed:** `src/shared` only; everything else goes through the HTTP API.
- Client-only. `WEBMCP_MODE` is read as `NEXT_PUBLIC_WEBMCP_MODE` (SPEC-webmcp-tools §2.1).

T-11: `adapter.ts` (`getModelContext`, `register`/`unregisterAll`, `mode`, `onStatus`,
`registeredTools` — the `window.__pf.webmcp` test hook, `NEXT_PUBLIC_APP_ENV === "test"` only);
`defineTool.ts` (Zod → JSON Schema via `toolInputJsonSchema`, T-04; name/description/annotation
guards; wraps a tool's `execute({ input, signal })` — `signal` is always `undefined` against the
installed runtime, plan Q2); `types.ts` (`ToolDefinition`, the ambient `Document.modelContext`
type the DOM lib does not declare yet); `WebMcpProvider.tsx` (mounted once in
`app/(app)/layout.tsx`; owns detection + status, exposed via `status-context.ts`'s
`WebMcpStatusContext`, consumed only inside this layer); `WebMcpTools.tsx` (a page's own
`{tools}` register-on-mount/unregister-on-unmount); `AgentToolsStatus.tsx` (the four-state
indicator, SPEC §2.7 — `sidebar`/`compact` variants; rendered from `app/(app)/layout.tsx` into a
`ReactNode` slot `src/ui/agent-tools-indicator.ts` defines, since `src/ui` may not import this
layer). The R1 tools (`tools/overview.ts`) landed in T-12, below.

`register`/`unregisterAll` use one `AbortController` per registration generation rather than a
name-based unregister: `@mcp-b/webmcp-polyfill@5.1.0`'s own compatibility-boundary section says
plainly "`unregisterTool()` ... [is] not exposed" — tool lifetime is tied to the `signal` passed
to `registerTool()` instead (`docs/04-process/plans/2026-09-24-T-11.md`, finding Q1;
SPEC-webmcp-tools v1.0.3).

T-12: `tools/overview.ts` (`get_balance`, `get_overview_summary` — `defineTool` calls whose
`execute` reads `GET /api/overview` through `src/shared/api-client.ts` with `X-Via: webmcp` and
maps the outcome; neither takes input, so `z.object({})` strips a stray key), `tools/registry.ts`
(`PAGE_TOOLS`, the one object `tests/unit/webmcp/registry.test.ts` iterates for NFR-W3),
`tools/OverviewTools.tsx` (the wrapper: a `"use client"` module with no props that imports the
registry and renders `<WebMcpTools>`, because `execute` functions cannot be passed from a Server
Component as props — plan F1; `app/(app)/overview/layout.tsx` renders it) and `tool-result.ts`
(`toolSuccess`, `toolError`, `fromApiOutcome`: the SPEC §2.5 status → error-code mapping and the
§2.6 result shapes; `defineTool` uses the same `toolError`, and a validation error now carries
`issues`). SPEC-webmcp-tools v1.0.4.
