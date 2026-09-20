## Task 8: README "Run locally"

**Files:**

- Modify: `README.md`

**Interfaces:**

- Consumes: every script defined in Tasks 1, 3, 4 and 7.
- Produces: a section a reader with no context can follow — one command for install, one
  for dev, one for test (T-01 row of the backlog).

- [ ] **Step 1: Update the status line**

Replace the blockquote under the two deliverables:

```markdown
> Status: **Phase 5 — Build the slice (Release 1).** The stack, layout, testing approach
> and WebMCP design are recorded in `docs/02-architecture/`; the Release 1 specs are
> approved in `docs/03-specs/`. The backlog is `docs/03-specs/backlog.md`.
```

- [ ] **Step 2: Add the "Run locally" section immediately after "The phases"**

````markdown
## Run locally

Requires Node 26 (see `.nvmrc`) and, from T-02 onwards, a local Postgres.

```bash
npm ci                 # install
npm run dev            # develop on http://localhost:3000
npm run test:all       # lint, format, typecheck, unit, API and E2E
```
````

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

````

- [ ] **Step 3: Update the "Inputs that already exist" bullet about assets**

Add one line:

```markdown
- Challenge avatars: copied into `public/avatars/` at T-01 from the Frontend Mentor
  starter; the basename is the key used by the seed (SPEC-overview §4.5).
````

- [ ] **Step 4: Check the `apps/` row of the "How to read this repository" table**

The row `| apps/ | Application code (empty until Phase 5) | You are building |` is now
wrong (ADR-0002 put the code at the repository root). Replace it with:

```markdown
| `app/`, `src/`, `prisma/`, `tests/` | Application code, laid out per ADR-0002 | You are building |
```

- [ ] **Step 5: Verify the commands in the section actually exist**

Run: `node -e "const s=require('./package.json').scripts; for (const k of ['dev','build','start','lint','format:check','typecheck','test','test:api','test:e2e','test:all']) if(!s[k]) throw new Error('missing '+k); console.log('all scripts present')"`
Expected: `all scripts present`.

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs(readme): Run locally section and ADR-0002 layout row (T-01)"
```

---
