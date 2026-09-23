### Task 2: The copy appendix in `copy.ts`

Owner answers 2, 3a and 3b.

**Files:**
- Modify: `docs/01-requirements/user-stories.md` (v1.2), `docs/03-specs/app-shell.md` (v1.1)
- Create: `src/shared/copy.ts`
- Create: `tests/unit/shared/copy.test.ts`, `tests/fixtures/copy/reworded.md.fixture`,
  `tests/fixtures/copy/no-appendix.md.fixture`

**Interfaces:**
- Consumes: nothing.
- Produces, in `src/shared/copy.ts`: `COPY` — string entries, and the functions
  `signupDisabled(email: string, password: string)`, `resetBanner(days: number, date: string)`,
  `loginRateLimited(minutes: number)`, `agentToolsNative(tools: number)`,
  `agentToolsPolyfill(tools: number)`, each returning `string`; and
  `retryAfterMinutes(retryAfter: number): number` (SPEC-auth §4). Task 3 uses `COPY.required`,
  `emailInvalid`, `passwordTooShort`, `nameTooLong`, `passwordTooLong`.

- [ ] **Step 1: Amend the appendix (user-stories v1.2)**

The status line gains a v1.2 entry; the appendix's banner row takes `{days}`; two new rows, the
reused email row and a note on plurals follow the "R1 additions" table:

```diff
--- a/docs/01-requirements/user-stories.md
+++ b/docs/01-requirements/user-stories.md
@@ -1,6 +1,6 @@
 # User stories
 
-Status: **Approved** (v1.1 — 2026-09-20 amendments: copy appendix "R1 additions"; US-35 moved to Release 1; US-04 AC2 and US-37 AC3 verified in Release 2 — see PRD v1.2) · Author(s): Agent (draft) · Date: 2026-09-08
+Status: **Approved** (v1.2 — 2026-09-23 amendments, owner decisions at the T-04 plan gate: the copy appendix's demo banner takes the configured interval (`{days}`), and three R1 additions give the sign-up maxima their messages; v1.1 — 2026-09-20 amendments: copy appendix "R1 additions"; US-35 moved to Release 1; US-04 AC2 and US-37 AC3 verified in Release 2 — see PRD v1.2) · Author(s): Agent (draft) · Date: 2026-09-08
 Source: `../00-discovery/inputs/challenge-brief.md` (brief), `../00-discovery/problem-statement.md` (PS), `../00-discovery/inputs/design/` (design; visual reference only)
 Conventions: ids are stable; priorities Must/Should/Could; every story lists ≥1 error or boundary criterion; "Agent tool" names the WebMCP tool the story implies (final set decided in NFR-W / ADR). Business "today" is **19 Aug 2026** and the current month is **August 2026** (OQ-4); seed dates are shifted +2 years at seed time. **Where the design and `data.json` differ, `data.json` wins** (owner decision R-01). Every budget and pot has a server-generated `id`; tools take and return ids (R-26). Validation copy: see the copy table at the end of this document (R-07). Money is USD, shown with two decimals and a sign as in the design.
 
@@ -280,7 +280,7 @@
 | Delete pot | confirm | Are you sure you want to delete this pot? This action cannot be reversed, and all the data inside it will be removed forever. |
 | Transactions | no results | No transactions match your search |
 | Bills | no results | No bills match your search |
-| Demo banner | always | Demo data resets every 10 days · last reset <date> |
+| Demo banner | always | Demo data resets every {days} days · last reset <date> |
 | After reset | stale request | Data was reset — reloading |
 
 ### R1 additions (2026-09-20, owner-approved with the Release 1 specs)
@@ -303,3 +303,8 @@
 | R2 placeholder pages | body | Coming in Release 2 |
 | Agent tools indicator | states | Agent tools: checking… / native · N / polyfill · N / unavailable (titles in SPEC-webmcp-tools §2.7) |
 | Stale write after reset (R2) | 409 | Data was reset — reloading |
+| Sign-up name | > 60 characters | Maximum 60 characters |
+| Email | > 254 characters | Enter a valid email address |
+| Password (sign-up) | > 128 characters | Maximum 128 characters |
+
+`{N}` and `{days}` are whole numbers; a count of 1 is written in the singular ("1 minute", "1 day").
```

- [ ] **Step 2: Amend SPEC-app-shell (v1.1)**

