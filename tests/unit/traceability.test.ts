import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkTraceability,
  cumulativeStoryIds,
  definedStoryIds,
  listedReleases,
  NOT_YET_BUILT,
  RELEASE_BEING_BUILT,
  releaseStoryIds,
  run,
  storyListPath,
  testSources,
  titleStoryIds,
} from "@/scripts/traceability";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/**
 * A call as the scanner reads it, built from parts: every fixture below is a string, so this
 * file's own source holds no test call that names a story (the scan reads syntax, so it would not
 * count a string anyway — this keeps the fixtures readable as text).
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

/** The stories first delivered in Release 2 (PRD §5, v1.3): the four pages, then the mutating tools. */
const RELEASE_2 = [
  ...Array.from({ length: 22 }, (_, i) => `US-${String(i + 9).padStart(2, "0")}`),
  "US-40",
];

const PRD = read("docs/01-requirements/prd.md");

describe("the release's story list (PRD §5)", () => {
  it("expands the Release 1 'Stories:' sentence, ranges included, and stops before Deferred", () => {
    expect(releaseStoryIds(PRD)).toEqual(RELEASE_1);
    expect(releaseStoryIds(PRD, 1)).toEqual(RELEASE_1);
  });

  it("expands the Release 2 'Stories:' sentence: 23 ids, the four pages and the mutating tools", () => {
    expect(releaseStoryIds(PRD, 2)).toEqual(RELEASE_2);
    expect(RELEASE_2).toHaveLength(23);
  });

  it("is what docs/03-specs/release-N-stories.txt holds, one id per line", () => {
    expect(read(storyListPath(1))).toBe(`${RELEASE_1.join("\n")}\n`);
    expect(read(storyListPath(2))).toBe(`${RELEASE_2.join("\n")}\n`);
  });

  it("names the list file by release number", () => {
    expect(storyListPath(2)).toBe("docs/03-specs/release-2-stories.txt");
  });

  it("refuses a PRD with no Release 1 story sentence instead of returning an empty list", () => {
    expect(() => releaseStoryIds("### Release 1\n\nNo list here.\n\n### Release 2\n")).toThrow(
      /Stories:/,
    );
  });

  it("refuses a release with no story sentence, and says which release", () => {
    expect(() => releaseStoryIds("### Release 2\n\nNo list here.\n\n### Release 3\n", 2)).toThrow(
      /Release 2.*Stories:/,
    );
  });

  it("ends a release's block at the next release heading, not at Release 2's", () => {
    const prd = [
      "### Release 1 — a",
      "Stories: US-01, US-02. Deferred to Release 2: US-02 AC2.",
      "### Release 2 — b",
      "Stories: US-09…US-11, US-40.",
      "### Release 3 — c",
      "Stories: US-50.",
    ].join("\n");
    expect(releaseStoryIds(prd, 1)).toEqual(["US-01", "US-02"]);
    expect(releaseStoryIds(prd, 2)).toEqual(["US-09", "US-10", "US-11", "US-40"]);
    expect(releaseStoryIds(prd, 3)).toEqual(["US-50"]);
  });

  it("does not read the next release's sentence as a release's own when it has none", () => {
    // The sentence terminator cannot stop this one: only the block's end keeps Release 2 from US-50.
    const prd = "### Release 2 — b\nNo list here.\n### Release 3 — c\nStories: US-50.\n";
    expect(() => releaseStoryIds(prd, 2)).toThrow(/Release 2.*Stories:/);
    expect(listedReleases(prd)).toEqual([3]);
  });

  it("ends the last release's block at the next section heading, not at the end of the file", () => {
    const prd = "### Release 3 — c\nNo new stories.\n\n## 6. Functional\nStories: US-60.\n";
    expect(() => releaseStoryIds(prd, 3)).toThrow(/Release 3.*Stories:/);
    expect(listedReleases(prd)).toEqual([]);
  });

  it("reads `Stories:` only where it starts a line, not in 'User Stories:' mid-sentence", () => {
    const prd = "### Release 3 — c\nSee the User Stories: US-61 and US-62 for these.\n";
    expect(() => releaseStoryIds(prd, 3)).toThrow(/Release 3.*Stories:/);
  });

  it("stops a sentence at 'Deferred' when no full stop comes before it", () => {
    const prd = "### Release 1 — a\nStories: US-01, US-02 Deferred to Release 2: US-09.\n";
    expect(releaseStoryIds(prd, 1)).toEqual(["US-01", "US-02"]);
  });

  it("lists the releases that carry a story sentence: Release 3 has none", () => {
    expect(listedReleases(PRD)).toEqual([1, 2]);
  });

  it("is cumulative: the release being built and every one before it, in order, without a repeat", () => {
    expect(cumulativeStoryIds(PRD, 1)).toEqual(RELEASE_1);
    const both = cumulativeStoryIds(PRD, 2);
    expect(both).toEqual([...RELEASE_1, ...RELEASE_2]);
    expect(both).toHaveLength(41);
    expect(new Set(both).size).toBe(41);
    const repeated = [
      "### Release 1 — a",
      "Stories: US-01, US-02. Deferred",
      "### Release 2 — b",
      "Stories: US-02, US-03.",
    ].join("\n");
    expect(cumulativeStoryIds(repeated, 2)).toEqual(["US-01", "US-02", "US-03"]);
  });

  it("fails closed: the release being built must have its own story sentence", () => {
    const prd = "### Release 1 — a\nStories: US-01. Deferred\n### Release 2 — b\nNo list yet.\n";
    expect(() => cumulativeStoryIds(prd, 2)).toThrow(/Release 2.*Stories:.*being built/);
    expect(cumulativeStoryIds(prd, 1)).toEqual(["US-01"]);
  });

  it("reads Release 2, being built since T-17 (ADR-0003, clarification 2026-10-04, dated line 2026-10-10)", () => {
    expect(RELEASE_BEING_BUILT).toBe(2);
  });
});

