# Governance — who decides what

Status: Approved (Phase 0, 2026-09-08) · v1.1 2026-09-22: review subagents run without write tools (T-02a incident) · v1.2 2026-09-22: implementer constraints, reported output, predictions, test config (T-02 lessons) · v1.3 2026-09-24: code review subagents use Opus 5.5 (owner decision) · v1.4 2026-09-25: branches and releases — `develop` from the close of Release 1, `main` takes releases only (owner decision) · v1.5 2026-09-26: `main` and `develop` take changes only through a pull request, `main` only from `develop` or a hotfix branch; Copilot's review gates nothing; T-16 closes before T-15 and does not wait for the switch; the switch is T-15b, after T-15a and before the retrospective (owner decisions) · v1.6 2026-09-29: the switch is done (T-15b) — `develop` is the default branch; a hotfix is fixed on `develop` first and reaches `main` as `hotfix/<name>-main`, a cherry-pick (owner decision); the rulesets and the `release source` check that enforce it; "Open at the switch" becomes "Settled at the switch" · v1.7 2026-09-29: merge commits only on `main` and `develop`; no direct push to either (owner decision) · v1.8 2026-10-03: a question to the owner can be answered as written; a pull request that is not a draft is merge-ready and unfinished work stays a draft (owner decisions at the T-15c retrospective, P5 and P6) · v1.9 2026-10-04: before taking a pull request out of draft the agent waits for Copilot's review of the branch's current head and has fixed its important findings (owner decision at T-15d) · v1.10 2026-10-05: design questions are the designer's — the agent tells the owner, the owner takes it to the designer, the designer records the decision in the designer's changelog, and the agent applies it from there (owner decisions at T-15d) · v1.11 2026-10-06, extended 2026-10-10: the designer agent decides design questions in every phase, as the only route (the v1.10 route is retired), and may ask the owner a question, and the owner approves its decision with `/designer-approve` before it writes (owner decisions) · v1.12 2026-10-10: the designer agent is the repository's own `.claude/agents/designer.md`, loaded by every session in the repository, in place of the mod; it proposes and applies, and the owner's approval is the owner's own message, without the `/designer-approve` guard (owner decisions)

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
| The design itself: a look, a value, a size, a token, a drawn behaviour (v1.10, v1.11, v1.12) | Approves the designer agent's decision before it is recorded, in the owner's own message | Asks the designer agent, which decides and, once the owner approves, records the decision in the designer's changelog; applies it, citing its section |
| Implementation details within an approved spec | — | Decides, documents in PR |
| Test design within the testing ADR | — | Decides |
| Marking anything Approved/Accepted | Only | Never |
| Merging | Only | Never |

