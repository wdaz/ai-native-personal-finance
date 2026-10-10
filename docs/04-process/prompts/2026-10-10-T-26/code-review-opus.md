# T-26 — the `/code-review` brief and report (Opus subagent, 2026-10-10)

**Brief (summary):** a new, read-only Opus subagent ran `/code-review` on PR #139 (`origin/develop...HEAD`), looking
for behaviour that contradicts `pots.md`, state bugs in `PotsBoard`, tool input or annotation mistakes,
accessibility regressions and E2E tests that could be flaky in Firefox or WebKit. It checked each finding against
the code before reporting.

**Report (findings, as reported):**

1. Blocking — `tests/e2e/webmcp.spec.ts`: the poll expects the six Pots tool names in alphabetical order but
   does not sort the list `getTools()` returns.
2. Important — `MoneyModal`: a 400 whose issues name no `amount` is shown as an error under the amount field,
   which is then focused.
3. Important — `PotForm`: a 400 whose issues name no field clears every error and shows nothing.
4. Nit — `PotsTools`' refresh runs outside the page's transition, so an agent's write shows no `aria-busy`; the
   `PotsBoard` comment says otherwise.
5. Nit — `withRefresh` repeats `BudgetsTools`' version.
6. Nit — `submitForm` would send a POST with no form open (unreachable today).
7. Nit — `MoneyModal` declares types that `src/domain/pots.ts` also exports (ADR-0002 forbids the import).
8. Nit — the `Notice` idle change reaches every page.
9. Nit — `tokenColour` reads `tokens.css` relative to the working directory.

The tools, ADR-0002 and ADR-0006, `PotsBoard`'s modal slot and focus, and the removal of `NOT_YET_BUILT` were
checked and found sound. Verdict: request changes for 1–3.
