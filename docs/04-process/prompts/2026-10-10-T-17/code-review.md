# T-17 — code review brief (Opus 5.5 subagent, `governance.md`)

Saved as sent. The subagent reads; it does not edit, and it decides no design question
(a design question is returned to the owner, `governance.md`, "Design questions are decided by the designer").

> Review the diff of branch `claude/project-thread-sf1ny5` against `origin/develop` in this repository
> (`git diff origin/develop...HEAD`), the implementation of T-17 (`docs/04-process/plans/2026-10-10-T-17.md`,
> specs `docs/03-specs/write-path.md` v1.0.3 §2.2–2.12, §6, 7.1, 7.3, 7.4). Read only; change nothing.
> Look for: a place where the code differs from the spec's order of work or status codes; a path where a
> write is refused but a session cookie is re-issued; an error body that is not the `ErrorEnvelope`; a
> test that cannot fail (asserts nothing the code controls); `new Date()` in server business code; a
> runtime import of Zod or `schemas.ts` in `proxy.ts` or `src/server/write-rules.ts`; a race in
> `checkWriteLimit`; anything that makes the proxy's write predicate and the route-table guard disagree.
> Report each finding as: file:line, what is wrong, a concrete input that shows it, and your confidence.
> Do not report style. Say plainly if you found nothing.
