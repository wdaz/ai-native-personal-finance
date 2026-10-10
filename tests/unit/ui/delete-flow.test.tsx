// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeleteFlow, type DeletableRecord } from "@/app/(app)/_write/use-delete-flow";
import { ConfirmDeleteDialog } from "@/src/ui/ConfirmDeleteDialog";
import { MAIN_CONTENT_ID } from "@/src/ui/main-content";
import { ModalSlotProvider } from "@/src/ui/ModalSlot";
import { hasDeleteHandler, requestDelete } from "@/src/webmcp/bus";

vi.mock("@/src/ui/reload", () => ({ reloadPage: vi.fn() }));

/**
 * SPEC-ui-kit §7, "the dialog with the bus": the page's join (T-22 plan D1) of the dialog and
 * `src/webmcp/bus.ts` — what a person's "Delete" and a tool's `requestDelete` do, and what the
 * tool is told (2.3 items 1–5; US-17 AC1–AC3, US-24 AC1, AC2, US-25 AC2).
 */
const RECORDS: DeletableRecord[] = [
  { id: "p1", name: "Savings" },
  { id: "p2", name: "Gift" },
];

function Pots({ onGone = () => {} }: { onGone?: (id: string) => void }) {
  const [records, setRecords] = useState(RECORDS);
  const { dialog, openFor } = useDeleteFlow({
    kind: "pot",
    records,
    path: (id) => `/api/pots/${id}`,
    onDeleted: (id) => setRecords((list) => list.filter((r) => r.id !== id)),
    onGone,
  });
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1}>
      {records.map((r) => (
        <button key={r.id} type="button" onClick={(e) => openFor(r.id, e.currentTarget)}>
          {`Delete ${r.name}`}
        </button>
      ))}
      <ConfirmDeleteDialog {...dialog} />
    </main>
  );
}

const page = (onGone?: (id: string) => void) =>
  render(
    <ModalSlotProvider>
      <Pots onGone={onGone} />
    </ModalSlotProvider>,
  );

