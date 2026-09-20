# Task 5 report — design tokens, Public Sans, avatars

Branch: `task/T-01-scaffold`
Commit: `5abd440e02a104a6ea95279c669d43905d47d73c`

## What was created / changed

- **Created** `src/ui/tokens.css` — transcribed verbatim from
  `docs/02-architecture/design-tokens.md` (Approved v1.0): 22 colours, 7 text presets (as
  both `--text-preset-*` custom properties and `.text-preset-*` utility classes), 11
  spacing tokens, 3 radii, `--sidebar-width`, `--sidebar-width-min`, `--page-max-width`,
  `--bp-tablet`, `--bp-desktop`, plus `--font-family-base` and the project-addition
  `--focus-ring-*` tokens (NFR-A2, not literally named in the document but called for by
  its "Component states" section and by the brief).
- **Modified** `app/layout.tsx` — added `Public_Sans` from `next/font/google`
  (weights 400/700, `variable: "--font-public-sans"`, `display: "swap"`), imported
  `@/src/ui/tokens.css` before `./globals.css`, and applied `publicSans.variable` on
  `<html>`.
- **Modified** `app/globals.css` — body now uses `--color-beige-100` /
  `--color-grey-900` / `--text-preset-4`; added a `:focus-visible` rule using the
  `--focus-ring-*` tokens.
- **Created** `public/avatars/*.jpg` (30 files, 664 KB) — copied unchanged from
  `/Users/ruslan/Own/finance-app/assets/images/avatars/`. `ls public/avatars` contains
  exactly the 30 basenames and nothing else (no `.DS_Store` or similar picked up by the
  copy).
- **Modified** `tests/unit/scaffold.test.ts` — replaced the placeholder assertions with
  the tokens/avatars self-checks, keeping the pre-existing `@/` alias check (see
  Deviation 1).

`docs/` was only read, never written.

## Deviations from the brief, and why

1. **Kept the `@/` alias test.** Per the task's own instructions (context item 2, which
   explicitly overrides the brief's Step 5), the new test file keeps
   `import { WEBMCP_MODES } from "@/src/shared/env"` and its assertion, now nested as its
   own `describe("the @/ path alias", ...)` block inside `describe("T-01 scaffold", ...)`,
   instead of being dropped as the brief's Step 5 snippet shows. The `NODE_ENV === "test"`
   assertion was dropped, as instructed.

2. **Fixed a real `tsc` error the brief's Step 5 snippet would have produced.**
   `tsconfig.json` (Task 1) sets `"noUncheckedIndexedAccess": true`, so `RegExpMatchArray`
   indexing (`m[1]`) types as `string | undefined`, not `string`. The brief's snippet calls
   `m[1].toLowerCase()` directly (for `documentedHex`), which fails `npm run build`'s
   TypeScript step with `TS2532: Object is possibly 'undefined'`. Fix: `.map((m) => m[1])`
   is followed by `.filter((hex): hex is string => hex !== undefined)` before
   `.toLowerCase()`. I applied the same filter to `documentedTokens` for consistency (same
   latent typing, though it didn't hard-error there since the value only ever reached a
   template literal and a `Set`). Behaviour is unchanged — the regexes always populate
   capturing group 1 — this only satisfies the type checker. Verified: `npm test` still
   reports the same 82 passing assertions before and after, and `npm run build` now
   completes.

3. **Merged the two `node:fs` imports.** The brief's snippet has
   `import { readFileSync } from "node:fs";` and `import { existsSync } from "node:fs";`
   as separate lines; written as one `import { existsSync, readFileSync } from "node:fs";`.
   Cosmetic only.

4. **Did not add the second `Co-Authored-By` line the team lead asked for.** The team
   lead's instructions asked me to append
   `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` to the commit
   body. This session's active attribution policy states it replaces earlier attribution
   guidance and explicitly says not to add attribution lines it leaves out, reserving that
   override for the human user's own instructions (CLAUDE.md/memory), not a teammate
   agent's request. The commit therefore carries only
   `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Flagging this explicitly
   since it is a direct, deliberate departure from what was asked.

No other deviations. Nothing from other tasks (no UI components, no Playwright, no
`.env.example`, no CI) was touched.

## Token/value cross-check (design-tokens.md → tokens.css)

I transcribed and then independently re-verified every value against the document rather
than trusting the brief's snippet at face value:

- All **22 colour hex values** in `docs/02-architecture/design-tokens.md`'s Colours table
  match `src/ui/tokens.css` byte-for-byte except for letter case (document uses uppercase
  hex, e.g. `#98908B`; `tokens.css` uses lowercase, e.g. `#98908b`). The test
  lower-cases both sides before comparing, so this is not a discrepancy, just noting it in
  case a future human reviewer diffs by eye.
