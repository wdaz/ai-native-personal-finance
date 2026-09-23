### Task 1: Zod, and the enums as the documents spell them

**Files:**
- Modify: `package.json`, `package-lock.json` (controller only)
- Create: `src/shared/enums.ts`
- Create: `tests/unit/shared/enums.test.ts`, `tests/fixtures/enums/missing-pink.md.fixture`,
  `tests/fixtures/enums/no-enums.md.fixture`

**Interfaces:**
- Consumes: `CATEGORY_BY_NAME: ReadonlyMap<string, Category>` and
  `THEME_BY_HEX: ReadonlyMap<string, Theme>` from `src/server/seed.ts` (T-02; Prisma
  identifiers as values).
- Produces: `CATEGORIES`, `THEMES`, `RESET_REASONS` (readonly tuples of display names) and the
  types `Category`, `Theme`, `ResetReason` in `src/shared/enums.ts`. Task 4 builds
  `CategorySchema` and `ThemeSchema` from them — the full lists T-09 tests its map against
  (owner, answer 1).

- [ ] **Step 1: Write the failing test and its fixtures**

`tests/unit/shared/enums.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORY_BY_NAME, THEME_BY_HEX } from "@/src/server/seed";
import { CATEGORIES, RESET_REASONS, THEMES } from "@/src/shared/enums";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/**
 * The lists data-model.md writes out: "Enums: `Category` = Entertainment, Bills, … .
 * `Theme` = Green, … ." and `ResetLog`'s "`reason` (`scheduled` \| … )". Throws when either
 * is missing, so a reworded document fails instead of comparing nothing with nothing.
 */
function documentedEnums(markdown: string): Record<string, string[]> {
  const line = markdown.split("\n").find((text) => text.startsWith("Enums:"));
  const reasons = /`reason` \(([^)]*)\)/.exec(markdown)?.[1];
  if (!line || !reasons) throw new Error("No enum lists in data-model.md");
  const lists = [...line.matchAll(/`(\w+)` = ([^.]+)\./g)].map(
    ([, name = "", list = ""]) => [name, list.split(",").map((item) => item.trim())] as const,
  );
  const reset = reasons.split("\\|").map((item) => item.trim().replaceAll("`", ""));
  return { ...Object.fromEntries(lists), ResetReason: reset };
}

const shared = { Category: [...CATEGORIES], Theme: [...THEMES], ResetReason: [...RESET_REASONS] };

describe("src/shared/enums.ts mirrors data-model.md (T-04)", () => {
  it("lists every category, theme and reset reason in the document's order", () => {
    expect(documentedEnums(read("docs/02-architecture/data-model.md"))).toEqual(shared);
  });

  it("would report a theme the document lacks (violation fixture, DoD v1.1)", () => {
    const documented = documentedEnums(read("tests/fixtures/enums/missing-pink.md.fixture"));
    expect(documented.Theme).not.toEqual(shared.Theme);
    expect(shared.Theme.filter((theme) => !documented.Theme?.includes(theme))).toEqual(["Pink"]);
  });

  it("would report a document without the lists rather than pass in silence (violation fixture)", () => {
    expect(() => documentedEnums(read("tests/fixtures/enums/no-enums.md.fixture"))).toThrow(
      "No enum lists in data-model.md",
    );
  });
});

describe("the seed and the theme colours use the same names (T-02, T-01)", () => {
  it("reads every category of data.json under its shared name", () => {
    expect([...CATEGORY_BY_NAME.keys()].sort()).toEqual([...CATEGORIES].sort());
  });

  it("maps each shared name to the Prisma identifier without spaces (T-02 plan D4)", () => {
    const identifier = (name: string) => name.replaceAll(" ", "");
    expect([...CATEGORY_BY_NAME.values()].sort()).toEqual(CATEGORIES.map(identifier).sort());
    expect([...THEME_BY_HEX.values()].sort()).toEqual(THEMES.map(identifier).sort());
  });

  /** `--color-navy-grey` for "Navy Grey": src/ui/tokens.css names each theme colour. */
  const missingThemeColours = (css: string) =>
    THEMES.filter((theme) => {
      const token = `--color-${theme.toLowerCase().replaceAll(" ", "-")}:`;
      return !css.includes(token);
    });

  it("has a colour token in src/ui/tokens.css for every theme", () => {
    expect(missingThemeColours(read("src/ui/tokens.css"))).toEqual([]);
  });

  it("would report a theme without a colour token (violation input)", () => {
    const css = read("src/ui/tokens.css").replace("--color-army-green:", "--color-army:");
    expect(missingThemeColours(css)).toEqual(["Army Green"]);
  });
});
```

`tests/fixtures/enums/missing-pink.md.fixture` (data-model.md's two lines, Pink removed):

```md
<!-- tests/unit/shared/enums.test.ts: data-model.md with Pink missing from Theme. -->

