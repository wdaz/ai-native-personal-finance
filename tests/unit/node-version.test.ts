import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");

/**
 * ADR-0007: Vercel builds and runs the app, and its builds and functions offer only these Node
 * majors — "Current available versions are: 24.x (default), 22.x, 20.x"
 * (vercel.com/docs/functions/runtimes/node-js/node-js-versions, read 2026-09-25). CI and local
 * runs take their Node from `.nvmrc`, so a major outside this list is tested on a runtime that is
 * never deployed. Add a major here only after re-reading that page.
 */
const VERCEL_NODE_MAJORS = [20, 22, 24];

const nvmrcMajor = Number(
  /^v?(\d+)/.exec(readFileSync(join(repoRoot, ".nvmrc"), "utf8").trim())?.[1],
);
const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
  engines: { node: string };
  devDependencies: Record<string, string>;
};

describe("the Node runtime CI tests is the one Vercel deploys", () => {
  it(".nvmrc names a Node major that Vercel builds and runs", () => {
    expect(VERCEL_NODE_MAJORS).toContain(nvmrcMajor);
  });

  it("package.json engines.node pins the same major", () => {
    // Vercel reads engines.node over the project setting, so a range such as ">=24" would move
    // to a newer major there before CI's .nvmrc does.
    expect(pkg.engines.node).toBe(`${nvmrcMajor}.x`);
  });

  it("@types/node describes the same major", () => {
    expect(pkg.devDependencies["@types/node"]).toMatch(new RegExp(`^\\^${nvmrcMajor}\\.`));
  });
});
