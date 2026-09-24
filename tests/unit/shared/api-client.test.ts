import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { apiGet } from "@/src/shared/api-client";

const Schema = z.strictObject({ value: z.int() });

function respond(body: unknown, status = 200): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
}

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiGet", () => {
  it("returns the parsed body and sends the path, headers and signal to fetch", async () => {
    const fetchMock = stubFetch(async () => respond({ value: 7 }));
    const controller = new AbortController();
    const outcome = await apiGet("/api/thing", Schema, {
      headers: { "X-Via": "webmcp" },
      signal: controller.signal,
    });
    expect(outcome).toEqual({ ok: true, data: { value: 7 } });
    expect(fetchMock).toHaveBeenCalledWith("/api/thing", {
      method: "GET",
      headers: { "X-Via": "webmcp" },
      signal: controller.signal,
      credentials: "same-origin",
    });
  });

  it("tags a 2xx body that fails the schema as invalid_response", async () => {
    stubFetch(async () => respond({ value: "seven" }));
    expect(await apiGet("/api/thing", Schema)).toEqual({
      ok: false,
      kind: "invalid_response",
      status: 200,
    });
  });

  it("tags a 2xx body that is not JSON (a proxy's HTML page) as invalid_response", async () => {
    stubFetch(async () => respond("<html>bad gateway</html>"));
    expect(await apiGet("/api/thing", Schema)).toEqual({
      ok: false,
      kind: "invalid_response",
      status: 200,
    });
  });

  it("returns the error envelope of a non-2xx answer", async () => {
    stubFetch(async () =>
      respond({ error: "unauthenticated", message: "Log in to continue" }, 401),
    );
    expect(await apiGet("/api/thing", Schema)).toEqual({
      ok: false,
      kind: "http",
      status: 401,
      error: { error: "unauthenticated", message: "Log in to continue" },
    });
  });

  it("returns error: null for a non-2xx answer that is not an envelope", async () => {
    stubFetch(async () => respond("<html>oops</html>", 502));
    expect(await apiGet("/api/thing", Schema)).toEqual({
      ok: false,
      kind: "http",
      status: 502,
      error: null,
    });
  });

  it("tags a rejected fetch as network", async () => {
    stubFetch(async () => Promise.reject(new TypeError("Failed to fetch")));
    expect(await apiGet("/api/thing", Schema)).toEqual({ ok: false, kind: "network" });
  });

  it("tags an AbortError from fetch as aborted", async () => {
    stubFetch(async () => Promise.reject(new DOMException("aborted", "AbortError")));
    expect(await apiGet("/api/thing", Schema)).toEqual({ ok: false, kind: "aborted" });
  });

  it("tags an abort while the body is being read as aborted, not invalid_response", async () => {
    const response = respond({ value: 1 });
    vi.spyOn(response, "json").mockRejectedValue(new DOMException("aborted", "AbortError"));
    stubFetch(async () => response);
    expect(await apiGet("/api/thing", Schema)).toEqual({ ok: false, kind: "aborted" });
  });
});
