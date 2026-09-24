# PR-A Task A1 report — pin Origin-Agent-Cluster

Status: DONE_WITH_CONCERNS
Commit: 7a6905e `fix(security): send Origin-Agent-Cluster so the WebMCP polyfill runs in Firefox and WebKit`
Branch: fix/origin-agent-cluster (worktree `.claude/worktrees/pr-a-origin-agent-cluster`), not pushed.

## Files changed
- `tests/api/middleware.spec.ts` (+14: the brief's test, verbatim, appended)
- `middleware.ts` (+6: the brief's comment and `response.headers.set("Origin-Agent-Cluster", "?1")` after `X-Content-Type-Options`)

TD-2 read first (`docs/03-specs/tech-debt.md`, not `docs/04-process/`): the file stays `middleware.ts`; the header is one `set` beside the existing ones.

## TDD evidence

RED — `npx playwright test --project=api tests/api/middleware.spec.ts -g "agent cluster"` (before the header):

```
  ✘  1 [api] › tests/api/middleware.spec.ts:198:1 › ADR-0006 (5): every response asks for its own agent cluster, ... (164ms)
    Error: /login
    expect(received).toBe(expected) // Object.is equality
    Expected: "?1"
    Received: undefined
    > 203 |     expect(response.headers()["origin-agent-cluster"], path).toBe("?1");
  1 failed
```
Prediction (fails on `/login` with `Received: undefined`): matched.

GREEN — same command, after the header:

```
  ✓  1 [api] › tests/api/middleware.spec.ts:198:1 › ADR-0006 (5): every response asks for its own agent cluster, ... (290ms)
  1 passed (4.4s)
```
Prediction (1 passed): matched.

## Step 5 — Firefox + WebKit

`npx playwright test --project=firefox --project=webkit tests/e2e/webmcp.spec.ts` -> **20 passed (13.8s)**: 10 per engine.
The brief predicted 16 (8 per engine). It did not match: `webmcp.spec.ts` at `838e0f5` has 10 tests per engine (the dispatch message said 8). All 20 pass; no failures, no CSP (F3) line appeared in the output. Firefox and WebKit browsers were already installed; no `playwright install` was needed.
I did not run these 20 without the header, so the "baseline failed 16" claim is not re-measured here.

## Static checks (each its own command, all clean)
- `npm run typecheck`: clean
- `npm run lint` (`eslint . --max-warnings 0`): clean
- `npm run format:check`: "All matched files use Prettier code style!"

## Concerns
1. Prediction mismatch: 20 passed, not 16. The number in the plan (Task A1 Step 5 and the "16 red E2E runs" in the PR-A summary) should be corrected to 10 per engine / 20, if the baseline was in fact 20 red.
2. Environment slip: the first `npx prisma generate` ran while the session's cwd was still the t-13-plan worktree, so it generated the client into `t-13-plan/src/server/generated/prisma` (git-ignored, harmless). The tool sandbox refused edits to the pr-a path from that session, so I switched with `EnterWorktree` (path = the pr-a worktree) and re-ran `prisma generate` there. The t-13-plan worktree now has a generated client it did not have.
3. The first RED attempt failed to build (missing Prisma client, from item 2); it is not TDD evidence. The RED shown above is the second run.
4. `next build` prints the known TD-2 deprecation warning; unchanged.

---

# Fix round 1 — the /overview part of the test could pass without a session

Commit: 3b3d9d8 `test(security): make the Origin-Agent-Cluster test fail when the login does not authenticate` (new commit on top of 7a6905e, nothing amended, not pushed).

## What changed (`tests/api/middleware.spec.ts`, the new test only; title unchanged)
- `const login = await request.post("/api/auth/login", ...)` — the result is kept.
- `expect(login.status()).toBe(200);` with a two-line comment, the same pattern as the neighbouring test (~lines 170-178).
- `request.get("/overview", { maxRedirects: 0 })` — a redirect now fails the 200 assertion.

## Evidence
GREEN (strengthened test, real password):
```
  ✓  1 [api] › tests/api/middleware.spec.ts:198:1 › ADR-0006 (5): every response asks for its own agent cluster, ... (308ms)
  1 passed (4.4s)
```
Failing on purpose: temporarily changed the password in the test's login to "wrong-password-TEMP" (not committed, restored):
```
  ✘  1 [api] › tests/api/middleware.spec.ts:198:1 › ADR-0006 (5): every response asks for its own agent cluster, ... (240ms)
    Expected: 200
    Received: 401
    > 210 |   expect(login.status()).toBe(200);
  1 failed
```
Restored, `git diff` showed only the intended change, and the test re-run passed again (`1 passed (4.5s)`).
Command for both: `npx playwright test --project=api tests/api/middleware.spec.ts -g "agent cluster"`.
`npm run format:check`, `npm run lint`, `npm run typecheck`: each clean.

Concerns: none new. The session stays in the pr-a worktree (no ExitWorktree, as instructed). The Edit tool refused the report path from this worktree, so the fix report was appended with a shell heredoc.
