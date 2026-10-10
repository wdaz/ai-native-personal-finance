import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { childEnv } from "../fixtures/child-env";

// ADR-0007, amendment 2026-10-05 (owner decision): Vercel skips the build of a commit that changes
// nothing outside docs/, and builds whenever the script cannot tell. Vercel's contract
// (vercel.com/docs/project-configuration/project-settings#ignored-build-step, read 2026-10-05):
// exit 0 skips the build (the deployment is CANCELED), exit 1 builds.
const SCRIPT = join(import.meta.dirname, "..", "..", "scripts", "vercel-ignore-build.sh");
const SKIP = 0;
const BUILD = 1;

const gitEnv = {
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.invalid",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.invalid",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
};

function git(cwd: string, ...args: string[]): string {
  const run = spawnSync("git", ["-c", "commit.gpgsign=false", ...args], {
    cwd,
    env: { ...childEnv(), ...gitEnv },
    encoding: "utf8",
  });
  if (run.status !== 0) throw new Error(`git ${args.join(" ")}: ${run.stderr}`);
  return run.stdout.trim();
}

/** Writes each file, commits them all and returns the new commit's SHA. */
function commit(repo: string, files: Record<string, string>, message: string): string {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), text);
  }
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", message);
  return git(repo, "rev-parse", "HEAD");
}

/** Runs the script in `cwd`; `previous` undefined leaves VERCEL_GIT_PREVIOUS_SHA unset. */
function ignore(cwd: string, previous?: string) {
  const env = childEnv();
  delete env.VERCEL_GIT_PREVIOUS_SHA;
  if (previous !== undefined) env.VERCEL_GIT_PREVIOUS_SHA = previous;
  return spawnSync("sh", [SCRIPT], { cwd, env, encoding: "utf8" });
}

let root: string;
let repo: string;
let base: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "vercel-ignore-build-"));
  repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, "init", "-q");
  base = commit(
    repo,
    {
      "src/app.ts": "export const a = 1;\n",
      "docs/guide.md": "# Guide\n",
      "vercel.json": "{}\n",
    },
    "base",
  );
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Each case starts from `base` on a branch of its own, so cases do not see each other's commits. */
function branchFromBase(name: string) {
  git(repo, "checkout", "-q", "-b", name, base);
}

describe("scripts/vercel-ignore-build.sh (ADR-0007, amendment 2026-10-05)", () => {
  it("skips a commit that changes only files under docs/", () => {
    branchFromBase("docs-only");
    commit(repo, { "docs/guide.md": "# Guide v2\n", "docs/new/page.md": "new\n" }, "docs");
    const run = ignore(repo, base);
    expect(run.status).toBe(SKIP);
    expect(run.stdout).toMatch(/skipping/);
  });

  it("skips several docs-only commits since the last successful deployment", () => {
    branchFromBase("docs-twice");
    commit(repo, { "docs/a.md": "a\n" }, "docs 1");
    commit(repo, { "docs/b.md": "b\n" }, "docs 2");
    expect(ignore(repo, base).status).toBe(SKIP);
  });

  it("skips a commit that only deletes a file under docs/", () => {
    branchFromBase("docs-delete");
    git(repo, "rm", "-q", "docs/guide.md");
    git(repo, "commit", "-q", "-m", "delete");
    expect(ignore(repo, base).status).toBe(SKIP);
  });

  it("builds a commit that changes src/", () => {
    branchFromBase("src");
    commit(repo, { "src/app.ts": "export const a = 2;\n" }, "src");
    const run = ignore(repo, base);
    expect(run.status).toBe(BUILD);
    expect(run.stdout).toMatch(/src\/app\.ts/);
  });

  it("builds a commit that changes docs/ and src/ together", () => {
    branchFromBase("mixed");
    commit(repo, { "docs/guide.md": "# v3\n", "src/app.ts": "export const a = 3;\n" }, "mixed");
    expect(ignore(repo, base).status).toBe(BUILD);
  });

  it("builds a commit that changes a root file such as vercel.json", () => {
    branchFromBase("root-file");
    commit(repo, { "vercel.json": '{"regions":["fra1"]}\n' }, "config");
    expect(ignore(repo, base).status).toBe(BUILD);
  });

  it.each(["docsx/a.md", "src/docs/a.md", "doc/a.md"])(
    "builds a commit that changes %s (not under the top-level docs/)",
    (path) => {
      branchFromBase(`near-docs-${path.replace(/\W/g, "-")}`);
      commit(repo, { [path]: "x\n" }, "near docs");
      expect(ignore(repo, base).status).toBe(BUILD);
    },
  );

  it("builds a move from src/ into docs/ (the deletion under src/ counts)", () => {
    branchFromBase("rename");
    git(repo, "mv", "src/app.ts", "docs/app.ts");
    git(repo, "commit", "-q", "-m", "move");
    expect(ignore(repo, base).status).toBe(BUILD);
  });

  it("builds when a src/ commit lies between the last deployment and a docs-only head", () => {
    branchFromBase("src-then-docs");
    commit(repo, { "src/app.ts": "export const a = 4;\n" }, "src, its build failed");
    commit(repo, { "docs/guide.md": "# v4\n" }, "docs");
    expect(ignore(repo, base).status).toBe(BUILD);
  });

  it("builds when nothing changed since the last deployment (a redeploy)", () => {
    branchFromBase("same");
    const run = ignore(repo, base);
    expect(run.status).toBe(BUILD);
    expect(run.stdout).toMatch(/nothing changed/);
  });

  it("builds when VERCEL_GIT_PREVIOUS_SHA is unset or empty (a branch's first deployment)", () => {
    branchFromBase("first");
    commit(repo, { "docs/first.md": "x\n" }, "docs");
    for (const run of [ignore(repo), ignore(repo, "")]) {
      expect(run.status).toBe(BUILD);
      expect(run.stdout).toMatch(/VERCEL_GIT_PREVIOUS_SHA is empty/);
    }
  });

  it("builds when the previous SHA is not in the repository", () => {
    branchFromBase("unknown");
    commit(repo, { "docs/unknown.md": "x\n" }, "docs");
    const run = ignore(repo, "0123456789abcdef0123456789abcdef01234567");
    expect(run.status).toBe(BUILD);
    expect(run.stdout).toMatch(/not in this clone/);
  });

  it.each([
    "HEAD~1",
    "--output=/tmp/x",
    "main",
    "abc def",
    "0123456789ABCDEF0123456789ABCDEF01234567",
  ])("builds when the previous SHA is not a lowercase hex SHA (%s)", (previous) => {
    branchFromBase(`not-a-sha-${previous.replace(/\W/g, "-")}`);
    commit(repo, { "docs/odd.md": "x\n" }, "docs");
    expect(ignore(repo, previous).status).toBe(BUILD);
  });

  it("builds when the previous SHA is older than a shallow clone reaches", () => {
    branchFromBase("deep");
    commit(repo, { "docs/deep-1.md": "1\n" }, "docs 1");
    commit(repo, { "docs/deep-2.md": "2\n" }, "docs 2");
    const shallow = join(root, "shallow");
    git(root, "clone", "-q", "--depth=1", "--branch", "deep", `file://${repo}`, shallow);
    const run = ignore(shallow, base);
    expect(run.status).toBe(BUILD);
    expect(run.stdout).toMatch(/not in this clone/);
  });

  it("builds outside a git repository", () => {
    const empty = join(root, "not-a-repo");
    mkdirSync(empty);
    expect(ignore(empty, base).status).toBe(BUILD);
  });
});
