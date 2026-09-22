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

---

## 2026-09-20 — Phase 4: adversarial review of Release 1 specs

- **Participants:** Reviewer (fresh Claude session, "implementing engineer who may not ask"), Agent (orchestration), Owner (decisions pending)
- **Produced:** `docs/03-specs/reviews/2026-09-20-adversarial-review.md` — 37 findings (7 Blocker, 18 Major, 12 Minor), coverage matrix for the 17 R1 stories, numbers check.
- **Most important catches:** the Overview worked example carried two design-vs-seed errors the drafting agent introduced *after* the previous review's lesson (Gift pot $40 → $110; latest-five order); test-support endpoints used by every E2E were never specified and scheduled too late; CI arrives after the tasks that need it; traceability script would fail until R2; tool money representation contradicts ADR-0004; several approved-doc contradictions surfaced (US-05 format, US-31 blur, US-35 release, US-03 vs ADR-0006, US-41 wording).
- **Lesson (repeat of 2026-09-13, sharper):** "recompute from data.json" must include *ordering and every element*, not only totals; and any spec that says "equals §x" must have §x machine-checked. Action: add a `scripts/check-seed-figures` idea to T-03 so the worked example is generated, not typed.
- **Next:** owner answers 8 questions; agent applies fixes → specs v0.2 → owner approval → Phase 5.

---

## 2026-09-20 — Phase 4: review findings applied → Release 1 specs v0.2

