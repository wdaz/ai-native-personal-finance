// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAIN_CONTENT_ID } from "@/src/ui/main-content";
import { Menu } from "@/src/ui/Menu";
import { Modal } from "@/src/ui/Modal";

beforeEach(() => {
  Element.prototype.scrollIntoView = () => {};
});
afterEach(cleanup);

function Page({
  dismissible = true,
  withMenu = false,
  named = false,
  returnToMain = false,
  removeOpener = false,
  onClose,
}: {
  dismissible?: boolean;
  withMenu?: boolean;
  named?: boolean;
  returnToMain?: boolean;
  removeOpener?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [openerShown, setOpenerShown] = useState(true);
  const [theme, setTheme] = useState("Green");
  const close = () => {
    onClose?.();
    if (removeOpener) setOpenerShown(false);
    setOpen(false);
  };
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1}>
      {openerShown ? (
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
      ) : null}
      <button type="button" onClick={() => setOpenerShown(false)}>
        Remove opener
      </button>
      <Modal
        open={open}
        title="Add New Budget"
        description="Choose a category."
        onClose={close}
        dismissible={dismissible}
        initialFocus={named ? () => document.getElementById("second") : undefined}
        returnFocus={returnToMain ? () => document.getElementById(MAIN_CONTENT_ID) : undefined}
      >
        <input aria-label="First" />
        <input aria-label="Second" id="second" />
        {withMenu ? (
          <Menu
            variant="field"
            label="Theme"
            options={[
              { value: "Green", label: "Green" },
              { value: "Red", label: "Red" },
            ]}
            value={theme}
            onChange={setTheme}
          />
        ) : null}
        <button type="submit">Add Budget</button>
      </Modal>
    </main>
  );
}

const openModal = () => {
  const opener = screen.getByRole("button", { name: "Open" });
  opener.focus();
  fireEvent.click(opener);
  return opener;
};
const dialog = () => screen.queryByRole("dialog");
const active = () => document.activeElement;

describe("Modal (SPEC-ui-kit 2.2; US-15 AC4, US-32 AC2, NFR-A3)", () => {
  it("roles and names: dialog, aria-modal, labelled by its title, described by its description", () => {
    render(<Page />);
    openModal();
    const panel = screen.getByRole("dialog", { name: "Add New Budget" });
    expect(panel.getAttribute("aria-modal")).toBe("true");
    const describedBy = panel.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toBe("Choose a category.");
    expect(screen.getByRole("heading", { level: 2, name: "Add New Budget" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });

  it("first focus: the first focusable element after Close, or the element the page names", () => {
    render(<Page />);
    openModal();
    expect(active()).toBe(screen.getByRole("textbox", { name: "First" }));
    cleanup();
    render(<Page named />);
    openModal();
    expect(active()).toBe(screen.getByRole("textbox", { name: "Second" }));
  });

  it("Tab on the last focusable element goes to the first, Shift+Tab on the first to the last", () => {
    render(<Page />);
    openModal();
    const close = screen.getByRole("button", { name: "Close" });
    const submit = screen.getByRole("button", { name: "Add Budget" });
    submit.focus();
    fireEvent.keyDown(submit, { key: "Tab" });
    expect(active()).toBe(close);
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(active()).toBe(submit);
  });

  it("Escape closes; focus returns to the trigger", () => {
    render(<Page />);
    const opener = openModal();
    fireEvent.keyDown(screen.getByRole("textbox", { name: "First" }), { key: "Escape" });
    expect(dialog()).toBeNull();
    expect(active()).toBe(opener);
  });

  it("Escape with a Menu open inside closes only the menu, focus on its trigger", () => {
    render(<Page withMenu />);
    openModal();
    const trigger = screen.getByRole("button", { name: "Theme: Green" });
    fireEvent.click(trigger);
    const listbox = screen.getByRole("listbox");
    fireEvent.keyDown(listbox, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(dialog()).not.toBeNull();
    expect(active()).toBe(trigger);
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(dialog()).toBeNull();
  });

  it("the close button and a press-and-release on the backdrop close it", () => {
    render(<Page />);
    openModal();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(dialog()).toBeNull();
    openModal();
    const layer = dialog()?.parentElement as HTMLElement;
    fireEvent.mouseDown(layer);
    fireEvent.click(layer);
    expect(dialog()).toBeNull();
  });

  it("a press inside the panel released on the backdrop does not close it", () => {
    render(<Page />);
    openModal();
    const panel = dialog() as HTMLElement;
    fireEvent.mouseDown(screen.getByRole("textbox", { name: "First" }));
    fireEvent.click(panel.parentElement as HTMLElement);
    expect(dialog()).not.toBeNull();
  });

  it("nothing closes it when it is not dismissible (a request pending)", () => {
    const onClose = vi.fn();
    render(<Page dismissible={false} onClose={onClose} />);
    openModal();
    fireEvent.keyDown(screen.getByRole("textbox", { name: "First" }), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    const layer = dialog()?.parentElement as HTMLElement;
    fireEvent.mouseDown(layer);
    fireEvent.click(layer);
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
  });

  it("focus goes to <main> when the trigger is gone at close, never <body>", () => {
    render(<Page removeOpener />);
    openModal();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(active()?.id).toBe(MAIN_CONTENT_ID);
  });

  it("closed with <main> named while the trigger is still in the DOM, removed a tick later → focus on <main>", async () => {
    render(<Page returnToMain />);
    const opener = openModal();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(opener.isConnected).toBe(true);
    expect(active()?.id).toBe(MAIN_CONTENT_ID);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Remove opener" }));
      await Promise.resolve();
    });
    expect(active()?.id).toBe(MAIN_CONTENT_ID);
    expect(active()).not.toBe(document.body);
  });

  it("every other child of <body> is inert while open and restored after; the scroll too", () => {
    const outside = document.createElement("div");
    outside.id = "outside";
    document.body.append(outside);
    const alreadyInert = document.createElement("div");
    alreadyInert.setAttribute("inert", "");
    document.body.append(alreadyInert);
    document.documentElement.style.overflow = "scroll";
    render(<Page />);
    openModal();
    const layer = dialog()?.parentElement as HTMLElement;
    const siblings = [...document.body.children].filter((element) => element !== layer);
    expect(siblings.every((element) => element.hasAttribute("inert"))).toBe(true);
    expect(layer.hasAttribute("inert")).toBe(false);
    expect(document.documentElement.style.overflow).toBe("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(outside.hasAttribute("inert")).toBe(false);
    expect(alreadyInert.hasAttribute("inert")).toBe(true);
    expect(document.documentElement.style.overflow).toBe("scroll");
    outside.remove();
    alreadyInert.remove();
    document.documentElement.style.overflow = "";
  });
});
