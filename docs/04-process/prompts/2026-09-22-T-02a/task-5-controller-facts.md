# Task 5 — facts only the controller holds (controller ruling P3)

Use these values verbatim where the brief leaves a slot. Everything else comes from the brief.

## 1. Prompt file — the last angle-bracket line

Replace `<the go-ahead, verbatim with its date>` with exactly:

```markdown
2026-09-22 12:51 +04, the go-ahead, verbatim:

> Subagent-Driven başla. model seçimlərini iş effort səviyyəsinə görə təyin edərsən.

("Start subagent-driven. Choose the models by the effort level of the work.") The agent
executed the plan with the superpowers `subagent-driven-development` skill, one workflow run
per plan task (implementer → review package → task review → fix rounds); the briefs,
reports, reviews, ledger and the dispatch script are in `2026-09-22-T-02a/`.
```

and delete the sentence after the code block that tells you to replace it (it applied to
this slot only). The file must contain no angle-bracket placeholder when committed.

## 2. Process-log entry — "What the agent got wrong or missed"

Replace `<from the session; "none observed" if none>` with this list (keep it a nested
list under the bullet, two-space indent, wrapped at ~92 columns like the rest of the log):

1. The plan contradicted itself: decision D10 says the blocked-commit message names
   `git commit --no-verify`, but the plan's hook code never printed it. The Task 3 review
   caught it; fixed in `7d2357f` with a test assertion, so the test file differs from the
   plan's Appendix A by that one line.
2. The first plan draft tripped its own new rule: the evidence table quoted a literal
   Postgres URI whose password was `pass` (plan E18). Found by scanning the plan before
   committing it; rewritten without a literal URI.
3. Plan question 2 assumed the reader knew what a path allowlist does; the owner could not
   answer it and it was re-asked in plain terms with the consequence of each answer.
4. Plan Task 1 Step 1 first told the executor to `git switch` onto a branch another
   worktree had checked out; corrected in the plan (`8c4af2f`) before execution.
5. Plan Task 1 Step 10 prescribed `gitleaks git --pre-commit --staged`, which the subagent
   sandbox refuses; the controller verified the same bytes with a git-mode scan of the task
   range (1 commit, no leaks), and from Task 3 on the installed hook ran the literal command
   on every commit.

## 3. Process-log entry — add one bullet after "Produced"

```markdown
- **Execution:** subagent-driven, one workflow run per plan task; models by effort, as the
  owner asked — Sonnet implementers, Opus for the Task 1 review (the security core: rule,
  allowlists, checksum wrapper), Sonnet for the other reviews, Haiku for review packaging,
  Opus for the final whole-branch review. One fix round (Task 3). CI on PR #1: `lint ·
  typecheck · unit` 144/144, `secret scan` 59 commits and no leaks (the first run of the
  wrapper's `linux_x64` branch), `npm audit` 0 vulnerabilities.
```

## 4. Session record — `docs/04-process/prompts/2026-09-22-T-02a/`

Copy from the workspace `.superpowers/sdd/2026-09-22-T-02a/`:

- `task-1-brief.md` … `task-5-brief.md`
- `task-1-report.md` … `task-4-report.md`, and your own `task-5-report.md` last, once it is
  complete
- `task-1-review.md` … `task-4-review.md`, `task-1-rereview-1.md`, `task-3-rereview-1.md`
- `context.md`, `appendix-a.md` (what every dispatch read), `task-5-controller-facts.md`
- `progress.md` (the controller's ledger, as it stands when you copy it)
- `sdd-task-workflow.js` (the workflow script that dispatched every subagent)

Do NOT copy: `review-*.diff` (git reproduces them), `pr-draft-body.md`, `pr-body.md`,
the `workspace/` subdirectory.

Write `docs/04-process/prompts/2026-09-22-T-02a/README.md` modelled on
`docs/04-process/prompts/2026-09-20-T-01/README.md`: what the folder is (working record, not
a specification), how the session ran (the skill, one workflow run per task, models by
effort), a table of the files, and the deliberate absences (the diffs; the final
whole-branch review, which runs after this commit and is added by the controller's final
dispatch).

The pre-commit hook scans what you stage. If it blocks on a copied artifact (for example a
report that quotes a materialised fake connection string), do not use `--no-verify`:
replace the fake password in the copied file with `{{PASSWORD}}` and say so in the README.

## 5. PR description — `.superpowers/sdd/2026-09-22-T-02a/pr-body.md`

Write the brief's Step 5 body to this file (the controller runs `gh pr edit`), with these
changes:

- In "Code", the mutation list also names: "the blocked-commit message's `--no-verify`
  lines removed (Task 3 fix)".
- In "Tests", the CI line reads: "CI green on this PR: `lint · typecheck · unit` (144/144),
  `secret scan` (59 commits, no leaks; first `linux_x64` run of the wrapper), `npm audit`
  (0 vulnerabilities; reports without blocking — owner decision)."
- In "Scope and traceability", add: "- [x] One owner-approved deviation from the plan's
  code: the blocked-commit message names `git commit --no-verify`, as plan decision D10
  requires (the plan's hook code omitted it); the test file differs from the plan's
  Appendix A by that one assertion."
- Keep the closing line exactly: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

## 6. Outward actions

Commit locally (through the hook). Do not push, do not run any `gh` command (ruling P1).
