import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY, retryAfterMinutes } from "@/src/shared/copy";
import { CATEGORIES } from "@/src/shared/enums";
import { BILL_STATUSES } from "@/src/shared/recurring-bills-query";
import { TRANSACTION_SORTS } from "@/src/shared/transactions-query";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/**
 * `[context, message]` for every row of the tables under "## Appendix — validation and
 * message copy" (its "R1 additions" and "R2 additions" tables included), in order. Throws when there is no
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
  ["native · N", "native · 3"],
  ["polyfill · N", "polyfill · 3"],
  ["{total}", "49"],
  ["{n}", "2"],
  ["{m}", "5"],
  ["{label}", "Sort by"],
  ["{current}", "Latest"],
  ["{count}", "4"],
  ["{amount}", "$190.00"],
  ["{ordinal day}", "2nd"],
  ["{name}", "Savings"],
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
  ["Any page", ["notFound"], COPY.notFound],
  ["Sign-up", ["signupFailed"], COPY.signupFailed],
  ["Sign-up", ["signupUnreachable"], COPY.signupUnreachable],
  ["Budget", ["budgetGone"], COPY.budgetGone],
  ["Pot", ["potGone"], COPY.potGone],
  ["Any write", ["writeRateLimited"], COPY.writeRateLimited(2)],
  ["Category or theme", ["alreadyUsed"], COPY.alreadyUsed],
  [
    "Transactions",
    ["searchTransactionsPlaceholder", "searchTransactionsLabel"],
    `${COPY.searchTransactionsPlaceholder} · label: ${COPY.searchTransactionsLabel}`,
  ],
  ["Transactions", ["sortBy", "category"], `${COPY.sortBy} · ${COPY.category}`],
  [
    "Transactions sort menu",
    ["transactionSorts"],
    TRANSACTION_SORTS.map((sort) => COPY.transactionSorts[sort]).join(" · "),
  ],
  [
    "Transactions category menu",
    ["allTransactions"],
    [COPY.allTransactions, ...CATEGORIES].join(" · "),
  ],
  ["Menu trigger", ["menuTriggerName"], COPY.menuTriggerName("Sort by", "Latest")],
  [
    "Transactions table",
    ["columnRecipient", "columnCategory", "columnDate", "columnAmount"],
    [COPY.columnRecipient, COPY.columnCategory, COPY.columnDate, COPY.columnAmount].join(" · "),
  ],
  [
    "Pagination",
    ["pagination", "prev", "previousPage", "next", "nextPage", "pageNumber"],
    [
      COPY.pagination,
      COPY.prev,
      COPY.previousPage,
      COPY.next,
      COPY.nextPage,
      COPY.pageNumber(2),
    ].join(" · "),
  ],
  ["Transactions", ["transactionsStatus"], COPY.transactionsStatus(49, 2, 5)],
  [
    "Transactions",
    ["transactionsLoadError", "retry"],
    `${COPY.transactionsLoadError} · button: ${COPY.retry}`,
  ],
  ["Transactions", ["transactionsNoResults"], COPY.transactionsNoResults],
  ["Transactions", ["transactionsEmpty"], COPY.transactionsEmpty],
  [
    "Recurring Bills",
    ["searchBillsPlaceholder", "searchBillsLabel"],
    `${COPY.searchBillsPlaceholder} · label: ${COPY.searchBillsLabel}`,
  ],
  [
    "Recurring Bills",
    ["totalBills", "billsSummaryTitle"],
    `${COPY.totalBills} · ${COPY.billsSummaryTitle}`,
  ],
  [
    "Recurring Bills",
    ["billsPaid", "billsTotalUpcoming", "billsDueSoon"],
    [COPY.billsPaid, COPY.billsTotalUpcoming, COPY.billsDueSoon].join(" · "),
  ],
  ["Recurring Bills", ["billsCountAmount"], COPY.billsCountAmount(4, "$190.00")],
  [
    "Recurring Bills table",
    ["columnBillTitle", "columnDueDate", "columnAmount"],
    [COPY.columnBillTitle, COPY.columnDueDate, COPY.columnAmount].join(" · "),
  ],
  ["Recurring Bills", ["billDue"], COPY.billDue("2nd")],
  [
    "Recurring Bills",
    ["billStatuses"],
    BILL_STATUSES.map((status) => COPY.billStatuses[status]).join(" · "),
  ],
  ["Recurring Bills", ["billsStatus"], COPY.billsStatus(4)],
  [
    "Recurring Bills",
    ["billsLoadError", "retry"],
    `${COPY.billsLoadError} · button: ${COPY.retry}`,
  ],
  ["Recurring Bills", ["billsNoResults"], COPY.billsNoResults],
  ["Recurring Bills", ["billsEmpty"], COPY.billsEmpty],
  ["Modal", ["close"], COPY.close],
  ["Delete dialog", ["deleteTitle"], COPY.deleteTitle("Savings")],
  ["Delete dialog", ["confirmDeletion", "goBack"], `${COPY.confirmDeletion} · ${COPY.goBack}`],
  ["Delete dialog and forms", ["deleting", "saving"], `${COPY.deleting} · ${COPY.saving}`],
  [
    '"…" menu',
    ["budgetOptions", "potOptions"],
    [
      COPY.menuTriggerName(COPY.budgetOptions, "Savings"),
      COPY.menuTriggerName(COPY.potOptions, "Savings"),
    ].join(" · "),
  ],
  [
    '"…" menu',
    ["editBudget", "deleteBudget", "editPot", "deletePot"],
    [COPY.editBudget, COPY.deleteBudget, COPY.editPot, COPY.deletePot].join(" · "),
  ],
  [
    "Budgets and Pots",
    ["addNewBudget", "addNewPot"],
    `+ ${COPY.addNewBudget} · + ${COPY.addNewPot}`,
  ],
  ["Pots card", ["totalSaved", "targetOf"], `${COPY.totalSaved} · ${COPY.targetOf("$190.00")}`],
  ["Pots card", ["addMoney", "withdraw"], `+ ${COPY.addMoney} · ${COPY.withdraw}`],
  [
    "Pots card",
    ["addMoneyTo", "withdrawFrom"],
    `${COPY.addMoneyTo("Savings")} · ${COPY.withdrawFrom("Savings")}`,
  ],
  [
    "Pot form",
    ["addPotDescription", "addPotSubmit"],
    `${COPY.addPotDescription} · button: ${COPY.addPotSubmit}`,
  ],
  ["Pot form", ["editPotDescription"], COPY.editPotDescription],
  [
    "Pot form",
    ["potName", "potNamePlaceholder", "target"],
    [COPY.potName, COPY.potNamePlaceholder, COPY.target].join(" · "),
  ],
  ["Pot form", ["charactersLeft"], COPY.charactersLeft(2)],
  ["Pot form", ["allThemesUsed"], COPY.allThemesUsed],
  [
    "Money modal",
    ["addToPotTitle", "withdrawFromPotTitle"],
    `${COPY.addToPotTitle("Savings")} · ${COPY.withdrawFromPotTitle("Savings")}`,
  ],
  ["Money modal", ["addMoneyDescription"], COPY.addMoneyDescription],
  ["Money modal", ["withdrawDescription"], COPY.withdrawDescription],
  [
    "Money modal",
    ["amountToAdd", "amountToWithdraw"],
    `${COPY.amountToAdd} · ${COPY.amountToWithdraw}`,
  ],
  ["Money modal", ["newAmount"], COPY.newAmount],
  [
    "Money modal",
    ["confirmAddition", "confirmWithdrawal"],
    `${COPY.confirmAddition} · ${COPY.confirmWithdrawal}`,
  ],
  ["Pots", ["potsLoadError", "retry"], `${COPY.potsLoadError} · button: ${COPY.retry}`],
  [
    "Budgets and Pots forms",
    ["saveChanges", "theme", "amountPlaceholder"],
    [COPY.saveChanges, COPY.theme, COPY.amountPlaceholder].join(" · "),
  ],
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

  it.each([
    [1, "Too many changes. Try again in 1 second"],
    [2, "Too many changes. Try again in 2 seconds"],
    [60, "Too many changes. Try again in 60 seconds"],
  ])('write rate limit, %i second(s) (SPEC-write-path §3: 1 is "1 second")', (seconds, text) => {
    expect(COPY.writeRateLimited(seconds)).toBe(text);
  });

  it.each([
    [1, 1, 1, "1 transaction, page 1 of 1"],
    [8, 1, 1, "8 transactions, page 1 of 1"],
    [49, 2, 5, "49 transactions, page 2 of 5"],
  ])("Transactions status line, %i row(s) (SPEC-transactions 2.10)", (total, n, m, text) => {
    expect(COPY.transactionsStatus(total, n, m)).toBe(text);
  });

  it.each([
    [1, "1 bill"],
    [2, "2 bills"],
    [8, "8 bills"],
  ])(
    'Recurring Bills status line, %i bill(s) (SPEC-recurring-bills 2.10: "1 bill" for one)',
    (n, text) => {
      expect(COPY.billsStatus(n)).toBe(text);
    },
  );

  it("writes the delete dialog's title with curly quotes around a name of any length (SPEC-ui-kit 2.3, US-17 AC1, US-24 AC1)", () => {
    expect(COPY.deleteTitle("Entertainment")).toBe("Delete \u2018Entertainment\u2019?");
    expect(COPY.deleteTitle("x".repeat(30))).toBe(`Delete \u2018${"x".repeat(30)}\u2019?`);
  });

  it("writes the indicator's tool count as given", () => {
    expect(COPY.agentToolsNative(0)).toBe("Agent tools: native · 0");
    expect(COPY.agentToolsPolyfill(2)).toBe("Agent tools: polyfill · 2");
  });
});
