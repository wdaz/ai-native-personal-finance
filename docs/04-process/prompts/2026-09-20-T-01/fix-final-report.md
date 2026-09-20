# T-01 — final review fix wave

Branch `task/T-01-scaffold`, worktree `.claude/worktrees/T-01-scaffold`.
Status: **DONE_WITH_CONCERNS** (all ten original findings plus addendum A–C applied;
three notes below; D left untouched as instructed).

## Commits

| SHA | Message |
|-----|---------|
| `c3690e4` | `chore(lint): enable the TypeScript rules and close the Prisma holes (T-01)` |
| `292a50c` | `ci: trigger on master as well, and document the Playwright install (T-01)` |
| `47916be` | `fix(ui): guard the font fallback and correct the token comments (T-01)` |
| `3d7d5f2` | `test(unit): compare every token to its documented value (T-01)` |
| `b8705a0` | `test(unit): prove the ADR-0002 boundary rules still fire (T-01)` |
| `2383490` | `docs: README matches the tree, and record why allowScripts must stay (T-01)` |
| `b4e9498` | `test(unit): assert public/avatars holds nothing the seed omits (T-01)` |
| `d90dacf` | `chore(lint): keep Prisma out of src/shared too (T-01)` |
| `a5df5d4` | `docs(lint): correct what allowScripts actually does (T-01)` |

`2383490` and `b4e9498` carry addendum items A, B and C; `d90dacf` is the follow-up
`src/shared` decision.

---

## Important 1 — no TypeScript lint rules were active → fixed (`c3690e4`)

`eslint.config.mjs` now imports `eslint-config-next/typescript` and spreads it directly
after `...next`; `eslint-config-prettier` is still last in the array.

`npx eslint --print-config src/shared/env.ts` before: 19 `@typescript-eslint/*` entries,
all at severity 0. After: 39 entries present, **20 active** — 18 at error and
`no-unused-vars` / `no-unused-expressions` at warn (which `--max-warnings 0` from Minor 8
turns into build failures).

**`npm run lint` surfaced no violations in the repository's own code**, so nothing was
silenced and no rule was disabled. The 20 active rules are pinned by a new test
(`tests/unit/boundaries.test.ts`, "has the typescript-eslint rules enabled"), which lints
a fixture containing an unused local and an explicit `any` and asserts both are reported.
Commenting out `...nextTypescript` fails that test.

## Important 2 — CI triggered on a branch that does not exist → fixed (`292a50c`)

`.github/workflows/ci.yml` now has `branches: [main, master]` with a one-line comment
recording that ADR-0007 names `main` while the repository currently uses `master`. The
branch was **not** renamed.

## Important 3 — "Run locally" broke on a clean clone → fixed (`292a50c`)

`npx playwright install --with-deps chromium firefox webkit` added to the `bash` block,
followed by one sentence explaining it is a one-off after the install and naming the
failure it prevents. Wrapped by hand at 78 columns (the two prose lines are exactly 78);
Prettier still ignores the root `README.md`, so nothing was reformatted.

## Important 4 — the tokens test checked names, not values → rewritten (`3d7d5f2`)

`tests/unit/scaffold.test.ts` now parses the document's three tables and compares each
token against **its own** documented value:

- **Colours** — `| \`--color-x\` | Name | \`#HEX\` | …` → the declared value must equal that
  hex, case-insensitively. 22 tokens.
- **Spacing, radii, layout, breakpoints** — `| \`--token\` | 8px |` and the three-column
  variant → the declared value must equal that px string. 19 tokens.
- **Typography** — `| \`--text-preset-1\` | Text Preset 1 | 700 | 32px | 120% |` → the
  declared `font:` shorthand is parsed with
  `/^(\d+) ([\d.]+)rem \/ (\d+%) var\(--font-family-base\)$/` and checked as weight,
  `px / 16` rem and line height, so the owner-approved px→rem conversion is asserted
  rather than assumed. 7 tokens.

The values are read from a map of declarations built after stripping CSS comments, so a
value mentioned in prose cannot satisfy a check.

Count assertions kept and strengthened: the ≥ 48 documented-token count stays, and a new
test asserts `22 / 7 / 19` per table **and** that every documented token name is covered
by one of the three parsers — a fourth table added to the document fails the suite until
a parser is written for it, rather than going silently unchecked.

