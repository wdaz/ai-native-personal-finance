import { describe, expect, it } from "vitest";
import type { ApiOutcome } from "@/src/shared/api-client";
import {
  DEFAULT_TOOL_MESSAGE,
  fromApiOutcome,
  toolError,
  toolSuccess,
} from "@/src/webmcp/tool-result";

const http = (status: number, error: unknown = null): ApiOutcome<unknown> => ({
  ok: false,
  kind: "http",
  status,
  error: error as never,
});
const unreachable = () => {
  throw new Error("onSuccess must not run on a failed outcome");
};

describe("toolSuccess (SPEC-webmcp-tools §2.6)", () => {
  it("adds { currency, unit } at the top level and mirrors the data in the text content", () => {
    const result = toolSuccess({ current: 1, income: 2, expenses: 3 });
    expect(result.structuredContent).toEqual({
      current: 1,
      income: 2,
      expenses: 3,
      currency: "USD",
      unit: "cents",
    });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0]!.text)).toEqual(result.structuredContent);
  });

  it("does not mutate what it is given", () => {
    const data = { current: 1 };
    toolSuccess(data);
    expect(data).toEqual({ current: 1 });
  });
});

describe("toolError (SPEC-webmcp-tools §2.6)", () => {
  it("is isError with a code, a message and the message as text", () => {
    expect(toolError("not_found", "Gone")).toEqual({
      isError: true,
      code: "not_found",
      message: "Gone",
      content: [{ type: "text", text: "Gone" }],
    });
  });

  it("carries issues and retryAfter only when given", () => {
    const issues = [{ path: ["a"], code: "required" as const }];
    expect(toolError("validation", "x", { issues, retryAfter: 3 })).toMatchObject({
      issues,
      retryAfter: 3,
    });
    expect("issues" in toolError("validation", "x", { issues: undefined })).toBe(false);
  });
});

describe("fromApiOutcome — the SPEC §2.5 status mapping", () => {
  it("passes the data of an ok outcome to onSuccess and returns its result", () => {
    const result = fromApiOutcome({ ok: true, data: 5 }, (n) => toolSuccess({ n }));
    expect(result.structuredContent).toMatchObject({ n: 5 });
  });

  it.each([
    [400, "validation"],
    [401, "unauthenticated"],
    [404, "not_found"],
    [409, "conflict"],
    [429, "rate_limited"],
    [500, "server_error"],
    [502, "server_error"],
    [418, "server_error"],
  ] as const)(
    "maps HTTP %i to %s, with the default message when the body has none",
    (status, code) => {
      const result = fromApiOutcome(http(status), unreachable);
      expect(result).toMatchObject({ isError: true, code, message: DEFAULT_TOOL_MESSAGE[code] });
      expect(result.content).toEqual([{ type: "text", text: DEFAULT_TOOL_MESSAGE[code] }]);
      expect(result.structuredContent).toBeUndefined();
    },
  );

  it("uses the envelope's own message when it has one", () => {
    const result = fromApiOutcome(
      http(401, { error: "unauthenticated", message: "Log in to continue" }),
      unreachable,
    );
    expect(result).toMatchObject({ code: "unauthenticated", message: "Log in to continue" });
  });

  it("copies a 400 envelope's issues and a 429 envelope's retryAfter", () => {
    const issues = [{ path: ["name"], code: "too_long" }];
    expect(fromApiOutcome(http(400, { error: "validation", issues }), unreachable)).toMatchObject({
      code: "validation",
      issues,
    });
    expect(
      fromApiOutcome(
        http(429, { error: "rate_limited", message: "Slow down", retryAfter: 30 }),
        unreachable,
      ),
    ).toMatchObject({ code: "rate_limited", retryAfter: 30 });
  });

  it("maps aborted to cancelled, and network and invalid_response to server_error", () => {
    expect(fromApiOutcome({ ok: false, kind: "aborted" }, unreachable).code).toBe("cancelled");
    expect(fromApiOutcome({ ok: false, kind: "network" }, unreachable).code).toBe("server_error");
    expect(
      fromApiOutcome({ ok: false, kind: "invalid_response", status: 200 }, unreachable),
    ).toMatchObject({ code: "server_error", isError: true });
  });
});
