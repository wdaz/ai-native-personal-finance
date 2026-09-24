import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const fixtureDir = join(repoRoot, "tests/fixtures/secret-scan");
const config = join(repoRoot, ".gitleaks.toml");
const gitleaks = join(repoRoot, "scripts/gitleaks.sh");
const secretScan = join(repoRoot, "scripts/secret-scan.sh");
const hooksDir = join(repoRoot, "scripts/git-hooks");
const installHooks = join(repoRoot, "scripts/install-git-hooks.sh");

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
const FAKE_PASSWORD = FAKE_CREDENTIALS["{{PASSWORD}}"];

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

const git = (cwd: string, ...args: string[]) => {
  const result = run("git", args, { cwd });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed:\n${result.stderr}`);
  return result.stdout.trim();
};

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

/** Every file called `gitleaks` under a cache directory, however deep. */
const binariesIn = (dir: string) =>
  readdirSync(dir, { recursive: true, encoding: "utf8" }).filter(
    (path) => basename(path) === "gitleaks",
  );

/** scripts/gitleaks.sh's name for the machine running the tests (its `uname` case). */
const thisPlatform = `${process.platform === "darwin" ? "darwin" : "linux"}_${
  process.arch === "arm64" ? "arm64" : "x64"
}`;

const writeInto = (dir: string, file: string, content: string) => {
  mkdirSync(dirname(join(dir, file)), { recursive: true });
  writeFileSync(join(dir, file), content);
};

const newRepo = () => {
  const repo = scratch();
  git(repo, "init", "-q", "-b", "main");
  return repo;
};

const commitFile = (repo: string, file: string, content: string, message: string) => {
  writeInto(repo, file, content);
  git(repo, "add", file);
  git(repo, "commit", "-q", "-m", message);
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
      expect(binariesIn(cache)).toEqual([]);
    });

    it("never runs a binary another platform left in the cache (keyed by os_arch)", () => {
      // The fixture: what a Linux run sharing this node_modules left on a Mac on 2026-09-22 —
      // a binary in the version-only slot the cache used to have, and one in each other
      // platform's slot. Here each is a script that announces itself if it is ever run.
      const cache = scratch();
      const foreign = "#!/bin/sh\necho foreign-binary-ran\nexit 3\n";
      for (const slot of ["", "darwin_arm64", "darwin_x64", "linux_x64", "linux_arm64"]) {
        const bin = join(cache, "8.30.1", slot, "gitleaks");
        if (slot === thisPlatform) continue;
        writeInto(cache, relative(cache, bin), foreign);
        chmodSync(bin, 0o755);
      }
      // An empty mirror: the wrapper must go for its own platform's download, which fails
      // offline and deterministically instead of running anything it found.
      const result = run(gitleaks, ["version"], {
        env: { ...testEnv, GITLEAKS_CACHE_DIR: cache, GITLEAKS_BASE_URL: `file://${scratch()}` },
      });
      expect(result.stdout).not.toContain("foreign-binary-ran");
      expect(result.stderr).toContain(`downloading gitleaks 8.30.1 (${thisPlatform})`);
      expect(result.status).not.toBe(0);
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

  describe("scripts/secret-scan.sh history (the CI job and npm run secrets:scan)", () => {
    const scanHistory = (repo: string) => run(secretScan, ["history"], { cwd: repo });

    it("finds a secret that was committed and later deleted, and never prints it", () => {
      const repo = newRepo();
      commitFile(repo, ".env", `${leakLine}\n`, "add");
      git(repo, "rm", "-q", ".env");
      git(repo, "commit", "-q", "-m", "remove");
      const result = scanHistory(repo);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("postgres_connection_string");
      expect(result.stdout + result.stderr).not.toContain(FAKE_PASSWORD);
    });

    /** A merge whose conflict was resolved by typing the leak: it exists only in the merge. */
    const conflictLeakRepo = () => {
      const repo = newRepo();
      commitFile(repo, "config.txt", "a\nb\nc\n", "base");
      git(repo, "switch", "-q", "-c", "feature");
      commitFile(repo, "config.txt", "a\nfeature\nc\n", "feature");
      git(repo, "switch", "-q", "main");
      commitFile(repo, "config.txt", "a\nmain\nc\n", "main");
      expect(run("git", ["merge", "-q", "feature"], { cwd: repo }).status).not.toBe(0);
      commitFile(repo, "config.txt", `a\n${leakLine}\nc\n`, "merge feature");
      return repo;
    };

    it("finds a secret typed only while resolving a merge conflict (--diff-merges=separate)", () => {
      expect(scanHistory(conflictLeakRepo()).status).toBe(1);
    });

    it("finds a secret typed into a commit message, and never prints it (T-13)", () => {
      const repo = newRepo();
      commitFile(repo, "a.txt", "a\n", `note\n\n${leakLine}`);
      const result = scanHistory(repo);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("postgres_connection_string");
      expect(result.stdout + result.stderr).not.toContain(FAKE_PASSWORD);
    });

    it("finds a secret typed into an annotated tag message (T-13)", () => {
      const repo = newRepo();
      commitFile(repo, "a.txt", "a\n", "one");
      git(repo, "tag", "-a", "v1", "-m", `release\n\n${leakLine}`);
      const result = scanHistory(repo);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("postgres_connection_string");
      expect(result.stdout + result.stderr).not.toContain(FAKE_PASSWORD);
    });

    it("passes a message that quotes the .env.example default, as it passes the file", () => {
      const repo = newRepo();
      const exampleUrl = readFileSync(join(repoRoot, ".env.example"), "utf8")
        .split("\n")
        .find((line) => line.startsWith("DATABASE_URL="));
      expect(exampleUrl).toBeDefined();
      commitFile(repo, "a.txt", "a\n", `note\n\n${exampleUrl}`);
      git(repo, "tag", "-a", "v1", "-m", `release\n\n${exampleUrl}`);
      expect(scanHistory(repo).status).toBe(0);
    });

    it("passes messages that hold no secret, and still reports a file leak beside them", () => {
      const clean = newRepo();
      commitFile(clean, "a.txt", "a\n", "docs: a plain message");
      const cleanResult = scanHistory(clean);
      expect(cleanResult.status).toBe(0);
      expect(cleanResult.stderr).toContain("secret-scan: commit and tag messages");
      const leaky = newRepo();
      commitFile(leaky, ".env", `${leakLine}\n`, "add");
      expect(scanHistory(leaky).status).toBe(1);
    });

    it("still finds it under a developer's log.diffMerges=dense-combined and color.ui=always", () => {
      const repo = conflictLeakRepo();
      git(repo, "config", "log.diffMerges", "dense-combined");
      git(repo, "config", "color.ui", "always");
      expect(scanHistory(repo).status).toBe(1);
    });

    it("finds a secret added and removed inside a merged branch (no --first-parent)", () => {
      const repo = newRepo();
      commitFile(repo, "README.md", "base\n", "base");
      git(repo, "switch", "-q", "-c", "feature");
      commitFile(repo, ".env", `${leakLine}\n`, "add");
      git(repo, "rm", "-q", ".env");
      git(repo, "commit", "-q", "-m", "remove");
      git(repo, "switch", "-q", "main");
      git(repo, "merge", "-q", "--no-ff", "--no-edit", "feature");
      git(repo, "branch", "-q", "-D", "feature");
      expect(scanHistory(repo).status).toBe(1);
    });

    it("passes a history whose only connection string is the .env.example default", () => {
      const repo = newRepo();
      commitFile(repo, ".env.example", readFileSync(join(repoRoot, ".env.example"), "utf8"), "env");
      expect(scanHistory(repo).status).toBe(0);
    });

    it("never prints any part of a password, one with a percent-encoded @ included", () => {
      const repo = newRepo();
      commitFile(repo, ".env", materialise(violations), "all violations");
      const result = scanHistory(repo);
      expect(result.status).toBe(1);
      for (const part of ["N0tReal", "T3st", FAKE_PASSWORD]) {
        expect(result.stdout + result.stderr).not.toContain(part);
      }
    });

    it("refuses a directory that is not a git work tree instead of passing on nothing", () => {
      const dir = scratch();
      const result = run(secretScan, ["history"], {
        cwd: dir,
        env: { ...testEnv, GIT_CEILING_DIRECTORIES: dirname(dir) },
      });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain("not inside a git work tree");
    });

    it("refuses a shallow clone instead of passing on one commit", () => {
      const origin = newRepo();
      commitFile(origin, "a.txt", "a\n", "one");
      commitFile(origin, "b.txt", "b\n", "two");
      const clone = scratch();
      git(clone, "clone", "-q", "--depth", "1", `file://${origin}`, ".");
      const result = scanHistory(clone);
      expect(result.status).toBe(2);
      expect(result.stderr).toContain("fetch-depth: 0");
    });
  });

  describe("package.json", () => {
    const { scripts } = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    it("runs the history scan first in test:all, the command CI mirrors", () => {
      expect(scripts["secrets:scan"]).toBe("scripts/secret-scan.sh history");
      expect(scripts["test:all"]?.startsWith("npm run secrets:scan && ")).toBe(true);
    });

    it("installs the hook on npm install and npm ci (prepare)", () => {
      expect(scripts.prepare).toBe("sh scripts/install-git-hooks.sh");
    });
  });

  describe("scripts/git-hooks/pre-commit", () => {
    const hookedRepo = () => {
      const repo = newRepo();
      git(repo, "config", "core.hooksPath", hooksDir);
      return repo;
    };

    it("lets a clean commit through", () => {
      const repo = hookedRepo();
      writeInto(repo, ".env.example", readFileSync(join(repoRoot, ".env.example"), "utf8"));
      git(repo, "add", ".env.example");
      expect(run("git", ["commit", "-q", "-m", "clean"], { cwd: repo }).status).toBe(0);
    });

    it("blocks a commit that stages a secret", () => {
      const repo = hookedRepo();
      commitFile(repo, "README.md", "clean\n", "clean");
      writeInto(repo, ".env", `${leakLine}\n`);
      git(repo, "add", ".env");
      const result = run("git", ["commit", "-q", "-m", "leak"], { cwd: repo });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("commit blocked");
      expect(result.stderr).toContain("git commit --no-verify");
      expect(result.stdout + result.stderr).not.toContain(FAKE_PASSWORD);
      expect(git(repo, "rev-list", "--count", "HEAD")).toBe("1");
    });

    it.each(["color.ui", "color.diff"])(
      "blocks a staged secret when the developer sets %s=always",
      (key) => {
        const repo = hookedRepo();
        git(repo, "config", key, "always");
        commitFile(repo, "README.md", "clean\n", "clean");
        writeInto(repo, ".env", `${leakLine}\n`);
        git(repo, "add", ".env");
        const result = run("git", ["commit", "-q", "-m", "leak"], { cwd: repo });
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain("commit blocked");
        expect(git(repo, "rev-list", "--count", "HEAD")).toBe("1");
      },
    );

    it("blocks the commit when gitleaks cannot run (fails closed, D10)", () => {
      const repo = hookedRepo();
      const emptyDir = scratch();
      writeInto(repo, "a.txt", "clean\n");
      git(repo, "add", "a.txt");
      const result = run("git", ["commit", "-q", "-m", "clean"], {
        cwd: repo,
        env: { ...testEnv, GITLEAKS_CACHE_DIR: scratch(), GITLEAKS_BASE_URL: `file://${emptyDir}` },
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("commit blocked");
      expect(run("git", ["rev-parse", "--verify", "-q", "HEAD"], { cwd: repo }).status).not.toBe(0);
    });

    it("is committed executable, because git skips a non-executable hook with only a hint", () => {
      const files = [
        "scripts/git-hooks/pre-commit",
        "scripts/gitleaks.sh",
        "scripts/install-git-hooks.sh",
        "scripts/secret-scan.sh",
      ];
      const staged = git(repoRoot, "ls-files", "--stage", ...files)
        .split("\n")
        .map((line) => {
          const [mode, , , path] = line.split(/\s+/);
          return `${mode} ${path}`;
        });
      expect(staged).toEqual(files.map((file) => `100755 ${file}`));
    });
  });

  describe("scripts/install-git-hooks.sh", () => {
    it("points core.hooksPath at scripts/git-hooks", () => {
      const repo = newRepo();
      expect(run("sh", [installHooks], { cwd: repo }).status).toBe(0);
      expect(git(repo, "config", "core.hooksPath")).toBe("scripts/git-hooks");
    });

    it("does nothing outside a git work tree", () => {
      const dir = scratch();
      const result = run("sh", [installHooks], {
        cwd: dir,
        env: { ...testEnv, GIT_CEILING_DIRECTORIES: dirname(dir) },
      });
      expect(result.status).toBe(0);
    });
  });
});
