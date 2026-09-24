// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelContext, ToolDefinition } from "@/src/webmcp/types";

vi.mock("@mcp-b/webmcp-polyfill", () => ({ initializeWebMCPPolyfill: vi.fn() }));

type Adapter = typeof import("@/src/webmcp/adapter");

/** A fresh `adapter.ts` instance per test — its module-level state (generation, mode,
 * registered names) would otherwise leak between cases in this file (tests/unit/README.md). */
async function freshAdapter(env: Record<string, string> = {}): Promise<Adapter> {
  vi.resetModules();
  vi.unstubAllEnvs();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import("@/src/webmcp/adapter");
}

/** `.mock.calls` typed for this file's one shape, rather than fighting `vi.fn`'s generic default. */
function registerCalls(
  mock: ReturnType<typeof vi.fn>,
): Array<[ToolDefinition, { signal: AbortSignal }]> {
  return mock.mock.calls as Array<[ToolDefinition, { signal: AbortSignal }]>;
}

function fakeTool(name: string): ToolDefinition {
  return {
    name,
    description: "a tool",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => ({ content: [] }),
  };
}

function fakeContext(): ModelContext & {
  registerTool: ReturnType<typeof vi.fn>;
  getTools: ReturnType<typeof vi.fn>;
} {
  const target = new EventTarget() as ModelContext & {
    registerTool: ReturnType<typeof vi.fn>;
    getTools: ReturnType<typeof vi.fn>;
  };
  target.registerTool = vi.fn(async () => undefined);
  target.getTools = vi.fn(async () => []);
  return target;
}

async function polyfillReady(): Promise<{
  context: ReturnType<typeof fakeContext>;
  init: ReturnType<typeof vi.fn>;
}> {
  const { initializeWebMCPPolyfill } = await import("@mcp-b/webmcp-polyfill");
  const context = fakeContext();
  const init = vi.mocked(initializeWebMCPPolyfill);
  init.mockReset();
  init.mockImplementation(() => {
    document.modelContext = context;
  });
  return { context, init };
}

