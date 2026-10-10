import { beforeEach, describe, expect, it, vi } from "vitest";
import { REQUEST_LOG_CAPACITY, findViaRequest, recordViaRequest } from "@/src/server/request-log";

const TEST_ENV = { APP_ENV: "test" };

/** The buffer lives on globalThis (proxy and route handlers are separate bundles), so a
 * fresh module import does not clear it — each case starts by dropping the holder. */
beforeEach(() => {
  delete (globalThis as { __pfViaLog?: unknown }).__pfViaLog;
});

describe("recordViaRequest (SPEC-webmcp-tools §2.8)", () => {
  it("US-40 AC3 records an entry that is exactly { requestId, via, method, route } in test", () => {
    recordViaRequest("webmcp", "req-1", "GET", "/api/overview", TEST_ENV);
    expect(findViaRequest("req-1")).toEqual({
      requestId: "req-1",
      via: "webmcp",
      method: "GET",
      route: "/api/overview",
    });
  });

  it.each([null, "", "WebMCP", "webmcp, other", " webmcp", "browser"])(
    "ignores the X-Via value %j — only the exact marker is recorded",
    (via) => {
      recordViaRequest(via, "req-2", "GET", "/api/overview", TEST_ENV);
      expect(findViaRequest("req-2")).toBeUndefined();
    },
  );

  it("writes one JSON line to stdout and keeps nothing outside test", () => {
    const write = vi.fn();
    recordViaRequest("webmcp", "req-3", "GET", "/api/overview", { APP_ENV: "production" }, write);
    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(write.mock.calls[0]![0] as string)).toEqual({
      requestId: "req-3",
      via: "webmcp",
      method: "GET",
      route: "/api/overview",
    });
    expect(findViaRequest("req-3")).toBeUndefined();
  });

  it("writes nothing to stdout in test — the buffer is the record", () => {
    const write = vi.fn();
    recordViaRequest("webmcp", "req-4", "GET", "/api/overview", TEST_ENV, write);
    expect(write).not.toHaveBeenCalled();
  });

  it(`holds at most ${REQUEST_LOG_CAPACITY} entries, evicting the oldest first`, () => {
    for (let i = 0; i <= REQUEST_LOG_CAPACITY; i += 1) {
      recordViaRequest("webmcp", `req-${i}`, "GET", "/api/overview", TEST_ENV);
    }
    expect(findViaRequest("req-0")).toBeUndefined();
    expect(findViaRequest("req-1")).toBeDefined();
    expect(findViaRequest(`req-${REQUEST_LOG_CAPACITY}`)).toBeDefined();
  });

  it("US-40 AC3 records the method as the server received it, so a read and a write on one path differ (SPEC-write-path 2.12)", () => {
    recordViaRequest("webmcp", "req-get", "GET", "/api/pots", TEST_ENV);
    recordViaRequest("webmcp", "req-post", "POST", "/api/pots", TEST_ENV);
    expect(findViaRequest("req-get")?.method).toBe("GET");
    expect(findViaRequest("req-post")?.method).toBe("POST");
  });

  it("finds nothing for an id it never saw", () => {
    expect(findViaRequest("nope")).toBeUndefined();
  });
});
