import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

type VercelConfig = {
  regions?: string[];
  installCommand?: string;
  buildCommand?: string;
  crons?: { path: string; schedule: string }[];
};

/**
 * What vercel.json must say (ADR-0007 and its T-14 amendment):
 * - `regions`: `fra1` only — the Neon project is in aws-eu-central-1 (Frankfurt) and a Neon region
 *   never changes; Vercel's default is iad1 (vercel.com/docs/functions/configuring-functions/region,
 *   read 2026-09-25).
 * - `installCommand`: `npm ci`, the lockfile exactly, as CI installs it; with a lockfile Vercel
 *   otherwise runs `npm install` (vercel.com/docs/package-managers, read 2026-09-25).
 * - `buildCommand`: migrations first — through the direct URL, prisma.config.ts — then the build,
 *   so no deployment runs against an older schema.
 * - `crons`: the daily reset, unchanged (ADR-0007 amendment 2026-09-23).
 */
const vercelConfigProblems = (config: VercelConfig): string[] => {
  const problems: string[] = [];
  if (JSON.stringify(config.regions) !== JSON.stringify(["fra1"])) problems.push("regions");
  if (config.installCommand !== "npm ci") problems.push("installCommand");
  if (config.buildCommand !== "npx prisma migrate deploy && npm run build") {
    problems.push("buildCommand");
  }
  const cron = [{ path: "/api/admin/reset", schedule: "0 3 * * *" }];
  if (JSON.stringify(config.crons) !== JSON.stringify(cron)) problems.push("crons");
  return problems;
};

/**
 * `.gitignore` must ignore the directory `neon link` writes, exactly as the root-anchored line
 * `/.neon` (plan F13): a comment or a nested pattern does not count.
 */
const gitignoreProblems = (text: string): string[] =>
  text.split("\n").includes("/.neon") ? [] : ["/.neon"];

describe("vercel.json deploys to fra1, installs with npm ci and migrates before it builds (ADR-0007, T-14)", () => {
  it("says what ADR-0007 and its T-14 amendment say", () => {
    expect(vercelConfigProblems(JSON.parse(read("vercel.json")) as VercelConfig)).toEqual([]);
  });

  it("(fixture) reports every rule an empty file breaks", () => {
    expect(vercelConfigProblems({})).toEqual([
      "regions",
      "installCommand",
      "buildCommand",
      "crons",
    ]);
  });

  it("(fixture) reports Vercel's defaults and the old ten-day cron", () => {
    expect(
      vercelConfigProblems({
        regions: ["iad1"],
        installCommand: "npm install",
        buildCommand: "npm run build",
        crons: [{ path: "/api/admin/reset", schedule: "0 3 */10 * *" }],
      }),
    ).toEqual(["regions", "installCommand", "buildCommand", "crons"]);
  });

  it("(fixture) reports migrations run after the build", () => {
    expect(
      vercelConfigProblems({
        regions: ["fra1"],
        installCommand: "npm ci",
        buildCommand: "npm run build && npx prisma migrate deploy",
        crons: [{ path: "/api/admin/reset", schedule: "0 3 * * *" }],
      }),
    ).toEqual(["buildCommand"]);
  });

  it(".gitignore keeps `neon link`'s .neon out of the repository (F13)", () => {
    expect(gitignoreProblems(read(".gitignore"))).toEqual([]);
  });

  it("(fixture) reports a .gitignore that does not ignore .neon", () => {
    expect(gitignoreProblems("/.vercel\n*.tsbuildinfo\n")).toEqual(["/.neon"]);
  });

  it("(fixture) does not take a comment or a nested pattern for the root-anchored line", () => {
    expect(gitignoreProblems("# /.neon\nsrc/.neon\n")).toEqual(["/.neon"]);
  });
});
