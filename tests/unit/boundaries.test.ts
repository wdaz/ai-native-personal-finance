import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ESLint } from "eslint";
import { getFileInfo } from "prettier";
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
    // Prisma 7 generates the client into src/server/generated/prisma (T-02); app may import
    // src/server, so only the Prisma rule stands between this import and the database.
    fixture: "app-imports-prisma-generated.ts.fixture",
    lintAs: "app/api/imports-prisma-generated.ts",
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
    // TD-11: the build downloads the font from Google Fonts. Same block as the Prisma rule —
    // the Prisma cases above still pass only if the two patterns coexist.
    fixture: "app-imports-next-font-google.tsx.fixture",
    lintAs: "app/imports-next-font-google.tsx",
    ruleId: "no-restricted-imports",
    message: "TD-11: next/font/google downloads the font at build time",
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
  {
    // `Date()` without `new` returns the current time as text; the rule missed it until T-03.
    fixture: "domain-calls-date.ts.fixture",
    lintAs: "src/domain/calls-date.ts",
    ruleId: "no-restricted-syntax",
    message: "ADR-0005: inject a Clock instead of calling Date()",
  },
  {
    fixture: "server-calls-date.ts.fixture",
    lintAs: "src/server/calls-date.ts",
    ruleId: "no-restricted-syntax",
    message: "ADR-0005: inject a Clock instead of calling Date()",
  },
  {
    fixture: "ui-literal-test-id.tsx.fixture",
    lintAs: "src/ui/literal-test-id.tsx",
    ruleId: "no-restricted-syntax",
    message: "ADR-0003: take the data-testid from TEST_IDS",
  },
  {
    fixture: "e2e-literal-test-id.ts.fixture",
    lintAs: "tests/e2e/literal-test-id.spec.ts",
    ruleId: "no-restricted-syntax",
    message: "ADR-0003: take the test id from TEST_IDS",
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
    fixture: "app-imports-next-font-local-allowed.tsx.fixture",
    lintAs: "app/imports-next-font-local-allowed.tsx",
  },
  {
    fixture: "scripts-imports-shared-allowed.ts.fixture",
    lintAs: "scripts/imports-shared-allowed.ts",
  },
  {
    fixture: "scripts-imports-domain-allowed.ts.fixture",
    lintAs: "scripts/imports-domain-allowed.ts",
  },
  {
    // ADR-0005 forbids reading the wall clock, not building a fixed date: `fixedClock`
    // needs `new Date(<ms>)`, and a rule that caught it would make the Clock unwritable.
    fixture: "domain-parses-date-allowed.ts.fixture",
    lintAs: "src/domain/parses-date-allowed.ts",
  },
  {
    fixture: "webmcp-imports-shared-allowed.ts.fixture",
    lintAs: "src/webmcp/imports-shared-allowed.ts",
  },
  {
    // ADR-0003: an id read from TEST_IDS is the one form the test-id rule allows.
    fixture: "ui-shared-test-id-allowed.tsx.fixture",
    lintAs: "src/ui/shared-test-id-allowed.tsx",
  },
  {
    fixture: "e2e-shared-test-id-allowed.ts.fixture",
    lintAs: "tests/e2e/shared-test-id-allowed.spec.ts",
  },
];

// The rules only see an import that resolves; an unresolved one is classified external
// and every policy allows external. If one of these disappears the fixtures stop being
// violations, so assert them separately to keep that failure legible.
const importTargets = [
  "src/server/db.ts",
  "src/domain/clock.ts",
  "src/webmcp/README.md",
  "app/(app)/README.md",
  "src/shared/env.ts",
  "src/shared/test-ids.ts",
];

describe("eslint enforces ADR-0002, ADR-0003 and ADR-0005 (tests/fixtures/boundaries)", () => {
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

/**
 * Agent tools keep workspaces inside the checkout, and each hides itself from git its own
 * way: `.superpowers/` (the superpowers skills' plans: briefs, reports, review scratch with
 * copies of `tests/` and `node_modules`) and `.remember/` (the Remember plugin's session
 * notes) through a nested `.gitignore` of `*`; `.claude/worktrees/`, where every worktree is
 * a full copy of the repository with its own `.next/` build output, through the root
 * .gitignore. ESLint's flat config reads no .gitignore and lints dot-directories; Prettier
 * reads the root .gitignore and .prettierignore only. Unignored, they fail `npm run lint`
 * and `npm run format:check` on files nobody commits — on 2026-09-22, in the main checkout,
 * 84 lint errors from one worktree and 10 format warnings from `.remember/`.
 */
const workspaces = [
  ".superpowers/sdd/2026-01-01-example/scratch/typescript-rules-enabled.ts",
  ".claude/worktrees/T-99-example/src/shared/typescript-rules-enabled.ts",
  ".remember/tmp/typescript-rules-enabled.ts",
];

// The Prettier CLI's default ignore files; the API reads none unless it is told to.
const prettierIgnored = async (path: string) =>
  (
    await getFileInfo(join(repoRoot, path), {
      ignorePath: [join(repoRoot, ".gitignore"), join(repoRoot, ".prettierignore")],
    })
  ).ignored;

describe("agent workspaces inside the checkout are neither linted nor formatted", () => {
  const fixture = "typescript-rules-enabled.ts.fixture";

  it("the same file outside a workspace is linted and formatted", async () => {
    // Without this, "nothing reported" and "ignored" below could mean the fixture stopped
    // violating, or that every path reads as ignored.
    const outside = "src/shared/typescript-rules-enabled.ts";
    expect(await lintFixture(fixture, outside)).toHaveLength(2);
    expect(await prettierIgnored(outside)).toBe(false);
  });

  it.each(workspaces)("eslint ignores %s", async (lintAs) => {
    expect(await eslint.isPathIgnored(join(repoRoot, lintAs))).toBe(true);
    expect(await lintFixture(fixture, lintAs)).toEqual([]);
  });

  it.each(workspaces)("prettier ignores %s", async (path) => {
    expect(await prettierIgnored(path)).toBe(true);
  });
});
