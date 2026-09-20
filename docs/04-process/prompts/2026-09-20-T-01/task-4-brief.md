## Task 4: Vitest

**Files:**

- Create: `vitest.config.ts`
- Modify: `package.json` (scripts `test`, `test:watch`, `test:coverage`)

**Interfaces:**

- Consumes: the `@/*` alias from Task 1's `tsconfig.json`.
- Produces: `npm test` running every file matching `tests/unit/**/*.test.ts(x)`; the
  `@/` alias resolving inside tests; coverage available on demand via
  `npm run test:coverage` with the v8 provider and no threshold (T-13 sets the 90 % gate).

- [ ] **Step 1: Install Vitest and its helpers**

```bash
npm install -D vitest@^5 @vitest/coverage-v8@^5 jsdom@^30 vite-tsconfig-paths@^6
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * ADR-0003 — unit layer: src/domain, src/shared, src/webmcp adapter.
 * The default environment is `node`; a DOM test opts in per file with
 * `// @vitest-environment jsdom`.
 * The ≥ 90 % statements gate on `domain` is added in T-13, when there is domain code.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**", "tests/api/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/domain/**", "src/shared/**", "src/webmcp/**"],
    },
  },
});
```

- [ ] **Step 3: Add the scripts to `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 4: Write a temporary test that proves the runner works**

`tests/unit/scaffold.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("scaffold", () => {
  it("runs Vitest", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(unit): Vitest configuration per ADR-0003 (T-01)"
```

---
