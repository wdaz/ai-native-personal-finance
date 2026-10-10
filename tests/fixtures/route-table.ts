import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";
import { isWriteRequest, WRITE_EXEMPT_PATHS, WRITE_EXEMPT_PREFIX } from "@/src/server/write-rules";

/** SPEC-write-path 7.4: the route-table guard's reading of `app/api/**\/route.ts`. */

const HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]);

/** 2.1: the one `GET` that changes data — the bearer-protected reset the cron calls. */
export const GET_THAT_WRITES = ["/api/admin/reset"] as const;

export interface RouteFile {
  /** Repository-relative, `/`-separated, e.g. `app/api/pots/[id]/route.ts`. */
  file: string;
  source: string;
}

export interface Handler {
  method: string;
  callsGuardedWrite: boolean;
}

/** `app/api/pots/[id]/route.ts` → `/api/pots/[id]`. */
export function routePath(file: string): string {
  return "/" + file.replace(/^app\//, "").replace(/\/route\.(ts|tsx|js)$/, "");
}

/** A URL the route answers: each `[id]` or `[...path]` segment filled with a sample value. */
function samplePathname(path: string): string {
  return path.replace(/\[[^\]]+\]/g, "sample");
}

function isExempt(pathname: string): boolean {
  return (
    pathname.startsWith(WRITE_EXEMPT_PREFIX) ||
    (WRITE_EXEMPT_PATHS as readonly string[]).includes(pathname)
  );
}

function callsGuardedWrite(node: ts.Node): boolean {
  let found = false;
  const visit = (child: ts.Node) => {
    if (
      ts.isCallExpression(child) &&
      ts.isIdentifier(child.expression) &&
      child.expression.text === "guardedWrite"
    ) {
      found = true;
    }
    if (!found) ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

function isExported(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  );
}

/** The HTTP handlers a route file exports — `export function X` or `export const X =`. */
export function handlersOf(source: string): Handler[] {
  const file = ts.createSourceFile("route.ts", source, ts.ScriptTarget.Latest, true);
  const handlers: Handler[] = [];
  for (const statement of file.statements) {
    if (!isExported(statement)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      const method = statement.name.text;
      if (HTTP_METHODS.has(method)) {
        handlers.push({ method, callsGuardedWrite: callsGuardedWrite(statement) });
      }
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && HTTP_METHODS.has(declaration.name.text)) {
          handlers.push({
            method: declaration.name.text,
            callsGuardedWrite: callsGuardedWrite(declaration),
          });
        }
      }
    }
  }
  return handlers;
}

/** 7.4's three rules, one message per broken handler. */
export function routeTableViolations(routes: readonly RouteFile[]): string[] {
  const violations: string[] = [];
  for (const { file, source } of routes) {
    const path = routePath(file);
    const pathname = samplePathname(path);
    for (const { method, callsGuardedWrite: wrapped } of handlersOf(source)) {
      const name = `${method} ${path}`;
      if (method === "GET") {
        if (wrapped) violations.push(`${name}: a GET handler calls guardedWrite`);
        continue;
      }
      const isWrite = isWriteRequest(method, pathname);
      if (!isWrite && !isExempt(pathname)) {
        violations.push(`${name}: neither a write under the proxy's predicate nor exempt`);
      }
      if (isWrite && !wrapped) violations.push(`${name}: a write handler without guardedWrite`);
    }
  }
  return violations;
}

/** Every `route.ts` under `app/api`, read from disk. */
export function apiRouteFiles(root: string): RouteFile[] {
  const files: RouteFile[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/^route\.(ts|tsx|js)$/.test(name)) {
        files.push({
          file: relative(root, path).split(sep).join("/"),
          source: readFileSync(path, "utf8"),
        });
      }
    }
  };
  walk(join(root, "app", "api"));
  return files.sort((a, b) => a.file.localeCompare(b.file));
}
