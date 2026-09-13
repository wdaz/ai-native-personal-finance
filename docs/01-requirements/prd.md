# PRD — AI-Native Personal Finance

Status: **Approved** (v1.0, owner approval 2026-09-13)
Author(s): Agent (Claude, draft) · Owner (decisions) · Date: 2026-09-13 · Process log: `../04-process/process-log.md`
Traces to: `../00-discovery/problem-statement.md` (v1.0), `../00-discovery/inputs/challenge-brief.md`, `../00-discovery/research/webmcp-status.md`

## 1. Summary

A public, full-stack personal finance web app (overview, transactions,
budgets, savings pots, recurring bills) built to the Frontend Mentor design,
with a demo login and a shared dataset that resets to seed data. It is
built for three things the app itself must prove: a serious testing
practice, a working and tested WebMCP integration that exposes the app's
capabilities to in-browser agents, and shippable product quality — produced
through a documented AI-native process.

## 2. Goals

| Id | Goal | Traces to | Measured by |
|----|------|-----------|-------------|
| G1 | Every functional requirement of the challenge brief is met, including the ones prototypes tend to skip (validation messages, keyboard navigation, focus states) | S3 | User stories US-01…US-37 pass their acceptance criteria |
| G2 | Testing is a first-class deliverable: unit tests for domain logic, E2E tests per user story, one command from a clean clone, green in CI | S1 | NFR-T |
| G3 | The app registers WebMCP tools for its capabilities; tools are tested, annotated for safety, and degrade gracefully where the API is not native | S2 | NFR-W, US-38…US-41 |
| G4 | The process is reproducible from the repository: requirements → decisions → specs → tests, with a process log | S4 | Every story id appears in at least one spec and one test; ADRs exist for each NFR-driven decision |

## 3. Non-goals

- Multi-user accounts, sharing, roles (one demo account, one dataset).
- Real bank, card or payment integrations.
- Native mobile applications.
- Internationalisation or currencies other than USD.
- "Agent-ready product" marketing claims: WebMCP is demonstrated and
  tested, not sold (see research note §Implications 6).
- Pixel-perfect parity on tablet/mobile beyond the design's layout intent
  (desktop design is the source of truth for data and copy, per the brief).

## 4. Users and scenarios

**U1 — Reviewer (public technical reader).** "I open the live URL, log in
with the demo account shown on the login page, and in a few minutes I can
see the whole app working. I open the repo and find how it was tested and
how the agent tools work. I can run the tests myself."

**U2 — The owner as user.** "I use the app the way the brief describes:
check my overview, page through transactions, create a budget and see it
fill up with August spending, move money in and out of pots, see which
bills are due soon."

**U3 — In-browser AI agent (Chrome/Edge with WebMCP, or any browser via
polyfill + relay).** "I discover the page's tools, read the balance, list
transactions filtered by category, and — with the user's confirmation —
add money to a pot. I get the same data the user sees."

**U4 — Keyboard-only user / screen-reader user.** "I can reach and operate
everything — navigation, sort/filter menus, modals, pagination — without a
mouse, and I always know where focus is."

## 5. Scope

### Release 1 — vertical slice: Auth + Overview *(owner decision 2026-09-08)*

Demo login and logout; Overview page with all five summary cards computed
from seed data through the real backend; read-only WebMCP tools
`get_balance` and `get_overview_summary` (owner decision R-02; the
parameterised `list_*` tools are Release 2); the domain calculations
Overview depends on (August spent per category, pot totals, bills
paid/upcoming/due soon) implemented and unit-tested; E2E journeys for login
and overview; CI; first public deployment with reset job and banner.
Stories: US-01, US-02, US-03, US-04…US-08, US-31, US-32 (for these
screens), US-33, US-34, US-36, US-37, US-38, US-39 (R1 part), US-41.

*Consequence:* the slice is read-only, so mutating tools and their
safeguards (US-40) are first exercised in Release 2. The domain logic is
built once here and reused by every later page.

### Release 2 — the four feature pages

Transactions (US-09…US-13), Budgets (US-14…US-20), Pots (US-21…US-26),
Recurring Bills (US-27…US-30); full keyboard support on these screens;
mutating WebMCP tools with safeguards (US-40); sidebar minimise (US-35).

### Release 3 — quality and narrative

No new stories. Accessibility audit and fixes (NFR-A), performance budget
(NFR-P), visual regression baseline (T9), deployment hardening, retrospective
and portfolio write-up.

## 6. Functional requirements

See `user-stories.md`. Summary by area: authentication (demo login,
functional sign-up UI); overview (five cards, navigation); transactions
(pagination by 10, name search, six sorts, category filter, empty state);
budgets (CRUD with unique category and theme, August spent, latest three
transactions, "See All" navigation, spending summary); pots (CRUD with 30-
character names, add/withdraw with balance effects, deletion returns money);
recurring bills (one per vendor, paid/upcoming/due-soon status relative to
19 Aug 2026, search, sort); cross-cutting (validation messages, keyboard,
responsive, hover/focus, persistence, demo reset); agent tools (discovery,
read tools, mutating tools with safeguards, status indicator).