```diff
--- a/docs/03-specs/app-shell.md
+++ b/docs/03-specs/app-shell.md
@@ -1,7 +1,7 @@
 # SPEC-app-shell — Authenticated layout: sidebar, bottom navigation, minimise, banner, footer
 
-Status: **Approved** (v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20
-Changelog: v0.2 — S-10 indicator owned by WebMcpProvider; S-11 server-side meta; S-14 US-35 confirmed R1 (PRD amended); S-24 meta DTO + OT meta tag; S-25 deterministic lastResetAt; S-27 names/storage; S-35 test rows.
+Status: **Approved** (v1.1 — 2026-09-23: §2.6 banner interval from `meta.resetIntervalDays`; v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20
+Changelog: v1.1 (2026-09-23, owner decision at the T-04 plan gate) — §2.6: the banner writes the configured interval, `meta.resetIntervalDays` (§5), as `.env.example` already said; the copy appendix (user-stories v1.2) reads "every {days} days". v0.2 — S-10 indicator owned by WebMcpProvider; S-11 server-side meta; S-14 US-35 confirmed R1 (PRD amended); S-24 meta DTO + OT meta tag; S-25 deterministic lastResetAt; S-27 names/storage; S-35 test rows.
 Implements: US-33, US-34, US-35, US-37 AC2, US-41 (indicator slot), US-03 (logout button slot) · Constrained by: ADR-0002, ADR-0004, design-tokens.md, NFR-A · Design: prototype sidebar (expanded 300 px / collapsed 88 px), tablet/mobile bottom bar; style guide "Sidebar"
 
 ## 1. Purpose
@@ -13,7 +13,7 @@
 2.3 Minimise (US-35, Release 1 by owner decision S-14): toggle collapses width to 88 px, hides labels (icons keep `aria-label`), flips the caret icon; accessible name "Minimize Menu" when expanded, "Expand Menu" when collapsed; `aria-expanded` reflects state; `sessionStorage["pf.sidebar"] = "collapsed"` when collapsed, key removed when expanded; no layout shift of page content beyond the width change (transition 200 ms, respects `prefers-reduced-motion`).
 2.4 Tablet (768–1023 px) and mobile (< 768 px): sidebar hidden; fixed bottom bar with the five items — tablet shows icon + label, mobile icon only with `aria-label`; active item styled as in the design (beige-100 tab with top radius). Page content gets bottom padding equal to the bar height. Footer actions move to the page header's right side: agent indicator (compact dot) and a "Log out" icon button.
 2.5 Page header: each page renders `<PageHeader title primaryAction?>`; `<h1>` text preset 1.
-2.6 Reset banner: if `meta.lastResetAt` exists, a slim bar above the content: "Demo data resets every 10 days · last reset {date, e.g. 12 Sep 2026}" with a dismiss button ("Dismiss notice"); dismissed state in `sessionStorage["pf.banner"]`; role="status".
+2.6 Reset banner: if `meta.lastResetAt` exists, a slim bar above the content: "Demo data resets every {resetIntervalDays} days · last reset {date, e.g. 12 Sep 2026}" (`COPY.resetBanner`; "1 day" when the interval is 1) with a dismiss button ("Dismiss notice"); dismissed state in `sessionStorage["pf.banner"]`; role="status".
 2.7 Navigation is client-side (`<Link>`); the current page is announced (`aria-current="page"`).
 2.8 Skip link "Skip to content" as the first focusable element, visible on focus.
 
```

- [ ] **Step 3: Write the failing test and generate its fixtures**

