// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionStore } from "@/src/ui/session-store";

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("createSessionStore (SPEC-app-shell §2.3, §2.6)", () => {
  it("reads null while the key is absent, a written value, and null again once removed", () => {
    const store = createSessionStore("pf.test");
    expect(store.read()).toBeNull();
    store.write("a");
    expect(sessionStorage.getItem("pf.test")).toBe("a");
    expect(store.read()).toBe("a");
    store.write(null);
    expect(sessionStorage.getItem("pf.test")).toBeNull();
    expect(store.read()).toBeNull();
  });

  it("reads what the tab stored before (a reload keeps sessionStorage)", () => {
    sessionStorage.setItem("pf.test", "earlier");
    expect(createSessionStore("pf.test").read()).toBe("earlier");
  });

  it("tells every subscriber about a write, until it unsubscribes", () => {
    const store = createSessionStore("pf.test");
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.write("a");
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    store.write("b");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("keeps two keys apart", () => {
    const one = createSessionStore("pf.one");
    const two = createSessionStore("pf.two");
    const listener = vi.fn();
    two.subscribe(listener);
    one.write("a");
    expect(two.read()).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });

  it("storage that throws on read: null, then memory for the rest of the page", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const store = createSessionStore("pf.test");
    expect(store.read()).toBeNull();
    store.write("a");
    expect(store.read()).toBe("a");
  });

  it("storage that refuses a write: the value lives in memory, and nothing throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const store = createSessionStore("pf.test");
    expect(() => store.write("a")).not.toThrow();
    expect(store.read()).toBe("a");
    store.write(null);
    expect(store.read()).toBeNull();
  });
});
