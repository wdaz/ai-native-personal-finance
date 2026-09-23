# 03 — Feature specs and plan

Status: **In progress** (entered 2026-09-13) — Release 1 specs v0.2 after adversarial review 2026-09-20: `auth.md`, `app-shell.md`, `overview.md`, `webmcp-tools.md`, `reset-and-test-support.md`, `definition-of-done.md`, `backlog.md` — **approved by owner 2026-09-20 (Phase 4 exit for Release 1)**; Release 2 specs (transactions, budgets, pots, recurring-bills) follow after the first slice

Purpose: turn requirements plus architecture into feature specifications an
agent can implement and a test can verify, then decompose the work into
agent-sized tasks.

## Deliverables

| File | Description | Exit gate |
|------|-------------|-----------|
| `<feature>.md` | One spec per feature (overview, transactions, budgets, pots, recurring-bills, auth, webmcp-tools): behaviour, states, errors, boundaries, tools exposed, tests required | Reviewed by owner; every story it covers is listed |
| `definition-of-done.md` | What "done" means for any task: tests, spec trace, process-log entry, review | Approved |
| `backlog.md` | Ordered tasks, each small enough for one agent session, each pointing to a spec section | First slice selected |
| `tech-debt.md` | Known shortcuts kept by owner decision (`TD-n`): risk, guard, fix, the task that picks each up; linked from the backlog's Notes (added 2026-09-23) | Each entry carries the owner's decision |

Template: `docs/templates/feature-spec.md`.
