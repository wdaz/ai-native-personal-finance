## Task 2: the coverage gate (NFR-T1)

**Files:**
- Create: `vitest.thresholds.json`, `tests/fixtures/coverage-gate/vitest.config.ts`,
  `tests/fixtures/coverage-gate/half.test.ts`, `tests/fixtures/coverage-gate/src/domain/half.ts`,
  `tests/fixtures/child-env.ts`, `tests/unit/coverage-gate.test.ts`
- Modify: `vitest.config.ts`, `package.json` (remove `vite-tsconfig-paths`; `test:all`),
  `package-lock.json`, `.github/workflows/ci.yml` (the `verify` job's unit step),
  `tests/unit/README.md` (one line)

**Interfaces:**
- Produces: `vitest.thresholds.json` (the one definition of the gate); `childEnv():
  NodeJS.ProcessEnv` from `tests/fixtures/child-env.ts` (Tasks 2 and 7 use it).

The threshold lives in a JSON file, not a TypeScript module, on purpose: the planning session
tried `import … from "./vitest.thresholds"` (Vite prints "uses features that are unsupported by
`configLoader: 'native'` … import without a file extension" on every run) and
`"./vitest.thresholds.ts"` (`tsc` rejects a `.ts` import path without `allowImportingTsExtensions`).
A JSON import has an extension and needs no tsconfig change.

- [ ] **Step 1: Write the fixture and the failing test.** `tests/fixtures/child-env.ts`:

```ts
/**
 * The environment for a child process a unit test starts. Dropped:
 * - `VITEST*` — the parent Vitest run sets them, and a nested Vitest would take itself for a worker;
 * - `NODE_V8_COVERAGE` — under `--coverage` a child would write into the parent's report;
 * - `npm_config_*` — `npm run` and `npx` export the resolved project configuration (this
 *   repository's `.npmrc` included) as environment variables, and a variable outranks a file, so
 *   a test that stages its own `.npmrc` would never see it decide anything (found in T-13's
 *   plan: the "without .npmrc" case stayed strict).
 */
export function childEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const name of Object.keys(env)) {
    if (
      name.startsWith("VITEST") ||
      name.startsWith("npm_config_") ||
      name === "NODE_V8_COVERAGE"
    ) {
      delete env[name];
    }
  }
  return env;
}
```
(An object built with `Object.fromEntries` does not satisfy `NodeJS.ProcessEnv` — Next's typings
require `NODE_ENV` — hence the copy-then-delete form.)

`tests/fixtures/coverage-gate/src/domain/half.ts`:

```ts
// Fixture (T-13): a "domain" file that is deliberately mostly untested, so the coverage gate
// has something to reject. See tests/unit/coverage-gate.test.ts.
export function covered(): number {
  return 1;
}

export function uncoveredOne(): number {
  return 2;
}

export function uncoveredTwo(): number {
  return 3;
}
```

`tests/fixtures/coverage-gate/half.test.ts`:

```ts
import { expect, test } from "vitest";
import { covered } from "./src/domain/half";

test("covers one of three functions", () => {
  expect(covered()).toBe(1);
});
```

`tests/fixtures/coverage-gate/vitest.config.ts` — reads the real threshold, which does not exist yet:

```ts
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import thresholds from "../../../vitest.thresholds.json" with { type: "json" };

// The repository's real threshold, pointed at a file that misses it.
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    include: ["half.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["src/domain/**"],
      thresholds,
    },
  },
});
```

`tests/unit/coverage-gate.test.ts`:

```ts
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { childEnv } from "../fixtures/child-env";

const repoRoot = join(import.meta.dirname, "..", "..");
const vitest = join(repoRoot, "node_modules/vitest/vitest.mjs");

/**
 * T-13, NFR-T1: the ≥ 90 % statements gate on `src/domain`, proved by making it fail on purpose
 * (DoD v1.1). `vitest.thresholds.json` is read by vitest.config.ts (the real gate) and by
 * tests/fixtures/coverage-gate/vitest.config.ts (a mostly-untested "domain" file that must fail).
 */
describe("the domain coverage gate", () => {
  it("names src/domain and demands 90 % of statements", () => {
    const thresholds: unknown = JSON.parse(
      readFileSync(join(repoRoot, "vitest.thresholds.json"), "utf8"),
    );
    expect(thresholds).toEqual({ "src/domain/**": { statements: 90 } });
  });

  it("fails a run whose domain file is mostly untested, and names the threshold", () => {
    const run = spawnSync(
      process.execPath,
      [vitest, "run", "--config", "tests/fixtures/coverage-gate/vitest.config.ts", "--coverage"],
      { cwd: repoRoot, encoding: "utf8", env: childEnv() },
    );
    expect(run.status).not.toBe(0);
    expect(run.stdout + run.stderr).toMatch(
      /Coverage for statements \(33\.33%\) does not meet "src\/domain\/\*\*" threshold \(90%\)/,
    );
  }, 60_000);
});
```

- [ ] **Step 2: Run it and watch it fail.** `npx vitest run tests/unit/coverage-gate.test.ts`.
  **Prediction:** the first case fails (`ENOENT` on `vitest.thresholds.json`), the second fails
  (the fixture config cannot resolve the JSON).

- [ ] **Step 3: Write `vitest.thresholds.json`.**

```json
{
  "src/domain/**": { "statements": 90 }
}
```

- [ ] **Step 4: Rewrite `vitest.config.ts`** (drops `vite-tsconfig-paths` — backlog T-04 hand-off — and
  the README parse errors — T-03 hand-off). This is the Prettier-formatted form, as run in the
  planning session:

```ts
import { defineConfig } from "vitest/config";
import thresholds from "./vitest.thresholds.json" with { type: "json" };

/**
 * ADR-0003 — unit layer: src/domain, src/shared, src/webmcp adapter.
 * The default environment is `node`; a DOM test opts in per file with
 * `// @vitest-environment jsdom`.
 * The ≥ 90 % statements gate on `src/domain` (NFR-T1, T-13) lives in `vitest.thresholds.json`
 * and runs with `npm run test:coverage`, which CI and `npm run test:all` use.
 * `coverage.include` names code files only: a `README.md` in a layer is not parseable code.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**", "tests/api/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/domain/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}", "src/webmcp/**/*.{ts,tsx}"],
      thresholds,
    },
  },
});
```
  Then `npm uninstall vite-tsconfig-paths --ignore-scripts` (scoped; **not** a bare `npm install`).
  `git diff --stat package.json package-lock.json` must show only that package (and its
  now-orphaned transitive dependencies) leaving.

- [ ] **Step 5: Run the test again.** `npx vitest run tests/unit/coverage-gate.test.ts`.
  **Measured in the planning session** (with `vite-tsconfig-paths` still installed but no longer
  imported): 2 passed, no Vite warning. Then `npm run test:coverage`. **Measured:** 72 files / 877
  tests (875 + these 2), statements 99.22 % (386/389) — unchanged — and no `Failed to parse`, no
  `vite-tsconfig-paths` notice. If the statement totals ever move after this task, the nested run
  leaked coverage into the parent: check `childEnv()`. Also `npm run typecheck`, `npm run lint`,
  `npx prettier --check .` — **measured clean**. Then `git status --short`: **nothing new** may
  appear — the nested fixture run was measured to leave only a git-ignored
  `tests/fixtures/coverage-gate/node_modules/` cache (text reporter, so no `coverage/`). If
  anything else shows, give the fixture config a `reportsDirectory` in the system temp directory.

- [ ] **Step 6: Show the real gate fails (Review Focus 5).** Temporarily change `statements: 90` to
  `101` in `vitest.thresholds.json`. Do **not** use the full run: the two gate tests above fail,
  and Vitest reports no coverage verdict when a test failed. Run
  `npx vitest run --coverage tests/unit/domain`.
  **Measured:** exit 1, `ERROR: Coverage for statements (86.25%) does not meet "src/domain/**"
  threshold (101%)` — proof the glob selects the domain files (86.25 % is the domain layer as
  covered by `tests/unit/domain` alone; the other 13.75 % is exercised by tests in other folders,
  which is why the gate runs over the whole suite). Revert the edit.

- [ ] **Step 7: Wire CI and `test:all`.** In `.github/workflows/ci.yml`'s `verify` job replace the
  last step with:

```yaml
      - name: Unit tests and the coverage gate (src/domain >= 90 % statements)
        run: npm run test:coverage
```
  and in `package.json` change `test:all`'s `npm test` to `npm run test:coverage`. The pin in
  `tests/unit/secret-guard.test.ts` only checks the *start* of `test:all` — verify with
  `npx vitest run tests/unit/secret-guard.test.ts -t "test:all"`. Add to `tests/unit/README.md`:
  "`coverage-gate.test.ts` (T-13) runs a nested Vitest on `tests/fixtures/coverage-gate/` and
  expects the gate to fail; `childEnv()` strips `VITEST*`, `npm_config_*` and `NODE_V8_COVERAGE`
  for child processes."

- [ ] **Step 8: Verify and commit.** `npx prettier --write vitest.config.ts vitest.thresholds.json
  tests/fixtures tests/unit/coverage-gate.test.ts .github/workflows/ci.yml`; `npm run typecheck`,
  `npm run lint`, actionlint (Task 1, Step 2's command). Commit —
  `test(ci): enforce 90 % domain coverage and drop vite-tsconfig-paths`.

---

