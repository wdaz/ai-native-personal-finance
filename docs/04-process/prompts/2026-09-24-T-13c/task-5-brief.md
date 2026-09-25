## Task 5: TD-11 — Public Sans from committed files

**Files:**

- Create: `app/fonts/public-sans-latin-400-normal.woff2`, `app/fonts/public-sans-latin-700-normal.woff2`,
  `app/fonts/OFL.txt`, `app/fonts/README.md`, `tests/fixtures/fonts.ts`, `tests/unit/fonts.test.ts`,
  `tests/fixtures/boundaries/app-imports-next-font-google.tsx.fixture`,
  `tests/fixtures/boundaries/app-imports-next-font-local-allowed.tsx.fixture`
- Modify: `app/layout.tsx`, `eslint.config.mjs`, `tests/unit/boundaries.test.ts`,
  `tests/fixtures/boundaries/README.md`, `docs/02-architecture/design-tokens.md`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: `fontProblems(dir: string, layoutSource: string): string[]` in `tests/fixtures/fonts.ts`
  — one sentence per problem, `[]` when `dir`'s README lists every `.woff2` with its real sha256,
  `layoutSource` uses each one as `./fonts/<name>`, and `OFL.txt` is the SIL OFL 1.1. In `app/layout.tsx`:
  `publicSans` from `localFont`, still exposing `variable: "--font-public-sans"` and
  `display: "swap"`, so `tokens.css` does not change.

- [ ] **Step 1: the failure to fix, reproduced** (measured)

```bash
rm -rf .next
env NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 NEXT_TELEMETRY_DISABLED=1 npx next build
```

Expected: exit 1 with `next/font: error: Failed to fetch Public Sans from Google Fonts. If you are offline or behind a proxy, self-host the font with next/font/local …`, the import trace ending at `./app/layout.tsx`.

- [ ] **Step 2: the ESLint fixtures and their test entries** — the second fixture is the control:
  `next/font/local` must stay allowed

```tsx
// Linted as app/imports-next-font-google.tsx.
// TD-11: `next/font/google` downloads the font while `next build` runs, so a Google Fonts
// outage fails the build (PR #36's CI). Fonts are served with `next/font/local`.
import { Public_Sans } from "next/font/google";

export const font = Public_Sans({ subsets: ["latin"], weight: ["400", "700"] });
```

```tsx
// Linted as app/imports-next-font-local-allowed.tsx.
// Control: `next/font/local` is how the app serves Public Sans (TD-11), so it must report
// nothing — a rule that rejected every `next/font` import would satisfy the violation case.
import localFont from "next/font/local";

export const font = localFont({ src: "./fonts/public-sans-latin-400-normal.woff2" });
```

```diff
--- a/tests/unit/boundaries.test.ts
+++ b/tests/unit/boundaries.test.ts
@@ -113,6 +113,14 @@ const violations = [
     ruleId: "no-restricted-imports",
     message: "ADR-0002: only src/server may import Prisma",
   },
+  {
+    // TD-11: the build downloads the font from Google Fonts. Same block as the Prisma rule —
+    // the Prisma cases above still pass only if the two patterns coexist.
+    fixture: "app-imports-next-font-google.tsx.fixture",
+    lintAs: "app/imports-next-font-google.tsx",
+    ruleId: "no-restricted-imports",
+    message: "TD-11: next/font/google downloads the font at build time",
+  },
   {
     fixture: "domain-uses-new-date.ts.fixture",
     lintAs: "src/domain/uses-new-date.ts",
@@ -183,6 +191,10 @@ const allowed = [
     fixture: "server-imports-domain-allowed.ts.fixture",
     lintAs: "src/server/imports-domain-allowed.ts",
   },
+  {
+    fixture: "app-imports-next-font-local-allowed.tsx.fixture",
+    lintAs: "app/imports-next-font-local-allowed.tsx",
+  },
   {
     fixture: "scripts-imports-shared-allowed.ts.fixture",
     lintAs: "scripts/imports-shared-allowed.ts",
```

