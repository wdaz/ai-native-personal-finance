# T-01 session record — briefs, reports and ledger

The working record of the T-01 scaffold session, copied here from the agent's scratch
directory on the task branch before the PR, per `build-workflow.md` §7. Nothing here is a
specification: these are working notes, kept so the session is reproducible and reviewable.
The task's own prompt is the sibling file `../2026-09-20-T-01-scaffold.md`; the plan is
`../../plans/2026-09-20-T-01.md`.

The session ran the plan through the superpowers `subagent-driven-development` skill: one
implementer subagent per task, a reviewer after each, then a whole-branch review and one
fix wave. A *brief* is the requirements extract a subagent was dispatched with; a *report*
is what it wrote back, including the commands it ran and where it deviated.

| File | What it is |
|------|------------|
| `handoff.md` | The hand-off: clean-state verification results, the Definition of Done checklist item by item, the three decisions left to the owner, and the draft process-log entry. **Start here.** |
| `progress.md` | The controller's ledger — the pre-flight conflict scan of the plan, every ruling the agent made on the owner's behalf with what it would cost if wrong, and each task's completion line. The record of *why* the branch looks the way it does. |
| `fix-final-report.md` | The fix wave that closed the whole-branch review's sixteen findings, including the clean-room `allowScripts` experiment — and, kept deliberately, the earlier wrong conclusion it corrected. |
| `task-4-brief.md`, `task-4-report.md` | Vitest configuration. |
| `task-5-brief.md`, `task-5-report.md` | `src/ui/tokens.css` from `design-tokens.md`, Public Sans, the 30 avatars. |
| `task-6-brief.md`, `task-6-report.md` | `.env.example` and its drift check. |
| `task-7-brief.md`, `task-7-report.md` | Playwright on Chromium, Firefox and WebKit. |
| `task-8-brief.md`, `task-9-brief.md`, `task-89-report.md` | README "Run locally" and the minimal CI workflow — two briefs, batched into one implementer, one report. |

Two absences are deliberate:

- **Tasks 1-3 have no brief or report.** They are the npm package, the ADR-0002 folder tree
  and the ESLint/Prettier configuration; the controller implemented them directly, before
  the plan gate was observed. That is the session's first recorded mistake and it is
  described in `handoff.md` and in the process log.
- **The `review-*.diff` files are not copied.** They are generated views of ranges that git
  already holds; `git diff <base>..<head>` reproduces any of them.
