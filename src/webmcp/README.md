# src/webmcp

WebMCP adapter, per-page tool registry, polyfill loader, readiness signal (ADR-0002/0004).

- **Imports allowed:** `src/shared` only; everything else goes through the HTTP API.
- Client-only. `WEBMCP_MODE` is read as `NEXT_PUBLIC_WEBMCP_MODE` (SPEC-webmcp-tools §2.1).

Filled by T-11 (adapter, `defineTool`, provider, indicator) and T-12 (R1 tools).
