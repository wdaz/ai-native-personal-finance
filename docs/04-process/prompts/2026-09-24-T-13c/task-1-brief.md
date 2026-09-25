## Task 1: TD-7 — the indicator hears that a failure is gone

**Files:**

- Modify: `src/webmcp/adapter.ts` (`register`, the lines after `generation = controller;`)
- Test: `tests/unit/webmcp/adapter.test.ts` (inside "a rejected registration is reported, not
  swallowed")

**Interfaces:**

- Consumes: `register(tools)`, `onStatus(listener)`, `mode()` from `src/webmcp/adapter.ts`; the test
  file's `freshAdapter`, `polyfillReady`, `fakeTool` and `securityError` helpers.
- Produces: no new name. Behaviour: `register()` calls every `onStatus` listener once, with `{ mode:
  resolvedMode, count: registeredNames.length }`, when it clears a failed registration, before its
  tools settle; it pushes nothing when there was no failure to clear.

- [ ] **Step 1: write the failing tests** (the first is red on today's code; the second is the
  control and passes before and after)

```diff
--- a/tests/unit/webmcp/adapter.test.ts
+++ b/tests/unit/webmcp/adapter.test.ts
@@ -304,6 +304,63 @@ describe("a rejected registration is reported, not swallowed (SPEC-webmcp-tools
     warn.mockRestore();
   });
 
+  it("TD-7 — the next register() tells the listeners the failure is gone before its tools settle", async () => {
+    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
+    const { context } = await polyfillReady();
+    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
+    context.registerTool.mockImplementationOnce(async () => {
+      throw securityError();
+    });
+    await adapter.register([fakeTool("a")]);
+    const statuses: Array<{ mode: string | null; count: number }> = [];
+    adapter.onStatus((status) => statuses.push(status));
+    expect(statuses[statuses.length - 1]).toEqual({ mode: "unavailable", count: 0 });
+
+    let settle: () => void = () => undefined;
+    context.registerTool.mockImplementationOnce(
+      () =>
+        new Promise<void>((resolve) => {
+          settle = resolve;
+        }),
+    );
+    const registering = adapter.register([fakeTool("a")]);
+    await vi.waitFor(() => expect(context.registerTool).toHaveBeenCalledTimes(2));
+
+    // `registerTool` is still pending: `mode()` already says polyfill, so must the listener.
+    expect(adapter.mode()).toBe("polyfill");
+    expect(statuses[statuses.length - 1]).toEqual({ mode: "polyfill", count: 0 });
+
+    settle();
+    await registering;
+    expect(statuses[statuses.length - 1]).toEqual({ mode: "polyfill", count: 1 });
+    warn.mockRestore();
+  });
+
+  it("TD-7 — a register() that follows no failure pushes nothing before its tools settle", async () => {
+    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
+    const { context } = await polyfillReady();
+    await adapter.register([fakeTool("a")]);
+    const statuses: Array<{ mode: string | null; count: number }> = [];
+    adapter.onStatus((status) => statuses.push(status));
+    const before = statuses.length;
+
+    let settle: () => void = () => undefined;
+    context.registerTool.mockImplementationOnce(
+      () =>
+        new Promise<void>((resolve) => {
+          settle = resolve;
+        }),
+    );
+    const registering = adapter.register([fakeTool("b")]);
+    await vi.waitFor(() => expect(context.registerTool).toHaveBeenCalledTimes(2));
+
+    expect(statuses).toHaveLength(before);
+
+    settle();
+    await registering;
+    expect(statuses[statuses.length - 1]).toEqual({ mode: "polyfill", count: 1 });
+  });
+
   it("a superseded generation stays silent: its late rejection neither warns nor sets the error", async () => {
     const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
     const { context } = await polyfillReady();
```

- [ ] **Step 2: run them and see the first fail**

```bash
npx vitest run tests/unit/webmcp/adapter.test.ts -t "TD-7"
```

Expected (measured): `1 failed | 1 passed | 20 skipped`; the failure is `expected { mode:
'unavailable', count: +0 } to deeply equal { mode: 'polyfill', count: +0 }` at the assertion made
while the second `registerTool` is still pending.

- [ ] **Step 3: fix `register()`**

```diff
--- a/src/webmcp/adapter.ts
+++ b/src/webmcp/adapter.ts
@@ -120,7 +120,12 @@ export async function register(tools: ToolDefinition[]): Promise<void> {
   generation?.abort();
   const controller = new AbortController();
   generation = controller;
+  // `mode()` reads the flag directly and is right at once, but a listener (the indicator) keeps
+  // the last status it was pushed — `unavailable` — until the tools settle, unless it is told
+  // now. Only a cleared failure changes what `status()` says, so nothing else is pushed (TD-7).
+  const hadFailed = registrationFailed;
   clearFailure();
+  if (hadFailed) notify();
 
   const context = await getModelContext();
   if (context === null || controller.signal.aborted) return;
```

- [ ] **Step 4: run the WebMCP unit tests**

```bash
npx vitest run tests/unit/webmcp
```

Expected (measured): `Test Files 8 passed`, `Tests 89 passed` (87 before, +2).

- [ ] **Step 5: commit**

```bash
git add src/webmcp/adapter.ts tests/unit/webmcp/adapter.test.ts
git commit -m "fix(webmcp): tell status listeners a failure is cleared before the tools settle (TD-7)"
```

