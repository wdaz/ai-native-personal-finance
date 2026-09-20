# Adversarial review — Release 1 specs (2026-09-20)

Reviewer: fresh agent session (no prior context), role "implementing engineer who may not ask questions".
Inputs: `03-specs/*` (R1), approved stories/NFR/PRD, ADR-0002…0006, data-model, design-tokens, `data.json`.
Disposition column filled 2026-09-20. Q9 in the owner-questions list is a review artefact: the design exports were not staged for the reviewer; they are in the repo.

## Summary
The specs are close to buildable, but the Overview worked example (§4.3) is wrong in two places (Gift pot total, latest-five order), and every unit/API/E2E row that says "equals 4.3" would encode those errors — that alone blocks approval. Three test-infrastructure pieces that every E2E depends on (`/api/test/reset|seed`, the admin reset endpoint, the traceability script's scope) are either unspecified or scheduled after the tasks that need them, so T-06/T-09 cannot be finished as written and R1 CI can never be green. The WebMCP spec contradicts ADR-0004/NFR-W6 on the shape of tool output (decimal strings vs DTO cents) and its own E2E row, uses a different env-var name from every approved doc, and leaves the readiness/`toolchange` and unmount-during-pending-register races to the implementer. Several approved-doc contradictions (US-05 `$920.00`, US-31 blur rule, US-35 release, US-03 reset-ends-session vs ADR-0006, US-41 "unavailable") need an owner decision, not an agent guess. §9 says "None" in every spec, but there are at least a dozen hidden open questions in the body text.

## Findings

| Id | Severity | Location | Finding | Proposed fix | Disposition |
|----|----------|----------|---------|--------------|-------------|
| S-01 | Blocker | overview.md §4.3 | Worked example wrong vs `data.json`: Gift pot is `110.0` (spec says `$40`, the design's value); latest-five order under "timestamp desc, then name" is Savory Bites (20:23Z) → Emma (14:23Z) → Daniel → Urban Services Hub (21:08Z) → Sun Park (16:12Z). §7 rows "equals 4.3" would encode the errors. | Correct §4.3; add per-category spends (15/150/133/40). | Fix · applied |
| S-02 | Blocker | overview.md §2.3/§4.2/§4.3 vs US-05 AC1 | Spec renders `$920` (compact), approved story says `$920.00`. §4.2 sentence garbled. | Owner decides; rewrite §4.2 as element → format → example table. | Owner → $920.00 everywhere (against recommendation) · applied |
| S-03 | Blocker | overview.md §7 (US-04 AC2 "after a deposit through the API fixture"); T-09 | Deposit API is Release 2; NFR-T3 forbids non-API data creation. Test cannot be written. | Seed variant with a different balance, or defer AC2 to R2 explicitly. | Owner → deferred to R2 · applied |
| S-04 | Blocker | overview/auth §7, ADR-0003, T-12 | `/api/test/reset|seed` used by every E2E but never specified (body, variants, gating, response) and scheduled after T-06/T-09. | Add a test-support section; move to T-02/T-05; fix dependencies. | Fix · applied |
| S-05 | Blocker | T-12; US-37 AC1/AC3 | No spec for `/api/admin/reset` (header, reasons, response, log, ResetLog on first seed, LoginAttempt cleanup, threshold location); US-37 AC1/AC3 have no test rows. | Write SPEC-reset section; API test rows; note AC3 exercised in R2. | Fix · applied (SPEC-reset-and-test-support; US-37 AC3 → R2 by owner) |
| S-06 | Blocker | T-13; ADR-0003 traceability script | Script fails CI until all 41 stories ship. | Check only the release's story list (from PRD §5). | Fix · applied |
| S-07 | Blocker | T-13 deps; DoD "green in CI" | CI does not exist until T-13, so T-02…T-12 cannot meet DoD; NFR-T5 violated for ten PRs. | Minimal CI in T-01; API/E2E jobs in T-05/T-06; T-13 = hardening. | Fix · applied |
| S-08 | Major | webmcp-tools.md §3 vs ADR-0004, NFR-W6, own §7 | Decimal-string money vs DTO cents; "equals the DTO" impossible; converter unspecified. | Owner decides representation; if strings, add `toDecimalMoney` in `shared` and amend ADR/NFR. | Owner → cents + currency/unit · applied |
| S-09 | Major | webmcp-tools.md §2.1, §6 | `NEXT_PUBLIC_WEBMCP_MODE` vs approved `WEBMCP_MODE`; client cannot read `APP_ENV`; `native` treated as polyfill makes the value a no-op. | State the mapping; gate hook by `NEXT_PUBLIC_APP_ENV`; note "opportunistic native". | Fix · applied |
| S-10 | Major | webmcp §2.6 vs US-41; app-shell §3 | "off" vs "unavailable"; indicator tied to `/api/meta`; undefined loading state, placeholder pages (no provider), mobile dot name. | State table (loading/native/polyfill/unavailable); mount adapter in `(app)/layout`; drop meta row; `aria-label`. | Owner → "unavailable" + checking state · applied |
| S-11 | Major | overview §2.1, app-shell §2.1 | Server components fetching own HTTP routes: base URL, cookie forwarding, sliding refresh impossible. | Pages call `src/server` functions directly; routes exist for tools/E2E; refresh in middleware. | Fix · applied |
| S-12 | Major | overview §2.4, app-shell §2.6 | Time zone unspecified; 20:23Z → "20 Aug" in UTC+4. | Format in UTC with `Intl.DateTimeFormat(..., { timeZone: 'UTC' })`; unit case. | Fix · applied |
| S-13 | Major | overview §2.5/§4.4 | Donut geometry basis, inner-ring tint token, empty legend unspecified. | Segments ∝ maximum, clockwise from 12, creation order; inner ring theme at 25 % via `color-mix`; empty = grey-100 ring. | Fix · applied |
| S-14 | Major | app-shell "Implements US-35"; T-07 vs PRD §5 (US-35 = R2) | Scope creep vs approved PRD. | Owner: move US-35 to R1 (amend PRD) or remove from T-07. | Owner → US-35 in R1, PRD v1.2 · applied |
| S-15 | Major | auth §4 vs US-31 AC1 | "blur after first submit" vs "blur after first interaction". | Follow the story: touched-field blur + submit. | Fix · applied |
| S-16 | Major | auth §2.9; US-03 AC3 vs ADR-0006 | Reset ends sessions (story) vs cookies survive reset (ADR). | Owner decides; `resetEpoch` in payload if sessions must end. | Owner → sessions end on reset (against recommendation), ADR-0006 amended · applied |
| S-17 | Major | auth §2.8/§6 vs ADR-0006 | Middleware exceptions differ (signup, session route); logout auth unstated; API error envelope undefined. | Route matrix; amend ADR list; shared error envelope in `schemas.ts`. | Fix · applied |
| S-18 | Major | auth §4 vs ADR-0006; §2.4 | Failed-only vs all attempts; "N minutes" derivation; message not in copy. | Failed-only (clarify ADR); `N = max(1, ceil(retryAfter/60))`; copy row; unit cases. | Fix · applied |
| S-19 | Major | all specs; DoD copy rule | ~16 strings not in the approved copy appendix; PRD/appendix banner wording differ. | "R1 additions" table in the appendix (owner-approved) or DoD rule change. | Owner → appendix "R1 additions" for approval · applied |
| S-20 | Major | webmcp §5/§7 | "`X-Via` logged" untestable via `next start`. | `X-Request-Id` response header + test log sink, or downgrade to Review. | Fix · applied |
| S-21 | Major | webmcp §2.1 | `toolchange` "only if runtime did not fire" unknowable; target (`document` vs `ModelContext`) unspecified. | Always dispatch once after batch on both; tests wait on the attribute only. | Fix · applied |
| S-22 | Major | webmcp §2.2/§2.7 | Async register vs unmount race leaks tools into next page. | Generation counter / AbortController; unit row. | Fix · applied |
| S-23 | Major | webmcp §7 | "no tools on /login" differs by hard load (API undefined) vs client nav (0 tools). | Define the assertion and the navigation type. | Fix · applied |
| S-24 | Major | app-shell §5 vs data-model; ADR-0004 OT meta tag | Meta lacks mode hint; OT tag injection in no spec/task; interval hard-coded. | Extend `/api/meta`; put OT tag in `(app)/layout` §2.1 + T-07 row. | Fix · applied |
| S-25 | Major | app-shell §2.6/§7 | Fresh instance has no `ResetLog` → banner never shows; E2E has no deterministic date. | Seed/test reset write a `ResetLog` row. | Fix · applied |
| S-26 | Minor | overview §2.7 | Empty-state layouts under-specified (1–3 pots grid, legend, error card position). | One sentence each. | Fix · applied |
| S-27 | Minor | app-shell §2.3/§7 | Collapsed accessible name; storage value format. | "Minimize Menu"/"Expand Menu"; value `"collapsed"` or absent. | Fix · applied |
| S-28 | Minor | overview §6/§2.4 | Avatar asset mapping and location unspecified. | Seed stores basename; UI resolves `/avatars/<key>.jpg`; copied at T-01. | Fix · applied |
| S-29 | Minor | auth §2.7; US-03 AC1 | Back navigation needs `no-store` + bfcache handling. | Add to §2.9. | Fix · applied |
| S-30 | Minor | auth §2.4 | `next` validation rule undefined. | Allow-list regex of app paths. | Fix · applied |
| S-31 | Minor | webmcp §2.1/§2.5/§6 vs ADR-0004 | Adapter API names and error shape diverge from the Accepted ADR. | Align or amend ADR. | Fix · applied |
| S-32 | Minor | webmcp §3 | Descriptions omit page scoping (ADR-0004 consequence). | Append "Available on the Overview page." | Fix · applied |
| S-33 | Minor | webmcp §2.7 | `requestIdleCallback` not in WebKit. | Feature-detect with `setTimeout` fallback. | Fix · applied |
| S-34 | Minor | backlog T-03/T-07/T-14 | Oversized tasks. | Split T-03 (R1/R2 domain) and T-07 (shell / banner+meta+placeholders). | Fix · applied |
| S-35 | Minor | overview/app-shell §7 | No US-32/US-34-titled rows for Overview and shell. | Add keyboard-walkthrough and hover/focus rows. | Fix · applied |
| S-36 | Minor | DoD vs template §9 rule | "note in §9" un-approves a spec. | Changelog line under the header. | Fix · applied |
| S-37 | Minor | webmcp §2.4 vs research F2 | `execute(input, { signal })` vs `execute(input, signal)`. | Verify against the draft; quote it. | Fix · applied |

## Questions only the owner can answer
1. US-05: `$920.00` (story) or `$920` (design/spec)?
2. Do sessions end on demo reset (US-03 AC3) or survive it (ADR-0006)?
3. US-35 (minimise) in Release 1 or 2?
4. US-04 AC2 in R1 via seed variant, or deferred to R2?
5. Tool money: cents mirroring the DTO, or decimal strings?
6. Indicator third state: "unavailable" or "off"?
7. Copy beyond the approved appendix: specs may add (appendix amended after), or appendix first?
8. US-37 AC3 accepted as R2-only?
9. *(review artefact — exports are in `docs/00-discovery/inputs/design/`; not staged for the reviewer)*

## Coverage matrix
| Story | Spec | Tests | Status |
|-------|------|-------|--------|
| US-01 | auth 2.1–2.4, 2.8, 2.9, §4 | auth §7 | OK |
| US-02 | auth 2.5–2.6 | auth §7 | OK |
| US-03 | auth 2.7, 2.9; shell 2.2/2.4 | auth §7 | GAP (S-16, S-29) |
| US-04 | overview 2.2, 4.3 | overview §7 | GAP (S-01, S-03) |
| US-05 | overview 2.3, 2.7 | overview §7 | GAP (S-01, S-02) |
| US-06 | overview 2.4, 2.7, 4.3 | overview §7 | OK after S-01 |
| US-07 | overview 2.5, 2.7, 4.4 | overview §7 | OK (S-13) |
| US-08 | overview 2.6, 2.7 | overview §7 | OK |
| US-31 | auth 2.3, §4, §6 | auth §7 | OK (S-15) |
| US-32 | auth §6; overview 4.5; shell 2.7/2.8 | partial | GAP (S-35) |
| US-33 | shell 2.2, 2.4, §4 | shell §7 | OK |
| US-34 | overview 4.5; shell 2.2 | shell component row | GAP (S-35) |
| US-36 | — | — | GAP (no spec, no test) |
| US-37 | shell 2.6, §5 (AC2) | shell §7 | GAP (S-05) |
| US-38 | webmcp 2.1–2.3 | webmcp §7 | OK (S-21/22/23) |
| US-39 (R1) | webmcp §3, 2.4–2.5 | webmcp §7 | OK (S-08) |
| US-41 | webmcp 2.6; shell 2.2/2.4 | webmcp §7 | OK (S-10) |

## Numbers check
| Figure | Stated | Computed | Status |
|--------|--------|----------|--------|
| Balance / income / expenses | 4,836.00 / 3,814.25 / 1,700.50 | same | OK |
| Pots total | 920 | 920.00 | OK (format S-02) |
| Pots 1–4 | 159 / 110 / **40** / 10 | 159 / 110 / **110** / 10 | MISMATCH (Gift) |
| Budgets spent / limit | 338 / 975 | 338 / 975 | OK |
| Legend maxima | 50 / 750 / 75 / 100 | same | OK |
| Bills paid / upcoming / due soon | 190.00 / 194.98 / 59.98 | same | OK |
| Latest five — set | Emma, Savory, Daniel, Sun Park, Urban | same | OK |
| Latest five — order | Emma → Savory → Daniel → Sun Park → Urban | Savory → Emma → Daniel → Urban → Sun Park | MISMATCH |
| `get_balance` | "4836.00" / "3814.25" / "1700.50" | same | OK (representation S-08) |
