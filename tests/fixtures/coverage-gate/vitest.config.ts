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
