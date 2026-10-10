"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { COPY } from "@/src/shared/copy";
import { CATEGORIES, THEMES, type Category, type Theme } from "@/src/shared/enums";
import { formatAmountInput, parseAmountInput } from "@/src/shared/money";
import type { BudgetCreateInput, BudgetItemDto, ErrorIssue } from "@/src/shared/schemas";
import { AMOUNT_MESSAGES, type WriteAnswer } from "@/src/shared/write-feedback";
import { AmountField } from "../AmountField";
import { FormFooter } from "../FormFooter";
import { Modal } from "../Modal";
import { reloadPage } from "../reload";
import { SelectField } from "../SelectField";
import styles from "./BudgetForm.module.css";

type FieldName = "category" | "maximum" | "theme";
type Errors = Partial<Record<FieldName, string>>;
const FIELDS: readonly FieldName[] = ["category", "maximum", "theme"];

export type BudgetFormMode = { kind: "add" } | { kind: "edit"; budget: BudgetItemDto };

/**
 * The page's write for this form (`BudgetsView`'s write function): `POST /api/budgets` for an
 * add, `PATCH /api/budgets/{id}` for an edit, as `writeAnswer`.
 */
export type BudgetSubmit = (values: BudgetCreateInput) => Promise<WriteAnswer<unknown>>;

/** A server issue as the field's message (`write-path.md` 2.7, §3; SPEC-ui-kit 2.5, 2.6). */
function issueMessage(issue: ErrorIssue): string | undefined {
  const field = issue.path[0];
  if (field === "category" || field === "theme") {
    if (issue.code === "taken") return COPY.alreadyUsed;
    if (issue.code === "required") return COPY.required;
    return undefined;
  }
  if (field === "maximum" && issue.code in AMOUNT_MESSAGES) {
    return AMOUNT_MESSAGES[issue.code as keyof typeof AMOUNT_MESSAGES];
  }
  return undefined;
}

/**
 * SPEC-budgets 2.6, 2.7 (US-15, US-16, US-31): the add and edit form in the page's `Modal` —
 * Budget Category (`SelectField`, another budget's category "Already used"), Maximum Spend
 * (`AmountField`) and Theme (`SelectField` with swatches, another budget's theme "Already
 * used"). The add form opens on the first free category and theme; with no free category it
 * opens with no value and "All categories already have a budget" under the field from the
 * start. The edit form is pre-filled, and its own category and theme stay choosable.
 * Release 1's timing (UK-Q9 (a)): a field is checked at its blur and every field on submit;
 * typing and choosing never show or clear a message. The submit is always enabled; with an
 * invalid field it focuses the first one and sends nothing.
 */