Each token is now its own `it.each` case, so a run reports every mismatch instead of
stopping at the first (this also replaces the old single-`it` `for` loop over the hexes).
The other three `describe` blocks (path alias, avatars, `.env.example`) are unchanged and
still pass.

### Mutation proof

Each mutation was applied to `src/ui/tokens.css` alone, `npm test` run, then
`git checkout -- src/ui/tokens.css`.

| Mutation | Result |
|----------|--------|
| `--color-green: #277c78` ↔ `--color-red: #c94736` | **2 failed / 109 passed** — `declares --color-green as #277c78`: `expected '#c94736' to be '#277c78'`; `declares --color-red as #c94736`: `expected '#277c78' to be '#c94736'` |
| `--spacing-50: 4px` → `400px` | **1 failed / 110 passed** — `declares --spacing-50 as 4px`: `expected '400px' to be '4px'` |
| `--text-preset-1: 700 2rem …` → `700 3rem …` | **1 failed / 110 passed** — `declares --text-preset-1 as the documented font`: `expected 48 to be 32` (the rem→px conversion) |
| `--sidebar-width: 300px` → `999px` | **1 failed / 110 passed** — `declares --sidebar-width as 300px`: `expected '999px' to be '300px'` |

After the final restore: `git diff -- src/ui/tokens.css` = 0 bytes, `git status` clean,
suite back to 111 passed. The four mutations were run twice — once when the rewrite
landed (suite at 97) and once against the final suite (111) — with identical failures
both times; the counts above are the final run.

## Important 5 — Node version contradiction → fixed (`c3690e4`)

`package.json` `engines.node` is now `">=26"`, matching `.nvmrc` (26), the README and CI.

`@types/node` **does** have a major matching Node 26 (latest `26.6.2`), so the dependency
was bumped from `^24.13.6` to `^26.6.2` and installed; `package-lock.json` updated.
`npm run typecheck` is clean on it.

## Important 6 — nothing guarded that the boundary rules fire → added (`b8705a0`)

**Approach.** `tests/fixtures/boundaries/` holds deliberately illegal source files with a
`.ts.fixture` extension. That extension is not `.ts`, so `eslint .`, `tsc --noEmit`,
Prettier's directory walk and Vitest's `include` all skip them — no change to
`.gitignore`, `tsconfig.json` or the lint config's `ignores` was needed.
`tests/unit/boundaries.test.ts` constructs `new ESLint({ cwd: repoRoot })` and calls
`lintText(code, { filePath })` with a `filePath` that says where the code *pretends* to
live (`src/domain/…`, `src/shared/…`, `app/…`, `src/ui/…`). That path is the entire input
to the plugin's layer classification, so the fixtures exercise the shipped
`eslint.config.mjs`, the real `tsconfig.json` alias and the real resolver — not a copy.

**Import targets.** `boundaries/dependencies` classifies an import by the path it
*resolves to*, and an import that does not resolve is treated as external, which every
policy allows. `src/server` and `src/domain` contain no modules yet (T-02/T-04 add them),
so the fixtures import the only files those folders hold — `src/server/README.md`,
`src/domain/README.md` — as side-effect imports. This was verified to classify correctly.
The failure mode is loud: delete one of those targets and the rule stops firing and the
test fails. The test asserts the three targets exist as separate cases so that failure is
legible, and `tests/fixtures/boundaries/README.md` records that they should be repointed
at real modules once those exist.

