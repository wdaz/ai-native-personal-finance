# T-02 final review — findings for the one fix wave

Branch task/T-02-persistence-reset, base of the fix wave 7718a1e. Source: the final whole-branch review (opus), triaged by the controller. Items are numbered as in the review; item 3 (the process record) is the controller's and is not part of this wave.

## Item 1 (Important) — no test pins SPEC-reset-and-test-support §2.1 "in one transaction"

Where: tests/api/reset.spec.ts (the lock test only proves a reset waits for key 42) and src/server/reset.ts (`db.$transaction(...)`).
What's wrong: remove the `$transaction` wrapper and every test still passes — the lock statement still blocks, the poll still sees one waiter. A refactor that drops the transaction would go unnoticed, and a cron or threshold reset failing part-way would leave the tables truncated or half-filled.
Fix: add to tests/api/reset.spec.ts, in the file's style (imports as needed: `applyVariant` from "@/src/server/variants"):

```ts
test("US-36 a reset that fails part-way leaves the previous data (§2.1: one transaction)", async () => {
  await resetToSeed(db, "test", applyVariant(seedRows(), "empty-pots"));
  const before = await storedRows(db);
  const rows = seedRows();
  const broken = { ...rows, budgets: [...rows.budgets, rows.budgets[0]!] }; // duplicate category
  await expect(resetToSeed(db, "test", broken)).rejects.toMatchObject({ code: "P2002" });
  expect(await storedRows(db)).toEqual(before);
});
```

If the non-null assertion `!` trips the lint config, replace it with an explicit guard that fails the test. Prove it: temporarily replace the `db.$transaction(async (tx) => { … }, { … })` wrapper so the body runs against `db` directly (keep everything else), run the test, see it fail, restore by hand, see it pass. Record both runs verbatim.

## Item 2 (Important) — the one-worker rule lives only in the npm script

Where: playwright.config.ts — `fullyParallel: true` (top level) and the `api` project.
What's wrong: `--workers=1` is only in `test:api`; `npx playwright test --project=api`, a bare `npx playwright test` and `npm run test:e2e:ui` run the API files in parallel against one database, so resets clobber each other.
Fix: on the `api` project itself: `{ name: "api", testDir: "tests/api", workers: 1, fullyParallel: false, use: { baseURL } }` (TestProject.workers exists in the installed Playwright — node_modules/playwright/types/test.d.ts). Keep `--workers=1` in the script. Adjust the config's header comment so it says where the rule lives. Verify: `npx playwright test --project=api` (no --workers flag) runs green.

## Item 4 (Minor, fix) — health checks over the Unix socket

Where: compose.yaml (healthcheck) and .github/workflows/ci.yml (the api job's `--health-cmd`).
What's wrong: `pg_isready` without `-h` checks the socket; on a fresh volume's first boot the image's temporary init server listens on the socket only, so `--wait` can pass before TCP connections work.
Fix: `pg_isready -h 127.0.0.1 -U postgres -d personal_finance` in both files. Verify: `docker compose up -d --wait` (Compose recreates the container for the changed healthcheck and keeps the named volume) reports healthy; do NOT run `docker compose down -v`.

## Item 5 (Minor, fix) — the ResetLog.at comment names the wrong source

Where: src/server/reset.ts, the doc comment of resetToSeed ("`at` comes from the column's `@default(now())`, so this module reads no clock").
What's wrong: Prisma 7's client runtime likely fills `@default(now())` itself (a NowGenerator in @prisma/client/runtime) and sends the value in the INSERT, so `at` is the app process's clock, not the database's.
Fix: confirm once — a throwaway script outside the repo's tracked files (e.g. in this workspace folder) that creates a client with `log: ["query"]` (or `log: [{ emit: "event", level: "query" }]`) and inserts one ResetLog row, and look at whether the INSERT names the "at" column. Then reword the comment to what you observed, keeping the ADR-0005 point that this module calls no clock itself. Suggested wording if the runtime fills it: "`at` is filled by Prisma's runtime from the server's clock when the row is created (`@default(now())`) — operational time, not the fixed business clock — so this module itself reads no clock (ADR-0005)." Record the evidence in the report. Delete the throwaway script afterwards.

## Item 6 (Minor, fix) — .env.example still lists /api/test/log

Where: .env.example, the APP_ENV comment: "APP_ENV=test enables /api/test/reset|seed|log and the window.__pf test hook."
Fix: "APP_ENV=test enables /api/test/reset|seed (/api/test/log arrives in T-12) and the window.__pf test hook." (Keep the variable names unchanged: tests/unit/scaffold.test.ts checks them.)

## Item 7 (Minor, fix) — other HTTP methods show that the route exists outside test

Where: app/api/test/[...path]/route.ts.
What's wrong: Next implements OPTIONS itself (answering with an Allow header) and answers 405 to PUT, PATCH and DELETE, in every environment — SPEC-reset §2.7 says the routes "do not exist — 404".
Fix: also export PUT, PATCH, DELETE and OPTIONS, each delegating to `handleTestSupport` with its method name, exactly like POST and GET (the route table has no entries for those methods, so they answer the 404 envelope everywhere, and outside test every method does). Extend the unit test "answers 404 through the route file when APP_ENV is not test" in tests/unit/test-support.test.ts to cover every exported handler (e.g. iterate over the module's exports). Verify with the unit test; optionally also `npm run build && APP_ENV=production npx next start -p 3100` plus `curl -i -X OPTIONS http://127.0.0.1:3100/api/test/reset` and `-X PUT` (expect 404), then stop that server.
