import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { apiGet, apiSend } from "@/src/shared/api-client";

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

describe("apiSend — the write client (SPEC-write-path 2.11 (2), 7.1)", () => {
  it("sends a JSON body with Content-Type: application/json, the X-Via marker it is given and the signal", async () => {
    const fetchMock = stubFetch(async () => respond({ value: 1 }, 201));
    const controller = new AbortController();
    const outcome = await apiSend("POST", "/api/pots", Schema, {
      body: { name: "Holiday" },
      headers: { "X-Via": "webmcp" },
      signal: controller.signal,
    });
    expect(outcome).toEqual({ ok: true, data: { value: 1 } });
    expect(fetchMock).toHaveBeenCalledWith("/api/pots", {
      method: "POST",
      headers: { "X-Via": "webmcp", "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Holiday" }),
      signal: controller.signal,
      credentials: "same-origin",
    });
  });

  it("always sends the method upper-case (Node answers `patch` with 400, 7.3 v1.0.3)", async () => {
    const fetchMock = stubFetch(async () => respond({ value: 1 }));
    await apiSend("patch" as "PATCH", "/api/pots/1", Schema, { body: {} });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pots/1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("reads a 204 as success with no data, and a DELETE sends no body and no content type", async () => {
    const fetchMock = stubFetch(async () => new Response(null, { status: 204 }));
    expect(await apiSend("DELETE", "/api/pots/1", Schema)).toEqual({ ok: true, data: null });
    expect(fetchMock).toHaveBeenCalledWith("/api/pots/1", {
      method: "DELETE",
      headers: undefined,
      body: undefined,
      signal: undefined,
      credentials: "same-origin",
    });
  });

  it("returns a 400's envelope with its issues, and never throws on a network failure", async () => {
    const issues = [{ path: ["name"], code: "taken" }];
    stubFetch(async () => respond({ error: "validation", issues }, 400));
    expect(await apiSend("POST", "/api/pots", Schema, { body: {} })).toEqual({
      ok: false,
      kind: "http",
      status: 400,
      error: { error: "validation", issues },
    });
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await apiSend("POST", "/api/pots", Schema, { body: {} })).toEqual({
      ok: false,
      kind: "network",
    });
  });
});
