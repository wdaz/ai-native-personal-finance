# Review brief (Opus subagent, the `/code-review` skill at "high", read-only)

Invoke the `code-review` skill with "high" on `git diff origin/develop...HEAD` (T-22). Read `AGENTS.md`
first; spec `ui-kit.md` (2.1–2.12, §6, §7), plan `plans/2026-10-10-T-22.md`, `write-path.md` §3.
Constraints: no inline `style` (ADR-0006), the layer rules (ADR-0002), every visible string from `COPY`
mirrored by the appendix, the token mirror. Focus on `Modal`, `ConfirmDeleteDialog`, the delete-flow hook,
the bus, `ActionMenu` and `Menu`'s field variant (no regression of the two list pages), `parseAmountInput`,
`writeAnswer`, `Button`, `Field`, `PageHeader` and the tests. A design question is returned as `DESIGN-Q`,
never chosen. Numbered findings with file:line, severity, a failure scenario and a fix, each verified.

# Report (summary)

No layer, inline-style, token or copy violation; `parseAmountInput` matches 4.1's edge cases; the list
pages' menus are unchanged. (1) should-fix: a tool's abort after the confirm was lost when the delete then
failed, so the tool waited on the person; (2) should-fix: `useNotice`'s id restarted at 1 after a
dismissal, so a later notice skipped the empty-then-fill step; (3) should-fix: §7 rows missing (abort
after confirm; unmount after confirm with 204 and 500; `busy` while a dialog is open); (4) nit: `aborted`
maps to "Can't reach the server"; (5) nit: unmounting after the confirm kept the slot claimed; (6) nit: the
status table and `AMOUNT_MAX` duplicate `tool-result.ts` and `schemas.ts`; (7) DESIGN-Q: `maxLength` 32
truncates a long paste before the parse.