beforeEach(() => {
  delete document.modelContext;
  delete document.documentElement.dataset.webmcp;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("mode detection (SPEC-webmcp-tools §2.2)", () => {
  it('off → mode() is "unavailable" synchronously, register() a no-op', async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "off" });
    expect(adapter.mode()).toBe("unavailable");

    const { init } = await polyfillReady();
    await adapter.register([fakeTool("get_balance")]);

    expect(init).not.toHaveBeenCalled();
    expect(adapter.mode()).toBe("unavailable");
    expect(adapter.registeredTools()).toEqual([]);
    expect(document.documentElement.dataset.webmcp).toBeUndefined();
  });

  it("empty WEBMCP_MODE behaves as polyfill (next.config.ts's own rule)", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "" });
    await polyfillReady();
    await adapter.getModelContext();
    expect(adapter.mode()).toBe("polyfill");
  });

  it('native → "modelContext" in document before anything is imported', async () => {
    document.modelContext = fakeContext();
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "native" });
    const { init } = await polyfillReady();

    const context = await adapter.getModelContext();

    expect(init).not.toHaveBeenCalled();
    expect(adapter.mode()).toBe("native");
    expect(context).toBe(document.modelContext);
  });

  it("polyfill → imported and initialized once, memoized across callers", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { init, context } = await polyfillReady();

    const [a, b] = await Promise.all([adapter.getModelContext(), adapter.getModelContext()]);

    expect(init).toHaveBeenCalledTimes(1);
    expect(a).toBe(context);
    expect(b).toBe(context);
    expect(adapter.mode()).toBe("polyfill");
  });

  it("import/init failure → unavailable, console.warn, never throws", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { initializeWebMCPPolyfill } = await import("@mcp-b/webmcp-polyfill");
    vi.mocked(initializeWebMCPPolyfill).mockImplementation(() => {
      throw new Error("boom");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const context = await adapter.getModelContext();

    expect(context).toBeNull();
    expect(adapter.mode()).toBe("unavailable");
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("register/unregisterAll (SPEC §2.2, plan Q1 — AbortController per generation)", () => {
  it("registers every tool with the current generation's signal and sets readiness", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();

    await adapter.register([fakeTool("get_balance"), fakeTool("get_overview_summary")]);

    expect(context.registerTool).toHaveBeenCalledTimes(2);
    const calls = registerCalls(context.registerTool);
    const [toolA, optionsA] = calls[0]!;
    const [toolB, optionsB] = calls[1]!;
    expect([toolA.name, toolB.name]).toEqual(["get_balance", "get_overview_summary"]);
    expect(optionsA.signal).toBe(optionsB.signal);
    expect(optionsA.signal.aborted).toBe(false);
    expect(document.documentElement.dataset.webmcp).toBe("ready");
    expect(adapter.registeredTools()).toEqual(["get_balance", "get_overview_summary"]);
  });

  it("unregisterAll aborts the registration signal and clears readiness", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();

    await adapter.register([fakeTool("get_balance")]);
    const [, options] = registerCalls(context.registerTool)[0]!;
    adapter.unregisterAll();

    expect(options.signal.aborted).toBe(true);
    expect(document.documentElement.dataset.webmcp).toBeUndefined();
    expect(adapter.registeredTools()).toEqual([]);
  });

  it("Review Focus 1 — a registration cancelled while the polyfill import is still in flight never registers", async () => {
    vi.useFakeTimers();
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();

    const pending = adapter.register([fakeTool("get_balance")]);
    adapter.unregisterAll(); // before the idle-scheduled detection has run at all
    await vi.runAllTimersAsync();
    await pending;

    expect(context.registerTool).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.webmcp).toBeUndefined();
  });

  it("Review Focus 2 — a second register() before the first settles drops the first generation entirely", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();

    const first = adapter.register([fakeTool("a")]);
    const second = adapter.register([fakeTool("b")]);
    await Promise.all([first, second]);

    expect(context.registerTool.mock.calls.map(([tool]) => tool.name)).toEqual(["b"]);
    expect(adapter.registeredTools()).toEqual(["b"]);
  });

  it("Review Focus 3 — one register() batch dispatches exactly one toolchange on document and on the context", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();
    const onDocument = vi.fn();
    const onContext = vi.fn();
    document.addEventListener("toolchange", onDocument);
    context.addEventListener("toolchange", onContext);

    await adapter.register([fakeTool("a"), fakeTool("b")]);

    expect(onDocument).toHaveBeenCalledTimes(1);
    expect(onContext).toHaveBeenCalledTimes(1);
    document.removeEventListener("toolchange", onDocument);
  });

  it("a registerTool rejection for one tool does not block the others, and is not counted as registered", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();
    context.registerTool.mockImplementationOnce(async () => {
      throw new Error("duplicate name");
    });

    await adapter.register([fakeTool("broken"), fakeTool("ok")]);

    expect(context.registerTool).toHaveBeenCalledTimes(2);
    expect(adapter.registeredTools()).toEqual(["ok"]);
    expect(document.documentElement.dataset.webmcp).toBe("ready");
  });
});

describe("onStatus (SPEC §2.2)", () => {
  it("calls the listener immediately with the current status, then on every change", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();
    const statuses: Array<{ mode: string | null; count: number }> = [];
    const unsubscribe = adapter.onStatus((status) => statuses.push(status));

    await adapter.register([fakeTool("a")]);
    adapter.unregisterAll();
    unsubscribe();
    await adapter.register([fakeTool("b")]); // after unsubscribe — must not be recorded

    expect(statuses[0]).toEqual({ mode: null, count: 0 });
    expect(statuses).toContainEqual({ mode: "polyfill", count: 1 });
    expect(statuses[statuses.length - 1]).toEqual({ mode: "polyfill", count: 0 });
    expect(context.registerTool).toHaveBeenCalledTimes(2); // "a" and "b" both really registered
  });
});

describe("window.__pf test hook (SPEC §6)", () => {
  it('is set when NEXT_PUBLIC_APP_ENV is "test", reflecting live mode and registered names', async () => {
    const adapter = await freshAdapter({
      NEXT_PUBLIC_WEBMCP_MODE: "polyfill",
      NEXT_PUBLIC_APP_ENV: "test",
    });
    await polyfillReady();

    expect(window.__pf?.webmcp).toBeDefined();
    expect(window.__pf?.webmcp?.mode()).toBe(null);
    await adapter.register([fakeTool("get_balance")]);
    expect(window.__pf?.webmcp?.mode()).toBe("polyfill");
    expect(window.__pf?.webmcp?.tools()).toEqual(["get_balance"]);
  });

  it("is not set outside NEXT_PUBLIC_APP_ENV=test", async () => {
    delete window.__pf;
    await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill", NEXT_PUBLIC_APP_ENV: "production" });
    expect(window.__pf).toBeUndefined();
  });
});
