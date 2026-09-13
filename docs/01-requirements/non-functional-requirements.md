# Non-functional requirements

Status: **Approved** (v1.1 — amendment 2026-09-13: T9 withdrawn by owner decision in ADR-0003; v1.0 approved 2026-09-13) · Author(s): Agent (draft) · Date: 2026-09-08
Traces to: problem statement S1–S4 and constraints; research note `webmcp-status.md`
Every requirement is measurable; each names how it is verified.

## NFR-T — Testing (S1)

| Id | Requirement | Verified by |
|----|-------------|-------------|
| T1 | Domain logic (money arithmetic, August spent per category, bill status and due-soon, sort/filter/pagination, validation rules) is implemented as pure functions with unit tests; statement coverage of that layer ≥ 90 % | Coverage report in CI |
| T2 | Every user story has at least one automated test that follows its acceptance criteria and names the story id in the test title — E2E for UI stories, API/unit tests for non-UI stories (US-36, US-37) | Grep `US-\d\d` over all test suites = 100 % of stories (R-30) |
| T3 | E2E tests run against the real backend with a per-run seeded database; test data is created through the API, never by clicking | Review; a reset/seed endpoint exists only in test mode |
| T4 | One documented command installs and runs unit + E2E from a clean clone in ≤ 10 minutes on CI | CI job time |
| T5 | CI runs lint, unit, E2E (Chromium at minimum; Firefox and WebKit at least weekly or on release) on every PR; merges require green | Branch protection |
| T6 | Locators prefer accessible roles and names; `data-testid` only where the accessible tree is ambiguous, listed in one shared file | Review |
| T7 | No time-based waits; assertions are web-first; no `.first()` to dodge ambiguity | Lint rule / review |
| T8 | WebMCP tools have unit tests (schema + execute) and E2E tests that wait for the readiness signal (US-38 AC3), then call `getTools()`/`executeTool()` from the page and assert both result and UI state; CI runs polyfill and off modes; native mode is a headed runbook step (R-13, R-15) | Test suite + runbook |
| T9 | *Withdrawn 2026-09-13 (owner, ADR-0003): no visual snapshot testing. Design fidelity is verified by manual review against `inputs/design/` and the layout assertions of US-33.* | — |
| T10 | The testing strategy is written as an ADR with the pyramid and rules above | ADR exists |

## NFR-W — WebMCP (S2)

| Id | Requirement | Verified by |
|----|-------------|-------------|
| W1 | Tools are registered via `document.modelContext` (spec, 2026-09-04) through **one adapter module** owned by the app; nothing else touches the API; if the property is absent the adapter installs the polyfill (no `navigator.modelContext` fallback — deprecated in Chrome 150, R-33); the adapter exposes the readiness signal of US-38 AC3 | Code review; unit test of adapter |
| W2 | Baseline is the polyfill (`@mcp-b/webmcp-polyfill` or equivalent); native support is progressive enhancement; the app renders and functions identically in native, polyfill and off modes; `WEBMCP_MODE=native\|polyfill\|off` selects the mode at build/run time (R-14) | E2E in polyfill and off modes; headed native check |
| W3 | Every tool declares `name` (per spec charset), `description` (≤ 200 chars), `inputSchema` (JSON Schema; every string property has `maxLength` ≤ 200), and annotations: read tools `readOnlyHint: true`; mutating and delete tools `consequentialHint: true`; tools returning user-entered text `untrustedContentHint: true` (R-32) | Unit test iterating over the registry |
| W4 | Tools call the same authenticated HTTP API the UI uses; the server re-validates every input; tools never access storage directly | Review; API tests |
| W5 | Destructive tools (`delete_*`) are exposed; the **client** sends the delete request only after the user confirms in the UI dialog (owner decision R-16); cancel/abort/busy/not-found return structured results per US-40 AC2 | E2E |
| W6 | Tool results are returned as structured content mirroring the UI DTOs; errors are structured, not thrown | Unit tests |
| W7 | Tool set is documented in `docs/03-specs/webmcp-tools.md` with name, purpose, schema, annotations, example call, and test reference | Doc review |
| W8 | The origin-trial token (Chrome 149–156) is a deployment config, not code; its expiry is noted in the deployment runbook | Runbook |
| W9 | A manual demo path is documented: Tool Inspector extension (Chrome) and `@mcp-b/webmcp-local-relay` → Claude Code | README section |

## NFR-A — Accessibility (S3, US-31/32/34)

