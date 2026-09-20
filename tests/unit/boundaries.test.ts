import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const fixtureDir = join(repoRoot, "tests/fixtures/boundaries");

/**
 * ADR-0002's Consequences say "boundaries depend on lint discipline — CI must fail on
 * violations", and nothing proved that they still do. The rules disabled themselves three
 * times during T-01 without `eslint` ever exiting non-zero, so the guarantee is asserted
 * here instead of being taken on trust.
 *
 * Each fixture is real source with a fake address: `lintText` is told a `filePath` under
 * src/ or app/, and that path is what the boundaries plugin classifies. The repository's
 * own eslint.config.mjs, tsconfig.json alias and import resolver do the rest, so this
 * tests the shipped configuration rather than a copy of it.
 * See tests/fixtures/boundaries/README.md for why the imports target README/CSS files.
 */
const eslint = new ESLint({ cwd: repoRoot });

const lintFixture = async (fixture: string, lintAs: string) => {
  const code = readFileSync(join(fixtureDir, fixture), "utf8");
  const [result] = await eslint.lintText(code, {
    filePath: join(repoRoot, lintAs),
    warnIgnored: false,
  });
  return result?.messages ?? [];
};

const violations = [
  {
    fixture: "domain-imports-server-relative.ts.fixture",
    lintAs: "src/domain/imports-server-relative.ts",
    ruleId: "boundaries/dependencies",
    message: "ADR-0002: domain must not import server.",
  },
  {
    fixture: "domain-imports-server-alias.ts.fixture",
    lintAs: "src/domain/imports-server-alias.ts",
    ruleId: "boundaries/dependencies",
    message: "ADR-0002: domain must not import server.",
  },
  {
    fixture: "shared-imports-domain.ts.fixture",
    lintAs: "src/shared/imports-domain.ts",
    ruleId: "boundaries/dependencies",
    message: "ADR-0002: shared must not import domain.",
  },
  {
    fixture: "shared-imports-server.ts.fixture",
    lintAs: "src/shared/imports-server.ts",
    ruleId: "boundaries/dependencies",
    message: "ADR-0002: shared must not import server.",
  },
  {
    fixture: "domain-imports-app.ts.fixture",
    lintAs: "src/domain/imports-app.ts",
    ruleId: "boundaries/dependencies",
    message: "ADR-0002: domain must not import app.",
  },
  {
    fixture: "domain-imports-webmcp.ts.fixture",
    lintAs: "src/domain/imports-webmcp.ts",
    ruleId: "boundaries/dependencies",
    message: "ADR-0002: domain must not import webmcp.",
  },
  {
    fixture: "webmcp-imports-server.ts.fixture",
    lintAs: "src/webmcp/imports-server.ts",
    ruleId: "boundaries/dependencies",
    message: "ADR-0002: webmcp must not import server.",
  },
  {
    fixture: "scripts-imports-server.ts.fixture",
    lintAs: "scripts/imports-server.ts",
    ruleId: "boundaries/dependencies",
    message: "ADR-0002: scripts must not import server.",
  },
  {
    fixture: "app-imports-prisma.ts.fixture",
    lintAs: "app/(app)/overview/imports-prisma.ts",
    ruleId: "no-restricted-imports",
    message: "ADR-0002: only src/server may import Prisma",
  },
  {
    fixture: "app-imports-prisma-edge.ts.fixture",
    lintAs: "app/api/imports-prisma-edge.ts",
    ruleId: "no-restricted-imports",
    message: "ADR-0002: only src/server may import Prisma",
  },
  {
    fixture: "ui-imports-prisma.ts.fixture",
    lintAs: "src/ui/imports-prisma.ts",
    ruleId: "no-restricted-imports",
    message: "ADR-0002: only src/server may import Prisma",
  },
  {
    // A type-only import counts: ADR-0002 keeps shared free of the rest, and deriving
    // its schemas from Prisma types is an ADR conversation rather than a lint exception.
    fixture: "shared-imports-prisma.ts.fixture",
    lintAs: "src/shared/imports-prisma.ts",
    ruleId: "no-restricted-imports",
    message: "ADR-0002: only src/server may import Prisma",
  },
  {
    fixture: "domain-uses-new-date.ts.fixture",
    lintAs: "src/domain/uses-new-date.ts",
    ruleId: "no-restricted-syntax",
    message: "ADR-0005: inject a Clock instead of calling new Date()",
  },
  {
    fixture: "domain-uses-date-now.ts.fixture",
    lintAs: "src/domain/uses-date-now.ts",
    ruleId: "no-restricted-syntax",
    message: "ADR-0005: inject a Clock instead of calling Date.now().",
  },
  {
    // ADR-0005 names src/server as well as src/domain: the seed, the reset and the
    // session all decide things by date, so both halves of the rule need a fixture.
    fixture: "server-uses-new-date.ts.fixture",
    lintAs: "src/server/uses-new-date.ts",
    ruleId: "no-restricted-syntax",
    message: "ADR-0005: inject a Clock instead of calling new Date()",
  },
  {
    fixture: "server-uses-date-now.ts.fixture",
    lintAs: "src/server/uses-date-now.ts",
    ruleId: "no-restricted-syntax",
    message: "ADR-0005: inject a Clock instead of calling Date.now().",
  },
];

