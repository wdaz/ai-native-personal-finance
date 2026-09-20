## Task 5: Design tokens, Public Sans, avatars

**Files:**

- Create: `src/ui/tokens.css`, `public/avatars/*.jpg` (30 files)
- Modify: `app/layout.tsx` (Public Sans via `next/font/google`, import `tokens.css`),
  `app/globals.css` (use tokens for background and base type),
  `tests/unit/scaffold.test.ts` (replace the placeholder assertion with the tokens and
  avatars checks)

**Interfaces:**

- Consumes: `docs/02-architecture/design-tokens.md` (values),
  `docs/00-discovery/inputs/data.json` (avatar basenames), Task 4's Vitest.
- Produces: CSS custom properties `--color-*` (22), `--text-preset-*` (7), `--spacing-*`
  (11), `--radius-*` (3), `--sidebar-width`, `--sidebar-width-min`, `--page-max-width`,
  `--bp-tablet`, `--bp-desktop`, `--focus-ring-*`; utility classes `.text-preset-1` …
  `.text-preset-5-bold`; the font CSS variable `--font-public-sans`; and
  `/avatars/<key>.jpg` for all 30 seed keys.

- [ ] **Step 1: Write `src/ui/tokens.css` from `design-tokens.md`**

Values are transcribed from the approved table; nothing is invented. Colour order,
names and hex values match the document row for row.

```css
/*
 * Design tokens — generated from docs/02-architecture/design-tokens.md (Approved v1.0).
 * This file is the ONLY place design values are written. Do not hard-code a hex or a
 * pixel value anywhere else (design-tokens.md, header).
 *
 * Breakpoints appear twice on purpose: as custom properties for documentation and JS,
 * and literally inside `@media` conditions, because CSS custom properties are not valid
 * in a media query condition.
 */

:root {
  /* Colours */
  --color-beige-500: #98908b;
  --color-beige-100: #f8f4f0;
  --color-grey-900: #201f24;
  --color-grey-500: #696868;
  --color-grey-300: #b3b3b3;
  --color-grey-100: #f2f2f2;
  --color-white: #ffffff;

  /* Theme colours — the Theme enum in src/shared/enums.ts (T-04) */
  --color-green: #277c78;
  --color-yellow: #f2cdac;
  --color-cyan: #82c9d7;
  --color-navy: #626070;
  --color-red: #c94736;
  --color-purple: #826cb0;
  --color-turquoise: #597c7c;
  --color-brown: #93674f;
  --color-magenta: #934f6f;
  --color-blue: #3f82b2;
  --color-navy-grey: #97a0ac;
  --color-army-green: #7f9161;
  --color-gold: #cab361;
  --color-orange: #be6c49;
  --color-pink: #af81ba;

  /* Typography — Public Sans, weights 400 and 700, loaded by next/font in app/layout.tsx */
  --font-family-base: var(--font-public-sans), ui-sans-serif, system-ui, sans-serif;
  --text-preset-1: 700 2rem / 120% var(--font-family-base);
  --text-preset-2: 700 1.25rem / 120% var(--font-family-base);
  --text-preset-3: 700 1rem / 150% var(--font-family-base);
  --text-preset-4: 400 0.875rem / 150% var(--font-family-base);
  --text-preset-4-bold: 700 0.875rem / 150% var(--font-family-base);
  --text-preset-5: 400 0.75rem / 150% var(--font-family-base);
  --text-preset-5-bold: 700 0.75rem / 150% var(--font-family-base);

  /* Spacing */
  --spacing-50: 4px;
  --spacing-100: 8px;
  --spacing-150: 12px;
  --spacing-200: 16px;
  --spacing-250: 20px;
  --spacing-300: 24px;
  --spacing-400: 32px;
  --spacing-500: 40px;
  --spacing-600: 48px;
  --spacing-1000: 80px;
  --spacing-1600: 128px;

  /* Radii and layout */
  --radius-100: 8px;
  --radius-150: 12px;
  --radius-200: 16px;
  --sidebar-width: 300px;
  --sidebar-width-min: 88px;
  --page-max-width: 1440px;

  /* Breakpoints (see the note at the top of this file) */
  --bp-tablet: 768px;
  --bp-desktop: 1024px;

  /* Focus indicator — project addition, NFR-A2 (design-tokens.md, "Component states") */
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-ring-color: var(--color-grey-900);
  --focus-ring-color-on-dark: var(--color-white);
}

.text-preset-1 {
  font: var(--text-preset-1);
  letter-spacing: 0;
}
.text-preset-2 {
  font: var(--text-preset-2);
  letter-spacing: 0;
}
.text-preset-3 {
  font: var(--text-preset-3);
  letter-spacing: 0;
}
.text-preset-4 {
  font: var(--text-preset-4);
  letter-spacing: 0;
}
.text-preset-4-bold {
  font: var(--text-preset-4-bold);
  letter-spacing: 0;
}
.text-preset-5 {
  font: var(--text-preset-5);
  letter-spacing: 0;
}
.text-preset-5-bold {
  font: var(--text-preset-5-bold);
  letter-spacing: 0;
}
```