const fetchMock = vi.fn<typeof fetch>();
const respond = (status: number, body?: unknown) =>
  fetchMock.mockResolvedValueOnce(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
const confirm = () => screen.getByRole("button", { name: "Yes, Confirm Deletion" });
const goBack = () => screen.getByRole("button", { name: "No, Go Back" });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("the delete dialog with the bus (SPEC-ui-kit 2.3; US-17, US-24, US-25)", () => {
  it("a person's Delete: the dialog names the record; confirm sends DELETE without X-Via, removes the row and focuses <main>", async () => {
    page();
    fireEvent.click(screen.getByRole("button", { name: "Delete Savings" }));
    expect(screen.getByRole("dialog", { name: "Delete ‘Savings’?" })).toBeTruthy();
    respond(204);
    await act(async () => fireEvent.click(confirm()));
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/pots/p1");
    expect(init?.method).toBe("DELETE");
    expect(init?.headers).toBeUndefined();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete Savings" })).toBeNull();
    expect(document.activeElement?.id).toBe(MAIN_CONTENT_ID);
  });

  it("No, Go Back returns focus to the opener and sends nothing", () => {
    page();
    const opener = screen.getByRole("button", { name: "Delete Gift" });
    fireEvent.click(opener);
    fireEvent.click(goBack());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(opener);
  });

  it("a tool's request opens the same dialog; confirm sends X-Via: webmcp and the tool is told deleted", async () => {
    page();
    expect(hasDeleteHandler("pot")).toBe(true);
    let result: Promise<string> = Promise.resolve("");
    act(() => {
      result = requestDelete("pot", "p2");
    });
    expect(screen.getByRole("dialog", { name: "Delete ‘Gift’?" })).toBeTruthy();
    respond(204);
    await act(async () => fireEvent.click(confirm()));
    expect(await result).toBe("deleted");
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ "X-Via": "webmcp" });
  });

  it("a tool's request is cancelled by No, Go Back", async () => {
    page();
    let result: Promise<string> = Promise.resolve("");
    act(() => {
      result = requestDelete("pot", "p1");
    });
    fireEvent.click(goBack());
    expect(await result).toBe("cancelled");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("an id the page does not show is not_found, and nothing opens", async () => {
    page();
    let result: Promise<string> = Promise.resolve("");
    act(() => {
      result = requestDelete("pot", "nope");
    });
    expect(await result).toBe("not_found");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a second request while a dialog is open is busy (2.3 item 2)", async () => {
    page();
    let second: Promise<string> = Promise.resolve("");
    act(() => {
      void requestDelete("pot", "p1");
      second = requestDelete("pot", "p2");
    });
    expect(await second).toBe("busy");
    expect(screen.getByRole("dialog", { name: "Delete ‘Savings’?" })).toBeTruthy();
  });

  it("an abort before the confirm closes the dialog and the tool is told cancelled", async () => {
    page();
    const controller = new AbortController();
    let result: Promise<string> = Promise.resolve("");
    act(() => {
      result = requestDelete("pot", "p1", controller.signal);
    });
    act(() => controller.abort());
    expect(await result).toBe("cancelled");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a 404 tells the page (notice and refresh) and the tool not_found", async () => {
    const onGone = vi.fn();
    page(onGone);
    let result: Promise<string> = Promise.resolve("");
    act(() => {
      result = requestDelete("pot", "p1");
    });
    respond(404, { error: "Not found" });
    await act(async () => fireEvent.click(confirm()));
    expect(await result).toBe("not_found");
    expect(onGone).toHaveBeenCalledWith("p1");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a 500 keeps the dialog open with its message; the tool waits for the person's next step", async () => {
    page();
    let settled = false;
    act(() => {
      void requestDelete("pot", "p1").then(() => (settled = true));
    });
    respond(500, { error: "x" });
    await act(async () => fireEvent.click(confirm()));
    expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Try again");
    expect(settled).toBe(false);
  });

  it("unmounting before the confirm cancels the tool and frees the slot", async () => {
    const view = page();
    let result: Promise<string> = Promise.resolve("");
    act(() => {
      result = requestDelete("pot", "p1");
    });
    view.unmount();
    expect(await result).toBe("cancelled");
    expect(hasDeleteHandler("pot")).toBe(false);
  });

  it.each([
    [429, "rate_limited"],
    [500, "server_error"],
    [204, "deleted"],
  ])(
    "unmounting after the confirm: a %i still reaches the tool as %s (2.3 item 4)",
    async (status, expected) => {
      const view = page();
      let result: Promise<string> = Promise.resolve("");
      act(() => {
        result = requestDelete("pot", "p1");
      });
      let finish: (r: Response) => void = () => {};
      fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (finish = r)));
      fireEvent.click(confirm());
      view.unmount();
      finish(new Response(status === 204 ? null : JSON.stringify({ error: "x" }), { status }));
      expect(await result).toBe(expected);
    },
  );

  it("an abort after the confirm: the request's answer is the result, even a failure; the dialog stays for the person", async () => {
    page();
    const controller = new AbortController();
    let result: Promise<string> = Promise.resolve("");
    act(() => {
      result = requestDelete("pot", "p1", controller.signal);
    });
    let finish: (r: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (finish = r)));
    fireEvent.click(confirm());
    act(() => controller.abort());
    expect(screen.getByRole("dialog")).toBeTruthy();
    await act(async () => finish(new Response(JSON.stringify({ error: "x" }), { status: 500 })));
    expect(await result).toBe("server_error");
    expect(screen.getByRole("alert").textContent).toBe("Something went wrong. Try again");
  });

  it("a request made while a person's dialog is already open is busy, and that dialog stays", async () => {
    page();
    fireEvent.click(screen.getByRole("button", { name: "Delete Gift" }));
    let result: Promise<string> = Promise.resolve("");
    act(() => {
      result = requestDelete("pot", "p1");
    });
    expect(await result).toBe("busy");
    expect(screen.getByRole("dialog", { name: "Delete \u2018Gift\u2019?" })).toBeTruthy();
  });
});
