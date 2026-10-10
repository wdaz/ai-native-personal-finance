<!--
  Task id and title · spec sections · story ids (DoD, "Scope and traceability").
  Tick every box (an agent never ticks "Owner reviewed and merged"), and paste commands and their
  output from the run, not from memory (governance.md).
  Base: `develop` for work. Base `main` only for a release (head `develop`) or a hotfix (head
  `hotfix/<name>-main`) (governance.md, "Branches and releases").
  Open the PR as a draft. Take it out of draft only when it is finished, CI is green, and the
  /code-review skill (on an Opus model) has reviewed the current head and no important finding is left
  unfixed (Copilot review is off for develop): the owner merges every PR that is not a
  draft, and a ready PR gets no more pushes (governance.md, "Branches and releases", "Draft until
  ready").
-->

## What and why

## Evidence

- Commands run, with their output:
- Keyboard walkthrough (what was pressed, what happened), UI tasks:
- Screenshots at 1440 / 768 / 375, UI tasks:

## Definition of done (docs/03-specs/definition-of-done.md)

### Scope and traceability

- [ ] The PR names the task id, the spec sections and the story ids it implements; nothing outside the task is changed (drive-by fixes go to a new task).
- [ ] No Accepted ADR is contradicted; if a decision was needed, a new ADR or an amendment with a process-log entry exists.
- [ ] If the PR amends an ADR, the other ADRs are searched (`grep`) for the changed term and the result is in the PR description.
- [ ] If the spec was wrong or incomplete, the spec is amended in the same PR (version bump and a changelog line under the header; §9 stays empty) — the code never silently diverges.

### Code

- [ ] TypeScript strict, lint and format pass; import-boundary rules pass (ADR-0002).
- [ ] Domain logic is pure and clock-injected; no `new Date()` in `src/domain` or `src/server` business code.
- [ ] Money is integer cents in code and DB; formatted only at the edge.
- [ ] Validation uses the shared Zod schemas on client, server and tools; copy comes from `src/shared/copy.ts`, which mirrors the user-stories appendix (including its "R1 additions" table).
- [ ] Client/server component boundary respected; WebMCP code lives only in `src/webmcp`.
- [ ] Any new lint rule, config guard or document-mirror test ships with a fixture that deliberately violates it and a test asserting the violation is reported — a rule is not verified until it has failed on purpose (T-01 lesson).

### Tests (ADR-0003)

- [ ] Unit tests for every new domain/shared/webmcp function; `domain` coverage stays ≥ 90 %.
- [ ] API tests for every new or changed route (status codes, schema, side effects, 401).
- [ ] At least one E2E test per story touched, title starting with the story id; role/label locators; no time-based waits; no `.first()`.
- [ ] axe passes on every page/modal the task touches.
- [ ] WebMCP: tools touched have unit + E2E coverage in polyfill and off modes.
- [ ] `npm run test:all` green locally and in the CI jobs that exist at that point of the backlog (minimal CI from T-01; API/E2E jobs from T-05/T-06; full matrix from T-13).
- [ ] The PR lists the result of each of the three browser engines (Chromium, Firefox, WebKit), and says which one could not run locally and where it was checked instead.

### Accessibility and design

- [ ] Keyboard-only walkthrough of the touched UI done and noted in the PR (what was pressed, what happened).
- [ ] Visible focus, accessible names, `aria-current`/`aria-expanded`/`aria-describedby` where the spec says.
- [ ] Values (colours, type, spacing) come from tokens; screenshots at 1440/768/375 attached to the PR for visual review against `inputs/design/`.

### Process

- [ ] Process-log entry: what was asked, what the agent produced, what it got wrong, what the owner changed, lessons (template `process-log-entry.md`).
- [ ] `/code-review` (on an Opus model) reviewed the current head; findings fixed or answered, result in the PR description.
- [ ] Prompts used for the task saved under `docs/04-process/prompts/`.
- [ ] The pull request that finishes the task also sets the plan's Status line to Done.
- [ ] The pull request that finishes the task also marks the task's backlog row Done, with the pull request numbers.
- [ ] Owner reviewed and merged (agents never merge).
