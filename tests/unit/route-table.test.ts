import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  apiRouteFiles,
  GET_THAT_WRITES,
  handlersOf,
  routeTableViolations,
  type RouteFile,
} from "@/tests/fixtures/route-table";

/**
 * SPEC-write-path 7.4, the route-table guard: every exported non-`GET` handler under
 * `app/api` is a write under the proxy's predicate or on the exempt list (2.3); every write
 * handler goes through `guardedWrite` (2.2); no `GET` handler calls it (2.1). A new route is a
 * write route until a spec says otherwise, so a route added without the wrapper fails here.
 */
const ROOT = join(import.meta.dirname, "..", "..");

function fixture(name: string): RouteFile {
  const source = readFileSync(join(ROOT, "tests", "fixtures", "route-table", name), "utf8");
  const file = /^\/\/ route: (\S+)/.exec(source)?.[1];
  if (file === undefined) throw new Error(`${name} names no route on its first line`);
  return { file, source };
}

describe("the route table (SPEC-write-path 7.4)", () => {
  it("has no violation in this repository", () => {
    expect(routeTableViolations(apiRouteFiles(ROOT))).toEqual([]);
  });

  it("reads every route file — the reader is not passing on an empty list", () => {
    const routes = apiRouteFiles(ROOT).map((r) => r.file);
    expect(routes).toContain("app/api/admin/reset/route.ts");
    expect(routes).toContain("app/api/test/[...path]/route.ts");
  });

  it("names GET /api/admin/reset as the one GET that changes data (2.1), and it exists", () => {
    expect(GET_THAT_WRITES).toEqual(["/api/admin/reset"]);
    const reset = apiRouteFiles(ROOT).find((r) => r.file === "app/api/admin/reset/route.ts");
    expect(handlersOf(reset!.source).map((h) => h.method)).toContain("GET");
  });

  it("passes the control: a GET beside writes that go through guardedWrite, in both export forms", () => {
    const control = fixture("allowed.ts.fixture");
    expect(handlersOf(control.source)).toEqual([
      { method: "GET", callsGuardedWrite: false },
      { method: "PATCH", callsGuardedWrite: true },
      { method: "DELETE", callsGuardedWrite: true },
    ]);
    expect(routeTableViolations([control])).toEqual([]);
  });

  it.each([
    [
      "write-without-wrapper.ts.fixture",
      "PATCH /api/pots/[id]: a write handler without guardedWrite",
    ],
    ["get-calls-wrapper.ts.fixture", "GET /api/pots: a GET handler calls guardedWrite"],
    [
      "reexport-without-wrapper.ts.fixture",
      "PATCH /api/pots/[id]: a write handler without guardedWrite",
    ],
    ["reexport-from-module.ts.fixture", "POST /api/pots: a write handler without guardedWrite"],
    [
      "read-method-on-write-path.ts.fixture",
      "OPTIONS /api/pots: neither a write under the proxy's predicate nor exempt",
    ],
  ])("fails %s", (name, violation) => {
    expect(routeTableViolations([fixture(name)])).toEqual([violation]);
  });

  it("treats a dynamic segment under /api/test/ as exempt, and the exact exempt paths only", () => {
    const post = "export async function POST() { return new Response(); }";
    expect(
      routeTableViolations([{ file: "app/api/test/[...path]/route.ts", source: post }]),
    ).toEqual([]);
    expect(
      routeTableViolations([{ file: "app/api/auth/login.json/route.ts", source: post }]),
    ).toEqual(["POST /api/auth/login.json: a write handler without guardedWrite"]);
  });
});
