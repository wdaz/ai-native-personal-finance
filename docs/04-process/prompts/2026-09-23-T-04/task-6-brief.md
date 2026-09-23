### Task 6: `test-ids.ts` and the rule that makes it the only source

Owner answer 4 and its clarification: JSX `data-testid` and `getByTestId`, one rejected and one
passing fixture per side.

**Files:**
- Create: `src/shared/test-ids.ts`, `tests/unit/shared/test-ids.test.ts`
- Modify: `eslint.config.mjs`, `tests/unit/boundaries.test.ts`
- Create: `tests/fixtures/boundaries/ui-literal-test-id.tsx.fixture`,
  `e2e-literal-test-id.ts.fixture`, `ui-shared-test-id-allowed.tsx.fixture`,
  `e2e-shared-test-id-allowed.ts.fixture`

**Interfaces:**
- Consumes: nothing.
- Produces: `TEST_IDS` (an empty, typed registry) and `TestId` in `src/shared/test-ids.ts`; an
  ESLint rule later tasks (T-06, T-07, T-10) meet when they add a `data-testid`.

- [ ] **Step 1: Write the failing tests and the fixtures**

`tests/unit/shared/test-ids.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TEST_IDS } from "@/src/shared/test-ids";

describe("src/shared/test-ids.ts (ADR-0003, NFR-T6)", () => {
  const ids: string[] = Object.values(TEST_IDS);

  it("gives every element its own id", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("writes ids in kebab case", () => {
    expect(ids.filter((id) => !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id))).toEqual([]);
  });
});
```

The two violations and two controls, in `tests/fixtures/boundaries/`:

`ui-literal-test-id.tsx.fixture`
```tsx
// Linted as src/ui/literal-test-id.tsx.
// ADR-0003: a data-testid typed as a string instead of taken from src/shared/test-ids.ts.
export const Donut = () => <svg data-testid="donut" />;
```

`ui-shared-test-id-allowed.tsx.fixture`
```tsx
// Linted as src/ui/shared-test-id-allowed.tsx.
// The control: the id comes from src/shared/test-ids.ts.
import { TEST_IDS } from "@/src/shared/test-ids";

const ids: Record<string, string> = TEST_IDS;
export const Donut = () => <svg data-testid={ids.donut} />;
```

`e2e-literal-test-id.ts.fixture`
```ts
// Linted as tests/e2e/literal-test-id.spec.ts.
// ADR-0003: a test id typed into the test instead of read from src/shared/test-ids.ts.
import type { Page } from "@playwright/test";

export const donut = (page: Page) => page.getByTestId("donut");
```

`e2e-shared-test-id-allowed.ts.fixture`
```ts
// Linted as tests/e2e/shared-test-id-allowed.spec.ts.
// The control: the id comes from src/shared/test-ids.ts.
import type { Page } from "@playwright/test";
import { TEST_IDS } from "@/src/shared/test-ids";

const ids: Record<string, string> = TEST_IDS;
export const donut = (page: Page) => page.getByTestId(ids.donut ?? "");
```

`tests/unit/boundaries.test.ts`:

```diff
--- a/tests/unit/boundaries.test.ts
+++ b/tests/unit/boundaries.test.ts
@@ -151,6 +151,18 @@
     lintAs: "src/server/calls-date.ts",
     ruleId: "no-restricted-syntax",
     message: "ADR-0005: inject a Clock instead of calling Date()",
+  },
+  {
+    fixture: "ui-literal-test-id.tsx.fixture",
+    lintAs: "src/ui/literal-test-id.tsx",
+    ruleId: "no-restricted-syntax",
+    message: "ADR-0003: take the data-testid from TEST_IDS",
+  },
+  {
+    fixture: "e2e-literal-test-id.ts.fixture",
+    lintAs: "tests/e2e/literal-test-id.spec.ts",
+    ruleId: "no-restricted-syntax",
+    message: "ADR-0003: take the test id from TEST_IDS",
   },
 ];
 
@@ -189,6 +201,15 @@
     fixture: "webmcp-imports-shared-allowed.ts.fixture",
     lintAs: "src/webmcp/imports-shared-allowed.ts",
   },
+  {
+    // ADR-0003: an id read from TEST_IDS is the one form the test-id rule allows.
+    fixture: "ui-shared-test-id-allowed.tsx.fixture",
+    lintAs: "src/ui/shared-test-id-allowed.tsx",
+  },
+  {
+    fixture: "e2e-shared-test-id-allowed.ts.fixture",
+    lintAs: "tests/e2e/shared-test-id-allowed.spec.ts",
+  },
 ];
 
 // The rules only see an import that resolves; an unresolved one is classified external
@@ -200,9 +221,10 @@
   "src/webmcp/README.md",
   "app/(app)/README.md",
   "src/shared/env.ts",
+  "src/shared/test-ids.ts",
 ];
 
-describe("eslint enforces ADR-0002 and ADR-0005 (tests/fixtures/boundaries)", () => {
+describe("eslint enforces ADR-0002, ADR-0003 and ADR-0005 (tests/fixtures/boundaries)", () => {
   it.each(importTargets)("the fixtures' import target %s exists", (target) => {
     expect(existsSync(join(repoRoot, target))).toBe(true);
   });
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/unit/shared/test-ids.test.ts tests/unit/boundaries.test.ts`
Expected (*measured*, E15): FAIL — test-ids "Cannot find package '@/src/shared/test-ids'";
**3 failed | 41 passed (44)** (the two violations report nothing; the import target is
missing).

