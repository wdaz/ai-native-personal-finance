import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { childEnv } from "../fixtures/child-env";

const repoRoot = join(import.meta.dirname, "..", "..");
const scratch: string[] = [];
afterAll(() => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

type PackageJson = {
  allowScripts: Record<string, boolean>;
  scripts: Record<string, string>;
} & Record<string, unknown>;

/** A directory with the repository's lockfile, `.npmrc` (unless dropped) and a mutated package.json. */
function stage(options: { npmrc?: boolean; mutate?: (pkg: PackageJson) => void } = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "install-scripts-"));
  scratch.push(dir);
  copyFileSync(join(repoRoot, "package-lock.json"), join(dir, "package-lock.json"));
  if (options.npmrc !== false) copyFileSync(join(repoRoot, ".npmrc"), join(dir, ".npmrc"));
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as PackageJson;
  // The root project's own `postinstall` (prisma generate) and `prepare` (git hooks) run even
  // under `--dry-run` and need files this directory lacks; `allowScripts` never covers them.
  delete pkg.scripts.postinstall;
  delete pkg.scripts.prepare;
  options.mutate?.(pkg);
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg, null, 2));
  return dir;
}

/** `npm ci --dry-run` resolves the lockfile and checks the install-script policy, and installs nothing. */
const dryRunCi = (cwd: string) =>
  spawnSync("npm", ["ci", "--dry-run"], { cwd, encoding: "utf8", env: childEnv() });

const withoutEsbuild = (pkg: PackageJson) => {
  delete pkg.allowScripts["esbuild@0.28.2"];
};

/** T-13: an install script package.json's `allowScripts` does not name fails the install. */
describe("install-script policy (strict-allow-scripts)", () => {
  it("lets the repository's own package.json and lockfile install", () => {
    const run = dryRunCi(stage());
    expect(run.status, run.stderr).toBe(0);
  }, 60_000);

  it("(fixture) fails when a dependency's install script is no longer named in allowScripts", () => {
    const run = dryRunCi(stage({ mutate: withoutEsbuild }));
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain("ESTRICTALLOWSCRIPTS");
    expect(run.stderr).toContain("esbuild@0.28.2");
  }, 60_000);

  it("(fixture) is `.npmrc` that enforces it — the same package.json installs without the file", () => {
    const run = dryRunCi(stage({ npmrc: false, mutate: withoutEsbuild }));
    expect(run.status, run.stderr).toBe(0);
  }, 60_000);
});
