### Task 5: Process record and the Definition of Done

**Files:**
- Create: `docs/04-process/prompts/2026-09-22-T-02a-secret-guard.md`
- Create (subagent-driven execution only): `docs/04-process/prompts/2026-09-22-T-02a/` —
  the session's subagent briefs and reports, not diffs (build-workflow §7)
- Modify: `docs/03-specs/backlog.md` (v1.4)
- Modify: `docs/04-process/process-log.md` (append one entry)

**Interfaces:**
- Consumes: the facts of the implementation session (commits, CI run, anything that went
  wrong).
- Produces: the pull request's description, which the owner reviews before merging.

- [ ] **Step 1: Save the prompt**

`docs/04-process/prompts/2026-09-22-T-02a-secret-guard.md`:

```markdown
# Prompt — T-02a Secret guard (Claude Code)

No task prompt was written in advance for T-02a. The planning session began with the
owner's message, verbatim:

    /superpowers:writing-plans t-02a başlayaq

("let's start T-02a"). The agent read AGENTS.md and its reading order, measured the
premises of the backlog row (plan § "Evidence"), wrote
`docs/04-process/plans/2026-09-22-T-02a.md` with the writing-plans skill and stopped at
the plan gate (build-workflow.md §2).

## Owner's replies at the plan gate

2026-09-22, first reply, verbatim:

> 1. bəli
> 2. anlamadım nə istədiyini
> 3. bildiyim qədəri ilə main ilə əvəz olmalıdır.
> 4. yox
> 5. bəli
>
> Hələ icraya başlama. Bunlara əsasən dəyişikliyi et. Gözlə

(1 yes; 2 I did not understand what you want; 3 as far as I know it should be replaced
with `main`; 4 no; 5 yes. Do not start implementing yet; change the plan accordingly;
wait.) The agent applied 1, 3, 4 and 5 to the plan (v0.2) and re-asked question 2 in
plain terms, with the consequence of each answer.

2026-09-22, replies to the re-asked question 2, verbatim:

> Scan hazırda heç nəyi blocklamır?

("Does the scan block nothing right now?") The agent measured the folder and its whole
history without the exemption — nothing found, so nothing would be blocked — and asked
again.

> İstisna qalsın

("Keep the exemption.") Plan v0.3.

<the go-ahead, verbatim with its date>
```

Before committing, replace the last angle-bracket line with the owner's go-ahead,
verbatim.

- [ ] **Step 2: Amend the backlog to v1.4 (owner, questions 1 and 3)**

In `docs/03-specs/backlog.md`, four replacements — each old text occurs exactly once.

Status line — replace `Status: **Approved** (v1.3 — 2026-09-20: T-16 licence steps;` with:

```markdown
Status: **Approved** (v1.4 — 2026-09-22: T-13 `master` trigger removed in T-02a, T-16 scan wording — owner decisions at the T-02a plan gate; v1.3 — 2026-09-20: T-16 licence steps;
```

Changelog line — replace `Changelog: v1.2 (2026-09-20) —` with:

```markdown
Changelog: v1.4 (2026-09-22, owner decisions at the T-02a plan gate) — T-02a removes the stale `master` entry from the CI push trigger (the default branch is `main`), and T-13 keeps the rest of its CI work; T-16's "full-history secret scan as a blocking gate" now names the T-02a `secret scan` check and `npm run secrets:scan`, because a bare `gitleaks git` skips merge commits (43 of 49 commits on 2026-09-22). v1.2 (2026-09-20) —
```

T-13 row — replace ``CI triggers on `main` only;`` with:

```markdown
CI triggers on `main` only (the `master` push trigger was removed in T-02a, owner decision 2026-09-22);
```

T-16 row — replace `Go-public hardening: full-history secret scan as a blocking gate;` with:

```markdown
Go-public hardening: full-history secret scan as a blocking gate — make the T-02a `secret scan` check required in the `main` ruleset and scan with `npm run secrets:scan` (a bare `gitleaks git` skips merge commits);
```

Check: `grep -c "v1.4" docs/03-specs/backlog.md` → `2`; `git diff --stat docs/03-specs/backlog.md`
→ one file, four lines changed.

- [ ] **Step 3: Append the process-log entry**

Append to `docs/04-process/process-log.md` (after the last entry, preceded by `---`),
filling the two agent-owned bullets from what actually happened in the session — write
"none observed" rather than leave them empty:

