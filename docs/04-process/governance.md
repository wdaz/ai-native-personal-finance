# Governance — who decides what

Status: Approved (Phase 0, 2026-09-08) · v1.1 2026-09-22: review subagents run without write tools (T-02a incident) · v1.2 2026-09-22: implementer constraints, reported output, predictions, test config (T-02 lessons) · v1.3 2026-09-24: code review subagents use Opus 5.5 (owner decision) · v1.4 2026-09-25: branches and releases — `develop` from the close of Release 1, `main` takes releases only (owner decision) · v1.5 2026-09-26: `main` and `develop` take changes only through a pull request, `main` only from `develop` or a hotfix branch; Copilot's review gates nothing; T-16 closes before T-15 and does not wait for the switch; the switch is T-15b, after T-15a and before the retrospective (owner decisions) · v1.6 2026-09-29: the switch is done (T-15b) — `develop` is the default branch; a hotfix is fixed on `develop` first and reaches `main` as `hotfix/<name>-main`, a cherry-pick (owner decision); the rulesets and the `release source` check that enforce it; "Open at the switch" becomes "Settled at the switch" · v1.7 2026-09-29: merge commits only on `main` and `develop`; no direct push to either (owner decision) · v1.8 2026-10-03: a question to the owner can be answered as written; a pull request that is not a draft is merge-ready and unfinished work stays a draft (owner decisions at the T-15c retrospective, P5 and P6)

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
- **A question to the owner can be answered as written** (owner decision, 2026-10-03, T-15c
  retrospective P5). It says what is being decided, why it matters, the options and a
  recommendation, in the owner's terms, and it explains any term the owner has not seen before — in the
  question itself, not after the owner asks. (The owner asked what a question meant before
  answering in T-02a, T-13a, T-15b and, again, in T-15c.)

## Branches and releases

**Decision (owner, 2026-09-25):** work moves to a second long-lived branch, `develop`, and
`main` is closed to everything except a release. **When (owner decision, 2026-09-26):** the
switch is T-15b, inside Release 1's closing task — after T-15a's pull requests, the last work
pull requests to `main` ("A-bitdikdən sonra növbəti PR-lar yalnız develop brachinə olacaq"), and
before the retrospective (T-15c); until 2026-09-26 this said "from the close of Release 1". ~~Until
T-15b nothing changes: working branches start from `origin/main` and their pull requests target
`main` (AGENTS.md §2).~~ (v1.6: T-15b has switched; AGENTS.md §2 starts from `origin/develop`.)

