# Brief — the opening's review (T-15d, pull request #85)

Dispatched by the agent to one read-only reviewer subagent (`feature-dev:code-reviewer`, model `opus`; read, grep and
glob only, as `governance.md` v1.1 and v1.3 require). Sent after commits `a1aaaf5` (the tooling) and `6825281` (the
documents) on `task/T-15d-open`.

    You are a READ-ONLY reviewer (no write tools; do not run git commands that change anything, do not edit).
    Repository worktree: <the planning worktree> on branch task/T-15d-open. Review commit a1aaaf5 (`git show a1aaaf5` is
    read-only and allowed) plus the PRD change in commit 6825281 (docs/01-requirements/prd.md, section 5 'Release 2').

    What changed: scripts/traceability.ts (CI check that every story id US-xx of the release being built AND of every
    earlier release is named in a test title) was made release-aware: RELEASE_BEING_BUILT constant (1), storyListPath(n),
    storySentence(prd, release) regex, releaseStoryIds(prd, release), listedReleases(prd), cumulativeStoryIds(prd, upTo),
    run(root, write, built). tests/unit/traceability.test.ts has new tests. docs/03-specs/release-2-stories.txt is
    generated. Context: docs/04-process/plans/2026-10-04-T-15d.md (plan, D3 and Task O3).

    Find real defects only. Focus on: (1) the `storySentence` regexes — Release block end, the sentence terminator, `\b`
    after the release number, a `Stories:` label appearing earlier in a block, CRLF files, a period inside a sentence,
    Release 1's real sentence in prd.md and Release 2's new one followed by a *Consequence (v1.3):* paragraph that names
    US-04 and US-37 — prove with the actual text that neither is wrongly included; (2) `listedReleases` /
    `cumulativeStoryIds` ordering and dedup; (3) `run()` drift logic: every listed release file is held to the PRD even
    if not being built; a missing file; the --write output; the unchanged success message at built=1; (4) whether any new
    test cannot fail (assertions that pass vacuously) or whether the file now holds a story id in a real test title of
    its own; (5) accuracy of claims in docs/03-specs/release-2-handoffs.md, the ADR-0003 clarification and backlog.md
    v1.58 row T-15d against the code and files (check every number and file name). You may run read-only commands such as
    `npx tsx -e` or `npx vitest run tests/unit/traceability.test.ts`, but do not modify files.

    Report: a numbered list of findings, each with file:line, the failing input or scenario, and severity (blocker /
    important / minor). Say explicitly if you found none in an area. Be concise; quote exact text.

What the agent noticed afterwards: the reviewer's tool set had no shell (the `feature-dev:code-reviewer` agent lists
Glob, Grep, LS, Read and web tools), so the command line in the brief could not be followed; the report says so. A
later brief for a reviewer that must run commands names a type that has a shell and keeps it read-only by the brief.
