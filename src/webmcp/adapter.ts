import { WebMcpModeSchema } from "@/src/shared/schemas";
import type { AdapterMode, ModelContext, ToolDefinition } from "./types";

export type { AdapterMode };

export interface AdapterStatus {
  mode: AdapterMode | null;
  count: number;
}

type StatusListener = (status: AdapterStatus) => void;

/**
 * `WEBMCP_MODE` is the documented knob, read once client-side as `NEXT_PUBLIC_WEBMCP_MODE`
 * (`next.config.ts`, T-08). Empty/unset → "polyfill", the same rule `configuredWebmcpMode`
 * applies server-side — `tests/unit/next-config.test.ts` already pins the two agreeing.
 */
const configuredMode = WebMcpModeSchema.catch("polyfill").parse(
  process.env.NEXT_PUBLIC_WEBMCP_MODE,
);

let resolvedMode: AdapterMode | null = configuredMode === "off" ? "unavailable" : null;
let registeredNames: string[] = [];
let generation: AbortController | null = null;
let detection: Promise<ModelContext | null> | null = null;
let registrationFailed = false;
const listeners = new Set<StatusListener>();

/** `SecurityError` for `new DOMException("", "SecurityError")`, `Error: duplicate name` for an Error. */
function describeReason(reason: unknown): string {
  return reason instanceof Error
    ? [reason.name, reason.message].filter(Boolean).join(": ")
    : String(reason);
}

function clearFailure() {
  registrationFailed = false;
  delete document.documentElement.dataset.webmcpError;
}

function status(): AdapterStatus {
  return { mode: registrationFailed ? "unavailable" : resolvedMode, count: registeredNames.length };
}

function notify() {
  for (const listener of listeners) listener(status());
}

/** SPEC §2.2: the adapter and polyfill chunks load after hydration, never blocking first paint. */
function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve(), { timeout: 2000 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

async function detect(): Promise<ModelContext | null> {
  if ("modelContext" in document) {
    resolvedMode = "native";
    notify();
    return document.modelContext ?? null;
  }
  try {
    const { initializeWebMCPPolyfill } = await import("@mcp-b/webmcp-polyfill");
    initializeWebMCPPolyfill();
    const context = document.modelContext ?? null;
    resolvedMode = context ? "polyfill" : "unavailable";
    notify();
    return context;
  } catch (error) {
    console.warn("[webmcp] polyfill failed to load; agent tools are unavailable", error);
    resolvedMode = "unavailable";
    notify();
    return null;
  }
}

/**
 * Native/polyfill/off detection (SPEC §2.2). Memoized: every caller — the provider's own
 * eager check and every page's `register()` — shares one detection run and one polyfill
 * import. `off` never imports anything and resolves synchronously to `null`.
 */
export function getModelContext(): Promise<ModelContext | null> {
  if (configuredMode === "off") return Promise.resolve(null);
  detection ??= idle().then(detect);
  return detection;
}

export function mode(): AdapterMode | null {
  return registrationFailed ? "unavailable" : resolvedMode;
}

/** The current generation's registered tool names — also backs the `window.__pf` test hook. */
export function registeredTools(): string[] {
  return [...registeredNames];
}

export function onStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  listener(status());
  return () => listeners.delete(listener);
}

function dispatchToolchange(context: ModelContext) {
  document.dispatchEvent(new Event("toolchange"));
  if (context instanceof EventTarget) context.dispatchEvent(new Event("toolchange"));
}

/**
 * Registers one page's tools (SPEC §2.2–2.3). Each call starts a fresh generation: its own
 * `AbortController` both cancels a still-pending prior generation (plan D2 — a `register()`
 * without an intervening `unregisterAll()`, e.g. two effects racing) and, once registered, is
 * what `unregisterAll()` aborts to remove them — the installed runtime ties a tool's whole
 * lifetime to the signal passed at registration (plan Q1); there is no name-based unregister.
 */
export async function register(tools: ToolDefinition[]): Promise<void> {
  generation?.abort();
  const controller = new AbortController();
  generation = controller;
  clearFailure();

  const context = await getModelContext();
  if (context === null || controller.signal.aborted) return;

  // `defineTool` (T-11) already rejects a malformed descriptor at definition time (SPEC §2.4);
  // a runtime `registerTool` rejection here is defensive only (e.g. a genuine duplicate name),
  // so one tool's failure is caught per-tool rather than failing the whole batch — but it also
  // must not be counted as registered (Review Focus, adapter.test.ts).
  const outcomes = await Promise.allSettled(
    tools.map((tool) => context.registerTool(tool, { signal: controller.signal })),
  );
  if (controller.signal.aborted) return; // a superseded generation: its rejections are on purpose, stay silent

  const rejected = outcomes.flatMap((outcome, index) =>
    outcome.status === "rejected"
      ? [{ name: tools[index]?.name ?? "?", reason: outcome.reason as unknown }]
      : [],
  );
  for (const { name, reason } of rejected) {
    console.warn(`[webmcp] could not register tool "${name}"`, reason);
  }
  registeredNames = tools
    .filter((_, index) => outcomes[index]?.status === "fulfilled")
    .map((tool) => tool.name);
  if (rejected.length > 0) {
    document.documentElement.dataset.webmcpError = rejected
      .map(({ name, reason }) => `${name}: ${describeReason(reason)}`)
      .join("; ");
  }
  registrationFailed = tools.length > 0 && registeredNames.length === 0;
  document.documentElement.dataset.webmcp = "ready";
  dispatchToolchange(context);
  notify();
}

/** Cancels any pending registration and removes every tool of the current generation. */
export function unregisterAll(): void {
  generation?.abort();
  generation = null;
  registeredNames = [];
  delete document.documentElement.dataset.webmcp;
  clearFailure();
  notify();
}

// SPEC §6: a test-only hook, set once when this module first loads client-side. Guarded by
// `typeof window` — Next.js server-renders "use client" modules too, where `window` is
// undefined; the guard keeps this an SSR no-op rather than a crash.
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_APP_ENV === "test") {
  window.__pf = { ...window.__pf, webmcp: { mode, tools: registeredTools } };
}
