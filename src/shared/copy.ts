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

  // R1 additions (T-06 plan F1): the 404 page, in the words of Next's default not-found page
  notFound: "This page could not be found.",
} as const;
