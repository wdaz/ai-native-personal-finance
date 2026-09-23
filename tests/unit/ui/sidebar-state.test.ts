// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SIDEBAR_STORAGE_KEY,
  readSidebarCollapsed,
  subscribeSidebar,
  writeSidebarCollapsed,
} from "@/src/ui/sidebar-state";

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("sidebar-state (US-35 AC1, SPEC-app-shell §2.3)", () => {
  it("stores 'collapsed' while minimised and removes the key when expanded", () => {
    expect(SIDEBAR_STORAGE_KEY).toBe("pf.sidebar");
    writeSidebarCollapsed(true);
    expect(sessionStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("collapsed");
    expect(readSidebarCollapsed()).toBe(true);

    writeSidebarCollapsed(false);
    expect(sessionStorage.getItem(SIDEBAR_STORAGE_KEY)).toBeNull();
    expect(readSidebarCollapsed()).toBe(false);
  });

  it("reads only the exact value 'collapsed' as minimised", () => {
    sessionStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
    expect(readSidebarCollapsed()).toBe(false);
  });

  it("tells every subscriber about a write, until it unsubscribes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSidebar(listener);
    writeSidebarCollapsed(true);
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    writeSidebarCollapsed(false);
    expect(listener).toHaveBeenCalledOnce();
  });

  // Last in the file: once storage has refused a write, the module keeps the state in memory
  // for the rest of the page (Vitest gives each test file its own module instance).
  it("keeps working from memory when sessionStorage refuses a write (a privacy mode, a full store)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    });

    writeSidebarCollapsed(true);
    expect(readSidebarCollapsed()).toBe(true);
    writeSidebarCollapsed(false);
    expect(readSidebarCollapsed()).toBe(false);
  });
});
