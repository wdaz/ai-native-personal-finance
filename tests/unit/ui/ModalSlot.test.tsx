// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createModalSlot, ModalSlotProvider, useModalSlot } from "@/src/ui/ModalSlot";

afterEach(cleanup);

describe("ModalSlot — one modal at a time (SPEC-ui-kit 2.2; US-40 AC2, NFR-W5)", () => {
  it("two claims in the same tick: one release function and one null", () => {
    const slot = createModalSlot();
    const first = slot.claim();
    const second = slot.claim();
    expect(typeof first).toBe("function");
    expect(second).toBeNull();
  });

  it("released, it can be claimed again; a stale release does not free a later claim", () => {
    const slot = createModalSlot();
    const release = slot.claim();
    release?.();
    const again = slot.claim();
    expect(again).not.toBeNull();
    release?.();
    expect(slot.claim()).toBeNull();
  });

  it("isBusy while a modal is held and while a tracked write is in flight, false after both end", async () => {
    const slot = createModalSlot();
    expect(slot.isBusy()).toBe(false);
    const release = slot.claim();
    expect(slot.isBusy()).toBe(true);
    let finish: (value: string) => void = () => {};
    const write = slot.trackWrite(() => new Promise<string>((resolve) => (finish = resolve)));
    release?.();
    expect(slot.isBusy()).toBe(true);
    finish("done");
    await expect(write).resolves.toBe("done");
    expect(slot.isBusy()).toBe(false);
  });

  it("a failed write is counted out too", async () => {
    const slot = createModalSlot();
    await expect(slot.trackWrite(() => Promise.reject(new Error("x")))).rejects.toThrow("x");
    expect(slot.isBusy()).toBe(false);
  });

  it("the provider gives one slot to the whole page; without it the hook throws", () => {
    const seen: unknown[] = [];
    function Reader() {
      seen.push(useModalSlot());
      return null;
    }
    render(
      <ModalSlotProvider>
        <Reader />
        <Reader />
      </ModalSlotProvider>,
    );
    expect(seen[0]).toBe(seen[1]);
    expect(() => render(<Reader />)).toThrow("ModalSlotProvider");
  });
});
