# 01 — Requirements

Status: **Not started** (blocked by Discovery exit gate)

Purpose: state precisely what must be true for the product to be done, in a
form both a human reviewer and a coding agent can verify.

## Deliverables

| File | Description | Exit gate |
|------|-------------|-----------|
| `prd.md` | Goals, non-goals, users, scope by release, success metrics, risks | Owner approves |
| `user-stories.md` | `US-xx` stories with Given/When/Then acceptance criteria, each traceable to the brief or the problem statement | Every story has ≥1 testable criterion; no story implies an implementation |
| `non-functional-requirements.md` | Testing (unit + E2E coverage expectations), WebMCP exposure (which capabilities, which safety rules), accessibility, performance, security | Each NFR is measurable |

## Notes

The three portfolio additions — unit tests, E2E tests, WebMCP — live here as
non-functional requirements. They are not features bolted on later; they
constrain every feature spec in Phase 4.