| Id | Requirement | Verified by |
|----|-------------|-------------|
| A1 | WCAG 2.1 AA on every page; zero serious/critical axe violations | axe in E2E |
| A2 | All functionality operable by keyboard; visible focus indicator with ≥ 3:1 contrast against adjacent colours; logical focus order | Keyboard walkthrough E2E |
| A3 | Modals: `role="dialog"`, labelled, focus trapped, Escape closes, focus restored | E2E |
| A4 | Menus (sort/filter/theme/category/pot options) use listbox or menu semantics with arrow-key navigation | E2E |
| A5 | Form errors linked via `aria-describedby`, announced via live region; first invalid field focused | E2E |
| A6 | Images: avatars have alt text (person/vendor name) or are decorative with empty alt; icons have accessible names when interactive | Review + axe |
| A7 | Colour is never the only carrier of meaning (e.g. Due Soon also has an icon) | Review |
| A8 | Text resizes to 200 % without loss; no horizontal scroll ≥ 320 px | Manual + E2E viewport |

## NFR-B — Browsers and devices

| Id | Requirement | Verified by |
|----|-------------|-------------|
| B1 | Automated: Playwright's bundled Chromium, Firefox and WebKit in CI. Manual smoke before each release: latest Chrome, Edge, Safari, iOS Safari, Android Chrome (R-31) | CI + release checklist |
| B2 | WebMCP native path verified headed on Chrome ≥ 149 / Edge ≥ 150 (flag or OT token) per runbook; polyfill path everywhere else and in CI (R-15) | Runbook + E2E |
| B3 | Design breakpoints per US-33 | Visual snapshots |

## NFR-P — Performance

| Id | Requirement | Verified by |
|----|-------------|-------------|
| P1 | Lighthouse Performance ≥ 90 (mobile preset) on deployed Overview and Transactions, measured on a warm instance (after one warm-up request) (R-21) | Lighthouse CI on release |
| P2 | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 on the deployed app (lab) | Lighthouse CI |
| P3 | Initial JS ≤ 250 kB gzipped for the app shell; WebMCP adapter and polyfill loaded lazily after first paint, then the readiness signal fires (US-38 AC3) | Bundle report |
| P4 | Transactions page with 10 rows renders without layout shift; images sized | CLS |

## NFR-S — Security and privacy

| Id | Requirement | Verified by |
|----|-------------|-------------|
| S1 | Demo credentials are the only account; shown on the login page; no personal data is collected or stored | Review |
| S2 | Sessions via httpOnly, secure, SameSite cookies (or equivalent), 7 days sliding; all API routes require a session except login | API tests |
| S3 | All input validated server-side with shared schemas; amounts are integers in cents, 1 ≤ x ≤ 99,999,999,999 cents; names length-limited; categories/themes from enums; ids server-generated (R-17, R-26) | Unit + API tests |
| S4 | Write endpoints rate-limited; reset triggered at 2,000 user-created rows or 50 MB (configurable, US-37) | Config + test |
| S5 | No secrets in the repo; `.env.example` documents configuration | Review |
| S6 | Security headers (CSP, frame-ancestors, referrer policy); WebMCP permissions policy `tools` left at default `self` | Header check in E2E |
| S7 | Tool descriptions and outputs are treated as untrusted content per spec guidance; no tool echoes raw HTML | Review |

## NFR-D — Data, time and deployment

| Id | Requirement | Verified by |
|----|-------------|-------------|
| D1 | Business time is fixed: "today" = 2026-08-19, current month = August 2026, provided through an injectable clock; production and tests use the same value (OQ-4) | Unit test |
| D2 | Money stored as integer cents; formatted at the edge with two decimals and sign | Unit tests |
| D3 | Seed = `data.json` with all dates shifted +2 years (2024 → 2026) at seed time; a single idempotent seed/reset routine used by deployment, tests and the scheduled reset | Test |
| D4 | Public deployment with HTTPS at a stable URL; cold start ≤ 10 s documented if the host sleeps | Runbook |
| D5 | Scheduled full reset every 10 days and on storage threshold; last-reset timestamp exposed to the UI; reset events written to the server log (US-37) | Job log + E2E |
| D6 | One-command local run (app + backend + seeded DB) documented in README | Fresh-clone check |

## NFR-Q — Code and process quality (S4)

| Id | Requirement | Verified by |
|----|-------------|-------------|
| Q1 | TypeScript strict; lint and format enforced in CI | CI |
| Q2 | Shared validation schemas between UI, API and tools (no duplicate rules) | Review |
| Q3 | Every PR names the story/spec ids it implements and the tests it adds; conventional commits | PR template |
| Q4 | Each NFR group that forces a technology choice has an ADR (testing, WebMCP, persistence, auth/session, hosting/reset, repo layout, stack) | ADR index |
| Q5 | Process log entry per working session; prompts saved for agent-drafted documents | Log review |

## Open points

None — all thresholds accepted by the owner on 2026-09-13.