`tests/unit/shared/copy.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY, retryAfterMinutes } from "@/src/shared/copy";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/**
 * `[context, message]` for every row of the tables under "## Appendix — validation and
 * message copy" (its "R1 additions" table included), in order. Throws when there is no
 * appendix, so a renamed section fails instead of comparing nothing with nothing.
 */
function appendixRows(markdown: string): [string, string][] {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) =>
    line.startsWith("## Appendix — validation and message copy"),
  );
  if (start < 0) throw new Error("No copy appendix in user-stories.md");
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines
    .slice(start + 1, end < 0 ? undefined : end)
    .filter((line) => line.startsWith("|") && !/^\|[\s|:-]+\|$/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter(([context]) => context !== "Context")
    .map(([context = "", , message = ""]) => [context, message]);
}

/** One sample value per appendix placeholder, so a row reads as a sentence copy.ts can write. */
const SAMPLES: [string, string][] = [
  ["<email>", "e@example.com"],
  ["<password>", "p4ssword-demo"],
  ["<date>", "12 Sep 2026"],
  ["{N}", "2"],
  ["{days}", "10"],
  ["· N", "· 3"],
];
const fill = (text: string) => SAMPLES.reduce((out, [from, to]) => out.replaceAll(from, to), text);
const state = (text: string) => text.replace("Agent tools: ", "");

type Key = keyof typeof COPY;

/** The appendix, row by row, as copy.ts renders it with the same samples. */
const RENDERED: [context: string, keys: Key[], message: string][] = [
  ["Any required field", ["required"], COPY.required],
  ["Email", ["emailInvalid"], COPY.emailInvalid],
  ["Password (sign-up)", ["passwordTooShort"], COPY.passwordTooShort],
  ["Login", ["loginIncorrect"], COPY.loginIncorrect],
  ["Sign-up", ["signupDisabled"], COPY.signupDisabled("e@example.com", "p4ssword-demo")],
  ["Amount fields", ["amountFormat"], COPY.amountFormat],
  ["Amount fields", ["amountNotPositive"], COPY.amountNotPositive],
  ["Amount fields", ["amountTooLarge"], COPY.amountTooLarge],
  ["Add money", ["depositOverBalance"], COPY.depositOverBalance],
  ["Withdraw", ["withdrawalOverTotal"], COPY.withdrawalOverTotal],
  ["Pot name", ["potNameTooLong"], COPY.potNameTooLong],
  ["Pot name", ["potNameTaken"], COPY.potNameTaken],
  ["Budget category", ["budgetCategoriesUsed"], COPY.budgetCategoriesUsed],
  ["Delete budget", ["deleteBudgetConfirm"], COPY.deleteBudgetConfirm],
  ["Delete pot", ["deletePotConfirm"], COPY.deletePotConfirm],
  ["Transactions", ["transactionsNoResults"], COPY.transactionsNoResults],
  ["Bills", ["billsNoResults"], COPY.billsNoResults],
  ["Demo banner", ["resetBanner"], COPY.resetBanner(10, "12 Sep 2026")],
  ["After reset", ["dataWasReset"], COPY.dataWasReset],
  ["Login", ["loginFailed"], COPY.loginFailed],
  ["Login", ["loginRateLimited"], COPY.loginRateLimited(2)],
  ["Login", ["loginAfterReset"], COPY.loginAfterReset],
  ["Login demo box", ["copyFailed"], COPY.copyFailed],
  ["Login button", ["loggingIn"], COPY.loggingIn],
  ["Sign-up notice", ["goToLogin"], COPY.goToLogin],
  ["Overview", ["overviewLoadError", "retry"], `${COPY.overviewLoadError} · button: ${COPY.retry}`],
  ["Overview pots", ["potsEmpty", "addPot"], `${COPY.potsEmpty} · link: ${COPY.addPot}`],
  [
    "Overview budgets",
    ["budgetsEmpty", "addBudget"],
    `${COPY.budgetsEmpty} · link: ${COPY.addBudget}`,
  ],
  ["Overview transactions", ["transactionsEmpty"], COPY.transactionsEmpty],
  ["Banner", ["dismissNotice"], COPY.dismissNotice],
  ["Shell", ["skipToContent"], COPY.skipToContent],
  ["Sidebar toggle", ["minimizeMenu", "expandMenu"], `${COPY.minimizeMenu} / ${COPY.expandMenu}`],
  ["R2 placeholder pages", ["comingInRelease2"], COPY.comingInRelease2],
  [
    "Agent tools indicator",
    ["agentToolsChecking", "agentToolsNative", "agentToolsPolyfill", "agentToolsUnavailable"],
    [
      COPY.agentToolsChecking,
      state(COPY.agentToolsNative(3)),
      state(COPY.agentToolsPolyfill(3)),
      `${state(COPY.agentToolsUnavailable)} (titles in SPEC-webmcp-tools §2.7)`,
    ].join(" / "),
  ],
  ["Stale write after reset (R2)", ["dataWasReset"], COPY.dataWasReset],
  ["Sign-up name", ["nameTooLong"], COPY.nameTooLong],
  ["Email", ["emailInvalid"], COPY.emailInvalid],
  ["Password (sign-up)", ["passwordTooLong"], COPY.passwordTooLong],
];

const expected = RENDERED.map(([context, , message]) => [context, message]);
const filled = (markdown: string) =>
  appendixRows(markdown).map(([context, message]) => [context, fill(message)]);

/** The contexts of the rows where the appendix and copy.ts disagree. */
const differingRows = (rows: string[][]) =>
  expected.filter((row, i) => row.join("|") !== rows[i]?.join("|")).map(([context]) => context);

describe("src/shared/copy.ts mirrors the user-stories copy appendix (DoD, US-31)", () => {
  it("renders every appendix row, in order, with the appendix's own words", () => {
    expect(filled(read("docs/01-requirements/user-stories.md"))).toEqual(expected);
  });

  it("holds nothing the appendix lacks", () => {
    const used = new Set(RENDERED.flatMap(([, keys]) => keys));
    expect(Object.keys(COPY).filter((key) => !used.has(key as Key))).toEqual([]);
  });

  it("would report a reworded message (violation fixture, DoD v1.1)", () => {
    expect(differingRows(filled(read("tests/fixtures/copy/reworded.md.fixture")))).toEqual([
      "Any required field",
    ]);
  });

  it("would report an appendix without the section rather than pass in silence (violation fixture)", () => {
    expect(() => appendixRows(read("tests/fixtures/copy/no-appendix.md.fixture"))).toThrow(
      "No copy appendix in user-stories.md",
    );
  });
});

describe("copy with a number in it", () => {
  it.each([
    [1, "Too many attempts. Try again in 1 minute"],
    [2, "Too many attempts. Try again in 2 minutes"],
    [15, "Too many attempts. Try again in 15 minutes"],
  ])("rate limit, %i minute(s)", (minutes, text) => {
    expect(COPY.loginRateLimited(minutes)).toBe(text);
  });

  it.each([
    [0, "Too many attempts. Try again in 1 minute"],
    [30, "Too many attempts. Try again in 1 minute"],
    [60, "Too many attempts. Try again in 1 minute"],
    [61, "Too many attempts. Try again in 2 minutes"],
    [90, "Too many attempts. Try again in 2 minutes"],
    [900, "Too many attempts. Try again in 15 minutes"],
  ])("rate limit after Retry-After: %i s (SPEC-auth §4)", (retryAfter, text) => {
    expect(COPY.loginRateLimited(retryAfterMinutes(retryAfter))).toBe(text);
  });

  it.each([
    [1, "Demo data resets every 1 day · last reset 3 Oct 2026"],
    [10, "Demo data resets every 10 days · last reset 3 Oct 2026"],
  ])("reset banner, %i day(s)", (days, text) => {
    expect(COPY.resetBanner(days, "3 Oct 2026")).toBe(text);
  });

  it("writes the indicator's tool count as given", () => {
    expect(COPY.agentToolsNative(0)).toBe("Agent tools: native · 0");
    expect(COPY.agentToolsPolyfill(2)).toBe("Agent tools: polyfill · 2");
  });
});
```

