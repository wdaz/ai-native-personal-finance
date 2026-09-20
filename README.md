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

> Status: **Phase 5 — Build the slice (Release 1).** The stack, layout, testing approach
> and WebMCP design are recorded in `docs/02-architecture/`; the Release 1 specs are
> approved in `docs/03-specs/`. The backlog is `docs/03-specs/backlog.md`.

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
| `app/`, `src/`, `prisma/`, `tests/` | Application code, laid out per ADR-0002 | You are building |

## The phases

```
0 Skeleton → 1 Discovery → 2 Requirements → 3 Architecture → 4 Specs & plan → 5 Build slice → 6 Iterate → 7 Retro
```

Each phase has an entry gate and an exit gate, defined in
`docs/04-process/roadmap.md`. Nothing moves to the next phase until the exit
gate is met and recorded in the process log.

## Run locally

Requires Node 26 (see `.nvmrc`) and, from T-02 onwards, a local Postgres.

```bash
npm ci                 # install
npx playwright install --with-deps chromium firefox webkit
npm run dev            # develop on http://localhost:3000
npm run test:all       # lint, format, typecheck, unit, API and E2E
```

`npm ci` does not download the Playwright browsers, so `playwright install` is
a one-off after the install on each machine; without it the browser tests stop
at *Executable doesn't exist*.

`npm run test:all` builds the app and starts it before the browser tests
(ADR-0003: E2E never runs against `next dev`). The individual commands are:

| Command                       | What it runs                                                      |
| ----------------------------- | ----------------------------------------------------------------- |
| `npm run lint`                | ESLint, including the ADR-0002 import boundaries                  |
| `npm run format:check`        | Prettier                                                          |
| `npm run typecheck`           | `tsc --noEmit`, strict                                            |
| `npm test`                    | Vitest — `tests/unit`                                             |
| `npm run test:api`            | Playwright request-context tests — `tests/api` (empty until T-05) |
| `npm run test:e2e`            | Playwright on Chromium, Firefox and WebKit — `tests/e2e`          |
| `npm run build` / `npm start` | Production build and server                                       |

Copy `.env.example` to `.env.local` before running anything that touches the database or
the session. Every variable names the ADR or spec that defines it.

## Inputs that already exist

- Challenge brief and seed data: `docs/00-discovery/inputs/`
- Figma design file: kept **outside** the repository (Frontend Mentor licence);
  design tokens will be extracted into `docs/02-architecture/design-tokens.md`
  during Phase 3.
- Challenge avatars: copied into `public/avatars/` at T-01 from the Frontend Mentor
  starter; the basename is the key used by the seed (SPEC-overview §4.5).

## Owner

Ruslan Haqverdi — product, engineering and process. AI agents (Claude and
others) act as collaborators under the rules in `AGENTS.md`; the process log
records what they did and what the owner changed.