export function BudgetForm({
  mode,
  budgets,
  submit,
  onClose,
  onSaved,
  onGone,
  onTaken,
  returnFocus,
}: {
  mode: BudgetFormMode;
  /** Every budget the page shows: the used categories and themes. */
  budgets: readonly BudgetItemDto[];
  submit: BudgetSubmit;
  onClose: () => void;
  /** A 201 or 200: the page closes the modal and refreshes (2.9). */
  onSaved: () => void;
  /** A 404 on an edit: the page closes the modal with `<main>` named, the notice, a refresh. */
  onGone: () => void;
  /** A server `taken`: the page refreshes its data, so the options mark the value used (2.9). */
  onTaken: () => void;
  returnFocus?: () => HTMLElement | null;
}) {
  const editing = mode.kind === "edit" ? mode.budget : undefined;
  const others = budgets.filter((budget) => budget.id !== editing?.id);
  const usedCategories = new Set<Category>(others.map((budget) => budget.category));
  const usedThemes = new Set<Theme>(others.map((budget) => budget.theme));

  const [category, setCategory] = useState<Category | undefined>(
    () => editing?.category ?? CATEGORIES.find((c) => !usedCategories.has(c)),
  );
  const [theme, setTheme] = useState<Theme | undefined>(
    () => editing?.theme ?? THEMES.find((t) => !usedThemes.has(t)),
  );
  const noFreeCategory = editing === undefined && category === undefined;
  const [errors, setErrors] = useState<Errors>(() =>
    noFreeCategory ? { category: COPY.budgetCategoriesUsed } : {},
  );
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const sending = useRef(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const maximumRef = useRef<HTMLInputElement>(null);
  const maximumId = `${useId()}-maximum`;

  const trigger = (wrapper: HTMLDivElement | null) =>
    wrapper?.querySelector<HTMLElement>('[aria-haspopup="listbox"]') ?? null;
  const focusField = (field: FieldName) => {
    if (field === "maximum") maximumRef.current?.focus();
    else trigger(field === "category" ? categoryRef.current : themeRef.current)?.focus();
  };

  const check = {
    category: (): string | undefined => {
      if (category === undefined) {
        return usedCategories.size === CATEGORIES.length
          ? COPY.budgetCategoriesUsed
          : COPY.required;
      }
      return usedCategories.has(category) ? COPY.alreadyUsed : undefined;
    },
    theme: (): string | undefined => {
      if (theme === undefined) return COPY.required;
      return usedThemes.has(theme) ? COPY.alreadyUsed : undefined;
    },
    maximum: (): string | undefined => {
      const parsed = parseAmountInput(maximumRef.current?.value ?? "");
      return parsed.ok ? undefined : AMOUNT_MESSAGES[parsed.code];
    },
  } satisfies Record<FieldName, () => string | undefined>;

  const checkOne = (field: FieldName) =>
    setErrors((current) => ({ ...current, [field]: check[field]() }));

  const showErrors = (next: Errors) => {
    setErrors(next);
    const first = FIELDS.find((field) => next[field] !== undefined);
    if (first !== undefined) focusField(first);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;
    const next: Errors = {
      category: check.category(),
      maximum: check.maximum(),
      theme: check.theme(),
    };
    const parsed = parseAmountInput(maximumRef.current?.value ?? "");
    if (FIELDS.some((field) => next[field] !== undefined) || !parsed.ok) {
      showErrors(next);
      return;
    }
    if (category === undefined || theme === undefined) return;
    setErrors({});
    setFormError(undefined);
    sending.current = true;
    setPending(true);
    const answer = await submit({ category, maximum: parsed.cents, theme });
    sending.current = false;
    switch (answer.kind) {
      case "ok":
        onSaved();
        return;
      case "gone":
        onGone();
        return;
      case "reset":
        setFormError(COPY.dataWasReset);
        reloadPage();
        return;
      case "session":
        reloadPage();
        return;
      case "validation": {
        setPending(false);
        const fieldErrors: Errors = {};
        let unplaced = false;
        for (const issue of answer.issues) {
          const field = issue.path[0];
          const message = issueMessage(issue);
          if (
            message !== undefined &&
            (field === "category" || field === "maximum" || field === "theme")
          ) {
            fieldErrors[field] ??= message;
          } else {
            unplaced = true;
          }
        }
        if (unplaced) setFormError(COPY.signupFailed);
        if (answer.issues.some((issue) => issue.code === "taken")) onTaken();
        showErrors(fieldErrors);
        return;
      }
      case "failed":
        setPending(false);
        setFormError(answer.message);
        return;
    }
  };

  return (
    <Modal
      open
      title={editing === undefined ? COPY.addNewBudget : COPY.editBudget}
      description={editing === undefined ? COPY.addBudgetDescription : COPY.editBudgetDescription}
      onClose={onClose}
      dismissible={!pending}
      initialFocus={() => trigger(categoryRef.current)}
      returnFocus={returnFocus}
    >
      <form className={styles.form} noValidate onSubmit={(e) => void onSubmit(e)}>
        <div className={styles.fields}>
          <div ref={categoryRef}>
            <SelectField
              label={COPY.budgetCategory}
              options={CATEGORIES.map((value) => ({
                value,
                label: value,
                used: usedCategories.has(value),
              }))}
              value={category}
              onChange={setCategory}
              error={errors.category}
              onBlur={() => checkOne("category")}
            />
          </div>
          <AmountField
            id={maximumId}
            name="maximum"
            label={COPY.maximumSpend}
            placeholder={COPY.amountPlaceholder}
            defaultValue={editing === undefined ? undefined : formatAmountInput(editing.maximum)}
            error={errors.maximum}
            onBlur={() => checkOne("maximum")}
            inputRef={maximumRef}
          />
          <div ref={themeRef}>
            <SelectField
              label={COPY.theme}
              themes
              options={THEMES.map((value) => ({
                value,
                label: value,
                used: usedThemes.has(value),
              }))}
              value={theme}
              onChange={setTheme}
              error={errors.theme}
              onBlur={() => checkOne("theme")}
            />
          </div>
        </div>
        <FormFooter
          label={editing === undefined ? COPY.addBudgetSubmit : COPY.saveChanges}
          pending={pending}
          error={formError}
        />
      </form>
    </Modal>
  );
}
