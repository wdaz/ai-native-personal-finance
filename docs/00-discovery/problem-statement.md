# Problem statement — AI-Native Personal Finance

Status: **Approved** (v1.0, owner approval 2026-09-08)
Author(s): Owner (Ruslan Haqverdi, answers) · Agent (Claude, structure and wording) · Date: 2026-09-08 · Process log: `../04-process/process-log.md` (entries of 2026-09-08)

## 1. The problem

Software teams use AI tools ad hoc: each developer uses an assistant in
their own way, mostly to write code, with no shared process, no rules and no
record of what the AI did or why. The stages
before code (understanding the idea, writing requirements, making and
recording decisions) and after it (testing, verification) are left to habit.
The result is that nobody can show, for a real product, how an idea became
working software with AI involved at every step, what the AI got right and
wrong, and what a human had to decide. At the same time, two technical
competences the owner wants — a serious end-to-end testing practice and
exposing an application to in-browser AI agents (WebMCP) — have no
worked example to learn from or to point to.

## 2. Who we are building for

- **The owner (primary).** A developer who wants to acquire, not just
  demonstrate, three competences: building a product with LLMs from idea to
  release in a structured way; designing and running a real testing strategy
  (unit and end-to-end); and integrating an experimental web standard
  (WebMCP) into a real application. Today he does these piecemeal and has
  unfinished attempts (an earlier `finance-app` that jumped straight to
  architecture).
- **A public technical audience (secondary).** Readers on GitHub/LinkedIn
  who open the repository and the live app with no context and ten minutes.
  They must be able to run the app in any modern browser.

What these readers would never tolerate: a process that exists only in
prose (documents that no code or test refers back to), tests that are green
but say nothing, and an experimental feature that only works on the
author's machine.

## 3. Why now / why this

- The owner has identified two concrete gaps — AI-driven product work as a
  discipline, and E2E/WebMCP experience — and wants a project that closes
  both at once rather than a tutorial for each.
- WebMCP is new enough that few working examples exist; a documented,
  tested integration has value beyond the portfolio.
- The Frontend Mentor "Personal Finance App" challenge provides a finished
  design, seed data and a precise functional brief, so effort goes into
  process, testing and integration instead of inventing a product.
- Time is not a constraint. The owner works alone; AI agents are the only
  collaborators, which makes the process itself the thing under test.

## 4. What success looks like

The project must support four claims; three are the core and the fourth is
the method that produces them.

Core claims — a reviewer, after ten minutes with the repository and the live
app, should be able to conclude:

- **S1 — Testing is done seriously.** There is a written testing strategy;
  unit and end-to-end tests exist, run from a clean clone and in CI, and each
  test traces to a requirement or spec. Green is not the point — readability
  and traceability are.
- **S2 — A new technology is applied for real.** The live app exposes its
  capabilities to in-browser agents via WebMCP; the integration is tested,
  its limits and safeguards are documented, and the app still works in
  browsers without WebMCP.
- **S3 — The product is of shippable quality.** The app matches the design
  closely, meets every functional requirement of the challenge brief,
  including validation messages, keyboard navigation and focus states, is
  responsive, and is publicly deployed.

Method claim:

- **S4 — The process is AI-native and documented.** Every phase from idea to
  code has its artefacts in the repository; decisions are recorded with
  alternatives; the process log shows what agents did, what they got wrong
  and what the owner changed. A reader can reproduce the way the work was
  done, not just its result.

All four must hold; the owner has explicitly declined to rank them, and
time is available to do so.

## 5. Constraints

- **Solo owner.** No other developer, designer or reviewer. Adversarial
  review is done by a separate agent session (see `governance.md`).
- **Public deployment is mandatory.** Reviewers open a live URL. The
  deployed instance is a shared demo: its data resets on a schedule (every
  10 days) and whenever storage fills up.
- **Any modern browser.** Because the app is public, it must work in all
  major browsers; WebMCP is progressive enhancement (native where available,
  polyfilled or absent elsewhere) and must never break the app.
- **A backend exists.** The challenge's "full-stack" bonus is in scope: data
  is persisted server-side, not only in `data.json`.
- **Design licence.** The Figma file is never committed. Design tokens and
  the Claude Design exports (`inputs/design/`) are the in-repo references.
- **Language.** Code, documents and commits in English.

## 6. Out of scope

- Multi-user and team features: one dataset per deployed instance; no
  sharing, roles or permissions.
- Internationalisation: English only, as in the design.
- Real bank or payment integrations; data comes from the seed file and
  manual entry.
- Native mobile apps; responsive web only.

## 7. Assumptions

See `assumptions-and-questions.md`. The main ones: WebMCP support in
browsers and frameworks stays experimental for the life of the project;
free-tier hosting is sufficient for a resetting demo; the challenge's
"current month" is kept as fixed business time. *Erratum 2026-09-13: the
fixed month is August 2026 (today = 19 Aug 2026), per PRD OQ-4; this
approved document is not otherwise changed.*

## 8. Open questions

- **Q1 — Authentication versus single-user.** *Decided 2026-09-08:* a
  **demo login** — the login and sign-up screens exist and are functional as
  UI, but the deployed instance has one demo account over one shared
  dataset. Exact behaviour of sign-up on the demo instance is a Requirements
  detail.
- **Q2 — Reset semantics.** *Decided 2026-09-08:* the deployed instance
  resets **fully to seed data** (`data.json`) every 10 days and whenever
  storage fills up; user-created records are not preserved.
- **Q3 — What "any modern browser" means for WebMCP.** Which browsers get the
  native path, which the polyfill, and how the difference is shown to the
  user. Research note needed before Requirements.
- **Q4 — Stack.** Deferred to Architecture; prior ADRs are inputs.
