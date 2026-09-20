# Task 8 + 9 Implementation Report

## Overview

Implemented Task 8 (README "Run locally" section) and Task 9 (minimal GitHub
Actions CI workflow) of the T-01 scaffold, as one batch, two separate commits.
Both consume only the scripts already committed by Tasks 1–7
(`package.json`); no script name was invented.

## Task 8 — README.md

### Changes made (brief steps 1–4)

1. **Status line** replaced: "Phase 0 — skeleton" → "Phase 5 — Build the
   slice (Release 1)" blockquote, exact text from the brief. Cross-checked
   against `docs/04-process/roadmap.md`, which independently confirms
   "Current phase: **5 — Build the slice**" — the brief's text is accurate,
   not just verbatim.
2. **"Run locally" section** added immediately after "## The phases" and
   before "## Inputs that already exist": intro sentence (Node 26 /
   `.nvmrc`, Postgres from T-02), a 3-command `bash` block (`npm ci`,
   `npm run dev`, `npm run test:all`), a sentence on `test:all` and
   ADR-0003, the 7-row command table, and the `.env.example` →
   `.env.local` instruction.
3. **Assets bullet** added to "Inputs that already exist": a new third
   bullet, after the Figma bullet, about `public/avatars/` (SPEC-overview
   §4.5). Verified `public/avatars/` exists (added in commit `5abd440`).
4. **`apps/` row** replaced with
   `` | `app/`, `src/`, `prisma/`, `tests/` | Application code, laid out per ADR-0002 | You are building | ``.

Every other line of `README.md` is untouched (see the diff in Commit
Details below — 4 files touched, all inside the 4 steps above).

### Deviation / judgment call — worth flagging

`task-8-brief.md`'s Step 2 code fence is malformed: it opens with
` ````markdown ` (4 backticks), but the line that reads ` ```` ` right after
the `bash` sub-block (brief line 35) is *also* 4 backticks, which — by
CommonMark's "closing fence ≥ opening fence length" rule — closes the outer
block early. A second, dangling 4-backtick line follows the table and the
`.env.example` sentence (brief line 53), closing nothing. Taken literally,
only the heading + intro + bash block would be "inside" the block; the
sentence about `test:all`, the whole command table and the `.env.example`
instruction would fall "outside" it.

I treated this as an authoring mistake in the brief's own nested-fence
formatting, not as an instruction to drop that content. Reasons: (a) the
step's own title is "Add the **"Run locally" section**" (singular, one
cohesive section); (b) the Interfaces line promises "a section a reader
with no context can follow" — the table and the `.env.example` line are
exactly the kind of content that promise requires; (c) there is no
plausible reading where a ready-made 7-row command table and an env-file
instruction are meant as throwaway narrative in the brief itself rather
than README content. I included the full block, heading through "Every
variable names the ADR or spec that defines it.", verbatim, and preserved
the brief's own line-wrapping (it already wraps at ~73–88 columns, close
to the rest of the README's ~73–79-column prose; `format:check` does not
police `README.md`, so I did not re-wrap by hand on top of the brief's own
wrapping). Flagging this for the team lead / reviewer in case the intended
cut was narrower than what I built.

Step 3's fence has the same 3-vs-4-backtick mismatch (open 3, close 4) but
it is not ambiguous — the enclosed content is exactly two lines and there
is nothing after the fence to wonder about.

## Task 9 — `.github/workflows/ci.yml`

Created new file, content extracted byte-for-byte from the brief (`sed -n
'18,54p'` on the brief file, not retyped), including the `·` (U+00B7)
middle dot in the job's `name:` field. One job (`verify`): checkout →
`actions/setup-node@v5` with `node-version-file: .nvmrc` and `cache: npm`
→ install → lint → format check → typecheck → unit. No other job, no PR
template, nothing from ADR-0007's fuller pipeline — those are T-05/T-06/
T-13 per the backlog, as instructed.

