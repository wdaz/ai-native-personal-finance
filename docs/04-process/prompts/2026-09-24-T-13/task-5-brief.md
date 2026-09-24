## Task 5: PR template that mirrors the Definition of Done

**Files:**
- Create: `.github/pull_request_template.md`, `tests/unit/pr-template.test.ts`

- [ ] **Step 1: Write the failing test.** `tests/unit/pr-template.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/** The `- [ ] …` lines of a Markdown document, text only, in order. */
const checklist = (markdown: string) =>
  [...markdown.matchAll(/^- \[[ xX]\] (.+)$/gm)].map(([, text]) => text!.trim());

/** What `expected` has that `actual` lacks, and the reverse. */
const diff = (expected: string[], actual: string[]) => ({
  missing: expected.filter((item) => !actual.includes(item)),
  extra: actual.filter((item) => !expected.includes(item)),
});

describe("the PR template mirrors docs/03-specs/definition-of-done.md (DoD, build-workflow §5)", () => {
  const dod = checklist(read("docs/03-specs/definition-of-done.md"));
  const template = read(".github/pull_request_template.md");

  it("carries every DoD item, word for word, and none of its own, all unticked", () => {
    expect(dod.length).toBeGreaterThan(20);
    expect(diff(dod, checklist(template))).toEqual({ missing: [], extra: [] });
    expect(template).not.toMatch(/^- \[[xX]\]/m);
  });

  it("(fixture) reports an item the template dropped and one it invented", () => {
    const stale = checklist(template)
      .filter((item) => item !== dod[0])
      .concat("An item the DoD does not have");
    expect(diff(dod, stale)).toEqual({
      missing: [dod[0]],
      extra: ["An item the DoD does not have"],
    });
  });
});
```

- [ ] **Step 2: Run and watch it fail.** `npx vitest run tests/unit/pr-template.test.ts`.
  **Prediction:** `ENOENT` on the template.

- [ ] **Step 3: Write the template in two plain commands** (the harness refuses one compound shell
  block; the DoD's 21 items are copied by `sed`, never retyped). First create
  `.github/pull_request_template.md` with the Write tool and exactly this text (note the blank line
  at the end):

```md
<!--
  Task id and title · spec sections · story ids (DoD, "Scope and traceability").
  Tick every box (an agent never ticks "Owner reviewed and merged"), and paste commands and their
  output from the run, not from memory (governance.md).
-->

## What and why

## Evidence

- Commands run, with their output:
- Keyboard walkthrough (what was pressed, what happened), UI tasks:
- Screenshots at 1440 / 768 / 375, UI tasks:

## Definition of done (docs/03-specs/definition-of-done.md)

```

  then append the DoD body, its five `##` headings demoted to `###`, and format:

```bash
sed -n '/^## Scope and traceability/,$p' docs/03-specs/definition-of-done.md | sed 's/^## /### /' >> .github/pull_request_template.md
npx prettier --write .github/pull_request_template.md
```
  **Measured:** 21 unticked checklist lines under `### Scope and traceability`, `### Code`,
  `### Tests (ADR-0003)`, `### Accessibility and design`, `### Process`.

- [ ] **Step 4: Run the test.** **Measured:** 2 passed; `npx prettier --check` clean. **Also make it
  fail for real:** delete one checklist line from the template, run the first test — `missing`
  names it — then restore.

- [ ] **Step 5: Commit** — `docs(process): a PR template that mirrors the Definition of Done`.

---

