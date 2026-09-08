# 00 — Discovery

Status: **Not started**

Purpose: understand the problem, the users and the constraints well enough to
write requirements — and no further. This phase produces reasons, not
solutions.

## Deliverables

| File | Description | Exit gate |
|------|-------------|-----------|
| `problem-statement.md` | Who, what problem, why now, what success looks like, what is out of scope | Owner approves |
| `inputs/` | Everything we were given: challenge brief, seed data, links to design | Inventory complete, each input summarised |
| `research/*.md` | External facts we depend on (WebMCP maturity, testing tooling, comparable products), each dated and sourced | Every fact used later cites a note |
| `assumptions-and-questions.md` | What we are assuming and what we still do not know, each with an owner and a due phase | Reviewed; nothing blocking Requirements |

## Inputs already available

- `inputs/challenge-brief.md` — the Frontend Mentor challenge text (functional expectations, bonus tracks).
- `inputs/data.json` — seed data the challenge ships with.
- `inputs/design/` — Claude Design exports: rendered style guide and interactive app prototype (see its README for what they are and their gaps).
- Figma file `personal-finance-app.fig` — kept outside the repo. Do not copy it in.

## Not allowed in this phase

Framework choice, database choice, component structure, folder layout of the
app. Write those as open questions for Phase 3.