The two fixtures are copies of the amended appendix, made by a script so that they cannot be
typed wrong. Save it as `$CLAUDE_JOB_DIR/tmp/copy-fixtures.mjs` (scratch, not committed) and run
it from the repository root: `node "$CLAUDE_JOB_DIR/tmp/copy-fixtures.mjs"`.

```js
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const md = readFileSync("docs/01-requirements/user-stories.md", "utf8");
const appendix = md.slice(md.indexOf("## Appendix — validation and message copy"));
mkdirSync("tests/fixtures/copy", { recursive: true });
writeFileSync(
  "tests/fixtures/copy/reworded.md.fixture",
  "<!-- tests/unit/shared/copy.test.ts: the appendix with one message reworded. -->\n\n" +
    appendix.replace("| Can't be empty |", "| Can't be blank |"),
);
writeFileSync(
  "tests/fixtures/copy/no-appendix.md.fixture",
  "<!-- tests/unit/shared/copy.test.ts: the appendix under another heading. -->\n\n" +
    appendix.replace("## Appendix — validation and message copy", "## Messages"),
);
```

Expected (*measured*, E15): the files it writes are byte-equal to the prototype's.

- [ ] **Step 4: Run the test to see it fail**

Run: `npx vitest run tests/unit/shared/copy.test.ts`
Expected (*measured*, E15): FAIL — "Cannot find package '@/src/shared/copy'".

- [ ] **Step 5: Write `src/shared/copy.ts`**