Since T-15b (2026-09-29; plan `plans/2026-09-29-T-15b.md`):

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
- **A hotfix is fixed on `develop` first** (owner decision, 2026-09-29, T-15b plan Q3: "Hotfix
  developa merge. yoxlanılır. Sonra main yeni eyni adlı hotfix/...-main adlı branch yaranır və
  həmin hotfix ora cherry-pick olur. Sonra pr açılıb merge olunur."): the fix is made on
  `hotfix/<name>` from `origin/develop`, merged into `develop` and checked there; then
  `hotfix/<name>-main` is started from `origin/main`, the fix is cherry-picked onto it (`git
  cherry-pick -x`), and that branch's pull request goes to `main`. `develop` already has the fix,
  so nothing needs merging back. The next release carries the same change a second time, as its
  original commit; git merges an identical change cleanly unless later work on `develop` edited
  the same lines, and then `develop`'s side is kept.
- **The owner merges the release and the hotfix pull requests** (Decision rights: merging is
  the owner's).
- **Copilot's review gates nothing.** Its review runs on every pull request (the rulesets "main:
  pull request, Copilot, CodeQL" and "develop: pull request, Copilot, CodeQL"; until T-15b the one
  "Copilot review for default branch") but is not reliable enough to hold a merge (owner, 2026-09-26: "Copilot
  review qoşulsada stabil deyil"), and no rule requires an approval: the owner is the only
  collaborator and author of every pull request, so a required approval would block every merge
  (`.github/CODEOWNERS` says why). What gates a merge is the pull request itself and the required
  checks.
- **Enforcement:** a required status check in `main`'s ruleset fails unless the pull request's
  head branch is `develop` or `hotfix/<name>-main` in this repository, and the ruleset has no
  bypass actor. The agent pushes with the owner's GitHub account, so a bypass right for the owner
  would be one for the agent too. The check enforces the source, not the moment; that a release
  pull request is opened only when a release is due is this rule. Direct pushes, force-pushes and
  deletion of `main` and of `develop` are refused by their rulesets. The check is
  `.github/workflows/release-source.yml` (job `release source`, a `pull_request_target` workflow,
  which GitHub runs from the default branch) and `scripts/check-release-source.sh`, tested by
  `tests/unit/release-source.test.ts`. Its limit: a ruleset matches a required check by name, so
  a pull request that added its own job named `release source` could pass it; the check guards
  against the wrong source branch, not against the author, and such a workflow shows in the diff.

Settled at the switch (T-15b, 2026-09-29 — the plan, its answers and the process-log entries of
that day have the evidence):

- **The rulesets.** `main`'s two were pinned from "the default branch" to `refs/heads/main` before
  the default changed — otherwise they would have followed it to `develop` — and one was renamed:
  "main: pull request, Copilot, CodeQL" (id 23907266; deletion, non-fast-forward, Copilot review,
  pull request, code quality, CodeQL) and "main: required CI checks" (24007893; the seven checks and
  `release source`). `develop` has copies: "develop: pull request, Copilot, CodeQL" (24155781) and
  "develop: required CI checks" (24155784; the seven). No bypass actor in any. Compared on
  2026-09-29: the rules are identical except `release source`.
- **`develop`** was created from `main` at `cb6f845` (T-15a's last merge). CI runs on pushes to
  both branches and on every pull request; CodeQL on pushes and pull requests of both.
- **The default branch is `develop`** (plan Q2): so the check's workflow runs from `develop`,
  `gh pr create` and GitHub's "Compare & pull request" default to `develop`, and Dependabot's pull
  requests open against `develop` (version updates, which set no `target-branch`; security updates
  too, as GitHub's `target-branch` reference implies — not yet observed here).
  CodeQL's weekly schedule scans `develop`. Vercel's production branch is a separate, stored setting
  and still reads `main` (read after the change).
- **The check was probed**: a draft pull request to `main` from a branch named otherwise (#76)
  read `release source` failed and `BLOCKED`, and was closed unmerged.
- **Merge commits only, on both branches** (v1.7, owner decision 2026-09-29, T-15b plan Q5 option
  (b); until then "not restricted"): the pull-request rule of "main: pull request, Copilot, CodeQL"
  and of "develop: pull request, Copilot, CodeQL" allows `merge` alone, so GitHub offers neither
  squash nor rebase. A release or a hotfix merged by squash or rebase would leave `develop` without
  `main`'s commit, and the next release would show old changes again. The owner, asked what a merge
  commit is, chose it for both branches and added: "heç birinə bir başa push mümkün olmasın" ("no
  direct push to either") — which the same rule already enforces (a change reaches either branch
  only through a pull request; `non_fast_forward` refuses a force-push, `deletion` a deletion; no
  bypass actor, read back 2026-09-29).
- **Previews** are unchanged: the Neon–Vercel integration makes a Neon branch per pushed Git
  branch, whatever a pull request's base. There is no "Neon preview workflow" (the line below that
  named one was written before T-14 replaced it with the integration). `develop`, once pushed, holds
  one of Neon's ten branch slots.
- **Not yet observed:** a `develop` → `main` release under these rules — the check's green on it,
  and `develop` kept after its merge (the `deletion` rule should stop the automatic branch deletion).
  The first release after T-15b is where they are read.

**Draft until ready** (v1.8, owner decision 2026-10-03, T-15c retrospective P6: "draftdan çıxmış
branchlər merge hazır sayılır və mən merge edirəm" — "a branch that has come out of draft counts as
ready to merge, and I merge it"). A pull request that is not a draft is merge-ready, and the owner
merges it without a further check. Unfinished work — a plan waiting for answers, a pull request
waiting for review fixes or CI, a document waiting for the owner — stays a draft
(`gh pr create --draft`). The agent takes a pull request out of draft (`gh pr ready`) only when its
content is finished, every required check is green, and the checklist items the agent can tick are
ticked. A ready pull request gets no more pushes: further work goes in a new pull request, or the
pull request is first put back into draft (`gh pr ready --undo`).

Open at the switch (as written before T-15b; settled above):

- **The switch is T-15b** (backlog v1.48; until 2026-09-26 it was "a task of its own, run after
  T-15 closes Release 1"). Its plan covers: creating `develop` from `main`; adding `develop` to `ci.yml`'s push trigger and to
  both triggers of `codeql.yml` (CodeQL runs only for `main` today, so a `develop` ruleset's
  CodeQL gate would have nothing to read); a ruleset for `develop` that mirrors `main`'s; the
  check workflow and its place in `main`'s ruleset; AGENTS.md §2 ("start from `origin/main`");
  the pull-request template; the base branches of T-14's Neon preview workflow; and when
  `main`'s ruleset starts requiring the head-branch check, whose workflow reaches `main` only with
  the first `develop` → `main` release pull request, since T-15b's own pull requests target
  `develop`.
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
