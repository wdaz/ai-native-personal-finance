// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import { writeAnswer, type WriteAnswer } from "@/src/shared/write-feedback";
import { ConfirmDeleteDialog, type DeleteDone } from "@/src/ui/ConfirmDeleteDialog";
import { MAIN_CONTENT_ID } from "@/src/ui/main-content";

vi.mock("@/src/ui/reload", () => ({ reloadPage: vi.fn() }));
const { reloadPage } = await import("@/src/ui/reload");

beforeEach(() => vi.mocked(reloadPage).mockClear());
afterEach(cleanup);

/** A deferred answer, so the pending state can be looked at before it arrives. */
function deferred() {
  let resolve: (answer: WriteAnswer<unknown>) => void = () => {};
  const promise = new Promise<WriteAnswer<unknown>>((r) => (resolve = r));
  return { promise, resolve };
}

function Page({
  onConfirm,
  onCancel = () => {},
  onDone = () => {},
}: {
  onConfirm: () => Promise<WriteAnswer<unknown>>;
  onCancel?: () => void;
  onDone?: (answer: DeleteDone) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1}>
      <ConfirmDeleteDialog
        open={open}
        title={COPY.deleteTitle("Savings")}
        description={COPY.deletePotConfirm}
        onCancel={() => {
          onCancel();
          setOpen(false);
        }}
        onConfirm={onConfirm}
        onDone={(answer) => {
          onDone(answer);
          if (answer.kind === "ok" || answer.kind === "gone") setOpen(false);
        }}
      />
    </main>
  );
}

const confirmButton = () =>
  screen.getByRole("button", { name: /^(Yes, Confirm Deletion|Deleting…)$/ });
const goBack = () => screen.getByRole("button", { name: "No, Go Back" });
const alert = () => screen.getByRole("alert", { hidden: true });

const http = (status: number, extra: Record<string, unknown> = {}) =>
  writeAnswer({ ok: false, kind: "http", status, error: { error: "x", ...extra } } as never);

describe("ConfirmDeleteDialog (SPEC-ui-kit 2.3; US-17 AC1, AC3, US-24 AC1, AC2)", () => {
  it("shows the title with curly quotes and the description; opens on 'No, Go Back' (UK-Q6 (a))", () => {
    render(<Page onConfirm={() => Promise.resolve({ kind: "ok", data: null })} />);
    expect(screen.getByRole("dialog", { name: "Delete ‘Savings’?" })).toBeTruthy();
    expect(screen.getByText(COPY.deletePotConfirm)).toBeTruthy();
    expect(document.activeElement).toBe(goBack());
  });

  it.each([
    ["No, Go Back", () => fireEvent.click(goBack())],
    ["Escape", () => fireEvent.keyDown(goBack(), { key: "Escape" })],
    ["the close button", () => fireEvent.click(screen.getByRole("button", { name: "Close" }))],
    [
      "the backdrop",
      () => {
        const layer = screen.getByRole("dialog").parentElement as HTMLElement;
        fireEvent.mouseDown(layer);
        fireEvent.click(layer);
      },
    ],
  ])("%s cancels once and sends nothing", (_, act) => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<Page onConfirm={onConfirm} onCancel={onCancel} />);
    act();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("confirm shows 'Deleting…' with aria-disabled and keeps focus; a second press sends nothing; Go Back is aria-disabled and does nothing", async () => {
    const answer = deferred();
    const onConfirm = vi.fn(() => answer.promise);
    const onCancel = vi.fn();
    render(<Page onConfirm={onConfirm} onCancel={onCancel} />);
    const button = confirmButton();
    button.focus();
    fireEvent.click(button);
    expect(button.textContent).toBe("Deleting…");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(goBack().getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(goBack());
    fireEvent.keyDown(button, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
    await act(async () => answer.resolve({ kind: "ok", data: null }));
  });

  it("204: the page is told, the dialog closes and focus goes to <main> when the page names it", async () => {
    const onDone = vi.fn();
    render(<Page onConfirm={() => Promise.resolve({ kind: "ok", data: null })} onDone={onDone} />);
    await act(async () => fireEvent.click(confirmButton()));
    expect(onDone).toHaveBeenCalledWith({ kind: "ok", data: null });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("404: the page is told (it shows the notice and refreshes), the dialog closes", async () => {
    const onDone = vi.fn();
    render(<Page onConfirm={() => Promise.resolve(http(404))} onDone={onDone} />);
    await act(async () => fireEvent.click(confirmButton()));
    expect(onDone).toHaveBeenCalledWith({ kind: "gone" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("409: 'Data was reset — reloading' in the error area, then a reload", async () => {
    const onDone = vi.fn();
    render(<Page onConfirm={() => Promise.resolve(http(409))} onDone={onDone} />);
    await act(async () => fireEvent.click(confirmButton()));
    expect(alert().textContent).toBe(COPY.dataWasReset);
    expect(onDone).toHaveBeenCalledWith({ kind: "reset" });
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it("401: the page reloads (the proxy's login redirect)", async () => {
    const onDone = vi.fn();
    render(<Page onConfirm={() => Promise.resolve(http(401))} onDone={onDone} />);
    await act(async () => fireEvent.click(confirmButton()));
    expect(onDone).toHaveBeenCalledWith({ kind: "session" });
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["429", http(429, { retryAfter: 2 }), "Too many changes. Try again in 2 seconds"],
    ["403", http(403), "Something went wrong. Try again"],
    ["415", http(415), "Something went wrong. Try again"],
    ["500", http(500), "Something went wrong. Try again"],
    [
      "no response",
      writeAnswer({ ok: false, kind: "network" }),
      "Can't reach the server. Check your connection and try again",
    ],
  ])(
    "%s: its message in the error area (role=alert), the dialog stays open, both buttons work again",
    async (_, answer, message) => {
      const onConfirm = vi.fn(() => Promise.resolve(answer));
      const onCancel = vi.fn();
      render(<Page onConfirm={onConfirm} onCancel={onCancel} />);
      await act(async () => fireEvent.click(confirmButton()));
      expect(alert().textContent).toBe(message);
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(confirmButton().textContent).toBe("Yes, Confirm Deletion");
      expect(confirmButton().getAttribute("aria-disabled")).toBeNull();
      expect(goBack().getAttribute("aria-disabled")).toBeNull();
      expect(reloadPage).not.toHaveBeenCalled();
      await act(async () => fireEvent.click(confirmButton()));
      expect(onConfirm).toHaveBeenCalledTimes(2);
      fireEvent.click(goBack());
      expect(onCancel).toHaveBeenCalledTimes(1);
    },
  );

  it("the error area is a role=alert paragraph, empty before any failure", () => {
    render(<Page onConfirm={() => Promise.resolve({ kind: "ok", data: null })} />);
    expect(alert().textContent).toBe("");
  });
});