**Design questions are decided by the designer** (v1.10, owner decisions 2026-10-05, T-15d, while
`ui-kit.md` was drafted in #92: "dizayner üzrə qərarlar dizayner verir" — "decisions about the
design are made by the designer"; then "Dizayndan kənara çıxma mənə deyilir mən dizaynerlə müzakirə
edirəm. Onun sonra qərarı changelogunda qeyd olunur" — "a departure from the design is told to me; I
discuss it with the designer. The designer's decision is then recorded in their changelog"). The
designer works in the designer's Claude Design project; documents name it, and the designer's
changelog, that way and never by an address or an id. A question about the design itself — a look, a
value, a size, a token, a drawn behaviour — goes this way:

**In every phase, through the designer agent** (v1.11, owner decisions 2026-10-06: "Özü qərar verir, sən
təsdiqləyirsən" — "it decides itself, you confirm"; and "bu həmçinin kod yazma prosesindədə çıxan
qərarlarda iştirak edir. Nə zaman dizayn qərarı lazımdırsa. Tək spec yazarkən yox. Bütün proses vaxtı" —
"it also takes part in the decisions that come up while code is written: whenever a design decision is
needed, not only when a spec is written, but during the whole process"). The designer agent is a
persona subagent (`designer`, defined in the repository's `.claude/agents/designer.md`, v1.12) that takes the designer's role: it reads the designer's
live sources, decides, and, once the owner has approved, writes to the designer's Claude Design project.
It runs in two modes, and the second needs the owner's approval named in its prompt:

1. **The agent that meets the question does not decide it.** It can be a spec being drafted, code being
   written, a review or a bugfix. The agent asks the designer agent in *propose* mode, stating the
   question and where it came from (the spec section, the file, the component). An implementer or
   review subagent, which cannot dispatch the designer agent, stops that part of its work and returns
   `DESIGN-Q: <question, file, component>` to the controller, which asks; it does not choose
   (`build-workflow.md`, rules of thumb).
2. **The designer agent proposes.** It reads the designer's changelog, the app design and the style
   guide live, not an older export, and the repository's documents the question touches. It returns the
   design as it stands, two or three options with their trade-offs, the decision it takes, the files and
   sections it would change, and a draft changelog entry. In this mode it writes nothing. Where the answer
   is a fact only a person has (the intent behind a screen, which of two uses matters more) and neither
   the design nor the documents give it, it may instead ask the owner one question (owner decision,
   2026-10-10: "dizayner insana sual verə bilər" — "the designer can ask a person a question"); the agent
   puts the question to the owner and returns the owner's answer, and the designer agent goes on in
   *propose* mode. The answer is not an approval: only step 3 opens step 4.
3. **The owner approves, or decides otherwise.** The agent relays the proposal. The owner's word wins:
   the owner may approve, choose another option, or override a decision already recorded (as for the
   designer's changelog §16a, 2026-10-05, where "hazırda form qərarları dəyişmir" — "the form decisions
   are not changing now" — kept Release 1 behaviour). The approval is the owner's own message naming the
   decision; the agent quotes it after "OWNER APPROVED:" (v1.12, owner decision 2026-10-10, "Təklif və
   tətbiq" — "propose and apply"). The v1.11 `/designer-approve` guard belonged to the mod, which a session
   started remotely does not load ("hazırda həmin agent mod-dur və sesiya vaxtı qoşulur. Bunun üçün yeni
   agent yarat" — "that agent is a mod and attaches at session time; create a new agent for this"); an
   agent file cannot hold such a guard, so the owner chose to rely on the quoted approval.
4. **The designer agent applies, in *apply* mode.** Only after "OWNER APPROVED: <the decision>", quoting
   the owner's own approval, it makes the smallest change in the designer's Claude Design project and
   records the decision in the designer's changelog, stated as a decision. It returns the changelog
   section and the files changed. Only the designer agent writes to the designer's Claude Design project,
   and only for a decision the owner approved; without the quoted approval it writes nothing and answers
   `APPROVAL-MISSING`. In a session without the mod, no tool enforces this (v1.12): it is a rule of the
   agent's prompt and of this document. The mod stays installed on the owner's Mac (owner decision,
   2026-10-10, "Saxla" — "keep it"); in a session that loads it, its guard still refuses Claude Design
   writes from any agent but `designer-agent:designer`, so there the write goes through the mod's agent
   and the owner's `/designer-approve`. The owner's own `/design-sync` and the owner's own writes in Claude Design stay outside
   it.
5. **The agent cites the answer**, naming the changelog's section (for example "the designer's
   changelog §8a"), in the spec, the pull request and the code. A changelog entry that is a proposal, an
   option or a note to discuss, not stated as a decision, is not yet the answer, and the question stays
   open.

**The designer agent is the only route** (owner decision, 2026-10-10: "yol 2 ancaq" — "route 2 only").
The v1.10 route, in which the owner took a question to the human designer, who recorded the decision in
the designer's changelog for the agent to read, is retired: an entry written that way after v1.11 is not
an answer. Where the designer agent is not available (a session without the Claude Design tools, such as
a cloud session, where it answers `DESIGNER-UNAVAILABLE`), the agent
does not decide a design question and does not look for one in the changelog: it tells the owner in the
spec's §9 and the pull request, as for any open question, and the question stays open until the designer
agent can be asked.

What the designer's changelog already records before v1.11 stays an answer to the question it decided,
and the agent may cite it (for example "92 q4 və q5 cavabı claude design-dan götür" — "for #92 take the
answers to Q4 and Q5 from Claude Design" — read what is recorded there, step 5).

Still the owner's, whatever the design says:

- **A trade-off against an approved non-functional requirement.** An approved NFR wins over the
  design unless the owner says otherwise (the owner's ruling on `transactions.md` §9 Q5, 2026-10-04:
  "NFR-A1 ödənməlidir" — "NFR-A1 must be met"). A general instruction such as "Designer qərarlarına
  əsas götür" ("take the designer's decisions as the basis") does not answer such a question; it is
  asked directly.
- **Scope.**
- **User-facing strings that the design does not already fix.**
- **Every amendment of an Approved document**, which the owner approves by merging its pull request.
  Where the design contradicts an Approved document (the designer's page-title format against
  `app-shell.md` §2.5, T-15d), the agent tells the owner, as for any open question; so does a decision of
  the designer agent that would contradict an Approved spec: the spec is amended in a pull request the
  owner approves by merging, and the code follows after, never before.

Unchanged: a spec never departs from what the design draws on its own (the S2 lesson: `transactions.md`
v0.2 wrapped long names without asking, and v1.0.2 replaced it with the owner's truncation). Additions
the design cannot show — accessible names, focus, keyboard behaviour, ARIA, URL state — are listed in
the spec as departures, each with its source (an NFR, a WCAG rule, a story).

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
  only. (T-02, Task 5.) They also never decide a design question: they stop that part and
  return `DESIGN-Q: <question, file, component>` to the controller (v1.11; "Design questions
  are decided by the designer").
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
  review qoşulsada stabil deyil"; since v1.9 the agent nevertheless waits for it before taking a pull
  request out of draft, "Draft until ready" below), and no rule requires an approval: the owner is the only
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
content is finished, every required check is green, the checklist items the agent can tick are
ticked, **and Copilot has reviewed the branch's current head and no important finding of it is
left unfixed** (v1.9, below). A ready pull request gets no more pushes: further work goes in a
new pull request, or the pull request is first put back into draft (`gh pr ready --undo`).

**Copilot's review is waited for** (v1.9, owner decision 2026-10-04, T-15d: "Copilot məcburi
revyu edəndir və onun revyularını bitirmək gözlənməlidir. Vacib tapıntılar fix olmalıdır." — "Copilot
is the mandatory reviewer and its reviews must be waited for to finish. Important findings must be
fixed."). Before `gh pr ready`, Copilot's review of the branch's **current head** must exist: a review whose
`commit_id` is the head's commit, and whose author is Copilot (`copilot-pull-request-reviewer[bot]`).
Two commands show it (the first prints the head's full SHA; the second lists the commit of every
Copilot review, and the head's SHA must be among them):

```sh
gh pr view <n> --json headRefOid --jq .headRefOid
gh api --paginate repos/<owner>/<repo>/pulls/<n>/reviews --jq '.[] | select(.user.login=="copilot-pull-request-reviewer[bot]") | .commit_id'
```

A review of an earlier commit does not count. Every fix is itself a new push and so a new head, which Copilot reviews
again; the agent therefore pushes the fixes, waits for the review of the new head, and leaves draft only
on a head whose review is in and has no important finding still open. Each finding is fixed, or answered
with its reason in the pull request. An **important** finding is one the agent confirms is a defect — a
wrong fact or number, a contradiction, a broken command, a failing or vacuous test, a missed
requirement — whatever severity Copilot gave it; those are always fixed before the pull request leaves
draft. A finding that is a matter of taste may be declined with a sentence of reasoning. If Copilot has
not reviewed the current head after a reasonable wait, the agent leaves the pull request in draft and
tells the owner, instead of marking it ready. This changes what the
agent waits for, not what GitHub enforces (the bullet "Copilot's review gates nothing", above).

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