- [ ] **Step 3: Write `src/shared/test-ids.ts`**

```ts
/**
 * ADR-0003 and NFR-T6: E2E locators use roles and accessible names; a `data-testid` is
 * the fallback where the accessible tree is ambiguous, and every one is listed here. The
 * UI renders the id from this object and the test finds it through the same object —
 * eslint.config.mjs rejects a string literal in `data-testid` or `getByTestId`. No Release 1
 * spec names one yet; the first task that needs an id adds it here.
 */
export const TEST_IDS = {} as const satisfies Readonly<Record<string, string>>;

export type TestId = (typeof TEST_IDS)[keyof typeof TEST_IDS];
```

- [ ] **Step 4: Run again — the rule is still missing**

Run: `npx vitest run tests/unit/shared/test-ids.test.ts tests/unit/boundaries.test.ts`
Expected (*measured*, E15): **2 failed | 44 passed (46)** — exactly the two violation fixtures.
This is the rule failing on purpose (DoD v1.1).

- [ ] **Step 5: Add the rule to `eslint.config.mjs`**

Insert before the final `prettier,` entry:

```diff
--- a/eslint.config.mjs
+++ b/eslint.config.mjs
@@ -207,6 +207,26 @@
       ],
     },
   },
+  {
+    // ADR-0003 and NFR-T6: a `data-testid` is listed once, in src/shared/test-ids.ts; the UI
+    // renders it and the E2E test finds it through that object. A string literal in either
+    // place is a second, unlisted id. Other spellings (`data-testid={"x"}`, a template,
+    // `locator("[data-testid=…]")`) are left to review, as NFR-T6 says (owner, T-04 plan gate).
+    files: ["app/**/*.tsx", "src/ui/**/*.tsx", "tests/e2e/**/*.ts"],
+    rules: {
+      "no-restricted-syntax": [
+        "error",
+        {
+          selector: "JSXAttribute[name.name='data-testid'] > Literal",
+          message: "ADR-0003: take the data-testid from TEST_IDS in src/shared/test-ids.ts.",
+        },
+        {
+          selector: "CallExpression[callee.property.name='getByTestId'] > Literal.arguments",
+          message: "ADR-0003: take the test id from TEST_IDS in src/shared/test-ids.ts.",
+        },
+      ],
+    },
+  },
   prettier,
 ];
 
```

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx vitest run tests/unit/shared/test-ids.test.ts tests/unit/boundaries.test.ts`
Expected (*measured*): **46 passed** (2 + 44).

- [ ] **Step 7: All unit gates**

Run: `npx prettier --write src/shared tests/unit eslint.config.mjs && npm run lint && npm run format:check && npm run typecheck && npm test`
Expected (*measured*, E15): every command exits 0 — `npm run lint` included, so no existing file
in `app/`, `src/ui/` or `tests/e2e/` breaks the new rule; Vitest **427/427**.

- [ ] **Step 8: Commit**

```bash
git add src/shared/test-ids.ts tests/unit/shared/test-ids.test.ts eslint.config.mjs tests/unit/boundaries.test.ts tests/fixtures/boundaries
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(shared): test-ids.ts, and a lint rule that keeps every data-testid in it (T-04, ADR-0003)"
```

---

