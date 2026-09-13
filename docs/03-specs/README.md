# 03 — Feature specs and plan

Status: **In progress** (entered 2026-09-13)

Purpose: turn requirements plus architecture into feature specifications an
agent can implement and a test can verify, then decompose the work into
agent-sized tasks.

## Deliverables

| File | Description | Exit gate |
|------|-------------|-----------|
| `<feature>.md` | One spec per feature (overview, transactions, budgets, pots, recurring-bills, auth, webmcp-tools): behaviour, states, errors, boundaries, tools exposed, tests required | Reviewed by owner; every story it covers is listed |
| `definition-of-done.md` | What "done" means for any task: tests, spec trace, process-log entry, review | Approved |
| `backlog.md` | Ordered tasks, each small enough for one agent session, each pointing to a spec section | First slice selected |

Template: `docs/templates/feature-spec.md`.
