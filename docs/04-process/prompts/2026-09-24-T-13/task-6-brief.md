## Task 6: the axe gate — every route scanned, the list kept complete (Q4 = B)

**Files:**
- Create: `tests/fixtures/a11y-routes.ts`, `tests/e2e/axe-routes.spec.ts`, `tests/unit/a11y-routes.test.ts`
- Modify: `tests/e2e/README.md`, `tests/fixtures/README.md`

**Interfaces:**
- Produces: `A11Y_ROUTES: readonly { path: string; authenticated: boolean }[]`,
  `NOT_FOUND_PATH: string`, `discoveredRoutes(appDir: string): string[]`,
  `routesMissingFrom(discovered: string[], listed: readonly { path: string }[]): string[]`.

- [ ] **Step 1: Write the failing unit test.** `tests/unit/a11y-routes.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it.** **Prediction:** cannot import `../fixtures/a11y-routes`.

- [ ] **Step 3: Write `tests/fixtures/a11y-routes.ts`.**

```ts
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export interface A11yRoute {
  path: string;
  authenticated: boolean;
}

/** Any URL no route matches; `app/not-found.tsx` renders it (T-06 plan F1). */
export const NOT_FOUND_PATH = "/no-such-page";

/**
 * Every route the axe gate scans (tests/e2e/axe-routes.spec.ts). A page added under `app/`
 * without a line here fails tests/unit/a11y-routes.test.ts, so a page cannot ship unscanned.
 */
export const A11Y_ROUTES: readonly A11yRoute[] = [
  { path: "/login", authenticated: false },
  { path: "/signup", authenticated: false },
  { path: NOT_FOUND_PATH, authenticated: false },
  { path: "/overview", authenticated: true },
  { path: "/transactions", authenticated: true },
  { path: "/budgets", authenticated: true },
  { path: "/pots", authenticated: true },
  { path: "/recurring-bills", authenticated: true },
];

/** The URL paths of every `page.tsx` under `appDir` (route groups `(x)` removed), plus the 404 page's. */
export function discoveredRoutes(appDir: string): string[] {
  const pages: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (name === "page.tsx") {
        const segments = relative(appDir, dir)
          .split(sep)
          .filter((segment) => segment !== "" && !/^\(.*\)$/.test(segment));
        pages.push(`/${segments.join("/")}`);
      }
    }
  };
  walk(appDir);
  if (existsSync(join(appDir, "not-found.tsx"))) pages.push(NOT_FOUND_PATH);
  return pages;
}

export function routesMissingFrom(
  discovered: string[],
  listed: readonly { path: string }[],
): string[] {
  return discovered.filter((route) => !listed.some((entry) => entry.path === route));
}
```

- [ ] **Step 4: Run the unit test.** **Measured:** 2 passed.

- [ ] **Step 5: Write the E2E spec** `tests/e2e/axe-routes.spec.ts`:

```ts
import { A11Y_ROUTES } from "../fixtures/a11y-routes";
import { expect, loginViaApi, resetDemoData, seriousA11yViolations, test } from "../fixtures/e2e";

/**
 * T-13's axe gate: every route in the list has at least one scan on each engine CI runs.
 * The per-page tests (auth-accessibility, app-shell, overview) scan the states — errors, the
 * collapsed menu, a phone width; this file scans the routes, and the unit test keeps the list
 * complete. All eight pages, including the 404 page no other test scans, have one `<h1>`.
 */
for (const { path, authenticated } of A11Y_ROUTES) {
  test(`US-01 US-02 US-33 NFR-A1 axe gate: ${path} has no serious or critical violation`, async ({
    page,
    request,
  }) => {
    await resetDemoData(request);
    if (authenticated) await loginViaApi(page);
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(() => seriousA11yViolations(page), { message: path }).toEqual([]);
  });
}
```
  Run `npx playwright test --project=chromium --project=firefox --project=webkit tests/e2e/axe-routes.spec.ts`.
  **Measured (planning session, before PR-A — the header does not affect axe):** **24 passed** in
  17.5 s — all eight routes on all three engines, the 404 page included, so F9's gap turned out
  clean rather than a defect. (Had any failed, that would have been a real accessibility finding:
  stop and report it, never weaken the rule.)

- [ ] **Step 6: Docs.** Add two lines to `tests/e2e/README.md` (what the file scans and that the
  list is `tests/fixtures/a11y-routes.ts`) and one to `tests/fixtures/README.md`.

- [ ] **Step 7: Commit** — `test(a11y): scan every route, and fail when a page is not on the list`.
  Format: `npx prettier --write tests/fixtures/a11y-routes.ts tests/e2e/axe-routes.spec.ts tests/unit/a11y-routes.test.ts`
  (**measured:** it re-wraps only the `routesMissingFrom` call in the unit test, as shown above).

---

