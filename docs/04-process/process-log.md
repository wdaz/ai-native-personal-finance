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

---

## 2026-09-22 — Phase 5: T-03 domain logic and generated seed figures

- **Phase:** 5 — Build the slice (Release 1)
- **Participants:** Owner / Agent (Claude Code: Opus 5 wrote the plan, Opus 5.5 controlled the
  execution; subagents below)
- **Trigger:** backlog T-03, after T-02 merged (PR #6) and the T-02 follow-ups (PR #7).
- **Prompt(s):** `prompts/2026-09-22-T-03.md`; plan `plans/2026-09-22-T-03.md` (v0.2);
  execution record `prompts/2026-09-22-T-03/`
- **Produced:** `src/domain` — `clock.ts` (`Clock`, `BUSINESS_TODAY`, `fixedClock`),
  `calendar.ts` (`shiftYears` and `SEED_YEAR_SHIFT` moved verbatim from `src/server/seed.ts`; the
  UTC month), `money.ts` (`toCents` moved verbatim; `sumCents`), `types.ts`, `transactions.ts`
  (`latestTransactions`, US-11 Latest), `budgets.ts` (`budgetSpent`), `bills.ts`
  (`recurringBills`, `billsSummary`), `overview.ts` (`overviewSummary`); `src/shared/money.ts`
  and `dates.ts` (the SPEC-overview §4.2 formatters: integer digits, three-letter months, strict
  ISO-8601 input); the ADR-0005 lint rule narrowed to the calls that read the clock (`new Date()`
  without arguments, `Date()`, `Date.now()`), with four new boundary fixtures and two repointed;
  `scripts/seed-figures.ts` and `npm run seed:figures`; `tests/unit/seed-figures.test.ts`, which
  fails when SPEC-overview §4.3 and the script's output differ, with three fixtures that are wrong
  on purpose. Documents: `docs/03-specs/overview.md` v1.1 (§4.2 dates from a fixed month table;
  §4.3 per-budget amounts as `$15.00`; the check named), `docs/03-specs/backlog.md` v1.8 (T-03
  takes the formatters and the rule fix, T-04 narrowed, hand-offs in the T-05, T-08, T-09, T-10
  and T-13 rows), an ADR-0005 clarification ("parsing a date is allowed; reading the clock is
  not"). Tests: Vitest 229 → **341** (112 new), API 17/17 (measured before Task 2 and at the
  end), E2E 3/3, `src/domain` + `src/shared` coverage 100 %, `npm audit` 0, secret scan clean.
- **Execution:** subagent-driven, one Sonnet implementer per task (Task 6: Steps 1–3; the
  process record was written by the controller after the final review) and for the final fix
  wave. Every review ran on `feature-dev:code-reviewer`, which has no shell and no write tools
  (governance v1.1): Sonnet for Tasks 1, 2, 4, 6 and the three re-reviews, Opus for Tasks 3 and 5
  and the final whole-branch review. Two task fix rounds (Task 2, Task 3) and one final fix wave
  (two commits). The controller ran `npm ci` itself (the worktree's `node_modules` was empty;
  `core.hooksPath` was already the relative `scripts/git-hooks` and did not change), created
  `.env.local` from `.env.example` (README), and made 15 recorded rulings (ledger in
  `prompts/2026-09-22-T-03/progress.md`).
- **Deviations from the plan:**
  1. `sumCents` checks the running total after every addition (ruling R9). The plan's code
     checked only the final total, so `sumCents([MAX_SAFE_INTEGER, 2, -2])` returned a cent short
     without throwing — the opposite of plan D7. One regression test, hence 341 and 112 rather
     than the plan's 340 and 111.
  2. Hand-built test amounts changed so that none equals a seed amount (R10), in the Task 3 tests
     and in Task 2's `money.test.ts`; test titles that cited seed-figure ACs (US-05/07/08/28 AC1)
     over hand-built data now name the rule (R11).
  3. `toCents`'s doc comment kept its T-02 wording, which the plan's transcription had dropped —
     the owner asked for an unchanged move (R8).
  4. The code commit `e3eca6a` precedes the spec commit `9c5e8c5`, so `e3eca6a` alone has one red
     test (R12).
  5. Owner answer 1 asked for a new `Date.now()` fixture; T-01's `domain-uses-date-now` and
     `server-uses-date-now` were re-run instead of adding a third (disclosed with plan v0.2).
  6. The implementers' commits carry their own attribution, "Co-Authored-By: Claude Sonnet 5"
     (R7).
- **Final review:** "With fixes" — no Critical or Important; six Minor items fixed before merge:
  the backlog's T-09 row gave two contradicting `BigInt` instructions (T-02's "at the DTO edge"
  vs T-03's "first"; now one: at the repository edge, before `overviewSummary`); `seedFigures()`
  rows keep data.json's avatar path, hex theme and display category, which the JSDoc did not say
  and T-09/T-10 must map; the v1.8 changelog overclaimed; a stale T-04 clause; "every run" for
  coverage-only errors; two `seed-figures` test titles claimed more than they checked (one now
  asserts that another day gives other bills). Re-review: all addressed.
- **Copilot review (PR #8):** four comments — `recurringBills` copied each vendor's list on
  every push (O(k²), "Medium"); `formatDate("")`'s message had an empty operand; the sort
  test's title said "ignoring case"; `0` and `-0` shared one test title. All four were minors the
  task reviews had deferred as "can wait". The owner chose, verbatim, "Dördünü bu PR-da düzəlt"
  ("fix all four in this PR"): commit `cc2882b` (string inputs quoted in the error, the dates
  test asserting the quoted message, `-0` in its own test; Vitest still 341/341); read-only
  review approved, with two Minor notes left open — `toThrow(string)` checks containment, and
  no test pins the invalid-`Date` wording.
- **What the agent got right:** the generator reproduced every value of §4.3 on its first run,
  and the Task 5 checkpoint differed from the spec only in the predicted `$` style; every
  *measured* Expected held at execution (Task 1: 5 failed | 34 → 3 failed | 47 → 50/50, the two
  ESLint errors at 21:34 and 24:25); the plan's predictions API 17/17 and E2E 3/3 held; the
  pasted plan-gate reply was confirmed with the owner before it was acted on; the API baseline
  was measured before the first change to `src/server/seed.ts`, so a failure would have been
  attributable.
- **What the agent got wrong or missed:**
  1. Two guarantees the plan stated were broken by the plan's own code: D7's "fails loudly
     instead of summing to a wrong figure" (`sumCents` checked only the final total), and D12's
     "hand-built amounts never equal a seed amount" (nine test values did: eight in Task 3's
     tests, one in Task 2's). The prototype's 20
     mutations and 100 % coverage tested what the code did, not what the plan promised.
  2. The controller's first seed-amount check (`seed-amounts.mjs`) read only `$`-prefixed
     figures and missed §4.3's bare "40.00"; the Task 3 implementer found it.
  3. Transcription slips in the plan: `toCents`'s comment (R8); Task 1 Step 9's replacement range
     started one clause late (the implementer anchored it correctly).
  4. The planned backlog v1.8 text contradicted T-02's T-09 hand-off, overclaimed in its
     changelog and left a stale T-04 clause; test titles claimed seed ACs, database order and
     clock dependence they did not check — all caught by reviews.
  5. `seedFigures()` rows are not shaped like the database's rows (avatar path, hex theme,
     display category); T-09 and T-10 have to map them.
  6. Report defects, left unedited in the copies: the Task 1 report's test-count breakdown is
     wrong (the true split is 11 Clock tests + 4 boundary cases = 15; the totals it reports are
     right) and some of its Step 10 output is paraphrased; the Task 4 report trims output to
     "relevant lines".
- **Owner changes and reasoning:** at the plan gate the owner took every recommendation, with
  conditions: T-02's text dates were a side effect of the wide lint rule, not a goal, and
  ADR-0005 says so in one line; boundary tests for the formatters (0, negative, 1 cent,
  December, September); "Sep" from a fixed table rather than `Intl`; `$15.00` in §4.3; the PR
  lists its three document changes separately; F2 stays in T-13; T-05's plan separates system
  time from the business Clock. _(owner: the rest)_
- **Disagreements:** none.
- **Lessons for the process:** a guarantee a plan states (a "never", a "fails loudly") needs its
  own check at plan time; a prototype's tests and mutations probe what its code does, not what
  its prose promises. "Generated, never typed" held — the generator, not a reviewer, fixed
  §4.3's style slip. A lint rule too wide makes the code it protects unwritable, too narrow
  passes in silence; both edges now have fixtures.
- **Next:** owner review and merge of draft PR #8. CI passed on `b5fc370` (run 35776926119: lint
  · typecheck · unit, API tests (Postgres), npm audit, secret scan), which also verified the
  plan's last prediction — tsx running `npm run seed:figures` inside CI's Vitest. T-04 (schemas, enums, copy,
  test ids); once the category and theme maps live in `src/shared`, `seedOverviewInput` could emit
  database-shaped rows. Hand-offs sit in the backlog rows: T-05 (system time apart from the
  business `Clock`), T-08, T-09, T-10, T-13. Release 2: US-27 AC2's "day-of-month ≤ today + 5"
  has no month-end case — from the 27th every unpaid bill reads Due Soon; add tests for the
  "most recent" pick and "paid by any transaction". For the owner to route (final review,
  unverified): `boundaries/include` does not cover `prisma/**`, so `scripts` → `prisma/seed.ts` →
  `src/server` is an unguarded path; `toCents`'s 1e-6 tolerance may refuse valid amounts above
  about $85.9 million, which matters only if a later task reuses it for input.

## 2026-09-23 — Phase 5: T-04 shared schemas, enums, copy and test ids

- **Phase:** 5 — Build the slice (Release 1)
- **Participants:** Owner / Agent (Claude Code: Opus 5.5 wrote the plan, Sonnet 5 controlled the
  execution; subagents below)
- **Trigger:** backlog T-04, after T-03 merged (PR #8); ran in parallel with a separate small
  docs fix (F1, below).
- **Prompt(s):** `prompts/2026-09-23-T-04.md`; plan `plans/2026-09-23-T-04.md` (v0.2);
  execution record `prompts/2026-09-23-T-04/`
- **Produced:** `src/shared/enums.ts` (`CATEGORIES`, `THEMES`, `RESET_REASONS`, the data-model.md
  spellings, mirror-tested against the document, the seed's maps and `tokens.css`); `copy.ts`
  (`COPY`, `retryAfterMinutes`, mirror-tested row by row against the user-stories appendix);
  `schemas.ts` (`LoginSchema`, `SignupSchema`, `ErrorEnvelopeSchema`, `OverviewDtoSchema`,
  `MetaDtoSchema`); `tool-schema.ts` (`toolInputJsonSchema`, plan finding F1 — throws when a
  Zod-to-JSON-Schema conversion comes back empty or any string lacks `maxLength`); `test-ids.ts`
  (an empty, typed registry) and an ADR-0003 ESLint rule that keeps every `data-testid` in it;
  `src/server/http.ts`'s `ApiErrorCode` bound to the shared envelope's own type; `zod` 4.6.5 as a
  dependency. Documents: `docs/01-requirements/user-stories.md` v1.2 (three appendix rows, the
  banner's `{days}` parameter), `docs/03-specs/app-shell.md` v1.1 (§2.6 reads the configured
  interval), `docs/03-specs/auth.md` v1.0.1 (finding F2 — §6's 401/429 bodies carry `message`),
  `docs/03-specs/backlog.md` v1.9 (T-04 hand-offs in ten later rows); a separate PR (#9, merged)
  amending ADR-0004 and `docs/03-specs/webmcp-tools.md` to v1.0.2 (finding F1 — `z.toJSONSchema`,
  not `zod-to-json-schema`, which returns an empty schema for a Zod 4 object with no error).
  Tests: Vitest 341 → **447** (106 new — 429 through Task 7, one net test from the final review's
  fix wave, six from the Copilot fail-closed fix, ten from the 400-body redesign, one from the
  login/signup security split, below), API
  17/17, E2E 3/3, `src/domain` + `src/shared` coverage 100 %,
  `npm audit` 0, secret scan clean.
- **Execution:** subagent-driven, one Haiku implementer per task (every task's plan text gave
  complete, verbatim code, so the work was transcription plus testing) and one Sonnet reviewer
  per task, plus one fix round (Task 5). F1 ran as a separate Haiku subagent in its own worktree,
  dispatched and merged in parallel with T-04's own tasks rather than as one of them, per the
  owner's instruction. The controller wrote the prompt record, the session-folder review files
  and Task 7's document edits directly (the process record needs this session's own context,
  which a fresh subagent would not have); every other task ran the full dispatch → report →
  review cycle. The final whole-branch review ran on Opus (per the skill's model guidance for
  architecture-level review) and returned "With fixes": one Important finding (the D17
  misreading, below) and several Minor/routed items. One fix-wave dispatch (Sonnet), one scoped
  re-review, both clean. Ledger in `prompts/2026-09-23-T-04/progress.md`.
- **What the agent got right:** the plan's every code block was cut from a prototype that was
  itself built and gated task-by-task before being spliced in, then the whole plan was replayed
  in order on a second clean copy — every task's predicted test count held exactly through Task
  4, and Task 5's and 6's counts, once corrected for Task 5's own fix round, held too. 32
  mutations against the new code were all killed. The owner's plan-gate reply was pasted text
  with no words of its own; the agent asked how much of it to act on and surfaced two
  under-specified points (the test-id rule's exact shape, where F1's check should live) as
  structured questions rather than guessing either.
- **What the agent got wrong or missed:**
  1. The Task 5 task review misread decision D17's table row: `docs/04-process/plans/2026-09-23-T-04.md`
     line 231 has four columns (`# | Decision | Why | Alternative rejected`), and "`z.uuid()`
     exempt from `maxLength`" sits in the fourth, **"Alternative rejected"**, column — the plan
     rejected that exemption, and its Decision column names none. The task review read the quoted
     sentence in isolation and concluded the plan wanted the exemption; a fix round then added it
     to `toolInputJsonSchema`, contradicting SPEC-webmcp-tools §2.4 ("any string property lacks
     `maxLength`"), ADR-0004, and this branch's own T-15 hand-off row ("ids with `.max(36)` for
     `toolInputJsonSchema`"). The final whole-branch review (a fresh, more careful pass) caught
     it, cross-checked all three sources, and a fix wave reverted the exemption. The same review
     found a real gap in the same fix round, correctly fixed: the type-array check also missed
     `.nullable()`/union-typed strings (`z.toJSONSchema` writes `type: ["string","null"]`, not the
     bare string `"string"`) — that part of the fix round stands.
  2. This worktree had never had `npm ci`/`postinstall` run before Task 1's `npm install zod` —
     the Prisma client `postinstall` generates had never been produced, so 2 pre-existing test
     files failed to collect and Task 1's count read 331 instead of 348. Not a code defect; the
     controller ran `npx prisma generate` once and it did not recur.
  3. The controller's own dispatch to Task 6 mis-added the plan's numbers (said "+5 new tests"
     when the design is "+7"), so Task 6's actual 429 looked like a 2-test overshoot against a
     427 the controller itself had miscalculated — traced and explained before review, not a
     defect anywhere in the plan or the code.
  4. The plan's `src/shared/README.md` diff (Task 7) did not mention `tool-schema.ts`, added
     late in v0.2 revision 5 — a one-line README gap, fixed while applying the diff.
- **Copilot review (PR #10):** three comments — `unboundedStrings` doesn't recurse into
  `anyOf`/`oneOf`/`allOf`/`$ref`/tuples/records ("Medium"; the same gap the final review had
  already named and deferred to T-11); the `getByTestId` ESLint selector "looks malformed"
  ("Medium" — checked directly: `page.getByTestId("donut")` is caught, a template literal and an
  identifier are not, exactly as intended; a false positive from Copilot, not fixed); SPEC-auth
  §6's 400 example still lacks `message` ("Low"; the same item the final review had already
  routed to the owner). The owner chose to fix the first in this PR via a subagent, leave the
  second (verified false), and hold the third (still awaiting a decision on the message text):
  commit `16dfe06` (fail-closed on the five shapes, six new tests, 430 → 436); reviewed, Approved,
  no findings. The owner then answered the third, verbatim: "400 body is { error: 'validation',
  issues: [{ path, code }] } — no message field, no Zod default strings, no echoed values;
  codes: required, invalid_format, too_short, too_long. Client maps path+code to the copy
  appendix, same as 401/429 map error to banner text" — with the reasoning line "API carries
  codes only; copy lives in the client — consistent with 401/429, avoids leaking input or
  duplicating UI text." This is a real design decision, not documentation: `message` on
  `ErrorEnvelopeSchema` became optional; `ErrorIssueSchema` narrowed from a loose Zod-issue
  passthrough (`code`, `path`, `message`, plus whatever Zod added) to a strict `{ path, code }`
  with `code` one of the four named values; `toErrorIssues` now maps every Zod issue
  `LoginSchema`/`SignupSchema` can produce to one of them (measured against the real schemas
  first — `invalid_type`→required, `too_small` with `minimum:1`→required else →too_short,
  `too_big`→too_long, `invalid_format`→invalid_format — and throws on anything unmapped rather
  than mis-report). SPEC-auth → v1.0.2; `backlog.md` → v1.10 (T-05's hand-off had the stale
  `{ error, message, issues }` shape from before this decision — corrected). 10 new/rewritten
  tests; 7 mutations against the mapping function, all killed. Vitest 436 → 446; reviewed
  independently against real `LoginSchema`/`SignupSchema` output (not just the tests), Approved.
  The owner then raised a security point unprompted: distinct `path`/`code` values on a *login*
  failure are themselves an oracle — a caller can tell "wrong password" from "malformed email"
  from "this field is required" without ever guessing a real credential. Two clarifying
  questions (scope: login only, or login and signup too; status: 401 or 400 with the
  `invalid_credentials` code) got, verbatim, "Yalnız login (Recommended)" and "401, mesajla
  birgə (Recommended)". `POST /api/auth/login` now never sends 400 at all: any `LoginSchema`
  failure answers 401 `{ error: "invalid_credentials", message: "Email or password is incorrect"
  }`, identical to a genuinely wrong password — collapsing "malformed" and "wrong" into one
  response. `POST /api/auth/signup` is unaffected (no credential store to protect). No
  `src/shared/schemas.ts` code changed for this — `LoginSchema` and the `issues`/`code` machinery
  are unchanged and still used (by `SignupSchema` and by the client's on-page validation before a
  request is ever sent); this is purely which envelope a *route* chooses to send, and T-05 (out
  of scope here) is the first task with a route to choose it. The existing tests that used
  `LoginSchema` to exercise the generic mapper were switched to `SignupSchema`, the schema that
  actually ships this body, plus one new test locking in the 401 collapse and noting `LoginSchema`
  itself is still exercised (just never turned into a validation 400). SPEC-auth → v1.0.3;
  `backlog.md` → v1.11. Vitest 446 → 447.
- **Owner changes and reasoning:** at the plan gate the owner took every recommendation, with
  conditions: the enum schemas' lists must be the documents' *full* lists so T-09 can test its
  Prisma map against them; two new copy rows plus one reused row, short and unpunctuated like the
  existing ones; the rate-limit minutes keep SPEC-auth §4's formula and only pluralise, with
  `retryAfter`=30→"1 minute" and 90→"2 minutes" as explicit test cases; the reset banner takes
  `{days}` from `GET /api/meta`, never a literal 10; `ApiErrorCode` stays as a name, now bound to
  `z.infer` of the shared envelope, with `errorResponse`'s signature and body unchanged; SPEC-auth
  amended in the same PR for F2. Two points needed narrowing beyond the plan's own questions,
  answered through the structured question tool: the test-id rule is exactly two selectors (a
  JSX `data-testid` string and a `getByTestId` string argument), one violation and one control
  fixture per side, not the plan's earlier four-fixture design; F1's guard is a shared,
  reusable `src/shared` function (`toolInputJsonSchema`), not a bare test with no product code.
- **Disagreements:** none — the D17 misreading (above) was an agent-to-agent correction (a task
  review misread the plan; a later review corrected it against the plan's own text), not an
  owner/agent disagreement.
- **Lessons for the process:** a decision table's "Alternative rejected" column reads, in
  isolation, exactly like a statement of the decision itself — a reviewer quoting one cell out of
  its row lost the header that disambiguates it. The plan's own document-mirror pattern (D17's
  neighbours: hold every guarantee to a live check, not prose) applies to the plan's own table
  too; worth a line in the writing-plans skill: when a finding cites a decision, quote the whole
  row including its column headers, not just the cell. Separately, a worktree that has never run
  `npm ci` is a silent trap for the first task that only runs a scoped `npm install` — the
  postinstall step (`prisma generate`) still needs to run once, and nothing before Task 1's own
  gate surfaces its absence.
- **Next:** owner review and merge of draft PR (branch `task/T-04-shared`, opened after this
  entry). T-05 (auth API) is next per the backlog; its hand-off row already names what T-04
  leaves it: parse bodies with `LoginSchema`/`SignupSchema`, the exact 401/429 `message` text,
  `retryAfterMinutes` for the banner. Recorded, not yet exercised by any test: `toolInputJsonSchema`
  fails open on five JSON Schema shapes its walker does not descend into — `anyOf`/`oneOf`/`allOf`
  (so a `.nullable()` **object** field, unlike a nullable string, hides whatever is inside it),
  `z.record`/`.catchall` (no fixed `properties` to walk), `z.tuple` (`prefixItems`, not `items`),
  and `.meta({ id })` (a `$ref` into `$defs`, never inlined). The final whole-branch review named
  all five and suggested failing closed instead — throwing on any keyword the walker does not
  recognise — rather than growing the allow-list case by case; worth doing before T-11's
  `defineTool` leans on the helper for a shape richer than a flat object. Also open for the
  owner: SPEC-auth §6's 400 body (`{ error: "validation", issues }`) still has no `message` text,
  though §2.10 requires one — F2's answer named only 401 and 429; T-05 needs one for 400 too.

## 2026-09-23 — Build (T-05): Auth API — plan, plan gate, inline implementation

- **Phase:** 5 (Build the slice), Release 1.
- **Participants:** Owner / Agent (Claude Code, Sonnet 5, background session).
- **Trigger:** owner: "Start to planing T-05" (2026-09-23, ~12:01 +04), continuing the backlog
  order after T-04's PR #10 merged.
- **Prompt(s):** `prompts/2026-09-23-T-05.md`.
- **Produced:** `docs/04-process/plans/2026-09-23-T-05.md` (v0.1 → v0.2 at the plan gate);
  `docs/03-specs/backlog.md` v1.13 (T-08 hand-off note); `docs/02-architecture/adr/0006-auth-and-session.md`
  amended 2026-09-23 (CSP nonce dropped as tech debt); on branch `task/T-05-auth`: `src/server/http.ts`
  (`validationErrorResponse`, `rateLimitedResponse`), `src/shared/next-path.ts`, `src/server/session.ts`,
  `src/server/rate-limit.ts`, `src/server/auth.ts`, `app/api/auth/{login,signup,logout,session}/route.ts`,
  `middleware.ts` (`app/page.tsx` deleted), CI/README env docs, plus fixes to `playwright.config.ts` and
  `tests/e2e/scaffold.spec.ts` the middleware's own behaviour required. 471 unit + 31 API + 3 E2E tests
  green (`npm run test:all`).
- **What the agent got right:** the plan's own self-review (Q4) caught, before any code was written,
  that `latestResetAt` had to land in T-05 rather than wait for T-08 as the backlog originally implied —
  T-05 needs it for the resetEpoch check and T-05 runs first. Task decomposition (session/rate-limit as
  pure-function-plus-DB-wrapper pairs) let the rate-limit boundary bug surface as a unit-test-level
  question rather than a mystery API failure. The plan's own Review Focus list named the sliding-reissue
  boundary, the rate-limit boundary and the two-shape error envelope in advance; all three had a task
  whose test exercised them directly, per the plan's self-review section.
- **What the agent got wrong or missed:** four real bugs, none caught by planning, all caught by actually
  running the API tests end to end rather than trusting the plan's code blocks:
  1. **Rate-limit off-by-one.** `evaluateAttempts` used `<=` against the 10-failure threshold; since
     `checkRateLimit` passes the count of *prior* failures (the current attempt not yet recorded), `<=`
     let an 11th failed attempt through as 401 instead of blocking it with 429. Task 5's own unit tests
     were written with the same wrong assumption baked into their names ("allows the 10th failure") and
     passed anyway — they encoded the bug, not a check against it. Found only when Task 6's API test (the
     actual SPEC-auth §4 behaviour) failed. Fixed to `<`; the unit tests were renamed to state prior-failure
     counts, not attempt ordinals, so the same mistake can't hide the same way again.
  2. **Secure cookie over plain HTTP.** `sessionCookieHeader` gated the `Secure` attribute on
     `NODE_ENV === "production"` — but `next start` (both local dev and the Playwright/CI `webServer`) is
     production mode over plain HTTP. The cookie was set `Secure` and the browser/Playwright client
     silently never sent it back; `GET /api/auth/session` read `authenticated: false` immediately after a
     successful login, with no error anywhere in the chain. SPEC-auth's own wording — "Secure (except
     localhost)" — was the tell: it is about the request's protocol, not the build mode. Fixed by making
     `secure` a parameter, computed by each caller from `request.url.startsWith("https://")`.
  3. **`$` in a bcrypt hash mangled by Next's env loader.** `@next/env` runs `dotenv-expand` on every
     value it loads — including a plain OS environment variable, not only ones parsed from a `.env` file —
     and treats an unescaped `$` followed by a digit as expansion syntax. A raw bcrypt hash
     (`$2b$10$...`) was silently truncated; login with the *correct* password failed 401 with no error.
     Fixed by escaping every `$` as `\$` in `.env.local` and in the CI workflow's single-quoted YAML value
     (dotenv-expand un-escapes `\$` back to a literal `$`); documented in `README.md` and inline in
     `ci.yml` for whoever edits that value next.
  4. **`NextResponse.redirect()`'s default status is 307, not the 302 SPEC-auth names** at §2.8 and
     §2.10 — every redirect call needed an explicit second argument.
  5. **The middleware's own root redirect broke Playwright's `webServer` readiness probe.**
     `playwright.config.ts` polled `baseURL` (`/`) waiting for a 2xx response to know the server was up;
     once `/` always redirects (this task's own SPEC-auth §2.8 requirement), that probe never succeeded
     and every `test:api`/`test:e2e` run hung for the full 180-second timeout with no error until the very
     end — looked exactly like a hang, took real wall-clock time and a `pg_stat_activity` check (nothing
     there) plus manual `curl` against the same running server (which answered fine) to separate "the
     server is broken" from "Playwright's own check will never be satisfied by this response." Fixed by
     pointing the probe at `/api/auth/session` instead (public, always 200).
  6. A sixth, smaller miss: Task 2 changed `src/server/test-support.ts`'s 400 response shape but its own
     verification ran only the new test file plus `npm run test:api` (Playwright) — never the full
     `npm test` (Vitest) — and missed that `tests/unit/test-support.test.ts` (a separate file) still
     asserted the old `message`-based body. Not found until Task 9's full-suite run. Every task from Task 9
     onward ran the complete `npm test`, not a scoped file, before being marked done.
- **Owner changes and reasoning:** at the plan gate the owner took bcryptjs (Q1) and the Node.js
  middleware runtime (Q2) as recommended, approved `latestResetAt` landing in T-05 with the backlog
  hand-off note (Q4), and applied the timing-oracle mitigation as planned (Q5) without change. Q3 (the CSP
  nonce) needed two rounds: the owner first asked what CSP and a nonce actually are before deciding
  anything ("CSP - nədir? Bunu ilk öncə başa sal"), then, once no inline `<script>` is planned anywhere in
  R1, chose the simpler header with no nonce machinery — "Amma bu haqda techdept qeyd et" (but note it as
  tech debt). That became a 2026-09-23 amendment to ADR-0006 (`script-src 'self'`, no `'nonce-…'`) rather
  than a silent scope cut, so the ADR still says what the code does.
- **Disagreements:** none.
- **Lessons for the process:** (1) A plan's own unit tests can encode the same off-box-one the code has,
  because both were written by the same reasoning at the same time without ever running against the real
  boundary; the API test that exercises the spec's literal example ("10th → 401, 11th → 429") is the one
  that actually catches it, and unit tests for pure functions extracted from an API path are worth a
  second look against the *caller's* exact argument semantics, not just their own internal logic. (2) A
  cookie's `Secure` attribute keyed on `NODE_ENV` rather than the request's actual protocol is wrong for
  any local-dev/CI setup that runs a production build over plain HTTP — worth a standing note wherever a
  future task sets a cookie. (3) Any secret or hash value that contains `$` and needs to reach a Next.js
  app via environment (not just `.env.local` — any OS-level env var Next reads) needs escaping; this is
  now documented in README and `ci.yml`, but the underlying `@next/env`/`dotenv-expand` behaviour is worth
  a line in a shared doc (AGENTS.md or a new "gotchas" note) so the next task that adds a secret doesn't
  rediscover it the same way. (4) `executing-plans`' task-done command should run the *whole* relevant
  test command (`npm test`, not a single new file) from the first task, not only once a later task's
  full-suite run happens to surface a miss — worth tightening in the skill or in this project's own
  build-workflow.md.
- **Next:** owner review and merge of draft PR (branch `task/T-05-auth`). T-06 (Auth UI) is next; it
  needs `LoginForm`/`SignupForm` against these routes, and should import `sanitizeNextPath` from
  `src/shared/next-path.ts` for its own post-login navigation rather than duplicating the allow-list
  (already shared, per this task's Architecture section). Recorded, not yet exercised by any test: the
  `middleware` file convention printed a deprecation warning during every build in this task ("Please use
  'proxy' instead" — `npx @next/codemod@canary middleware-to-proxy`); harmless today, worth a follow-up
  task before Next.js actually removes the old convention.

### Addendum — whole-branch review and fix pass (same day)

A fresh subagent (Opus) reviewed the full diff, ran the suite, and — unusually — actually
exercised the running app (forged iron-session cookies, real Chromium/Firefox, a throwaway
scratch page) rather than reading the diff alone. Found 2 Critical, 4 Important, 11 Minor;
verified all six of the ledger's own fixes above and confirmed the timing-oracle mitigation,
rate-limit exactness and reset-epoch handling hold under live measurement. Fixed in this PR
(commits `77f981c`, `dd351c8`, `03ac7d4`, `09b8800`):

- **C1** — the `$`-escaping fix for `.env.local` was wrongly copied into `ci.yml` too:
  `@next/env`'s `dotenv-expand` only runs over values it *loads from a file*; a CI `env:`
  value with no `.env*` file present reaches the app raw, so the escaped hash broke every
  login there. Reverted to the raw hash in CI, corrected the README, and added a
  `demoPasswordHash()` accessor that throws on a misconfigured value instead of
  `bcrypt.compare` silently returning `false`.
- **I1** (SPEC-reset-and-test-support §2.6) — two real gaps: the `?reason=reset` redirect
  the spec asks for was missing (fixed), and the "cached per instance for 30 s" clause was
  implemented, found broken (Next.js bundles `middleware.ts` and route handlers separately —
  no shared module state, so the cache was never invalidated by a reset, silently
  undermining "sessions end on reset"), then removed and the spec amended (v1.2) to match.
- **I2** — SPEC-auth §7's own test list had real gaps against the plan's Review Focus items:
  each of attempts 1–10 now asserts 401 (not just the 11th's 429), the 15-minute stale-entry
  case is tested, the sliding re-issue and 7-day TTL are now API-tested with forged cookies,
  and the `next=` incoming-pass-through behaviour is documented with a test.
- **I3** — the 429 body's `message` was the full client banner text; spec and backlog both
  want the fixed `"Too many attempts"`.
- **I4** — not a code bug: the `no-store` test could only prove the header on a 404 (which
  Next answers `no-store` to an anonymous request too), so it never isolated this
  middleware's own header. Reworded honestly; a T-07 backlog hand-off (v1.14) carries the
  real version once a genuine authenticated page exists.
- **M3, M4, M5, M6** — the admin-secret exemption matched the whole `/api/admin/*` prefix
  instead of exactly `POST /api/admin/reset`; a comment clarified the `X-Forwarded-For`
  trust assumption; logout could send two `Set-Cookie` headers when the session was old
  enough to reissue (worked only by header-merge-order accident — login/logout now skip
  reissue); the matcher ran this middleware, DB query included, on every static asset
  request for a logged-in visitor.

**Declined to fix — surfaced to the owner instead: C2.** The shipped CSP (`script-src
'self'`, no nonce) blocks Next's own inline RSC-payload scripts and inline styles on *every*
App Router page — the reviewer verified this live (5 blocked scripts + 5 blocked styles in
two browsers' consoles; a client button's `onClick` proven dead in a scratch page). This
rests on a premise the owner was given at the plan gate ("Next.js apps normally have none")
that turned out to be false for the RSC payload specifically. Since this reverses information
the owner's Q3 decision was based on, and the real choice (a per-request nonce with dynamic
rendering, vs. Next's documented `'unsafe-inline'` fallback with weaker XSS protection) is a
security trade-off, the agent did not re-decide it alone — the corrected facts and both
options went back to the owner in the same turn the review landed.

`npm run test:all` green after the fix pass: 478 unit, 38 API, 3 E2E.

### Addendum 2 — C2 resolved: CSP nonce restored (same day)

The owner asked what CSP and a nonce actually do before deciding anything on C2 — answered
plainly (a nonce lets Next's own inline scripts run while still blocking an attacker's). Once
it was clear the "no inline script" premise was wrong (Next's RSC payload and inline styles
are inline on every server-rendered page, confirmed by the review) and that restoring the
nonce costs this app nothing worth trading (every session-aware page is already dynamically
rendered), the owner approved restoring it: "et. agentlər etsin" (do it, let agents do it).
`middleware.ts` now generates a fresh nonce per request, forwards it via `x-nonce` (Next
applies it automatically to its own inline scripts/styles), and sets both `script-src` and
`style-src` with `'nonce-<value>'`. ADR-0006 gets a new dated amendment (2026-09-23 (2))
superseding the earlier no-nonce one, kept for the record rather than deleted; backlog.md
(v1.15) hands T-06 the exact `headers()` read pattern. `npm run test:all` green again after:
478 unit, 39 API (one new test proving the nonce differs per request and matches across both
directives), 3 E2E.

---

## 2026-09-23 — Agent tooling: an OWASP whole-app security review skill

- **Phase:** 5 (Build the slice) — agent tooling, no product code or spec touched.
- **Participants:** Owner / Agent (Claude Code, Sonnet 5 then Opus 5.5, background session), with one read-only skill-reviewer subagent; Copilot PR review.
- **Prompt(s):** none saved separately; the whole request is the checklist plus the one line quoted under Trigger.
- **Trigger:** the owner pasted the OWASP Web Application Security Testing Cheat Sheet checklist (13 categories, 131 items) and asked, verbatim, "Buna əsasən skill yarat" (create a skill based on this).
- **Produced:** `.claude/skills/owasp-security-review/` — `SKILL.md` (ground rules, five statuses PASS / FAIL / BY DESIGN / N/A / NOT TESTED and how to choose between them, a six-step workflow, severity scale, repository notes, and a map from NFR-S1–S7 to checklist items), `references/checklist.md` (the 131 items exactly as the owner supplied them, with stable IDs such as `SESS-02`, plus "how to verify" hints marked as the skill's own guidance, not OWASP's), `references/report-template.md`. The skill lives in `.claude/skills/` rather than beside the Copilot `code-review` skill in `.github/skills/`, because Claude Code discovers skills only there.
- **Verified:** the item texts diffed against the owner's paste line by line (131/131 identical, per-category counts 14/8/6/16/13/5/32/4/5/5/8/11/4), again after Prettier; skill-creator's `quick_validate` passes; `prettier --check .claude/skills/ .github/skills/` clean. Claude Code lists the skill from the worktree. Not done: the skill-creator eval loop (test prompts with and without the skill, benchmark), and no real review run yet.
- **Independent review:** a read-only skill-reviewer subagent returned 11 findings; each was checked against the source (README, SPEC-auth §2.9/§2.10/§4/§5/§8, NFR-S6, ADR-0007, `app/api/test/[...path]/route.ts`) and all were applied. They include: the default target is a production build (`npm run build && npm start`), not `next dev`, as ADR-0003 already requires for E2E; an absent control is N/A, BY DESIGN or FAIL depending on whether the surface exists and whether a document accepts the absence; cipher enumeration against the deployed host is not passive and needs the owner's go-ahead; and hints written for server-side sessions misread this app's sealed cookies (SESS-10) and Next.js's own OPTIONS/HEAD handling (CONF-03).
- **What the agent got wrong:** two claims written from memory, not from the documents — that a brute-force test on the deployed host locks out every visitor (the limit is per IP, SPEC-auth §4; the real harm is writes landing in the one shared dataset and pushing toward a reset that ends every session), and that ADR-0007 documents TLS, HSTS and body limits (it names the host only).
- **For the owner:** where the skill lives (`.claude/skills/`), and that a review report is written outside the repository by default, because a committed report with open findings is a public disclosure — committing one is the owner's call.
- **Post-PR review (Copilot, PR #12):** two findings, and an overview note that this entry lacked template fields. (1) "The description points at a `security-review` skill that does not exist in the repo": the target is Claude Code's built-in `/security-review` command (the Claude Code commands docs list it as a built-in available through the Skill tool), so it exists, but not in the repository. The description now names it that way. (2) "Verbatim OWASP text without a licence notice": correct. The archived OWASP wiki's footer puts its content under CC BY-SA 4.0 (checked 2026-09-23), so `checklist.md` now carries attribution, the licence, the list of changes, and that the file is shared under the same licence. Checking the source for (2) showed that the pasted copy is not OWASP's exact wording: the checklist was last on the wiki in revision 236456 (2017-12-29; the live page is now a stub), and the copy matches it word for word in 102 of 131 items, rewording the other 29. The claim "OWASP text, verbatim" became "the owner-supplied copy's text, verbatim". (3) The missing fields (Phase, Participants, Prompt(s), Owner changes, Disagreements, Next) were added.
- **Owner changes and reasoning:** none to the content. The owner asked for the process-log conflict with PR #11 to be resolved ("pr-da konflik var"), which was done by merging `main` and keeping both entries in order, and for the reviews to be handled ("reviewlara bax").
- **Disagreements:** Copilot's finding (1) was right that the reference was unclear but wrong that the skill is missing. The fix is the clearer wording, not a new file.
- **Lesson:** a generic checklist's "how to test" hints needed changing in twelve rows once read against this repository's ADRs and specs. A second agent that reads those documents before approving is the cheap check. Separately, "verbatim" held against the paste but not against the original source, which only a check of the upstream revision could show. Cite the upstream revision, not the copy.
- **Next:** owner review and merge of PR #12. Then, optionally, a first real run of the skill against `main`, where the T-05 auth code now lives. The repository has no `LICENSE` file, which was not in this change's scope and is left to the owner.

---

## 2026-09-23 — Build (T-06 plan F1): 404 pages under the CSP

- **Phase:** 5 (Build the slice). A defect fix ahead of T-06, in its own PR. No spec or ADR changed; user-stories gains one copy row, pending the owner's approval.
- **Participants:** Owner (decision) / Agent (Claude Code, Opus 5.5): a subagent in its own git worktree, started by the T-06 session.
- **Trigger:** F1 from the T-06 plan gate, prepared by a separate subagent before T-06, owner decision 2026-09-23. `/_not-found` was prerendered at build time, so Next could not put ADR-0006's per-request CSP nonce on its inline scripts and `<style>`. Next's default not-found UI also used `style` attributes, which no nonce can allow (a nonce covers elements, not attributes). Every 404 therefore rendered unstyled with its client JavaScript blocked. That meant any unknown URL, and, for a logged-in user, every R1 app page until the tasks that build them.
- **Prompt(s):** `prompts/2026-09-23-F1-not-found-csp.md` (the brief, verbatim).
- **Produced:**
  - `tests/api/middleware.spec.ts`: two API tests, one for `/definitely-not-a-page` and one for `/overview` with a session. The second asserts the login succeeded and follows no redirects, because `/login` is itself a 404 until T-06 and would otherwise pass for the wrong page. Each asserts 404; every inline `<script>` and every `<style>` carries the response's own nonce; no `style="…"` attribute; a fresh nonce on a second request. At least one inline script must exist, so the test cannot pass by matching nothing.
  - `app/not-found.tsx` and `app/not-found.module.css`: `await connection()`, then a `<main>` with "404" as a `<p>` and `COPY.notFound` as the `<h1>`. Styled with tokens only, with no `style` prop and no `next/image`. A `metadata` export keeps Next's default tab title, "404: This page could not be found.".
  - user-stories v1.3: one "R1 additions" row, `| Any page | not found (404) | This page could not be found. |`, **pending owner approval**. The same commit adds `COPY.notFound` and updates the copy mirror test and its reworded-appendix fixture.
- **Evidence:**
  - RED (commit `a1bedd6`, observed on `main` at `79f5d24`, before the branch was rebased onto `1869065`): both new tests failed with 5 inline `<script>` and 1 `<style>` without the nonce, plus 4 `style` attributes (API run: 2 failed, 39 passed). GREEN after the fix: 41/41.
  - Route table: `○ /_not-found` before, `ƒ /_not-found` after. `prerender-manifest.json` routes: `/_global-error` and `/_not-found` before, `/_global-error` only after.
  - Chromium, via a throwaway script that was not committed, on `/definitely-not-a-page` and on a logged-in `/overview`, per page:
    - Before: 10 CSP violations (5 `script-src-elem`, 1 `style-src-elem`, 4 `style-src-attr`), 11 console errors, and 1 page error (React #412: the RSC payload never arrived).
    - After: 0 violations, 0 page errors, and 1 console error, which is the document's own 404 status.
  - Gates, rerun on the rebased branch: lint, format and typecheck clean; 485 unit tests, 41 API tests, 3 E2E tests (Chromium, Firefox, WebKit); `npm audit` 0. The rebased build shows the same route table, and the browser check gives the same counts.
- **What the agent got right:** it checked Next's installed source and ran a throwaway dynamic build before writing the fix. That confirmed both that `connection()` in `not-found.tsx` moves the route to ƒ and that the nonce then reaches the HTML. It also found the surprise below.
- **What the agent got wrong or missed:**
  - Its first attempt at the title rendered `<title>` in JSX, as Next's own default page does. In a per-request render the layout's metadata `<title>` streams first, so the tab read "Personal Finance". The browser check caught it, and a `metadata` export replaced it, leaving a single `<title>`.
  - It stopped its experiment server with `pkill -f "next start"`, which could have hit another session's server. Only its own was running; from then on it killed only the PID listening on 3107.
- **Surprises:**
  - **Next does not read `x-nonce`.** Next 16.3.5 takes the nonce from the *request's* `Content-Security-Policy` header (`parseRequestHeaders` in `next/dist/server/app-render/app-render.js`; the bundled `content-security-policy.md` says the same). `middleware.ts` sets the CSP only on the response, and forwards only `x-nonce`, which is there for app code to read through `headers()`. It works because Next's router also copies every middleware response header onto the request (`resolve-routes.js`: `resHeaders[key] = value; req.headers[key] = value;`). That behaviour is undocumented; the documented pattern sets the CSP on the forwarded request headers as well. The comment in `middleware.ts` and ADR-0006's 2026-09-23 (2) amendment both say Next reads the nonce from `x-nonce`, which is inaccurate. This is out of F1's scope (the brief said not to touch `middleware.ts`) and left for a separate small PR. Until then, the new API tests are the regression guard: if Next stops copying the header, they fail.
  - **`/_global-error` is not covered.** It is prerendered the same way (5 inline scripts, 1 `<style>`, 7 `style` attributes, no nonce), and this fix does not reach it. `global-error.tsx` must be a client component that renders its own `<html>` and `<body>`, so it cannot call `connection()`. A trial build with `connection()` in the root layout, reverted afterwards, still listed `/_global-error` as prerendered. It is left as a known limitation: it renders only when a page crashes and no nearer error boundary catches the error (there is no `error.tsx` yet).
- **Owner changes and reasoning:** none yet. The copy row and the PR await review. The row keeps Next's full stop, as the brief asked, while the owner had asked for T-04's additions to be short and without a full stop. Dropping the full stop is the owner's call.
- **Disagreements:** none.
- **Lessons for the process:**
  - A CSP-with-nonce review should read the build's route table: every ○ route is one Next could not nonce.
  - Claims about framework internals should be checked against the installed source (`node_modules/next/dist`), not against the comment next to the code. Here the comment named the wrong header, and the code worked for an undocumented reason.
- **Next:** owner review of the draft PR `fix/not-found-csp`, starting with the copy row. Then T-06. Candidates for separate small PRs:
  1. Set the CSP on the forwarded request headers in `middleware.ts`, and correct its comment and ADR-0006's wording.
  2. `/_global-error` under the CSP, if the owner wants it before Release 1 ships.

## 2026-09-23 — Build (T-06): Auth UI — plan, plan gate, inline implementation

- **Phase:** 5 — Build the slice (Release 1).
- **Participants:** Owner / Agent (Claude Code, Opus 5.5), with one subagent that prepared F1.
- **Trigger:** the owner's "T-06 start to prepare plan", right after T-05 (PR #11) merged.
- **Prompt(s):** `prompts/2026-09-23-T-06.md` (the owner's messages verbatim);
  `prompts/2026-09-23-F1-not-found-csp.md` (the F1 subagent's brief); `prompts/2026-09-23-T-06/`
  (the F1 review-fix brief, the whole-branch reviewer's brief and report, screenshots).
- **Produced:**
  - The plan, `plans/2026-09-23-T-06.md`, v0.1 → v0.4, and three docs PRs at the gate: #13
    (plan v0.2, SPEC-auth v1.0.4, design-tokens v1.1 with its `tokens.css` mirror, backlog v1.16,
    ADR-0003 clarification), #14 (plan v0.3), #16 (`docs/03-specs/tech-debt.md` with TD-1..TD-3,
    backlog v1.17, the ADR-0006 correction). F1 — the prerendered 404 under the CSP — as its own
    PR #15, prepared by the subagent.
  - On `task/T-06-auth-ui`: `tests/fixtures/e2e.ts` (automatic CSP-violation guard, reset, per-test
    API login, axe helper) with `tests/e2e/guards.spec.ts` proving both guards fire; one Playwright
    worker; the CI job `E2E (Chromium)`; `demoCredentials()`; the `(auth)` layout rendered per
    request; `src/ui` `Button`, `Field`, `PasswordField`, `LogoLarge`, eye icons;
    `src/shared/form-feedback.ts`; `LoginForm`, `DemoBox`, `SignupForm`; user-stories v1.4 (sign-up
    failure copy) with `COPY.signupFailed`/`signupUnreachable`; 11 + 4 + 7 + 11 E2E tests in
    `login`, `login-demo-and-reset`, `signup`, `auth-accessibility`; `tests/api/auth-pages.spec.ts`.
  - `npm run test:all` green: 521 unit, 43 API, 108 E2E (Chromium, Firefox, WebKit); `npm audit`
    0.
- **What the agent got right:**
  - The design export answered Q1 (a)/(b) and Q2 outright — every label and all seven layout
    values were in it — so two of four gate questions needed no owner decision.
  - The automatic E2E CSP guard earned its keep on its first real page: it caught Zod 4's JIT
    probing `new Function("")` on the first client-side parse. Zod catches the throw, but the
    browser still reports a CSP violation. Fixed with `z.config({ jitless: true })` in
    `src/shared/schemas.ts`, which Zod's own source documents for strict CSPs, and pinned by a
    unit test. No review of the code would have found this; only running it under the real policy
    did.
  - Review Focus pins were proved by reintroducing each defect: `noValidate` (on login — the
    sign-up pin was not, see the addendum, I2), `method="post"`, the `next` sanitiser, the
    notice's `tabIndex`, the two sign-up messages, the copy-failed state.
  - F2 was checked against Next's installed source before it went to the owner:
    `app-render.js:209-210` reads the request's CSP header, not `x-nonce`.
- **What the agent got wrong or missed:**
  1. **Pushed four commits to a branch whose PR had already merged.** Backlog v1.17, the ADR-0006
     correction and two plan updates went to `docs/T-06-plan-v0.3` after PR #14 merged, and never
     reached `main`. The owner asked "Hara qeyd etmisən?" ("Where did you record it?"). Recovered in
     PR #16, reworked to the owner's new instruction (tech debt in its own file), with correction
     comments on #14 and #15.
  2. **A hand-copied SVG path slipped.** The logo's `7.04` became `7.040`. The plan-writing session
     caught it by script and fixed it before execution.
  3. **The plan's Task 2 mutation expected the wrong result.** It said removing `connection()` from
     the `(auth)` layout would make `/signup` fail. It still passed: F1's `app/not-found.tsx` awaits
     `connection()`, and the App Router renders the root not-found into every route's RSC tree, so
     since F1 every route is dynamic. The execution proved both halves: with both calls removed,
     the routes are `○` and the test fails 2/2; with only the layout's call restored, they are `ƒ`
     and it passes. The layout's call stays, so the auth pages do not rely on the 404 page. The plan
     was written before F1 existed.
  4. **One planned test passed for the wrong reason.** Without `noValidate`, the "malformed email on
     submit" test still passed. Filling the password blurred the email, which showed our message,
     and the browser focused the field itself. The test was strengthened: fill the password first,
     then the email, then press Enter. Now it fails without `noValidate` and passes with it.
  5. **The plan did not foresee Zod's eval probe under the CSP** (see above).
  6. **The Q1 (c) recommendation was rejected.** It proposed reusing "Something went wrong. Try
     again" for every failed sign-up. The owner wanted that text for server errors only.
  7. **WebKit's Tab skips buttons and links.** The plan predicted this and wrote the fallback in
     advance. It was measured, not assumed.
- **Owner changes and reasoning:**
  - Q1 (a)/(b), Q2: "look at the design exports first; come back if they don't answer". They did.
  - Q1 (c): "500 xətası üçün Something went wrong. Try again olmalıdır. Səhv creadential və s
    hallarda uyğun mesaj", and "this message is given on a server error". That produced two
    appendix rows: a server error, and a network failure with its own words.
  - Q3/Q4: as recommended. The amendments went in a docs-only gate PR, because this session does
    not push to `main`.
  - F1: "T06 əvvəl ayrı subagent yarat o hazırlasın" — prepare it with a separate subagent, before
    T-06. Done as PR #15.
  - F2: tech debt, kept in the backlog, then "Tech dept ayrıca fayl olsun … Əlaqə itməsin deyə". It
    is now its own file (`tech-debt.md`), linked from the backlog. The two known items that had no
    home were moved into it as TD-2 and TD-3.
  - The go-ahead: "PR-lar merge oldu. bu suallarına təsdiq kimi qəbul olunur". The merges answered
    the remaining approvals: F1's copy row and the network wording.
- **Disagreements:** Copilot's review of PR #15 asked to redact absolute home paths in one verbatim
  prompt record. The agent declined: the same paths are in 20+ committed records, and the
  repository is private. It became a repository-wide T-16 note (backlog v1.17). The owner did not
  object.
- **Lessons for the process:**
  1. Before pushing to a branch, check its PR is still open (`gh pr view <n> --json state`). A merged
     PR's branch is a dead end that looks alive.
  2. A plan's mutation step states an expected result. Re-derive it when another PR lands between
     planning and execution (here F1 changed rendering for every route).
  3. Keep runtime guards. The CSP-violation fixture caught a library behaviour (Zod's eval probe)
     that neither the plan nor any review foresaw.
  4. A test that relies on blur and focus can pass for the wrong reason. Prove each pin by
     reintroducing its defect.
- **Next:** the whole-branch review (addendum below) and the draft PR for `task/T-06-auth-ui`.
  Then T-07, which now carries US-03 AC1–AC2's E2E (backlog v1.16).

### Addendum — whole-branch review and fix pass (same day)

A fresh reviewer (Opus) read the whole diff, re-ran every suite on its own port (521 unit, 43
API, 36 Chromium + 72 Firefox/WebKit E2E), and probed the running app with throwaway scripts.
Verdict "With fixes": 0 Critical, 2 Important, 4 Minor. It agreed with all five executor
rulings, including the Zod `jitless` one (checked in Zod's source). Brief and report:
`prompts/2026-09-23-T-06/final-review-{brief,report}.md`.

- **I1 — fixed.** Anything typed or autofilled before the page hydrated was wiped. Both forms held
  their values in React state starting at `""`, and the first re-render after hydration wrote that
  `""` back into the inputs. The user then saw "Can't be empty" under fields they had filled. This
  is the same pre-hydration window as plan D5, which made it safe (no credentials in the URL) but
  not usable. Fix: `Field` is uncontrolled, and the forms read the values from the DOM on blur and
  submit. That also keeps autofill that fires no events. **Plan deviation:** the reviewer offered a
  mount-time state sync as an alternative; the uncontrolled inputs were chosen instead. Two E2E
  tests hold every script chunk, fill the form, then release the chunks: they failed on the old
  code and pass now.
- **I2 — fixed.** The sign-up `noValidate` pin had never been proved; the plan had no mutation step
  for it. The test passed without `noValidate` for the same reason the login test once did. It now
  fills name and password first, then the email, then presses Enter. It fails without `noValidate`
  and passes with it. The "What the agent got right" line above is corrected.
- **Deferred minors (for the owner):**
  - M1: on Chromium, the two "submit focused after a 429/network error" assertions pass without the
    focus call, because a clicked, disabled button keeps focus. WebKit pins them locally.
  - M2: the login walkthrough's comment says "Shift+Tab back", but the test focuses the field
    programmatically.
  - M3: `/login` and `/signup` share the `<title>` "Personal Finance" (WCAG 2.4.2). Page titles are
    new copy, so they are the owner's call or T-07's.
  - M4: `z.config({ jitless: true })` is a side effect of importing `schemas.ts`.
- `npm run test:all` after the fix pass: 521 unit, 43 API, 114 E2E; `npm audit` 0.
- **Lesson:** the executor had already met this exact wrong-reason pass on login and fixed it. It
  did not carry the check to the sibling form. When a test is found passing for the wrong reason,
  search for the same shape in every sibling test before moving on.

### Addendum 2 — owner decisions on the minors, and PR #17's Copilot review (same day)

On the draft PR, ~17:58 +04, verbatim: "M3 üçün. Bütün səhifələr üçün title qaydası. Personal
Finance - page name. Misal: Personal Finance - Sign in. M1 və M4 tech dept əlavə olunsun." ("For
M3: a title rule for all pages. Personal Finance - page name. Example: Personal Finance - Sign in.
Add M1 and M4 as tech debt.") And: "iki review var onlarada bax" ("there are two reviews, look at
them too").

- **M3 → a rule for every page.** Every document title is "Personal Finance - <page name>"
  (SPEC-app-shell v1.2 §2.5, SPEC-auth v1.0.5 §6). The root layout holds the template, and each page
  sets its name. The agent read "page name" as the page's `<h1>`, so `/login` is "Personal Finance -
  Login", `/signup` is "Personal Finance - Sign Up", and the 404 page is "Personal Finance - This
  page could not be found.". The owner's example said "Sign in"; the login page is named "Login" in
  SPEC-auth §2.1. **This reading was put to the owner.** An E2E test pins all three titles; it failed
  first. T-07 and T-10 carry the rule for their own pages (backlog v1.18).
- **M1, M4 → TD-4, TD-5** in `tech-debt.md` (v1.1), each named in the row of the task expected to
  pick it up: T-13 and T-11 (backlog v1.18). M2 (a comment) stays deferred.
- **Reviews.** PR #17 had one review on GitHub, from Copilot, with one finding: the WebKit comment
  said "Option+Tab" while the code sends Playwright's "Alt+Tab". It was fixed by naming the key both
  ways. The second review the owner referred to is taken to be the Opus whole-branch review above.
- `npm run test:all`: 521 unit, 43 API, 117 E2E.

## 2026-09-23 — Build (T-07): App shell part 1 — plan, plan gate, subagent-driven implementation

- **Phase:** 5 — Build the slice (Release 1).
- **Participants:** Owner / Agent (Claude Code): Opus 5.5 wrote the plan; the execution was
  subagent-driven — a controller session and, per task, one Sonnet 5 implementer and one Sonnet 5
  reviewer (plus a fix round where a reviewer confirmed a finding). The whole-branch review and the
  draft PR are the controller's and are added below when they exist.
- **Trigger:** the owner's "Start to planing T-07. main branch updated" (~18:09 +04), then, at the
  go-ahead (~19:06 +04), "`/superpowers:subagent-driven-development` istifadə edərək T-07 icrasına
  başla" ("start T-07's execution using subagent-driven-development").
- **Prompt(s):** `prompts/2026-09-23-T-07.md` (the owner's messages verbatim);
  `prompts/2026-09-23-T-07/screenshots/`.
- **Produced:**
  - The plan, `plans/2026-09-23-T-07.md`, v0.1 → v0.3, and one docs-only gate PR (#18): SPEC-auth
    v1.0.6, ADR-0006's dated amendment, SPEC-app-shell v1.3, design-tokens v1.2 (the "App shell"
    table, 35 tokens) with its `tokens.css` mirror, backlog v1.19, tech-debt v1.2.
  - On `task/T-07-app-shell`, seven tasks:
    - Task 1: Testing Library (component tests, first use), the navigation icons and `SignOutIcon`,
      `LogoSmall`, `nav.ts`, `cx.ts`, `NavItem`.
    - Task 2: `logout.ts`, `LogoutButton`, the middleware's same-origin `/login?reason=logout`
      fallback, and TD-1 (the CSP on the forwarded request headers) in the same middleware change.
    - Task 3: `Sidebar` and `sidebar-state.ts` (US-35).
    - Task 4: `Shell`, `BottomNav`, `PageHeader`, `OriginTrialMeta`, the `(app)` layout with
      `connection()`, the four Release 2 pages and the heading-only Overview,
      `tests/fixtures/csp.ts`, `tests/api/app-pages.spec.ts`.
    - Task 5: `session-recheck.ts` (the back/forward-cache re-check) and `logout.spec.ts`
      (US-03 AC1–AC2).
    - Task 6: `tabTo` in the E2E fixtures, `app-shell.spec.ts` (22 tests) and
      `app-shell-keyboard.spec.ts` (4 walkthroughs) — 26 tests in the two files.
    - Task 7: the layer READMEs, TD-1 marked Closed, this entry, the prompt record and seven
      screenshots (Overview and Transactions at 1440, 768 and 375 px; Transactions minimised at
      1440 px).
  - `npm run test:all` green at the end of Task 7: secrets scan (225 commits, no leaks), lint,
    format, typecheck, 576 unit (42 files), 56 API, 216 E2E (72 on each of Chromium, Firefox and
    WebKit). Before T-07 it was 521 unit, 43 API, 117 E2E. `npm audit --audit-level=high`: 0
    vulnerabilities.
- **What the agent got right:**
  - Four of the five Review Focus pins were proved by reintroducing the defect, and each mutation
    bit as intended (the fifth is the first item under "wrong", below):
    - Focus 1 (Back after logout): `router.push` in place of `window.location.assign` made
      "back navigation after logout does not reveal the app page" fail — after `goBack()` the
      page showed `/budgets` from the router's memory.
    - Focus 2 (a failed logout must still log out): `authenticated && !logoutFallback` changed
      back to `authenticated` made the same-origin test fail (`Expected: 200, Received: 302`).
    - Focus 3 (`no-store` as Next's default): deleting the middleware's `no-store` line failed
      exactly the T-05 hand-off test (`Received: "private, no-cache, no-store, max-age=0,
      must-revalidate"`), and no other.
    - Focus 5 (focus ring on the current item): deleting `.active:focus-visible` failed the
      desktop walkthrough at the Budgets stop (`outline-color` `rgb(255, 255, 255)`, not
      `rgb(32, 31, 36)`).
  - Task 4's implementer bisected the Focus 4 result to its cause instead of accepting a green
    run.
  - The exact `toEqual` boxes (300 × 900 sidebar; 74 px and 52 px bars) and the computed colours
    passed unchanged on all three engines.
- **What the agent got wrong or missed:**
  1. **Focus 4's mutation did not bite on the layout alone.** Deleting `await connection()` from
     `app/(app)/layout.tsx` left all seven `app-pages` tests green, and the build's route table
     still showed `ƒ` for all five pages. The cause is `app/not-found.tsx` (T-06 F1), which also
     calls `connection()`; in Next 16.3.5 that alone makes every route in the tree dynamic. With
     `not-found.tsx` moved away and the layout intact, the five pages stayed `ƒ`; with it moved
     away and the layout's call removed, they became `○` and five tests failed on an inline
     `<script>` with no nonce. So `tests/api/app-pages.spec.ts` guards "at least one of the two
     `connection()` calls", and today the layout's is redundant: the mutation in Review Focus 4
     bites only with both removed. The layout's doc comment (ADR-0006, plan D4) says its call is
     what makes the pages per-request — true only when the not-found one is absent — so it
     overstates. The controller kept the call (SPEC-app-shell, ADR-0006 and D4 mandate it, and it
     stops the pages depending on `not-found.tsx`); rewording the comment, and a note at the top of
     `app-pages.spec.ts`, are deferred to the whole-branch review. The plan's Review Focus 4 was
     written without re-deriving what T-06's F1 did to rendering — the same lesson as T-06's
     lesson 2.
  2. **Which Back path each engine took (Task 5).** A temporary probe (a `pageshow` listener
     writing `persisted`, plus a log of document requests after `goBack()`; deleted before the
     commit) showed the same on Chromium, Firefox and WebKit: `pageshow` never fired, and the
     browser re-requested `/budgets` and then `/login`, ending at `/login?next=%2Fbudgets` (the
     middleware's redirect). Back took the reload path, not the back/forward cache. The bfcache
     branch of the re-check is covered only by synthetic `pageshow { persisted: true }` tests and
     by unit tests. **A manual check in real Chrome and Safari (Back after logout) was not
     done**; it is the only true confirmation of US-03 AC1's bfcache half.
  3. **Task 6's tests read values once.** The reviewer found `expect(await …)` on
     `boundingBox()`, `scrollWidth`, `sessionStorage` and three axe calls in `app-shell.spec.ts`,
     against the E2E rule "`expect.poll` where a value is read" (ADR-0003, the Definition of
     Done). The plan's own code had them, so the plan text lost to the binding rule. One fix round
     converted every one-shot read with the expected values unchanged (`4730dda`); the keyboard
     spec had none. The two files together — 26 tests (22 + 4) on each of three engines, 78 runs —
     passed afterwards.
  4. **Task 2's middleware mutation, and TD-1.** The mutation check on the middleware exception
     (Focus 2) was done as planned. TD-1 was fixed in the same middleware change, as the owner
     decided at the gate (Q1 (d)); the nonce API tests and the E2E CSP guard stayed green.
     `docs/03-specs/tech-debt.md` was left for Task 7, which marked TD-1 Closed.
  5. **Smaller deviations from the plan.** Task 1's Step 1 (`git switch -c`, copying a
     `.env.local`) was skipped: the worktree already sat on the task branch. In Task 3 the
     implementer wrote `Sidebar.tsx` in the same batch as its test, then moved it aside to see
     the RED failure. Task 5's E2E spec was written together with the implementation, so it has
     no separate RED run; Task 6's tests were green on the first run because the app already
     existed, and their mutation check is the proof they bite. Task 4's "7 tests" in the RED/GREEN
     step counted only the new ones. The plan's screenshot script waited only for `sessionStorage`,
     so the first "minimised" shot caught the sidebar at 285 px, mid-way through its 200 ms width
     transition; it was retaken after a 600 ms wait.
  6. **Deferred minors** (from the per-task reviews, for the whole-branch review to triage):
     generated icon files with over-long one-line doc comments; an untyped `next/link` mock;
     `LogoutButton` has no component test of its own; the logout-fallback test pins only
     `Max-Age=0`; `middleware.ts` cites Next internals by line number; the sidebar's
     `aria-label="Main"` is a literal (plan D7); the `sidebar-state` tests miss the
     `getItem`-throws path; the session-recheck tests lack the `persisted: true` plus
     authenticated no-leave case and a non-ok JSON case; `logout.spec`'s `toHaveLength(1)` console
     count could be `expect.poll`; the tablet hover test has no pre-hover colour check; the phone
     and skip-link focus rings are asserted as solid, not by colour; the OT-tag test title has no
     story id (the brief mandated it: there is no story) and `toHaveCount(0)` cannot prove its
     selector; the 1023/1024 px boundary is untested.
- **Environment:** `.env.local` was absent in the fresh worktree. Copying another worktree's file
  was denied by the harness, so a fresh local `.env.local` was generated with new random secrets
  (git-ignored, local database only). The screenshot script reads the demo credentials from the
  environment only, through `node --env-file`; it was a temporary file in the repository root,
  deleted after the run, because the harness refuses a heredoc fed to `node`.
- **Screenshots against the design export.** The prototype was not rendered side by side. Its
  markup gives a 300 px sidebar (88 px minimised) with a `0 16px 16px 0` radius, page padding of
  `32px 40px` on desktop and tablet and `24px 16px` on the phone; the screenshots are consistent
  with those (heading at x = 340 on desktop, 40 on tablet, 16 on the phone; a beige active pill
  with a green bar; labels in the tablet bar, icons only on the phone). Not compared: the
  prototype's bottom padding (92 px phone, 116 px tablet), hover colours, and anything the markup
  does not state. No value was tuned.
- **Owner changes and reasoning:**
  - At the gate, ~18:52 +04: "Q1–Q4 tövsiyyə olanları plana daxil et" — all four recommended
    answers: Q1 (a) with TD-1 fixed in the same change ((d) yes), Q2 (a) a heading-only Overview,
    Q3 (a) Phosphor "sign-out", Q4 nine tokens including the two durations. The owner did not
    understand the question about the gate-PR path; the agent explained it (the specs T-07 changes
    must be on `main` before the code that follows them), and at ~18:54 +04 the owner said "bəli,
    hazırla". The go-ahead named the execution method — subagent-driven — although the plan had
    recommended native execution.
  - During execution the ledger records no owner change.
- **Disagreements:** none recorded.
- **Lessons for the process:**
  1. A mutation step in a plan states an expected result; when an earlier task added a second way
     to reach the same outcome (`not-found.tsx`'s `connection()`), the step has to be re-derived,
     or it passes — or here, fails to fail — for a reason the plan did not name. The
     implementer's bisect is what caught it.
  2. When a plan's code conflicts with a binding constraint (here `expect.poll`), the constraint
     wins; the plan text was corrected in a fix round, not defended.
  3. Playwright's Chromium, Firefox and WebKit never exercised the real back/forward cache in this
     setup. A behaviour that exists only there needs a manual check in the real browser, or an
     honest note that it has none. This one has the note.
  4. A screenshot taken right after a state change captures the transition. Wait for the
     transition, not for the state.
- **Next:** the whole-branch review on the most capable model, its fixes, `npm run test:all`
  again, the push and the draft PR for `task/T-07-app-shell` (the controller's). The PR names
  the `docs/03-specs/tech-debt.md` change (TD-1 Closed), and a follow-up commit adds its number
  and date to TD-1's "Closed" line. Then T-08 (the reset banner and `getMeta` in the `(app)`
  layout).

### Addendum — 2026-09-23, whole-branch review

- **Verdict:** With fixes, 0 Critical (the most capable model reviewed `5b15220..e8b7926`). One
  fix wave, two commits: the code and tests, then this documentation.
- **I1 — the "Skip to content" focus ring was invisible on desktop.** `.skipLink` is
  `position: absolute` with no positioned ancestor, so it sits at 16 px / 16 px of the viewport —
  at 1024 px and up on the grey-900 sidebar, over the logo. The global `:focus-visible` ring is
  grey-900, so ring, sidebar and link box were the same colour. Measured in the production build
  before the fix: at 1440, 768 and 375 px the ring was `rgb(32, 31, 36)`, 2 px outside the box;
  only at 768 and 375 px did the link sit on the beige page, where it showed. The same defect
  class as Review Focus 5. The walkthrough had asserted only `outline-style` (in `tabTo`) and
  `toBeInViewport`, so "visible on focus" (SPEC-app-shell §2.8) was asserted nowhere. Fix: plan
  D10's rule for the skip link — `outline-color: var(--focus-ring-color-on-dark)` with the offset
  drawn inside the box — measured white at all three widths (an uncommitted scratch screenshot at 1440 px showed the
  ring). The desktop walkthrough now asserts the skip link's `outline-color` is white and its
  `clip-path` is `none`. Mutation: removing the rule failed the walkthrough (`outline-color`
  `rgb(32, 31, 36)`, not white); always-clipping the link (`.skipLink:not(:focus)` → `.skipLink`)
  failed it too, at `toBeInViewport` (ratio 0), which comes before the `clip-path` line.
- **I2 — the go-ahead quote.** It is the owner's own command message, verbatim
  "/superpowers:subagent-driven-development istifadə edərək T-07 icrasına başla", 2026-09-23
  ~19:06 +04, recorded in the SDD ledger. The quote here and in the prompt record is exact; no
  change.
- **M1** — the comments on `connection()` (the layout, the head of `tests/api/app-pages.spec.ts`,
  `app/(app)/README.md`) were reworded to what is true: `app/not-found.tsx`'s own call already
  makes every route dynamic in Next 16.3.5, the layout's call keeps the app pages per-request
  without depending on that file, and `app-pages.spec.ts` fails only when both are gone. The call
  stays (the deferred item under "wrong", 1, is done).
- **M2** — this entry's corrections: `app-shell.spec.ts` has 22 tests, not 26 (26 is the sum with
  the keyboard spec, verified with `npx playwright test --list`), the `connection()` decision is
  D4, not D1, and the prompt record's account of the branch (it first ran on `worktree-T-07-app-shell`, renamed to `task/T-07-app-shell`).
- **M3** — TD-1's "Closed" line needs the PR's number and date; the controller adds them once
  the PR exists.
- **M4** — a unit test pins the 10 s logout timeout (SPEC-auth §2.7): `AbortSignal.timeout` is
  called with `10_000`, asserted as the literal so the constant cannot drift with it. Changing the
  constant to 60 000 failed it. The "no answer" logout test is renamed for what it simulates (the
  request fails).
- **M5** — a unit test for `pageshow` with `persisted: true` while the session lives: `leave` is
  not called. It awaits the answer's body and one macrotask turn, no fixed sleep; making the
  re-check leave unconditionally failed it.
- **Deferred minors, triaged "may stay"** (the reviewer's numbering):
  - M6: TD-1 is closed by construction — no test isolates the forwarded-header line.
  - M7: the footer rows sit 4 px left of the navigation rows — compare with the design export.
  - M8: reduced motion is untested.
  - M9: `100vh` versus `100dvh` on mobile Safari.
  - M10: unused exports.
  - M11: `isLogoutFallback` does not check the request method (fixed below, after PR #19's Copilot review).
  - M12: small CSS duplication.
- **TD-6.** The owner pasted a `next dev` console log (~20:41 +04) full of CSP violations — React's
  eval check and Next's dev overlay — and asked ("Zəhmət olmasa TD-6 qeydini yarat.", ~20:44 +04)
  for a tech-debt entry. It is TD-6 in `docs/03-specs/tech-debt.md` v1.4, commit `b2da9de`, on
  this branch (TD-4 and TD-5 were added the same way on T-06's), to be named in the PR.
- **PR #19's Copilot review — four findings, one accepted.**
  - Accepted: `isLogoutFallback` keyed only on `Sec-Fetch-Site: same-origin`, so a same-origin
    `fetch()`, XHR or iframe to `/login?reason=logout` could clear the session in the background
    (the same gap as M11, the missing method check). The controller/agent ruled it valid: the
    spec text already said `GET`, and the design intent was a navigation. The middleware now also
    requires `GET`, `Sec-Fetch-Mode: navigate` and `Sec-Fetch-Dest: document`; an absent header
    keeps the redirect. SPEC-auth v1.0.7 and a dated note in ADR-0006 record it; API tests pin a
    `cors` fetch, an iframe, absent mode and dest headers, and a `POST`. Removing each guard in
    turn failed its test (method: the `POST` test; mode: the `fetch` test; dest: the iframe test).
  - Declined, three findings: "move `"Main"` / `"Log out"` into `COPY`". The navigation and
    logout labels stay spec text in the components — the owner's answer at T-06's plan gate, Q1
    (b), recorded in SPEC-auth v1.0.4's changelog, and plan D3; `copy.test.ts` mirrors the copy
    appendix row by row, and these labels are not rows of it.

## 2026-09-23 — Build (T-08): App shell part 2 — meta, reset banner, admin reset

- **Phase:** 5 — Build the slice (Release 1).
- **Participants:** Owner; Agent (Claude Code on the web — planned on Sonnet 5, executed on
  Opus 5.5 after the owner switched models, with an Opus 5.5 advisor reviewing the approach).
- **Trigger:** backlog T-08, after T-07 merged (PR #19).
- **Prompt(s):** `prompts/2026-09-23-T-08.md`.
- **Produced:**
  - Plan: `plans/2026-09-23-T-08.md`, v0.1–v0.5.
  - Server: `src/server/meta.ts`, `threshold.ts` and `admin-reset.ts`; `reset.ts` gains
    `latestReset`; `env.ts` gains six accessors.
  - Routes: `app/api/meta/route.ts` and `app/api/admin/reset/route.ts` (`GET` + `POST`).
  - Shared: `AdminResetSchema` in `src/shared/schemas.ts`.
  - UI: `src/ui/ResetBanner.tsx`, `banner-state.ts` and `icons/CloseCircleIcon.tsx`; `Shell`
    and the `(app)` layout are wired to meta.
  - `middleware.ts` forwards `x-request-id`.
  - `vercel.json` (the cron entry).
  - CI: the API and E2E jobs get placeholder `RESET_SECRET` and `CRON_SECRET` values.
  - SPEC-reset-and-test-support v1.3 (`GET` is the scheduled reset). SPEC-app-shell v1.4 (the
    banner's look, the `close-circle` icon). design-tokens v1.3 (the icon's source). All three
    are for the owner to approve with the PR.
  - Tests: 64 unit tests (642 in total), 19 API tests (79) and 3 E2E tests (75 on Chromium).
    The phone and desktop keyboard walkthroughs were modified to include the banner's tab
    stop; they were not added.
- **Plan gate:**
  - **Q1 (a).** Vercel's cron calls with a bodyless `GET`, so the route answers `GET` as the
    scheduled reset. This was verified against vercel.com once the owner allowed the domain;
    it was first answered from trained knowledge, and the plan said so.
  - **Q2 (d).** The dismiss button reuses the Claude Design prototype's modal close control.
    The owner's uploaded export had no banner design.
- **Verification:**
  - Not strict TDD everywhere. The unit tests, the `latestReset` tests and the `meta` tests
    had a real RED run. The admin-reset API tests and the E2E tests were written after the
    code they test, so they never had one. Mutations stood in for it, as T-07 recorded for
    its own tasks.
  - The mutations below were run and reverted. Each failed exactly the test named:
    - counting `LoginAttempt` in the threshold: the D3 test;
    - deleting `/api/meta`'s `no-store`: the header test. The "not cached" test still
      passed, because Next 16 does not cache `GET` handlers anyway; the header test is the
      real guard;
    - `latestReset` returning `new Date(0)`: the two "empty `ResetLog`" tests;
    - dropping the route's `GET`: the four `GET` tests, which got 405;
    - weakening both empty-secret guards: Review Focus 1's unit tests. With only
      `cronSecret` weakened, `sameSecret`'s own guard still held, and `env.test.ts` pins
      `cronSecret` separately;
    - removing the focus hand-off: the Enter-dismiss test;
    - keeping the dismissal in memory only: the reload step.
  - The `x-request-id` forwarding was checked **by hand**: a real `POST` answered with
    `x-request-id: 1b21a2f2-…`, and the server logged
    `reset reason=manual rows=59 requestId=1b21a2f2-…`. No automated test isolates the
    forwarding (the same situation as TD-1's M6).
- **What the agent got right:** the cron finding, first from memory, then confirmed against
  the live docs. Rendering the canvas-drawn prototype and logging into it instead of trusting
  an empty grep. Keeping the design export out of the repository.
- **What the agent got wrong or missed:**
  1. The v0.1 plan's code had tests that could not fail. The advisor caught them before any
     code was written:
     - an unset-`CRON_SECRET` HTTP test that the server's `.env.local` made impossible, plus a
       top-level `test.skip` that would have skipped the whole file;
     - a "not cached" test that slept 1.1 s on a wrong premise (`ResetLog.at` has millisecond
       precision, not second);
     - admin tests that asserted status codes but never the `ResetLog` row;
     - a mutation claim for D12 that no test backed.
  2. The plan missed that the shared `toErrorIssues` throws on the admin body's issue codes,
     which would have turned a bad `reason` into a 500.
  3. The plan's D8 (`setState` in an effect) would have failed ESLint's `react-hooks` v7.
  4. The plan missed that `.github/workflows/ci.yml` sets no `RESET_SECRET`, so every admin
     test would have failed in CI.
  5. The go-ahead was first logged as "~22:18 +04". The container's clock is UTC. Corrected.
- **Environment (differs from CI; the PR says so):**
  - Node 26.10.0 installed by hand.
  - Postgres 16.13 run locally (CI uses 18.6); there is no Docker daemon.
  - Chromium r1194 through a session-local Playwright config (Playwright 1.63 expects r1243).
  - Firefox and WebKit are not installed, so `npm run test:e2e` across three engines, and
    therefore `npm run test:all`, was not run.
  - Everything else ran: the secret scan (240 commits, after unshallowing the clone), lint,
    format, typecheck, unit, API, E2E on Chromium, and `npm audit`.
- **Owner changes and reasoning:** the owner supplied the design reference twice: the
  prototype, then the full export as a zip. They allowed `vercel.com` so Q1 could be checked,
  and answered "tövsiyə olunanlarla başla".
- **Disagreements:** none.
- **Lessons for the process:**
  1. A plan's test code needs the same adversarial reading as the product code: ask whether
     each test can fail at all.
  2. In a web session, the network allowlist and the missing Docker daemon decide what can be
     verified. Say that at the plan gate, not in the PR.
  3. Timestamps come from the clock that produced them. State the zone.
- **Next:** the owner answered "Bəli. Hamısı bir pr-da" ("Yes. All in one PR"). Backlog v1.20
  (the hand-offs to T-11, T-14, T-15 and T-16) rides in T-08's PR. Then comes the owner's
  review, with CI running Chromium E2E against Postgres 18.6. T-09 follows (the overview API).

### Addendum — 2026-09-23, the owner's review round on PR #20

- **Input:** ten findings pasted into the session, not posted as PR threads. The GitHub
  `claude` review job failed twice before doing any work, with a 403 from
  `api.individual.githubcopilot.com`; this is noted on the PR.
- **Fixed:** findings 1, 4, 5, 8, 9 and 10 (plan v0.8 has the list). Mutations run and
  reverted:
  - a case-sensitive `Bearer`, and a throwing `RESET_SECRET`: the unit tests failed;
  - a presence-only dismissal: the new "lasts only until the next reset" E2E test failed.

  The `??` form of `next.config.ts` is pinned by a violation fixture in
  `tests/unit/next-config.test.ts`.
- **Declined, with reasons (plan v0.8):** findings 3, 6 and 7.
- **Asked:** finding 2 (`*/10`), which ADR-0007 and SPEC §2.3 fix verbatim.
- **Wrong in the first pass:**
  - `isAuthorized` let a configuration fault in one secret disable the other secret.
  - The dismissal was a flag, although a reset ends the session it belonged to.
- **Environment:** the local Postgres had stopped while idle (no error in its log) and was
  restarted. The failing E2E tests' 500s came from that, not from the code.
- **Lesson:** next's `loadConfig` caches by path, so a test that loads one config under several
  environments must copy it to a fresh directory for each load.
- **Finding 2, decided and fixed:** the owner answered "Bu pr-da düzəlt. Tövsiyyə ilə davam et".
  - The cron is daily, and the route resets once `RESET_INTERVAL_DAYS` have passed, with one
    hour of slack. ADR-0007 has a dated amendment, and SPEC-reset-and-test-support is at v1.4.
  - Six unit tests pin the due arithmetic: the 10th day's early check, the 9th day's late
    check, the exact boundary, the interval, and a database with no reset.
  - The API tests backdate `ResetLog.at` for the due cases and add a not-due case (200 with
    `dueAt`, nothing reset).
  - Mutation: making the check never skip failed the not-due test. Reverted.

### Addendum — 2026-09-23, the owner's second review of PR #20

- **Input:** eight inline findings on `0dfb1d6`, posted by the owner (generated by Claude Code).
  Copilot's review of the same commit found none.
- **Outcome:** seven fixed, one kept as a recorded cost. Plan v0.10 lists each.
- **Mutations run and reverted.** Each failed its test:
  - logging on every request: the log-once test;
  - `GET` accepting either secret: the unit test and the "GET is the cron's alone" API test;
  - no `delete` of a client's `x-last-reset-at`: the forged-header API test;
  - removing `next.config`'s check: the violation fixture, where the typo reaches the client.
- **Wrong in the previous round:**
  - Declining the double read on the table's size, when the cost is the round-trip.
  - Handing the `WEBMCP_MODE` typo to T-11, when it breaks the banner today.
- **Lesson:** answer the cost a reviewer names, not a nearby one.


## 2026-09-24 — Phase 5: T-09 Overview server + API

- **Phase:** 5 (Build the slice), Release 1.
- **Participants:** Owner / Agent (Claude Code, on Claude Code's web/cloud environment).
- **Trigger:** the owner's message, verbatim: "T-09 planlamağa başla" ("Start planning T-09").
  This followed T-08's completion: PR #20 had merged, and the owner's last question about it
  (whether `CRON_SECRET` would be needed at T-14) had already been answered.
- **Prompt(s):** `prompts/2026-09-24-T-09.md`.
- **Produced:** `docs/04-process/plans/2026-09-24-T-09.md`; `src/server/overview.ts`
  (`labelMap`, `CATEGORY_LABEL`/`THEME_LABEL`, `categoryLabel`/`themeLabel`, the pure
  `toOverviewDto`, `getOverview(db, clock)`); `app/api/overview/route.ts`;
  `tests/unit/server/overview.test.ts` (13 tests); `tests/api/overview.spec.ts` (9 tests, one
  per seed variant plus 401, `no-store`, the "never seeded" 500); a comment fix in
  `tests/api/middleware.spec.ts`; the READMEs (`app/api`, `src/server`, `tests/unit`,
  `tests/api`), this entry.
- **What the agent got right:** the session branch had to be restarted from `origin/main`
  before planning, because GitHub deletes a merged PR's branch — caught by checking
  `git fetch origin main` before writing anything. The plan needed no owner questions:
  SPEC-overview §6 and the T-02/T-03/T-04 hand-offs already resolved every mapping decision
  (which layer converts `BigInt`, which layer maps enum spellings, that `budgetSpent`'s
  categories must agree) — governance.md leaves the rest to the agent.
- **What the agent got wrong or missed:** the advisor caught five defects in the plan's first
  draft before any code was written (full list in the plan's "Pre-execution review" section):
  1. Task 2's steps were written out of TDD order — the route created before the "see it fail"
     step that should have preceded it.
  2. `CATEGORY_LABEL`/`THEME_LABEL` were first designed as two hand-typed reverse tables,
     tested only with set comparisons — a swapped entry (`Green`↔`Navy`) would have passed
     every planned test, including the API test, which would have computed its own expected
     value through the same table. Fixed by building both maps from `src/shared/enums.ts`
     and validating each entry against the *live* generated Prisma enum at import time, so
     there is no second table left to swap.
  3. The `empty-all` seed variant was missing from the planned API test.
  4. Two claims in the draft were wrong: that a reset "would not affect an existing session
     cookie" (it does — `resetToSeed` bumps `ResetLog`, invalidating the session's
     `resetEpoch`), and a worked mutation number (mapping only budgets' categories drops
     `spent` to `$165.00`, not `$0.00`, since `Entertainment`/`Bills` have no space to mismatch
     on). Verified exactly at execution (below).
  5. The DoD checklist needed an explicit note that this task has no E2E/axe/screenshots line
     (T-10's UI carries those), so the PR does not read as skipping them.

  The corrected design also replaced `scripts/seed-figures.ts` (whose `import … with { type:
  "json" }` and `import.meta.main` are not proven to load under Playwright's test runner —
  no existing `tests/api` spec does) with an independent oracle built from `seedRows()` and
  `applyVariant()` directly, computed for all six variants against the domain's own
  `overviewSummary` — stronger than the original per-variant shape spot-checks.

  6. A second advisor pass, after Tasks 1–2 were committed, found the map-construction guard
     itself was only one-directional: it walked `CATEGORIES`/`THEMES` and checked each label
     against the generated Prisma enum, but never checked the *reverse* — a Prisma member with
     no matching label would have let the map build (as many entries as the label list has) and
     only thrown "Unmapped category" at request time, the exact risk the doc comment claimed
     was closed at import time. Verified both ways with the same real command: the committed
     one-directional file, restored from its own commit with `"Dining Out"` removed from
     `CATEGORIES`, built `CATEGORY_LABEL` at size 9 with no throw; the fixed file, same
     mutation, threw `"9 labels but 10 Prisma keys"` at import. `overview.ts`'s two maps are
     now built by one exported, directly-testable function, `labelMap(labels, prismaEnum)`,
     that also checks the two sides are the same size and that no two labels collide on one
     Prisma key — three checks that together make the map a true bijection, not just complete
     on one side. This exact bidirectional check was already in the *plan's own prose* at v0.1
     ("or the reverse … throws at import time") — the plan's Task 1 code block just did not
     implement what its own paragraph one line above it claimed; the first advisor pass had
     even suggested the reverse check by name ("checked so that each key of the Prisma `Theme`
     object maps to exactly one entry") and it was not carried into the code. Also caught: the
     plan's own execution — `toOverviewDto`'s `BudgetRow` generic constraint included `spent`,
     which is not part of the input `overviewSummary` takes (it computes `spent`); the type
     error surfaced immediately at `npm run typecheck` and the constraint was narrowed to
     match `OverviewSummary`'s own `B & { spent: number }` typing of its output items.
- **Mutations run and reverted, each caught by the test that should catch it:**
  - `categoryLabel()` removed from the transactions side only: `budgets.spent` dropped from
    `$338.00` to exactly `$165.00` (`Dining Out` and `Personal Care` lost their spelling match;
    `Entertainment`/`Bills` still matched by accident) — matching the advisor's corrected
    prediction exactly, caught by 4 of the 6 seed-variant API tests.
  - `toOverviewDto`'s transaction mapping spread `...transaction` instead of naming each
    field: the leaked `seq`/`category`/`recurring` failed the pure unit test immediately, no
    database needed.
  - The route's `Cache-Control: no-store` header removed: the exact-header API test failed
    (`undefined`, not even a framework default).
  - `"Dining Out"` removed from `src/shared/enums.ts`'s `CATEGORIES` (simulating a Prisma
    category no label covers): `CATEGORY_LABEL`'s construction threw `"9 labels but 10 Prisma
    keys"` the moment any module importing `overview.ts` loaded — the one-directional version
    (finding 6) would have let this through silently.

  Not run as a live mutation: a missing `BigInt`→`Number` conversion. `PotInput.total` and
  the rest are typed `number`; passing a raw `bigint` fails `tsc`/`next build` before any test
  runs, which is a stronger guarantee than a runtime 500 — the plan's Review Focus 2 predicted
  the weaker, runtime version and was not itself exercised.
- **Environment (differs from CI; noted for the PR):** Node 26.10.0 and the local Postgres 16
  process (`pg_ctl`, not a container — there is no Docker daemon in this environment) from the
  T-08 session were already running and were reused as is. This task adds no E2E test of its
  own, but the existing suite was run anyway, through T-08's session-local Playwright config
  (Chromium r1194 only, matching what this environment has): 76/76 passed, confirming nothing
  regressed. `npm test` (699), `npm run test:api` (91), lint, format, typecheck, `npm audit`
  (0) and the full-history secret scan all ran and passed.
- **Owner changes and reasoning:** none yet — awaiting review.
- **Disagreements:** none.
- **Lessons for the process:**
  1. A hand-typed reverse-lookup table is a table a swap can pass through unnoticed by every
     test that also builds its expected value from the same table. Building the table from an
     already-verified source list and validating it against the thing it must agree with (here,
     the generated Prisma enum) removes the table, and the risk, entirely.
  2. An "independent oracle" test is only independent if it does not import the module whose
     wiring is in question for the values it is checking, and does not rely on an unproven
     import path just because it looks convenient.
  3. "Checked against the live enum" is not the same claim as "checked in both directions" —
     a completeness check that only walks one side's own list can never notice what the other
     side has and it does not. This was not a blind spot of the first review: the plan's own
     v0.1 prose already claimed the reverse check, and the first advisor pass had asked for it
     by name — it simply was not carried from the sentence into the code block two lines
     below it. The lesson is to trace each claim a doc comment or a plan's prose makes to the
     specific line of code that would actually enforce it, not to trust that writing the claim
     down means it was implemented. A second advisor pass, run against the committed code
     instead of the plan, is what caught the gap here; the first pass reviewed the
     plan's design, not the executed code's actual guard.
- **Next:** T-10 (Overview UI) fills `app/(app)/overview/page.tsx`'s body from `getOverview`,
  per backlog v1.20.

### Addendum — 2026-09-24, a third advisor pass on the pushed fix

- **Input:** the fix for the one-directional guard (`0743ca7`) had already been pushed when the
  agent called the advisor once more before reporting done.
- **Found:** the fix's own commit message, and this entry's item 6 above, claimed a run that
  had not happened — "built `CATEGORY_LABEL` without complaint under the one-directional
  version" was reasoned from reading the restored old file, not from actually running it.
  Governance's "reported output is copied from the run, never from the brief" applies to a
  process-log entry's own claims as much as to a plan's.
- **Fixed:** both directions were run for real, against the same mutation
  (`"Dining Out"` removed from `CATEGORIES`): the one-directional file (`git show
  40585b3:src/server/overview.ts`, restored to disk) printed `CATEGORY_LABEL.size = 9` with no
  throw; the fixed file, same mutation, threw `"9 labels but 10 Prisma keys — the two enums
  have drifted"`. Both files were restored afterward (`git diff --stat` empty). This entry's
  item 6 and the plan's "Execution corrections" now quote that output instead of the reasoned
  claim.
- **Also found:** `tests/unit/server/overview.test.ts` had two assertions comparing
  `CATEGORY_LABEL`/`THEME_LABEL` against a regex-parsed reading of data-model.md — exactly what
  `tests/unit/shared/enums.test.ts` already checks, with its own violation fixture (DoD v1.1).
  Removed, with a one-line comment pointing to that file, so the redundancy does not read as
  covering DoD v1.1 for a check it never actually pinned with a fixture here.
- **Lesson:** a correction's own writeup needs the same discipline the thing it is correcting
  was held to. "I read the old code and reasoned it would pass" is not "I ran it and it passed"
  — say which one happened.

## 2026-09-24 — Process: governance.md v1.3, code review model

- **Phase:** 5 (Build the slice) — a process/governance change, not a task.
- **Participants:** Owner / Agent (Claude Code), in conversation while PR #21 (T-09) was open
  for review.
- **Trigger:** the owner, verbatim: "Növbəti sesiyalar üçün yadda saxla code review üçün model
  Opus 5.5 olmalıdır" ("Remember for future sessions: the model for code review must be Opus
  5.5"). The agent explained it has no cross-session memory file it can rely on being read by a
  future, freshly-provisioned session, and that a durable, project-scoped record is
  `governance.md` — the owner agreed: "governance əlavə edək" ("let's add it to governance").
- **Produced:** `docs/04-process/governance.md` v1.3 — a new Agent constraint: any subagent an
  agent dispatches to review a diff uses the Opus 5.5 model explicitly, with a note that this
  cannot reach the CI "Claude Code Review" GitHub App, since no workflow file in this
  repository configures that App's model (it is installed at the organisation level, outside
  this repo's own config).
- **What the agent got right:** distinguishing three different things the owner's request could
  have meant — a personal, cross-project memory (not something the agent can write from here); a
  one-session behaviour change (applied immediately: the review subagent already dispatched for
  PR #21 before this request did not specify a model, but every one after does); and a
  project-scoped, durable rule (what actually went into `governance.md`) — and asking which one,
  rather than silently picking one.
- **What the agent got wrong or missed:** nothing identified.
- **Owner changes and reasoning:** the owner chose the `governance.md` route over a personal
  memory feature, since it binds every future agent working on this repository, not just this
  account.
- **Disagreements:** none.
- **Lessons for the process:** a stated preference is not automatically a governance rule — it
  became one only once the owner confirmed that scope. The same sentence could instead have
  meant a one-off instruction for this session alone.
- **Next:** continue driving PR #21 to green and through review, per the usual PR-babysitting
  loop; no task currently depends on this governance change.

### Addendum — 2026-09-24, an adversarial review of PR #21 (T-09)

- **Input:** the owner asked for a separate subagent to run a `/code-review`-style pass on
  PR #21 (a read-only `Explore` subagent, dispatched before the governance v1.3 change above, so
  it ran on whichever model that agent type defaults to — flagged by the reviewer itself, not
  re-run, since nothing it found was severe). It read `.github/skills/code-review/SKILL.md`,
  governance.md, SPEC-overview, the backlog row, the DoD and the full T-09 plan (including its
  three advisor passes) before touching the diff, and ran the same commands this session already
  had (`npm test`, `typecheck`, `lint`, `format:check`) to confirm the plan's and this log's own
  claims rather than trust them.
- **Process note, not a PR defect:** the subagent's own output redirection mistake left two
  empty-content files at the filesystem root (`/tmp_out1`, `/tmp_out2`, both just the clean
  output of the two commands it ran) — outside the repository, `git status` unaffected. The
  agent's own attempt to delete them was refused by a safety check (a bare `rm` naming a
  root-level path); this session's own attempt was refused the same way. They need a human to
  remove, or will disappear with the container.
- **Findings (none severe):**
  1. SPEC-overview §7's "matches `OverviewDtoSchema` and 4.3" was satisfied only through a
     two-hop inference (this PR's independent oracle, and separately `tests/unit/seed-figures.test.ts`
     tying `scripts/seed-figures.ts` to §4.3), never a single test pinning a §4.3 number against
     the live route directly — and could not be, without either hand-typing a seed-derived
     figure (forbidden, build-workflow.md) or importing `scripts/seed-figures.ts` into the API
     test (the exact import-safety risk this PR's design already avoids). Resolved by making the
     trade-off an explicit comment in `tests/api/overview.spec.ts` rather than leaving it silent.
  2. `toOverviewDto`'s docblock claimed every field was named explicitly for `balance`/`bills`
     too, when both were passed through by reference (`balance: summary.balance`) — harmless
     today only because `BalanceInput`/`BillsSummary` are already closed types with no path that
     could attach an extra field, but the unit test meant to prove it compared the result against
     the very same object, so it could not have caught a real leak the way the array tests do.
     Fixed: both are now destructured field by field, matching the rest of the function, and the
     unit test now hands in extra fields (`seeded`, `extra`) and asserts they are dropped —
     verified by mutation (reverting to the pass-through failed the new test immediately).
  3. Three doc-only inaccuracies: the plan's File Structure table still described the unit test's
     old, since-corrected scope; `tests/unit/README.md`'s parenthetical listed `CATEGORY_LABEL`/
     `THEME_LABEL` but not `labelMap`, the function that actually builds and tests them; and the
     plan/route said the route "answers the 500 envelope on any throw," when a `labelMap`
     construction failure (an actual enum drift) throws at module import, outside the route's
     `try`, and would fail the build or cold start instead. All three corrected at their source.
- **Checked and confirmed solid, per the reviewer:** `labelMap`'s bijection check (including the
  `Object.hasOwn`-vs-`in` `"constructor"` trap), the `BigInt`→`Number` conversion (complete for
  every money field the DTO reads; correctly does not read `Pot.target`), `toOverviewDto`'s array
  mapping against `OverviewDtoSchema` field for field, the generic constraints' soundness at the
  real call site, the 401/`no-store` claims against `middleware.ts`, ADR-0002/ADR-0005 compliance,
  the `api` project's `workers: 1` ruling out a test race on the "no Balance row" test, and the
  process-log's own test counts (checked against the actual test files, not assumed).
- **Owner changes and reasoning:** none yet — the owner asked for the review; the fixes above are
  the agent's own response to it, per governance's normal implementation-detail latitude.
- **Lessons for the process:** a "no leaked field" test that compares a function's output against
  the very same object it was built from cannot detect a pass-through leak — it needs a fixture
  built separately, the way the array tests already did, and a mutation run to prove it bites.

## 2026-09-24 — Phase 5: T-10 Overview UI

- **Phase:** 5 (Build the slice), Release 1.
- **Participants:** Owner / Agent (Claude Code, cloud session).
- **Trigger:** the owner, verbatim: "T-10 planlamasına başla" ("Start planning T-10"), then,
  after reviewing the plan gate, "Start."
- **Prompt(s):** `prompts/2026-09-24-T-10.md`.
- **Produced:** `docs/04-process/plans/2026-09-24-T-10.md` (plan gate, then executed);
  `src/ui/overview/{StatCard,PotsCard,TransactionsCard,BudgetsCard,Donut,BillsCard,
  OverviewError,CardLink,ThemeBar,theme-color,donut-geometry}` (+ `.module.css` per component),
  `src/ui/icons/JarIcon.tsx`; `app/(app)/overview/page.tsx` (filled in) and
  `page.module.css`; `tests/unit/ui/overview/*` (10 files); `tests/e2e/overview.spec.ts`;
  README updates in `src/ui`, `app/(app)`, `tests/unit`, `tests/e2e`; a one-line
  `design-tokens.md` note that `jar-fill` is now implemented.
- **What the agent got right:** the plan gate stopped and waited for the owner's go-ahead
  before writing any implementation file, per `build-workflow.md` §2; the six components
  SPEC-overview §6 names, plus one addition (`OverviewError`, justified in the plan as D1)
  the spec's own §2.8 behaviour requires; every seed-derived figure in the new E2E file reads
  from `scripts/seed-figures.ts`'s `seedFigures()`, per the T-10 backlog row's own hand-off
  and `build-workflow.md`'s "never typed" rule — the first draft of the E2E file had typed the
  dollar figures directly (matching `docs/03-specs/overview.md` §4.3's own worked table, itself
  generated and pinned by `tests/unit/seed-figures.test.ts`), which is a defensible fallback but
  not what the backlog row asks for; caught and fixed before the PR, not after. Theme colours
  reuse the already-tested `--color-<kebab-theme>` rule (`tests/unit/shared/enums.test.ts`)
  instead of a new hand-typed table (D2); the Pots card's jar icon was fetched from Phosphor's
  real `assets/fill/jar-fill.svg` (MIT) rather than approximated, matching design-tokens.md's
  own listing and T-07's `sign-out` precedent. `npm test` (756), `npm run test:api` (91) and
  the full Chromium `npm run test:e2e` (89, including the new `overview.spec.ts`'s 13) all
  green before declaring done; DoD screenshots taken at 1440/768/375.
- **What the agent got wrong or missed:**
  1. The Overview grid (`page.module.css`) used the bare `1fr` shorthand
     (`minmax(auto, 1fr)`) for its single mobile column and the stat row's flex parent had no
     `min-inline-size: 0` — a fixed-size child anywhere in that column (the 240 px donut) forced
     every card in the column to its own width, which regressed `app-shell.spec.ts`'s existing
     US-33 AC2 (no horizontal scroll at 320 px) from 0 px to 24 px of overflow. Caught only by
     re-running the *existing* E2E suite (not just the new file) before declaring done — the new
     `overview.spec.ts` alone would not have caught a regression in a different spec file. Fixed
     with `minmax(0, 1fr)` and `min-inline-size: 0` on the flex/grid items that needed it
     (page.module.css, PotsCard.module.css), each with a one-line comment naming the rule.
  2. After the first full `npm run build`, several cards (`StatCard`, `PotsCard`,
     `TransactionsCard`, and the page's own grid) rendered with their CSS Module classes
     present in the DOM but **no matching rule in the served stylesheet** — a stale Turbopack
     build cache from iterative development (`.next/cache`), not a code defect: `rm -rf .next`
     before the next `npm run build` produced the correct, fully-styled page (verified with
     screenshots at 1440/768/375 and a re-run of the whole E2E suite against the clean build).
     Caught only because the agent took screenshots for the DoD and looked at them, rather than
     trusting "all tests green" alone — none of the E2E assertions check background colour or
     card padding, so a broken stylesheet passed every automated check. This is the same class
     of lesson T-01's "reported output is copied from the run, never from the brief" — an
     automated pass is not the same claim as "I looked at it."
  3. No advisor/second-reviewer pass was run before or after execution, unlike T-08/T-09's own
     sessions (which used a stronger-model review before writing code and, for T-09, a second
     pass on the committed diff). This session went straight from plan to implementation to
     declaring done; nothing found above came from a dedicated review step, only from re-running
     the full test suite and looking at screenshots.
- **Owner changes and reasoning:** none yet — awaiting review.
- **Disagreements:** none.
- **Lessons for the process:**
  1. A CSS Grid/Flexbox column's default `min-width: auto` means one fixed-size item anywhere
     in a shared track can force every other item in that track wider than its own content —
     worth a standing note (or a lint/test rule, considered but not added here) for any future
     card-grid layout that mixes a fixed-size chart with flexible siblings.
  2. Passing tests are not the same claim as "the page looks right." A UI task's DoD
     screenshots are not paperwork after the fact — this session's own stale-build styling gap
     survived unit tests, API tests and a full green E2E run (axe included) and was caught only
     by looking at a screenshot, exactly the failure mode governance.md's "reported output is
     copied from the run, never from the brief" already warns about, extended here to visual
     output specifically.
  3. A backlog row's own hand-off ("seed figures in E2E come from `seedFigures()` … never
     typed") is easy to satisfy in spirit (typing the already-approved, generated §4.3 table)
     while missing it in the letter (importing the actual function). Re-reading the row's exact
     wording against the diff, not just its topic, caught this before the PR.
- **Next:** T-11 (WebMCP adapter), per `docs/03-specs/backlog.md`.

### Addendum — 2026-09-24, an adversarial review of the T-10 diff

- **Input:** the owner, verbatim: "Ayrı bir subagent ilə yoxlat zəhmət olmasa" ("Please check
  it with a separate subagent") — in response to the process log above naming the missing
  review pass as a gap. A read-only `Explore` subagent, launched with the model governance.md
  v1.3 requires (Opus 5.5), reviewed the diff since PR #21 (`a7b938a..HEAD`, 4 commits, 42
  files) against `AGENTS.md`, `governance.md`, the T-10 backlog row, SPEC-overview,
  `definition-of-done.md`, `build-workflow.md`, the plan and this log's own claims — treating
  the log as something to verify, not trust. It ran `npm run typecheck`/`lint`/`format:check`/
  `npm test` for real in this same checkout (node_modules and `.env.local` already present) and
  quoted the actual output; it could not run `test:api`/`test:e2e` because Postgres was not
  running when it checked and it declined to start a service itself (a correct call under its
  own read-only constraint — governance.md's "if a review needs to execute something, it does
  so in a throwaway clone" assumes state the reviewer may change, not state it finds already
  down), so those two claims from the log above were left unverified rather than refuted.
- **Findings, most severe first, all fixed:**
  1. **The donut's inner ring rendered 24 px wide, not 8 px.** `Donut.tsx` gave both the inner
     and outer `<circle>` elements the same `styles.segment` class; `Donut.module.css`'s
     `.segment { stroke-width: 24px }` always outranks an SVG presentation attribute, so the
     inner circles' own `strokeWidth={8}` prop was silently ignored — a real, visible rendering
     bug SPEC-overview §4.4 specifies exactly (8 px inner ring) and no test caught, since
     `Donut.test.tsx` only counted `<circle>` elements. The reviewer verified this by rendering
     the real component and CSS in Chromium and reading the computed `stroke-width` (24px).
     Fixed by splitting `.segment` into `.innerSegment` (8px)/`.outerSegment` (24px); a new unit
     test asserts the two circle groups carry different classes, and was confirmed to fail
     against the original bug by reverting the fix and re-running it before restoring it (the
     same mutation-testing discipline this task's own plan used for `donutSegments`).
  2. **`ThemeBar`'s "violation fixture" could not fail.** The first version only asserted that
     a `[data-theme="X"]` selector string existed in the CSS, the same class of gap T-09's D2
     explicitly rejected for `CATEGORY_LABEL`/`THEME_LABEL` — a swapped rule (Navy painted red)
     would have passed every check. Fixed: the test now extracts each rule's actual
     `var(--color-*)` value and compares it to the theme's own expected token, with a genuine
     swap fixture proven to fail before the fix and pass after.
  3. **`Donut`'s React `key` was the theme name**, which two budgets could in principle share
     (nothing in this task enforces US-15 AC1's "used themes disabled" rule — that is a
     Release 2 write-path concern). Changed to the array index, a stable identity regardless.
  4. **E2E gaps against the plan's own Task 8 and SPEC-overview §7:** US-34's hover/focus test
     only checked the first of the four card links; the axe test never covered the *populated*
     page at 375 px (only the default seed at 1440 and `empty-all` at both widths); and §7's
     literal "skip link → nav → four card links → footer" has no DOM path at ≥1024 px (the
     sidebar's footer sits *before* `<main>` there) — it only holds where "footer" means the
     bottom nav bar, which `Shell` renders *after* `<main>`, i.e. at <1024 px. All four fixed:
     the hover/focus test now loops over all four links; axe now runs the default seed at both
     widths too; a new phone-width test extends `app-shell-keyboard.spec.ts`'s own established
     walkthrough pattern (skip link → dismiss → header "Log out" → …) with this page's four
     card links inserted before the bottom nav, proving the literal chain the spec names.
  5. **Two smaller fixes:** `PotsCard`'s tile text had no wrap fallback for a total wider than
     the seed ever produces (defensive, not a live R1 bug — flagged as low severity by the
     reviewer since no write path in R1 can produce one); `design-tokens.md`'s new note
     overclaimed `jar-fill` as "the first of the 27 to actually be implemented" when
     `eye`/`eye-slash` (T-06) already were — reworded to drop the false claim.
- **Checked and confirmed solid, per the reviewer:** the donut's segment math itself
  (`donutSegments`'s denominator, cumulative offsets, the 12-o'clock clockwise rotation, the
  `color-mix` opacity) is correct; ADR-0002 import boundaries hold; no `style=` prop anywhere
  in the new files; all 15 `ThemeBar` rules exist; every seed-derived E2E figure genuinely comes
  from `seedFigures()`, not a hand-typed literal; empty states match §2.7 and use `COPY`; the
  request id is really forwarded and logged; `npm run build` produces `ƒ /overview` (dynamic,
  not prerendered against the database); the stale-Turbopack-cache story from the log above is
  plausible and not a cover for something else.
- **Re-verified after the fixes** (this session, real output): `npm run typecheck`/`lint`/
  `format:check` clean; `npm test` 758 passed (60 files); `npm run test:api` 91 passed;
  `npm run test:e2e -- --project=chromium` 90 passed (all of `tests/e2e`, including the new
  phone-walkthrough test) against a clean (`rm -rf .next`) build; a close-up screenshot of the
  donut confirms the inner ring is now visibly thin against the outer one.
- **Owner changes and reasoning:** none yet — the owner asked for the review; the fixes above
  are the agent's own response to it, per governance's normal implementation-detail latitude.
- **Disagreements:** none.
- **Lessons for the process:** a CSS class shared between two elements that need different
  values for the *same* property is exactly the kind of thing a component test that only counts
  elements cannot catch — the lesson from this task's own `ThemeBar` mistake (a table that
  looks checked but isn't) generalises past hand-typed data tables to shared CSS classes too. A
  "violation fixture" is only proof once it has actually been run against the *unfixed* code and
  seen to fail — this review supplied that for finding 1 where the implementing session's own
  test had not.
- **A fifth, self-caught defect, found preparing the PR description (not by the reviewer):**
  `tests/e2e/overview.spec.ts` used `.first()`/`.nth()`/`.last()` in six places to pick one of
  the four "See Details ›"/"View All ›" links — a rule `tests/e2e/README.md` and
  `definition-of-done.md` both name explicitly ("no `.first()`"), and no other file in
  `tests/e2e` uses any of the three. Caught while re-reading the DoD checklist line by line to
  write the PR body, not by the earlier review (which read the file for what it asserted, not
  for this specific convention). Fixed with a `cardLink(page, heading, label)` helper that
  scopes each link by its own card's heading instead of its position — every card wraps its
  heading and link as DOM siblings, so this is no less precise, just name- instead of
  order-based. Re-verified: `npm test` 758, `test:api` 91, `test:e2e` (chromium) 90.

## 2026-09-24 — Phase 5: TD-6 development variant of the CSP

- **Phase:** 5 (Build the slice), Release 1 — tech debt, not a numbered task.
- **Participants:** Owner / Agent (Claude Code, local session in a worktree).
- **Trigger:** the owner asked, verbatim: "niyə local run eval problemi verir" ("why does the
  local run give an eval problem"), then answered the agent's two options with "b".
- **Prompt(s):** none recorded as a file — the two messages above are the whole brief.
- **Produced:** `src/server/csp.ts` (`buildCsp`); `middleware.ts` calls it; `tests/unit/server/csp.test.ts`
  (12 tests); one API test in `tests/api/middleware.spec.ts`; ADR-0006 amendment 2026-09-24 (4),
  (Proposed when drafted; accepted by the owner later the same day, see below);
  `docs/03-specs/tech-debt.md` v1.5 (TD-6 "Fix in review"); a README note under
  "Run locally" (the development policy is relaxed, the shipped one is checked by the
  production-build suites); this entry.
- **What the agent got right:** the question was vague, so it found the cause before proposing
  anything — the CSP has no `'unsafe-eval'`, and `next dev` needs it — and found that TD-6
  already recorded it, with the owner's own console paste. It did not change the policy until
  the owner picked an option, because any policy change is an ADR-0006 amendment. It checked the
  result on real servers: `next dev` sends the relaxed policy, `next build && next start` sends
  the unchanged production one.
- **What the agent got wrong or missed:** the first API run failed 4 tests because it had not
  set `CRON_SECRET` (the failure text names it) — an environment slip, not a code defect; it
  first verified only the header, not the console the owner complained about, until the
  advisor pointed that out; it `cd`-ed out of the worktree into the main checkout
  mid-session, which the harness refused until it re-entered the worktree; and it first
  symlinked `node_modules` from the main checkout, which Turbopack rejects ("points out of the
  filesystem root") — a real `npm ci` was needed for the `next dev` check.
- **Owner changes and reasoning:** the owner accepted ADR-0006 amendment (4) at 12:25 +04
  with "Hamısını accept et" ("accept all"), after asking whether opening the PR already counted
  as acceptance ("PR yaranması bunun təsdiqi sayılmır?") — it does not: `governance.md` gives
  the owner alone "accepts ADRs" and "merges code", and forbids the agent to mark anything
  Accepted. The agent recorded the acceptance only on that explicit statement. "All" was read as
  the one pending amendment (the four earlier ones were already owner decisions); the agent
  asked no further question and kept the amendment inside ADR-0006, not a new ADR — see the
  next bullet.
- **Disagreements:** none.
- **Lessons for the process:** a dev-only relaxation of a security policy needs a test on the
  *production* side, not just on the new branch — the API test pins the shipped policy so the
  relaxation cannot leak; the unit test alone would pass even if `middleware.ts` passed the
  wrong `NODE_ENV`.
- **Verified:** `npm test` 770 passed (758 before + the 12 new), `typecheck`, `lint` and
  `format:check` clean; `npm run test:api` 92 passed (91 before + the new pin test) against a
  production build and a throwaway Postgres on port 5433 (not the owner's `postgres-data`
  volume); `next dev` and `next build && next start` each answered with the expected header;
  and `/login` and `/signup` under `next dev` in headless Chromium, reloaded, logged no CSP
  violation, no `eval` error and a connected HMR (the only warning is an unused-preload notice).
  **Not run:** the E2E suites (Chromium/Firefox/WebKit) — they run the production build, whose
  policy is unchanged and pinned; and no server-side render error was provoked under `next dev`,
  so React's `eval` path for error stacks is covered by the policy but was not exercised.
- **Open question for the owner (not answered):** `governance.md` line 40 says "Never modify an
  Approved/Accepted document — propose a new version or a superseding ADR". ADR-0006 was
  already Accepted, and the agent added amendment (4) to it, as the four earlier amendments
  (owner decisions) had been. The agent offered a new, separate ADR instead (it would take the next number, 0008 — no ADR 0008 exists; the last is 0007); the owner's
  "accept all" did not choose it, so the amendment stays in ADR-0006 unless the owner says
  otherwise.
- **Owner check:** the owner asked for the app to be run locally ("local run et. yoxlayım") and
  checks it themselves under `npm run dev`; their result is not recorded here.
- **Next:** the owner merges PR #23; TD-6 is then marked Closed.
- **Update, 2026-09-24 12:40 +04:** the owner merged PR #23 (merge `dc2dba3`). TD-6 is marked
  Closed in `docs/03-specs/tech-debt.md` (v1.7) by a follow-up docs PR from `docs/td-6-closed`.

## 2026-09-24 — Phase 5: T-11 WebMCP adapter

- **Phase:** 5 (Build the slice), Release 1.
- **Participants:** Owner / Agent (Claude Code, on Claude Code's web/cloud environment).
- **Trigger:** the owner's message, verbatim: "T-11 planlamasına başla" ("Start planning T-11").
  Followed by "start" at the plan gate, accepting both findings below "as recommended".
- **Prompt(s):** `prompts/2026-09-24-T-11.md`.
- **Produced:** `docs/04-process/plans/2026-09-24-T-11.md`; `src/webmcp/types.ts`, `adapter.ts`,
  `defineTool.ts`, `status-context.ts`, `WebMcpProvider.tsx`, `WebMcpTools.tsx`,
  `AgentToolsStatus.tsx` (+ `.module.css`); `src/ui/agent-tools-indicator.tsx`
  (`AgentToolsIndicatorProvider`, a plain `ReactNode` slot — plan D1); edits to
  `app/(app)/layout.tsx`, `src/ui/Sidebar.tsx` (+ `.module.css`), `src/ui/PageHeader.tsx`
  (becomes a Client Component), `src/ui/Shell.tsx` (doc comment only); `package.json` +
  `package-lock.json` (`@mcp-b/webmcp-polyfill@^5.1.0`); `tests/unit/webmcp/adapter.test.ts`,
  `defineTool.test.ts`, `WebMcpProvider.test.tsx`, `AgentToolsStatus.test.tsx` (38 tests);
  `docs/03-specs/webmcp-tools.md` v1.0.3; `docs/03-specs/tech-debt.md` v1.5 (TD-5 closed);
  the boundary fixture repoint (`domain-imports-webmcp.ts.fixture` → `src/webmcp/adapter`) and
  its README; the READMEs (`src/webmcp`, `src/ui`, `tests/unit`); this entry.
- **What the agent got right:** the plan gate re-checked ADR-0004/SPEC-webmcp-tools §2.2
  against the actually-installed `@mcp-b/webmcp-polyfill@5.1.0` — reading its `dist/index.js`
  and README directly, not trusting the spec text or the 2026-09-08 research note — and found
  two places the API had moved since the spec was written (Q1: no `unregisterTool(name)`, tool
  lifetime is `AbortSignal`-based instead; Q2: a tool's registered `execute` receives only the
  raw input, never a runtime signal). Both were presented as recommendations at the gate and
  accepted with "start"; the SPEC-webmcp-tools v1.0.3 changelog records Q1 as a spec correction,
  matching the T-04 plan gate's own precedent for a similar package-vs-spec drift
  (`zod-to-json-schema` → `z.toJSONSchema`). The `AbortController`-per-generation design (D2)
  turned out to need no extra bookkeeping: the runtime's own `signal?.throwIfAborted()` before
  adding a tool, and its `abort` listener removing one, already give "drop a stale generation"
  and "remove everything the last `register()` added" for free.
- **What the agent got wrong or missed:** the plan's Decision D1 (a `ReactNode` slot in
  `src/ui`, populated from `app/(app)/layout.tsx`, so `src/ui` never imports `src/webmcp`) was
  right in shape but wrong in one specific: the first implementation rendered
  `<AgentToolsIndicatorContext.Provider value={...}>` directly from `app/(app)/layout.tsx` (a
  Server Component), reading `.Provider` off a context object imported from a `"use client"`
  module. Every one of this task's 38 unit tests passed — jsdom component tests render each
  piece in isolation and never cross an actual RSC server/client boundary, so they could not
  have caught this. It surfaced only when the app was actually run: `docker compose` has no
  daemon in this environment (as T-09's entry already noted), but this sandbox does have a
  native PostgreSQL 16 (`service postgresql start`, not tried before), so a real `db:reset` +
  `next dev`/`next start` + a Playwright script driven at `/opt/pw-browsers/chromium` (not
  `npx playwright test`, whose pinned Chromium version is not the one installed here) logging
  in as the demo account and opening `/overview` reproduced, verbatim: `pageerror: Element type
  is invalid: expected a string ... but got: undefined. ... Check the render method of
  `AppLayout`.` — every authenticated page, not just the indicator, failed to render
  ("This page couldn't load"). The fix (also verified by re-running the exact same script
  against the exact same session, now succeeding) wraps the `.Provider` usage in a real
  component, `AgentToolsIndicatorProvider`, entirely inside the `"use client"` file —
  `app/(app)/layout.tsx` now only ever renders it as a plain element, the same shape
  `WebMcpProvider` (which never had this bug) already used for its own context. Recorded in
  `src/ui/agent-tools-indicator.tsx`'s own doc comment and as a new `build-workflow.md` rule of
  thumb, so the next task reaches for the component wrapper first rather than by luck.
- **Verified, not reasoned — the crash and the fix, both run:** before the fix, the Playwright
  script's console listener recorded the `pageerror` above and `H1` read "This page couldn't
  load"; after the fix, the identical script (same login, same `/overview` navigation) recorded
  zero `pageerror`s, `H1` read "Overview", and the sidebar's indicator read `aria-label="Agent
  tools: polyfill · 0"` with `title="Provided by a polyfill; no built-in agent yet"` — checked
  in the expanded sidebar, the collapsed sidebar (US-35, the indicator becomes a centred dot,
  plan D5), and at 500 px width (the page header's compact dot before "Log out"), under both
  `next dev` and a clean `next build && next start`. The production build's console carried
  zero CSP violations (TD-6 is dev-only, confirmed directly rather than assumed) and
  `document.modelContext` was a real object — the polyfill loaded and installed for real in an
  actual Chromium, not a mock. `npm audit --audit-level=high`: 0. A second, real bug the same
  run caught and fixed before it shipped: `register()`'s first draft counted every tool in its
  input array as registered even when the runtime's own `registerTool` call for one of them had
  rejected; `Promise.allSettled` plus filtering `registeredNames` to the `fulfilled` results
  fixed it, and a unit test (`adapter.test.ts`, "does not block the others ... is not counted
  as registered") pins the corrected behaviour by making one `registerTool` call reject and
  asserting the rejected tool's name is absent from `registeredTools()`.
- **Also found and fixed while writing `AgentToolsStatus`'s own component test:** the ARIA
  `status` role does not compute its accessible name from content (unlike, e.g., `button`) — the
  sidebar row, which relied on visible text plus a `title` attribute, had its accessible *name*
  silently become the `title` string instead of the live status text (`getByRole("status",
  {name: ...})` found nothing until this was fixed). Both variants now set `aria-label`
  explicitly; the inner text span is `aria-hidden` to avoid a double announcement.
- **Environment (differs from other sessions' entries; noted for the PR):** Node v22.22.2 (repo
  requires `>=26`, an `EBADENGINE` warning on every `npm install` here — not changed, since it is
  this sandbox, not the repository, that is behind). No Docker daemon; PostgreSQL 16 was started
  as a native service instead (`service postgresql start`, a password and a `personal_finance`
  database created for this session only). `npx playwright test --project=chromium` failed all
  90 tests immediately with "browser not found" — the pinned `@playwright/test` version's
  expected Chromium build is not the one at `/opt/pw-browsers`; not attempted to fix (a sandbox
  packaging detail outside this task), and worked around for this task's own verification with a
  standalone script pointed at the installed binary directly, described above. `npm test` 796
  (758 + this task's 38), `npm run test:api` 91 (unchanged — T-11 adds no route), `npx tsc
  --noEmit`/`npm run lint`/`npm run format:check` clean, `npm run build` clean (Turbopack).
- **Owner changes and reasoning:** none yet — awaiting review.
- **Disagreements:** none.
- **Lessons for the process:**
  1. A Provider around a context created in a `"use client"` module must be a real component
     rendered entirely inside that module (`export function XProvider({ children, ... }) {
     return <XContext value={...}>{children}</XContext>; }`); a Server Component must never
     read a property — `.Provider` included — off the imported context object itself. This is
     now a `build-workflow.md` rule of thumb.
  2. A unit-test suite that renders every piece in isolation (jsdom, one component at a time)
     cannot catch a defect that only exists at the seam between a Server Component and a
     `"use client"` module — that seam is only real inside Next's own RSC bundler. The DoD's
     "start the dev server and use the feature in a browser" line is not optional polish for a
     shell-level change even when the feature itself (an indicator showing "0 tools") looks too
     small to need it; this task's whole app would have shipped broken without it.
  3. This sandbox has a usable native PostgreSQL the Docker-first instructions do not mention —
     worth a line in the environment notes so a future session does not re-conclude "no database
     available" from `docker compose` alone.
- **Next:** T-12 (R1 tools, `get_balance`/`get_overview_summary`, via-marker logging,
  `src/shared/api-client.ts`, E2E in polyfill/off modes) per backlog v1.20.

### Addendum — 2026-09-24, PR #24's CI: a real regression in 4 pre-existing E2E tests

- **Trigger:** the owner asked for a PR ("PR yarat"); PR #24 opened and subscribed. CI's "E2E
  (Chromium)" job failed on the very first push (`4b6a70b`): 4 of the 90 `tests/e2e` tests —
  none of them new, all pre-existing `ResetBanner` tests in `app-shell.spec.ts` and
  `app-shell-keyboard.spec.ts`.
- **Root cause, this task's own:** `ResetBanner` has always been `role="status"` with no
  distinguishing name or testid, and every one of these tests located it with a bare
  `page.getByRole("status")`, correct as long as it was the only such element on the page. T-11's
  `AgentToolsStatus` indicator is also `role="status"` (SPEC-webmcp-tools §2.7) and is now
  mounted on every authenticated page — a second, independent live region the pre-existing
  locators could not distinguish from the banner, failing with a strict-mode violation
  ("resolved to 2 elements") or, worse, a `toHaveCount(0)` that could never pass once the
  indicator was always present. Confirmed from the CI job's own log (`get_job_logs`), not
  guessed from the diff.
- **Fixed:** `TEST_IDS.resetBanner` added and set as `data-testid` on `ResetBanner`'s root
  `div` — exactly the case ADR-0003 names a `data-testid` fallback for ("the accessible tree is
  ambiguous"), not a new exception to it. All 7 occurrences across the two spec files (more than
  the 4 CI reported failing; the rest happened to pass by accident of ordering/content, not by
  being correct) switched from `page.getByRole("status")` to
  `page.getByTestId(TEST_IDS.resetBanner)`.
- **Verified, not just reasoned:** reproduced locally first (same 4 failures, same error text,
  against a real Postgres and a real Chromium at `/opt/pw-browsers/chromium` via a session-local
  `playwright.local.config.ts`, deleted before committing), then re-ran the same two spec files
  after the fix — 30/30 passed — then the full `tests/e2e` suite — 90/90 passed. `npx tsc
  --noEmit`, `npm run lint`, `npm run format:check`, `npm test` (796), `npm run test:api` (91)
  all re-run and green.
- **Lesson:** a `role="status"` (or any non-unique ARIA role) locator with no name filter is an
  implicit "there is exactly one of these" assumption that a later, unrelated task can silently
  break by adding a second live region to the same page — this is exactly why ADR-0003 keeps
  `data-testid` as a named fallback rather than leaving every locator to roles alone; a bare-role
  locator on a shared layout (the shell, not a single feature's own page) is worth a second look
  the next time one is added.
- **Pushed:** `fix(e2e): T-11's status role collides with the reset banner's own locators`.
## 2026-09-24 — Process: AGENTS.md rule — start every session from the current main

- **Phase:** 5 (Build the slice), process change.
- **Participants:** Owner / Agent (Claude Code, local session in a worktree).
- **Trigger:** the owner's message, verbatim: "AGENT.md belə bir qayda əlavə olunmasını istəyirəm.
  When start new sesision git pull main branch. Buna bənzər" ("I want a rule like this added to
  AGENTS.md: when starting a new session, git pull the main branch. Something like that").
- **Prompt(s):** none recorded as a file — the message above is the whole brief.
- **Produced:** one bullet at the top of AGENTS.md §2, "Start every session from the current
  `main`"; this entry.
- **What the agent got right:** it did not write a bare `git pull main`. Pulling into a branch
  that has work on it, or with a dirty tree, is what turns a habit into a bad merge, so the rule
  says `fetch`, a fast-forward-only pull on `main`, a new branch from `origin/main`, and "stop
  and tell the owner" when the pull is not a fast-forward or the tree is dirty. The reason is
  written into the rule: the T-09 entry above records a session branch that had to be restarted
  because GitHub deletes a merged PR's branch.
- **What the agent got wrong or missed:** this very session had just made the mistake the rule
  prevents — the TD-6 docs branch sat next to an unmerged PR, and the new branch had to be cut
  from `origin/main` by hand.
- **Owner changes and reasoning:** the rule is the owner's request; wording is the agent's, for
  the owner to accept or edit in the PR.
- **Disagreements:** none.
- **Lessons for the process:** a rule that says "pull" is ambiguous about *which* base, *which*
  command and *what to do when it does not apply cleanly*; the last part is the one that
  matters.
- **Next:** the owner reviews and merges the PR.

## 2026-09-24 — Phase 5: T-12 Release 1 WebMCP tools

- **Phase:** 5 (Build the slice), Release 1.
- **Participants:** Owner / Agent (Claude Code, local session in a worktree; execution by a
  controller agent with one implementer subagent per task and a review after each).
- **Trigger:** the owner's message, verbatim: "start the t-12" (through
  `/superpowers:writing-plans`). Followed at the plan gate by "start
  /superpowers:subagent-driven-development" — Q1 (SPEC v1.0.4) yes, Q2 option A, Q3 option A, and
  execution by subagent-driven development.
- **Prompt(s):** `prompts/2026-09-24-T-12.md`.
- **Produced:** `docs/04-process/plans/2026-09-24-T-12.md` (v0.2, then executed);
  `src/shared/via.ts`, `src/shared/api-client.ts`; `src/server/request-log.ts`, the `GET log`
  route in `src/server/test-support.ts`, the recording call in `middleware.ts`;
  `src/webmcp/tool-result.ts`, `tools/overview.ts`, `tools/registry.ts`, `tools/OverviewTools.tsx`,
  `types.ts` (`issues`, `retryAfter`) and `defineTool.ts` (validation `issues`);
  `app/(app)/overview/layout.tsx`; `tests/fixtures/webmcp.ts`, `tests/e2e/webmcp.spec.ts`,
  `tests/e2e/webmcp-off.spec.ts`, `tests/api/via-log.spec.ts`, and the new unit files
  (`request-log`, `api-client`, `tool-result`, `overview-tools`, `registry`, `OverviewTools`, plus
  cases in `test-support` and `defineTool`); `.github/workflows/ci.yml` (the E2E job as a
  `webmcp-mode` matrix); `docs/04-process/runbooks/webmcp-native-check.md` (Draft);
  SPEC-webmcp-tools v1.0.4; SPEC-reset-and-test-support v1.5; backlog v1.21 (hand-offs to T-13,
  T-14, T-15, T-16); the READMEs of `src/webmcp`, `src/shared`, `src/server`, `app/(app)`,
  `tests/unit`, `tests/api`, `tests/e2e`; this entry; the stale `.env.example` comment
  ("/api/test/log arrives in T-12") was updated in the Task 6 fix round. Commits: Tasks 1–5 are `08a819d`,
  `7cb3e96`, `5ca91f7`, `8ac031e`, `02d5ecf` (on top of the plan's own last commit, `a84c5ae`),
  followed by the documentation commit and its fix round.
- **What the agent got right:** as at T-11, the plan checked the runtime the tests would call, not
  the spec text: it read the installed `@mcp-b/webmcp-polyfill@5.1.0` source and found seven things
  (F1–F7) before any code existed — a Server Component cannot hand `execute` functions to a Client
  Component (F1); the polyfill's `executeTool(tool, json)` takes a registered-tool object and a
  JSON string and returns a JSON string, so SPEC §7's `executeTool("get_balance", {})` does not
  exist outside the deprecated `navigator` shim (F2); `getTools()` shows only two annotation hints
  (F3); `toErrorIssues` throws on an unrecognised Zod key (F4); `X-Request-Id` is already on every
  response, so only the log is new (F5); the middleware and the route handlers are separate
  bundles (F6); `WEBMCP_MODE` is baked in at build time (F7). Two of these
  were proved by running, not reasoned: Task 3's real `next build` plus the existing
  `overview.spec.ts` (14/14) showed the F1 wrapper seam sound, and Task 1's API test — the
  request recorded by the middleware read back by a route handler — showed the `globalThis` buffer
  really is shared (F6). An advisor review of the plan, before the gate, caught three defects that
  would have surfaced only in execution (the mode guards would time out before naming the
  mismatch; the deliberate-failure step needed a by-hand `APP_ENV=test` server; the spec
  amendment missed §2.3 and §2.5) — plan v0.2. The mode guards were then made to fail on purpose,
  in both directions, and each named its cause ("expected a WEBMCP_MODE=off build — is a
  polyfill build being reused?" and its mirror image), rather than being trusted because they
  passed.
- **What the agent got wrong or missed:**
  - The plan said the API suite had 91 tests; the real baseline was 92 (96 after this task's 4).
    Noted by Task 1's implementer, which ran the suite; informational, no test was affected.
  - The plan's Task 4 code did not compile under the repository's `noUncheckedIndexedAccess`:
    `response.headers()["x-request-id"]` is `string | undefined`, and `next build` type-checks
    the test folder. The implementer added one `!`; no assertion changed. Found only by the real
    build, not by reading the plan.
  - The plan's Task 5 Step 3 said to push and read `gh pr checks`. The controller ruled that out
    (a push is a shared-branch side effect the implementer does not own), so the CI verdict for
    the new matrix does not exist yet.
  - The plan's code was not Prettier-clean: Tasks 1–4 each ended with `prettier --write` re-wrapping
    the pasted test code (whitespace only, assertions unchanged).
  - This task's brief called the SPEC-reset-and-test-support changelog entry "v1.2"; v1.2 was
    already T-05's, so the entry is v1.5.
  - Not observed: the plan says a wrong-mode build makes the file's other tests fail with
    unlabelled timeouts too; the deliberate-failure runs used `--max-failures=1`, so only the
    guard's own named failure was seen.
- **Verified, not reasoned:** on the branch after Task 6's edits — `npm run typecheck`, `npm run
  lint`, `npm run format:check` clean; unit 875 (baseline 808 + 67 new); API 96 (92 + 4 new);
  Chromium E2E 100 passed / 8 skipped in the polyfill build and 98 passed / 10 skipped in the off
  build (the skips are the other mode's spec); `npm audit --audit-level=high` 0 vulnerabilities.
  Firefox and WebKit were not run (CI runs Chromium until T-13).
- **Not verified:** the CI verdict — nothing has been pushed, and `actionlint` is not installed,
  so the workflow change is not validated locally; the first CI run must show both
  `E2E (Chromium, polyfill)` and `E2E (Chromium, off)` green. The headed native runbook has not
  been executed by a person; its status is Draft, the extension's UI labels are deliberately not
  recorded, and NFR-B2 stays open until the owner has run it and filled in its record table.
- **Environment:** Postgres from `compose.yaml` under Docker and a git-ignored `.env.local`,
  set up by the controller; baseline before this task 808 unit tests.
- **Owner changes and reasoning:** none yet — awaiting review.
- **Disagreements:** none.
- **Lessons for the process:**
  1. A test that depends on a build-time flag must assert the build it is talking to, and that
     assertion is only proved by making it fail on purpose: with a reused server (Playwright's
     `reuseExistingServer`) a spec for the wrong build otherwise passes vacuously or times out
     without a cause.
  2. `next build` type-checks the test folder. A plan that pastes test code should say so, or the
     first local build of a task is where a type error in it appears.
  3. A plan that contains a step with a side effect on a shared resource (push, PR) should mark it
     as the controller's, so a subagent executing the plan does not have to be overruled.
  4. Code pasted into a plan should be Prettier-formatted, or the plan should say each task ends
     with a format pass; four of five tasks ended with the same whitespace-only rewrite.
  5. The final whole-branch review found that `PAGE_TOOLS` (the registry `registry.test.ts`
     checks against NFR-W3) was not wired into the wrapper: `OverviewTools.tsx` imported
     `overviewTools` directly, so a tool added only to the registry would not have been
     registered. Fixed in the final review-fix commit (the wrapper now renders
     `PAGE_TOOLS.overview`). A test that iterates a registry proves nothing about what the page
     registers unless the page reads the same registry.
- **Next:** the controller pushes the branch and opens a draft PR and reads both CI legs; the
  owner runs `docs/04-process/runbooks/webmcp-native-check.md` in a headed Chrome and fills in its
  record table; T-13 (CI hardening: Firefox and WebKit join the `webmcp-mode` matrix or a second
  job) per backlog v1.21.

## 2026-09-24 — Phase 5: PR-A, Origin-Agent-Cluster for Firefox and WebKit (T-13 plan findings F1–F3)

- **Phase:** 5 — Build. A defect fix found while planning T-13, delivered as its own PR (the owner's rule: a defect outside a task's scope gets its own small PR, merged before the task that needs it). T-13 runs in parallel with it; only T-13's Task 10 (Firefox and WebKit in CI) needs PR-A merged. Tasks 1 and 2 of T-13 were already done on `task/T-13-ci-hardening` (`b716787`, `5819364`) when this entry was written.
- **Participants:** Owner / Agent (Claude Code) — controller and implementers Sonnet 5; task and final whole-branch reviewers Opus 5.5 (governance v1.3). A3 (the documents) had no separate task review; the final whole-branch review covered it, and this entry was corrected in its fix round.
- **Trigger:** measuring the baseline for T-13 (Firefox and WebKit in CI) showed the WebMCP specs that register tools failing on both engines — 8 of the 10 tests of `tests/e2e/webmcp.spec.ts` per engine, by the plan's measurement (below). T-13 cannot make the two engines a required check without fixing the cause or hiding it.
- **Prompt(s):** none saved; the task text is the PR-A section of the T-13 plan, `docs/04-process/plans/2026-09-24-T-13.md` (on branch `worktree-t-13-plan` until its PR merges).
- **Produced:**
  - `middleware.ts` — `Origin-Agent-Cluster: ?1` on every response it handles (commit `7a6905e`);
    `tests/api/middleware.spec.ts` — the test that pins it (same commit, strengthened in
    `3b3d9d8`).
  - `src/webmcp/adapter.ts` — a failed tool registration is reported: the indicator says
    `unavailable` when every tool of the page was rejected, `<html data-webmcp-error>` names the
    tool and the reason, `console.warn` prints one line per rejected tool (`8be64a0`);
    `tests/unit/webmcp/adapter.test.ts` (6 new tests) and `tests/e2e/webmcp.spec.ts` (one new test,
    which forces `originAgentCluster = false` so the failure reproduces in every engine); test
    hardening in `38cd59c`.
  - `docs/02-architecture/adr/0006-auth-and-session.md` — amendment 2026-09-24 (5), **Proposed**,
    with its alternatives, and the `Headers:` bullet; `docs/03-specs/webmcp-tools.md` — v1.0.5
    (§2.2, §2.7's `unavailable` row, §6, §7, changelog), **proposed, awaiting the owner's
    approval**; this entry (`3cf996f`; completed after the final review in `f01458c` and the
    commit that follows it).
- **What was found:**
  - **F1** — Firefox and WebKit report `originAgentCluster === false` for a document served
    without `Origin-Agent-Cluster: ?1`, and `@mcp-b/webmcp-polyfill@5.1.0`
    (`validateOriginAgentCluster`) then throws `SecurityError` from `registerTool`, `getTools` and
    `executeTool`. In Playwright's Firefox and WebKit no WebMCP tool worked on any page, so the
    US-38, US-39 and US-41 tests failed there and NFR-W2 ("functions identically in native,
    polyfill and off modes") did not hold; nothing was measured in a real user's browser.
    Chromium's default is already true, which is why every earlier run — all on Chromium — was
    green. **T-12 was merged with Firefox and WebKit red**; its own process-log entry says they
    were not run.
  - **F2** — the adapter reported `data-webmcp="ready"` after every registration had failed, and
    dropped the reason (`Promise.allSettled`, no log). The only visible trace of F1 was an
    indicator reading `polyfill · 0`. The owner's decision (T-13 plan Q2), verbatim: "Q2 -
    uğursuz olduqda geri dönüş olmalıdır. Ready yazılsa belə düzgün xəbardarlıq mesaji
    çıxarılmalıdır. Connect olmuş model anlamalıdır ki, webMcp əl çatan deyil" — in English: when
    registration fails there must be feedback; even if `ready` is written, a proper warning must
    come out; a connected model must understand that WebMCP is not reachable. So `ready` stays
    and three more channels say what it does not (indicator, `data-webmcp-error`, console).
  - **F3** — the WebKit line `"/overview style-src-elem inline"` that the automatic CSP guard
    adds to a failing WebKit test comes from Playwright's failure screenshot (it injects a
    `<style>`), not from the app. No such line appeared in any passing run here. T-13's Task 10
    will document it in `tests/e2e/README.md`.
- **What the agent got right:** the root cause was proved by running, not inferred — a probe in
  three engines against one server, with and without the header. A2's E2E fixture forces
  `originAgentCluster = false` with an init script, so the failing case is reproducible on
  Chromium and does not depend on a server header.
- **What the agent got wrong or missed:**
  - The plan's pass prediction was wrong: it said 16 passed (8 per engine), while
    `tests/e2e/webmcp.spec.ts` at `838e0f5` has 10 tests per engine and with the header 20
    passed. The plan's F1 had called the 8 failures per engine "the eight tests" of the file.
    The 16 failures are the plan's measurement on `838e0f5` and were **not re-measured in PR-A**
    (nobody ran the tests without the header). The 8-of-10 split is consistent with the code —
    reasoned, not re-run: the build guard (`webmcp.spec.ts:31`) reads only `mode()` and
    `data-webmcp="ready"` (`expectToolsReady` in `tests/fixtures/webmcp.ts`), neither of which a
    rejected registration changed before A2, and the login-page test (`:191`) registers nothing.
    After A2 the file has 11 tests per engine (33 on three engines, all passed).
  - A1's first test could pass without a session: the `/overview` request was not preceded by an
    asserted login and followed redirects, so a 302 to `/login` (which also carries the header)
    would have satisfied it. After review it asserts the login returns 200 and requests
    `/overview` with `maxRedirects: 0`; it was then failed on purpose (a wrong password gave
    `Expected: 200 / Received: 401`).
  - A2's first tests left holes, closed in the hardening commit `38cd59c`: the "one tool rejected"
    test did not check the warning; nothing proved that a superseded generation stays silent;
    nothing proved that the next `register()` clears an earlier failure without `unregisterAll`
    in between; the E2E console assertion was a one-shot read instead of a poll. Two mutations
    (the warn loop moved above the `aborted` check; `clearFailure()` removed from the start of
    `register`) each turned exactly one new test red.
  - The first draft of SPEC v1.0.5 did not say that `mode()` — and so `onStatus` and
    `window.__pf.webmcp.mode()` — now reports `unavailable` while every registration was
    rejected, which changes what the polyfill build guard (`webmcp.spec.ts`, the first test) can see. The
    final review found it; §2.2, §6, §7 and the guard's failure message now say it.
  - Deferred, minor: `clearFailure()` in `register` does not notify status listeners, so between
    the start of a new `register()` and its end the indicator can keep saying `unavailable`. The
    window is short, and the app's effect cleanup calls `unregisterAll` (which does notify) first.
- **Verified, not reasoned:** `npm run test:all` (secret scan, lint, format check, typecheck,
  unit, API, E2E on Chromium, Firefox and WebKit) exited 0 on `f01458c`, the last commit that
  touches code or tests (the commit after it changes only this entry): secret scan "317 commits
  scanned, no leaks found"; unit 881 passed in 71 files (baseline 875, +4 in A2, +2 in the
  hardening commit); API 97 passed; E2E 303 passed, 24 skipped, 0 failed (327 runs; 8 skips per
  engine, which matches the off-mode spec a polyfill build does not run, but the run's output
  does not itemise them) — `webmcp.spec.ts` ran 11 tests on
  each of the three engines, 33 in all, and the new "refuses every registration" test passed
  on all three. Earlier in the branch: A1 20 passed on Firefox and WebKit with the header; the new
  E2E test failed on Chromium at the indicator assertion without A2's change; the API test
  failed with `Received: undefined` before the header and, once strengthened, with `Received: 401`
  on a wrong password.
- **Not verified:** the CI verdict — nothing has been pushed by this task; native Firefox and
  Safari beyond Playwright's engines (no real-browser check); the F1 baseline (above): the 16
  failures without the header were not re-run.
- **Owner changes and reasoning:** Q2, as quoted above. Awaiting: acceptance of ADR-0006
  amendment (5) and approval of SPEC-webmcp-tools v1.0.5 — both written as proposed, and only
  the owner marks them accepted.
- **Assumption to confirm:** "a connected model" in Q2 was read as an agent that drives or reads
  the page through the DOM, the accessibility tree or the console. An agent that talks to the page
  only through the WebMCP API cannot be told anything by this app: `getTools()` and `executeTool()`
  throw the polyfill's own `SecurityError` (or list nothing), and that channel belongs to the
  runtime.
- **Disagreements:** none.
- **Lessons for the process:**
  1. `npm run test:all` runs three engines. A task whose PR lists "Chromium only" for E2E did not
     meet the DoD line "`test:all` green locally", and reviewers should ask for the Firefox and
     WebKit result before a task is called done. T-12 was merged with it red and the defect
     shipped for one task.
  2. A readiness flag that means "the code finished" rather than "it worked" hides failures: the
     adapter written in T-11 wrote `ready` over a total failure, and it showed once T-12
     registered the first tools. A state that a test or an agent waits on should say whether the
     thing works, or be accompanied by a channel that does.
  3. A plan recorded a failure count as the file's test count ("the eight tests") and derived its
     pass prediction from it. A pass-count prediction should count the tests in the file at the
     measured commit.
  4. A test of a response header on an authenticated page must assert that the session exists
     and must not follow redirects: a redirect also carries the header and satisfies the check
     vacuously.
- **Next:** the controller pushes `fix/origin-agent-cluster` and opens a draft PR; the owner
  reviews, accepts or amends ADR-0006 (5) and SPEC v1.0.5, and merges it. T-13 continues on
  `task/T-13-ci-hardening` in parallel; its Task 10 waits for this PR to be merged.
