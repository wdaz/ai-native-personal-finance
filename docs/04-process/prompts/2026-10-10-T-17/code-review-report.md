# T-17 — code review report (Opus 5.5 subagent)

Summary of the report, 8 findings; the subagent changed nothing and decided no design question.

| # | Finding | Outcome |
|---|---|---|
| 1 | The "no Set-Cookie on a refused write" check could not fail: every test used a fresh session, which is never re-issued. | Fixed: `write-refusals.spec.ts` seals a 61-minute-old session, with a re-issued read as the control; shown red with the skip removed from `proxy.ts`. |
| 2 | Nothing checks that `proxy.ts` calls `logRefusal`; only `logRefusal` itself is unit-tested. | Left: the owner chose unit level (plan Q2 (a)). |
| 3 | The proxy matcher skips paths ending in `.png`, `.svg`… even under `/api`, so `DELETE /api/pots/<uuid>.png` would reach a route with no 401, 403 or 415. Latent until T-23 and T-25. | Design question; the owner chose "Fix in T-17" (decision card, 2026-10-10): the matcher's static-file exclusion no longer applies under `api/`; `proxy-matcher.test.ts` and `write-refusals.spec.ts` shown red first. |
| 4 | `handlersOf` missed `export { local as POST }` and re-exports. | Fixed: both forms are read, a re-export from another module is refused; a fixture each. |
| 5 | `checkWriteLimit` can pass concurrent requests at the edge. | Accepted in the plan (D5); no change. |
| 6 | `taken` on a composite constraint names only its first field; none found gives path `[]`. | No change: no composite constraint exists. |
| 7 | `getDb()` throwing, or a method the route does not export (Next's empty 405), answers outside the envelope and without `no-store`. Latent. | Design question, put to the owner with #3. |
| 8 | The lower-case-method test checks Node, not our code. | Left: that is what 7.3 v1.0.3 asks for. |
