# T-13c session record — briefs and reports

The briefs the T-13c implementer subagents were dispatched with, and the reports they wrote back,
copied from the agent's scratch directory on the task branch before the PR (Task 7's, after the PR
was opened), per `build-workflow.md` §7. Nothing here is a specification: these are working notes, kept so the session is reproducible
and reviewable. The session's own prompt file is the sibling `../2026-09-24-T-13c.md`; the plan is
`docs/04-process/plans/2026-09-24-T-13c.md` (on branch `docs/T-13c-plan` until the owner merges the
plan branch; no PR opened yet).

A *brief* is the plan text of one task, extracted for a subagent; a *report* is what the subagent
wrote back, including the commands it ran, the output it copied from them, and where it deviated.
Commit ids inside them are the ids at the time of writing; if the branch is rebased before it
merges, `git log --oneline origin/main..task/T-13c-tech-debt` has the final ids (the subjects
match). Absolute home-directory paths in them are the ones the T-16 hand-off in `backlog.md`
already covers; they are not redacted here. They also carry fake connection strings (the test
URLs of TD-10, with the password `password` or a `${SECRET}` variable): `sh scripts/secret-scan.sh
staged` reported nothing on them, so no value was replaced and no allowlist was touched.

| Files                                | What it is                                                                                                                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task-1-brief.md`, `task-1-report.md` | TD-7: `register()` tells the status listeners a failure is cleared before its tools settle.                                                                                                                                     |
| `task-2-brief.md`, `task-2-report.md` | TD-8: the keyboard login walkthrough's comment says what the test does; no failing-first test (owner waiver, Q1).                                                                                                               |
| `task-3-brief.md`, `task-3-report.md` | TD-9: a bare `fr` column track fails Stylelint (`stylelint` 17.15.0, a new dev dependency, Q4).                                                                                                                                  |
| `task-4-brief.md`, `task-4-report.md` | TD-10: `APP_ENV=test` and database resets refuse to run outside this machine. The report includes fix round 1 (`c316e3b`): the guard reads a URL the way node-postgres does.                                                    |
| `task-5-brief.md`, `task-5-report.md` | TD-11: Public Sans from committed files. The report includes fix round 1 (`5d015bf`): the README's account of the ESLint restriction's scope.                                                                                    |
| `task-6-brief.md`, `task-6-report.md` | This records task: the three layer READMEs, `tech-debt.md` v1.12, `backlog.md` v1.27, SPEC-reset-and-test-support v1.6, the process-log entry, this folder, and the full verification run. |
| `task-7-brief.md`, `task-7-report.md` | The follow-up, made after PR #39 was opened: the owner's choice "B" — `npm run db:reset` refuses another machine's database before `prisma migrate deploy` applies any migration (`prisma.config.ts`, three tests in `database-guard.test.ts`), and the records that said otherwise. Two commits. |

Absences, all deliberate:

- **There are no review files.** The session directory holds none: the reviewers' findings reached
  the controller as messages, and are recorded in the follow-up rounds of the reports (Tasks 4 and
  5) and in the process-log entry's "What the agent got wrong".
- **The controller's ledger (`progress.md`) is not copied.** It is neither a brief nor a report.
  It stays in the git-ignored session directory, with the plan-path file and the commit-message
  files. The rulings that mattered, the deferred minors and the deviations are restated in the
  process-log entry.
- **The controller's dispatch messages are not copied.** Each implementer received the brief and,
  with it, a message with the context, the rulings so far and the report format; only the briefs
  were saved as files.
- **The `review-*.diff` files are not copied.** They are generated views of ranges git already
  holds; `git diff <base>..<head>` reproduces any of them.
- **The screenshots of Task 5 (`screenshots/`, six PNG files) are not copied.** They are images of
  the login and Overview pages at 1440, 768 and 375 px, made for the pull request description.

`task-6-report.md` was copied last of the original run's files, after everything else that was then
in this folder, and is the only report of that run written after the other files were copied. The
follow-up's two files are later still: `task-7-brief.md` and `task-7-report.md` were copied after
the pull request was opened, into the commit `docs: record the owner's B on db:reset — tech-debt,
backlog, SPEC-reset v1.6, process log, prompts`, and `task-7-report.md` was copied last of all.
