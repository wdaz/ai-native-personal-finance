// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import type { PotsDto } from "@/src/shared/schemas";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-request-id": "req-123" }),
}));
vi.mock("@/src/server/db", () => ({ getDb: () => ({}) }));
vi.mock("@/src/server/pots", () => ({
  getPots: vi.fn(async () => {
    throw new Error("database down");
  }),
}));
vi.mock("@/src/ui/reload", () => ({ reloadPage: vi.fn() }));
vi.mock("@/src/ui/agent-tools-indicator", () => ({ useAgentToolsIndicator: () => null }));

const { PotsBoard } = await import("@/app/(app)/pots/PotsBoard");
const { default: PotsPage } = await import("@/app/(app)/pots/page");

/** Synthetic, not seed data. */
const DTO: PotsDto = {
  balance: { current: 10_000 },
  items: [
    {
      id: "3f1c2b8e-5a7d-4c1e-9b2a-6d8e0f4a1c3b",
      name: "Pot",
      theme: "Green",
      target: 100_000,
      total: 5_000,
      percentBasisPoints: 500,
    },
  ],
};

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => refresh.mockClear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});


async function addMoney(text: string) {
  fireEvent.click(screen.getByRole("button", { name: "Add Money to Pot" }));
  const field = screen.getByRole("textbox", { name: COPY.amountToAdd });
  fireEvent.change(field, { target: { value: text } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: COPY.confirmAddition }));
  });
}

describe("PotsBoard (SPEC-pots 2.1, 2.8, 2.9)", () => {
  it("a success closes the modal and calls router.refresh() inside a transition", async () => {
    const fetchMock = stubFetch(200, {
      pot: { ...DTO.items[0], total: 6_000, percentBasisPoints: 600 },
      balance: { current: 9_000 },
    });
    render(<PotsBoard dto={DTO} />);
    await addMoney("10");
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/pots/${DTO.items[0]!.id}/deposit`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ amount: 1_000 }) }),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the new props it is given (the server's next read)", () => {
    const { rerender } = render(<PotsBoard dto={DTO} />);
    expect(screen.getByText("$50.00")).toBeTruthy();
    rerender(
      <PotsBoard
        dto={{ ...DTO, items: [{ ...DTO.items[0]!, total: 6_000, percentBasisPoints: 600 }] }}
      />,
    );
    expect(screen.getByText("$60.00")).toBeTruthy();
  });

  it("a 400 exceeds_balance shows the message, refreshes, and keeps the modal open", async () => {
    stubFetch(400, {
      error: "validation",
      message: "Invalid",
      issues: [{ path: ["amount"], code: "exceeds_balance" }],
    });
    render(<PotsBoard dto={DTO} />);
    await addMoney("10");
    expect(screen.getByText(COPY.depositOverBalance)).toBeTruthy();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("a 404 closes the modal and shows 'This pot no longer exists' (US-24 AC2)", async () => {
    stubFetch(404, { error: "not_found", message: "Not found" });
    render(<PotsBoard dto={DTO} />);
    await addMoney("10");
    expect(screen.queryByRole("dialog")).toBeNull();
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    expect(screen.getByRole("status").textContent).toBe(COPY.potGone);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("no pots: the card 'No pots yet' and the header's 'Add New Pot' (PO-Q3 (a))", () => {
    render(<PotsBoard dto={{ ...DTO, items: [] }} />);
    expect(screen.getByText(COPY.potsEmpty)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: COPY.addNewPot })).toHaveLength(1);
  });

  it("the page's error state: the header with no 'Add New Pot', the card, and the logged line (2.9, PO-Q9 (a))", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(await PotsPage());
    expect(screen.getByRole("heading", { level: 1, name: "Pots" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: COPY.addNewPot })).toBeNull();
    expect(screen.getByText(COPY.potsLoadError)).toBeTruthy();
    expect(log).toHaveBeenCalledWith("Pots: getPots failed requestId=req-123", expect.any(Error));
    log.mockRestore();
  });
});
