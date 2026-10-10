# Prompt — T-15b follow-up: merge commits only on `main` and `develop`

The same background Claude Code session (Opus 5.5), after T-15b closed with PR #77 (`e65cfb4`). Its
plan's Q5 ("May `main` take merge commits only?") was still open. The owner's messages, verbatim:

    merge commit deyəndə nə nəzərdə tutulur?

("What is meant by a merge commit?") The agent explained GitHub's three merge methods — a merge commit
keeps the branch's commits and their SHAs; squash writes one new commit; rebase rewrites each commit —
and why a squashed or rebased `develop` → `main` release leaves `develop` without `main`'s commit, so
the next release shows old changes again and can conflict. It offered Q5 again: (a) `main` only, the
recommendation; (b) both branches; (c) no restriction.

    b. heç birinə bir başa push mümkün olmasın.

("b. No direct push to either.")

What the agent did:
- saved both pull-request rulesets (23907266, 24155781) to the session's job directory, set their
  `allowed_merge_methods` to `["merge"]`, and read both back and both branches' effective rules;
- showed "no direct push" from the read-back (`pull_request`, `non_fast_forward`, `deletion`, no bypass
  actor), not from a push attempt;
- wrote `governance.md` v1.7, the deploy runbook's step 10, backlog v1.55, the process-log entry and
  this record, on `task/T-15b-merge-commits` from `origin/develop`.

Standing rules: `AGENTS.md` §2, `governance.md` (the owner merges; settings change only on the owner's
word — T-15b plan Q6a).
