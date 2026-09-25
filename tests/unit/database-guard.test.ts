import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { childEnv } from "../fixtures/child-env";

const repoRoot = join(import.meta.dirname, "..", "..");

/**
 * `.invalid` never resolves (RFC 6761): were the guard missing, the run would fail on DNS. Built
 * from a variable, not spelled out: the secret scan reads a literal `scheme://user:password@host`
 * as a leak, and `${…}` is one of its placeholders.
 */
const SECRET = "s3cret-pw";
const OTHER_MACHINE = `postgresql://user:${SECRET}@db.example.invalid:5432/personal_finance`;
/** Local, but nothing listens on port 1: a run that passes the guard fails at the connection. */
const LOCAL_NOBODY_LISTENING = "postgresql://user:password@localhost:1/personal_finance";

/**
 * Runs `npx <args>` in the repository with only `DATABASE_URL` decided by the test — a value
 * already in the environment wins over `.env.local` (prisma.config.ts, playwright.config.ts),
 * so a contributor's own file cannot change the outcome.
 */
function run(args: string[], databaseUrl: string) {
  return spawnSync("npx", args, {
    cwd: repoRoot,
    env: { ...childEnv(), DATABASE_URL: databaseUrl },
    encoding: "utf8",
    timeout: 90_000,
  });
}

const REFUSED = /Refusing to run: DATABASE_URL does not name this machine/;

describe("the seed refuses another machine's database (TD-10, npm run db:reset)", () => {
  it("stops with the reason, before it opens a connection", () => {
    const result = run(["tsx", "prisma/seed.ts"], OTHER_MACHINE);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(REFUSED);
    expect(result.stderr).not.toContain(SECRET);
    expect(result.stdout).not.toMatch(/reset reason=manual/);
  }, 90_000);

  it("(control) a local URL passes the guard and fails later, at the connection", () => {
    const result = run(["tsx", "prisma/seed.ts"], LOCAL_NOBODY_LISTENING);

    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toMatch(/Refusing to run/);
  }, 90_000);
});

describe("Playwright refuses another machine's database (TD-10, test:api, test:e2e, the UI mode)", () => {
  it("loads no config, so no test runs", () => {
    const result = run(["playwright", "test", "--list", "--project=api"], OTHER_MACHINE);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(REFUSED);
    expect(result.stderr).not.toContain(SECRET);
  }, 90_000);

  it("(control) a local URL lets the same command list the tests", () => {
    const result = run(["playwright", "test", "--list", "--project=api"], LOCAL_NOBODY_LISTENING);

    expect(result.stderr).not.toMatch(/Refusing to run/);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/\[api\] › api\//);
  }, 90_000);
});
