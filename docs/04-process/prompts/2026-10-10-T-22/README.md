# T-22 — prompts and briefs

T-22 was built in one cloud session from the project thread "T-22". The coordinator's brief was "build
T-22 the same way T-17 to T-21 were done", and it is not a document of the repository. The plan
`plans/2026-10-10-T-22.md` raised no question for the owner, so nothing went to the coordinator session at
the plan gate.

One read-only review ran on the diff before the pull request left draft, under the owner's rule of
2026-10-10 (governance v1.15: Copilot review is off for `develop`; every pull request is reviewed with the
`/code-review` skill on Opus):

- `code-review-opus.md` — the brief of an Opus subagent running the `/code-review` skill at "high", and
  a summary of its report.
- `code-review-handling.md` — each finding and what was done.

No design question needed the designer: the designer's changelog §27 had drawn every part. The review's
one `DESIGN-Q` (the amount field's `maxLength`) is answered by the spec itself (2.5, 4.4), see the handling.
No page uses the parts yet, so there is no visual difference from the drawing to record.
