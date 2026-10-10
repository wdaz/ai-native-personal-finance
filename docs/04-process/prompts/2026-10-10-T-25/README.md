# T-25 — prompts and briefs

T-25 was built in one cloud session from the project thread "Release 2 build T-25". The coordinator's brief
was "implement T-25 from the backlog; T-24 runs in parallel, do not touch its files", and it is not a document
of the repository. The plan `plans/2026-10-10-T-25.md` raised no question for the owner, so nothing went to
the coordinator session at the plan gate.

One read-only review ran on the diff before the pull request left draft, under the owner's rule of
2026-10-10 (governance v1.15: Copilot review is off for `develop`; every pull request is reviewed with the
`/code-review` skill on Opus):

- `code-review-opus.md` — the brief of an Opus subagent running the `/code-review` skill, and a summary of
  its report.
- `code-review-handling.md` — each finding and what was done.

Nothing in this task is drawn (no page, no component), so there is no visual difference from the design.