describe("titleStoryIds (NFR-T2: the id is in the test title)", () => {
  const T = "US-02 a title";
  const ID = ["US-02"];

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

  // The controls: each accepted form DOES count, so a scanner that counts nothing cannot pass.
  it.each([
    ["test", call("test", T)],
    ["it", call("it", T, "'")],
    ["describe", call("describe", T)],
    ["test.describe", call("test.describe", T)],
    ["test.describe.serial", call("test.describe.serial", T)],
    ["test.only and it.only", `${call("test.only", "US-01 a")}\n${call("it.only", T)}`],
    ["a plain template literal title", call("test", T, "`")],
    ["a template literal title with a substitution", `test(\`${T} \${n}\`, () => {});`],
    [
      "a test inside a group whose own title names nothing",
      `describe("g", () => { ${call("it", T)} });`,
    ],
    ["a JSX file", `const view = <p>{1}</p>;\n${call("test", T)}`],
    [
      "a conditional skip, which is out of scope",
      `test("${T}", () => { if (x) { test.skip(); } test.skip(browserName === "webkit", "why"); });`,
    ],
  ])("counts %s", (_form, source) => {
    expect(titleStoryIds(source).has("US-02")).toBe(true);
  });

  it("reads a .ts file's generic arrow, which a TSX parse takes for JSX, and the test after it", () => {
    const source = `const make = <T>(value: T) => value;\n${call("test", T)}`;
    expect(titleStoryIds(source, "generic.test.ts").has("US-02")).toBe(true);
    expect(
      checkTraceability({
        release: ID,
        defined: ID,
        sources: [{ path: "generic.test.ts", source }],
      }).missing,
    ).toEqual([]);
  });

  it("holds no story id in a test title of its own (this file is scanned like any suite)", () => {
    // An id here would count as "named" for the real check and mask a story that no suite names.
    expect(
      titleStoryIds(readFileSync(import.meta.filename, "utf8"), import.meta.filename).size,
    ).toBe(0);
  });

  it("does not let a substitution join two digits into an id", () => {
    expect([...titleStoryIds("test(`US-0${n}1`, () => {});")]).toEqual([]);
  });

  // Not a test call, or not a running one: none of these names US-02, and each is the shape a
  // text scan would have counted.
  it.each([
    ["a line comment", `// ${call("test", T)}`],
    ["a block comment", `/* ${call("it", T)} */`],
    ["a JSDoc line", `/**\n * ${call("it", T)}\n */`],
    ["a single-quoted string", `const s = '${call("test", T)}';`],
    ["a template literal string", `const s = \`${call("test", T, "'")}\`;`],
    ["a regular expression's .test()", `/x/.${call("test", T)}`],
    ["a Zod .describe()", `z.string().${call("describe", T)}`],
    ["a .test() on another object", `matcher.${call("test", T)}`],
    ["an expectation message", `expect(value, "${T}").toBe(1);`],
    ["an import", 'import x from "./US-02";'],
    ["it.skip", call("it.skip", T)],
    ["xit", call("xit", T)],
    ["xtest", call("xtest", T)],
    ["test.fixme", call("test.fixme", T)],
    ["test.todo", call("test.todo", T)],
    ["a describe.skip's own title", call("describe.skip", T)],
    ["xdescribe's own title", call("xdescribe", T)],
    ["test.describe.skip's own title", call("test.describe.skip", T)],
    ["a test inside describe.skip", `describe.skip("g", () => { ${call("it", T)} });`],
    ["a test inside xdescribe", `xdescribe("g", () => { ${call("it", T)} });`],
    ["a test inside test.describe.skip", `test.describe.skip("g", () => { ${call("test", T)} });`],
    [
      "a test inside test.describe.fixme",
      `test.describe.fixme("g", () => { ${call("test", T)} });`,
    ],
    [
      "a test nested two groups below a skipped one",
      `describe.skip("a", () => { describe("b", () => { ${call("it", T)} }); });`,
    ],
    ["a test whose body skips unconditionally", `test("${T}", () => { test.skip(); });`],
    [
      "a test whose body is marked fixme unconditionally",
      `test("${T}", async () => { await x(); test.fixme(); });`,
    ],
    [
      "a group whose body skips unconditionally",
      `test.describe("g", () => { test.skip(); ${call("test", T)} });`,
    ],
  ])("ignores %s", (_form, source) => {
    expect([...titleStoryIds(source)]).toEqual([]);
    expect(checkTraceability({ release: ID, defined: ID, sources: [source] }).missing).toEqual(ID);
  });
});

