# Governance — who decides what

Status: Approved (Phase 0, 2026-09-08) · v1.1 2026-09-22: review subagents run without write tools (T-02a incident) · v1.2 2026-09-22: implementer constraints, reported output, predictions, test config (T-02 lessons) · v1.3 2026-09-24: code review subagents use Opus 5.5 (owner decision)

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
- **Review and verification subagents run without write tools** (read, grep,
  glob only) and never in the shared checkout's `.git`. A "read-only" instruction
  in a prompt is not enforcement — the T-02a final review proved it (a reviewer
  wrote `user.name=Scratch` to `.git/config` and made two junk commits). If a
  review needs to execute something, it does so in a throwaway clone.
- Any subagent that touches git identity, `.git/config` or hooks stops and reports
  instead.
- **Implementer subagents** (those with write tools) never run commands that rewrite
  the whole working tree or shared git state: `git checkout <rev> -- .`,
  `git reset --hard`, `git stash`, `git clean`, argument-less `npm install`
  (its `prepare` writes git configuration). Scoped edits and scoped `git add`
  only. (T-02, Task 5.)
- **Reported output is copied from the run, never from the brief.** A report
  that states a command result the reviewer cannot reproduce is treated as a
  defect of the report, not of the reviewer. (T-01 lesson 4, repeated in T-02
  Task 2 — now a rule.)
- **Plans mark predictions.** An "Expected" line for a command nobody has run is
  labelled *prediction* and is verified at execution before it is relied on.
- **Rules about how tests run live in the tool's config** (Playwright/Vitest
  config), never only in an npm script. (T-02 final review.)
- **Code review subagents use Opus 5.5.** Any subagent an agent dispatches to
  review a diff — an adversarial pass, a `/code-review`-style check — is
  launched with that model explicitly, not left to a tool default (owner
  decision, 2026-09-24). This does not reach the CI "Claude Code Review"
  GitHub App: no workflow file in this repository configures its model, since
  it is installed at the organisation level.

## Process log

`process-log.md` is append-only. Each entry uses
`templates/process-log-entry.md`. Prompts that produced a document are saved
under `prompts/` and linked from the entry, so the work is reproducible and
reviewable.
