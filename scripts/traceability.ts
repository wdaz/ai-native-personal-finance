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
