import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const repoRoot = join(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/schema-drift.sh");

/** T-13 (T-02 hand-off): `prisma/schema.prisma` and the migrations that build the database agree. */
test("the migrated database matches prisma/schema.prisma", () => {
  const run = spawnSync("sh", [script], { cwd: repoRoot, encoding: "utf8" });
  expect(run.status, run.stdout + run.stderr).toBe(0);
});

test("a schema with a table no migration creates is reported as drift", () => {
  const dir = mkdtempSync(join(tmpdir(), "schema-drift-"));
  try {
    const drifted = join(dir, "schema.prisma");
    writeFileSync(
      drifted,
      `${readFileSync(join(repoRoot, "prisma/schema.prisma"), "utf8")}\nmodel SchemaDriftFixture {\n  id Int @id\n}\n`,
    );
    const run = spawnSync("sh", [script, drifted], { cwd: repoRoot, encoding: "utf8" });
    expect(run.status, run.stdout + run.stderr).toBe(2);
    expect(run.stdout).toContain("SchemaDriftFixture");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
