import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { childEnv } from "../fixtures/child-env";

// governance.md, "Branches and releases" (T-15b): main takes pull requests from develop or
// hotfix/<name>-main only, and CI and CodeQL run on develop as on main.
const REPO = "wdaz/ai-native-personal-finance";
const FORK = "someone/ai-native-personal-finance";

function check(env: Record<string, string>) {
  // A variable the parent run happens to carry must not stand in for one a case leaves out.
  const inherited = childEnv();
  for (const name of ["HEAD_REF", "HEAD_REPO", "BASE_REPO"]) delete inherited[name];
  return spawnSync("sh", ["scripts/check-release-source.sh"], {
    env: { ...inherited, ...env },
    encoding: "utf8",
  });
}
const source = (ref: string, repo = REPO) =>
  check({ HEAD_REF: ref, HEAD_REPO: repo, BASE_REPO: REPO });

/** `branches:` of one trigger, or undefined when the trigger has no filter. */
function branchesOf(workflow: string, event: string): string[] | undefined {
  const block = workflow.match(new RegExp(`^  ${event}:\\n((?:(?:    .*)?\\n)*)`, "m"))?.[1];
  const list = block?.match(/^\s+branches: \[(.*)\]$/m)?.[1];
  return list?.split(",").map((branch) => branch.trim().replace(/^"|"$/g, ""));
}

/**
 * Lines that read the pull request's head anywhere but as a whole `env:` value
 * (`NAME: ${{ github.event.pull_request.head.… }}`): a `run:` line, a `run: |` block's body, a
 * checkout `ref:`. The head's branch name is text anyone can choose.
 */
function unsafe(workflow: string): string[] {
  const envValue = /^\s+[A-Z][A-Z0-9_]*: \$\{\{ github\.event\.pull_request\.head\.[a-z_.]+ \}\}$/;
  return workflow
    .split("\n")
    .filter((line) => /github\.(event\.pull_request\.head|head_ref)/.test(line))
    .filter((line) => !envValue.test(line));
}

const read = (path: string) => readFileSync(path, "utf8");

describe("scripts/check-release-source.sh", () => {
  it.each(["develop", "hotfix/login-500-main", "hotfix/a/b-main"])(
    "lets %s open a pull request to main",
    (ref) => {
      expect(source(ref).status).toBe(0);
    },
  );

  it.each([
    "task/T-15b-checks",
    "docs/T-15b-plan",
    "main",
    "developer",
    "Develop",
    "hotfix/login-500",
    "hotfix/-main",
    "hotfix/login-500-main-x",
    "hotfix-main",
    "hotfix",
    "hotfix/",
    "dependabot/npm_and_yarn/next-16.3.6",
    "develop; echo pwned",
    "$(echo develop)",
  ])("refuses %s, naming the rule", (ref) => {
    const run = source(ref);
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/governance\.md, Branches and releases/);
  });

  it.each(["develop", "hotfix/x-main"])("refuses %s from another repository (a fork)", (ref) => {
    expect(source(ref, FORK).status).toBe(1);
  });

  it("refuses when the event gave it nothing (dash exits 2, bash 1 — measured at the plan gate)", () => {
    expect(check({}).status).not.toBe(0);
    expect(check({ HEAD_REF: "", HEAD_REPO: REPO, BASE_REPO: REPO }).status).not.toBe(0);
  });
});

describe(".github/workflows/release-source.yml", () => {
  const workflow = read(".github/workflows/release-source.yml");

  it("runs on pull_request_target for main, a base change included", () => {
    expect(workflow).toMatch(/^  pull_request_target:$/m);
    expect(branchesOf(workflow, "pull_request_target")).toEqual(["main"]);
    expect(workflow).toMatch(/types: \[opened, reopened, synchronize, edited\]/);
  });

  it("reports the status context main's ruleset requires", () => {
    expect(workflow).toMatch(/^    name: release source$/m);
  });

  it("never puts the pull request's head into a run line or a checkout ref", () => {
    expect(unsafe(workflow)).toEqual([]);
    expect(workflow).toMatch(/HEAD_REF: \$\{\{ github\.event\.pull_request\.head\.ref \}\}/);
  });

  it("(fixture) reports a run line, a checkout ref and a block-scalar line that read the head", () => {
    const bad = [
      "      - run: echo ${{ github.event.pull_request.head.ref }}",
      "          ref: ${{ github.event.pull_request.head.sha }}",
      "        run: |",
      '          echo "${{ github.head_ref }}"',
      "          HEAD_REF: ${{ github.event.pull_request.head.ref }}",
      "          HEAD_REPO: ${{ github.event.pull_request.head.repo.full_name }}",
    ].join("\n");
    expect(unsafe(bad)).toEqual([
      "      - run: echo ${{ github.event.pull_request.head.ref }}",
      "          ref: ${{ github.event.pull_request.head.sha }}",
      '          echo "${{ github.head_ref }}"',
    ]);
  });
});

describe("the workflows run on develop as on main", () => {
  it("CI runs on every pull request and on pushes to both branches", () => {
    const ci = read(".github/workflows/ci.yml");
    // `branchesOf` also returns undefined for a trigger that is not there at all.
    expect(ci).toMatch(/^  pull_request:$/m);
    expect(branchesOf(ci, "pull_request")).toBeUndefined();
    expect(branchesOf(ci, "push")).toEqual(["main", "develop"]);
  });

  it("CodeQL runs on pushes and pull requests of both branches", () => {
    const codeql = read(".github/workflows/codeql.yml");
    expect(branchesOf(codeql, "push")).toEqual(["main", "develop"]);
    expect(branchesOf(codeql, "pull_request")).toEqual(["main", "develop"]);
  });

  it("(fixture) reads a main-only trigger as main-only", () => {
    expect(branchesOf("on:\n  push:\n    branches: [main]\n", "push")).toEqual(["main"]);
  });
});
