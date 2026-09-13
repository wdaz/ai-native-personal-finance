# 02 — Architecture

Status: **Complete** — exit gate met 2026-09-13 (ADR-0001…0007 Accepted; system overview, data model, design tokens approved)

Purpose: make and record the decisions that shape the system, each against
real alternatives and traced to the requirements that forced it.

## Deliverables

| File | Description | Exit gate |
|------|-------------|-----------|
| `adr/0001-...md` onward | One ADR per decision: stack, repository layout, testing strategy, WebMCP approach, persistence, auth, deployment | Each ADR *Accepted* by owner |
| `system-overview.md` | Boundaries (web, api, shared), request flow, where WebMCP tools live | Consistent with ADRs |
| `data-model.md` | Entities from the brief (transactions, budgets, pots, recurring bills, categories, themes) and their rules | Every entity traces to a story |
| `design-tokens.md` | Colours, type, spacing extracted from Figma — the only source for UI values | Extracted, not invented |

## Known prior work

An earlier, unstructured attempt (outside this repo) drafted three ADRs
proposing Angular 22 + Nx + NestJS + SQLite, a Vitest/Playwright testing
pyramid, and a route-level WebMCP tool design. They are **inputs to this
phase, not decisions**: when Phase 3 starts, they are re-evaluated against the
requirements from Phase 2 and either adopted (with credit), amended, or
rejected — each with its reasoning recorded.
