import { describe, expect, it, vi } from "vitest";
import { AFTER_FAILED_LOGOUT, AFTER_LOGOUT, logOut } from "@/src/ui/logout";

describe("logOut (SPEC-auth §2.7, US-03 AC1–AC2)", () => {
  it("posts to /api/auth/logout under a timeout and returns /login when the server clears the session", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    const log = vi.fn();

    await expect(logOut(fetcher, log)).resolves.toBe(AFTER_LOGOUT);

    expect(AFTER_LOGOUT).toBe("/login");
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe("/api/auth/logout");
    expect(init?.method).toBe("POST");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(log).not.toHaveBeenCalled();
  });

  it("completes client-side through the fallback, and logs, when the server answers an error", async () => {
    const log = vi.fn();

    await expect(logOut(async () => new Response(null, { status: 500 }), log)).resolves.toBe(
      AFTER_FAILED_LOGOUT,
    );

    expect(AFTER_FAILED_LOGOUT).toBe("/login?reason=logout");
    expect(log).toHaveBeenCalledOnce();
    expect(String(log.mock.calls[0]?.[0])).toMatch(/^\[logout\].*500/);
  });

  it("completes client-side through the fallback, and logs, when no answer arrives", async () => {
    const failure = new TypeError("Failed to fetch");
    const log = vi.fn();

    await expect(
      logOut(async () => {
        throw failure;
      }, log),
    ).resolves.toBe(AFTER_FAILED_LOGOUT);

    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^\[logout\]/), failure);
  });
});
