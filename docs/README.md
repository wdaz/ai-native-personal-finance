# Documentation map

Documents are grouped by SDLC phase. A phase folder may be empty until the
project reaches it — that is deliberate, not an omission.

| Phase | Folder | Contains | Template |
|-------|--------|----------|----------|
| 1 Discovery | `00-discovery/` | `problem-statement.md`, `inputs/` (challenge brief, seed data), `research/` notes, `assumptions-and-questions.md` | `problem-statement.md`, `research-note.md` |
| 2 Requirements | `01-requirements/` | `prd.md`, `user-stories.md`, `non-functional-requirements.md` | `prd.md`, `user-story.md` |
| 3 Architecture | `02-architecture/` | `adr/NNNN-*.md`, `system-overview.md`, `data-model.md`, `design-tokens.md` | `adr.md` |
| 4 Specs & plan | `03-specs/` | `<feature>.md` one per feature, `definition-of-done.md`, `backlog.md` | `feature-spec.md` |
| all | `04-process/` | `roadmap.md`, `governance.md`, `process-log.md`, `prompts/`, `plans/` (per-task implementation plans), `runbooks/` (headed or manual procedures, e.g. the native WebMCP check and the deploy runbook) | `process-log-entry.md` |

## Conventions

- File names are kebab-case. ADRs are numbered `0001-`, `0002-`, ...
- Every document starts with a status line: `Status: Draft | In review | Approved | Superseded`.
- Every document names its author(s): the owner, an agent, or both. When an
  agent drafted it, the process log entry that produced it is linked.
- Documents link to each other by relative path; identifiers (`US-03`,
  `ADR-0002`, `SPEC-budgets`) are used in prose so links survive moves.