## 7. Non-functional requirements

See `non-functional-requirements.md`: NFR-T testing, NFR-W WebMCP, NFR-A
accessibility, NFR-B browsers and devices, NFR-P performance, NFR-S
security and privacy, NFR-D data, time and deployment, NFR-Q code quality.

## 8. Success metrics

| Id | Metric | Target |
|----|--------|--------|
| M1 | From a clean clone, `install` + one test command runs unit and E2E suites | ≤ 10 minutes, no manual steps beyond documented prerequisites |
| M2 | Story → spec → test traceability | 100 % of stories referenced by ≥1 spec and ≥1 automated test (UI stories by E2E, non-UI stories by API tests) |
| M3 | Brief compliance | All checklist items in `inputs/challenge-brief.md` demonstrably met on the live URL |
| M4 | WebMCP | Every tool has an automated test; app functions identically with the API native, polyfilled, or removed |
| M5 | Accessibility | Zero serious/critical issues in an automated audit (axe) on every page; manual keyboard walkthrough documented |
| M6 | Performance | Lighthouse Performance ≥ 90 on the deployed Overview and Transactions pages (mobile preset) |
| M7 | Process | Every phase has its artefacts; process log has an entry per working session; each ADR has ≥2 alternatives |

## 9. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|-----------|--------|------------|-------|
| WebMCP API or Chrome origin trial changes mid-project | High | Medium | Single adapter module; polyfill as baseline; re-check research note before Phase 3 and deployment | Agent/Owner |
| No consumer agent to demo against | High | Low | E2E tests drive tools directly; manual demo via Tool Inspector extension or `@mcp-b` relay | Agent |
| Shared demo dataset vandalised or filled | Medium | Medium | Scheduled reset every 10 days + reset on storage threshold; input limits; rate limiting on writes | Owner |
| Overview-first slice grows because it needs all domain logic | Medium | Medium | Slice is read-only; domain logic is pure functions with unit tests; UI of other pages stays out | Owner |
| Free-tier hosting limits (sleep, storage) | Medium | Low | Choose hosting in ADR with reset job in mind; document cold-start | Owner |
| Prototype gaps leak into implementation | Medium | High | NFR-A and US-31/32/34 are explicit; prototype cited only as visual reference | Agent |
| Solo owner review bottleneck | Medium | Medium | Adversarial review by a fresh agent session before owner approval | Owner |

## 10. Open questions (must close before Phase 3)

- **OQ-1 Sign-up on the demo instance.** *Decided 2026-09-13 (owner): option (b)* —
  the sign-up UI is complete and validated; submitting valid input shows a
  message that this is a demo instance and points to the demo account. No
  accounts are created.
- **OQ-2 Add-money limit.** *Decided 2026-09-13:* a deposit may not exceed
  Current Balance; a withdrawal may not exceed the pot total; both show
  validation messages.
- **OQ-3 Demo reset visibility.** *Decided 2026-09-13:* yes — a small,
  dismissible banner: "Data resets every 10 days · last reset <date>".
- **OQ-4 Business time.** *Decided 2026-09-13:* fixed, but in **2026**:
  "today" = 2026-08-19, current month = August 2026. Seed dates are shifted
  from 2024 to 2026 by the seed/reset routine; `data.json` stays untouched.
- **OQ-5 Mutating tools and deletion.** *Decided 2026-09-13:* read tools
  and `add_*`, `edit_*`, `add_money_to_pot`, `withdraw_from_pot` are exposed;
  `delete_budget` and `delete_pot` are **exposed but require an on-screen
  confirmation by the user** before the server deletes anything (US-40 AC2,
  NFR-W5).

All open questions are closed; the section is kept for traceability.

### Decisions from the adversarial review (2026-09-13)

- `data.json` wins over the design wherever they differ (R-01).
- Highest/Lowest: transactions by signed amount; bills by absolute amount (R-09).
- Budget Spent counts only negative transactions; Latest Spending lists both signs (R-11).
- Release 1 tools: `get_balance`, `get_overview_summary` only (R-02).
- WebMCP tools are page-scoped (R-23).
- Delete confirmation is client-side; the server sees a normal delete (R-16).
- Limits: amounts ≤ 999,999,999.99; session 7 days sliding; auto-reset at 2,000 rows or 50 MB (R-17, R-25, R-29).
- Pot percentage: two decimals, round half up (R-08).
- Tablet and mobile use the bottom navigation bar (R-12); Log out lives in the sidebar footer, Release 1 (R-35).
