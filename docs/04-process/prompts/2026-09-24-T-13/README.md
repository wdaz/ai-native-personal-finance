# T-13 session record — briefs and reports

The briefs the T-13 implementer subagents were dispatched with, and the reports they wrote back,
copied from the agent's scratch directory on the task branch before the PR, per `build-workflow.md`
§7. Nothing here is a specification: these are working notes, kept so the session is reproducible
and reviewable. The session's own prompt file is the sibling `../2026-09-24-T-13.md`; the plan is
`docs/04-process/plans/2026-09-24-T-13.md` (on branch `worktree-t-13-plan` until its docs PR merges).

A *brief* is the plan text of one task, extracted for a subagent; a *report* is what the subagent
wrote back, including the commands it ran, the output it copied from them, and where it deviated.
Commit ids inside them are the ids at the time of writing; Tasks 1–5 were rebased onto the
merged PR-A (`99298f9`) afterwards, so `git log --oneline origin/main..task/T-13-ci-hardening` has
the final ids (the subjects match). Absolute home-directory paths in them are the ones the
T-16 hand-off in `backlog.md` already covers; they are not redacted here.

| Files | What it is |
|-------|------------|
| `pr-a-brief.md`, `pra-a1-report.md`, `pra-a2-report.md`, `pra-a3-report.md` | PR-A (`fix/origin-agent-cluster`, PR #28): the `Origin-Agent-Cluster` header (A1), reporting a failed WebMCP registration (A2), the ADR-0006 amendment and SPEC-webmcp-tools v1.0.5 (A3). One brief covers all three; each task has its own report. |
| `task-1-brief.md`, `task-1-report.md` | Read-only workflow token; the `concurrency` group split. |
| `task-2-brief.md`, `task-2-report.md` | The 90 % coverage gate on `src/domain`; `vite-tsconfig-paths` dropped; `coverage.include` narrowed. |
| `task-3-brief.md`, `task-3-report.md` | The traceability script and `release-1-stories.txt`; the report includes two fix rounds (the syntax-tree scanner). |
| `task-4-brief.md`, `task-4-report.md` | The schema-vs-migrations drift check. |
| `task-5-brief.md`, `task-5-report.md` | The PR template mirroring the Definition of Done. |
| `task-6-brief.md`, `task-6-report.md` | The axe gate on every route. |
| `task-7-brief.md`, `task-7-report.md` | `strict-allow-scripts=true` and the `fsevents` denial; the Linux check in Docker; `engines.npm`. |
| `task-8-brief.md`, `task-8-report.md` | Commit and tag messages in the history scan. |
| `task-9-brief.md`, `task-9-report.md` | TD-4: the four focus tests submit with Enter. |
| `task-10-brief.md`, `task-10-report.md` | Firefox and WebKit in CI (four E2E legs). |
| `task-11-brief.md`, `task-11-report.md` | This records task: backlog v1.22, tech debt v1.9, the overrides note, README, the process-log entry, this folder. |

Absences, all deliberate:

- **There are no review files.** The session directory holds none: the reviewers' findings reached
  the controller as messages, and are recorded in the follow-up rounds of the reports and in the
  process-log entry's "What the agent got wrong".
- **The controller's ledger (`progress.md`) and the plan pre-flight scan (`preflight.md`) are not
  copied.** They are neither briefs nor reports (T-02a copied its ledger; this session's task
  brief for the records task said to copy briefs and reports only). They stay in the git-ignored
  session directory. The rulings that mattered are restated in the process-log entry.
- **The `review-*.diff` files are not copied.** They are generated views of ranges git already
  holds; `git diff <base>..<head>` reproduces any of them.
- **`plan-path`** holds one line, the plan's path; nothing to copy.

`task-11-report.md` was copied last, after this task's final commit was prepared, and is the only
report written after the run's other files were copied.
