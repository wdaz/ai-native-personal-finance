import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const fixtureDir = join(repoRoot, "tests/fixtures/secret-scan");
const config = join(repoRoot, ".gitleaks.toml");
const gitleaks = join(repoRoot, "scripts/gitleaks.sh");

/**
 * T-02a — NFR-S5: "no secrets in the repo", verified by a secret scan in CI. Gitleaks'
 * default rules miss a Postgres connection string (measured 2026-09-22 against 8.30.1), and
 * a scanner that misses says nothing, so every guarantee below is asserted by making it
 * fail on purpose (DoD v1.1).
 *
 * The fixtures carry `{{…}}` placeholders, which the rule's placeholder allowlist ignores:
 * that is what lets them sit in the tree while the CI scan stays green. The test substitutes
 * fake credentials and scans the result, so the shipped .gitleaks.toml is what is under
 * test and no detectable string is ever committed. See tests/fixtures/secret-scan/README.md.
 */
const FAKE_CREDENTIALS = {
  "{{PASSWORD}}": "npg_T3stOnlyN0tReal",
  "{{PASSWORD_URL_ENCODED}}": "T3st%40Only%21N0tReal",
  "{{WEAK_PASSWORD}}": "postgres",
} as const;

const materialise = (text: string) =>
  Object.entries(FAKE_CREDENTIALS).reduce(
    (out, [placeholder, value]) => out.replaceAll(placeholder, value),
    text,
  );

const readFixture = (name: string) => readFileSync(join(fixtureDir, name), "utf8");

const violations = readFixture("postgres-violations.txt.fixture");
const controls = readFixture("postgres-controls.txt.fixture");
/** One real-looking leak: the Neon pooled URL on the first line of the violations fixture. */
const leakLine = materialise(violations.split("\n")[0] ?? "");

type Finding = { RuleID: string; StartLine: number; File: string };

// Deterministic git: none of the developer's config (signing, hooksPath, templates), and a
// fixed identity so commits work on a CI runner that has none.
const testEnv: NodeJS.ProcessEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "Secret Guard Test",
  GIT_AUTHOR_EMAIL: "secret-guard@example.com",
  GIT_COMMITTER_NAME: "Secret Guard Test",
  GIT_COMMITTER_EMAIL: "secret-guard@example.com",
};

const run = (
  command: string,
  args: string[],
  options: { cwd?: string; input?: string; env?: NodeJS.ProcessEnv } = {},
) => spawnSync(command, args, { encoding: "utf8", env: testEnv, ...options });

/** gitleaks exits 1 with findings and 0 without; any other status is the tool failing. */
const parseReport = (result: SpawnSyncReturns<string>): Finding[] => {
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`gitleaks exited ${result.status}:\n${result.stderr}`);
  }
  return JSON.parse(result.stdout) as Finding[];
};

const report = ["--config", config, "--no-banner", "--report-format", "json", "--report-path", "-"];
const scanText = (text: string) =>
  parseReport(run(gitleaks, ["stdin", ...report], { input: text }));
const scanDir = (dir: string) => parseReport(run(gitleaks, ["dir", ...report, dir]));

const scratchDirs: string[] = [];
const scratch = () => {
  const dir = mkdtempSync(join(tmpdir(), "secret-guard-"));
  scratchDirs.push(dir);
  return dir;
};

const writeInto = (dir: string, file: string, content: string) => {
  mkdirSync(dirname(join(dir, file)), { recursive: true });
  writeFileSync(join(dir, file), content);
};

beforeAll(() => {
  // The first run downloads the pinned binary (scripts/gitleaks.sh); later runs hit the cache.
  const result = run(gitleaks, ["version"]);
  if (result.status !== 0) throw new Error(`scripts/gitleaks.sh failed:\n${result.stderr}`);
}, 120_000);

afterAll(() => {
  for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});

describe("T-02a secret guard", () => {
  describe("scripts/gitleaks.sh", () => {
    it("runs the pinned gitleaks release", () => {
      expect(run(gitleaks, ["version"]).stdout.trim()).toBe("8.30.1");
    });

    it("refuses a download whose SHA-256 is not the pinned one, and keeps nothing", () => {
      const mirror = scratch();
      const cache = scratch();
      for (const platform of ["darwin_arm64", "darwin_x64", "linux_x64", "linux_arm64"]) {
        writeFileSync(join(mirror, `gitleaks_8.30.1_${platform}.tar.gz`), "not a tarball");
      }
      const result = run(gitleaks, ["version"], {
        env: { ...testEnv, GITLEAKS_CACHE_DIR: cache, GITLEAKS_BASE_URL: `file://${mirror}` },
      });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain("checksum mismatch");
      expect(existsSync(join(cache, "8.30.1", "gitleaks"))).toBe(false);
    });
  });

  describe(".gitleaks.toml", () => {
    it("reports every line of the violations fixture as postgres_connection_string", () => {
      const lines = violations.trimEnd().split("\n").length;
      const findings = scanText(materialise(violations));
      // A percent-encoded password is reported a second time once decoded (gitleaks tags
      // it `decoded:percent`), so the reported lines are compared as a set.
      expect(new Set(findings.map((f) => f.StartLine))).toEqual(
        new Set(Array.from({ length: lines }, (_, i) => i + 1)),
      );
      expect(new Set(findings.map((f) => f.RuleID))).toEqual(
        new Set(["postgres_connection_string"]),
      );
    });

    it("reports nothing on the controls fixture", () => {
      expect(scanText(materialise(controls))).toEqual([]);
    });

    it("reports nothing on the fixtures as committed, which is why they can live in the tree", () => {
      expect(scanText(violations)).toEqual([]);
      expect(scanText(controls)).toEqual([]);
    });

    it("still applies gitleaks' default rules ([extend] useDefault)", () => {
      const sample = ["ghp", "_", "Zx9Qw2Er4Ty6Ui8Op0As1Df3Gh5Jk7Lz9Xc2"].join("");
      expect(scanText(`token = "${sample}"\n`).map((f) => f.RuleID)).toEqual(["github-pat"]);
    });

    it("ignores .next/ and docs/00-discovery/inputs/, and nothing else", () => {
      const dir = scratch();
      for (const file of [
        ".next/server/app.js",
        "docs/00-discovery/inputs/notes.md",
        "src/server/db.ts",
      ]) {
        writeInto(dir, file, `${leakLine}\n`);
      }
      expect(scanDir(dir).map((f) => relative(dir, f.File))).toEqual(["src/server/db.ts"]);
    });
  });
});
