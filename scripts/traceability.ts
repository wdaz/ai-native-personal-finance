import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

/**
 * NFR-T2 / ADR-0003 (clarifications 2026-09-24 and 2026-10-04): every story of the release being
 * built, and of every release before it, is named in the title of at least one test; a title that
 * names a story `user-stories.md` does not define fails too. "Title" means the first argument of a `test`/`it`/`describe`/`test.describe`
 * call that actually runs, read from the syntax tree — so a comment, a string, a skipped test or
 * group, a `.test(` on a regular expression or Zod's `.describe(` never counts. The title of an
 * `it.each([…])("…")` is not read either (the callee is a call): name the story in a plain title.
 */
const STORY = /US-\d\d/g;
/** The bare identifiers a test call is rooted at; `xit`/`xtest`/`xdescribe` are the skipped forms. */
const RUNNERS = new Set(["test", "it", "describe", "xit", "xtest", "xdescribe"]);
/** What may follow the root in a test call's chain: `test.describe.serial`, `it.only`, `test.skip`… */
const MODIFIERS = new Set(["describe", "serial", "parallel", "only", "skip", "fixme", "todo"]);
const SKIPS = new Set(["skip", "fixme", "todo"]);

/**
 * The release being built (ADR-0003, clarification 2026-09-24 and its T-15d amendment): the stories
 * of this release and of every release before it must be named in a test title. Release 2 since
 * T-17, the first Release 2 build task, whose tests name US-40 (dated line 2026-10-10).
 */
export const RELEASE_BEING_BUILT = 2;

/** The generated list of the stories a release first delivers (`--write`), one id per line. */
export function storyListPath(release: number): string {
  return `docs/03-specs/release-${release}-stories.txt`;
}

/**
 * The text of PRD §5's `Stories:` sentence for a release: the label must start a line; the text runs
 * to the first full stop that ends a sentence, to `Deferred` (a sentence with no stop before it) or
 * to the end of the release's block. A block runs from its `### Release N` heading to the next
 * heading of level 1–3 — `### Release N+1`, or `## 6.` after the last release — or to the end of the
 * file, so a later "User Stories:" elsewhere in the PRD is never read as a release's list.
 */
function storySentence(prd: string, release: number): string | undefined {
  const block =
    new RegExp(
      `^### Release ${release}\\b[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,3} |(?![\\s\\S]))`,
      "m",
    ).exec(prd)?.[1] ?? "";
  return /^Stories:([\s\S]*?)(?:\.(?:\s|(?![\s\S]))|Deferred|(?![\s\S]))/m.exec(block)?.[1];
}

/** The ids of PRD §5's "### Release N" `Stories:` sentence; `US-04…US-08` is a range. */
export function releaseStoryIds(prd: string, release = 1): string[] {
  const sentence = storySentence(prd, release);
  if (sentence === undefined) {
    throw new Error(`PRD §5 Release ${release} has no \`Stories:\` sentence`);
  }
  const ids: string[] = [];
  for (const [, from, to] of sentence.matchAll(/US-(\d\d)(?:…US-(\d\d))?/g)) {
    for (let n = Number(from); n <= Number(to ?? from); n += 1) {
      ids.push(`US-${String(n).padStart(2, "0")}`);
    }
  }
  if (ids.length === 0) throw new Error(`PRD §5 Release ${release} \`Stories:\` names no story`);
  return ids;
}

