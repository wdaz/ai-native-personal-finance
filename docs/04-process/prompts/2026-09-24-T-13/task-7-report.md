# Task 7 report: install-script policy

Commit: 80af2e4 `build: fail the install on an unreviewed install script (strict-allow-scripts)` on task/T-13-ci-hardening.

## What was done
- Created `.npmrc` (`strict-allow-scripts=true`, verbatim from the brief) and `tests/unit/install-scripts.test.ts` (verbatim; imports the existing `tests/fixtures/child-env.ts`).
- `package.json`: added `"fsevents@2.3.3": false` after `esbuild@0.28.2` and appended the note to the `"//"` array.
- `eslint.config.mjs`: replaced the middle of line 54 through line 60 (line 53 kept, "is missing." kept) with the new comment.
- `README.md` "Run locally": added the `ESTRICTALLOWSCRIPTS` sentence after the code block.
- `tests/unit/README.md` left alone (no step edits it).

## TDD evidence (real runs)
- RED 1 (no `.npmrc`): 2 failed, 1 passed; both failures `ENOENT ... copyfile '.../.npmrc'`. Matched the prediction.
- After `.npmrc`, before the `fsevents` entry: 1 failed, 2 passed. The first case failed with
  `npm error code ESTRICTALLOWSCRIPTS` / `1 package(s) have install scripts not covered by allowScripts: fsevents@2.3.3 (install: (install scripts present))`. Matched the brief's measurement (the owner's-machine breakage). The "no .npmrc" case passed thanks to `childEnv()` (Task 2).
- GREEN after the `fsevents` entry: `Tests 3 passed (3)`. Matched the brief's "3 passed".
- The two `(fixture)` cases are the deliberate violations: removing `esbuild@0.28.2` from `allowScripts` fails with `ESTRICTALLOWSCRIPTS` naming `esbuild@0.28.2`; the same package.json installs without `.npmrc`.

## Gates (each run separately, after the final edit)
- `npm run typecheck`: clean.
- `npm run lint`: clean (`--max-warnings 0`), boundaries test included in the unit run.
- `npm run format:check`: "All matched files use Prettier code style!"
- `npm test`: 76 files, 948 tests passed (baseline was 945 / 75; +3 tests, +1 file). The brief's 875-based numbers do not apply.
- `npm run traceability`: "all 18 Release 1 stories are named in a test title".
- `npm audit --audit-level=high`: `found 0 vulnerabilities`.

## Deviations / concerns
- Step 7 (Docker, Linux proof) NOT run: the controller said not to use docker. The Linux behaviour and the CI runner's npm honouring `strict-allow-scripts` / `allowScripts` remain predictions until the first CI run (`verify` job's `npm ci`). If CI errors `Unknown project config`, stop and ask.
- Only `npm ci --dry-run` in staged temp copies was used; no real install, node_modules untouched.
- Prettier's output did not list README.md (likely in `.prettierignore`); `format:check` passes.

## Step 7: Linux check (docker run, node:26, linux/amd64) — run 2026-09-24
Scratch dirs outside the repo: /Users/ruslan/.claude/jobs/fbf96237/tmp/task7-linux (as committed), ...-nofsevents, ...-noesbuild (each: package.json, package-lock.json, .npmrc, prisma/, prisma.config.ts, scripts/, run.sh). run.sh copies /src to /w, prints versions, runs `npm ci --strict-allow-scripts=true > log 2>&1`, prints `tail -15`, then `npm ci exit=$?` and grep counts for `Unknown project config` and `ESTRICTALLOWSCRIPTS`. (The trailing shell exit 1 of the docker command is the `grep -c` returning 0 matches, not npm.)

1. As committed (fsevents denied):
   node v26.10.0, npm 11.19.1
   `added 620 packages, and audited 621 packages in 30s` / `found 0 vulnerabilities` / `npm ci exit=0`
   `Unknown project config` count 0, `ESTRICTALLOWSCRIPTS` count 0. (npm ran the root `prepare` script: scripts/install-git-hooks.sh.)
