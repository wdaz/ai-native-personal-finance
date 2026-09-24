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

/** Next's default page extensions; next.config.ts sets no `pageExtensions`. */
const PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/;

/** The URL paths of every page file under `appDir` (route groups `(x)` removed), plus the 404 page's. */
export function discoveredRoutes(appDir: string): string[] {
  const pages: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (PAGE_FILE.test(name)) {
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

/** The pages `discovered` has that `listed` lacks: a page that would ship unscanned. */
export function routesMissingFrom(
  discovered: string[],
  listed: readonly { path: string }[],
): string[] {
  return discovered.filter((route) => !listed.some((entry) => entry.path === route));
}

/** The entries of `listed` no discovered page backs: a stale line, which would scan a 404 page. */
export function listedWithoutPage(
  discovered: string[],
  listed: readonly { path: string }[],
): string[] {
  return listed.map((entry) => entry.path).filter((path) => !discovered.includes(path));
}
