## Task 3: traceability scoped to the release (NFR-T2)

**Files:**
- Create: `scripts/traceability.ts`, `docs/03-specs/release-1-stories.txt`, `tests/unit/traceability.test.ts`
- Modify: `package.json` (`traceability`, `test:all`), `.github/workflows/ci.yml` (`verify`),
  `docs/02-architecture/adr/0003-testing-strategy.md` (**only after Q6 is answered yes**),
  `tests/unit/README.md`

**Interfaces:**
- Produces (from `scripts/traceability.ts`):
  `releaseStoryIds(prd: string): string[]`, `definedStoryIds(userStories: string): string[]`,
  `titleStoryIds(source: string): Set<string>`,
  `checkTraceability(input: { release: string[]; defined: string[]; sources: string[] }): { missing: string[]; unknown: string[] }`,
  `testSources(root: string): string[]`; the CLI `npm run traceability [-- --write]`.

**A trap the planning session hit, and the test below is built around:** the scan reads every
`.ts`/`.tsx` under `tests/` — including *this task's own test file*. A literal
`test("US-99 typo", …)` inside a string in that file made the real-repository check report `US-99`
as an undefined id, and a literal `test("US-01 …")` would have "named" a story no real test names,
masking a missing one. So the fixtures below are built by a `call(fn, title)` helper from parts:
the file's source never contains a `test|it|describe(` call with a story id in it.

- [ ] **Step 1: Write the failing test.** `tests/unit/traceability.test.ts`:

```ts
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
```

- [ ] **Step 2: Run and watch it fail.** `npx vitest run tests/unit/traceability.test.ts`.
  **Prediction:** cannot import `@/scripts/traceability`.

- [ ] **Step 3: Implement `scripts/traceability.ts`.**

```ts
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * NFR-T2 / ADR-0003 (clarification 2026-09-24): every story of the release being built is
 * named in the title of at least one test; a title naming a story `user-stories.md` does not
 * define fails too. "Title" means the string of a `test`/`it`/`describe`/`test.describe` call —
 * a comment, a skipped test or an expectation message does not count.
 */
const STORY = /US-\d\d/g;
const TITLE =
  /\b(?:test|it|describe)(?:\.(?:describe|serial|parallel))*\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;

/** The ids of PRD §5's "### Release 1" `Stories:` sentence; `US-04…US-08` is a range. */
export function releaseStoryIds(prd: string): string[] {
  const block = /### Release 1[^\n]*\n([\s\S]*?)\n### Release 2/.exec(prd)?.[1] ?? "";
  const sentence = /Stories:([\s\S]*?)Deferred/.exec(block)?.[1];
  if (sentence === undefined) {
    throw new Error("PRD §5 Release 1 has no `Stories: … Deferred` sentence");
  }
  const ids: string[] = [];
  for (const [, from, to] of sentence.matchAll(/US-(\d\d)(?:…US-(\d\d))?/g)) {
    for (let n = Number(from); n <= Number(to ?? from); n += 1) {
      ids.push(`US-${String(n).padStart(2, "0")}`);
    }
  }
  if (ids.length === 0) throw new Error("PRD §5 Release 1 `Stories:` names no story");
  return ids;
}

export function definedStoryIds(userStories: string): string[] {
  return [...userStories.matchAll(/^### (US-\d\d)\b/gm)].map(([, id]) => id!);
}

export function titleStoryIds(source: string): Set<string> {
  const ids = new Set<string>();
  for (const [, , title] of source.matchAll(TITLE)) {
    for (const [id] of title!.matchAll(STORY)) ids.add(id);
  }
  return ids;
}

export function checkTraceability(input: {
  release: string[];
  defined: string[];
  sources: string[];
}): { missing: string[]; unknown: string[] } {
  const named = new Set<string>();
  for (const source of input.sources) for (const id of titleStoryIds(source)) named.add(id);
  return {
    missing: input.release.filter((id) => !named.has(id)),
    unknown: [...named].filter((id) => !input.defined.includes(id)).sort(),
  };
}

/** Every `.ts`/`.tsx` under `tests/`, fixtures excluded (they hold deliberately odd sources). */
export function testSources(root: string): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return name === "fixtures" ? [] : walk(path);
      return /\.tsx?$/.test(name) ? [readFileSync(path, "utf8")] : [];
    });
  return walk(join(root, "tests"));
}

function main(): void {
  const root = join(import.meta.dirname, "..");
  const listPath = join(root, "docs/03-specs/release-1-stories.txt");
  const release = releaseStoryIds(readFileSync(join(root, "docs/01-requirements/prd.md"), "utf8"));
  const expected = `${release.join("\n")}\n`;
  if (process.argv.includes("--write")) {
    writeFileSync(listPath, expected);
    console.log(`traceability: wrote ${release.length} ids to docs/03-specs/release-1-stories.txt`);
    return;
  }
  if (readFileSync(listPath, "utf8") !== expected) {
    console.error(
      "traceability: release-1-stories.txt differs from PRD §5; run `npm run traceability -- --write`",
    );
    process.exit(1);
  }
  const { missing, unknown } = checkTraceability({
    release,
    defined: definedStoryIds(
      readFileSync(join(root, "docs/01-requirements/user-stories.md"), "utf8"),
    ),
    sources: testSources(root),
  });
  for (const id of missing) console.error(`traceability: ${id} is named in no test title`);
  for (const id of unknown) {
    console.error(
      `traceability: ${id} appears in a test title but user-stories.md does not define it`,
    );
  }
  if (missing.length + unknown.length > 0) process.exit(1);
  console.log(`traceability: all ${release.length} Release 1 stories are named in a test title`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

  Add `"traceability": "tsx scripts/traceability.ts"` to `package.json`. Generate the list:
  `npm run traceability -- --write`. **Measured:** "wrote 18 ids"; `docs/03-specs/release-1-stories.txt`
  holds `US-01` … `US-41`, one per line, ending in a newline (the PRD's `…` is U+2026).

- [ ] **Step 4: Run tests and the CLI.** `npx vitest run tests/unit/traceability.test.ts` and
  `npm run traceability`. **Measured:** 10 passed; the CLI prints "traceability: all 18 Release 1
  stories are named in a test title"; `tsc`, `eslint` (boundaries included) and Prettier are clean.
  The unit fixtures are the failing evidence for the title rules. **For the CLI, fail it once for
  real:** delete the `US-41` line from `docs/03-specs/release-1-stories.txt` and run
  `npm run traceability` — **prediction:** exit 1, "release-1-stories.txt differs from PRD §5";
  restore with `npm run traceability -- --write`.

- [ ] **Step 5: Wire it.** `verify` job, after the unit step:

```yaml
      - name: Traceability (NFR-T2, Release 1 stories)
        run: npm run traceability
```
  and `test:all` gains `&& npm run traceability` after the unit step. `tests/unit/README.md`: one
  line naming the test and the self-scan trap above.

- [ ] **Step 6 (only if Q6 = yes): the ADR-0003 clarification.** Add the text quoted under Q6 as a
  new `- Clarification 2026-09-24 …` bullet under the existing 2026-09-23 one, and change the
  "Traceability:" sentence in the Decision to "…fails CI if any story id of the release being
  built (`docs/03-specs/release-1-stories.txt`) is not named in a test title." If Q6 = no, do not
  ship the script: it would contradict an Accepted ADR (DoD line 2) — ask again.

- [ ] **Step 7: Format, verify, commit.** `npx prettier --write scripts/traceability.ts
  tests/unit/traceability.test.ts`; typecheck, lint, `npm test`. Commit —
  `test(ci): check the release's stories against test titles`.

---

