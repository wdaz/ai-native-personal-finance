"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { z } from "zod";
import {
  firstFreeTheme,
  isPotNameTaken,
  moneyPreview,
  potFill,
  type MoneyMoveKind,
} from "@/src/domain/pots";
import { apiSend, type WriteMethod } from "@/src/shared/api-client";
import { COPY } from "@/src/shared/copy";
import { PAGE_NAMES } from "@/src/ui/nav";
import type { PotDto, PotsDto } from "@/src/shared/schemas";
import { writeAnswer, type WriteAnswer } from "@/src/shared/write-feedback";
import { ConfirmDeleteDialog } from "@/src/ui/ConfirmDeleteDialog";
import { MAIN_CONTENT_ID } from "@/src/ui/main-content";
import { ModalSlotProvider, useModalSlot } from "@/src/ui/ModalSlot";
import { Notice, useNotice } from "@/src/ui/Notice";
import { HeaderAddButton, PageHeader } from "@/src/ui/PageHeader";
import { MoneyModal, type MoneyDone } from "@/src/ui/pots/MoneyModal";
import { PotCard } from "@/src/ui/pots/PotCard";
import { PotForm, type PotFormBody, type PotFormDone } from "@/src/ui/pots/PotForm";
import { useDeleteFlow } from "../_write/use-delete-flow";
import styles from "./page.module.css";

const potPath = (id: string) => `/api/pots/${encodeURIComponent(id)}`;

/**
 * SPEC-pots 2.1, 2.8 (`ui-kit.md` 2.2): the page's client container. It provides the page's
 * `ModalSlot`, owns the one write function the pot forms, the money modals and the delete dialog
 * use, and its refresh: after a success, or a 400 that shows the data is old, `router.refresh()`
 * in a transition re-reads `getPots`, and the grid carries `aria-busy` until the new props land.
 * What it renders is always the server's last read — it computes no money.
 */
export function PotsBoard({ dto }: { dto: PotsDto }) {
  return (
    <ModalSlotProvider>
      <Board dto={dto} />
    </ModalSlotProvider>
  );
}

type Opened<T> = { value: T; release: () => void; trigger: HTMLElement | null };

