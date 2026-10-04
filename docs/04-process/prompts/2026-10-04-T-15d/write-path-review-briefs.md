# Briefs — the write-path spec's two reviews (T-15d, S1, pull request #87)

Two reviewers, dispatched in parallel after `write-path.md` v0.1 (`789135b`). Both were `feature-dev:code-reviewer` subagents with model `opus` and a tool set of
read, grep and glob only (`governance.md` v1.1, v1.3, D7 of the plan), so neither could run a command; every check is a read of a file. The fact base for the draft itself came from
two earlier read-only `Explore` subagents (code facts, document facts), whose reports the agent used and did not copy here.

## Reviewer 1 — facts and figures

    You are a READ-ONLY reviewer (tools: read, grep, glob only; edit nothing). Repository worktree = your current working directory, branch
    task/T-15d-spec-write-path. Review the NEW document docs/03-specs/write-path.md (v0.1, a feature spec) for FACTUAL accuracy against the code and
    documents. Context: docs/04-process/plans/2026-10-04-T-15d.md (Task S1, D6, D7), docs/03-specs/release-2-handoffs.md.

    Your job: verify every checkable claim, one by one, and report the ones that are WRONG, UNVERIFIABLE, or MISLEADING. Specifically:
    1. Every `file:line`-style or named reference to code: proxy.ts (…), src/server/http.ts, src/shared/schemas.ts (ErrorEnvelope, ERROR_CODES,
       VALIDATION_ISSUE_CODES, `toErrorIssues`/`validationIssueCode` throwing on other Zod codes e.g. `invalid_value`), src/server/threshold.ts,
       src/server/reset.ts, src/server/rate-limit.ts, src/shared/copy.ts (strings quoted in the spec: do they exist verbatim?), src/shared/api-client.ts,
       src/webmcp, app/api routes, prisma/schema.prisma, src/shared/enums.ts.
    2. Every number: 25 max user-created rows (derive it yourself), 2,000 and 52,428,800 thresholds, 99,999,999,999 cents, 30 characters, the seed figures in
       section 4.2 (open prisma/data.json and scripts/seed-figures.ts … recompute EVERY step of the three-write example by hand), "four budgets",
       "pot and budget may share a theme".
    3. Every claim about documents: quotes and section numbers cited from auth.md §2.10, ADR-0005, ADR-0006, ADR-0004, reset-and-test-support.md,
       webmcp-tools.md §2.5, NFR-S3/S4, US-xx acceptance criteria, tech-debt.md TD-15/17/18, release-2-handoffs.md.
    4. Whether any statement contradicts the code or an Approved document without saying so.
    5. Internal consistency: the order of work in 2.2 vs 2.3-2.5, 2.9, 2.10; the status table in 2.6; the tests in section 7 vs the rules.

    Report as a numbered list: each item = severity (blocker/important/minor), the exact spec text (quote), what you found (file:line evidence, quote), and
    the fix. Say explicitly which areas you checked and found no defect. Be concise.

## Reviewer 2 — the spec against the checklist, the stories and the questions

    You are a READ-ONLY reviewer (tools: read, grep, glob only; edit nothing). … Review the NEW document docs/03-specs/write-path.md (v0.1, a feature spec;
    Draft, with five open questions in section 9 for the product owner) as an adversarial SPEC reviewer. Review against, in this order:
    A. docs/03-specs/release-2-handoffs.md section 2 (checklist L1-L8) — say for each: met / not applicable / not met. Also hand-offs H1, H2, H3, H5, H6, H7, H8;
       does the spec resolve H7 as the owner decided (plan "Owner's answers", addition 1)?
    B. docs/templates/feature-spec.md: all sections present and in the template's spirit? Does section 3 cover error, empty and boundary behaviour (AGENTS.md section 4)?
    C. user-stories.md US-15, US-16, US-17, US-22 to US-26, US-31, US-36, US-37 (AC1 and AC3), US-40, US-38/US-39; NFR S2, S3, S4, S6, S7, W3-W6, Q2; ADR-0001/0004/0005/0006.
       Find: acceptance criteria or NFR rows a write path must satisfy that the spec misses or contradicts; places where it silently changes an Approved document;
       security gaps in the cross-site/content-type design (bypass routes, methods, header handling, an exempt route that should not be exempt, order-of-checks leaks,
       simple-request CSRF types missing, HEAD/OPTIONS, method override headers, CORS preflight).
    D. The questions in section 9 against governance.md ('A question to the owner can be answered as written': what is decided, why it matters, options, a recommendation,
       every new term explained in the question itself). Answerable by someone who has not read the spec? Recommendations not the best option? A question missing or unnecessary?
    E. Gaps: anything an implementing agent would have to guess (list guesses outside section 9).

    Report: numbered findings, each with severity (blocker/important/minor), the exact spec text (quote), the problem and a concrete fix. Say explicitly which of A-E you
    found clean. Be concise; do not rewrite the spec.

(The briefs are copied from the agent's dispatch; an ellipsis marks a long list of files or strings that the original spells out in full — the originals are in the
session transcript. Both briefs say "tools: read, grep, glob only" first, which is the lesson of the opening review, where a brief assumed a shell the reviewer did not have.)