2. fsevents entry removed from the scratch package.json: same output, `npm ci exit=0`, 0 and 0 (fsevents is optional and absent on Linux, no error, as expected).
3. Extra control, esbuild@0.28.2 entry removed: 
   ```
   npm error code ESTRICTALLOWSCRIPTS
   npm error --strict-allow-scripts: 1 package(s) have install scripts not covered by allowScripts:
   npm error   esbuild@0.28.2 (install: (install scripts present))
   ...
   npm ci exit=1
   ```
   So npm on Linux honours `strict-allow-scripts` and `allowScripts`; the policy is enforced there, not just on the Mac.

Note: this test passed `--strict-allow-scripts=true` on the command line AND had .npmrc in /src; it did not by itself prove that `.npmrc` alone is read (the unit test's `npmrc: false` fixture covers that on the Mac).

### CI runner npm
- .github/workflows/ci.yml uses `actions/setup-node@v5` with `node-version-file: .nvmrc` (contents `26`) in all four jobs (lines 27-30, 91-94, 148-151, 200-202); `npm ci` at lines 33, 97, 154. setup-node does not upgrade npm, so the runner's npm is the one bundled with whatever Node 26.x it resolves to (the latest 26.x at run time).
- package.json `engines` only says `"node": ">=26"`; there is no npm constraint.
- The node:26 image today is v26.10.0 with npm 11.19.1, the plan's minimum (>= 11.19). setup-node resolves `26` to the latest 26.x, so the runner likely has the same npm (11.19.x). Residual risk: an older 26.x served from the runner's tool cache could bundle an older npm that does not know the keys (it would then warn or error `Unknown project config`); the first CI run is the final check. Mitigation, if wanted (owner's call): add `"npm": ">=11.19"` to `engines` (npm only warns without engine-strict) or an `npm install -g npm@^11.19` step.

## Follow-up round — commit 1f3099e `build: pin the npm minimum the install policy needs and make the install-scripts guard harder to defeat`
1. `withoutEsbuild` now asserts `pkg.allowScripts` has `esbuild@0.28.2` (message: update the fixture to the installed version) before deleting. Shown failing on purpose by mutating the asserted key to `esbuild@9.9.9`: cases 2 and 3 failed with `allowScripts no longer names esbuild@0.28.2: update this fixture to the installed version: expected {...} to have property "esbuild@9.9.9"`; mutation restored (grep for 9.9.9 empty). I kept the simpler hard-coded key + assertion, not a lockfile derivation.
2. `childEnv()` uses `/^npm_config_/i`. New `tests/unit/child-env.test.ts` (3 cases; upper/mixed-case npm_config_ variables, VITEST*/NODE_V8_COVERAGE, and pass-through). RED first: `expected [ 'NPM_CONFIG_STRICT_ALLOW_SCRIPTS', 'Npm_Config_Registry' ] to deeply equal []`; GREEN after the fix (3 passed). Hermetic against ~/.npmrc: done, `dryRunCi` passes `--userconfig` and `--globalconfig`. First try used one file for both and npm refused (`double-loading config ... as "global", previously loaded as "user"`), so it uses two empty files (empty-user.npmrc, empty-global.npmrc) in the staged dir; 3 passed afterwards. (I did not run an env-variable-prefixed command to exercise a real `NPM_CONFIG_STRICT_ALLOW_SCRIPTS=false`; child-env.test.ts covers it.)
3. `engines.npm ">=11.19"` in package.json and packages[""].engines in package-lock.json (edited directly, no npm install). Local npm is 11.19.0 (satisfies it). The install-scripts case 1 stages both files and runs `npm ci --dry-run`: 3 passed with the pair. README "Run locally" now says npm 11.19+ is required and that older npm only warns `Unknown project config`.
4. tests/unit/README.md documents install-scripts.test.ts and child-env.test.ts; the childEnv mentions (tests/unit/README.md, tests/fixtures/README.md) now say "any case".

Gates (each separately): typecheck clean; lint clean; format:check all formatted; `npm test` 77 files, 957 tests passed (was 76 / 948 at the previous round on the same branch state... +1 file/+3 tests are mine; the others come from other tasks' files in the shared worktree); traceability 18 stories named; `npm audit --audit-level=high` found 0 vulnerabilities. Files staged explicitly; the parallel Task 6 files were left unstaged.
Note: `npm test` also ran the Task 6 follow-up's uncommitted changes in the shared worktree (a11y-routes tests), which is why the count includes them.
