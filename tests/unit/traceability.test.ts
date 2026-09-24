import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkTraceability,
  definedStoryIds,
  releaseStoryIds,
  testSources,
  titleStoryIds,
} from "@/scripts/traceability";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/**
 * A call as the scanner reads it, built from parts. This file is itself scanned (it lives under
 * tests/), so it must hold no literal `test("US-…")` of its own: one would name a story that no
 * real test names — and mask a missing one.
 */
const call = (fn: string, title: string, quote = '"') =>
  `${fn}(${quote}${title}${quote}, () => {});`;

const RELEASE_1 = [
  "US-01",
  "US-02",
  "US-03",
  "US-04",
  "US-05",
  "US-06",
  "US-07",
  "US-08",
  "US-31",
  "US-32",
  "US-33",
  "US-34",
  "US-35",
  "US-36",
  "US-37",
  "US-38",
  "US-39",
  "US-41",
];

describe("the release's story list (PRD §5)", () => {
  it("expands the Release 1 'Stories:' sentence, ranges included, and stops before Deferred", () => {
    expect(releaseStoryIds(read("docs/01-requirements/prd.md"))).toEqual(RELEASE_1);
  });

  it("is what docs/03-specs/release-1-stories.txt holds, one id per line", () => {
    expect(read("docs/03-specs/release-1-stories.txt")).toBe(`${RELEASE_1.join("\n")}\n`);
  });

  it("refuses a PRD with no Release 1 story sentence instead of returning an empty list", () => {
    expect(() => releaseStoryIds("### Release 1\n\nNo list here.\n\n### Release 2\n")).toThrow(
      /Stories:/,
    );
  });
});

describe("titleStoryIds (NFR-T2: the id is in the test title)", () => {
  it("reads test, it, describe and test.describe titles — quotes, backticks, wrapped calls", () => {
    const source = [
      call("test", "US-01 a plain title"),
      call("it", "US-02 single quotes", "'"),
      call("describe", "US-03 a group"),
      call("test.describe", "US-04 a template", "`"),
      `test(\n  "US-05 a title Prettier wrapped onto the next line",\n  async () => {},\n);`,
    ].join("\n");
    expect([...titleStoryIds(source)].sort()).toEqual([
      "US-01",
      "US-02",
      "US-03",
      "US-04",
      "US-05",
    ]);
  });

  it("ignores a story id in a comment, a skipped test, an expectation message or an import", () => {
    const source = [
      "// US-06 covered elsewhere",
      call("test.skip", "US-07 not running"),
      call("test.fixme", "US-08 broken"),
      'expect(value, "US-31 in a message").toBe(1);',
      'import x from "./US-32";',
    ].join("\n");
    expect([...titleStoryIds(source)]).toEqual([]);
  });
});

describe("checkTraceability — the failing fixtures (DoD v1.1)", () => {
  const defined = ["US-01", "US-02", "US-09"];

  it("passes when every release story is in a title", () => {
    const sources = [call("test", "US-01 a"), call("test", "US-02 b")];
    expect(checkTraceability({ release: ["US-01", "US-02"], defined, sources })).toEqual({
      missing: [],
      unknown: [],
    });
  });

  it("reports a story that is named only in a comment", () => {
    const sources = [call("test", "US-01 a"), "// US-02 is tested somewhere, honestly"];
    expect(checkTraceability({ release: ["US-01", "US-02"], defined, sources }).missing).toEqual([
      "US-02",
    ]);
  });

  it("does not require a story outside the release, and does not mind one being tested early", () => {
    const sources = [call("test", "US-01 a"), call("describe", "US-09 a Release 2 story")];
    expect(checkTraceability({ release: ["US-01"], defined, sources })).toEqual({
      missing: [],
      unknown: [],
    });
  });

  it("reports an id in a title that user-stories.md does not define (a typo)", () => {
    const sources = [call("test", "US-01 a"), call("test", "US-99 typo")];
    expect(checkTraceability({ release: ["US-01"], defined, sources }).unknown).toEqual(["US-99"]);
  });
});

describe("this repository", () => {
  it("has a title for every Release 1 story and no undefined id", () => {
    const result = checkTraceability({
      release: RELEASE_1,
      defined: definedStoryIds(read("docs/01-requirements/user-stories.md")),
      sources: testSources(repoRoot),
    });
    expect(result).toEqual({ missing: [], unknown: [] });
  });
});