function Board({ dto }: { dto: PotsDto }) {
  const router = useRouter();
  const slot = useModalSlot();
  const [refreshing, startTransition] = useTransition();
  const { notice, show, clear } = useNotice();
  const [form, setForm] = useState<Opened<"add" | { edit: PotDto }> | null>(null);
  const [money, setMoney] = useState<Opened<{ kind: MoneyMoveKind; pot: PotDto }> | null>(null);
  const toMain = useRef(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const refresh = () => startTransition(() => router.refresh());

  /** 2.8: the page's one write function, counted in and out of the `ModalSlot`. */
  const write = (method: WriteMethod, path: string, body?: unknown) =>
    slot.trackWrite(async () => writeAnswer(await apiSend(method, path, z.unknown(), { body })));

  const succeeded = () => {
    clear();
    refresh();
  };
  const gone = () => {
    show(COPY.potGone);
    refresh();
  };

  const { dialog, openFor } = useDeleteFlow({
    kind: "pot",
    records: dto.items,
    path: potPath,
    onDeleted: succeeded,
    onGone: gone,
  });

  /** Claims the page's one modal (`ui-kit.md` 2.2); nothing opens while another is open. */
  const claim = <T,>(value: T, trigger: HTMLElement | null): Opened<T> | null => {
    const release = slot.claim();
    if (release === null) return null;
    toMain.current = false;
    return { value, release, trigger };
  };

  const openForm = (value: "add" | { edit: PotDto }, trigger: HTMLElement | null) => {
    if (form !== null || money !== null) return;
    const opened = claim(value, trigger);
    if (opened !== null) setForm(opened);
  };
  const openMoney = (value: { kind: MoneyMoveKind; pot: PotDto }, trigger: HTMLElement) => {
    if (form !== null || money !== null) return;
    const opened = claim(value, trigger);
    if (opened !== null) setMoney(opened);
  };

  const closeForm = (focusMain = false) => {
    toMain.current = focusMain;
    form?.release();
    setForm(null);
  };
  const closeMoney = (focusMain = false) => {
    toMain.current = focusMain;
    money?.release();
    setMoney(null);
  };

  const returnTo = (opened: Opened<unknown> | null) => () =>
    toMain.current ? document.getElementById(MAIN_CONTENT_ID) : (opened?.trigger ?? null);

  const potById = (id: string) => dto.items.find((pot) => pot.id === id);

  const formDone = (answer: PotFormDone) => {
    if (answer.kind === "ok") {
      closeForm();
      succeeded();
    } else {
      closeForm(true);
      gone();
    }
  };
  const moneyDone = (answer: MoneyDone) => {
    if (answer.kind === "ok") {
      closeMoney();
      succeeded();
    } else {
      closeMoney(true);
      gone();
    }
  };

  const submitForm = (body: PotFormBody): Promise<WriteAnswer<unknown>> => {
    const mode = form?.value;
    return mode === undefined || mode === "add"
      ? write("POST", "/api/pots", body)
      : write("PATCH", potPath(mode.edit.id), body);
  };
  const submitMoney = (amount: number): Promise<WriteAnswer<unknown>> => {
    const move = money?.value;
    if (move === undefined) return Promise.resolve({ kind: "gone" });
    const action = move.kind === "add" ? "deposit" : "withdraw";
    return write("POST", `${potPath(move.pot.id)}/${action}`, { amount });
  };

  // An open modal follows the page's latest read of its pot (2.8: a tool's write meanwhile).
  const moneyPot = money === null ? undefined : potById(money.value.pot.id);
  const editPot = form === null || form.value === "add" ? undefined : potById(form.value.edit.id);

  return (
    <>
      <PageHeader
        title={PAGE_NAMES.pots}
        primaryAction={
          <HeaderAddButton
            label={COPY.addNewPot}
            buttonRef={addButtonRef}
            onClick={() => openForm("add", addButtonRef.current)}
          />
        }
      />
      <Notice notice={notice} onDismiss={clear} />
      {dto.items.length === 0 ? (
        <section className={styles.empty} aria-busy={refreshing ? true : undefined}>
          <p className="text-preset-4">{COPY.potsEmpty}</p>
        </section>
      ) : (
        <div className={styles.grid} aria-busy={refreshing ? true : undefined}>
          {dto.items.map((pot) => (
            <PotCard
              key={pot.id}
              pot={pot}
              fill={potFill(pot.total, pot.target)}
              onEdit={(trigger) => openForm({ edit: pot }, trigger)}
              onDelete={(trigger) => openFor(pot.id, trigger)}
              onAddMoney={(trigger) => openMoney({ kind: "add", pot }, trigger)}
              onWithdraw={(trigger) => openMoney({ kind: "withdraw", pot }, trigger)}
            />
          ))}
        </div>
      )}
      <PotForm
        mode={form === null ? null : editPot === undefined ? form.value : { edit: editPot }}
        pots={dto.items}
        isNameTaken={isPotNameTaken}
        firstFreeTheme={firstFreeTheme}
        onClose={() => closeForm()}
        onSubmit={submitForm}
        onDone={formDone}
        onStale={refresh}
        returnFocus={returnTo(form)}
      />
      <MoneyModal
        move={money === null ? null : { kind: money.value.kind, pot: moneyPot ?? money.value.pot }}
        balance={dto.balance.current}
        preview={(amount) =>
          money === null
            ? { newTotal: 0, staying: 0, moving: 0, percent: 0 }
            : moneyPreview(
                moneyPot ?? money.value.pot,
                money.value.kind,
                amount,
                dto.balance.current,
              )
        }
        onClose={() => closeMoney()}
        onSubmit={submitMoney}
        onDone={moneyDone}
        onStale={refresh}
        returnFocus={returnTo(money)}
      />
      <ConfirmDeleteDialog {...dialog} />
    </>
  );
}
