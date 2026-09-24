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
layer). No R1 tool yet (`tools/overview.ts`, `get_balance`, `get_overview_summary`) — that is
T-12.

`register`/`unregisterAll` use one `AbortController` per registration generation rather than a
name-based unregister: `@mcp-b/webmcp-polyfill@5.1.0`'s own compatibility-boundary section says
plainly "`unregisterTool()` ... [is] not exposed" — tool lifetime is tied to the `signal` passed
to `registerTool()` instead (`docs/04-process/plans/2026-09-24-T-11.md`, finding Q1;
SPEC-webmcp-tools v1.0.3).
