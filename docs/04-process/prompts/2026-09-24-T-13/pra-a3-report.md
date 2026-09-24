# PR-A Task A3 report — ADR-0006 amendment (5), SPEC v1.0.5, process-log

Worktree: `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/pr-a-origin-agent-cluster`, branch `fix/origin-agent-cluster`. Not pushed, no PR.
Commit: `3cf996f` docs(adr): propose ADR-0006 amendment (5), Origin-Agent-Cluster (one commit for ADR + spec + process-log; both attribution lines present).

## Files changed (3 files, +124 -5)

- `docs/02-architecture/adr/0006-auth-and-session.md`
  - Line 3: Status line now says `**Accepted** (amended 2026-09-24; amendment (5) proposed, not yet accepted)`.
  - New bullet `Amendment 2026-09-24 (5) — **Proposed by the agent, awaiting the owner's acceptance**` inserted as the FIRST amendment bullet (before (4)): the amendment list is newest-first ((4) precedes (3)), so this matches the file, not the brief's "after (4)". Text is the brief's, plus one sentence naming `middleware.ts` / `tests/api/middleware.spec.ts` and a pointer to SPEC v1.0.5.
  - Decision `Headers:` bullet ends with `` `Origin-Agent-Cluster: ?1` (2026-09-24 (5) amendment, proposed). ``
- `docs/03-specs/webmcp-tools.md`
  - Status line: `**Approved** (v1.0.5 — ... **proposed by the agent, awaiting the owner's approval**; v1.0.4 — ...`.
  - Changelog: new `v1.0.5 (2026-09-24, T-13 plan finding F1 — proposed by the agent, awaiting the owner's approval)` entry placed first in the changelog run.
  - §2.2, after the `off` bullet: the `originAgentCluster` bullet (verbatim from the brief, plus "(v1.0.5)").
  - §2.2, after the `ready` bullet: the `webmcpError` bullet (verbatim, plus "(v1.0.5)").
  - §2.7 `unavailable` row: `off, import failed, **or every tool registration of the page was rejected**`.
- `docs/04-process/process-log.md`: new entry appended at the end (`## 2026-09-24 — Phase 5: PR-A, Origin-Agent-Cluster for Firefox and WebKit (T-13 plan findings F1–F3)`), template fields in order, plus one extra "What was found" and one "Assumption to confirm" field.

## Deviations

1. Spec status: the brief says "bump the version as v1.0.3/v1.0.4 did". Those two were owner-accepted; v1.0.5 is not, and AGENTS.md says only the owner marks a document Approved. So the status line keeps `Approved` (the document's existing state) but labels v1.0.5 "proposed by the agent, awaiting the owner's approval", in both the status line and the changelog entry. The owner should drop those words when accepting.
2. ADR status line: added "amendment (5) proposed, not yet accepted" (not in the brief) so the header does not read as fully accepted.
3. ADR (5) placement: first, not after (4) (see above).
4. Process-log figures, as the lead asked: `webmcp.spec.ts` 10 tests per engine at `838e0f5`, 20 passed with the header, 11 per engine after A2 (33 on three engines); the 16 red (8 per engine) is stated as the plan's earlier measurement, NOT re-measured in PR-A, and the 8-vs-10 difference stated as unexplained. Also recorded: A1's test strengthened after review (login 200 asserted, `maxRedirects: 0`, failed on purpose with a wrong password), A2's hardening commit `38cd59c` with its two mutations, the deferred `clearFailure()`-does-not-notify note, the "a connected model" assumption, and Lessons (three-engine `test:all` / "Chromium only" ≠ DoD; plus three extra: ready-flag semantics, plan counts drifting, header test must assert the session and not follow redirects).
5. The process-log entry was appended with `cat <tmp file> >> process-log.md` (the file was drafted with Write in `$CLAUDE_JOB_DIR/tmp`), because Edit calls were refused mid-task (see Environment).

## Checks (run in the pr-a worktree; outputs copied)

- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run typecheck`: `tsc --noEmit`, no output (clean)
- `npm run lint`: `eslint . --max-warnings 0`, no output (clean)
- `npm test`: `Test Files 71 passed (71)`, `Tests 881 passed (881)` (matches the expected 881)

Docs are prettier-ignored; no TS file was touched in A3.

## Environment problem worth knowing (the controller may want to look)

The session's working directory kept flipping between `pr-a-origin-agent-cluster` and `t-13-ci-hardening` (another agent in the same session evidently calls `EnterWorktree` on the latter). Effects seen: Edit calls refused ("isolated in t-13-ci-hardening"); two Bash calls (`git status --short`, a first `git commit`) actually ran in `t-13-ci-hardening`. Nothing was changed there: the first commit attempt reported "no changes added to commit", the second "nothing to commit, working tree clean". To make the commit safe against the race I used a pathspec commit (`git commit ... -- <the three docs>`), which can only ever commit those three files. `git status` observed in the t-13-ci-hardening tree showed another agent's staged work (ci.yml, package.json, coverage-gate files) — untouched by me. One earlier `git add <3 docs>` ran in an unknown one of the two trees; the commit (`3cf996f`) contains exactly the three docs, so if it ran in the wrong tree it was a no-op.
`git log -2 --stat` in the pr-a worktree confirms `3cf996f` on top of `38cd59c`, 3 files changed.