```ts
/**
 * Every message of the copy appendix in docs/01-requirements/user-stories.md ("Appendix —
 * validation and message copy (R-07)", its "R1 additions" table included). The Definition
 * of Done makes this the only source of user-visible copy. tests/unit/shared/copy.test.ts
 * renders every entry and compares it with the appendix, row by row and in order. The
 * appendix's placeholders (`<email>`, `<date>`, `{N}`, `{days}`) are parameters here.
 */

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** SPEC-auth §4: the banner's minutes, `N = max(1, Math.ceil(retryAfter / 60))`. */
export const retryAfterMinutes = (retryAfter: number): number =>
  Math.max(1, Math.ceil(retryAfter / 60));

export const COPY = {
  required: "Can't be empty",
  emailInvalid: "Enter a valid email address",
  passwordTooShort: "Password must be at least 8 characters",
  loginIncorrect: "Email or password is incorrect",
  signupDisabled: (email: string, password: string) =>
    `This is a demo instance — sign up is disabled. Use the demo account: ${email} / ${password}`,
  amountFormat: "Enter an amount with up to two decimals",
  amountNotPositive: "Amount must be greater than 0",
  amountTooLarge: "Amount is too large",
  depositOverBalance: "Amount exceeds your current balance",
  withdrawalOverTotal: "Amount exceeds this pot's total",
  potNameTooLong: "Maximum 30 characters",
  potNameTaken: "A pot with this name already exists",
  budgetCategoriesUsed: "All categories already have a budget",
  deleteBudgetConfirm:
    "Are you sure you want to delete this budget? This action cannot be reversed, and all the data inside it will be removed forever.",
  deletePotConfirm:
    "Are you sure you want to delete this pot? This action cannot be reversed, and all the data inside it will be removed forever.",
  transactionsNoResults: "No transactions match your search",
  billsNoResults: "No bills match your search",
  resetBanner: (days: number, date: string) =>
    `Demo data resets every ${count(days, "day", "days")} · last reset ${date}`,
  dataWasReset: "Data was reset — reloading",

  // R1 additions (2026-09-20)
  loginFailed: "Something went wrong. Try again",
  loginRateLimited: (minutes: number) =>
    `Too many attempts. Try again in ${count(minutes, "minute", "minutes")}`,
  loginAfterReset: "The demo data was reset — please log in again",
  copyFailed: "Copy failed — select the text",
  loggingIn: "Logging in…",
  goToLogin: "Go to login",
  overviewLoadError: "Couldn't load your overview",
  retry: "Retry",
  potsEmpty: "No pots yet",
  addPot: "Add a pot",
  budgetsEmpty: "No budgets yet",
  addBudget: "Add a budget",
  transactionsEmpty: "No transactions yet",
  dismissNotice: "Dismiss notice",
  skipToContent: "Skip to content",
  minimizeMenu: "Minimize Menu",
  expandMenu: "Expand Menu",
  comingInRelease2: "Coming in Release 2",
  agentToolsChecking: "Agent tools: checking…",
  agentToolsNative: (tools: number) => `Agent tools: native · ${tools}`,
  agentToolsPolyfill: (tools: number) => `Agent tools: polyfill · ${tools}`,
  agentToolsUnavailable: "Agent tools: unavailable",

  // R1 additions (T-04 plan gate): the maxima of SPEC-auth §6's SignupSchema
  nameTooLong: "Maximum 60 characters",
  passwordTooLong: "Maximum 128 characters",
} as const;
```

- [ ] **Step 6: Run the test to see it pass**

Run: `npx vitest run tests/unit/shared/copy.test.ts`
Expected (*measured*): **16 passed (16)** — among them the owner's two cases, `retryAfter` 30 →
"1 minute" and 90 → "2 minutes".

- [ ] **Step 7: All unit gates**

Run: `npx prettier --write src/shared tests/unit/shared && npm run lint && npm run format:check && npm run typecheck && npm test`
Expected (*measured*, E15): every command exits 0; Vitest **364/364**.

- [ ] **Step 8: Commit (two commits: the documents, then the code)**

```bash
git add docs/01-requirements/user-stories.md docs/03-specs/app-shell.md
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "docs(stories,app-shell): v1.2 / v1.1 — banner interval as {days}, sign-up maxima copy (T-04 plan gate)"
git add src/shared/copy.ts tests/unit/shared/copy.test.ts tests/fixtures/copy
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(shared): copy.ts mirrors the user-stories copy appendix, row by row (T-04)"
```

---

