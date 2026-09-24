import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

/**
 * NFR-T2 / ADR-0003 (clarification 2026-09-24): every story of the release being built is
 * named in the title of at least one test; a title naming a story `user-stories.md` does not
 * define fails too. "Title" means the first argument of a `test`/`it`/`describe`/`test.describe`
 * call that actually runs, read from the syntax tree — so a comment, a string, a skipped test or
 * group, a `.test(` on a regular expression or Zod's `.describe(` never counts.
 */
const STORY = /US-\d\d/g;
/** The bare identifiers a test call is rooted at; `xit`/`xtest`/`xdescribe` are the skipped forms. */
const RUNNERS = new Set(["test", "it", "describe", "xit", "xtest", "xdescribe"]);
/** What may follow the root in a test call's chain: `test.describe.serial`, `it.only`, `test.skip`… */
const MODIFIERS = new Set(["describe", "serial", "parallel", "only", "skip", "fixme", "todo"]);
const SKIPS = new Set(["skip", "fixme", "todo"]);

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

export function titleStoryIds(source: string): Set<string> {
  const file = ts.createSourceFile(
    "source.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
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
  sources: string[];
}): { missing: string[]; unknown: string[] } {
  const named = new Set<string>();
  for (const source of input.sources) for (const id of titleStoryIds(source)) named.add(id);
  return {
    missing: input.release.filter((id) => !named.has(id)),
    unknown: [...named].filter((id) => !input.defined.includes(id)).sort(),
  };
}

/**
 * Every `*.test.ts(x)` / `*.spec.ts(x)` under `tests/` — what Vitest and Playwright run — with
 * `fixtures/` excluded (they hold deliberately odd sources). A helper file's calls never count.
 */
export function testSources(root: string): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return name === "fixtures" ? [] : walk(path);
      return /\.(test|spec)\.tsx?$/.test(name) ? [readFileSync(path, "utf8")] : [];
    });
  return walk(join(root, "tests"));
}

/** The whole check for a repository at `root`: what to print and the exit code. */
export function run(root: string, write = false): { code: number; out: string[]; err: string[] } {
  const listPath = join(root, "docs/03-specs/release-1-stories.txt");
  const release = releaseStoryIds(readFileSync(join(root, "docs/01-requirements/prd.md"), "utf8"));
  const expected = `${release.join("\n")}\n`;
  if (write) {
    mkdirSync(join(root, "docs/03-specs"), { recursive: true });
    writeFileSync(listPath, expected);
    return {
      code: 0,
      out: [`traceability: wrote ${release.length} ids to docs/03-specs/release-1-stories.txt`],
      err: [],
    };
  }
  if (readFileSync(listPath, "utf8") !== expected) {
    return {
      code: 1,
      out: [],
      err: [
        "traceability: release-1-stories.txt differs from PRD §5; run `npm run traceability -- --write`",
      ],
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
  return {
    code: 0,
    out: [`traceability: all ${release.length} Release 1 stories are named in a test title`],
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
