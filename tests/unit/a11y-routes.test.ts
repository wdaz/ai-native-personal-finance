import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  A11Y_ROUTES,
  discoveredRoutes,
  listedWithoutPage,
  routesMissingFrom,
} from "../fixtures/a11y-routes";

const repoRoot = join(import.meta.dirname, "..", "..");
const stub = "export default function Page() {\n  return null;\n}\n";

/** Builds a throwaway `app/` tree under the OS temp directory, runs `check` on it, removes it. */
function withAppTree(files: string[], check: (appDir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "a11y-routes-"));
  try {
    for (const file of files) {
      const path = join(dir, file);
      mkdirSync(join(path, ".."), { recursive: true });
      writeFileSync(path, stub);
    }
    check(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("the axe route list (NFR-A1, ADR-0003: every page)", () => {
  it("lists every page under app/ and the 404 page", () => {
    expect(routesMissingFrom(discoveredRoutes(join(repoRoot, "app")), A11Y_ROUTES)).toEqual([]);
  });

  it("lists no route that has no page under app/", () => {
    expect(listedWithoutPage(discoveredRoutes(join(repoRoot, "app")), A11Y_ROUTES)).toEqual([]);
  });

  it("(fixture) reports a page the list lacks, route groups dropped from the path", () => {
    withAppTree(
      [
        "(app)/overview/page.tsx",
        "(app)/transactions/[id]/page.tsx",
        "(auth)/login/page.tsx",
        "not-found.tsx",
      ],
      (dir) => {
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
      },
    );
  });

  it("(fixture) reports a listed route whose page is gone", () => {
    withAppTree(["(app)/overview/page.tsx", "not-found.tsx"], (dir) => {
      expect(
        listedWithoutPage(discoveredRoutes(dir), [
          { path: "/overview" },
          { path: "/no-such-page" },
          { path: "/budgets" },
        ]),
      ).toEqual(["/budgets"]);
      expect(listedWithoutPage(discoveredRoutes(dir), [{ path: "/no-such-page" }])).toEqual([]);
    });
    withAppTree(["(app)/overview/page.tsx"], (dir) => {
      expect(listedWithoutPage(discoveredRoutes(dir), [{ path: "/no-such-page" }])).toEqual([
        "/no-such-page",
      ]);
    });
  });

  it("(fixture) finds a page in any extension Next serves, and nothing else", () => {
    withAppTree(
      [
        "a/page.ts",
        "b/page.jsx",
        "c/page.js",
        "d/page.tsx",
        "e/page.test.tsx",
        "f/layout.tsx",
        "g/mypage.tsx",
      ],
      (dir) => {
        expect(discoveredRoutes(dir).sort()).toEqual(["/a", "/b", "/c", "/d"]);
      },
    );
  });
});
