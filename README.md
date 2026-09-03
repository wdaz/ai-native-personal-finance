# AI-Native Personal Finance

A portfolio project with two deliverables:

1. **The product** — a full-stack implementation of the Frontend Mentor
   *Personal Finance App* challenge (overview, transactions, budgets, pots,
   recurring bills), extended with unit tests, end-to-end tests and
   **WebMCP** (the page exposes its own capabilities as tools to in-browser
   AI agents).
2. **The process** — an *AI-native SDLC* in which every phase from idea to
   shipped code is documented, and the documents are the working context for
   AI agents. The point of this repository is the second deliverable as much as
   the first: it shows how an idea is analysed, specified and built *with*
   LLMs, not just that an app exists.

> Status: **Phase 0 — skeleton.** No product decisions have been made yet.
> The stack, testing approach and WebMCP design are open until
> `docs/02-architecture/` records them.

## How to read this repository

| Path | What it is | Read it when |
|------|------------|--------------|
| `AGENTS.md` | Rules and reading order for AI agents (and humans) | Always, first |
| `docs/README.md` | Map of the documentation and the phase it belongs to | You want to know where something lives |
| `docs/00-discovery/` | Problem statement, inputs, research, assumptions | You want to know *why* this exists |
| `docs/01-requirements/` | PRD, user stories, acceptance criteria, non-functional requirements | You want to know *what* must be true |
| `docs/02-architecture/` | ADRs, system boundaries, data model | You want to know *how* it is shaped and why |
| `docs/03-specs/` | Feature specifications precise enough for an agent to implement | You are about to build or test a feature |
| `docs/04-process/` | Roadmap, governance (who decides what), process log | You want to see how the work was actually done |
| `docs/templates/` | Templates for every document type above | You are creating a new document |
| `apps/` | Application code (empty until Phase 5) | You are building |

## The phases

```
0 Skeleton → 1 Discovery → 2 Requirements → 3 Architecture → 4 Specs & plan → 5 Build slice → 6 Iterate → 7 Retro
```

Each phase has an entry gate and an exit gate, defined in
`docs/04-process/roadmap.md`. Nothing moves to the next phase until the exit
gate is met and recorded in the process log.

## Inputs that already exist

- Challenge brief and seed data: `docs/00-discovery/inputs/`
- Figma design file: kept **outside** the repository (Frontend Mentor licence);
  design tokens will be extracted into `docs/02-architecture/design-tokens.md`
  during Phase 3.

## Owner

Ruslan Haqverdi — product, engineering and process. AI agents (Claude and
others) act as collaborators under the rules in `AGENTS.md`; the process log
records what they did and what the owner changed.