```diff
--- a/tests/fixtures/boundaries/README.md
+++ b/tests/fixtures/boundaries/README.md
@@ -32,6 +32,7 @@ that reported everything would pass no control.
 | Prisma outside `src/server`                | from `app` (`@prisma/client`, the `/edge` sub-path and the generated client in `src/server/generated/prisma`), `src/ui`, `src/shared` |
 | ADR-0005's clock rule                      | `new Date()`, `Date()` and `Date.now()`, in `src/domain` **and** `src/server`                                                         |
 | ADR-0003's test-id rule                    | a string as `data-testid` in `src/ui` and as `getByTestId`'s argument in `tests/e2e`                                                  |
+| TD-11's font rule                          | `next/font/google` imported in `app` (it shares the Prisma rule's block, so the Prisma cases above must keep passing)                 |
 
 | Must report nothing                                                   | Fixture                                                   |
 | --------------------------------------------------------------------- | --------------------------------------------------------- |
@@ -43,6 +44,7 @@ that reported everything would pass no control.
 | `webmcp` → `shared`                                                   | `webmcp-imports-shared-allowed`                           |
 | `new Date(<value>)` in `domain` — a fixed date, not the clock         | `domain-parses-date-allowed`                              |
 | a `data-testid` taken from `TEST_IDS`, in `src/ui` and in `tests/e2e` | `ui-shared-test-id-allowed`, `e2e-shared-test-id-allowed` |
+| `next/font/local` in `app` — how the app serves its font (TD-11)      | `app-imports-next-font-local-allowed`                     |
 
 The violation cases also assert `severity === 2`. ADR-0002 says "CI must fail on
 violations"; a rule demoted to a warning would still be reported, and `eslint` would still
```

```bash
npx vitest run tests/unit/boundaries.test.ts
```

Expected (measured): `1 failed | 45 passed` — `app/imports-next-font-google.tsx reports
no-restricted-imports`, `expected [] to deeply equal [ 'no-restricted-imports' ]`.

- [ ] **Step 3: the rule — in the existing block** (Review Focus 4: not a new one)

```diff
--- a/eslint.config.mjs
+++ b/eslint.config.mjs
@@ -152,6 +152,10 @@ const config = [
     // the layer that must stay dependency-free: T-04 writes its Zod schemas by hand
     // rather than deriving them from Prisma types, and changing that is an ADR
     // conversation rather than a silent allowance.
+    // TD-11 shares this block on purpose: flat config gives a rule the options of the LAST
+    // block that sets it for a file, it does not merge them, so a second `no-restricted-imports`
+    // block over `app/**` would silently switch the Prisma pattern off there. A new restricted
+    // import goes into `patterns` below.
     files: [
       "app/**/*.{ts,tsx}",
       "src/domain/**/*.{ts,tsx}",
@@ -172,6 +176,11 @@ const config = [
               message:
                 "ADR-0002: only src/server may import Prisma; reach the database through it.",
             },
+            {
+              group: ["next/font/google", "next/font/google/**"],
+              message:
+                "TD-11: next/font/google downloads the font at build time, so a network hiccup fails the build; serve it with next/font/local from committed files (app/fonts/README.md).",
+            },
           ],
         },
       ],
```

```bash
npx vitest run tests/unit/boundaries.test.ts
```

Expected (measured): `Tests 46 passed`, the Prisma cases included.

- [ ] **Step 4: fetch the files and check them.** Each line is its own command, and no line
  depends on a shell variable or a directory change of an earlier one (a fixed, git-ignored
  scratch directory under `node_modules`). The hashes are measured 2026-09-24, and these exact
  commands were run one by one — if any hash differs, stop and tell the owner; do not update the
  README to match.

```bash
mkdir -p node_modules/.tmp-fontsource app/fonts
npm pack @fontsource/public-sans@5.3.0 --pack-destination node_modules/.tmp-fontsource --silent
tar -xzf node_modules/.tmp-fontsource/fontsource-public-sans-5.3.0.tgz -C node_modules/.tmp-fontsource
cp node_modules/.tmp-fontsource/package/files/public-sans-latin-400-normal.woff2 app/fonts/
cp node_modules/.tmp-fontsource/package/files/public-sans-latin-700-normal.woff2 app/fonts/
curl -fsSL https://raw.githubusercontent.com/uswds/public-sans/v2.001/OFL.txt -o app/fonts/OFL.txt
shasum -a 256 app/fonts/public-sans-latin-400-normal.woff2 app/fonts/public-sans-latin-700-normal.woff2 app/fonts/OFL.txt
rm -rf node_modules/.tmp-fontsource
```

Expected (measured):

```text
36274b5787b4f03b27e65ae971d6c808a96838ccd60c9dabaee154889b6bba82  app/fonts/public-sans-latin-400-normal.woff2
dace741613696827f61dbee2d984e8685f14a2846136783f3ad1c8950914bf1d  app/fonts/public-sans-latin-700-normal.woff2
157a9e77f7580246e97c769490e2e977ae94399f9d30f4556015c41fe8c28bac  app/fonts/OFL.txt
```

- [ ] **Step 5: the README beside the files** (source, version, hashes, licence — F5e)

```markdown
# app/fonts

