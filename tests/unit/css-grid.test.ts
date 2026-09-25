import { readFileSync } from "node:fs";
import { join } from "node:path";
import stylelint from "stylelint";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const RULE = "declaration-property-value-disallowed-list";

/**
 * TD-9, US-33 AC2: `stylelint.config.mjs` fails on a bare `fr` column track. Like
 * `boundaries.test.ts`, each case hands source to the linter with a `codeFilename` under `app/`
 * or `src/`, so the repository's own config is found and read — the shipped rule is tested, not
 * a copy. The fixtures use the `.css.fixture` extension, which neither `npm run lint:css` nor
 * Prettier reads.
 */
const lintFixture = async (name: string) => {
  const code = readFileSync(join(repoRoot, "tests/fixtures/css-grid", name), "utf8");
  const { results } = await stylelint.lint({
    code,
    codeFilename: join(repoRoot, "src/ui/css-grid-fixture.module.css"),
    cwd: repoRoot,
  });
  return results[0]?.warnings ?? [];
};

describe("a grid column is never a bare fr track (TD-9, US-33 AC2)", () => {
  it("no stylesheet under app/ or src/ has one", async () => {
    const { results, errored } = await stylelint.lint({
      files: ["app/**/*.css", "src/**/*.css"],
      cwd: repoRoot,
    });
    // The scan reads something: the two files whose grids the rule was written for.
    const files = results.map((result) => result.source);
    expect(files).toContain(join(repoRoot, "app/(app)/overview/page.module.css"));
    expect(files).toContain(join(repoRoot, "src/ui/overview/PotsCard.module.css"));

    const violations = results.flatMap((result) =>
      result.warnings.map((warning) => `${result.source}:${warning.line} ${warning.text}`),
    );
    expect(violations).toEqual([]);
    expect(errored).toBe(false);
  });

  it("(fixture) reports every bare fr form, on its own line, as an error", async () => {
    const warnings = await lintFixture("bare-fr.css.fixture");

    expect(warnings.map((warning) => warning.line)).toEqual([4, 8, 12, 16, 20, 24, 29, 34]);
    for (const warning of warnings) {
      expect(warning.rule).toBe(RULE);
      expect(warning.severity).toBe("error");
      expect(warning.text).toMatch(/^TD-9: a bare fr column track/);
    }
  });

  it("(fixture) accepts a definite minimum, ignores comments, rows and custom properties", async () => {
    expect(await lintFixture("definite-minimum.css.fixture")).toEqual([]);
  });
});
