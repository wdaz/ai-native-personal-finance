"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { apiSend } from "@/src/shared/api-client";
import { COPY } from "@/src/shared/copy";
import { BudgetWriteDtoSchema, type BudgetItemDto, type BudgetsDto } from "@/src/shared/schemas";
import { writeAnswer } from "@/src/shared/write-feedback";
import { BudgetCard } from "@/src/ui/budgets/BudgetCard";
import { BudgetForm, type BudgetFormMode, type BudgetSubmit } from "@/src/ui/budgets/BudgetForm";
import { BudgetsEmpty } from "@/src/ui/budgets/BudgetsEmpty";
import { SpendingSummary } from "@/src/ui/budgets/SpendingSummary";
import { ConfirmDeleteDialog } from "@/src/ui/ConfirmDeleteDialog";
import { MAIN_CONTENT_ID } from "@/src/ui/main-content";
import { ModalSlotProvider, useModalSlot } from "@/src/ui/ModalSlot";
import { PAGE_NAMES } from "@/src/ui/nav";
import { Notice, useNotice } from "@/src/ui/Notice";
import { HeaderAddButton, PageHeader } from "@/src/ui/PageHeader";
import { useDeleteFlow } from "../_write/use-delete-flow";
import styles from "./page.module.css";

/** An open form: its mode, the slot's release, and a key so each opening starts clean. */
type OpenForm = { mode: BudgetFormMode; release: () => void; key: number; trigger?: HTMLElement };

/**
 * SPEC-budgets 2.1: the page's client container. It renders the header with "+ Add New Budget"
 * (SPEC-ui-kit 2.8), the notice (2.9), the summary and the cards (2.2–2.5), the add and edit form
 * (2.6, 2.7) and the delete dialog (2.8); it provides the page's `ModalSlot`, owns the page's one
 * write function, subscribes the page to the delete bus, and refreshes the page after a write.
 */
export function BudgetsView({ budgets }: { budgets: BudgetsDto }) {
  return (
    <ModalSlotProvider>
      <BudgetsPage budgets={budgets} />
    </ModalSlotProvider>
  );
}

function BudgetsPage({ budgets }: { budgets: BudgetsDto }) {
  const router = useRouter();
  const slot = useModalSlot();
  const notice = useNotice();
  const [refreshing, startTransition] = useTransition();
  const [form, setForm] = useState<OpenForm | null>(null);
  const formRef = useRef<OpenForm | null>(null);
  const formToMain = useRef(false);
  const nextKey = useRef(0);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  /** 2.9: the Server Component reads the database again; the previous state stays meanwhile. */
  const refresh = () => startTransition(() => router.refresh());

  /** 2.9: the page's write function — counted in the slot, sent through `apiSend`. */
  const write =
    (method: "POST" | "PATCH", path: string): BudgetSubmit =>
    (values) =>
      slot.trackWrite(async () =>
        writeAnswer(await apiSend(method, path, BudgetWriteDtoSchema, { body: values })),
      );

  const { dialog, openFor } = useDeleteFlow({
    kind: "budget",
    records: budgets.items.map((budget) => ({ id: budget.id, name: budget.category })),
    path: (id) => `/api/budgets/${id}`,
    onDeleted: () => {
      notice.clear();
      refresh();
    },
    onGone: () => {
      notice.show(COPY.budgetGone);
      refresh();
    },
  });

  const openForm = (mode: BudgetFormMode, trigger?: HTMLElement) => {
    const release = slot.claim();
    if (release === null) return;
    nextKey.current += 1;
    formToMain.current = false;
    const next = { mode, release, key: nextKey.current, trigger };
    formRef.current = next;
    setForm(next);
  };

  const closeForm = (focusMain = false) => {
    const current = formRef.current;
    if (current === null) return;
    formToMain.current = focusMain;
    current.release();
    formRef.current = null;
    setForm(null);
  };

  const edit = (budget: BudgetItemDto) => (trigger: HTMLButtonElement) =>
    openForm({ kind: "edit", budget }, trigger);

  return (
    <>
      <PageHeader
        title={PAGE_NAMES.budgets}
        primaryAction={
          <HeaderAddButton
            label={COPY.addNewBudget}
            buttonRef={addButtonRef}
            onClick={() => openForm({ kind: "add" })}
          />
        }
      />
      <div className={styles.body}>
        <div className={styles.notice}>
          <Notice notice={notice.notice} onDismiss={notice.clear} />
        </div>
        <div className={styles.layout}>
          <div className={styles.summary}>
            <SpendingSummary budgets={budgets} />
          </div>
          <div className={styles.cards} aria-busy={refreshing}>
            {budgets.items.length > 0 ? (
              budgets.items.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={edit(budget)}
                  onDelete={(trigger) => openFor(budget.id, trigger)}
                />
              ))
            ) : (
              <BudgetsEmpty />
            )}
          </div>
        </div>
      </div>
      {form === null ? null : (
        <BudgetForm
          key={form.key}
          mode={form.mode}
          budgets={budgets.items}
          submit={
            form.mode.kind === "add"
              ? write("POST", "/api/budgets")
              : write("PATCH", `/api/budgets/${form.mode.budget.id}`)
          }
          onClose={() => closeForm()}
          onSaved={() => {
            closeForm();
            notice.clear();
            refresh();
          }}
          onGone={() => {
            closeForm(true);
            notice.show(COPY.budgetGone);
            refresh();
          }}
          onTaken={refresh}
          returnFocus={() => {
            if (formToMain.current) return document.getElementById(MAIN_CONTENT_ID);
            return form.trigger ?? addButtonRef.current;
          }}
        />
      )}
      <ConfirmDeleteDialog {...dialog} />
    </>
  );
}
