# Prompt — T-15a: the secret scan ignores inline `gitleaks:allow` comments, permanently

The same background Claude Code session (Opus 5.5) that closed T-16 and split T-15 (PR #68). The
session had explained how a flagged history scan would run on every push. The owner measured the
precondition in the main checkout (commit diffs, `--ignore-gitleaks-allow`: "518 commits scanned", "no
leaks found"), and PR #68 recorded that as a baseline. The owner's messages, verbatim (Azerbaijani), in
order:

    Bunu daimi necə etmək olar? Hazırda edə bilərik?

("How can this be made permanent? Can we do it now?")

    pr 68 merge oluna bilər? Yoxsa gözləyim?

("Can PR #68 be merged, or should I wait?" The agent answered that it could, once the WebKit leg
finished and the draft was marked ready.)

    PR68 merged

The brief the agent worked from:
- Add `--ignore-gitleaks-allow` to the three gitleaks calls in `scripts/secret-scan.sh`: the history
  scan's commit diffs, its commit and tag messages, and the staged scan the pre-commit hook runs.
  Without the staged one, a commit would pass the hook and fail CI.
- Prove the change with tests that fail first, per the DoD. A control shows that gitleaks alone honours
  the comment. Three tests show that the scans no longer do. Each asserts the rule id and not only a
  non-zero exit, because the hook also refuses when gitleaks cannot run.
- Correct the text the change makes false: the hook's false-positive advice and the READMEs.
- Record it as T-15a work done ahead of its plan gate.
- Add no `.gitleaksignore`: that is the owner's decision.

Standing rules: `AGENTS.md` §2 (one change per pull request, conventional commits, the process log, never
fabricate), `docs/04-process/governance.md` (the owner merges).
