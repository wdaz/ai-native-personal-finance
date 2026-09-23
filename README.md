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
| `app/`, `src/`, `prisma/`, `scripts/`, `tests/`, `public/` | Application code, tooling and static assets, laid out per ADR-0002 | You are building |

## The phases

```
0 Skeleton → 1 Discovery → 2 Requirements → 3 Architecture → 4 Specs & plan → 5 Build slice → 6 Iterate → 7 Retro
```

Each phase has an entry gate and an exit gate, defined in
`docs/04-process/roadmap.md`. Nothing moves to the next phase until the exit
gate is met and recorded in the process log.

## Run locally

Requires Node 26 (see `.nvmrc`) and Docker: Postgres runs in a container (`compose.yaml`).

```bash
npm ci                          # install; also generates the Prisma client
npx playwright install --with-deps chromium firefox webkit
cp .env.example .env.local      # local settings; DATABASE_URL already points at the container
docker compose up -d --wait     # Postgres 18 on localhost:5432
npm run db:reset                # apply migrations, then load the seed
npm run dev                     # develop on http://localhost:3000
npm run test:all                # secret scan, lint, format, typecheck, unit, API and E2E
```

`npm run db:reset` applies pending migrations and replaces all data with the seed
(`prisma/data.json`, dates moved two years on), recording a reset of reason `manual`
(SPEC-reset-and-test-support §2.5). The API and E2E tests reset the same database; it holds
demo data only.

`npm ci` does not download the Playwright browsers, so `playwright install` is
a one-off after the install on each machine; without it the browser tests stop
at *Executable doesn't exist*.

`npm ci` (and `npm install`) also points git at `scripts/git-hooks/`, whose pre-commit
hook runs gitleaks on the staged changes on `git commit` and blocks a commit that
contains a secret (T-02a). The first scan after each `npm ci` (which wipes the cache)
downloads the pinned gitleaks release into `node_modules/.cache/` and checks its SHA-256,
so it needs `curl` and a network connection once per `npm ci`. Commits that
`git rebase` or `git cherry-pick` write themselves skip the hook, and
`git commit --no-verify` skips it on purpose; the CI `secret scan` job reads every
commit either way.

`npm run test:all` builds the app and starts it before the browser tests
(ADR-0003: E2E never runs against `next dev`). The individual commands are:

| Command                       | What it runs                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                | ESLint, including the ADR-0002 import boundaries                                                                 |
| `npm run format:check`        | Prettier                                                                                                         |
| `npm run typecheck`           | `tsc --noEmit`, strict                                                                                           |
| `npm run secrets:scan`        | Gitleaks on all commit diffs, not messages — first in `test:all`                                                 |
| `npm test`                    | Vitest — `tests/unit`                                                                                            |
| `npm run test:api`            | Playwright request-context tests — `tests/api`, one worker, against the app with `APP_ENV=test` and the database |
| `npm run db:reset`            | `prisma migrate deploy`, then the seed (`prisma/seed.ts`)                                                        |
| `npm run seed:figures`        | SPEC-overview §4.3 printed from `prisma/data.json` (`scripts/seed-figures.ts`) — checked by `npm test`           |
| `npm run test:e2e`            | Playwright on Chromium, Firefox and WebKit — `tests/e2e`                                                         |
| `npm run build` / `npm start` | Production build and server                                                                                      |

Copy `.env.example` to `.env.local` before running anything that touches the database or
the session. Every variable names the ADR or spec that defines it.

### Demo credentials

`DEMO_PASSWORD_HASH` is a bcrypt hash — generate one for whatever password you want the local
demo account to use:

```bash
node -e "require('bcryptjs').hash('your-password', 10).then(console.log)"
```

Escape every `$` in the result as `\$` before pasting it into `.env.local` — Next.js's env
loader (`@next/env`) runs `dotenv-expand` on every value it loads, including ones already in
the process environment, and treats an unescaped `$` followed by a digit as variable-expansion
syntax, silently truncating a raw bcrypt hash (e.g. `$2b$10$...` becomes garbage). Put the
plain password in `DEMO_PASSWORD_DISPLAY` (shown on the login page), and `SESSION_SECRET` to
any string ≥ 32 characters.

## Inputs that already exist

- Challenge brief and seed data: `docs/00-discovery/inputs/`
- Figma design file: kept **outside** the repository (Frontend Mentor licence);
  the tokens extracted from it are in `docs/02-architecture/design-tokens.md`
  (Approved v1.0), and `src/ui/tokens.css` is generated from it — a unit test
  holds the two to the same values.
- Challenge avatars: copied into `public/avatars/` at T-01 from the Frontend Mentor
  starter; the basename is the key used by the seed (SPEC-overview §4.5).

## Owner

Ruslan Haqverdi — product, engineering and process. AI agents (Claude and
others) act as collaborators under the rules in `AGENTS.md`; the process log
records what they did and what the owner changed.