describe("checkTraceability — the failing fixtures (DoD v1.1)", () => {
  const defined = ["US-01", "US-02", "US-09"];

  it("passes when every release story is in a title", () => {
    const sources = [call("test", "US-01 a"), call("test", "US-02 b")];
    expect(checkTraceability({ release: ["US-01", "US-02"], defined, sources })).toEqual({
      missing: [],
      unknown: [],
      alreadyNamed: [],
    });
  });

  it("reports a story that is named only in a comment", () => {
    const sources = [call("test", "US-01 a"), `// ${call("test", "US-02 tested somewhere")}`];
    expect(checkTraceability({ release: ["US-01", "US-02"], defined, sources }).missing).toEqual([
      "US-02",
    ]);
  });

  it("does not require a story outside the release, and does not mind one being tested early", () => {
    const sources = [call("test", "US-01 a"), call("describe", "US-09 a Release 2 story")];
    expect(checkTraceability({ release: ["US-01"], defined, sources })).toEqual({
      missing: [],
      unknown: [],
      alreadyNamed: [],
    });
  });

  it("reports an id in a title that user-stories.md does not define (a typo)", () => {
    const sources = [call("test", "US-01 a"), call("test", "US-99 typo")];
    expect(checkTraceability({ release: ["US-01"], defined, sources }).unknown).toEqual(["US-99"]);
  });
});