Public Sans, served by `next/font/local` from `app/layout.tsx` (weights 400 and 700, latin
subset, `variable: "--font-public-sans"`). It replaced `next/font/google` in T-13c (TD-11,
`docs/03-specs/tech-debt.md`): that loader downloads the font while `next build` runs, so a
Google Fonts outage failed CI builds (PR #36) and would fail a Vercel deploy. `eslint.config.mjs`
forbids importing `next/font/google` in `app/` and `src/` (fixture:
`tests/fixtures/boundaries/app-imports-next-font-google.tsx.fixture`).

## Files

| File                                  | Weight | sha256                                                             |
| ------------------------------------- | ------ | ------------------------------------------------------------------ |
| `public-sans-latin-400-normal.woff2`  | 400    | `36274b5787b4f03b27e65ae971d6c808a96838ccd60c9dabaee154889b6bba82` |
| `public-sans-latin-700-normal.woff2`  | 700    | `dace741613696827f61dbee2d984e8685f14a2846136783f3ad1c8950914bf1d` |
| `OFL.txt` (the font's licence, below) | —      | `157a9e77f7580246e97c769490e2e977ae94399f9d30f4556015c41fe8c28bac` |

`tests/unit/fonts.test.ts` checks that every `.woff2` here is listed with its real hash, that
`app/layout.tsx` uses each one, and that `OFL.txt` is present.

## Source

- **Files:** `files/public-sans-latin-400-normal.woff2` and `…-700-normal.woff2` of the npm
  package [`@fontsource/public-sans`](https://www.npmjs.com/package/@fontsource/public-sans)
  **5.3.0** (published from `github.com/fontsource/font-files`; its metadata: Google Fonts
  version `v21`, last modified 2025-09-16), fetched 2026-09-24 with `npm pack`. The package is
  **not** a dependency of this project — the two files were copied once.
- **Font:** "Version 2.001" in both files' `name` table (`head.fontRevision` 2.001), Public Sans
  by the USWDS team (`github.com/uswds/public-sans`), a fork of Libre Franklin. Each file is a
  static instance of the family's variable font at one weight (`OS/2` `usWeightClass` 400 and
  700), latin subset. The family name inside the files is "Public Sans Thin", the name of the
  variable font's default instance (Google's own file says the same); the CSS family is the one
  `next/font/local` generates, so the name does not reach the page.
- **Not byte-identical to what `next/font/google` fetched.** Google serves one variable file for
  the latin subset (`fonts.gstatic.com/s/publicsans/v21/…`, 26 636 bytes, also "Version 2.001").
  These two files are the same design and version at the two weights the app uses, 14 632 and
  14 600 bytes.

## Licence

SIL Open Font License, Version 1.1 — `OFL.txt` is the text at tag `v2.001` of
`github.com/uswds/public-sans` (`OFL.txt`, unchanged there since commit `6317b0d`, 2021-11-01),
fetched 2026-09-24. That repository's `LICENSE.md` says GSA's modifications are CC0 and "users
of this Modified Version (Public Sans) should use Public Sans according to the terms of the SIL
Open Font License, Version 1.1".
Condition 2 of the OFL — every copy carries the copyright notice and the licence — is what
`OFL.txt` beside the files is for. T-16's third-party notices list the font.

## Replacing a file

Copy the new file, update the table above (source, version, hash) in the same commit, and
open the page at 320 px and 1440 px: `tests/unit/fonts.test.ts` fails until the hash agrees.
```

- [ ] **Step 6: the provenance check and its test** — the fixture cases copy `app/fonts/`, break one
  thing, and expect exactly that problem

```ts
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * TD-11: `app/fonts/` holds binary files the build serves, so what they are is checked, not
 * only written down. Every problem found in `dir` (the fonts directory) against `layoutSource`
 * (`app/layout.tsx`), one sentence each; an empty list means the directory is as its README says.
 */
export function fontProblems(dir: string, layoutSource: string): string[] {
  const problems: string[] = [];
  const readme = existsSync(join(dir, "README.md"))
    ? readFileSync(join(dir, "README.md"), "utf8")
    : "";
  // | `file.woff2` | 400 | `<sha256>` |
  const listed = new Map(
    [...readme.matchAll(/^\|\s*`([^`]+\.woff2)`\s*\|[^|]*\|\s*`([0-9a-f]{64})`\s*\|/gm)].flatMap(
      ([, file, hash]) => (file && hash ? [[file, hash] as const] : []),
    ),
  );
  const present = readdirSync(dir).filter((file) => file.endsWith(".woff2"));

  for (const file of present) {
    const expected = listed.get(file);
    if (expected === undefined) {
      problems.push(`${file} is not listed in README.md`);
      continue;
    }
    const actual = createHash("sha256")
      .update(readFileSync(join(dir, file)))
      .digest("hex");
    if (actual !== expected)
      problems.push(`${file} has sha256 ${actual}, README.md says ${expected}`);
    if (!layoutSource.includes(`./fonts/${file}`))
      problems.push(`${file} is not used by app/layout.tsx`);
  }
  for (const file of listed.keys()) {
    if (!present.includes(file))
      problems.push(`README.md lists ${file}, which is not in the directory`);
  }
  const licence = existsSync(join(dir, "OFL.txt"))
    ? readFileSync(join(dir, "OFL.txt"), "utf8")
    : "";
  if (!licence.includes("SIL OPEN FONT LICENSE Version 1.1")) {
    problems.push("OFL.txt is missing or is not the SIL Open Font License, Version 1.1");
  }
  return problems;
}
```

```ts
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fontProblems } from "../fixtures/fonts";

const repoRoot = join(import.meta.dirname, "..", "..");
const fontsDir = join(repoRoot, "app", "fonts");
const layoutSource = readFileSync(join(repoRoot, "app", "layout.tsx"), "utf8");

/** A throwaway copy of `app/fonts/`, edited by `change`, checked, then removed. */
function withFontsCopy(change: (copy: string) => void): string[] {
  const copy = mkdtempSync(join(tmpdir(), "pf-fonts-"));
  try {
    cpSync(fontsDir, copy, { recursive: true });
    change(copy);
    return fontProblems(copy, layoutSource);
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

describe("app/fonts is what its README says (TD-11)", () => {
  it("lists every font with its real hash, uses each in app/layout.tsx, and carries the licence", () => {
    expect(fontProblems(fontsDir, layoutSource)).toEqual([]);
  });

  it("(fixture) reports a font swapped without the README", () => {
    const problems = withFontsCopy((copy) =>
      writeFileSync(join(copy, "public-sans-latin-400-normal.woff2"), "not the font"),
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(
      /public-sans-latin-400-normal\.woff2 has sha256 .* README\.md says/,
    );
  });

  it("(fixture) reports a font nobody listed, a listed font that is gone, and one the layout does not use", () => {
    const problems = withFontsCopy((copy) => {
      writeFileSync(join(copy, "extra.woff2"), "x");
      rmSync(join(copy, "public-sans-latin-700-normal.woff2"));
    });
    expect(problems).toEqual([
      "extra.woff2 is not listed in README.md",
      "README.md lists public-sans-latin-700-normal.woff2, which is not in the directory",
    ]);
    expect(fontProblems(fontsDir, "export const noFonts = true;").sort()).toEqual([
      "public-sans-latin-400-normal.woff2 is not used by app/layout.tsx",
      "public-sans-latin-700-normal.woff2 is not used by app/layout.tsx",
    ]);
  });

  it("(fixture) reports a missing or foreign licence", () => {
    expect(withFontsCopy((copy) => rmSync(join(copy, "OFL.txt")))).toEqual([
      "OFL.txt is missing or is not the SIL Open Font License, Version 1.1",
    ]);
    expect(withFontsCopy((copy) => writeFileSync(join(copy, "OFL.txt"), "MIT"))).toHaveLength(1);
  });
});
```

```bash
npx vitest run tests/unit/fonts.test.ts
```

Expected: with `app/layout.tsx` still on `next/font/google`, the first test fails with
`public-sans-latin-400-normal.woff2 is not used by app/layout.tsx` (and the same for 700) — predicted,
not run on its own; the fixture case that passes `"export const noFonts = true;"` as the layout source
measures the same code path. After Step 7: `Tests 4 passed` (measured).

- [ ] **Step 7: switch the layout**

```diff
--- a/app/layout.tsx
+++ b/app/layout.tsx
@@ -1,11 +1,16 @@
 import type { Metadata } from "next";
-import { Public_Sans } from "next/font/google";
+import localFont from "next/font/local";
 import "@/src/ui/tokens.css";
 import "./globals.css";
 
-const publicSans = Public_Sans({
-  subsets: ["latin"],
-  weight: ["400", "700"],
+// TD-11: Public Sans comes from committed files, so no build downloads from Google Fonts —
+// `next/font/google` does that at build time, and a network hiccup then fails the build.
+// Weights 400 and 700, latin subset; source, version and licence: app/fonts/README.md.
+const publicSans = localFont({
+  src: [
+    { path: "./fonts/public-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
+    { path: "./fonts/public-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
+  ],
   variable: "--font-public-sans",
   display: "swap",
 });
```

- [ ] **Step 8: the same offline build, now green** (measured)

```bash
rm -rf .next
env NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 NEXT_TELEMETRY_DISABLED=1 npx next build
grep -rlE "fonts\.(gstatic|googleapis)\.com" .next/static .next/server
ls .next/static/media
```

Expected: exit 0 (the one warning is the `middleware` → `proxy` deprecation, TD-2 — T-13a's);
`grep` prints nothing; `ls` shows `public_sans_latin_400_normal-s.p.<hash>.woff2` and the 700 one.

- [ ] **Step 9: design-tokens v1.4** — and mind F5g: no backticked double-dash name in the new text

```diff
--- a/docs/02-architecture/design-tokens.md
+++ b/docs/02-architecture/design-tokens.md
@@ -1,7 +1,13 @@
 # Design tokens
 
-Status: **Approved** (v1.3 — 2026-09-23: the close-circle icon, T-08; v1.2 — 2026-09-23: app shell tokens and the sign-out icon, owner decision at the T-07 plan gate; v1.1 — 2026-09-23: auth layout and line tokens, owner decision at the T-06 plan gate; v1.0, owner approval 2026-09-13) · Author(s): Agent (extracted), Owner (approval) · Date: 2026-09-13
-Changelog: v1.3 (2026-09-23, T-08, owner decision at its plan gate, Q2 (d)) — the Icons
+Status: **Approved** (v1.4 — 2026-09-24: Public Sans is served by `next/font/local` from committed files, TD-11, owner decision "a"; v1.3 — 2026-09-23: the close-circle icon, T-08; v1.2 — 2026-09-23: app shell tokens and the sign-out icon, owner decision at the T-07 plan gate; v1.1 — 2026-09-23: auth layout and line tokens, owner decision at the T-06 plan gate; v1.0, owner approval 2026-09-13) · Author(s): Agent (extracted), Owner (approval) · Date: 2026-09-13
+Changelog: v1.4 (2026-09-24, T-13c, owner decision "a" on TD-11) — the Typography section names
+`next/font/local` instead of `next/font/google`. The Google loader downloads the font while
+`next build` runs, and a Google Fonts outage failed CI builds (PR #36). The two files, their
+source, version and licence are in `app/fonts/README.md`. No token changes: the CSS variable
+`next/font` sets, the weights 400 and 700 and `display: swap` stay, so `src/ui/tokens.css` and
+the presets are untouched. (`scaffold.test.ts` reads every backticked double-dash name in this
+file as a documented token, so the font variable is not written that way here.) v1.3 (2026-09-23, T-08, owner decision at its plan gate, Q2 (d)) — the Icons
 section adds `close-circle`, used by the reset banner's dismiss button. It is not a Figma icon
 and not a Phosphor file: the Claude Design prototype draws it inline as its modals' close
 control (a 32 × 32 viewBox, a circle of radius 12.25 and an x, stroke 1.5, round caps). No new
@@ -38,7 +44,7 @@ Source: `../00-discovery/inputs/design/style-guide.html` (Claude Design export o
 
 The 15 theme colours (Green … Pink) are the `Theme` enum in `src/shared/enums.ts`; `data.json` stores them as hex, the seed maps hex → enum name.
 
-## Typography — Public Sans (`next/font/google`, weights 400 and 700)
+## Typography — Public Sans (`next/font/local`, weights 400 and 700, latin; files in `app/fonts/`)
 
 | Token | Preset | Weight | Size | Line height |
 |-------|--------|--------|------|-------------|
```

```bash
npx vitest run tests/unit/scaffold.test.ts
```

Expected (measured): `Tests 114 passed`.

- [ ] **Step 10: the browser, three engines** (scratch spec, **not committed** — copy it to
  `tests/e2e/zz-scratch-font.spec.ts`, run it, delete it)

```ts
import { expect, test } from "../fixtures/e2e";

test("scratch: Public Sans loads from the app's own origin, no request leaves it", async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:3113").origin;
  const foreign: string[] = [];
  const fontRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== origin) foreign.push(request.url());
    if (request.resourceType() === "font") fontRequests.push(request.url());
  });
  await page.goto("/login");
  const faces = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].map((face) => `${face.family}|${face.weight}|${face.status}`);
  });
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  console.log("FACES", JSON.stringify(faces));
  console.log("BODY font-family", family);
  console.log("FONT REQUESTS", JSON.stringify(fontRequests));
  console.log("FOREIGN", JSON.stringify(foreign));
  expect(foreign).toEqual([]);
  expect(faces.some((face) => face.endsWith("|loaded"))).toBe(true);
});
```

```bash
PORT=3113 npx playwright test --project=chromium --project=firefox --project=webkit tests/e2e/zz-scratch-font.spec.ts
```

Expected (measured), on each engine: `FACES ["publicSans|400|loaded","publicSans|700|loaded","publicSans Fallback|normal|unloaded"]`,
`FONT REQUESTS` two, both `http://127.0.0.1:3113/_next/static/media/public_sans_latin_{400,700}_normal-….woff2`,
`FOREIGN []`; `3 passed`.

- [ ] **Step 11: the staged secret scan over the new files, then the checks, then commit**

```bash
git add app/fonts
sh scripts/secret-scan.sh staged
```

Expected (measured): no output and exit 0 — the scan is silent when clean (`--log-level warn`). Not
measured: whether gitleaks reads the `.woff2` bytes at all; a font holds no secret, and the scan is
here for `OFL.txt` and the README.

```bash
npx prettier --check .
npx tsc --noEmit
npx eslint . --max-warnings 0
npx vitest run
```

Expected (measured for the whole tree of Tasks 1–5): all clean; `Tests 1035 passed`.

```bash
git add app/layout.tsx app/fonts eslint.config.mjs tests/unit/boundaries.test.ts tests/fixtures/boundaries tests/fixtures/fonts.ts tests/unit/fonts.test.ts docs/02-architecture/design-tokens.md
git commit -m "fix(build): serve Public Sans from committed files, not Google Fonts (TD-11)"
```

- [ ] **Step 12: the pixels, for the PR's screenshots** — **after the commit**, so that `git checkout
  -- app/layout.tsx` below restores the committed `next/font/local` layout, not the Google one (DoD:
  1440/768/375; scratch, **not committed**; `git status` must be clean when this step ends).
  Baseline from `main`'s layout first, then compare with this task's:

```bash
git show origin/main:app/layout.tsx > app/layout.tsx
```

Copy the spec below to `tests/e2e/zz-scratch-shot.spec.ts`, then:

```bash
PORT=3113 npx playwright test --project=chromium tests/e2e/zz-scratch-shot.spec.ts --update-snapshots
git checkout -- app/layout.tsx
PORT=3113 npx playwright test --project=chromium tests/e2e/zz-scratch-shot.spec.ts
```

```ts
import { expect, loginViaApi, resetDemoData, test } from "../fixtures/e2e";

for (const width of [1440, 768, 375]) {
  test(`scratch shot login ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveScreenshot(`login-${width}.png`, {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixels: 0,
    });
  });

  test(`scratch shot overview ${width}`, async ({ page, request }) => {
    await resetDemoData(request);
    await loginViaApi(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/overview");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveScreenshot(`overview-${width}.png`, {
      fullPage: true,
      threshold: 0.2,
      maxDiffPixels: 0,
    });
  });
}
```

Expected (measured): the second run's six cases each report a handful of differing pixels and
**no size mismatch**: login 46 / 6 / 6 and overview 48 / 40 / 25 pixels at 1440 / 768 / 375 px. Open one
`*-diff.png`: the page is faded and only a few glyph edges are marked. Attach the three `-actual.png`
widths of `/login` and `/overview` to the PR, then delete the spec, `tests/e2e/zz-scratch-shot.spec.ts-snapshots/`
and `test-results/`, and confirm with `git status` (nothing) and `git diff origin/main --stat -- app/layout.tsx`
(the `next/font/local` change).

