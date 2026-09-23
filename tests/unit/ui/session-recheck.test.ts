// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { recheckSessionOnRestore, sessionHasEnded } from "@/src/ui/session-recheck";

const answer = (body: unknown) => async () => Response.json(body);

describe("sessionHasEnded (SPEC-auth §2.9)", () => {
  it("is true when the server says the session is gone", async () => {
    await expect(sessionHasEnded(answer({ authenticated: false }))).resolves.toBe(true);
  });

  it("is false while the session lives", async () => {
    await expect(sessionHasEnded(answer({ authenticated: true }))).resolves.toBe(false);
  });

  it("is false when no answer arrives — the next navigation meets the middleware anyway (plan D9)", async () => {
    await expect(
      sessionHasEnded(async () => {
        throw new TypeError("Failed to fetch");
      }),
    ).resolves.toBe(false);
  });

  it("is false for an answer it cannot read", async () => {
    await expect(sessionHasEnded(answer({ authenticated: "no" }))).resolves.toBe(false);
    await expect(sessionHasEnded(async () => new Response("<html>"))).resolves.toBe(false);
  });

  it("asks GET /api/auth/session past the HTTP cache", async () => {
    const fetcher = vi.fn<typeof fetch>(answer({ authenticated: true }));
    await sessionHasEnded(fetcher);
    expect(fetcher).toHaveBeenCalledWith("/api/auth/session", { cache: "no-store" });
  });
});

describe("recheckSessionOnRestore (US-03 AC1)", () => {
  it("leaves for /login when a page restored from the back/forward cache has lost its session", async () => {
    const leave = vi.fn();
    const stop = recheckSessionOnRestore(window, leave, answer({ authenticated: false }));

    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));

    await vi.waitFor(() => expect(leave).toHaveBeenCalledWith("/login"));
    stop();
  });

  it("does not ask on an ordinary page load", () => {
    const fetcher = vi.fn<typeof fetch>(answer({ authenticated: false }));
    const stop = recheckSessionOnRestore(window, vi.fn(), fetcher);

    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));

    expect(fetcher).not.toHaveBeenCalled();
    stop();
  });

  it("stops listening once unsubscribed", () => {
    const fetcher = vi.fn<typeof fetch>(answer({ authenticated: false }));
    recheckSessionOnRestore(window, vi.fn(), fetcher)();

    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));

    expect(fetcher).not.toHaveBeenCalled();
  });
});
