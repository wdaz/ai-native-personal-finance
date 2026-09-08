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
