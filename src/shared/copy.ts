/**
 * Every message of the copy appendix in docs/01-requirements/user-stories.md ("Appendix —
 * validation and message copy (R-07)", its "R1 additions" and "R2 additions" tables included). The Definition
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

  // R1 additions (T-06 plan F1): the 404 page, in the words of Next's default not-found page
  notFound: "This page could not be found.",

  // R1 additions (T-06 plan gate, Q1 (c)): sign-up's failures — the generic text on a server
  // error only (owner decision); a request that got no answer says so.
  signupFailed: "Something went wrong. Try again",
  signupUnreachable: "Can't reach the server. Check your connection and try again",

  // R2 additions (SPEC-write-path §3, §9 Q5; release-2-handoffs.md H10)
  budgetGone: "This budget no longer exists",
  potGone: "This pot no longer exists",
  writeRateLimited: (seconds: number) =>
    `Too many changes. Try again in ${count(seconds, "second", "seconds")}`,
  alreadyUsed: "Already used",

  // R2 additions (SPEC-transactions 2.16, §9 Q1 and Q4; release-2-handoffs.md H11 (1))
  searchTransactionsPlaceholder: "Search transaction",
  searchTransactionsLabel: "Search transactions",
  sortBy: "Sort by",
  category: "Category",
  /** SPEC-transactions 2.4: the menu's labels, by slug (`TRANSACTION_SORTS`). */
  transactionSorts: {
    latest: "Latest",
    oldest: "Oldest",
    "a-to-z": "A to Z",
    "z-to-a": "Z to A",
    highest: "Highest",
    lowest: "Lowest",
  },
  /** The category menu's first option; the ten others are `CATEGORIES` (`enums.ts`). */
  allTransactions: "All Transactions",
  /** SPEC-transactions 2.8: a menu trigger's one accessible name, at every width. */
  menuTriggerName: (label: string, current: string) => `${label}: ${current}`,
  columnRecipient: "Recipient / Sender",
  columnCategory: "Category",
  columnDate: "Transaction Date",
  columnAmount: "Amount",
  pagination: "Pagination",
  prev: "Prev",
  previousPage: "Previous page",
  next: "Next",
  nextPage: "Next page",
  pageNumber: (n: number) => `Page ${n}`,
  transactionsStatus: (total: number, page: number, pageCount: number) =>
    `${count(total, "transaction", "transactions")}, page ${page} of ${pageCount}`,
  transactionsLoadError: "Couldn't load your transactions",

  // R2 additions (SPEC-recurring-bills 2.15, §9 RB-Q1 and RB-Q2; release-2-handoffs.md H14 (1))
  searchBillsPlaceholder: "Search bills",
  searchBillsLabel: "Search bills",
  totalBills: "Total Bills",
  billsSummaryTitle: "Summary",
  /** Also the Overview bills card's three labels (SPEC-overview §2.6). */
  billsPaid: "Paid Bills",
  billsTotalUpcoming: "Total Upcoming",
  billsDueSoon: "Due Soon",
  /** US-28 AC1: "4 ($190.00)"; the amount comes formatted (`formatMoney`). */
  billsCountAmount: (n: number, amount: string) => `${n} (${amount})`,
  columnBillTitle: "Bill Title",
  columnDueDate: "Due Date",
  /** US-27 AC1: the due text, `formatDueDay`'s words ("Monthly - 2nd"). */
  billDue: (ordinalDay: string) => `Monthly - ${ordinalDay}`,
  /** 2.9: a row's visually hidden status, by `BILL_STATUSES`. */
  billStatuses: {
    paid: "Paid",
    dueSoon: "Due soon",
    upcoming: "Upcoming",
  },
  billsStatus: (n: number) => count(n, "bill", "bills"),
  billsLoadError: "Couldn't load your recurring bills",
  billsEmpty: "No recurring bills yet",

  // R2 additions (SPEC-ui-kit 2.12, §9 UK-Q1; release-2-handoffs.md H13 (2))
  /** 2.2: the modal's close button, heard (the design's `aria-label`). */
  close: "Close",
  /** 2.3: the delete dialog's title, with the design's curly quotes (U+2018, U+2019). */
  deleteTitle: (name: string) => `Delete ‘${name}’?`,
  confirmDeletion: "Yes, Confirm Deletion",
  goBack: "No, Go Back",
  /** 2.3, 2.7: the confirm and the submit button while their request is pending (UK-Q1). */
  deleting: "Deleting…",
  saving: "Saving…",
  /** 2.4: the "…" button's name is `menuTriggerName(budgetOptions, name)` (UK-Q1). */
  budgetOptions: "Budget options",
  potOptions: "Pot options",
  editBudget: "Edit Budget",
  deleteBudget: "Delete Budget",
  editPot: "Edit Pot",
  deletePot: "Delete Pot",
  /** 2.8: the header buttons' names; the visible "+" before them is drawn `aria-hidden`. */
  addNewBudget: "Add New Budget",
  addNewPot: "Add New Pot",
} as const;
