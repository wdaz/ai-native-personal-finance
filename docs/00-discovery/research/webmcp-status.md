# Research note — WebMCP: where the standard, browsers and tooling stand

Status: Final (v1) · Author(s): Agent (Claude), sources supplied by Owner · Date: 2026-09-08
Answers: A1 (WebMCP stays experimental), Q3 (browser matrix), feeds Q5 (tool safeguards)

## Question

What is WebMCP today — spec, browser support, framework support, consuming
agents — and what does that mean for an app that must work in every modern
browser while exposing tools to in-browser agents?

## Answer (short)

WebMCP is a W3C Community Group draft (Web Machine Learning CG, authored by
Microsoft and Google engineers) that lets a page register JavaScript
functions as tools via `document.modelContext.registerTool()`. Chrome has a
live **origin trial from Chrome 149** (Edge from 150); Firefox and Safari
are reviewing, nothing shipped. The API was **renamed from
`navigator.modelContext` to `document.modelContext` on 21 July 2026**, so
most tutorials and Angular's current provider are behind. No mainstream
consumer agent calls WebMCP tools yet; testing is done with Chrome's tool
inspector extension, Chrome DevTools MCP, or the `@mcp-b` relay into Claude
Code. For this project: treat WebMCP as **progressive enhancement behind one
adapter**, polyfill with `@mcp-b/webmcp-polyfill` elsewhere, and test tools
through `getTools()/executeTool()` in Playwright rather than through a real
agent.

## Findings