/**
 * The legal counterparts. A rule set that rejected everything would satisfy every case
 * above, so each layer pair ADR-0002 permits gets a fixture that must report nothing.
 */
const allowed = [
  {
    fixture: "domain-imports-shared-allowed.ts.fixture",
    lintAs: "src/domain/imports-shared-allowed.ts",
  },
  {
    fixture: "app-imports-server-allowed.ts.fixture",
    lintAs: "app/(app)/imports-server-allowed.ts",
  },
  {
    fixture: "server-imports-domain-allowed.ts.fixture",
    lintAs: "src/server/imports-domain-allowed.ts",
  },
  {
    fixture: "scripts-imports-shared-allowed.ts.fixture",
    lintAs: "scripts/imports-shared-allowed.ts",
  },
  {
    fixture: "webmcp-imports-shared-allowed.ts.fixture",
    lintAs: "src/webmcp/imports-shared-allowed.ts",
  },
];

// The rules only see an import that resolves; an unresolved one is classified external
// and every policy allows external. If one of these disappears the fixtures stop being
// violations, so assert them separately to keep that failure legible.
const importTargets = [
  "src/server/README.md",
  "src/domain/README.md",
  "src/webmcp/README.md",
  "app/(app)/README.md",
  "src/shared/env.ts",
];

describe("eslint enforces ADR-0002 and ADR-0005 (tests/fixtures/boundaries)", () => {
  it.each(importTargets)("the fixtures' import target %s exists", (target) => {
    expect(existsSync(join(repoRoot, target))).toBe(true);
  });

  it.each(violations)("$lintAs reports $ruleId", async ({ fixture, lintAs, ruleId, message }) => {
    const messages = await lintFixture(fixture, lintAs);
    expect(messages.map((m) => m.ruleId)).toEqual([ruleId]);
    expect(messages[0]?.message).toContain(message);
    // Severity 2, not 1: ADR-0002 says "CI must fail on violations", and `npm run lint`
    // would exit 0 on a warning were it not for --max-warnings 0. Asserting the severity
    // keeps the guarantee even if that flag is ever dropped.
    expect(messages[0]?.severity).toBe(2);
  });

  it.each(allowed)("$lintAs reports nothing", async ({ fixture, lintAs }) => {
    const messages = await lintFixture(fixture, lintAs);
    expect(messages.map((m) => `${m.ruleId}: ${m.message}`)).toEqual([]);
  });

  it("has the typescript-eslint rules enabled", async () => {
    const messages = await lintFixture(
      "typescript-rules-enabled.ts.fixture",
      "src/shared/typescript-rules-enabled.ts",
    );
    expect(messages.map((m) => m.ruleId).sort()).toEqual([
      "@typescript-eslint/no-explicit-any",
      "@typescript-eslint/no-unused-vars",
    ]);
  });
});
