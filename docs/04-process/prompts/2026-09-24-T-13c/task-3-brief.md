## Task 3: TD-9 — a bare `fr` column track fails `npm run lint` and the unit suite (Q4 = Stylelint)

**Files:**

- Create: `stylelint.config.mjs`, `tests/fixtures/css-grid/bare-fr.css.fixture`,
  `tests/fixtures/css-grid/definite-minimum.css.fixture`, `tests/unit/css-grid.test.ts`
- Modify: `package.json` (the `stylelint` dev dependency, `lint` and a new `lint:css` script),
  `package-lock.json` (by npm), `README.md` (the scripts table)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: `stylelint.config.mjs` — the one config, default export, one rule
  (`declaration-property-value-disallowed-list` on `grid-template-columns`, no `extends`); the npm
  script `lint:css` (`stylelint "app/**/*.css" "src/**/*.css" --max-warnings 0`), which `lint` runs
  after ESLint. A violation is reported as `TD-9: a bare fr column track sizes as minmax(auto, Nfr)
  …` at its declaration's line, rule id `declaration-property-value-disallowed-list`, severity
  `error`.

The fixtures use the `.css.fixture` extension so that neither `npm run lint:css` (`.css` only) nor
Prettier reads them, the repository's pattern (`tests/fixtures/boundaries/README.md`).

- [ ] **Step 1: install the dev dependency** — `--ignore-scripts`, as in the bootstrap (a plain
  `npm install` runs the `prepare` script, which writes git configuration shared by every worktree)

```bash
npm install --ignore-scripts --save-dev stylelint@17.15.0
```

Expected (measured 2026-09-25): `added 75 packages`, `found 0 vulnerabilities`; `git diff --stat`
shows `package.json` and `package-lock.json` (about 1 050 lines added, a few dozen existing entries
moved). Then:

```bash
npx vitest run tests/unit/install-scripts.test.ts
npm audit --audit-level=high
```

Expected (measured): `Tests 3 passed` and exit 0 — the install-script policy holds and the audit
stays at 0. **If either fails, stop and tell the owner** (Q4 was decided on those two facts).

- [ ] **Step 2: the violation fixture** — every declaration in it is a violation; the line numbers
  in the test below are its own

```css
/* Every grid-template-columns below breaks TD-9: a `fr` track without a definite minimum. */
.single {
  display: grid;
  grid-template-columns: 1fr;
}

.repeated {
  grid-template-columns: repeat(3, 1fr);
}

.mixed {
  grid-template-columns: 1fr 2fr;
}

.autoMinimum {
  grid-template-columns: minmax(auto, 1fr);
}

.contentMinimum {
  grid-template-columns: minmax(min-content, 1fr) minmax(0, 1fr);
}

.variableMinimum {
  grid-template-columns: minmax(var(--track-min), 1fr);
}

@media (min-width: 768px) {
  .nested {
    grid-template-columns: 200px .5FR !important;
  }
}

.decimal {
  grid-template-columns: 1.5fr 240px;
}
```

