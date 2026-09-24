## Task 7: install-script policy (T-01 hand-off, owner decision 2026-09-20)

**Files:**
- Create: `.npmrc`, `tests/unit/install-scripts.test.ts`
- Modify: `package.json` (`allowScripts`, the `"//"` note), `eslint.config.mjs:53-60` (the comment),
  `README.md` ("Run locally"), `tests/unit/README.md`

Two things the planning session found by running the test, both built into it below:
`npm ci --dry-run` still runs the **root project's** `postinstall` and `prepare` (here
`prisma generate`, which needs files the staged directory lacks), so the staged `package.json`
drops them — `allowScripts` never covers a project's own scripts anyway; and `npm run`/`npx` export
the repository's `.npmrc` as `npm_config_*` variables, which is why `childEnv()` (Task 2) strips
them — without that, the "no `.npmrc`" fixture stays strict.

- [ ] **Step 1: Write the failing test.** `tests/unit/install-scripts.test.ts`:

```ts
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { childEnv } from "../fixtures/child-env";

const repoRoot = join(import.meta.dirname, "..", "..");
const scratch: string[] = [];
afterAll(() => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

type PackageJson = {
  allowScripts: Record<string, boolean>;
  scripts: Record<string, string>;
} & Record<string, unknown>;

/** A directory with the repository's lockfile, `.npmrc` (unless dropped) and a mutated package.json. */
function stage(options: { npmrc?: boolean; mutate?: (pkg: PackageJson) => void } = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "install-scripts-"));
  scratch.push(dir);
  copyFileSync(join(repoRoot, "package-lock.json"), join(dir, "package-lock.json"));
  if (options.npmrc !== false) copyFileSync(join(repoRoot, ".npmrc"), join(dir, ".npmrc"));
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as PackageJson;
  // The root project's own `postinstall` (prisma generate) and `prepare` (git hooks) run even
  // under `--dry-run` and need files this directory lacks; `allowScripts` never covers them.
  delete pkg.scripts.postinstall;
  delete pkg.scripts.prepare;
  options.mutate?.(pkg);
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg, null, 2));
  return dir;
}

/** `npm ci --dry-run` resolves the lockfile and checks the install-script policy, and installs nothing. */
const dryRunCi = (cwd: string) =>
  spawnSync("npm", ["ci", "--dry-run"], { cwd, encoding: "utf8", env: childEnv() });

const withoutEsbuild = (pkg: PackageJson) => {
  delete pkg.allowScripts["esbuild@0.28.2"];
};

/** T-13: an install script package.json's `allowScripts` does not name fails the install. */
describe("install-script policy (strict-allow-scripts)", () => {
  it("lets the repository's own package.json and lockfile install", () => {
    const run = dryRunCi(stage());
    expect(run.status, run.stderr).toBe(0);
  }, 60_000);

  it("(fixture) fails when a dependency's install script is no longer named in allowScripts", () => {
    const run = dryRunCi(stage({ mutate: withoutEsbuild }));
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain("ESTRICTALLOWSCRIPTS");
    expect(run.stderr).toContain("esbuild@0.28.2");
  }, 60_000);

  it("(fixture) is `.npmrc` that enforces it — the same package.json installs without the file", () => {
    const run = dryRunCi(stage({ npmrc: false, mutate: withoutEsbuild }));
    expect(run.status, run.stderr).toBe(0);
  }, 60_000);
});
```

- [ ] **Step 2: Run and watch it fail.** `npx vitest run tests/unit/install-scripts.test.ts`.
  **Prediction:** fails at `copyFileSync` (`.npmrc` missing) — ENOENT.

- [ ] **Step 3: Create `.npmrc`.**

```
# T-13 (backlog, T-01 hand-off): a dependency whose install script package.json's
# `allowScripts` does not name stops `npm ci`/`npm install` instead of running with a warning.
# Review the script, then `npm install-scripts approve <package>` (or `deny`).
strict-allow-scripts=true
```
  Run the test again **before** Step 4. **Measured on this Mac:** the first case fails with
  `ESTRICTALLOWSCRIPTS … fsevents@2.3.3` — exactly the owner's-machine breakage of F5 — which is
  why Step 4 exists; the "no `.npmrc`" case fails too until `childEnv()` strips `npm_config_*`.

- [ ] **Step 4: Add the `fsevents` entry (Q8) and the note.** In `package.json`, add
  `"fsevents@2.3.3": false` to `allowScripts` (after `"esbuild@0.28.2": true`) and append to the
  `"//"` array:
  `"allowScripts: fsevents@2.3.3 (macOS only; its install is node-gyp rebuild) is denied — its tarball ships the prebuilt fsevents.node, which loads (T-13, measured 2026-09-24). .npmrc sets strict-allow-scripts=true, so a dependency with an install script that is not listed fails the install."`

- [ ] **Step 5: Run the test.** **Measured:** 3 passed on this Mac. (If the first case fails
  with `ESTRICTALLOWSCRIPTS` for a package other than `fsevents`, the lockfile grew one — approve
  or deny it deliberately, do not loosen the test.) This run is the proof on the owner's platform;
  Linux is Step 7.

- [ ] **Step 6: Update the false comment.** `eslint.config.mjs` currently says the entry "is a
  policy record, not a gate … under the default `strict-allow-scripts=false` an unlisted script
  still runs and merely warns". Replace those lines (53–60) with: "package.json's `allowScripts`
  records that this postinstall was reviewed and approved. `.npmrc` sets `strict-allow-scripts=true`
  (T-13), so a script it does not name fails the install: the entry is load-bearing, and
  tests/unit/install-scripts.test.ts removes one on purpose to show it." Add to the README's "Run
  locally" a sentence: "`.npmrc` sets `strict-allow-scripts=true`; if `npm ci` stops with
  `ESTRICTALLOWSCRIPTS`, review the named package's script and run `npm install-scripts approve
  <package>` (or `deny`)." Run `npm run lint` (`eslint.config.mjs` changed: the boundaries test
  `tests/unit/boundaries.test.ts` must still pass).

- [ ] **Step 7: Prove it on Linux.** Locally, with Docker (F5). The scratch directory holds copies
  of `package.json` (with the `fsevents` entry), `package-lock.json`, `prisma/`, `prisma.config.ts`
  and `scripts/`:

```bash
docker run --rm --platform linux/amd64 -v <scratch-dir>:/src:ro node:26 \
  sh -c 'mkdir /w && cp -r /src/. /w && cd /w && npm ci --strict-allow-scripts=true 2>&1 | tail -6'
```
  **Measured with the `fsevents` entry present:** "added 623 packages … found 0 vulnerabilities",
  no `npm error` (the shell's exit status there was `tail`'s, so it was not read). The **CI
  runner's npm honouring the key is a prediction until the first CI run** — the `verify` job's
  `npm ci` is the check. If it errors `Unknown project config`, stop and ask.

- [ ] **Step 8: Commit** — `build: fail the install on an unreviewed install script (strict-allow-scripts)`.
  Prettier: `npx prettier --write package.json eslint.config.mjs tests/unit/install-scripts.test.ts`.

---