No deviations on this task; the brief's fence was clean (single ` ```yaml
… ``` `, no nesting).

## Verification Commands and Output (verbatim)

### Task 8, Step 5 — script-existence check
```
$ node -e "const s=require('./package.json').scripts; for (const k of ['dev','build','start','lint','format:check','typecheck','test','test:api','test:e2e','test:all']) if(!s[k]) throw new Error('missing '+k); console.log('all scripts present')"
all scripts present
```

### Task 9, Step 3 — workflow sanity check
```
$ node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/ci.yml','utf8');if(!/^name: CI$/m.test(s)||!/npm ci/.test(s))throw new Error('workflow looks wrong');console.log('workflow ok')"
workflow ok
```

### Task 9, Step 2 / team-lead verification — lint, format:check, typecheck, test

```
$ npm run lint
> ai-native-personal-finance@0.1.0 lint
> eslint .
EXIT: 0
```

```
$ npm run format:check
> ai-native-personal-finance@0.1.0 format:check
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
EXIT: 0
```

```
$ npm run typecheck
> ai-native-personal-finance@0.1.0 typecheck
> tsc --noEmit
EXIT: 0
```

```
$ npm test
> ai-native-personal-finance@0.1.0 test
> vitest run
 Test Files  1 passed (1)
      Tests  96 passed (96)
   Duration  74ms
EXIT: 0
```

`format:check` passing confirms `README.md` was not flagged (it is
Prettier-ignored, per the dispatch's context note) and that the new
`ci.yml` needed no reformatting.

I deliberately did **not** run `npm run test:api` or `npm run test:e2e` —
neither brief's own verification steps nor the team lead's requested
verification list call for them, and Task 7's report flagged a port-3000
collision risk from running E2E concurrently with other agents in this
shared worktree. Skipping them avoids that risk entirely for this task.

### Final read-back — every command in the README section is a real script

Commands appearing in the new "Run locally" section: `npm ci`, `npm run
dev`, `npm run test:all`, `npm run lint`, `npm run format:check`, `npm run
typecheck`, `npm test`, `npm run test:api`, `npm run test:e2e`, `npm run
build`, `npm start`. Cross-checked against `package.json` — all eleven
resolve to a real script (`test` and `start`/`build` via the bare-command
form). None invented; none from the disallowed list.

## Commit Details

1. **Task 8** — SHA `47327e3f34d6d8a8d8de733dffe97c977bdbed49`
   Message: `docs(readme): Run locally section and ADR-0002 layout row (T-01)`
   Staged explicitly: `README.md` only (`git add README.md`, not `-A`).
   Stat: 1 file changed, 32 insertions(+), 4 deletions(-).

2. **Task 9** — SHA `093129004d67f5c9e21e6dac21683bfa086b00fd`
   Message: `ci: minimal pipeline — install, lint, typecheck, unit (T-01)`
   Staged explicitly: `.github` (`git add .github`, not `-A`).
   Stat: 1 file changed, 37 insertions(+) (new file).

Both commits carry `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
`git status --short` is clean after both commits. Neither commit touched
`docs/`, and `.superpowers/sdd/2026-09-20-T-01/progress.md` was left alone
(it reads as the team lead's own log, not an implementer-owned file).

## Test Summary

`npm run lint`, `npm run format:check`, `npm run typecheck` → exit 0;
`npm test` → 96/96 passing; both brief-specified sanity checks printed
their expected exact strings (`all scripts present`, `workflow ok`).

## Concerns

1. **Task 8 Step 2 fence ambiguity (see Deviation above).** I'm confident
   in the reading I used (whole section, heading through the
   `.env.example` sentence, is real README content), but it required
   judgment rather than a literal parse of the brief's own fences, so I'm
   flagging it explicitly rather than silently resolving it.
2. Everything else — commands, scripts referenced, file scope, commit
   messages — matches the briefs and the dispatch's context notes exactly;
   no other open questions.