describe("testSources and run — against a throwaway repository", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  /**
   * A repository holding the real PRD and user stories, the given story lists (Release 1's, then
   * Release 2's, which is the real one unless a test says otherwise) and test files.
   */
  function repository(
    list: string[],
    tests: Record<string, string>,
    list2: string[] = RELEASE_2,
  ): string {
    const root = mkdtempSync(join(tmpdir(), "traceability-"));
    roots.push(root);
    const files: Record<string, string> = {
      "docs/01-requirements/prd.md": read("docs/01-requirements/prd.md"),
      "docs/01-requirements/user-stories.md": read("docs/01-requirements/user-stories.md"),
      [storyListPath(1)]: `${list.join("\n")}\n`,
      [storyListPath(2)]: `${list2.join("\n")}\n`,
      ...Object.fromEntries(Object.entries(tests).map(([path, body]) => [`tests/${path}`, body])),
    };
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), body);
    }
    return root;
  }

  const titles = (ids: string[]) => ids.map((id) => call("test", `${id} named`)).join("\n");

  it("reads only *.test.ts(x) and *.spec.ts(x) files, fixtures and helpers excluded", () => {
    const root = repository(RELEASE_1, {
      "unit/a.test.ts": call("test", "US-01 a"),
      "e2e/b.spec.tsx": call("test", "US-02 b"),
      "e2e/helper.ts": call("test", "US-03 a helper"),
      "fixtures/odd.test.ts": call("test", "US-04 a fixture"),
    });
    expect(
      testSources(root)
        .map(({ source }) => source)
        .sort(),
    ).toEqual([call("test", "US-01 a"), call("test", "US-02 b")]);
  });

  it("does not count a story named only in a helper file", () => {
    const root = repository(RELEASE_1, {
      "unit/all.test.ts": titles(RELEASE_1.filter((id) => id !== "US-41")),
      "e2e/helper.ts": call("test", "US-41 a helper"),
    });
    expect(run(root, false, 1)).toMatchObject({
      code: 1,
      err: ["traceability: US-41 is named in no test title"],
    });
  });

  it("exits non-zero and says the list differs from PRD §5 when the list lacks the last story", () => {
    const root = repository(RELEASE_1.slice(0, -1), { "unit/all.test.ts": titles(RELEASE_1) });
    const result = run(root, false, 1);
    expect(result.code).toBe(1);
    expect(result.err.join("\n")).toMatch(/differs from PRD §5/);
  });

  it("names every Release 1 story that no title names, and every undefined id", () => {
    const root = repository(RELEASE_1, {
      "unit/some.test.ts": `${titles(RELEASE_1.slice(2))}\n${call("test", "US-99 typo")}`,
    });
    expect(run(root, false, 1)).toEqual({
      code: 1,
      out: [],
      err: [
        "traceability: US-01 is named in no test title",
        "traceability: US-02 is named in no test title",
        "traceability: US-99 appears in a test title but user-stories.md does not define it",
      ],
    });
  });

  it("passes, with exit code 0, when every story is named", () => {
    const root = repository(RELEASE_1, { "unit/all.test.ts": titles(RELEASE_1) });
    expect(run(root, false, 1)).toEqual({
      code: 0,
      out: ["traceability: all 18 Release 1 stories are named in a test title"],
      err: [],
    });
  });

  it("--write regenerates every list the PRD has a story sentence for", () => {
    const root = repository([], {}, []);
    expect(run(root, true).out).toEqual([
      "traceability: wrote 18 ids to docs/03-specs/release-1-stories.txt",
      "traceability: wrote 23 ids to docs/03-specs/release-2-stories.txt",
    ]);
    expect(readFileSync(join(root, storyListPath(1)), "utf8")).toBe(`${RELEASE_1.join("\n")}\n`);
    expect(readFileSync(join(root, storyListPath(2)), "utf8")).toBe(`${RELEASE_2.join("\n")}\n`);
  });

  it("does not turn red for Release 2 while Release 1 is the one being built", () => {
    const root = repository(RELEASE_1, { "unit/all.test.ts": titles(RELEASE_1) });
    expect(run(root, false, 1).code).toBe(0);
  });

  it("says a missing list file differs from PRD §5, instead of throwing", () => {
    const root = repository(RELEASE_1, { "unit/all.test.ts": titles(RELEASE_1) });
    rmSync(join(root, storyListPath(2)));
    expect(run(root, false, 1)).toEqual({
      code: 1,
      out: [],
      err: [
        "traceability: release-2-stories.txt differs from PRD §5; run `npm run traceability -- --write`",
      ],
    });
  });

  it("flags a Release 2 list that differs from PRD §5 even while Release 1 is being built", () => {
    const root = repository(
      RELEASE_1,
      { "unit/all.test.ts": titles(RELEASE_1) },
      RELEASE_2.slice(1),
    );
    const result = run(root, false, 1);
    expect(result.code).toBe(1);
    expect(result.err.join("\n")).toMatch(/release-2-stories\.txt differs from PRD §5/);
  });

  it("with Release 2 being built, names every Release 2 story that no title names", () => {
    const named = [...RELEASE_1, "US-11", "US-27", "US-28"];
    const root = repository(RELEASE_1, { "unit/some.test.ts": titles(named) });
    const missing = RELEASE_2.filter((id) => !named.includes(id));
    expect(missing).toHaveLength(20);
    expect(run(root, false, 2, [])).toEqual({
      code: 1,
      out: [],
      err: missing.map((id) => `traceability: ${id} is named in no test title`),
    });
  });

  it("with Release 2 being built, still requires Release 1's stories", () => {
    const root = repository(RELEASE_1, { "unit/some.test.ts": titles(RELEASE_2) });
    const result = run(root, false, 2, []);
    expect(result.code).toBe(1);
    expect(result.err).toEqual(
      RELEASE_1.map((id) => `traceability: ${id} is named in no test title`),
    );
  });

  it("refuses to run for a release being built that has no story sentence (Release 3 has none)", () => {
    const root = repository(RELEASE_1, { "unit/all.test.ts": titles(RELEASE_1) });
    expect(() => run(root, false, 3)).toThrow(/Release 3.*Stories:.*being built/);
  });

  it("--write refuses a release being built that has no story sentence, and writes nothing", () => {
    const root = repository([], {}, []);
    expect(() => run(root, true, 3)).toThrow(/Release 3.*Stories:.*being built/);
    expect(existsSync(join(root, storyListPath(1)))).toBe(true);
    expect(readFileSync(join(root, storyListPath(1)), "utf8")).toBe("\n");
  });

  it("with Release 2 being built, passes when all 41 stories are named", () => {
    const root = repository(RELEASE_1, {
      "unit/all.test.ts": titles([...RELEASE_1, ...RELEASE_2]),
    });
    expect(run(root, false, 2, [])).toEqual({
      code: 0,
      out: ["traceability: all 41 stories of Releases 1–2 are named in a test title"],
      err: [],
    });
  });

  describe("the not-yet-built list (H4 answer (a), ADR-0003 dated line 2026-10-10)", () => {
    /** The 20 Release 2 ids no test named on 2026-10-06 (the backlog's H4 note). */
    const UNNAMED_2026_10_06 = RELEASE_2.filter((id) => !["US-11", "US-27", "US-28"].includes(id));

    it("skips a listed id that no title names, and counts the rest", () => {
      const named = [...RELEASE_1, "US-11", "US-27", "US-28", "US-40"];
      const root = repository(RELEASE_1, { "unit/some.test.ts": titles(named) });
      expect(
        run(
          root,
          false,
          2,
          UNNAMED_2026_10_06.filter((id) => id !== "US-40"),
        ),
      ).toEqual({
        code: 0,
        out: [
          "traceability: all 22 stories of Releases 1–2 are named in a test title; 19 are not built yet",
        ],
        err: [],
      });
    });

    it("still requires an id that is not on the list", () => {
      const named = [...RELEASE_1, "US-11", "US-27", "US-28"];
      const root = repository(RELEASE_1, { "unit/some.test.ts": titles(named) });
      expect(
        run(
          root,
          false,
          2,
          UNNAMED_2026_10_06.filter((id) => id !== "US-40"),
        ),
      ).toEqual({
        code: 1,
        out: [],
        err: ["traceability: US-40 is named in no test title"],
      });
    });

    it("fails for a listed id that a title already names — the task that names it removes it", () => {
      const named = [...RELEASE_1, "US-11", "US-27", "US-28", "US-40"];
      const root = repository(RELEASE_1, { "unit/some.test.ts": titles(named) });
      expect(run(root, false, 2, UNNAMED_2026_10_06)).toEqual({
        code: 1,
        out: [],
        err: ["traceability: US-40 is already named in a test title; remove it from NOT_YET_BUILT"],
      });
    });

    it("only shrinks: every id on it is one of the 20 unnamed on 2026-10-06, each once", () => {
      expect(UNNAMED_2026_10_06).toHaveLength(20);
      expect(NOT_YET_BUILT.filter((id) => !UNNAMED_2026_10_06.includes(id))).toEqual([]);
      expect(new Set(NOT_YET_BUILT).size).toBe(NOT_YET_BUILT.length);
    });
  });
});

describe("this repository", () => {
  it("has a title for every story of the release being built and no undefined id", () => {
    const result = checkTraceability({
      release: cumulativeStoryIds(PRD, RELEASE_BEING_BUILT),
      notYetBuilt: NOT_YET_BUILT,
      defined: definedStoryIds(read("docs/01-requirements/user-stories.md")),
      sources: testSources(repoRoot),
    });
    expect(result).toEqual({ missing: [], unknown: [], alreadyNamed: [] });
  });
});
