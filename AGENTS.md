# AGENTS.md — how to work in this repository

You are working inside an **AI-native SDLC** portfolio project. The
documentation is not decoration: it is your context and your contract. Read
this file completely before doing anything else.

## 1. Reading order

1. `README.md` — what this project is and its current phase.
2. `docs/04-process/roadmap.md` — which phase we are in and its exit gate.
3. `docs/04-process/governance.md` — what you may decide and what the owner
   decides.
4. The documents of the current phase (see `docs/README.md`).
5. `docs/templates/` — before creating any new document.

If a document you need does not exist yet, **say so and stop**; do not invent
its content.

## 2. Working agreements

- **Start every session from the current `main`.** Before reading anything else or making
  any change, run `git fetch origin` and bring `main` up to date (`git pull --ff-only origin
  main` on `main`); start a new working branch from `origin/main`, never from a stale local
  copy or from an earlier session's branch — GitHub deletes a merged PR's branch, and work
  built on an old base is rebased by hand later. If the pull is not a fast-forward, or the
  working tree has uncommitted changes, stop and tell the owner instead of merging, resetting
  or stashing. Then read the documents in §1: they may have changed since the last session.
- **Language.** Code, comments, documents and commits are in English.
  Conversation with the owner may be in Azerbaijani.
- **Phase discipline.** Do not produce artefacts of a later phase. In
  particular, do not write application code, choose a framework, or design a
  database while the roadmap says we are in Discovery or Requirements. If you
  think a later-phase decision is unavoidable, record it as an *open
  question* in the current phase's document instead.
- **Decisions are written down.** Any choice that another person could
  reasonably have made differently is a decision. Decisions about
  architecture go in an ADR (`docs/templates/adr.md`); decisions about scope
  go in the PRD; decisions about process go in `governance.md`. When unsure
  whether something is a decision, it is.
- **Never fabricate.** Design values come from the Figma file or the extracted
  tokens; behaviour comes from the challenge brief or the specs. If a value
  is missing, ask the owner.
- **Traceability.** Every user story has an id (`US-xx`), every spec
  references the stories it implements, every test references the spec it
  verifies, every ADR lists the requirements that drove it.
- **Process log.** Every substantive working session — human or agent — adds
  an entry to `docs/04-process/process-log.md` using
  `docs/templates/process-log-entry.md`: what was asked, what was produced,
  what the owner changed and why. This log is a first-class deliverable.
- **Small, reviewable changes.** One document or one feature per change.
  Conventional commit messages: `docs(discovery): ...`, `docs(adr): ...`,
  `feat(budgets): ...`, `test(e2e): ...`.

## 3. Phase-specific rules

| Phase | You may | You may not |
|-------|---------|-------------|
| 1 Discovery | Draft problem statements, summarise inputs, list assumptions and open questions, research external facts (cite sources, with dates) | Propose a stack, a schema, or a UI structure |
| 2 Requirements | Draft PRD sections, user stories with acceptance criteria, non-functional requirements | Decide how a requirement is implemented |
| 3 Architecture | Draft ADRs with real alternatives, system boundaries, data model, extract design tokens | Mark an ADR *Accepted* (owner only) |
| 4 Specs & plan | Write feature specs, decompose into tasks, define Definition of Done | Start implementing |
| 5–6 Build | Implement against an approved spec, write tests that trace to the spec, open PRs | Change a spec silently, skip tests, merge |
| 7 Retro | Summarise the process log, propose improvements | Rewrite history |

## 4. Quality bar for documents

- A document is done when a reader with no context could act on it.
- Every acceptance criterion is observable and testable.
- Every ADR has at least two real alternatives and explicit consequences.
- Every spec says what happens on error, on empty state and at boundaries.

## 5. When the owner and an agent disagree

The owner decides. Record the disagreement and the reasoning in the process
log — disagreements are among the most valuable entries.
