# Roadmap

Status: Approved · Current phase: **Release 1 — 5, Build the slice** (Phase 4 exit for Release 1 approved 2026-09-20); **Release 2 — 4, Specs & plan** (the return trip, opened by T-15d on 2026-10-04 and in effect from the owner's merge of PR #85) · 2026-10-10: "Release 2 goal" added (owner decision)

The roadmap is a sequence of phases with gates, not a calendar. A phase is
entered only when the previous phase's exit gate is recorded in
`process-log.md`. Phases can be revisited (a spec can send us back to a
requirement), but the return trip is logged.

## Release 2 goal

*Added 2026-10-10 (owner decision). It restates the PRD's goals G1–G4
(`../01-requirements/prd.md` §2) as the outcomes that close Release 2 and
Phase 7. The target date is soft: the gates below still decide when a
phase ends, and missing the date is logged, not a reason to skip a gate.*

**Goal:** by **2026-12-31**, all five pages of the app run in production
with Release 2, G1–G4 are met in full, and the project's story can be read
from the README.

| # | Outcome | Goal | Done when |
|---|---------|------|-----------|
| 0 | Release 1 hotfixes in production | — | Hotfix 1 (`next`) and hotfix 2 (H12's Overview part, H17, H18) are merged to `main` (`../03-specs/backlog.md`, "Release 2 notes") |
| 1 | The design is aligned before the build | — | Before T-17 starts, the Release 2 specs are compared with the designer's current design (Release 1's screens are hotfix 2's, outcome 0) (the designer's changelog and Claude Design project, `governance.md` v1.11); every difference is decided by the designer agent and approved by the owner, then recorded as a spec amendment. The code changes it leads to reach production with Release 2 (T-27) |
| 2 | Every Release 2 story works | G1 | US-09…US-30 and US-40 pass their acceptance criteria; US-04 AC2 and US-37 AC3, deferred from Release 1, pass; T-27's `develop` → `main` pull request is merged |
| 3 | Testing covers Release 2 | G2 | Every Release 2 story has at least one E2E test; CI on `main` is green on all three browser engines |
| 4 | WebMCP covers Release 2 | G3 | Every tool in `../03-specs/webmcp-tools.md` §4 is registered in production and tested; no write tool acts without the user's confirmation (US-40) |
| 5 | The process stays traceable | G4 | T-17…T-27 each have a process-log entry; every Release 2 story id appears in at least one spec and one test |
| 6 | Phase 7 is done | — | `docs/04-process/retrospective.md` and the README's portfolio section are written; the README's status line names the current phase |

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