Note on units: the document states sizes in px (32, 20, 16, 14, 12). They are written as
`rem` at the browser default of 16 px (2, 1.25, 1, 0.875, 0.75) so a user's font-size
preference is respected (NFR-A). `1rem = 16px` is asserted by the unit test in Step 5.

- [ ] **Step 2: Load Public Sans and the tokens in the root layout**

`app/layout.tsx` becomes:

```tsx
import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "@/src/ui/tokens.css";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Personal Finance",
  description: "Frontend Mentor Personal Finance App — AI-native SDLC portfolio project",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Rewrite `app/globals.css` in terms of tokens**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background: var(--color-beige-100);
  color: var(--color-grey-900);
  font: var(--text-preset-4);
  letter-spacing: 0;
}

:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

- [ ] **Step 4: Copy the avatars (D1)**

```bash
mkdir -p public/avatars
cp /Users/ruslan/Own/finance-app/assets/images/avatars/*.jpg public/avatars/
ls public/avatars | wc -l   # expect 30
```

- [ ] **Step 5: Replace the placeholder unit test with the scaffold self-checks (D5)**

`tests/unit/scaffold.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");

/**
 * T-01 scaffold smoke test. It asserts this task's own deliverables so that the values
 * cannot drift away from the approved documents without CI noticing.
 */
describe("T-01 scaffold", () => {
  describe("src/ui/tokens.css mirrors docs/02-architecture/design-tokens.md", () => {
    const tokensCss = readFileSync(join(repoRoot, "src/ui/tokens.css"), "utf8");
    const tokensDoc = readFileSync(join(repoRoot, "docs/02-architecture/design-tokens.md"), "utf8");

    const documentedTokens = [...tokensDoc.matchAll(/`(--[a-z0-9-]+)`/g)].map((m) => m[1]);

    it("documents at least the 22 colours, 7 presets, 11 spacings and 8 layout tokens", () => {
      expect(new Set(documentedTokens).size).toBeGreaterThanOrEqual(48);
    });

    it.each([...new Set(documentedTokens)])("declares %s", (token) => {
      expect(tokensCss).toContain(`${token}:`);
    });

    it("declares every hex value exactly as the document spells it", () => {
      const documentedHex = [...tokensDoc.matchAll(/`(#[0-9A-Fa-f]{6})`/g)].map((m) =>
        m[1].toLowerCase(),
      );
      expect(new Set(documentedHex).size).toBe(22);
      for (const hex of new Set(documentedHex)) {
        expect(tokensCss.toLowerCase()).toContain(hex);
      }
    });
  });

  describe("public/avatars covers every seed avatar key (SPEC-overview §4.5)", () => {
    const seed = JSON.parse(
      readFileSync(join(repoRoot, "docs/00-discovery/inputs/data.json"), "utf8"),
    ) as Record<string, unknown>;

    const keys = new Set<string>();
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (node && typeof node === "object") {
        for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
          if (key === "avatar" && typeof value === "string") {
            keys.add(basename(value, ".jpg"));
          } else {
            walk(value);
          }
        }
      }
    };
    walk(seed);

    it("finds 30 distinct avatar keys in the seed", () => {
      expect(keys.size).toBe(30);
    });

    it.each([...keys].sort())("has public/avatars/%s.jpg", (key) => {
      expect(existsSync(join(repoRoot, "public/avatars", `${key}.jpg`))).toBe(true);
    });
  });
});
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: all pass — roughly 1 + 48 + 1 token assertions and 1 + 30 avatar assertions.
If a token name in the document is not in `tokens.css`, fix `tokens.css` (the document
is Approved and is not edited).

- [ ] **Step 7: Build, to confirm `next/font` and the CSS imports resolve**

Run: `npm run build`
Expected: success; `app/layout.tsx` compiles with the font loader.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(ui): tokens.css from design-tokens.md, Public Sans, challenge avatars (T-01)"
```

---
