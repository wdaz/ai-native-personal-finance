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
