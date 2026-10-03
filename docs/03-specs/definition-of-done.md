# Definition of Done

Status: **Approved** (v1.2 — 2026-10-03, the owner's decision at the T-15c retrospective (`release-1-retrospective.md`, P1, P2, P3, P7): four lines added — an ADR amendment is searched across the other ADRs; the PR lists the result of each of the three browser engines; the pull request that finishes a task sets the plan's Status to Done and the backlog row to Done; the PR template mirrors them; v1.1 — 2026-09-20 addition: rules ship with a failing fixture; v1.0 approved 2026-09-20) · Author(s): Agent · Date: 2026-09-20 · Constrained by: AGENTS.md, governance.md, ADR-0003, NFR-Q

A task from `backlog.md` is done only when every line below is true. The PR description quotes this list with each item checked.

## Scope and traceability
- [ ] The PR names the task id, the spec sections and the story ids it implements; nothing outside the task is changed (drive-by fixes go to a new task).
- [ ] No Accepted ADR is contradicted; if a decision was needed, a new ADR or an amendment with a process-log entry exists.
- [ ] If the PR amends an ADR, the other ADRs are searched (`grep`) for the changed term and the result is in the PR description.
- [ ] If the spec was wrong or incomplete, the spec is amended in the same PR (version bump and a changelog line under the header; §9 stays empty) — the code never silently diverges.

## Code
- [ ] TypeScript strict, lint and format pass; import-boundary rules pass (ADR-0002).
- [ ] Domain logic is pure and clock-injected; no `new Date()` in `src/domain` or `src/server` business code.
- [ ] Money is integer cents in code and DB; formatted only at the edge.
- [ ] Validation uses the shared Zod schemas on client, server and tools; copy comes from `src/shared/copy.ts`, which mirrors the user-stories appendix (including its "R1 additions" table).
- [ ] Client/server component boundary respected; WebMCP code lives only in `src/webmcp`.
- [ ] Any new lint rule, config guard or document-mirror test ships with a fixture that deliberately violates it and a test asserting the violation is reported — a rule is not verified until it has failed on purpose (T-01 lesson).

## Tests (ADR-0003)
- [ ] Unit tests for every new domain/shared/webmcp function; `domain` coverage stays ≥ 90 %.
- [ ] API tests for every new or changed route (status codes, schema, side effects, 401).
- [ ] At least one E2E test per story touched, title starting with the story id; role/label locators; no time-based waits; no `.first()`.
- [ ] axe passes on every page/modal the task touches.
- [ ] WebMCP: tools touched have unit + E2E coverage in polyfill and off modes.
- [ ] `npm run test:all` green locally and in the CI jobs that exist at that point of the backlog (minimal CI from T-01; API/E2E jobs from T-05/T-06; full matrix from T-13).
- [ ] The PR lists the result of each of the three browser engines (Chromium, Firefox, WebKit), and says which one could not run locally and where it was checked instead.

## Accessibility and design
- [ ] Keyboard-only walkthrough of the touched UI done and noted in the PR (what was pressed, what happened).
- [ ] Visible focus, accessible names, `aria-current`/`aria-expanded`/`aria-describedby` where the spec says.
- [ ] Values (colours, type, spacing) come from tokens; screenshots at 1440/768/375 attached to the PR for visual review against `inputs/design/`.

## Process
- [ ] Process-log entry: what was asked, what the agent produced, what it got wrong, what the owner changed, lessons (template `process-log-entry.md`).
- [ ] Prompts used for the task saved under `docs/04-process/prompts/`.
- [ ] The pull request that finishes the task also sets the plan's Status line to Done.
- [ ] The pull request that finishes the task also marks the task's backlog row Done, with the pull request numbers.
- [ ] Owner reviewed and merged (agents never merge).
