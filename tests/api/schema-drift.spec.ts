import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const repoRoot = join(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/schema-drift.sh");

/** Runs the drift script against a copy of the real schema that `edit` has changed. */
function driftAgainstEditedSchema(edit: (schema: string) => string) {
  const dir = mkdtempSync(join(tmpdir(), "schema-drift-"));
  try {
    const edited = join(dir, "schema.prisma");
    writeFileSync(edited, edit(readFileSync(join(repoRoot, "prisma/schema.prisma"), "utf8")));
    return spawnSync("sh", [script, edited], { cwd: repoRoot, encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** T-13 (T-02 hand-off): `prisma/schema.prisma` and the migrations that build the database agree. */
test("the migrated database matches prisma/schema.prisma", () => {
  const run = spawnSync("sh", [script], { cwd: repoRoot, encoding: "utf8" });
  expect(run.status, run.stdout + run.stderr).toBe(0);
});

test("a schema with a table no migration creates is reported as drift", () => {
  const run = driftAgainstEditedSchema(
    (schema) => `${schema}\nmodel SchemaDriftFixture {\n  id Int @id\n}\n`,
  );
  expect(run.status, run.stdout + run.stderr).toBe(2);
  expect(run.stdout).toContain("SchemaDriftFixture");
  // Only the fixture differs from the migrated database: against an empty one every table would be listed.
  expect(run.stdout).not.toContain("Balance");
});

test("a migrated table the schema no longer has is reported as drift", () => {
  // Stands in for a migration that was written without the matching schema edit.
  const run = driftAgainstEditedSchema((schema) =>
    schema.replace(/model LoginAttempt \{[^}]*\}\n?/, ""),
  );
  expect(run.status, run.stdout + run.stderr).toBe(2);
  expect(run.stdout).toContain("LoginAttempt");
  expect(run.stdout).not.toContain("Balance");
});
