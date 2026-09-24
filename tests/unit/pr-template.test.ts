import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/** The `- [ ] …` lines of a Markdown document, text only, in order. */
const checklist = (markdown: string) =>
  [...markdown.matchAll(/^- \[[ xX]\] (.+)$/gm)].map(([, text]) => text!.trim());

/** What `expected` has that `actual` lacks, and the reverse. */
const diff = (expected: string[], actual: string[]) => ({
  missing: expected.filter((item) => !actual.includes(item)),
  extra: actual.filter((item) => !expected.includes(item)),
});

describe("the PR template mirrors docs/03-specs/definition-of-done.md (DoD, build-workflow §5)", () => {
  const dod = checklist(read("docs/03-specs/definition-of-done.md"));
  const template = read(".github/pull_request_template.md");

  it("carries every DoD item, word for word, and none of its own, all unticked", () => {
    expect(dod.length).toBeGreaterThan(20);
    expect(diff(dod, checklist(template))).toEqual({ missing: [], extra: [] });
    expect(template).not.toMatch(/^- \[[xX]\]/m);
  });

  it("(fixture) reports an item the template dropped and one it invented", () => {
    const stale = dod.filter((item) => item !== dod[0]).concat("An item the DoD does not have");
    expect(diff(dod, stale)).toEqual({
      missing: [dod[0]],
      extra: ["An item the DoD does not have"],
    });
  });
});
