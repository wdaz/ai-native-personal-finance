import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/**
 * ADR-0007: Vercel builds and runs the app, and its builds and functions offer "24.x (default),
 * 22.x, 20.x" (vercel.com/docs/functions/runtimes/node-js/node-js-versions, read 2026-09-25).
 * 20.x is left out: Vercel deprecates it for builds and functions on 2026-10-01 (changelog
 * "Node.js 20 is being deprecated", read 2026-09-25), and iron-session 9 needs Node >= 22.13
 * (package-lock.json). CI and local runs take their Node from `.nvmrc`, so a major outside this
 * list is tested on a runtime that is never deployed. Add a major only after re-reading that page.
 */
const DEPLOYABLE_NODE_MAJORS = [22, 24];

/** The major `.nvmrc` names — `24`, `v24`, `24.20.0` — or NaN for an alias such as `lts/*`. */
const nvmrcMajor = (nvmrc: string) => Number(/^v?(\d+)(?:\.|$)/.exec(nvmrc.trim())?.[1]);

/**
 * `engines.node` pins the major as `<major>.x`. Vercel reads it over the project setting, so a
 * range such as ">=24" would move to a newer major there before CI's `.nvmrc` does.
 */
const enginesPinsMajor = (engines: string, major: number) => engines === `${major}.x`;

/** `@types/node` describes the major: `^24.…`, `~24.…` or an exact `24.…`, never `^240.…`. */
const typesMatchMajor = (range: string, major: number) =>
  new RegExp(`^[\\^~]?${major}\\.`).test(range);

describe("the Node runtime CI tests is the one Vercel deploys (ADR-0007)", () => {
  const major = nvmrcMajor(read(".nvmrc"));
  const pkg = JSON.parse(read("package.json")) as {
    engines: { node: string };
    devDependencies: Record<string, string>;
  };

  it(".nvmrc names a Node major that Vercel builds and runs", () => {
    expect(DEPLOYABLE_NODE_MAJORS).toContain(major);
  });

  it("package.json engines.node pins the same major", () => {
    expect(enginesPinsMajor(pkg.engines.node, major), pkg.engines.node).toBe(true);
  });

  it("@types/node describes the same major", () => {
    const range = pkg.devDependencies["@types/node"]!;
    expect(typesMatchMajor(range, major), range).toBe(true);
  });

  it("(fixture) reports a major Vercel does not deploy, and reads every .nvmrc spelling", () => {
    expect(DEPLOYABLE_NODE_MAJORS).not.toContain(nvmrcMajor("26\n"));
    expect(DEPLOYABLE_NODE_MAJORS).not.toContain(nvmrcMajor("20"));
    expect(nvmrcMajor("v24")).toBe(24);
    expect(nvmrcMajor("24.20.0\n")).toBe(24);
    expect(nvmrcMajor("lts/*")).toBeNaN();
  });

  it("(fixture) reports an engines.node that is not `<major>.x`", () => {
    expect(enginesPinsMajor(">=26", 26)).toBe(false);
    expect(enginesPinsMajor(">=24", 24)).toBe(false);
    expect(enginesPinsMajor("^24.0.0", 24)).toBe(false);
    expect(enginesPinsMajor("26.x", 24)).toBe(false);
  });

  it("(fixture) reports @types/node for another major, one that only starts with its digits included", () => {
    expect(typesMatchMajor("^26.6.2", 24)).toBe(false);
    expect(typesMatchMajor("^240.0.0", 24)).toBe(false);
    expect(typesMatchMajor("24.13.6", 24)).toBe(true);
    expect(typesMatchMajor("~24.1.0", 24)).toBe(true);
  });
});