/** The releases whose PRD §5 block has a `Stories:` sentence, in order (Release 3 has none). */
export function listedReleases(prd: string): number[] {
  const numbers = [...prd.matchAll(/^### Release (\d+)/gm)].map(([, n]) => Number(n));
  return [...new Set(numbers)]
    .filter((release) => storySentence(prd, release) !== undefined)
    .sort((a, b) => a - b);
}

/**
 * The stories of every listed release up to and including `upTo`, in order, each id once. `upTo`
 * must itself be a listed release: a release being built whose `Stories:` sentence is missing would
 * otherwise be skipped and the check would pass on the earlier releases alone (it fails closed).
 * A sentence that names no story is an error too (`releaseStoryIds`), so a release that delivers no
 * stories — Release 3 today — cannot be the release being built until the PRD's owner decides how
 * its list is written.
 */
export function cumulativeStoryIds(prd: string, upTo: number): string[] {
  const listed = listedReleases(prd);
  if (!listed.includes(upTo)) {
    throw new Error(
      `PRD §5 Release ${upTo} has no \`Stories:\` sentence, and it is the release being built`,
    );
  }
  const ids = listed
    .filter((release) => release <= upTo)
    .flatMap((release) => releaseStoryIds(prd, release));
  return [...new Set(ids)];
}

export function definedStoryIds(userStories: string): string[] {
  return [...userStories.matchAll(/^### (US-\d\d)\b/gm)].map(([, id]) => id!);
}

/** `a.b.c` as `["a", "b", "c"]`; undefined when the chain is not rooted at a bare identifier. */
function chainOf(expression: ts.Expression): string[] | undefined {
  if (ts.isIdentifier(expression)) return [expression.text];
  if (ts.isPropertyAccessExpression(expression)) {
    const head = chainOf(expression.expression);
    return head && [...head, expression.name.text];
  }
  return undefined;
}

/** The chain of a test call's callee, or undefined when the call is not one (`/x/.test(…)`, `z.string().describe(…)`). */
function runnerChain(expression: ts.Expression): string[] | undefined {
  const chain = chainOf(expression);
  if (chain === undefined || !RUNNERS.has(chain[0]!)) return undefined;
  return chain.slice(1).every((name) => MODIFIERS.has(name)) ? chain : undefined;
}

function titleOf(argument: ts.Expression | undefined): string | undefined {
  if (argument === undefined) return undefined;
  if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
    return argument.text;
  }
  if (ts.isTemplateExpression(argument)) {
    // Joined with a space so `US-0${a}1` cannot read as US-01.
    return (
      argument.head.text + argument.templateSpans.map((span) => ` ${span.literal.text}`).join("")
    );
  }
  return undefined;
}

/**
 * A callback whose top level holds an unconditional `test.skip()` / `test.fixme()` never runs its
 * tests. A conditional skip — `test.skip(browserName === "webkit", …)` or one inside an `if` — is
 * out of scope: it depends on the environment, and the test still counts as named.
 */
function bodySkipsUnconditionally(call: ts.CallExpression): boolean {
  const callback = call.arguments.find(
    (argument): argument is ts.ArrowFunction | ts.FunctionExpression =>
      ts.isArrowFunction(argument) || ts.isFunctionExpression(argument),
  );
  if (callback === undefined || !ts.isBlock(callback.body)) return false;
  return callback.body.statements.some((statement) => {
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) {
      return false;
    }
    if (statement.expression.arguments.length > 0) return false;
    const chain = runnerChain(statement.expression.expression);
    return chain !== undefined && chain.length > 1 && SKIPS.has(chain[chain.length - 1]!);
  });
}

function isSkipped(chain: string[], call: ts.CallExpression): boolean {
  return (
    chain[0]!.startsWith("x") ||
    chain.slice(1).some((name) => SKIPS.has(name)) ||
    bodySkipsUnconditionally(call)
  );
}

/** A file's text, with its path when the script kind matters: `.ts` is not `.tsx` (`<T>(x) => x`). */
export type SourceFile = string | { path: string; source: string };

/** `path` picks the script kind (`.ts` → TS, anything else → TSX); without one a source is read as TSX. */
export function titleStoryIds(source: string, path = "source.tsx"): Set<string> {
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.TSX,
  );
  const ids = new Set<string>();
  const visit = (node: ts.Node, skipped: boolean): void => {
    let inheritedSkip = skipped;
    if (ts.isCallExpression(node)) {
      const chain = runnerChain(node.expression);
      if (chain !== undefined) {
        inheritedSkip = skipped || isSkipped(chain, node);
        const title = titleOf(node.arguments[0]);
        if (!inheritedSkip && title !== undefined) {
          for (const [id] of title.matchAll(STORY)) ids.add(id);
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, inheritedSkip));
  };
  visit(file, false);
  return ids;
}

export function checkTraceability(input: {
  release: string[];
  defined: string[];
  sources: SourceFile[];
}): { missing: string[]; unknown: string[] } {
  const named = new Set<string>();
  for (const file of input.sources) {
    const ids =
      typeof file === "string" ? titleStoryIds(file) : titleStoryIds(file.source, file.path);
    for (const id of ids) named.add(id);
  }
  return {
    missing: input.release.filter((id) => !named.has(id)),
    unknown: [...named].filter((id) => !input.defined.includes(id)).sort(),
  };
}

/**
 * Every `*.test.ts(x)` / `*.spec.ts(x)` under `tests/` — what Vitest and Playwright run — with
 * `fixtures/` excluded (they hold deliberately odd sources). A helper file's calls never count.
 * The entry type comes with the listing (`withFileTypes`): a separate `stat` before the read would
 * let the path change in between (CodeQL `js/file-system-race`).
 */
export function testSources(root: string): { path: string; source: string }[] {
  const walk = (dir: string): { path: string; source: string }[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === "fixtures" ? [] : walk(path);
      return /\.(test|spec)\.tsx?$/.test(entry.name)
        ? [{ path, source: readFileSync(path, "utf8") }]
        : [];
    });
  return walk(join(root, "tests"));
}

/** The whole check for a repository at `root`: what to print and the exit code. */
export function run(
  root: string,
  write = false,
  built = RELEASE_BEING_BUILT,
): { code: number; out: string[]; err: string[] } {
  const prd = readFileSync(join(root, "docs/01-requirements/prd.md"), "utf8");
  const lists = listedReleases(prd).map((n) => {
    const ids = releaseStoryIds(prd, n);
    return { n, ids, path: storyListPath(n), expected: `${ids.join("\n")}\n` };
  });
  // Read before `--write` as well: a release being built with no story sentence is an error there
  // too, so regenerating the lists cannot hide a broken PRD behind exit code 0.
  const release = cumulativeStoryIds(prd, built);
  if (write) {
    mkdirSync(join(root, "docs/03-specs"), { recursive: true });
    for (const { path, expected } of lists) writeFileSync(join(root, path), expected);
    return {
      code: 0,
      out: lists.map(({ ids, path }) => `traceability: wrote ${ids.length} ids to ${path}`),
      err: [],
    };
  }
  // Every release's list is held to the PRD, the one being built or not: a PRD edit that leaves a
  // later list stale is caught before that release is built.
  const drifted = lists.filter(({ path, expected }) => {
    const file = join(root, path);
    return !existsSync(file) || readFileSync(file, "utf8") !== expected;
  });
  if (drifted.length > 0) {
    return {
      code: 1,
      out: [],
      err: drifted.map(
        ({ n }) =>
          `traceability: release-${n}-stories.txt differs from PRD §5; run \`npm run traceability -- --write\``,
      ),
    };
  }
  const { missing, unknown } = checkTraceability({
    release,
    defined: definedStoryIds(
      readFileSync(join(root, "docs/01-requirements/user-stories.md"), "utf8"),
    ),
    sources: testSources(root),
  });
  const err = [
    ...missing.map((id) => `traceability: ${id} is named in no test title`),
    ...unknown.map(
      (id) => `traceability: ${id} appears in a test title but user-stories.md does not define it`,
    ),
  ];
  if (err.length > 0) return { code: 1, out: [], err };
  const required = release.length;
  const line =
    built === 1
      ? `traceability: all ${required} Release 1 stories are named in a test title`
      : `traceability: all ${required} stories of Releases 1–${built} are named in a test title`;
  return {
    code: 0,
    out: [line],
    err: [],
  };
}

function main(): void {
  const { code, out, err } = run(join(import.meta.dirname, ".."), process.argv.includes("--write"));
  for (const line of out) console.log(line);
  for (const line of err) console.error(line);
  process.exitCode = code;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
