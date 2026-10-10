import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteResultOf,
  deleteToolResult,
  hasDeleteHandler,
  NO_DIALOG_MESSAGE,
  onDeleteRequest,
  requestDelete,
  runDeleteTool,
  type DeleteResult,
} from "@/src/webmcp/bus";
import { DEFAULT_TOOL_MESSAGE, TOOL_ERROR_CODES } from "@/src/webmcp/tool-result";

const ID = "6f1c2b9e-3a4d-4e5f-8a6b-7c8d9e0f1a2b";
let unsubscribers: (() => void)[] = [];
const subscribe = (kind: "budget" | "pot", handler: Parameters<typeof onDeleteRequest>[1]) => {
  const off = onDeleteRequest(kind, handler);
  unsubscribers.push(off);
  return off;
};
afterEach(() => {
  for (const off of unsubscribers) off();
  unsubscribers = [];
});

describe("the delete bus (SPEC-ui-kit 2.3; US-40 AC2, ADR-0004)", () => {
  it("with no handler, a request is cancelled at once and nothing is shown (item 1)", async () => {
    expect(hasDeleteHandler("budget")).toBe(false);
    await expect(requestDelete("budget", ID)).resolves.toBe("cancelled");
  });

  it.each(["busy", "not_found", "deleted", "cancelled"] as const)(
    "returns the handler's %s unchanged (items 2-4)",
    async (result) => {
      subscribe("pot", () => Promise.resolve(result));
      await expect(requestDelete("pot", ID)).resolves.toBe(result);
    },
  );

  it("one handler per kind: the latest subscription wins, and the kinds are separate", async () => {
    subscribe("budget", () => Promise.resolve("busy"));
    subscribe("budget", () => Promise.resolve("deleted"));
    await expect(requestDelete("budget", ID)).resolves.toBe("deleted");
    await expect(requestDelete("pot", ID)).resolves.toBe("cancelled");
  });

  it("an unsubscribe removes only its own handler", async () => {
    const offFirst = subscribe("budget", () => Promise.resolve("busy"));
    subscribe("budget", () => Promise.resolve("deleted"));
    offFirst();
    await expect(requestDelete("budget", ID)).resolves.toBe("deleted");
  });

  it("a signal already aborted is cancelled with no handler call (item 6)", async () => {
    const handler = vi.fn(() => Promise.resolve<DeleteResult>("deleted"));
    subscribe("pot", handler);
    const controller = new AbortController();
    controller.abort();
    await expect(requestDelete("pot", ID, controller.signal)).resolves.toBe("cancelled");
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the id and the signal through to the handler", async () => {
    const handler = vi.fn(() => Promise.resolve<DeleteResult>("deleted"));
    subscribe("pot", handler);
    const { signal } = new AbortController();
    await requestDelete("pot", ID, signal);
    expect(handler).toHaveBeenCalledWith(ID, signal);
  });
});

describe("a delete tool's answer (SPEC-ui-kit 2.3 items 4 and 7; write-path 2.11 (4); US-40 AC2)", () => {
  it("adds busy to TOOL_ERROR_CODES with an agent-read fallback, beside forbidden", () => {
    expect(TOOL_ERROR_CODES).toContain("busy");
    expect(TOOL_ERROR_CODES).toContain("forbidden");
    expect(DEFAULT_TOOL_MESSAGE.busy.length).toBeGreaterThan(0);
  });

  it("deleted is { deleted: true }, with no currency or unit", () => {
    const result = deleteToolResult("deleted");
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ deleted: true });
    expect(JSON.parse(result.content[0]?.text ?? "")).toEqual({ deleted: true });
  });

  it.each([
    "cancelled",
    "busy",
    "not_found",
    "conflict",
    "unauthenticated",
    "rate_limited",
    "forbidden",
    "validation",
    "server_error",
  ] as const)("%s is a structured error with that code", (code) => {
    expect(deleteToolResult(code)).toMatchObject({
      isError: true,
      code,
      message: DEFAULT_TOOL_MESSAGE[code],
    });
  });

  it("a request with no page dialog says so, still as cancelled (item 1)", async () => {
    await expect(runDeleteTool("budget", ID)).resolves.toMatchObject({
      isError: true,
      code: "cancelled",
      message: NO_DIALOG_MESSAGE,
    });
  });

  it("runs the request through the page's handler", async () => {
    subscribe("budget", () => Promise.resolve("busy"));
    await expect(runDeleteTool("budget", ID)).resolves.toMatchObject({ code: "busy" });
  });

  it("maps a confirmed delete's answer to its result (item 4)", () => {
    expect(deleteResultOf({ kind: "ok", data: null })).toBe("deleted");
    expect(deleteResultOf({ kind: "gone" })).toBe("not_found");
    expect(deleteResultOf({ kind: "reset" })).toBe("conflict");
    expect(deleteResultOf({ kind: "session" })).toBe("unauthenticated");
    expect(deleteResultOf({ kind: "validation", issues: [] })).toBe("validation");
    for (const code of ["rate_limited", "forbidden", "validation", "server_error"] as const) {
      expect(deleteResultOf({ kind: "failed", code, message: "m" })).toBe(code);
    }
  });
});
