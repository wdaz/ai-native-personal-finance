# Process log

Append-only. Newest entry at the bottom. Template:
`docs/templates/process-log-entry.md`.

---

## 2026-09-03 — Phase 0: repository skeleton

- **Phase:** 0 — Skeleton
- **Participants:** Owner (Ruslan), Agent (Claude, Cowork session)
- **Trigger:** Owner wanted a portfolio project demonstrating an AI-native
  SDLC and found that existing methodologies begin at coding, leaving the
  idea → analysis → documentation stage undefined.
- **What was discussed before this artefact:**
  - Documents live in the repository (not in an external wiki) because they
    are agent context and must be versioned with code.
  - Frontend and backend live in one repository (monorepo) so an agent can
    work a feature end-to-end with full context.
  - A prior attempt (`~/Own/finance-app`, 2026-09-01) had jumped straight to
    architecture: three ADRs proposing Angular 22 + Nx + NestJS, a testing
    pyramid, a WebMCP design, and Figma tokens — but no discovery or
    requirements. Owner chose a clean repository and deferred the stack
    decision to Phase 3, where the prior ADRs become inputs.
  - "Web MCP integration" means **WebMCP**, the browser standard
    (`navigator.modelContext`), not a backend MCP server.
- **Produced:** `README.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `docs/`
  phase folders with READMEs, `docs/templates/*`, `roadmap.md`,
  `governance.md`, this log. Challenge brief and `data.json` copied into
  `docs/00-discovery/inputs/`.
- **Owner changes to agent output:** _(to fill after review)_
- **Open questions carried forward:**
  - Stack (Next.js vs Angular vs other) — Phase 3.
  - Which bonus tracks (persistence, auth) are in scope — Phase 2.
  - WebMCP: which capabilities are exposed and with what safeguards — Phase 2 (NFR) and Phase 3 (ADR).
- **Next:** Phase 1 — write `problem-statement.md` through an owner/agent
  interview.

---

## 2026-09-08 — Phase 0/1: design exports analysed and added as inputs

- **Phase:** 0 → 1 (Discovery inputs)
- **Participants:** Owner (Ruslan), Agent (Claude, Cowork session)
- **Trigger:** Owner exported a style guide and a full app prototype from
  Claude Design (built from the Figma file) and asked for an analysis.
- **Prompt(s):** conversational — "analyse these two Claude Design exports".
- **Produced:** `docs/00-discovery/inputs/design/` with `style-guide.html`,
  `app-prototype.html` and a `README.md` describing what the files are, what
  they are good for per phase, and their gaps versus the challenge brief.
- **How the analysis was done:** unbundled the exports, rendered both in
  headless Chromium, walked every screen and modal at desktop/tablet/mobile
  widths, read the prototype's state logic, compared the 22 colours with the
  Figma-extracted tokens (exact match), and checked each brief requirement
  against the prototype's behaviour.
- **What the agent got right:** full inventory; caught the misnamed export;
  identified the prototype's state model as a WebMCP tool inventory.
- **What the agent got wrong or missed:** _(owner to fill after review)_
- **Owner changes and reasoning:** _(owner to fill)_
- **Disagreements:** none.
- **Lessons for the process:** an interactive prototype is a powerful input
  but a dangerous one — it silently omits non-visual requirements (validation,
  keyboard, focus). The Requirements phase must list such requirements
  explicitly rather than pointing at the prototype.
- **Next:** Phase 0 exit (owner reviews `AGENTS.md`, `governance.md`), then
  Phase 1 problem statement interview.

---

## 2026-09-08 — Phase 0 exit approved; Phase 1 interview started

- **Phase:** 0 → 1
- **Participants:** Owner (Ruslan), Agent (Claude, Cowork session)
- **Gate:** Owner read `AGENTS.md` and `governance.md` and approved them
  without changes. Phase 0 is closed.
- **Discovery interview, answer 1 — what success looks like.** Asked: "what
  should a reviewer conclude after ten minutes?" Owner's answer: the project
  must support all four claims — process, testing, new technology (WebMCP),
  product quality — but the **core claims are testing, WebMCP and product
  quality**; the AI-native process is the method that produces them and is
  documented, not the headline. Owner explicitly rejected ranking further and
  stated that **time is not a constraint**.
- **Disagreements:** agent pushed for a single priority; owner declined.
  Recorded as-is; requirements will therefore not trade these against each
  other, and the roadmap's "vertical slice" must exercise all three core claims.
- **Next:** continue the interview (who the reviewer is, the owner's own
  problem/gap, constraints, out of scope), then draft
  `docs/00-discovery/problem-statement.md`.

---

## 2026-09-08 — Phase 1: problem statement v0.1 drafted

- **Phase:** 1 — Discovery
- **Participants:** Owner (Ruslan), Agent (Claude, Cowork session)
- **Method:** structured interview — agent asked multiple-choice questions
  (success, audience, why now, workplace context, constraints, out of
  scope), owner answered, agent structured the answers into the template.
- **Owner's answers (verbatim essence):** success = all four claims, core
  are testing / WebMCP / product quality, time is not a constraint; audience
  = self first, then own team/lead, then public; why now = AI-working skill
  and a concrete E2E/WebMCP gap; workplace AI use is ad hoc; constraints =
  solo, public deploy, all browsers; out of scope = i18n, multi-user; a
  backend must exist with a 10-day / storage-full reset.
- **Produced:** `docs/00-discovery/problem-statement.md` (Draft v0.1),
  `docs/00-discovery/assumptions-and-questions.md`.
- **Agent additions the owner did not say (flagged in the documents):** two
  out-of-scope items marked "assumed, to confirm" (bank integrations, native
  mobile); the tension between "auth bonus" and "no multi-user" raised as Q1;
  reset semantics as Q2; browser matrix for WebMCP as Q3.
- **Owner changes and reasoning:** _(owner to fill after review)_
- **Next:** owner reviews v0.1; research notes for A1/Q3 (WebMCP browser and
  framework status, dated); inputs inventory is complete.
- **Owner changes to v0.1 (2026-09-08):** removed every reference to the
  owner's workplace — the "including the owner's own" clause in §1 and the
  "owner's team and lead" audience in §2. Reason: work context does not
  belong in a public portfolio document. Audience is now the owner and a
  public technical audience. Status → v0.2.

---

## 2026-09-08 — Phase 1: research note on WebMCP status

- **Phase:** 1 — Discovery
- **Participants:** Owner (supplied three source URLs), Agent (Claude)
- **Produced:** `docs/00-discovery/research/webmcp-status.md` (12 dated
  findings, 6 implications). Updated `assumptions-and-questions.md`: A1
  confirmed, Q3 answered, Q5 mechanism identified.
- **Key facts:** spec draft 2026-09-04; API is `document.modelContext`
  (renamed from `navigator.*` on 2026-07-21); Chrome 149+/Edge 150+ origin
  trial; Firefox/Safari reviewing; no mainstream consumer agent yet; Angular
  v22 experimental support lags the rename; `@mcp-b` polyfill/relay ecosystem.
- **What the agent got wrong or missed:** _(owner to fill)_
- **Next:** owner reads the note; remaining Phase 1 items — confirm A4/A5,
  answer Q1/Q2 (auth, reset) or push them to Requirements; then Phase 1 exit.
- **Owner decisions (2026-09-08, later):** A4 and A5 confirmed (no bank
  integrations, no native mobile). Q1 → **demo login** over a shared dataset.
  Q2 → **full reset to seed data** every 10 days / on storage full. Problem
  statement → v0.3, awaiting owner approval as the Phase 1 exit gate.

---

## 2026-09-08 — Phase 1 exit approved

- **Phase:** 1 → 2
- **Gate:** Owner approved `problem-statement.md` (v1.0). Inputs inventory
  complete (brief, seed data, design exports). Research note on WebMCP
  final. No open question blocks Requirements: Q4 (stack) deferred to
  Architecture by decision; Q5 (tools and safeguards) is a Requirements task.
- **Next:** Phase 2 — `prd.md`, `user-stories.md` (derived from the brief and
  the problem statement, with Given/When/Then criteria),
  `non-functional-requirements.md` (testing, WebMCP browser matrix and
  safeguards, accessibility, performance, security, demo reset). Then an
  adversarial review by a fresh agent session before owner approval.

---

## 2026-09-08 — Phase 2: PRD, user stories and NFRs drafted

- **Phase:** 2 — Requirements
- **Participants:** Owner (decisions: first slice = Auth + Overview; draft all three then review), Agent (Claude, drafts)
- **Produced:** `docs/01-requirements/prd.md` (v0.1), `user-stories.md` (US-01…US-41, v0.1), `non-functional-requirements.md` (NFR-T/W/A/B/P/S/D/Q, v0.1).
- **Method:** stories derived from the challenge brief line by line, cross-checked against seed data (bills totals 384.98 / 190.00 / 194.98 / 59.98; Dining Out over budget) and against the prototype's behaviour; prototype gaps turned into explicit stories (US-31, US-32, US-34). NFR thresholds are agent proposals, flagged.
- **Agent additions needing owner decision:** PRD OQ-1…OQ-5 (sign-up on demo, deposit limit, reset notice, fixed business time, mutating tool set); NFR open points (coverage %, Lighthouse target, no delete tools, device testing).
- **Owner changes and reasoning:** _(owner to fill after review)_
- **Next:** owner review → adversarial review by a fresh agent session (ambiguity, testability, contradictions) → resolve → owner approval = Phase 2 exit.

---

## 2026-09-13 — Phase 2: open questions closed by owner

- **Phase:** 2 — Requirements
- **Owner decisions:** OQ-1 sign-up shows a demo notice, no accounts
  created; OQ-2 deposit ≤ balance, withdrawal ≤ pot total; OQ-3 dismissible
  reset banner; OQ-4 business time fixed but moved to **2026** (today =
  2026-08-19; seed dates shifted +2 years at seed time); OQ-5 delete tools
  exposed **with on-screen confirmation** (agent proposed not exposing them;
  owner chose the richer option — recorded as a disagreement resolved in
  the owner's favour).
- **Clarification needed:** the owner did not understand OQ-5 as first
  phrased; re-asked in plain terms ("can the browser agent delete a pot?").
  Lesson: questions to the owner must be phrased in product terms, not in
  spec terms.
- **Updated:** `prd.md` §10, `user-stories.md` (header, US-25, US-37,
  US-40), `non-functional-requirements.md` (W5, D1, D3),
  `assumptions-and-questions.md` (A3, Q5).
- **Remaining before Phase 2 exit:** owner accepts or changes the NFR
  thresholds (T1 coverage 90 %, P1 Lighthouse 90, B1 manual device checks);
  adversarial review; owner approval.

---

## 2026-09-13 — Phase 2: adversarial review of requirements

- **Phase:** 2 — Requirements
- **Participants:** Reviewer (fresh Claude agent session, no prior context), Agent (orchestration), Owner (decisions pending)
- **Produced:** `docs/01-requirements/reviews/2026-09-13-adversarial-review.md` — 36 findings (3 Blocker, 18 Major, 15 Minor), 10 owner questions, full recomputation of every seed-derived figure.
- **Most important catches:** Pots Total Saved quoted from the design ($850) instead of the seed ($920); Release 1 depends on parameterised tools whose UI is Release 2; the 2026 date decision not propagated; "copy in Figma" referenced although Figma is never in the repo; WebMCP readiness/mode/headless contradictions; delete-confirmation mechanism undefined.
- **Disposition:** 24 findings marked "Fix" (agent applies, no decision needed); 12 marked "Owner" (need product decisions). Nothing rejected.
- **Lesson:** the drafting agent copied a figure from the prototype rather than recomputing it from the seed — the review's numbers table is now a required step for any document quoting seed data.
- **Next:** owner answers the 12 decisions; agent applies all fixes → v0.3 → owner approval = Phase 2 exit.

---

## 2026-09-13 — Phase 2: review findings applied → v0.3

- **Phase:** 2 — Requirements
- **Owner decisions (12):** data.json wins over design; Highest/Lowest signed for transactions, absolute for bills; Spent counts negatives only, Latest Spending both signs; R1 tools = `get_balance` + `get_overview_summary`; tools **page-scoped** (agent recommended global — owner chose page-scoped; recorded); delete confirmation client-side; limits 999,999,999.99 / 7-day session / 2,000 rows or 50 MB; pot % two decimals. Agent resolved R-12 (bottom nav on tablet, verified in style guide) and R-35 (logout in sidebar footer, R1).
- **Applied:** all 36 findings — `user-stories.md` v0.3 (new ACs on 20+ stories, US-13 given an AC, US-38/39/40 rewritten for page scope, readiness signal, modes, ids; copy-table appendix), `prd.md` v0.3 (R1 scope, decisions section, dates), `non-functional-requirements.md` v0.3 (T2, T8, W1–W3, W5, B1–B2, P1, P3, S2–S4, D5; no open points), problem statement erratum for 2026, review file disposition column.
- **Next:** owner approval of v0.3 = Phase 2 exit → Phase 3 Architecture.

---

## 2026-09-13 — Phase 2 exit approved

- **Phase:** 2 → 3
- **Gate:** Owner approved PRD, user stories and NFRs (v1.0) after the
  adversarial review cycle. Requirements are frozen; changes from here go
  through a new version with a log entry.
- **Next:** Phase 3 — Architecture. First decision: stack (Q4), re-evaluating
  the prior Angular 22 / Nx / NestJS proposal against NFR-W (page-scoped
  tools, one adapter, polyfill baseline), NFR-T and NFR-D; then repo layout,
  testing strategy, WebMCP adapter, persistence + seed/reset, auth/session,
  hosting + reset job + origin trial; system overview; data model; design
  tokens.

---

## 2026-09-13 — Phase 3: ADR-0001 stack proposed

- **Phase:** 3 — Architecture
- **Owner input:** no stack preference; "give your recommendation and justify it"; backend by requirements.
- **Produced:** `docs/02-architecture/adr/0001-stack.md` (Proposed): Next.js full-stack on Vercel + Neon Postgres + Prisma + Zod + Vitest + Playwright. Four alternatives, the prior Angular/Nx/NestJS attempt credited as Alternative B.
- **Key reasoning:** NFR-W1 (framework-independent adapter) neutralises Angular's first-party WebMCP advantage; solo operations (one deploy, built-in cron, non-sleeping free tier) and shared Zod schemas decide it.
- **Next:** owner accepts/rejects ADR-0001; then ADR-0002 repo layout, 0003 testing strategy, 0004 WebMCP adapter, 0005 persistence & reset, 0006 auth/session, 0007 hosting & origin trial; system overview; data model; design tokens.
- **ADR-0001 accepted by owner (2026-09-13)** without changes. Stack (Q4) closed: Next.js full-stack on Vercel, Neon Postgres, Prisma, Zod, Vitest, Playwright, Vercel Cron. Agent proceeds to ADR-0002…0007, system overview, data model and design tokens.

---

## 2026-09-13 — Phase 3: remaining architecture documents drafted

- **Phase:** 3 — Architecture
- **Produced:** ADR-0002 repository layout (single app, lint-enforced boundaries), ADR-0003 testing strategy (pyramid, traceability script, WebMCP test modes), ADR-0004 WebMCP adapter (one module, page registries, polyfill baseline, client-side delete confirmation, event bus), ADR-0005 persistence & reset (Neon, Prisma, cents, fixed clock, cron + threshold), ADR-0006 auth & session (demo account, iron-session cookie, rate limit, headers), ADR-0007 hosting & delivery (Vercel + Neon branches, GitHub Actions, previews, OT token on production); `design-tokens.md` (22 colours, 7 presets, 11 spacings, radii, breakpoints, icons, states — from the style guide export), `data-model.md` (6 entities, enums, derived functions, API surface), `system-overview.md`.
- **Carried forward with credit:** the prior attempt's testing and WebMCP thinking (2026-09-01) informs ADR-0003/0004.
- **Agent choices flagged for the owner:** iron-session over Auth.js (0006); Prisma over Drizzle (0005); no workspace tooling (0002); focus-indicator token added beyond the style guide (design-tokens).
- **Next:** owner reviews and accepts ADR-0002…0007 (each individually) and the three documents → Phase 3 exit → Phase 4 specs.

---

## 2026-09-13 — Phase 3: ADR-0002…0007 accepted

- **Owner decisions:** 0002 A; 0003 accepted **minus visual snapshot testing** ("not needed"); 0004 A; 0005 A; 0006 A; 0007 recommendation (A).
- **Consequence handled:** NFR-T9 withdrawn → `non-functional-requirements.md` v1.1 and `prd.md` v1.1 (Release 3 item removed). Approved documents are amended by version bump + this entry, per the Phase 2 exit note.
- **Still awaiting owner:** `system-overview.md`, `data-model.md`, `design-tokens.md` (incl. the agent-added focus-indicator token).
- **Commit state:** `5fae839` discovery; requirements staged, commit blocked by a git lock the sandbox cannot delete — owner to run the two-line cleanup + commit.

---

## 2026-09-13 — Phase 3 exit approved

- **Gate:** all seven ADRs Accepted; system overview, data model and design tokens approved (focus-indicator token kept). NFR → ADR mapping: T→0003, W→0004, A→0003/tokens, B→0003/0007, P→0001/0007, S→0006, D→0005/0007, Q→0002.
- **Process change:** owner granted the agent delete permission in the repo folder for this session, so the agent can now clean git lock files and make commits itself (commits remain attributed to the owner; the owner still approves content).
- **Next:** Phase 4 — feature specs (`03-specs/`), `definition-of-done.md`, `backlog.md`; first slice Auth + Overview.

---

## 2026-09-20 — Phase 4: Release 1 specs, Definition of Done, backlog

- **Phase:** 4 — Specs & plan
- **Owner decision:** start with the first slice's specs rather than all seven (agent proposal accepted).
- **Produced:** `03-specs/auth.md` (login/sign-up/logout/session, API table, states, tests), `app-shell.md` (sidebar, bottom nav, minimise, banner, skip link, `/api/meta`), `overview.md` (five cards, formatting rules, worked seed example, `OverviewDto`, empty/error states), `webmcp-tools.md` (adapter contract, modes, readiness, `defineTool` rules, result/error shape, R1 tools `get_balance` and `get_overview_summary`, reserved R2 names, test plan per mode), `definition-of-done.md`, `backlog.md` (T-01…T-15, ordered, with dependencies).
- **Agent additions beyond the stories (flag for owner):** demo-credentials box with copy buttons on the login page (SPEC-auth 2.2); "Coming in Release 2" placeholder pages so navigation works in R1 (T-07); money in tool outputs as decimal strings (SPEC-webmcp-tools §3); skip link (SPEC-app-shell 2.8); `X-Via: webmcp` header for the "via tool" marker.
- **Next:** owner reviews the four specs + DoD + backlog → Phase 4 exit for Release 1 → Phase 5 build starts at T-01.
