# Build workflow (Phase 5–6) — working with Claude Code

Status: Approved (owner, 2026-09-20; v1.1 same day after T-01)

Claude Code reads `CLAUDE.md` → `AGENTS.md` automatically when started in the repo root, so every session begins with the same context as this document set. The loop below is one task from `docs/03-specs/backlog.md` per session.

## Per task
1. **Start** — in the repo root: `claude`. First message: the task prompt from `docs/04-process/prompts/<date>-<task>.md` (copy the T-01 one as a template). The prompt names the task id, the spec sections, the stories, and asks for a plan first.
2. **Plan gate** — the agent writes the plan with the superpowers `writing-plans` skill (skip `brainstorming`; design is fixed in `docs/`), saved as `docs/04-process/plans/<date>-<task>.md`. **The agent then stops and waits for the owner's reply; no write tool runs before it.** Task prompts end with that instruction explicitly (T-01 lesson: "then implement" was read as authorisation). The owner answers questions; anything not answerable from the docs becomes a spec changelog line, never a guess.
3. **Branch** — `git switch -c task/T-01-scaffold`. Small, conventional commits.
4. **Implement + tests** — per the spec's §7 table; the agent runs `npm run test:all` (or the subset that exists yet) before declaring done.
5. **PR** — description = the Definition of Done checklist, ticked; screenshots at 1440/768/375 for UI tasks; keyboard walkthrough notes.
6. **Review** — owner reviews; optionally a fresh Claude Code session runs `/review` or an adversarial pass on the diff against the spec.
7. **Log** — `docs/04-process/process-log.md` entry (template) and the prompt file saved; the agent drafts the entry, the owner fills "what the agent got wrong" and "owner changes". The session's subagent briefs and reports (not diffs) are copied to `docs/04-process/prompts/<date>-<task>/` on the task branch before the PR.
8. **Merge** — owner merges; CI must be green. Next task.

## Rules of thumb
- If the agent wants to touch a spec, ADR or story, it says so first (AGENTS.md §2).
- Any seed-derived figure in code or tests comes from `scripts/seed-figures.ts`, never typed.
- Do not run `next dev` for E2E; use `next build && next start` (ADR-0003).
- Keep `WEBMCP_MODE=polyfill` locally; native checks are headed and manual.
- Reviews re-run the one or two commands a report leans on; a report is evidence, not proof (T-01 lesson).
- A Provider around a context created in a `"use client"` module must be a real component
  rendered entirely inside that module; a Server Component must never read a property —
  `.Provider` included — directly off a context object imported from one. jsdom unit tests
  cannot catch the resulting crash, since they never cross the real RSC boundary — only a
  `next dev`/`next build` run in an actual browser does (T-11 lesson).