```markdown
## 2026-09-22 — Phase 5: T-02a secret guard

- **Phase:** 5 — Build the slice (Release 1)
- **Participants:** Owner / Agent (Claude Code, Opus 5)
- **Trigger:** backlog v1.1 placed the secret guard before T-02, because the first real
  `DATABASE_URL` lands there and gitleaks' default rules do not detect it.
- **Prompt(s):** `prompts/2026-09-22-T-02a-secret-guard.md`; plan
  `plans/2026-09-22-T-02a.md`
- **Produced:** `.gitleaks.toml` (`postgres_connection_string`); `scripts/gitleaks.sh`
  (gitleaks 8.30.1, SHA-256 pinned); `scripts/secret-scan.sh`; `scripts/git-hooks/pre-commit`
  installed by `npm prepare`; CI jobs `secret scan` and `npm audit`;
  `tests/fixtures/secret-scan/`; `tests/unit/secret-guard.test.ts` (19 tests, each
  guarantee mutation-checked); CI push trigger `main` only; backlog v1.4 (T-13, T-16).
- **Owner decisions at the plan gate:** T-16 names the `secret scan` check and
  `npm run secrets:scan` (backlog v1.4); the stale `master` push trigger replaced with
  `main` in this PR; `npm audit` reports without blocking; the session prompt saved;
  the `docs/00-discovery/inputs/` exemption kept, as the backlog states.
- **What the agent got right:** measured the backlog's premise before building on it
  (default rules miss both a Neon and a generic Postgres URI); found that the default
  `gitleaks git` never scans merge commits (43 of 49 here) and that `--first-parent`
  misses a branch's add-then-remove, and chose the invocation from those measurements;
  kept the fixtures free of detectable strings instead of exempting their folder.
- **What the agent got wrong or missed:** <from the session; "none observed" if none>
- **Owner changes and reasoning:** _(owner)_
- **Disagreements:** (1) during planning, a reviewer pass proposed path-allowlisting the
  fixture folder; the agent kept the placeholder design because a path allowlist is a
  permanent hole in both gates, and the reviewer agreed once shown that the committed
  fixtures scan clean and the materialised ones fire on every line. (2) The agent proposed
  a blocking `npm audit`; the owner chose reporting without blocking, so that an advisory
  published overnight cannot turn an unrelated pull request red — resolved for the owner
  (AGENTS.md §5). (3) The agent recommended scanning `docs/00-discovery/inputs/` too,
  since nothing there would be blocked (E20) and an exemption hides whatever lands there
  later; the owner kept the exemption the backlog specifies — resolved for the owner.
- **Plan-gate lesson:** question 2 was written for a reader who already knew what a path
  allowlist does, and the owner could not answer it; a plan-gate question should state
  the consequence of each answer in plain terms.
- **Lessons for the process:** a scanner's defaults are part of what it guarantees —
  "full-history scan" meant 43 of 49 commits until the merge commits were measured; and a
  hook without the executable bit fails open with only a hint, so the mode belongs in a
  test.
- **Next:** owner review and merge; T-02 (the first real `DATABASE_URL`).
```

- [ ] **Step 4: Commit and push**

```bash
git add docs/03-specs/backlog.md docs/04-process/prompts/2026-09-22-T-02a-secret-guard.md docs/04-process/process-log.md
# subagent-driven execution only:
git add docs/04-process/prompts/2026-09-22-T-02a
git commit -m "docs(process): T-02a prompt, process-log entry, backlog v1.4

Backlog v1.4 records two owner decisions from the T-02a plan gate: T-02a removed the
stale master push trigger (T-13 keeps the rest of its CI work), and T-16's full-history
scan names the secret scan check and npm run secrets:scan, since a bare gitleaks git
skips merge commits.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
git push
```

- [ ] **Step 5: Write the Definition of Done into the pull request**

Save as the PR body (`gh pr edit --body-file <file>`), each item ticked or marked N/A with
its reason:

```markdown
T-02a — Secret guard. Spec: backlog T-02a row; NFR-S5; ADR-0007. Stories: none (NFR-only
task). Plan: `docs/04-process/plans/2026-09-22-T-02a.md`.

## Scope and traceability
- [x] Names the task, spec sections and stories. Beyond the backlog row, two owner
  decisions at the plan gate: the CI push trigger is `main` only (the stale `master` entry
  was T-13's) and backlog v1.4.
- [x] No Accepted ADR contradicted — ADR-0007's CI list gains two jobs; ADR-0002's
  `scripts/` holds the new tooling.
- [x] Backlog amended to v1.4 (status, changelog line, T-13 and T-16 rows): the
  merge-commit finding changes what T-16's full-history scan must run.

## Code
- [x] TypeScript strict, lint, format, import boundaries pass.
- N/A Clock injection, integer cents, shared Zod schemas and copy, client/server boundary,
  WebMCP placement — no application code in this task.
- [x] The new config guard ships with fixtures that violate it and tests that assert the
  violation is reported: `tests/fixtures/secret-scan/` + `tests/unit/secret-guard.test.ts`
  (19 tests). Mutation-checked: `useDefault = false`, local-host exemption removed, path
  allowlist removed, checksum comparison disabled, `-m` dropped, `--first-parent`,
  shallow guard disabled, `--redact` removed, hook not executable, `prepare` removed —
  each turned its test red.

## Tests (ADR-0003)
- N/A Unit tests for domain/shared/webmcp functions — none added; `domain` coverage
  unaffected.
- N/A API tests — no routes.
- N/A E2E per story, axe, WebMCP polyfill/off — no story, page or tool touched.
- [x] `npm run test:all` green locally; CI green: `lint · typecheck · unit`,
  `secret scan`, `npm audit` (reports without blocking — owner decision).

## Accessibility and design
- N/A Keyboard walkthrough, focus/ARIA, tokens, screenshots — no UI.

## Process
- [x] Process-log entry (2026-09-22 — Phase 5: T-02a secret guard).
- [x] Prompt saved: `docs/04-process/prompts/2026-09-22-T-02a-secret-guard.md`.
- [ ] Owner reviewed and merged (agents never merge).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 6: Mark the PR ready and stop**

Run: `gh pr ready` — then stop. The owner reviews and merges; the agent does not.