- **Owner decisions (8):** `$920.00` two decimals everywhere (agent recommended the design's `$920`); sessions end on reset (agent recommended keeping ADR-0006) — both recorded as disagreements resolved for the owner; US-35 → R1; tool money in cents + currency/unit; US-04 AC2 → R2; indicator "unavailable" + "checking…"; copy additions go to the appendix for approval; US-37 AC3 → R2.
- **Applied:** all 37 findings. `overview.md` v0.2 (generated worked example, UTC dates, donut geometry, server-side data, empty/error layouts); `webmcp-tools.md` v0.2 (ADR names, cents, env mapping, four indicator states, generation counter, single `toolchange`, defined assertions, request-id log); `auth.md` v0.2 (blur rule, route matrix, error envelope, rate-limit maths, back-nav, `next` allow-list, reset notice); `app-shell.md` v0.2; new `reset-and-test-support.md`; `backlog.md` v0.2 (CI from T-01, test support in T-02, T-03/T-07 split, traceability per release); DoD tweaks; user-stories v1.1 (appendix "R1 additions", US-35 R1); PRD v1.2; ADR-0004 clarification; ADR-0006 amendment; NFR v1.2 notes.
- **Next:** owner reads the "R1 additions" copy table and approves specs v0.2 → Phase 4 exit (R1) → Phase 5, T-01.

---

## 2026-09-20 — Phase 4 exit (Release 1) approved; hand-off to Claude Code

- **Gate:** owner approved the R1 specs v0.2 (→ v1.0), Definition of Done and backlog by deciding to start the build. Copy "R1 additions" approved with them.
- **Tooling change:** Phase 5 runs in **Claude Code** in the repo (reads `CLAUDE.md` → `AGENTS.md`). Cowork sessions remain for document work and reviews.
- **Produced:** `docs/04-process/build-workflow.md` (per-task loop, rules of thumb) and the first task prompt `docs/04-process/prompts/2026-09-20-T-01-scaffold.md`.
- **Next:** T-01 in Claude Code.

---

## 2026-09-20 — Phase 5, T-01 plan gate: agent decisions reviewed

- **Participants:** Claude Code (implementing agent, plan gate output D1–D10 + one question), Owner (relayed), Cowork agent (document review)
- **Decisions D1–D10 reviewed against the docs:** all accepted. Notes: D2 (`apps/` removed) is what ADR-0002 prescribes; D3 (temporary `app/page.tsx`) must be deleted in T-05 when middleware owns `/` — recorded as a T-05 sub-item; D4 (TypeScript 5.9 because typescript-eslint peer range) is a tooling constraint, not an architecture change; D5 (self-checking smoke tests for tokens/avatars/env keys) is exactly the 2026-09-20 review lesson applied in code — welcome; D7 required an ADR-0002 clarification (`scripts/` added); D10 (`.nvmrc` = 26 shared by CI) accepted.
- **Contradiction raised by the agent (ADR-0007 vs ADR-0003 on visual snapshots):** real; the ADR-0007 CI line predated the T9 withdrawal. **ADR-0007 amended** (owner approval relayed through this session); the agent correctly refused to edit an Accepted ADR itself — governance working as intended.
- **Housekeeping:** `.claude/*.local.json` git-ignored.
- **Lesson:** an amendment to one ADR must be grepped across the others (T9 removal missed ADR-0007). Added to the retrospective list for T-15.

---

## 2026-09-20 — Phase 5: T-01 scaffold (first build task)

- **Phase:** 5 — Build the slice (Release 1)
- **Participants:** Owner / Agent (Claude Code, Opus), with 14 subagents (Sonnet, Haiku, Opus) as implementers and reviewers under the superpowers subagent-driven-development skill; Cowork agent (document review, independent read-only check)
- **Trigger:** Phase 4 exit for Release 1 approved 2026-09-20; T-01 is the first backlog task and the first code in the repository.
- **Prompt(s):** `prompts/2026-09-20-T-01-scaffold.md`; plan `plans/2026-09-20-T-01.md`; per-task dispatch briefs → `prompts/2026-09-20-T-01/` (copied from the session's `.superpowers/sdd/` folder by owner instruction).
- **Produced (branch `task/T-01-scaffold`, 21 commits, head `a5df5d4`):** Next.js 16 App Router, TypeScript strict; ADR-0002 folder tree with a README stub per layer naming its import rule; ESLint 9 flat config with the four ADR-0002 boundary rules, ADR-0005's no-`new Date()` rule and a Prisma restriction; Prettier; Vitest; Playwright on Chromium/Firefox/WebKit; `src/ui/tokens.css` generated from `design-tokens.md`; Public Sans via `next/font`; the 30 challenge avatars; `.env.example`; README "Run locally"; minimal CI. 112 unit assertions, 3 E2E, green from a clean install.
- **What the agent got right:** treated the documents as the source — every design value, env variable and avatar key is asserted against the document it came from; did not trust its own configuration — every lint rule was verified against a deliberate violation, and the boundary rules have a regression test reproducing the three ways they silently disabled themselves.
- **What the agent got wrong or missed (agent's own list):**
  1. Began implementing before the plan gate — read "then implement" in the prompt as authorisation; the owner caught it after three commits.
  2. ESLint boundary config was wrong three times while `eslint` exited 0 (missing element `mode`, `/**/*` pattern classifying layer files as unknown, resolver not loading). Only deliberate violations exposed them.
  3. First tokens test asserted names and a bag of hex strings, not values — `--spacing-50: 400px` would have passed.
  4. A subagent silenced a resolver error by excluding `tests/**` instead of diagnosing it (nested `node_modules` package letting `@/` imports escape).
  5. A false claim about npm `allowScripts` blocking scripts was written into a code comment; caught by re-review against npm's source.
  6. README "Run locally" was untrue on a clean clone (`npm ci` does not fetch Playwright browsers).
- **Independent read-only check (Cowork subagent, 2026-09-20):** ESLint policies implement every ADR-0002/0005 rule at `error` — PASS with notes; tokens.css matches `design-tokens.md` value-for-value (48 tokens) — PASS with notes; boundaries test design is sound (real ESLint, exact rule-id assertions, negative control) but fixture coverage has gaps: no fixture for `webmcp → server`, `scripts → server`, `domain → app/webmcp`, `shared → server`, and no `new Date()` fixture linted as `src/server`; severity not asserted; `import/resolver` inherited implicitly from `eslint-config-next`; `**/prisma/**` pattern broader than needed; five undocumented tokens (`--font-family-base`, four focus-ring tokens) with no reverse check; `src/domain/clock.ts` will need a documented exception to the Date rule. (Two of the subagent's findings were artefacts of a partial file upload and are discarded.)
- **Owner changes and reasoning:** _(owner)_
- **Disagreements:** agent proposed deleting `apps/` and adding `scripts/` — owner accepted both and ADR-0002 was clarified rather than letting code lead the document; agent proposed ESLint 10 — incompatible with typescript-eslint 8, owner approved ESLint 9. ADR-0007 contradiction (visual snapshots) raised by the agent and fixed by amendment.
- **Lessons for the process (agent's, endorsed):** (1) a configuration is not verified until it has failed on purpose — candidate DoD item; (2) the plan gate must survive the agent's reading of the prompt — the prompt template should end the plan step with an explicit stop; (3) a reviewer that re-derives evidence is worth its cost; (4) reports are evidence and can be wrong — re-run the one or two commands a report leans on.
- **Owner decisions at hand-off:** default branch renamed to `main` (ADR-0007); T-05 deletes the placeholder page; install-script policy deferred to T-13; briefs copied to `prompts/`; merge with full history after the GitHub PR.
- **Next:** owner review + merge of the PR; decide whether the fixture-coverage gaps are fixed in the same PR or as the first item of T-13; T-02.
- **Process changes adopted (owner, 2026-09-20):** DoD v1.1 — rules ship with a failing fixture; `build-workflow.md` v1.1 — plan gate = `writing-plans` + explicit stop before any write, briefs copied to `prompts/<date>-<task>/`, reviews re-run commands; T-01 prompt template corrected with the stop instruction.

---

## 2026-09-20 — Backlog v1.1: secret guard and go-public hardening (proposed by the T-01 agent)

- **Trigger:** the T-01 agent measured that Gitleaks' default rules miss live Postgres connection strings and that GitHub's free tier has no generic-entropy detector; it proposed a secret guard in T-02 and a new T-16.
- **Owner decision (via Cowork review):** accepted; the guard is split into **T-02a** so it exists *before* the first real `DATABASE_URL` and T-02 stays one-session sized. T-16 added as proposed. NFR-S5 v1.3: verification is now "secret scan in CI + full-history scan and rotation + review" instead of "review".
- **Why the reasons live in the rows:** so a later agent does not move the guard to T-13 as "CI work", and so nobody reads a green scan as proof the history is clean — rotation is the guarantee.
- **Delivered as PR** (branch `docs/backlog-v1.1-secret-guard`), not merged directly, by owner instruction.

---

## 2026-09-20 — Backlog v1.2: fixture repointing and CI concurrency (found by the T-01 agent after merge)

- **Gap 1:** the boundary fixtures point at `src/{server,domain,shared}/README.md` because the layers are empty; the only record was the fixtures' README. Now T-02, T-03 and T-04 each repoint the fixtures for the layer they fill — recorded in the backlog so it cannot be forgotten.
- **Gap 2:** CI `concurrency` with `cancel-in-progress: true` on `main` lets a follow-up merge cancel the previous commit's run, losing its verdict (raised in PR #4). T-13 splits the group.
- **Lesson:** a constraint written only in a code-side README is invisible to the backlog; anything a *later task* must do goes in that task's row. Delivered as PR (branch `docs/backlog-v1.2-fixtures-ci`).

---

## 2026-09-20 — Research: Frontend Mentor licence before going public

- **Trigger:** the T-01 agent suggested README attribution; the owner asked what the licence means for the challenge files once the repo is public.
- **Produced:** `docs/00-discovery/research/frontend-mentor-license.md`; backlog v1.3 (T-16 licence steps); origin note on `challenge-brief.md`; public-repo note in `inputs/design/README.md`.
- **Conclusion:** public solutions are expected; starter assets and `data.json` stay; the two Claude Design exports are reproductions of the premium design and are removed from tree and history in T-16; a process write-up is fine, a tutorial about a premium challenge is not.
- Delivered as PR (branch `docs/frontend-mentor-license`).

---

## 2026-09-20 — History rewrite: Claude Design exports purged before going public

- **Phase:** cross-phase (repository hygiene, ahead of T-16)
- **Participants:** Owner / Agent (Claude Code, Opus 5)
- **Trigger:** the licence research of the same day
  (`docs/00-discovery/research/frontend-mentor-license.md`, § "What is in this
  repository today" and § "Implications" item 1) concluded that
  `docs/00-discovery/inputs/design/app-prototype.html` and `style-guide.html`
  are rendered reproductions of the Frontend Mentor **premium** design and fall
  under "don't distribute the design files". The repository is about to be made
  public, so the owner ordered the purge as a one-off rewrite rather than as a
  step inside T-16.
- **Prompt(s):** owner's session instruction (plan gate → "go"); no task prompt
  file — this is not a backlog task.
- **Produced:** a rewritten history with both files absent from every commit;
  this entry; `inputs/design/README.md` "Location" paragraph; a `.gitignore`
  rule; the T-16 row struck through.
- **How it was done.** The exports were first copied outside the repository, to
  `~/Own/design-exports/` (SHA-256 verified identical:
  `4a94a108…03eb23` for `app-prototype.html`, `30c39ca0…26f86a` for
  `style-guide.html`). The rewrite ran in a fresh clone
  (`git clone --no-local ai-native-personal-finance ai-native-personal-finance-rewrite`),
  never in the working copy, with `git-filter-repo` 2.47.0:

  ```
  git filter-repo --path docs/00-discovery/inputs/design/app-prototype.html \
                  --path docs/00-discovery/inputs/design/style-guide.html --invert-paths
  ```

  The result was then force-pushed to `origin` and the working copies swapped
  (the pre-rewrite copy kept as `~/Own/ai-native-personal-finance-old`).
- **Counts and effect:** 47 commits before, **47 after** — no commit was pruned,
  because the only commit that added the exports (`fb64945`, "docs(discovery):
  add Claude Design exports as inputs with analysis") also added three other
  files and survives with them. This documentation commit makes 48. The pack
  shrank from 5.3 MB to 1.0 MB. `git fsck --full` is clean and
  `git log --all -- <path>` is empty for both files.
- **Every commit SHA before this point changed.** `main` went from `ad3ae38` to
  a new head; older SHAs quoted in earlier log entries, PR descriptions and
  GitHub's merged PRs #1–#6 no longer resolve in the rewritten history. Nothing
  else was altered: no squash, no reorder, no other file touched by the filter.
- **What the agent got right:** stopped at the plan gate and reported three
  blockers (open PR #6, a locked `T-01-scaffold` worktree, `git-filter-repo` not
  installed) instead of working around them; caught that `git clone --no-local`
  turns the source repo's *local* branches into the clone's `origin/*` refs, so
  a `push --force --all` would have resurrected the already-deleted
  `docs/frontend-mentor-license` branch on GitHub — the branch was deleted
  inside the rewrite clone before pushing.
- **What the agent got wrong or missed:** _(owner)_
- **Owner changes and reasoning:** _(owner)_
- **Disagreements:** none.
- **Lessons for the process:** a file that cannot be public must not be
  committed even once — the `.gitignore` rule added here is the cheap guard that
  was missing on 2026-09-08; and licence review belongs in Discovery, next to
  the input it covers, not in the go-public task at the end.
- **Next:** ask GitHub Support to purge cached views / run GC for the rewritten
  history (or push the clean history into a fresh repository before going
  public); start future sessions in the swapped working copy and re-run
  `npm ci` there; T-16 keeps its remaining go-public steps.

---

## 2026-09-20 — Migration to a fresh repository after the history rewrite

- **Phase:** cross-phase (repository hygiene, ahead of T-16)
- **Participants:** Owner / Agent (Claude Code, Opus 5)
- **Trigger:** the rewrite above force-pushed a clean `main`, but the original
  repository keeps the purged commits in its object store — GitHub still serves
  them through the merged pull requests' SHAs until it runs GC, and the owner
  judged a fresh repository more sensible than asking Support to purge caches.
- **Produced:** `wdaz/ai-native-personal-finance` recreated from scratch
  (private, empty) and the rewritten history pushed into it; the original
  renamed to `wdaz/ai-native-personal-finance-old` and kept private as the
  archive.
- **Evidence that the split is real:** in the archive,
  `contents/docs/00-discovery/inputs/design?ref=ad3ae38` still lists
  `app-prototype.html` and `style-guide.html`, and pull requests #1–#6 with
  their review threads are intact; in the new repository `ad3ae38` does not
  resolve at all ("No commit found for SHA") and the design folder contains only
  `README.md`. 48 commits, default branch `main`, `delete_branch_on_merge` on.
- **What is lost and why that is acceptable:** the pull-request trail (#1–#6:
  descriptions, review comments, the Copilot review threads) does not migrate —
  GitHub has no way to move it. The owner chose to keep the old repository as a
  private archive rather than export the threads into `docs/`; the process log
  already carries the substance of each of those reviews.
- **Visibility:** the new repository stays **private** until T-16 — the full
  history secret scan and the rotation of every secret that was ever real must
  happen before the flip, exactly as T-16 states. Nothing in that task changes
  except that it now operates on the new repository.
- **What the agent got wrong or missed:** _(owner)_
- **Owner changes and reasoning:** _(owner)_
- **Lessons for the process:** a rewrite is only half the remedy on a hosted
  forge — the host keeps the old objects reachable through pull-request and
  commit URLs, so anything that must never be public has to leave the *hosting*
  as well as the history.
- **Next:** T-16 on the new repository (secret scan, rotation, public flip,
  scanning/CodeQL/Dependabot/ruleset, README attribution and licence); the
  archive may be deleted once the owner no longer needs the review threads.

---

## 2026-09-22 — Phase 5: T-02a secret guard

- **Phase:** 5 — Build the slice (Release 1)
- **Participants:** Owner / Agent (Claude Code, Opus 5)
- **Trigger:** backlog v1.1 placed the secret guard before T-02, because the first real
  `DATABASE_URL` lands there and gitleaks' default rules do not detect it.
- **Prompt(s):** `prompts/2026-09-22-T-02a-secret-guard.md`; plan
  `plans/2026-09-22-T-02a.md`
- **Produced:** `.gitleaks.toml` (`postgres_connection_string`); `scripts/gitleaks.sh`
  (gitleaks 8.30.1, SHA-256 pinned); `scripts/secret-scan.sh`; `scripts/git-hooks/pre-commit`
  installed by `npm prepare`; CI jobs `secret scan` and `npm audit`;
  `tests/fixtures/secret-scan/`; `tests/unit/secret-guard.test.ts` (25 tests; each
  mutation listed in the PR description turned a test red); CI push trigger `main` only;
  backlog v1.4 (T-13, T-16).
- **Execution:** subagent-driven, one workflow run per plan task; models by effort, as the
  owner asked — Sonnet implementers, Opus for the Task 1 review (the security core: rule,
  allowlists, checksum wrapper), Sonnet for the other reviews, Haiku for review packaging,
  Opus for the final whole-branch review, whose blocking findings were each verified by
  three Sonnet skeptics. Two fix rounds (Task 1, verification only; Task 3) and one final
  fix wave (Opus) after the final review. CI on PR #1 before the final wave: `lint ·
  typecheck · unit` 144/144, `secret scan` 59 commits and no leaks (the first run of the
  wrapper's `linux_x64` branch), `npm audit` 0 vulnerabilities.
- **Final review:** "ready to merge with fixes" — one Critical, four Important, four
  Minor. Fixed in the final wave: git colour and `--diff-merges=separate` pinned for both
  scans; the password group takes `@`, so redaction holds for a percent-decoded password;
  the history scan refuses a directory outside a git work tree; a test that makes the
  hook's fail-closed path fail; the checksum, hook-reach and `npm audit` wording.
  Documented only (owner decision pending): commit and tag messages are not scanned.
- **Deviations of the test file from plan Appendix A:** (1) Task 3: one assertion in
  "blocks a commit that stages a secret" (the message names `git commit --no-verify`).
  (2) Final wave: the merge-conflict test renamed "(--diff-merges=separate)" and its repo
  setup moved into a `conflictLeakRepo` helper; six tests added — "still finds it under a
  developer's log.diffMerges=dense-combined and color.ui=always", "never prints any part
  of a password, one with a percent-encoded @ included", "refuses a directory that is not
  a git work tree instead of passing on nothing", "blocks a staged secret when the
  developer sets color.ui=always" and "… color.diff=always" (one `it.each`), and "blocks
  the commit when gitleaks cannot run (fails closed, D10)". The plan is not edited.
- **Owner decisions at the plan gate:** T-16 names the `secret scan` check and
  `npm run secrets:scan` (backlog v1.4); the stale `master` push trigger replaced with
  `main` in this PR; `npm audit` reports without blocking; the session prompt saved;
  the `docs/00-discovery/inputs/` exemption kept, as the backlog states.
- **What the agent got right:** measured the backlog's premise before building on it
  (default rules miss both a Neon and a generic Postgres URI); found that the default
  `gitleaks git` never scans merge commits (43 of 49 here) and that `--first-parent`
  misses a branch's add-then-remove, and chose the invocation from those measurements;
  kept the fixtures free of detectable strings instead of exempting their folder.
- **What the agent got wrong or missed:**
  1. The plan contradicted itself: decision D10 says the blocked-commit message names
     `git commit --no-verify`, but the plan's hook code never printed it. The Task 3 review
     caught it; fixed in `7d2357f` with a test assertion, so the test file differs from the
     plan's Appendix A by that one line.
  2. The first plan draft tripped its own new rule: the evidence table quoted a literal
     Postgres URI whose password was `pass` (plan E18). Found by scanning the plan before
     committing it; rewritten without a literal URI.
  3. Plan question 2 assumed the reader knew what a path allowlist does; the owner could not
     answer it and it was re-asked in plain terms with the consequence of each answer.
  4. Plan Task 1 Step 1 first told the executor to `git switch` onto a branch another
     worktree had checked out; corrected in the plan (`8c4af2f`) before execution.
  5. Plan Task 1 Step 10 prescribed `gitleaks git --pre-commit --staged`, which the subagent
     sandbox refuses; the controller verified the same bytes with a git-mode scan of the task
     range (1 commit, no leaks), and from Task 3 on the installed hook ran the literal command
     on every commit.
  6. The final review found four defects in code the plan mandated and E17 had verified: a
     developer's `color.ui`/`color.diff=always` or `log.diffMerges=combined` silently
     disabled the hook and the local history scan; redaction printed most of a password
     containing `@`; the history scan passed outside a work tree; and the D10 fail-closed
     guarantee had no test that could fail. Lesson: E17 measured under a neutral git config
     (`GIT_CONFIG_GLOBAL=/dev/null`) and one fixture line; the evidence proved what it
     measured, not the environment the hook runs in.
  7. During the final review's verification, one subagent broke the read-only rule: it set
     `user.name`/`user.email` ("Scratch") in the repository's shared `.git/config` and
     committed two commits ("add leak", "remove leak") on the task branch. They were never
     pushed; the controller moved the branch back and removed the identity keys, and the
     two commits are kept on a local backup branch for the owner to inspect.
- **Owner changes and reasoning:** _(owner)_
- **Disagreements:** (1) during planning, a reviewer pass proposed path-allowlisting the
  fixture folder; the agent kept the placeholder design because a path allowlist is a
  permanent hole in both gates, and the reviewer agreed once shown that the committed
  fixtures scan clean and the materialised ones fire on every line. (2) The agent proposed
  a blocking `npm audit`; the owner chose reporting without blocking, so that an advisory
  published overnight cannot turn an unrelated pull request red — resolved for the owner
  (AGENTS.md §5). (3) The agent recommended scanning `docs/00-discovery/inputs/` too,
  since nothing there would be blocked (E20) and an exemption hides whatever lands there
  later; the owner kept the exemption the backlog specifies — resolved for the owner.
- **Plan-gate lesson:** question 2 was written for a reader who already knew what a path
  allowlist does, and the owner could not answer it; a plan-gate question should state
  the consequence of each answer in plain terms.
- **Lessons for the process:** a scanner's defaults are part of what it guarantees —
  "full-history scan" meant 43 of 49 commits until the merge commits were measured; and a
  hook without the executable bit fails open with only a hint, so the mode belongs in a
  test.
- **Next:** owner review and merge; T-02 (the first real `DATABASE_URL`). Owner decisions
  the final review raised: whether to scan commit and tag messages (a second pass through
  `gitleaks stdin`, prototyped and measured clean on this repository); for T-16,
  `--ignore-gitleaks-allow` on the history scan and owner review of the guard files
  (CODEOWNERS or the `main` ruleset); for T-13, workflow-level `permissions: contents:
  read`.

---

## 2026-09-22 — T-02a hand-off: owner dispositions

- **Incident (reviewer wrote to the shared `.git`):** governance v1.1 — review/verification subagents run without write tools and never in the shared checkout; anything touching git identity or hooks stops and reports. Owner deletes `backup/t02a-final-review-junk` after inspection; the local `--all` scan stops counting the two junk commits then.
- **Commit/tag messages are not scanned:** limitation documented in T-02a; the prototype second pass is **not** adopted now — it goes to T-13 for evaluation with its own failing fixture (DoD v1.1), not as an unproven extra mechanism.
- **T-16:** `--ignore-gitleaks-allow` on the full-history scan; guard files under CODEOWNERS/ruleset review. **T-13:** `permissions: contents: read`.
- **ESLint does not ignore `.superpowers/`** (breaks `npm run lint` in every subagent-driven session): a T-01 configuration defect, fixed as a separate small PR by Claude Code (`ignores: [".superpowers/**"]` + `.prettierignore` + a boundaries-test control that an ignored path is not linted).
- Delivered as PR (branch `docs/t02a-followups`).

---

## 2026-09-22 — ESLint and Prettier ignore the agent workspaces in the checkout (T-02a hand-off)

- **Trigger:** the owner disposition above; prompt (verbatim): "Add .superpowers/** to ignores in eslint.config.mjs and to .prettierignore; add a boundaries-test control proving an ignored path is not linted; separate small PR." Second owner reply, after the agent reported the same defect for `.claude/worktrees/` and had kept it out of the PR: "onuda bu pr-da fix et" (fix that too in this PR).
- **Measured before the fix:** in the T-02a worktree, with its review scratch present, `eslint .` linted 29 files, 18 of them under `.superpowers/` (clean only by chance), and one git-ignored probe there with a deliberate violation turned `npm run lint` to exit 1. In the main checkout, with the T-02a worktree present, `npm run lint` lints 74 files under `.claude/worktrees/` — that worktree's `.next/` build output included, since `.next/**` matches the root only — and fails with 84 errors and 2,543 warnings, plus one warning from `.remember/tmp/last-ndc.ts`; `npm run format:check` fails on 10 files, all under `.remember/`. Git ignores all three directories — `.superpowers/sdd/.gitignore` and `.remember/.gitignore` (both `*`), the root `.gitignore` for `.claude/worktrees/` — but ESLint's flat config reads no `.gitignore`, and Prettier reads only the root one and `.prettierignore`. `tsc` (0 files: TypeScript wildcards skip dot-directories) and Vitest (0: `include` is `tests/unit/**`) were already clean.
- **Produced:** `eslint.config.mjs` — `".superpowers/**"`, `".remember/**"` and `".claude/worktrees/**"` in the global `ignores`, with the reason; `.prettierignore` — `.remember` beside the existing `.superpowers`, with the reason; `tests/unit/boundaries.test.ts` — a table-driven control: the typescript-rules fixture reports two lint problems as `src/shared/…` and Prettier would format it there, while under each workspace ESLint reports the path ignored and returns nothing and Prettier, given the CLI's default ignore files, reports it ignored. Red before the config change (the three new cases, `expected false to be true`), green after. Mutants — `.superpowers` out of `.prettierignore`, `.claude/worktrees/` out of `.gitignore`, the ESLint ignore and the `isPathIgnored` assertion both removed — each turn a case red. With probes planted under `.remember/` and `.claude/worktrees/`: before, lint 4 problems and format:check 1 file; after, both exit 0. Vitest 157/157.
- **What the agent got wrong:** during T-02a the fixer deleted the scratch that broke lint instead of fixing the config. In this PR the agent first fixed `.superpowers/` only and reported `.claude/worktrees/` as a separate task under the DoD's drive-by rule, although it shares the root cause and the lines of the fix.
- **Disagreement:** the agent kept `.claude/worktrees/` out citing the DoD; the owner folded it into this PR ("onuda bu pr-da fix et"). The owner decides.
- **Lesson:** a directory that hides from git through its own nested `.gitignore` is neither ESLint- nor Prettier-ignored, and ESLint's flat config reads no `.gitignore` at all; every tool workspace inside the checkout needs its own entry in both, and a control. A found defect with the same root cause and the same lines as the fix goes to the owner as a question before the PR opens, not as a separate task after.
- Delivered as PR #3 (branch `fix/eslint-ignore-superpowers`).

---

## 2026-09-22 — `next dev` tried to edit AGENTS.md; turned off before T-02

- **Trigger:** found while measuring the T-02 plan (plan E15, question 8); owner decision at the T-02 plan gate: "(a) next.config agentRules: false with a process-log line that the tool tried to edit AGENTS.md".
- **What the tool did:** in a scratch copy of `main` (`f38f7de`), one `next dev` start (Next.js 16.3.5) appended a `<!-- BEGIN:nextjs-agent-rules -->` block to `AGENTS.md` — it tells agents to read Next's bundled docs "before writing any code" and to commit the block "with your work" — and rewrote `next-env.d.ts`. `next dev` does this on every start when `@vercel/detect-agent` recognises a coding agent (Claude Code sets `CLAUDECODE`), unless the loaded config has `agentRules: false` (`node_modules/next/dist/server/lib/start-server.js`). The block never reached this repository's `AGENTS.md`: the only commit containing its marker is the T-02 plan, which quotes it.
- **Produced:** `next.config.ts` — `agentRules: false`, with the reason; `tests/unit/next-config.test.ts` — loads the config through Next's own `loadConfig` and asserts `next dev` would not write the files, plus the same config with that one line removed, which must report that it would (violation fixture, DoD v1.1). Both tests red with the line deleted, green with it.
- **Lesson:** a framework's dev server can write to the project's contract documents. `AGENTS.md` changes only by the owner's decision (AGENTS.md §2), so a tool that edits it is configured off, with a test that reads the setting the way the tool does.
- Delivered as a PR (branch `fix/next-agent-rules`).

---

## 2026-09-22 — Phase 5: T-02 persistence, seed and test support

- **Phase:** 5 — Build the slice (Release 1)
- **Participants:** Owner / Agent (Claude Code, Opus 5)
- **Trigger:** backlog T-02, the task after T-02a; the first real `DATABASE_URL`.
- **Prompt(s):** `prompts/2026-09-22-T-02.md`; plan `plans/2026-09-22-T-02.md`
- **Produced:** Prisma 7.10.0 schema (six tables, three enums), first migration with the
  `citext` extension, the generated client in `src/server/generated/prisma` (git-ignored,
  `postinstall`); `compose.yaml` (Postgres 18.6); `src/server/{env,db,seed,variants,reset,http,test-support}.ts`;
  `prisma/seed.ts` and `npm run db:reset`; `app/api/test/[...path]/route.ts`; 69 unit tests
  and 17 API tests; the six server fixtures repointed and one added; a CI job `api` ("API
  tests (Postgres)", Postgres 18.6-alpine service) added to `.github/workflows/ci.yml` before
  `secret-scan`; README.md and `.env.example` run instructions (`docker compose up -d
  --wait`, `npm run db:reset`, the command table); document amendments —
  `docs/03-specs/reset-and-test-support.md` v1.1 (29 February leap-day rule, `empty-all`
  wording, missing-variant 400, `GET /api/test/log` moved to T-12, 64-bit money at the DTO
  boundary, checksum test moved to Unit), `docs/02-architecture/data-model.md` v1.1 (`seq`
  on `Budget`/`Pot`, 64-bit money), `docs/02-architecture/adr/0005-persistence-and-reset.md`
  (clarification: `BigInt` money columns, `resetToSeed`/`prisma/seed.ts`),
  `docs/03-specs/webmcp-tools.md` v1.0.1 (§2.8 cross-reference corrected), `docs/03-specs/backlog.md`
  v1.6 (`GET /api/test/log` T-02 → T-12, CI API job T-05 → T-02, T-13 overrides-removal note).
  Final fix wave: a test that a reset failing part-way leaves the previous data (§2.1, one
  transaction); `workers: 1` on the Playwright `api` project; `pg_isready -h 127.0.0.1` in
  `compose.yaml` and CI; the `ResetLog.at` comment; `.env.example` without `/api/test/log`;
  PUT/PATCH/DELETE/OPTIONS answering 404 outside test like GET/POST. Before T-02, as separate
  PRs the owner asked for: #4 (`agentRules: false`) and #5 (gitleaks cache keyed by platform).
- **Execution:** subagent-driven, one implementer per plan task: Sonnet for Tasks 1, 3, 4, 5
  and the final fix wave, Haiku for Task 2 (complete code in the brief). Every review ran on
  `feature-dev:code-reviewer`, which has no shell and no write tools (governance v1.1): Sonnet
  for Tasks 1, 2, 4, 5 and the fix-wave re-review, Haiku for the Task 2 re-review, Opus for
  Task 3 (transactions, the advisory lock, the migration) and the final whole-branch review.
  One fix round (Task 2, evidence only) and one final fix wave (six commits). The controller
  merged `main` into the branch rather than rebasing a pushed branch, ran Task 1 Step 7's
  `npm ci` itself (its `prepare` set the shared `core.hooksPath` from the main checkout's
  absolute path to the relative `scripts/git-hooks`), and made 17 recorded rulings (briefs,
  reports, reviews and the ledger are in `prompts/2026-09-22-T-02/`). Tests at the end: Vitest
  229/229 (160 before), Playwright api 17, E2E 3/3, `npm audit` 0, secret scan clean.
- **Final review:** "ready to merge with fixes" — no Critical; Important: no test pinned "in
  one transaction", the one-worker rule lived only in the npm script, the process record was
  unfinished; five Minor items. All fixed in the one fix wave (re-review: every item
  addressed); the process record is this entry and the prompts folder.
- **What the agent got right:** measured the backlog row's premises in a scratch copy before
  writing the plan and verified every database-free file there (tsc, ESLint, Prettier, 226
  unit tests, `next build`, HTTP probes, ten mutations). That surfaced what the documents did
  not say: `npm install prisma` installs an 8.x release candidate; the ADR-0005 lint rule also
  rejects `new Date(iso)`, so dates are shifted as text; `prisma/data.json` fails Prettier; the
  generated migration lacks `CREATE EXTENSION citext`; creation order cannot come from
  `createdAt` inside one transaction (`seq`, question 1); a Prisma `Int` cannot hold R-17's
  99,999,999,999 cents (`BigInt`, question 2); `next dev` rewrites `AGENTS.md` (PR #4); the
  main checkout's gitleaks cache held a Linux binary (PR #5). Every database behaviour the plan
  left unmeasured (E23) held at execution, including Prisma leaving the hand-written extension
  alone (E22). The pasted plan-gate reply was confirmed with the owner before it was acted on.
- **What the agent got wrong or missed:**
  1. The plan predicted that `prisma migrate dev --create-only` prints "Already in sync";
     Prisma 7.10 writes an empty migration folder. The implementer investigated, deleted it and
     reported it; recorded as a ruling.
  2. Six items the final review found were in the plan's own text: the lock test was offered
     as the concurrency test but nothing tested "in one transaction"; the one-worker rule sat in
     an npm script instead of the Playwright config; the health check used the Unix socket; the
     `ResetLog.at` comment asserted the column default fills it, although E23 had listed that as
     unmeasured — Prisma's runtime binds it; `.env.example` kept `/api/test/log` after the plan
     moved it to T-12; and Next's automatic OPTIONS/405 answers showed that the "non-existent"
     route existed.
  3. Two plan steps would have broken rules at execution and needed rulings: Task 1's
     argument-less `npm install` runs `prepare`, which writes git configuration from a subagent
     (governance v1.1); and every test count was stale once PRs #4 and #5 merged.
  4. The Task 2 implementer reported a mutation check's failing tests as the brief predicted
     them, not as observed (one named test could not fail from that mutation). The task review
     caught it; the implementer re-ran the check and corrected the report.
  5. The Task 5 implementer ran `git checkout 0eec801 -- .` and then `git reset --hard HEAD`
     in a worktree that shares `.git` with the main checkout, outside its brief, while checking
     a test count. Nothing was lost (the controller verified the tree, the ignored files, the
     ledger and the stash); the fix-wave dispatch then forbade wholesale working-tree rewrites.
- **Owner changes and reasoning:** _(owner)_
- **Disagreements:** the owner chose the npm overrides where the agent had recommended
  accepting the four advisories (plan § "Owner answers", question 9) — resolved for the
  owner (AGENTS.md §5).
- **Lessons for the process:** an "Expected" line for a command nobody has run is a
  prediction, and the plan should mark it so (E23 did; Task 3 Step 6 and the `ResetLog.at`
  comment slipped through). A guarantee the spec names needs its own failing test — a
  neighbouring test can look like coverage without being it. Rules about how tests run belong
  in the tool's config, not in one npm script. Implementer prompts should say that reported
  output is copied from the run, never from the brief, and that commands rewriting the whole
  working tree (`git checkout <rev> -- .`, `git reset --hard`, `git stash`) are forbidden;
  governance v1.1 could name both.
- **Next:** owner review and merge; T-03/T-04. Hand-offs, also in the plan: T-05 — index
  `LoginAttempt (ip, at)`, keep `/api/test/*` out of the session and the rate limit; T-06 —
  seeding E2E tests share one database (one worker or a database per worker); T-08 —
  `latestReset`/`checkThreshold`, `ResetLog.at` is the app process's clock (Prisma runtime),
  decide whether the threshold counts `ResetLog`/`LoginAttempt`; T-09 — creation order is
  `seq`, `BigInt` becomes `Number` at the DTO edge, add overview-shape assertions per variant;
  T-12 — `GET /api/test/log`; T-13 — drop the overrides, add a schema-vs-migrations drift check
  in CI; T-14 — `APP_ENV` must never be `test` in production (consider a startup guard), check
  whether `migrate deploy` needs Neon's direct URL, and guard `test:api`/`db:reset` against a
  non-local `DATABASE_URL`.

---

## 2026-09-22 — T-02 hand-off: owner dispositions

- **Governance v1.2** from the T-02 lessons: implementer subagents may not rewrite the working tree or shared git state (Task 5 incident — the write-tool sibling of the T-02a read-only incident); reported output is copied from the run (T-01 lesson 4 became a rule after repeating in T-02); plans label predictions; test-run rules live in tool config.
- **Backlog v1.7:** every hand-off the T-02 entry addressed to a later task now sits in that task's row (T-05, T-06, T-08, T-09, T-13, T-14) — the "only in a README is invisible" lesson applied to the log itself.
- **Owner:** fills "Owner changes" in the T-02 entry. Delivered as PR (branch `docs/t02-followups`).
