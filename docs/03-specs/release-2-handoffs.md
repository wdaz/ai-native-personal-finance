# Release 2 hand-offs — what every Release 2 spec must resolve

Status: **Approved** by the owner's merge of PR #85 (T-15d, 2026-10-04); amended by the owner's merge of PR #87 (H6 corrected, H2, H5 and H7 ticked, H10 added); amended by the Transactions spec's pull request (H11 added, H3 and H9 noted for Transactions); its boxes are ticked as the specs land ·
Author(s): Agent (Claude Code, Sonnet 5.5, background session) · Date: 2026-10-04
Task: `docs/03-specs/backlog.md` → **T-15d** · Plan: `docs/04-process/plans/2026-10-04-T-15d.md` (D4, F6, F7) ·
Phase: 4 (Specs & plan), Release 2

Release 2's specs (`write-path.md` and the four page specs) are written against this list, and each is reviewed
against it before it reaches the owner. There is no template for this document; the plan (D4) is the record of
its shape. A box is ticked in the pull request of the spec that says how the item is resolved, with the section
number. An item no spec resolves stays unticked and the owner is told.

## 1. Hand-offs from earlier tasks

Each row's source was re-read on 2026-10-04.

| # | From | What it asks | Resolved by | Done |
|---|---|---|---|---|
| H1 | T-04 (backlog, T-15 row) | Name lengths and amount ranges (NFR-S3) are carried by the shared schemas in `src/shared/schemas.ts`; ids with `.max(36)` for `toolInputJsonSchema`. The amount copy is already in `COPY`. NFR-S3: cents `1 ≤ x ≤ 99,999,999,999`, names length-limited, enums for categories and themes, ids server-generated | `write-path.md` (the limits), each page spec (the fields) | ☐ (the limits: `write-path.md` 2.7, 4.1; the fields: the page specs) |
| H2 | T-08 (backlog, T-15 row) | After each successful write call `checkThreshold` (`src/server/threshold.ts`, no call site today); when it is exceeded, `resetToSeed(db, "threshold")` and answer 409 `{ error: "conflict", message: "Data was reset" }` (SPEC-reset-and-test-support §2.4, US-37 AC3). Each call runs three counts and `pg_database_size`: consider a cheaper or sampled check (PR #20 review, finding 7) | `write-path.md` | ☑ `write-path.md` 2.9 |
| H3 | T-12 (backlog, T-15 row) | Through the polyfill `getTools()` drops `consequentialHint`, and a tool's `execute` never receives a runtime `AbortSignal` (T-11 Q2): assert the `consequentialHint` rule in the registry unit test; drive "cancel" through the dialog, not through a signal | each page spec's tool table, `webmcp-tools.md` (§4 becomes a pointer) | ☐ (`list_transactions`: `transactions.md` 2.14 — a read tool, no `consequentialHint`, no dialog) |
| H4 | ADR-0003 acceptance (v1.23) | The traceability check reads the release being built | **Done in T-15d** (`scripts/traceability.ts`, PRD v1.3, the ADR-0003 clarification of 2026-10-04); its flip to Release 2 is the first Release 2 build task | ☑ |
| H5 | NFR-S4 | Write endpoints are rate-limited. Today `src/server/rate-limit.ts` holds the login limiter only (10 failures / 15 min / IP) | `write-path.md` | ☑ `write-path.md` 2.10 |
| H6 | ADR-0005 (consistency) | Pot money movements and deletions update `balance.current` in one transaction; a lightweight optimistic check | `pots.md` (the money rule, and a pot deletion's refund), `write-path.md` (the shared transaction rule); `budgets.md` has none: a budget deletion does not touch the balance (US-04 AC3, `data-model.md`) | ☐ (the shared transaction rule: `write-path.md` 2.8; the money rule: `pots.md`; the "optimistic check" this hand-off names is replaced, `write-path.md` §9 Q3 and ADR-0005's clarification of 2026-10-04) |
| H7 | T-13d, TD-15 (owner decision at the T-15d plan gate, 2026-10-04) | **Cross-site protection of write endpoints** — every non-GET `/api/*` route that changes data refuses `Sec-Fetch-Site: cross-site` with 403, and a body whose `Content-Type` is not `application/json` is refused. Today the check exists on `POST /api/auth/logout` alone (`proxy.ts`); every other route relies on `SameSite=Lax`. The decision is taken; `write-path.md` settles the 403 body (logout's `{ message }` outside `ErrorEnvelope`, or a new code in `ErrorEnvelope`, `auth.md` §2.10), `proxy.ts` for all `/api/*` or per route, the status and body of the `Content-Type` refusal, and the failing-first API tests, mirroring `tests/api/logout-fallback.spec.ts` | `write-path.md` | ☑ `write-path.md` 2.3–2.6, 7.3, 7.4 |
| H8 | PRD §5 Release 2 (v1.3); `overview.md` §4.6 and §8; `reset-and-test-support.md` line 83 | US-04 AC2 (Current Balance reflects money moved into or out of a pot) and US-37 AC3 (a request after a reset for a record that no longer exists answers 409/404 and the UI says "Data was reset") are acceptance criteria of stories Release 1's list names; the script cannot see them, so the spec that implements each names it in its Tests table. `overview.md` (Approved) is not edited | US-04 AC2 → `pots.md` (US-04 AC3: only pot deposits, withdrawals and deletions change Current Balance); US-37 AC3 → `write-path.md` | ☐ (US-37 AC3: `write-path.md` 2.9, read as `write-path.md` §9 Q6 says — only the request that causes a threshold reset gets the 409; US-04 AC2: `pots.md`) |
| H9 | PRD M2, US-31…US-34, US-38 AC1, US-39 AC2 | US-31 (validation messages), US-32 (keyboard), US-33 (responsive), US-34 (hover and focus) are Release 1 stories "for these screens" and apply to every Release 2 page; US-38 AC1 and US-39 AC2 name the Release 2 tools. A per-story check cannot ask again, so each page spec's Tests table names them for its page, at the level M2 asks (UI stories by E2E, non-UI stories by API tests) | each page spec | ☐ (Transactions: `transactions.md` §7, "H9, for this page") |
| H10 | `write-path.md` §9 Q5 (owner answer, 2026-10-04) | The four new messages — "This budget no longer exists", "This pot no longer exists", "Too many changes. Try again in {N} seconds", "Already used" — go into the copy appendix's new "R2 additions" table and into `src/shared/copy.ts` **together**: `tests/unit/shared/copy.test.ts` holds `COPY` and the appendix equal, so one without the other fails CI | the first Release 2 write task | ☐ |
| H11 | `transactions.md` 2.16, §7, §9 Q1, Q2 and Q4, 4.2 | Three things land with the first Transactions build task, each **together** with its mirror: (1) the page's strings — the new ones of `transactions.md` §9 Q1 and the design's and stories' strings marked in its 2.16 — go into the copy appendix's "R2 additions" table and into `COPY` (`tests/unit/shared/copy.test.ts`), with the two new places of approved messages if the owner approves `transactions.md` §9 Q4; (2) if the owner approves `transactions.md` §9 Q2, `--shadow-popover` goes into `design-tokens.md` and the generated `src/ui/tokens.css` (their mirror test); (3) the figures of `transactions.md` 4.2–4.7 move into `scripts/seed-figures.ts`, so the tests read them from the repository's code; (4) the E2E row of the Approved `webmcp-tools.md` §7 ("polyfill · 0 on a placeholder page", zero tools after clicking "Transactions") changes with `tests/e2e/webmcp.spec.ts` | the first Transactions build task | ☐ |

## 2. The retrospective's lessons, as a checklist

From `docs/04-process/release-1-retrospective.md`, section 3 (what the specs missed) and theme D. A spec is
reviewed against each line; the reviewer's report says "met", "not applicable" with a reason, or "not met".

- [ ] **L1.** A design prototype carries only the visible. Validation, keyboard and focus requirements are listed
      outside it, in the spec's own sections.
- [ ] **L2.** A seed-derived figure is recomputed from the seed (`scripts/seed-figures.ts`, `prisma/data.json`),
      never copied from the prototype, and the spec says which command reproduces it.
- [ ] **L3.** A change to an ADR is searched across the other ADRs and documents (`grep -rn` the changed term) and
      the hits are listed.
- [ ] **L4.** When a Goal cites NFR rows, each row's artefact is compared with its text.
- [ ] **L5.** A claim about GitHub's state, or a "guarded by" claim in the tech-debt register, carries its date and
      its command.
- [ ] **L6.** A question to the owner can be answered as written (`governance.md` v1.8): what is decided, why it
      matters, the options, a recommendation, every new term explained in the question.
- [ ] **L7** (AGENTS.md §4: "every acceptance criterion is observable and testable"). Every acceptance criterion of
      every story the spec covers has a row in its Tests table, with the level that M2 asks for.
- [ ] **L8** (AGENTS.md §4: "every spec says what happens on error, on empty state and at boundaries"). Every state is
      written: empty, loading, error, and the boundaries (the spec template, §3 and §4).

L1–L6 are the retrospective's; L7 and L8 restate the quality bar of AGENTS.md §4 as review lines.