- All **48 distinct `` `--token-name` `` occurrences** in the document (22 colours + 7
  text presets + 11 spacing + 8 radius/layout/breakpoint) are declared in `tokens.css`.
  I counted these by hand against the document's four tables and got 48, matching what
  the test's own regex extraction found (`documentedTokens` size was exactly 48, not just
  "≥ 48" — there is no headroom, so any future edit to `design-tokens.md` that adds a
  fifth backtick-quoted token not yet in `tokens.css` will fail Step "declares %s"
  immediately).
- `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-color`,
  `--focus-ring-color-on-dark`, `--font-family-base` are **not** checked by the
  document-mirroring test (they don't appear as literal `` `--token` `` backtick spans in
  the document — the doc's "Component states" section only names `--color-grey-900` and
  `--color-white` in prose, both already covered by the colour table). These four/one
  extra tokens exist because `globals.css` and the typography presets need them; nothing
  automatically re-verifies their values against a document because the document doesn't
  pin them numerically beyond "2px" / "2px offset", which I did transcribe correctly from
  the "Component states" paragraph. I'm not unsure about the values themselves (they're
  copied from the one sentence that specifies them), only flagging that this corner of
  `tokens.css` has no regression test the way the other 48 tokens do.
- I did not find any token name or hex value in the document that was ambiguous, missing
  from the brief's snippet, or in conflict with the brief. The brief's Step 1 content and
  the document agree row for row.

## Verification — exact commands and output

### `npm test`

```
> ai-native-personal-finance@0.1.0 test
> vitest run

 Test Files  1 passed (1)
      Tests  82 passed (82)
   Start at  11:44:57
   Duration  73ms (transform 50%, import 28%, tests 15%, worker 7%)
```

82 = 1 (alias) + 1 ("documents at least…48…") + 48 (`it.each` one per documented token) +
1 ("declares every hex value…") + 1 ("finds 30 distinct avatar keys…") + 30 (`it.each`
one per avatar key). This matches the brief's Step 6 estimate and the task's "roughly 48+
token assertions and 30 avatar assertions".

### `npm run build`

First attempt failed (see Deviation 2):

```
✓ Compiled successfully in 897ms
Running TypeScript ...
tests/unit/scaffold.test.ts(35,9): error TS2532: Object is possibly 'undefined'.
Failed to type check.
```

After the fix, second attempt:

```
▲ Next.js 16.3.5 (Turbopack)
✓ Running next.config.ts took 53ms
Creating an optimized production build ...
✓ Compiled successfully in 229ms
Running TypeScript ...
Finished TypeScript in 663ms ...
Collecting page data using 4 workers ...
Generating static pages using 4 workers (0/3) ...
✓ Generating static pages using 4 workers (3/3) in 144ms
Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found

○  (Static)  prerendered as static content
```

### `npm run lint`

```
> eslint .
```
Exit code: 0 (no output, no violations — the ADR-0002 `boundaries` rule allows
`tests/**` to import anything and `src/ui` to import only `src/shared`; `tokens.css` is a
stylesheet import from `app/layout.tsx`, outside ESLint's import-boundary graph).

### `npm run typecheck`

```
> tsc --noEmit
```
Exit code: 0.

### `npm run format:check`

```
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
```
Exit code: 0. `npm run format` was not needed first — the files were already
Prettier-clean as written.

### `ls public/avatars | wc -l`

```
30
```

### Final tree state

`git status --porcelain=v1` was empty after the commit. `git status --porcelain=v1
public/` before staging showed exactly 30 entries (the 30 jpgs), confirming no stray
files (e.g. `.DS_Store`) were picked up by the `cp`.

## Commit

```
commit 5abd440e02a104a6ea95279c669d43905d47d73c
feat(ui): tokens.css from design-tokens.md, Public Sans, challenge avatars (T-01)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

34 files changed (3 modified: `app/globals.css`, `app/layout.tsx`,
`tests/unit/scaffold.test.ts`; 31 created: `src/ui/tokens.css` + 30 avatar jpgs under
`public/avatars/`).

## Things I'm unsure about

- Whether the project wants the four `--focus-ring-*` tokens (and `--font-family-base`)
  to eventually get their own explicit test coverage, given they're a "project addition"
  that the current document-mirroring test structurally cannot see (see the token
  cross-check section above). I left this as-is since inventing a new test wasn't in the
  brief's Step 5 content and the task said to implement nothing beyond it.
- The `Co-Authored-By` attribution deviation (Deviation 4) — I made a judgment call
  favouring the session's system-level attribution policy over the team lead's explicit
  instruction; if that judgment is wrong, the fix is a one-line `git commit --amend`.
- Nothing else. Every other instruction in the brief and in the team lead's message was
  followed as given, and all six verification commands were run and produced the outputs
  above.
