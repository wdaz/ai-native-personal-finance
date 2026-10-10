# Brief — transactions review 2, the spec against the checklist, the stories and the questions (T-15d, S2)

As dispatched after `transactions.md` v0.1 (`60aab24`). Subagent type `feature-dev:code-reviewer`, model `opus`, tools read, grep and glob only (`governance.md` v1.1, v1.3).

    You are a READ-ONLY reviewer (tools: read, grep, glob only; edit nothing). Repository worktree = your current working directory, branch task/T-15d-spec-transactions, commit 60aab24. Review the NEW document docs/03-specs/transactions.md (v0.1, a feature spec for the Transactions page of Release 2; Draft, with two open questions in section 9 for the product owner) as an adversarial SPEC reviewer. A separate reviewer checks its facts; you check its design and completeness.

    Review against, in this order:
    A. docs/03-specs/release-2-handoffs.md section 2 (checklist L1-L8) — say for each: met / not applicable / not met, with the spec text that shows it. Section 1: does the spec resolve what it claims of H3 and H9, and is the new H11 row right and complete (everything the spec defers to the build task that needs a mirrored change)?
    B. docs/templates/feature-spec.md: all sections present; behaviour numbered so tests can cite it; section 3 covers error, empty, loading and boundary states (AGENTS.md section 4); every acceptance criterion of US-09, US-10, US-11, US-12, US-13 and the receiving side of US-19 (docs/01-requirements/user-stories.md) has a row in section 7 at the level the PRD's M2 asks for (UI stories by E2E).
    C. Correctness of the design an implementing agent will build:
       - the URL contract (2.2) and the lenient page / strict API split (2.3): ambiguities, a case that two readers would implement differently, a conflict with US-39 AC2 (the tool returns what the UI shows), with docs/03-specs/write-path.md, or with docs/03-specs/webmcp-tools.md;
       - the sort keys (2.4) against US-11 AC1 — is "then id" a sound final key; is the spec's reading for Oldest/A to Z/Z to A/Highest/Lowest defensible and stated as a reading;
       - the search field's debounce, history (replace vs push) and "the field owns its text" (2.5): races, Back/Forward, a slow answer, focus;
       - the Menu (2.8) and the pagination (2.7, 2.11) against WAI-ARIA practice (listbox vs menu button pattern, aria-activedescendant with focus on the listbox, Tab behaviour, aria-current, a live status line, the two DOM lists toggled by CSS, focus when a button disappears) and against US-32/US-34 and NFR-A4/A7;
       - the table (2.9): a real table restyled into cards below 768 px with explicit roles; a hidden caption; the tablet column widths; truncation;
       - Next.js 16 App Router specifics: searchParams as a Promise; server components re-rendering on router.push/replace; useTransition pending state; error.tsx; no-store on the route; anything that will not work as written.
    D. The two questions in section 9 against docs/04-process/governance.md v1.8 ("A question to the owner can be answered as written": what is decided, why it matters, the options, a recommendation, every new term explained inside the question). Is each answerable by someone who has not read the spec? Is a recommendation not the best option? Is any question missing (a decision the spec makes that the owner should own — e.g. a departure from the design, a new copy string, a new token) or unnecessary (something the agent may decide)? Q1 says "Six are new" — count them.
    E. Gaps: anything an implementing agent would still have to guess, outside section 9.

    Report: numbered findings, each with severity (blocker/important/minor), the exact spec text (quote), the problem and a concrete fix. Say explicitly which of A-E you found clean. Be concise; do not rewrite the spec.
