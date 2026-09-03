# Process log

Append-only. Newest entry at the bottom. Template:
`docs/templates/process-log-entry.md`.

---

## 2026-09-03 — Phase 0: repository skeleton

- **Phase:** 0 — Skeleton
- **Participants:** Owner (Ruslan), Agent (Claude, Cowork session)
- **Trigger:** Owner wanted a portfolio project demonstrating an AI-native
  SDLC and found that existing methodologies begin at coding, leaving the
  idea → analysis → documentation stage undefined.
- **What was discussed before this artefact:**
  - Documents live in the repository (not in an external wiki) because they
    are agent context and must be versioned with code.
  - Frontend and backend live in one repository (monorepo) so an agent can
    work a feature end-to-end with full context.
  - A prior attempt (`~/Own/finance-app`, 2026-09-01) had jumped straight to
    architecture: three ADRs proposing Angular 22 + Nx + NestJS, a testing
    pyramid, a WebMCP design, and Figma tokens — but no discovery or
    requirements. Owner chose a clean repository and deferred the stack
    decision to Phase 3, where the prior ADRs become inputs.
  - "Web MCP integration" means **WebMCP**, the browser standard
    (`navigator.modelContext`), not a backend MCP server.
- **Produced:** `README.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `docs/`
  phase folders with READMEs, `docs/templates/*`, `roadmap.md`,
  `governance.md`, this log. Challenge brief and `data.json` copied into
  `docs/00-discovery/inputs/`.
- **Owner changes to agent output:** _(to fill after review)_
- **Open questions carried forward:**
  - Stack (Next.js vs Angular vs other) — Phase 3.
  - Which bonus tracks (persistence, auth) are in scope — Phase 2.
  - WebMCP: which capabilities are exposed and with what safeguards — Phase 2 (NFR) and Phase 3 (ADR).
- **Next:** Phase 1 — write `problem-statement.md` through an owner/agent
  interview.
