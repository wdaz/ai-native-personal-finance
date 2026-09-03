# Governance — who decides what

Status: Draft (owner to approve at Phase 0 exit)

## Roles

| Role | Held by | Responsibilities |
|------|---------|------------------|
| Owner | Ruslan | Sets goals, answers discovery questions, approves documents, accepts ADRs, merges code, owns the process log |
| Agent | Claude and other LLM tools | Drafts, researches, reviews, implements against approved specs, logs its own work |
| Reviewer | A fresh agent session or a second tool | Adversarial review of requirements and specs before approval |

## Decision rights

| Decision | Owner | Agent |
|----------|-------|-------|
| Problem framing, goals, non-goals | Decides | Proposes, asks |
| Scope of a release | Decides | Proposes |
| Acceptance criteria wording | Approves | Drafts |
| Architecture (stack, layout, persistence, auth) | Accepts ADR | Drafts ADR with ≥2 alternatives |
| Feature spec content | Approves | Drafts |
| Implementation details within an approved spec | — | Decides, documents in PR |
| Test design within the testing ADR | — | Decides |
| Marking anything Approved/Accepted | Only | Never |
| Merging | Only | Never |

## Human-in-the-loop points

1. End of Discovery (problem statement).
2. End of Requirements (PRD).
3. Each ADR.
4. Each spec before implementation.
5. Each pull request.

## Agent constraints

- Read `AGENTS.md`; obey phase rules.
- Cite sources with dates for external facts.
- Record uncertainty explicitly rather than choosing silently.
- Never modify an Approved/Accepted document — propose a new version or a
  superseding ADR.

## Process log

`process-log.md` is append-only. Each entry uses
`templates/process-log-entry.md`. Prompts that produced a document are saved
under `prompts/` and linked from the entry, so the work is reproducible and
reviewable.
