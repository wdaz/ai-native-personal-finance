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
