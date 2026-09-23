// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BANNER_STORAGE_KEY,
  isBannerDismissed,
  subscribeBanner,
  writeBannerDismissed,
} from "@/src/ui/banner-state";

const RESET = "2026-09-12T03:00:00.000Z";
const LATER = "2026-09-22T03:00:00.000Z";

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("banner-state (SPEC-app-shell §2.6)", () => {
  it("is not dismissed while pf.banner is absent", () => {
    expect(isBannerDismissed(RESET)).toBe(false);
  });

  it("dismissing stores the dismissed reset's date in sessionStorage and tells subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeBanner(listener);
    writeBannerDismissed(RESET);
    expect(sessionStorage.getItem(BANNER_STORAGE_KEY)).toBe(RESET);
    expect(isBannerDismissed(RESET)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    writeBannerDismissed(RESET);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("PR #20 review finding 4: a dismissal does not outlive the reset it was for", () => {
    writeBannerDismissed(RESET);
    expect(isBannerDismissed(LATER)).toBe(false);
  });

  it("reads a dismissal made earlier in this tab (a reload keeps sessionStorage)", () => {
    sessionStorage.setItem(BANNER_STORAGE_KEY, RESET);
    expect(isBannerDismissed(RESET)).toBe(true);
  });

  it("storage that throws on read shows the banner rather than breaking the page", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(isBannerDismissed(RESET)).toBe(false);
  });
});

describe("banner-state when storage refuses writes", () => {
  it("still hides the banner for this reset, for the rest of the page", async () => {
    vi.resetModules();
    const state = await import("@/src/ui/banner-state");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(() => state.writeBannerDismissed(RESET)).not.toThrow();
    expect(state.isBannerDismissed(RESET)).toBe(true);
    expect(state.isBannerDismissed(LATER)).toBe(false);
  });
});
