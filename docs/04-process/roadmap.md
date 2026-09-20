# Roadmap

Status: Approved · Current phase: **5 — Build the slice** (Phase 4 exit for Release 1 approved 2026-09-20; Release 2 specs return to Phase 4 after T-15)

The roadmap is a sequence of phases with gates, not a calendar. A phase is
entered only when the previous phase's exit gate is recorded in
`process-log.md`. Phases can be revisited (a spec can send us back to a
requirement), but the return trip is logged.

## Phase 0 — Skeleton ✅

- **Goal:** a repository where the process can be documented before any
  product decision is made.
- **Output:** this structure, `AGENTS.md`, templates, governance.
- **Exit gate:** owner reviews `AGENTS.md` and `governance.md` and agrees to
  work by them.

## Phase 1 — Discovery ✅

- **Goal:** know why we are building this, for whom, and what "good" means.
- **Activities:** write the problem statement together (owner answers,
  agent structures); inventory the inputs; research the three portfolio
  themes (WebMCP maturity in browsers and frameworks, current E2E practice,
  what reviewers of a portfolio look for); list assumptions and open questions.
- **Output:** `00-discovery/problem-statement.md`, `research/*.md`,
  `assumptions-and-questions.md`.
- **Exit gate:** owner approves the problem statement; no open question
  blocks writing requirements.
- **Agent role:** interviewer, researcher, scribe. Not: decision-maker.

## Phase 2 — Requirements ✅

- **Goal:** an unambiguous, testable statement of what must be true.
- **Activities:** derive user stories from the challenge brief and the
  problem statement; write acceptance criteria; write the NFRs for testing,
  WebMCP, accessibility, performance, security; define success metrics.
- **Output:** `01-requirements/prd.md`, `user-stories.md`,
  `non-functional-requirements.md`.
- **Exit gate:** every story has testable criteria; NFRs are measurable;
  owner approves the PRD. A second agent (or a fresh session) reviews for
  ambiguity and its findings are resolved.
- **Agent role:** drafter and adversarial reviewer.

## Phase 3 — Architecture ✅

- **Goal:** the decisions that shape the system, each justified.
- **Activities:** re-evaluate the prior Angular/Nx/NestJS proposal against
  the requirements; write ADRs for stack, repository layout, testing
  strategy, WebMCP approach, persistence, auth, CI; draw system boundaries;
  define the data model; extract design tokens from Figma.
- **Output:** `02-architecture/adr/*`, `system-overview.md`,
  `data-model.md`, `design-tokens.md`.
- **Exit gate:** all ADRs Accepted by owner; every NFR maps to at least one
  ADR.
- **Agent role:** proposes alternatives with trade-offs; owner decides.

## Phase 4 — Specs & plan ✅ (Release 1)

- **Goal:** feature specs an agent can implement without asking, and a
  backlog of agent-sized tasks.
- **Output:** `03-specs/<feature>.md`, `definition-of-done.md`, `backlog.md`.
- **Exit gate:** specs reviewed; first vertical slice chosen (one feature,
  end to end, with unit test, E2E test and one WebMCP tool).
- **Agent role:** spec author; owner is reviewer.

## Phase 5 — Build the slice

- **Goal:** prove the documents work as agent context.
- **Activities:** scaffold the workspace per ADRs; implement the chosen slice
  from its spec; CI green; log what the agent got wrong and what the spec
  was missing.
- **Exit gate:** slice merged; spec and process log updated with lessons.

## Phase 6 — Iterate

- Remaining features, one spec-driven task at a time. Each task: spec →
  implement → tests → review → log.

## Phase 7 — Retrospective and portfolio narrative

- Summarise the process log into a readable story: what AI-native meant in
  practice, where it helped, where it hurt, what the owner would change.
- Output: `docs/04-process/retrospective.md` and a README section.

## Quality gates (apply to every phase)

1. The phase's documents follow their template.
2. Every document has a status line and an author.
3. A process-log entry exists for the work.
4. The owner has explicitly said "approved" — an agent cannot self-approve.
