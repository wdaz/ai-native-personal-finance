"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { apiSend } from "@/src/shared/api-client";
import { COPY } from "@/src/shared/copy";
import { VIA_HEADER, VIA_WEBMCP } from "@/src/shared/via";
import { writeAnswer, type WriteAnswer } from "@/src/shared/write-feedback";
import type { ConfirmDeleteDialogProps, DeleteDone } from "@/src/ui/ConfirmDeleteDialog";
import { MAIN_CONTENT_ID } from "@/src/ui/main-content";
import { useModalSlot } from "@/src/ui/ModalSlot";
import {
  deleteResultOf,
  onDeleteRequest,
  type DeleteKind,
  type DeleteResult,
} from "@/src/webmcp/bus";

/** A record the page shows: what `delete_*` may name, and the name in the dialog's title. */
export type DeletableRecord = { id: string; name: string };

type Target = {
  id: string;
  name: string;
  /** A tool's request: its delete carries `X-Via: webmcp` and its result resolves the tool. */
  resolve?: (result: DeleteResult) => void;
  /** The "…" button that opened it (a person's delete); a tool's returns focus to the opener. */
  trigger?: HTMLElement;
  release: () => void;
  confirmed: boolean;
  /** The tool's request was aborted after the confirm: the request's answer is its result. */
  aborted?: boolean;
};

const DESCRIPTIONS: Record<DeleteKind, string> = {
  budget: COPY.deleteBudgetConfirm,
  pot: COPY.deletePotConfirm,
};

/**
 * SPEC-ui-kit 2.3: the page's join of `ConfirmDeleteDialog` (`src/ui`) and the delete bus
 * (`src/webmcp/bus.ts`) — `app/` may import both layers, `src/ui` never imports `src/webmcp`
 * (ADR-0002). One hook for Budgets and Pots (T-22 plan D1). A person's "Delete" (`openFor`) and a
 * tool's `requestDelete` open the same dialog; the confirmed delete is the same request, with
 * `X-Via: webmcp` for a tool (item 5), counted in the page's `ModalSlot`. A tool's result is the
 * dialog's final outcome (item 4): `busy` and `not_found` at once with nothing opened (items 2,
 * 3); `cancelled` on any cancel, an abort before the confirm, or the page unmounting before it;
 * once confirmed, the request's answer, even after an unmount.
 */
export function useDeleteFlow({
  kind,
  records,
  path,
  onDeleted,
  onGone,
}: {
  kind: DeleteKind;
  records: readonly DeletableRecord[];
  /** The record's route, `/api/budgets/{id}` or `/api/pots/{id}`. */
  path: (id: string) => string;
  /** A 204: the page removes the record (US-17 AC2, US-24 AC1). */
  onDeleted: (id: string) => void;
  /** A 404: the page shows the notice and refreshes its list (US-17 AC3, US-24 AC2). */
  onGone: (id: string) => void;
}): { dialog: ConfirmDeleteDialogProps; openFor: (id: string, trigger: HTMLElement) => void } {
  const slot = useModalSlot();
  const [target, setTarget] = useState<Target | null>(null);
  const targetRef = useRef<Target | null>(null);
  const recordsRef = useRef(records);
  const mounted = useRef(true);
  const toMain = useRef(false);
  const callbacks = useRef({ onDeleted, onGone });
  useEffect(() => {
    recordsRef.current = records;
    callbacks.current = { onDeleted, onGone };
  });

  const show = (next: Target | null) => {
    targetRef.current = next;
    setTarget(next);
  };

  /** Closes the dialog; `main` when the element focus returns to is about to go (2.2, 2.3). */
  const close = (current: Target, focusMain: boolean) => {
    if (targetRef.current !== current) return;
    toMain.current = focusMain;
    current.release();
    show(null);
  };

  const open = (record: DeletableRecord, extra: Partial<Target>): boolean => {
    const release = slot.claim();
    if (release === null) return false;
    toMain.current = false;
    show({ id: record.id, name: record.name, release, confirmed: false, ...extra });
    return true;
  };

  const openFor = (id: string, trigger: HTMLElement) => {
    const record = recordsRef.current.find((r) => r.id === id);
    if (record !== undefined) open(record, { trigger });
  };

  // The bus: one handler per kind while the page is mounted (2.3 item 1).
  useEffect(() => {
    mounted.current = true;
    const unsubscribe = onDeleteRequest(kind, (id, signal) => {
      if (slot.isBusy()) return Promise.resolve("busy");
      const record = recordsRef.current.find((r) => r.id === id);
      if (record === undefined) return Promise.resolve("not_found");
      return new Promise<DeleteResult>((resolve) => {
        let settled = false;
        const settle = (result: DeleteResult) => {
          if (settled) return;
          settled = true;
          signal?.removeEventListener("abort", onAbort);
          resolve(result);
        };
        const onAbort = () => {
          const current = targetRef.current;
          if (current?.resolve !== settle) return;
          if (current.confirmed) {
            // After the confirm the request's answer decides (2.3 item 4), even a failure.
            current.aborted = true;
            return;
          }
          close(current, false);
          settle("cancelled");
        };
        // Claimed synchronously, before any await: a second call in the same tick is `busy`.
        if (!open(record, { resolve: settle })) {
          settle("busy");
          return;
        }
        signal?.addEventListener("abort", onAbort);
      });
    });
    return () => {
      mounted.current = false;
      unsubscribe();
      // 2.3 item 4: unmounting before a confirm cancels; after one, the answer decides.
      // The slot is freed either way; `trackWrite` still counts a confirmed request in flight.
      const current = targetRef.current;
      if (current !== null) {
        current.release();
        if (!current.confirmed) current.resolve?.("cancelled");
        targetRef.current = null;
      }
    };
    // `slot` is the page's one ModalSlot; the handler reads records through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, slot]);

  const remove = (current: Target): Promise<WriteAnswer<unknown>> =>
    slot.trackWrite(async () =>
      writeAnswer(
        await apiSend("DELETE", path(current.id), z.unknown(), {
          headers: current.resolve === undefined ? undefined : { [VIA_HEADER]: VIA_WEBMCP },
        }),
      ),
    );

  const dialog: ConfirmDeleteDialogProps = {
    open: target !== null,
    title: COPY.deleteTitle(target?.name ?? ""),
    description: DESCRIPTIONS[kind],
    onCancel: () => {
      const current = targetRef.current;
      if (current === null || current.confirmed) return;
      close(current, false);
      current.resolve?.("cancelled");
    },
    onConfirm: async () => {
      const current = targetRef.current;
      if (current === null) return { kind: "gone" };
      current.confirmed = true;
      const answer = await remove(current);
      const terminal = answer.kind !== "failed" && answer.kind !== "validation";
      if (terminal || !mounted.current || current.aborted === true) {
        current.resolve?.(deleteResultOf(answer));
      }
      // A failure leaves the dialog open with its message; the person may confirm again.
      if (!terminal && mounted.current) current.confirmed = false;
      return answer;
    },
    onDone: (answer: DeleteDone) => {
      const current = targetRef.current;
      if (current === null) return;
      if (answer.kind === "ok") {
        close(current, true);
        callbacks.current.onDeleted(current.id);
      } else if (answer.kind === "gone") {
        close(current, true);
        callbacks.current.onGone(current.id);
      }
    },
    returnFocus: () => {
      if (toMain.current) return document.getElementById(MAIN_CONTENT_ID);
      return targetRef.current?.trigger ?? target?.trigger ?? null;
    },
  };

  return { dialog, openFor };
}