| `ResetLog` | `at`, `reason` (`scheduled` \| `threshold` \| `manual` \| `test`) | latest exposed via `/api/meta` | US-37 |

Enums: `Category` = Entertainment, Bills, Groceries, Dining Out, Transportation, Personal Care, Education, Lifestyle, Shopping, General. `Theme` = Green, Yellow, Cyan, Navy, Red, Purple, Turquoise, Brown, Magenta, Blue, Navy Grey, Army Green, Gold, Orange.
```

`tests/fixtures/enums/no-enums.md.fixture`:

```md
<!-- tests/unit/shared/enums.test.ts: data-model.md without its enum lists. -->

| `ResetLog` | `at`, reasons (`scheduled` \| `threshold` \| `manual` \| `test`) | latest exposed via `/api/meta` | US-37 |

The enums are listed elsewhere.
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/unit/shared/enums.test.ts`
Expected (*measured*, E15): FAIL — "Cannot find package '@/src/shared/enums'".

- [ ] **Step 3: Add Zod (controller, not a subagent)**

Run: `npm install zod@^4.6.5 --no-fund && npm audit && git diff --stat package.json package-lock.json`
Expected (*measured*, E2): `package.json` gains `"zod": "^4.6.5"` under `dependencies`;
`package-lock.json` changes 4 lines (`node_modules/zod` loses `"dev": true`); "found 0
vulnerabilities"; `git config --get core.hooksPath` unchanged (the install does not run
`prepare`).

- [ ] **Step 4: Write `src/shared/enums.ts`**

```ts
/**
 * The enums of docs/02-architecture/data-model.md, spelled as the document spells them.
 * These are the names the database stores (`@map("Dining Out")`, T-02 plan D4) and the
 * names the API sends. Prisma's client uses identifiers without the space (`DiningOut`,
 * `NavyGrey`), and src/server maps between the two. ADR-0002 keeps Prisma out of
 * src/shared, so the lists are written here by hand; tests/unit/shared/enums.test.ts holds
 * them to data-model.md, to the seed's maps and to the theme colours in src/ui/tokens.css.
 */

export const CATEGORIES = [
  "Entertainment",
  "Bills",
  "Groceries",
  "Dining Out",
  "Transportation",
  "Personal Care",
  "Education",
  "Lifestyle",
  "Shopping",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const THEMES = [
  "Green",
  "Yellow",
  "Cyan",
  "Navy",
  "Red",
  "Purple",
  "Turquoise",
  "Brown",
  "Magenta",
  "Blue",
  "Navy Grey",
  "Army Green",
  "Gold",
  "Orange",
  "Pink",
] as const;

export type Theme = (typeof THEMES)[number];

/** data-model.md, `ResetLog.reason`. */
export const RESET_REASONS = ["scheduled", "threshold", "manual", "test"] as const;

export type ResetReason = (typeof RESET_REASONS)[number];
```

- [ ] **Step 5: Run the test to see it pass**

Run: `npx vitest run tests/unit/shared/enums.test.ts`
Expected (*measured*): **7 passed (7)**.

- [ ] **Step 6: All unit gates**

Run: `npx prettier --write src/shared tests/unit/shared && npm run lint && npm run format:check && npm run typecheck && npm test`
Expected (*measured*, E15): every command exits 0; Vitest **348/348**.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/shared/enums.ts tests/unit/shared/enums.test.ts tests/fixtures/enums
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(shared): zod 4.6.5 and the data-model enums as the documents spell them (T-04)"
```

---

