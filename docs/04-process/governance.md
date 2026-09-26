# Governance — who decides what

Status: Approved (Phase 0, 2026-09-08) · v1.1 2026-09-22: review subagents run without write tools (T-02a incident) · v1.2 2026-09-22: implementer constraints, reported output, predictions, test config (T-02 lessons) · v1.3 2026-09-24: code review subagents use Opus 5.5 (owner decision) · v1.4 2026-09-25: branches and releases — `develop` from the close of Release 1, `main` takes releases only (owner decision) · v1.5 2026-09-26: `main` and `develop` take changes only through a pull request, `main` only from `develop` or a hotfix branch; Copilot's review gates nothing; T-16 closes before T-15 and does not wait for the switch (owner decisions)

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

## Branches and releases

**Decision (owner, 2026-09-25):** from the close of Release 1, work moves to a second
long-lived branch, `develop`, and `main` is closed to everything except a release. Until then
nothing changes: working branches start from `origin/main` and their pull requests target
`main` (AGENTS.md §2).

Once it applies:

- **`develop` is the integration branch.** Working branches start from `origin/develop` and
  their pull requests target `develop`; the reviews, tests and previews that run on a pull
  request today run on those. `develop` takes changes only through a pull request, as `main`
  does (owner decision, 2026-09-26: "main brachə və develop (açılacaq, amma rule tətbiq
  olunmalıdır) yalnız pr ilə merge ola bilər").
- **`main` is production** (ADR-0007: `main` → Vercel production, unchanged). It receives
  pull requests from two sources only: `develop` → `main`, opened when a release is due, and a
  hotfix branch → `main` for a production fix (owner decision, 2026-09-26: "Main brachnə yalnız
  developdan və hotfix branchlərindən merge mümkün olmalıdır"). Merging either is the deploy.
  No work pull request and no push goes to `main` in between.
- **The owner merges the release and the hotfix pull requests** (Decision rights: merging is
  the owner's).
- **Copilot's review gates nothing.** Its review runs on every pull request (the ruleset "Copilot
  review for default branch") but is not reliable enough to hold a merge (owner, 2026-09-26: "Copilot
  review qoşulsada stabil deyil"), and no rule requires an approval: the owner is the only
  collaborator and author of every pull request, so a required approval would block every merge
  (`.github/CODEOWNERS` says why). What gates a merge is the pull request itself and the required
  checks.
- **Enforcement:** a required status check in `main`'s ruleset fails unless the pull request's
  head branch is `develop` or a hotfix branch, and the ruleset has no bypass actor. The agent pushes with the
  owner's GitHub account, so a bypass right for the owner would be one for the agent too. The
  check enforces the source, not the moment; that a release pull request is opened only when a
  release is due is this rule. Direct pushes, force-pushes and deletion of `main` are already
  refused by the ruleset (read 2026-09-25).

Open at the switch (settled when the switch is planned, not here):

- **The switch is a task of its own**, run after T-15 closes Release 1 (backlog). Its plan
  covers: creating `develop` from `main`; adding `develop` to `ci.yml`'s push trigger and to
  both triggers of `codeql.yml` (CodeQL runs only for `main` today, so a `develop` ruleset's
  CodeQL gate would have nothing to read); a ruleset for `develop` that mirrors `main`'s; the
  check workflow and its place in `main`'s ruleset; AGENTS.md §2 ("start from `origin/main`");
  the pull-request template; the base branches of T-14's Neon preview workflow.
- **Default branch:** stays `main` or moves to `develop`. Dependabot's security-update pull
  requests are opened against the default branch (GitHub's documented behaviour, not checked
  here), and they are on today; the check above would block them on `main`.
- **The hotfix route** (decided 2026-09-26, above; until then this line said a production fix
  goes through `develop`): the branch-name pattern the check accepts as a hotfix branch, and how
  a merged hotfix reaches `develop` so the next release does not undo it, are settled in the
  switch's plan.
- **T-16** is closed before T-15 and does not wait for the switch (owner decision, 2026-09-26:
  "develop maneə olmamalıdır"). It edits no ruleset: its required `secret scan` check was added
  on 2026-09-25 (backlog v1.38), and its "one human approval" item is replaced by the rules
  above (backlog v1.48).

## Process log

`process-log.md` is append-only. Each entry uses
`templates/process-log-entry.md`. Prompts that produced a document are saved
under `prompts/` and linked from the entry, so the work is reproducible and
reviewable.