**Cases covered** (rule id asserted as the complete message list, message asserted by
substring so ESLint's own wording can change):

| Fixture, linted as | Rule | Message fragment |
|---|---|---|
| `src/domain/imports-server-relative.ts` | `boundaries/dependencies` | ADR-0002: domain must not import server. |
| `src/domain/imports-server-alias.ts` (`@/` alias) | `boundaries/dependencies` | ADR-0002: domain must not import server. |
| `src/shared/imports-domain.ts` | `boundaries/dependencies` | ADR-0002: shared must not import domain. |
| `app/(app)/overview/imports-prisma.ts` | `no-restricted-imports` | only src/server may import Prisma |
| `app/api/imports-prisma-edge.ts` | `no-restricted-imports` | only src/server may import Prisma |
| `src/ui/imports-prisma.ts` | `no-restricted-imports` | only src/server may import Prisma |
| `src/domain/uses-new-date.ts` | `no-restricted-syntax` | ADR-0005: inject a Clock … new Date() |
| `src/domain/uses-date-now.ts` | `no-restricted-syntax` | ADR-0005: inject a Clock … Date.now(). |

Plus a **negative control** (`domain` → `shared` via `@/src/shared/env`, must report
nothing — otherwise a config that errored for an unrelated reason would still pass), and
the typescript-eslint check from Important 1.

**All three historic regressions were re-introduced and each fails the suite:**

| Re-introduced regression | Result |
|---|---|
| `...nextTypescript` commented out | 1 failed / 12 passed — "has the typescript-eslint rules enabled" |
| element pattern `src/domain/**` → `src/domain/**/*` | 3 failed / 10 passed — all three `boundaries/dependencies` cases |
| `node_modules/eslint-import-resolver-typescript` renamed away | 6 failed / 7 passed — the alias case, `shared → domain`, all three Prisma cases, and the negative control |

Each was reverted afterwards (`git checkout -- eslint.config.mjs`; resolver directory
restored); `git status` clean.

## Minor 7 — Prisma restriction holes → fixed (`c3690e4`)

The `paths` entry was replaced with a `patterns` group
`["@prisma/client", "@prisma/client/**", "**/prisma/**", "prisma/*"]`, and the config
object's `files` now lists `app/**`, `src/domain/**`, `src/ui/**` and `src/webmcp/**`.
`@prisma/client/edge` is caught in all four. `src/server` is unaffected.

`@prisma/client/**` was used rather than the `@prisma/client/*` named in the finding: it
is a strict superset, so deeper entry points such as `@prisma/client/edge/index` are also
covered.

## Minor 8 — warnings could not fail the build → fixed (`c3690e4`)

`lint` and `lint:fix` both take `--max-warnings 0`. Nothing was surfaced: the run is
clean at 0 warnings.

## Minor 9 — dead comment → fixed (`47916be`)

The `tokens.css` header no longer claims the breakpoints appear inside `@media`
conditions. It now says they are exported as custom properties for JS and documentation,
and that a media query must repeat the literal value because custom properties are not
valid in a media-query condition.

## Minor 10 — fragile font fallback → fixed (`47916be`)

`--font-family-base: var(--font-public-sans, ui-sans-serif), ui-sans-serif, system-ui,
sans-serif;` with a comment explaining that without the inner fallback a missing
`next/font` class makes the whole declaration invalid at computed-value time, taking every
`font:` shorthand — size and weight included — with it.

## Smaller ledger items

- **Hex loop stopping at the first mismatch** — replaced wholesale by the per-token
  `it.each` rewrite in Important 4; every mismatch is now its own failing test.
- **px → rem rationale** — recorded in the `tokens.css` header: the document states px,
  the presets are written as rem at the 16px default so a reader's font-size preference
  scales the type, and everything else stays in px because it is a box measurement.
- **`.env.example` reverse assertion** — added: `declares nothing the documents do not
  name`, asserting declared ⊆ the same explicit `required` list.

---

# Addendum items

## A. Stale Phase-3 text and an incomplete layout row → fixed (`2383490`)

The "Inputs that already exist" bullet no longer says tokens "will be extracted … during
Phase 3"; it now says they are in `docs/02-architecture/design-tokens.md` (Approved v1.0)
and that `src/ui/tokens.css` is generated from it, with a unit test holding the two to
the same values. The "How to read this repository" row now reads
`app/`, `src/`, `prisma/`, `scripts/`, `tests/`, `public/` — "Application code, tooling
and static assets, laid out per ADR-0002". Both wrapped by hand to the section's existing
≤ 79 columns.

## B. `allowScripts` — **KEEP IT** (the reasoning below is WRONG — see the correction at the end)

> **Correction, later in the wave.** The conclusion "keep it" stands, but the reasoning
> in this section is false. I measured npm's *warning list* and read "not yet covered by
> allowScripts" as "blocked". It is not. See
> "[Correction: what `allowScripts` actually does](#correction-what-allowscripts-actually-does)"
> at the end of this report for what npm really does, proved with a script that leaves a
> trace. This section is left in place because the mistake is part of the record.

**What was tested.** `git archive HEAD` extracted into two throwaway copies outside the
repository. One kept `package.json`'s `allowScripts`, the other had the field deleted.
`npm ci` (npm 11.19.0, Node 26.7.0) was run in each.

**Result — npm 11 reads the field:**

```
with    allowScripts:  npm warn install-scripts 1 package has install scripts not yet
                       covered by allowScripts:
                       fsevents@2.3.3 (install: (install scripts present))

without allowScripts:  npm warn install-scripts 2 packages have install scripts not yet
                       covered by allowScripts:
                       fsevents@2.3.3 (install: (install scripts present))
                       unrs-resolver@1.12.2 (postinstall: node postinstall.js)
```

Deleting the field demonstrably moves `unrs-resolver`'s postinstall into the *blocked*
list. The field is **not** inert config for some other tool, and it was not removed.

**What the postinstall does, and why nothing broke in the test.** `unrs-resolver`'s
postinstall is `napi-postinstall`'s `checkAndPreparePackage` — the repair path for a
missing native binding. On this machine the binding arrives a different way: as the
platform-matched optional dependency `@unrs/resolver-binding-darwin-arm64`. Both copies
ended up with `resolver.darwin-arm64.node` present, and
`npx vitest run tests/unit/boundaries.test.ts` passed **13/13 in both**. The lockfile
carries all 23 platform bindings, including `@unrs/resolver-binding-linux-x64-gnu` for
CI's `ubuntu-latest`, each `optional: true` with `os`/`cpu` constraints — so the same
path should serve CI.

**Conclusion.** I proved the field is *not* inert; I did not prove the postinstall is
*needed* on macOS arm64 today, because the optional-dependency path works there. That is
not a reason to delete it: it is the fallback for exactly the failure the resolver
comment in `eslint.config.mjs` describes, it costs three lines, and being wrong means the
boundary policies stop firing. Kept, with a comment next to the resolver note in
`eslint.config.mjs` saying why (package.json is JSON and cannot carry one).

One thing has changed since the original worry: that failure is **no longer silent**.
Renaming `node_modules/eslint-import-resolver-typescript` away fails
`tests/unit/boundaries.test.ts` 6/13, and `npm test` is a CI step — so even if the
binding ever went missing, CI would say so.

## C. Avatars reverse assertion → added (`b4e9498`)

`holds no image the seed does not reference`: the `.jpg` basenames in `public/avatars`
must be exactly the seed's 30 keys, checked both as a set difference and as a count.
Proved it bites — copying one avatar to `zz-unreferenced.jpg` gives
**1 failed / 110 passed**, `expected [ 'zz-unreferenced' ] to deeply equal []`; the stray
file was removed and `git status` is clean.

## D. Not acted on, as instructed

The T-05 backlog row and the comments in `app/page.tsx` and `tests/e2e/scaffold.spec.ts`
were left exactly as they are.

---

## Verification (verbatim, final state)

```
$ npm run lint
> eslint . --max-warnings 0
exit=0

$ npm run typecheck
> tsc --noEmit
exit=0

$ npm run format:check
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
exit=0

$ npm test
> vitest run
 Test Files  2 passed (2)
      Tests  111 passed (111)
   Duration  689ms
exit=0

$ npm run test:e2e
> playwright test --project=chromium --project=firefox --project=webkit
Running 3 tests using 3 workers
  ✓  2 [chromium] › tests/e2e/scaffold.spec.ts:9:1 › scaffold: the application boots and serves the root route (299ms)
  ✓  3 [webkit] › tests/e2e/scaffold.spec.ts:9:1 › scaffold: the application boots and serves the root route (641ms)
  ✓  1 [firefox] › tests/e2e/scaffold.spec.ts:9:1 › scaffold: the application boots and serves the root route (839ms)
  3 passed (5.9s)

$ git status
On branch task/T-01-scaffold
nothing to commit, working tree clean
```

**Unit total: 111 passed** (was 96). +13 from the new `tests/unit/boundaries.test.ts`
(3 target-existence + 8 violations + 1 negative control + 1 typescript-eslint), +1 from
the `.env.example` reverse assertion and +1 from the avatars reverse assertion; the
tokens rewrite is count-neutral at 50.

## Concerns

1. ~~**`src/shared` and `scripts/` may still import Prisma.**~~ **Resolved** by owner
   decision — `src/shared` was added to the restriction in `d90dacf`; see the follow-up
   round below. `scripts` and `tests` remain deliberately exempt.
2. **The `master` / `main` contradiction is papered over, not resolved.** The workflow
   now fires on both, but ADR-0007 still names `main` and the repository still uses
   `master`. That is the owner's call and remains open.
3. **The boundary fixtures import `README.md` files.** That is unusual-looking source,
   and it exists only because `src/server` and `src/domain` have no modules yet. It
   should be repointed at real modules during T-02/T-04; the fixtures' README says so.

---

# Follow-up round: `src/shared` and a note on where the tree was read

## Prisma restriction extended to `src/shared` → done (`d90dacf`)

Concern #1 is now closed by owner decision. `src/shared/**/*.{ts,tsx}` joins
`app/**`, `src/domain/**`, `src/ui/**` and `src/webmcp/**` in the
`no-restricted-imports` block, so **`src/server` is the only layer that may import
Prisma**; `scripts` and `tests` stay exempt as before. The config comment records the
reasoning: ADR-0002 has shared "import nothing from the rest", T-04 writes its Zod
schemas by hand rather than deriving them from Prisma types, and changing that is an ADR
conversation rather than a silent allowance.

`tests/fixtures/boundaries/shared-imports-prisma.ts.fixture` covers it, deliberately
using `import type { Prisma } from "@prisma/client"` — the type-only form a derived
schema would actually reach for, and one the rule still catches. Proved it bites:
commenting `src/shared/**/*.{ts,tsx}` back out of the files list gives
**1 failed / 13 passed**, `expected [] to deeply equal [ 'no-restricted-imports' ]`.

`src/server/README.md`'s claim that it is "the only layer allowed to import
`@prisma/client`" is now literally true for every `src/` layer and for `app/`.

## Where the "still open" reading came from

A, B and C were reported as still open. They are not: they landed in `2383490` and
`b4e9498`, and the line numbers quoted match commit `b8705a0` exactly — the branch tip
*before* those two commits:

| Quoted | At `b8705a0` | At `b4e9498` (current) |
|---|---|---|
| `README.md:32` | `` \| `app/`, `src/`, `prisma/`, `tests/` \| Application code, laid out per ADR-0002 \| `` | `` \| `app/`, `src/`, `prisma/`, `scripts/`, `tests/`, `public/` \| Application code, tooling and static assets … \| `` |
| `README.md:79-80` | "design tokens will be extracted … during Phase 3" | "the tokens extracted from it are in … (Approved v1.0)"; `grep -n "Phase 3" README.md` now returns nothing |
| avatars reverse check | absent | `tests/unit/scaffold.test.ts:148` |

`package.json:49-51` does still hold `allowScripts`, deliberately — see section B above,
which was appended to this file at the same time as those commits and records the
clean-room `npm ci` result in full.

`git worktree list` shows the branch lives only here
(`.claude/worktrees/T-01-scaffold`, tip `d90dacf`); the main checkout at
`/Users/ruslan/Own/ai-native-personal-finance` is on `master` at `088be5e`, which has no
`package.json` at all. Nothing is pushed — the branch has an `origin` but I left pushing
to the owner.

## Verification after this round

```
$ npm run lint          exit=0
$ npm run typecheck     exit=0
$ npm run format:check  All matched files use Prettier code style! exit=0
$ npm test              Test Files 2 passed (2) · Tests 112 passed (112)
$ npm run test:e2e      3 passed (5.6s) — chromium, webkit, firefox
$ git status            On branch task/T-01-scaffold · nothing to commit, working tree clean
```

**Unit total: 112** (was 111) — +1 for the `src/shared` Prisma fixture.

### Re-confirmed after the follow-up request

The `src/shared` decision was asked for a second time; it was already in `d90dacf` and
needed no further change. Evidence from the working tree at that commit:

- `eslint.config.mjs:144-150` — the `files` list reads `app/**/*.{ts,tsx}`,
  `src/domain/**/*.{ts,tsx}`, **`src/shared/**/*.{ts,tsx}`**, `src/ui/**/*.{ts,tsx}`,
  `src/webmcp/**/*.{ts,tsx}`.
- `eslint.config.mjs:140-143` — the comment carries the reasoning verbatim: ADR-0002 has
  shared "import nothing from the rest", T-04 writes its Zod schemas by hand rather than
  deriving them from Prisma types, and changing that is an ADR conversation. The
  preceding "every layer except `server` itself" sentence is accurate as written now that
  `shared` is listed, so it was left alone.
- `tests/fixtures/boundaries/shared-imports-prisma.ts.fixture` and the matching case at
  `tests/unit/boundaries.test.ts:69-76` are both tracked in `HEAD`.
- This report's concern #1 was already struck through and marked resolved.

Full verification re-run at `d90dacf`, working tree clean throughout:

```
$ npm run lint          exit=0
$ npm run typecheck     exit=0
$ npm run format:check  All matched files use Prettier code style! exit=0
$ npm test              Test Files 2 passed (2) · Tests 112 passed (112)
$ npm run test:e2e      3 passed (5.3s) — chromium, webkit, firefox
$ git status            On branch task/T-01-scaffold · nothing to commit, working tree clean
```

---

# Correction: what `allowScripts` actually does

Commit `a5df5d4`, comment-only. The re-review was right and my section B was wrong.

**What I got wrong.** I ran `npm ci` with and without the field, saw the warning go from
"1 package has install scripts not yet covered by allowScripts" to "2 packages …", and
concluded that removing the field moves `unrs-resolver`'s postinstall to a *blocked*
list. "Not yet covered" is not "blocked". I never checked whether the script ran — the
one thing that would have settled it — and I wrote the conclusion into
`eslint.config.mjs`, where a future reader would have trusted it.

**The source.** npm 11.19.0, `@npmcli/arborist`:

- `lib/arborist/rebuild.js:206-208` —
  `scriptsDenied = !dangerouslyAllowAllScripts && isScriptAllowed(node, allowScripts) === false`.
  The gate is a strict `=== false`.
- `lib/script-allowed.js:26-60` — returns `true` when an allow entry matches, `false` when
  a deny entry matches, and **`null` when nothing matches**. `null === false` is `false`,
  so an unreviewed script is queued and runs.
- `npm config get strict-allow-scripts` → `false`; there is no `.npmrc` in this
  repository or in `~`.

**The experiment that settles it.** A throwaway package outside the repository, depending
on a local package whose `postinstall` writes `RAN.txt`. `rm -rf node_modules` before each
run, and the presence of the sentinel is the answer:

| `allowScripts` entry | `npm install` | Sentinel |
|---|---|---|
| absent (unreviewed → `null`) | warns "not yet covered by allowScripts" | **present — the script ran** |
| `true` (approved) | silent | present |
| `false` (denied) | silent | **absent — the script was blocked** |
| absent, `--strict-allow-scripts` | fails `ESTRICTALLOWSCRIPTS` | absent, install aborted |
| `true`, `--strict-allow-scripts` | silent, install succeeds | present |

**What is true, and what the comment now says.** `allowScripts` records that
`unrs-resolver`'s postinstall was reviewed and approved. Under npm's default
`strict-allow-scripts=false` it is a policy record, not a gate — an unlisted script still
runs, with a warning. It becomes load-bearing the moment `strict-allow-scripts` is turned
on, where an unreviewed install script fails the install outright. So the field stays,
for that reason rather than the one I gave. The separate note about *why* unrs-resolver's
postinstall matters to the resolver is independent of this correction and was kept.

**What this does not change.** The earlier observations still hold: the native binding
arrives as the platform-matched optional dependency
(`@unrs/resolver-binding-darwin-arm64` here, `…-linux-x64-gnu` for CI), it was present in
both clean installs, and `tests/unit/boundaries.test.ts` passed 13/13 in both. And the
failure mode is no longer silent regardless — renaming the resolver away fails that test,
and `npm test` runs in CI.

## Verification after the correction

```
$ npm run lint          exit=0
$ npm run typecheck     exit=0
$ npm run format:check  All matched files use Prettier code style! exit=0
$ npm test              Test Files 2 passed (2) · Tests 112 passed (112)
$ npm run test:e2e      3 passed — chromium, webkit, firefox
$ git status            On branch task/T-01-scaffold · nothing to commit, working tree clean
```

## Explicitly not done (out of scope, per the brief)

Renaming the default branch; adding API, E2E, coverage or Lighthouse jobs to CI; the
process-log entry; any edit under `docs/` (read-only, and nothing there was touched);
anything from backlog T-02 onward.
