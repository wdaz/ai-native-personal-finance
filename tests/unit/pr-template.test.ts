import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/** The `- [ ] …` lines of a Markdown document, text only, in order. */
const checklist = (markdown: string) =>
  [...markdown.matchAll(/^- \[[ xX]\] (.+)$/gm)].map(([, text]) => text!.trim());

/** A ticked checklist line; `checklist` ignores the box, so this is the only guard against one. */
const ticked = /^- \[[xX]\]/m;

/** What `expected` has that `actual` lacks, and the reverse. */
const diff = (expected: string[], actual: string[]) => ({
  missing: expected.filter((item) => !actual.includes(item)),
  extra: actual.filter((item) => !expected.includes(item)),
});

/** The items as an unticked Markdown checklist, as a template would carry them. */
const asTemplate = (items: string[]) => items.map((item) => `- [ ] ${item}`).join("\n");

describe('the PR template mirrors docs/03-specs/definition-of-done.md (DoD, build-workflow, "Per task" step 5)', () => {
  const dod = checklist(read("docs/03-specs/definition-of-done.md"));
  const template = read(".github/pull_request_template.md");

  it("carries every DoD item, word for word, and none of its own, all unticked", () => {
    expect(dod.length).toBeGreaterThan(20);
    expect(diff(dod, checklist(template))).toEqual({ missing: [], extra: [] });
    expect(checklist(template)).toEqual(dod);
    expect(template).not.toMatch(ticked);
  });

  it("(fixture) reports an item the template dropped and one it invented", () => {
    const stale = checklist(asTemplate(dod.slice(1).concat("An item the DoD does not have")));
    expect(diff(dod, stale)).toEqual({
      missing: [dod[0]],
      extra: ["An item the DoD does not have"],
    });
  });

  it("(fixture) reports a duplicated item and a swapped order, which the set difference cannot", () => {
    const duplicated = checklist(asTemplate([...dod, dod[0]!]));
    const swapped = checklist(asTemplate([dod[1]!, dod[0]!, ...dod.slice(2)]));
    expect(diff(dod, duplicated)).toEqual({ missing: [], extra: [] });
    expect(diff(dod, swapped)).toEqual({ missing: [], extra: [] });
    expect(duplicated).not.toEqual(dod);
    expect(swapped).not.toEqual(dod);
  });

  it("(fixture) reports a ticked item, which `checklist` reads like an unticked one", () => {
    const item = dod[0]!;
    expect(checklist(`- [x] ${item}`)).toEqual([item]);
    expect(`- [x] ${item}`).toMatch(ticked);
    expect(`- [ ] ${item}`).not.toMatch(ticked);
  });
});
