// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BANNER_STORAGE_KEY,
  readBannerDismissed,
  subscribeBanner,
  writeBannerDismissed,
} from "@/src/ui/banner-state";

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("banner-state (SPEC-app-shell §2.6)", () => {
  it("is not dismissed while pf.banner is absent", () => {
    expect(readBannerDismissed()).toBe(false);
  });

  it("dismissing writes pf.banner = dismissed to sessionStorage and tells subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeBanner(listener);
    writeBannerDismissed();
    expect(sessionStorage.getItem(BANNER_STORAGE_KEY)).toBe("dismissed");
    expect(readBannerDismissed()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    writeBannerDismissed();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reads a dismissal made earlier in this tab (a reload keeps sessionStorage)", () => {
    sessionStorage.setItem(BANNER_STORAGE_KEY, "dismissed");
    expect(readBannerDismissed()).toBe(true);
  });

  it("storage that throws on read shows the banner rather than breaking the page", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(readBannerDismissed()).toBe(false);
  });
});

describe("banner-state when storage refuses writes", () => {
  it("still hides the banner for the rest of the page", async () => {
    vi.resetModules();
    const state = await import("@/src/ui/banner-state");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(() => state.writeBannerDismissed()).not.toThrow();
    expect(state.readBannerDismissed()).toBe(true);
  });
});
