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
