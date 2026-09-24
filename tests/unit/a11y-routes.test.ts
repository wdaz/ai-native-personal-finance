import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { A11Y_ROUTES, discoveredRoutes, routesMissingFrom } from "../fixtures/a11y-routes";

const repoRoot = join(import.meta.dirname, "..", "..");
const stub = "export default function Page() {\n  return null;\n}\n";

describe("the axe route list (NFR-A1, ADR-0003: every page)", () => {
  it("lists every page under app/ and the 404 page", () => {
    expect(routesMissingFrom(discoveredRoutes(join(repoRoot, "app")), A11Y_ROUTES)).toEqual([]);
  });

  it("(fixture) reports a page the list lacks, route groups dropped from the path", () => {
    const dir = mkdtempSync(join(tmpdir(), "a11y-routes-"));
    try {
      for (const path of ["(app)/overview", "(app)/transactions/[id]", "(auth)/login"]) {
        mkdirSync(join(dir, path), { recursive: true });
        writeFileSync(join(dir, path, "page.tsx"), stub);
      }
      writeFileSync(join(dir, "not-found.tsx"), stub);
      expect(discoveredRoutes(dir).sort()).toEqual([
        "/login",
        "/no-such-page",
        "/overview",
        "/transactions/[id]",
      ]);
      expect(
        routesMissingFrom(discoveredRoutes(dir), [
          { path: "/login" },
          { path: "/overview" },
        ]).sort(),
      ).toEqual(["/no-such-page", "/transactions/[id]"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