- [ ] **Step 3: the control fixture** — nothing in it may be reported (Review Focus 5: the comment
  spells out `1fr` and is not a declaration, rows are out of scope, a custom property that ends in
  the property's name is not the property, and `minmax(0, 11fr)` is not a bare `1fr`)

```css
/*
 * Nothing below breaks TD-9. This comment talks about `1fr` and even writes
 * grid-template-columns: 1fr; — a comment is not a declaration.
 */
.zero {
  grid-template-columns: minmax(0, 1fr);
}

.repeated {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.length {
  grid-template-columns: minmax(120px, 1.5fr) minmax(0, 1fr);
}

.fixedAndFlexible {
  grid-template-columns: 240px minmax(0, 1fr);
}

.autoFill {
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
}

.percentage {
  grid-template-columns: minmax(25%, 1fr);
}

/* Rows are not TD-9's business: an `auto` row minimum is about height. */
.rows {
  grid-template-rows: repeat(3, 1fr);
}

/* A custom property that merely ends in the same name is not the property. */
.custom {
  --grid-template-columns: 1fr;
}

/* A multi-digit or decimal maximum is still the maximum of a definite minmax. */
.multiDigit {
  grid-template-columns: minmax(0, 11fr) minmax(0, 1.5fr);
}
```

- [ ] **Step 4: the test** — like `boundaries.test.ts`, it hands source to the linter with a
  `codeFilename` under `src/`, so the repository's own config is found and read: the shipped rule
  is tested, not a copy of it

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import stylelint from "stylelint";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const RULE = "declaration-property-value-disallowed-list";

/**
 * TD-9, US-33 AC2: `stylelint.config.mjs` fails on a bare `fr` column track. Like
 * `boundaries.test.ts`, each case hands source to the linter with a `codeFilename` under `app/`
 * or `src/`, so the repository's own config is found and read — the shipped rule is tested, not
 * a copy. The fixtures use the `.css.fixture` extension, which neither `npm run lint:css` nor
 * Prettier reads.
 */
const lintFixture = async (name: string) => {
  const code = readFileSync(join(repoRoot, "tests/fixtures/css-grid", name), "utf8");
  const { results } = await stylelint.lint({
    code,
    codeFilename: join(repoRoot, "src/ui/css-grid-fixture.module.css"),
    cwd: repoRoot,
  });
  return results[0]?.warnings ?? [];
};

describe("a grid column is never a bare fr track (TD-9, US-33 AC2)", () => {
  it("no stylesheet under app/ or src/ has one", async () => {
    const { results, errored } = await stylelint.lint({
      files: ["app/**/*.css", "src/**/*.css"],
      cwd: repoRoot,
    });
    // The scan reads something: the two files whose grids the rule was written for.
    const files = results.map((result) => result.source);
    expect(files).toContain(join(repoRoot, "app/(app)/overview/page.module.css"));
    expect(files).toContain(join(repoRoot, "src/ui/overview/PotsCard.module.css"));

    const violations = results.flatMap((result) =>
      result.warnings.map((warning) => `${result.source}:${warning.line} ${warning.text}`),
    );
    expect(violations).toEqual([]);
    expect(errored).toBe(false);
  });

  it("(fixture) reports every bare fr form, on its own line, as an error", async () => {
    const warnings = await lintFixture("bare-fr.css.fixture");

    expect(warnings.map((warning) => warning.line)).toEqual([4, 8, 12, 16, 20, 24, 29, 34]);
    for (const warning of warnings) {
      expect(warning.rule).toBe(RULE);
      expect(warning.severity).toBe("error");
      expect(warning.text).toMatch(/^TD-9: a bare fr column track/);
    }
  });

  it("(fixture) accepts a definite minimum, ignores comments, rows and custom properties", async () => {
    expect(await lintFixture("definite-minimum.css.fixture")).toEqual([]);
  });
});
```

- [ ] **Step 5: run it with no config and see it fail**

```bash
npx vitest run tests/unit/css-grid.test.ts
```

Expected (measured with `stylelint.config.mjs` moved away): `Tests 3 failed` —
`ConfigurationError: No configuration provided for …/src/ui/css-grid-fixture.module.css`. There
is no `stylelint.config.mjs` yet at this point, so this is the state you are in.

- [ ] **Step 6: the config, the scripts, the README rows**

```js
/**
 * TD-9 (docs/03-specs/tech-debt.md): a bare `fr` track is `minmax(auto, Nfr)`, and its `auto`
 * minimum follows the widest item's min-content — one fixed-size item (Budgets' donut) then
 * forces every card in its column wider than the page at 320 px (US-33 AC2). A column track is
 * therefore written `minmax(<definite>, Nfr)`: `minmax(0, 1fr)`, or a length or a percentage
 * as the minimum. `auto`, `min-content`, `max-content`, `var()`, `calc()` and `min()` as the
 * minimum do not count as definite, so they are reported too.
 *
 * Scope, as TD-9 states it: the value of `grid-template-columns`. Not read: `grid-template-rows`
 * (a row's `auto` minimum is about height, not the 320 px width), `grid-auto-columns` and the
 * `grid` / `grid-template` shorthands — nothing under `app/` or `src/` uses them, and adding one
 * is a reason to extend this rule. `tests/unit/css-grid.test.ts` makes the rule fail on purpose
 * (DoD v1.1); `npm run lint:css` runs it over `app/` and `src/`.
 */
const DEFINITE_MINIMUM = String.raw`(?:0|\d*\.?\d+(?:px|rem|em|ch|vw|vh|vmin|vmax|%))`;

// A number followed by `fr` that is not the maximum of `minmax(<definite>, …)`. The first
// lookbehind starts the match at the number's first digit, so `11fr` is not read as `1fr`.
const BARE_FR = new RegExp(
  String.raw`(?<![\d.])(?<!minmax\(\s*${DEFINITE_MINIMUM}\s*,\s*)\d*\.?\d+fr\b`,
  "i",
);

/** @type {import("stylelint").Config} */
const config = {
  rules: {
    "declaration-property-value-disallowed-list": [
      { "grid-template-columns": [BARE_FR] },
      {
        message:
          "TD-9: a bare fr column track sizes as minmax(auto, Nfr) and can push a card past the page at 320 px; write minmax(0, Nfr).",
      },
    ],
  },
};

export default config;
```

```diff
--- a/package.json
+++ b/package.json
@@ -13,7 +13,8 @@
     "start": "next start",
     "prepare": "sh scripts/install-git-hooks.sh",
     "typecheck": "tsc --noEmit",
-    "lint": "eslint . --max-warnings 0",
+    "lint": "eslint . --max-warnings 0 && npm run lint:css",
+    "lint:css": "stylelint \"app/**/*.css\" \"src/**/*.css\" --max-warnings 0",
     "lint:fix": "eslint . --fix --max-warnings 0",
     "format": "prettier --write .",
     "format:check": "prettier --check .",
@@ -61,6 +62,7 @@
     "pg": "^8.23.0",
     "prettier": "^3.9.8",
     "prisma": "7.10.0",
+    "stylelint": "^17.15.0",
     "tsx": "^4.23.15",
     "typescript": "~5.9.3",
     "typescript-eslint": "^8.70.0",
```

```diff
--- a/README.md
+++ b/README.md
@@ -91,7 +95,8 @@ commit either way.
 
 | Command                       | What it runs                                                                                                     |
 | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
-| `npm run lint`                | ESLint, including the ADR-0002 import boundaries                                                                 |
+| `npm run lint`                | ESLint, including the ADR-0002 import boundaries, then `lint:css`                                                |
+| `npm run lint:css`            | Stylelint over `app/` and `src/`: a bare `fr` column track fails (TD-9)                                          |
 | `npm run format:check`        | Prettier                                                                                                         |
 | `npm run typecheck`           | `tsc --noEmit`, strict                                                                                           |
 | `npm run secrets:scan`        | Gitleaks on all commit diffs and messages — first in `test:all`                                                  |
```

```bash
npx vitest run tests/unit/css-grid.test.ts
npm run lint:css
```

Expected (measured): `Tests 3 passed` — the exact line numbers of the violation fixture, and `[]`
for the real tree; `lint:css` prints nothing and exits 0.

- [ ] **Step 7: prove both guards can fail, then undo** — the real tree, and the regex

```bash
sed -i.bak 's/grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);/grid-template-columns: 1fr 1fr;/' src/ui/overview/PotsCard.module.css "app/(app)/overview/page.module.css"
npm run lint:css
npx vitest run tests/unit/css-grid.test.ts
git checkout -- src/ui/overview/PotsCard.module.css "app/(app)/overview/page.module.css"
rm src/ui/overview/PotsCard.module.css.bak "app/(app)/overview/page.module.css.bak"
```

Expected (measured): `lint:css` exits 2 with the rule's message at `app/(app)/overview/page.module.css`
40:28 and `src/ui/overview/PotsCard.module.css` 57:26 — the glob reaches a directory named with
parentheses; the unit test reports `1 failed | 2 passed`, the failure being the real-tree test.
`git status` shows neither CSS file changed afterwards. Then the regex: in `stylelint.config.mjs`
delete the first lookbehind, `(?<![\d.])`, from `BARE_FR`, run the unit test — measured
`1 failed | 2 passed`, the control fixture (`minmax(0, 11fr)` is read as a bare `1fr`) — and put
the lookbehind back.

- [ ] **Step 8: the whole lint script, the checks, the secret scan over the lockfile, commit**

```bash
npm run lint
npx prettier --check .
npx tsc --noEmit
git add package.json package-lock.json README.md stylelint.config.mjs tests/fixtures/css-grid tests/unit/css-grid.test.ts
sh scripts/secret-scan.sh staged
```

Expected (measured): `npm run lint` runs ESLint and then `lint:css`, both clean; Prettier and `tsc`
clean; the scan prints nothing and exits 0 (the lockfile's integrity hashes are not findings).
`stylelint.config.mjs` needs `const config = {…}; export default config;`, not an anonymous default
export: `import/no-anonymous-default-export` is a warning under `--max-warnings 0` (measured — the
first draft failed `npm run lint` on it).

```bash
git commit -m "test(css): fail on a bare fr column track with Stylelint (TD-9)"
```