| # | Finding | Source | Date checked |
|---|---------|--------|--------------|
| F1 | Spec is a *Draft Community Group Report, 4 September 2026*, Web Machine Learning CG. Interface `ModelContext` at `document.modelContext`, secure contexts only. Methods: `registerTool`, `getTools`, `executeTool`; `toolchange` event. | [Spec](https://webmachinelearning.github.io/webmcp/) | 2026-09-08 |
| F2 | Tool descriptor: `name` (1–128 chars, `[A-Za-z0-9_.-]`), `description`, `execute(input, signal)`, optional `inputSchema` (JSON Schema), `title`, `annotations` with `readOnlyHint`, `untrustedContentHint`, `consequentialHint`. | Spec | 2026-09-08 |
| F3 | Security section names three prompt-injection vectors (metadata poisoning, output injection, tool-implementation targeting); permissions policy feature `tools`, default allowlist `self`. | Spec | 2026-09-08 |
| F4 | Declarative (HTML `<form>`) variant exists as an explainer; implementation "TODO" in the draft. | [Repo](https://github.com/webmachinelearning/webmcp), declarative-api-explainer.md | 2026-09-08 |
| F5 | Authors: Brandon Walderman, Leo Lee, Andrew Nolan (Microsoft); David Bokan, Khushal Sagar, Hannah Van Opstal (Google). Repo 3.5k stars, 108 open issues. First published 13 Aug 2025. | Repo README | 2026-09-08 |
| F6 | Implementation status: **Chrome 149+ origin trial live**, early preview program; **Edge 150+ origin trial live**; Brave experimental in Leo; Firefox under standards-positions review (#1412, bug 2018306); WebKit under review (#670). | [implementation-status.md](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md) | 2026-09-08 |
| F7 | Chrome flag for local testing: `chrome://flags/#enable-webmcp-testing`; "Model Context Tool Inspector" extension for inspecting/calling tools. Tools need an open tab (no headless). Gemini in Chrome as consumer "coming soon". | [ppc.land, 2026-05-19](https://ppc.land/chrome-149-origin-trial-puts-webmcp-in-developers-hands-at-last/) (secondary) | 2026-09-08 |
| F8 | API moved from `navigator.modelContext` to `document.modelContext` on **21 July 2026**; Chrome 150 deprecates the `navigator` form. Origin trial expected to run through Chrome 156 (~late 2026). As of mid-2026 no mainstream agent (Claude, ChatGPT, Gemini, Perplexity) consumes WebMCP tools; real deployments "round to zero". | [Spronta, July 2026](https://www.spronta.com/blog/state-of-webmcp-july-2026/) (secondary; consistent with F1) | 2026-09-08 |
| F9 | MCP-B / WebMCP-org ecosystem: `@mcp-b/webmcp-polyfill` (polyfills `document.modelContext`), `@mcp-b/webmcp-types`, `@mcp-b/global` (polyfill + in-page MCP server), `@mcp-b/react-webmcp` and `usewebmcp` (React hooks), `@mcp-b/transports`, `@mcp-b/mcp-iframe`, `@mcp-b/webmcp-local-relay` (bridges page tools to desktop MCP clients such as Claude Code over WebSocket/stdio). "Rook" extension lets an agent call tools. Angular/Next.js mentioned, thin. | [docs.mcp-b.ai](https://docs.mcp-b.ai/) | 2026-09-08 |
| F10 | WebMCP-org GitHub: `npm-packages` (71★, updated 2026-08-09), `chrome-devtools-quickstart` (Chrome DevTools MCP calling WebMCP tools), `big-calendar` (React/Next.js example with WebMCP), `use-mcp-react`, `docs`. Small, active, single-vendor-ish community. | [github.com/WebMCP-org](https://github.com/WebMCP-org) | 2026-09-08 |
| F11 | Angular **v22+** ships experimental `provideExperimentalWebMcpTools`, `declareExperimentalWebMcpTool`, `provideExperimentalWebMcpForms` (Signal Forms → tool with inferred schema). Marked experimental, "subject to change even outside major versions"; no bundled polyfill, docs point to `@mcp-b/webmcp-polyfill`; open issue tracking migration to `document.modelContext`; issue #70125 on typing. | [angular.dev/ai/webmcp](https://angular.dev/ai/webmcp), Spronta | 2026-09-08 |
| F12 | React/Next.js: no first-party support; community hooks (`@mcp-b/react-webmcp`, `usewebmcp`) wrap `registerTool` in effects. | docs.mcp-b.ai, WebMCP-org | 2026-09-08 |

## Implications for this project

1. **Browser matrix (Q3).** Native: Chrome ≥149 / Edge ≥150 with an origin
   trial token for the deployed origin (or the flag locally). Polyfilled:
   everything else via `@mcp-b/webmcp-polyfill` — tools register, and can be
   called by an extension or relay, but no built-in agent exists. Absent:
   nothing; the polyfill makes the API present everywhere. Requirement: the
   app must never depend on the API being native; a small status indicator
   ("agent tools: native / polyfill") is a cheap, honest UI signal.
2. **One adapter, no framework lock-in.** Because of the rename (F8) and
   framework churn (F11), tool registration must go through a single module
   the app owns (`registerTools(document.modelContext ?? navigator.modelContext)`),
   whatever the stack. This keeps the stack decision (Q4) free: Angular's
   first-party support is a convenience, not a reason.
3. **Testing (S1 × S2).** Since no consumer agent exists, E2E tests should
   drive tools the way an agent would: `await document.modelContext.getTools()`
   and `executeTool(name, args)` from Playwright's `page.evaluate`, asserting
   both the tool result and the resulting UI/state. This is deterministic and
   browser-independent (with the polyfill). A manual "real agent" demo can use
   the Tool Inspector extension or `@mcp-b/webmcp-local-relay` → Claude Code.
4. **Safeguards (Q5).** Use spec annotations: read tools `readOnlyHint: true`;
   mutating tools (`add_budget`, `add_money_to_pot`, `withdraw_from_pot`,
   `delete_*`) `consequentialHint: true`; anything echoing user-entered text
   `untrustedContentHint: true`. Re-validate every input server-side; never
   let a tool bypass the same API the UI uses. Destructive tools need an
   explicit confirmation design (NFR).
5. **Origin trial is a deployment concern (Phase 3).** The public URL must
   be known to register the OT token; the token expires with Chrome 156.
   Plan for the trial ending: the polyfill path must remain the baseline.
6. **Portfolio framing.** Adoption is near zero (F8); the honest claim is
   "a working, tested WebMCP integration with documented limits", not
   "agent-ready product". That is exactly S2 as written in the problem
   statement.

## Confidence and expiry

High confidence on F1–F6, F9–F11 (primary sources). Medium on F7–F8
(secondary blogs, but consistent with the spec date and rename). This area
moves monthly: **re-check before Phase 3 (ADR on WebMCP) and again before
deployment**, especially the origin-trial end version and whether Gemini in
Chrome or any other agent has started consuming tools.
