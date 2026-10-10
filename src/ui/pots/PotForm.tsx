"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { COPY } from "@/src/shared/copy";
import { THEMES, type Theme } from "@/src/shared/enums";
import { formatAmountInput, parseAmountInput } from "@/src/shared/money";
import { POT_NAME_MAX, type ErrorIssue, type PotDto } from "@/src/shared/schemas";
import { AMOUNT_MESSAGES, type WriteAnswer } from "@/src/shared/write-feedback";
import { AmountField } from "../AmountField";
import { Field } from "../Field";
import { FormFooter } from "../FormFooter";
import { Modal } from "../Modal";
import { reloadPage } from "../reload";
import { SelectField } from "../SelectField";
import styles from "./PotForm.module.css";

export type PotFormBody = { name: string; target: number; theme: Theme };

/** The answers after which the form is done: the page closes it (201, 200) or shows the notice (404). */
export type PotFormDone = Extract<WriteAnswer<unknown>, { kind: "ok" | "gone" }>;

export type PotFormProps = {
  /** "add", or the pot being edited; `null` when closed. */
  mode: "add" | { edit: PotDto } | null;
  /** The page's pots, the last read (2.8): the name and theme checks read them. */
  pots: readonly PotDto[];
  /** `isPotNameTaken(name, pots, exceptId)` (`src/domain/pots.ts`, handed in: ADR-0002). */
  isNameTaken: (name: string, pots: readonly PotDto[], exceptId?: string) => boolean;
  /** `firstFreeTheme(used)`: the add form's opening theme, `null` with every theme used. */
  firstFreeTheme: (used: Iterable<Theme>) => Theme | null;
  onClose: () => void;
  /** The page's write function: `POST /api/pots` or `PATCH /api/pots/:id`. */
  onSubmit: (body: PotFormBody) => Promise<WriteAnswer<unknown>>;
  onDone: (answer: PotFormDone) => void;
  /** A 400 with a `taken`: the page refreshes its data, the form stays open (2.5, 2.8). */
  onStale: () => void;
  returnFocus?: () => HTMLElement | null;
};

type FieldName = "name" | "target" | "theme";
type Errors = Partial<Record<FieldName, string>>;

/** `write-path.md` 2.7: each field's server codes as its messages (SPEC-pots 2.5). */
const SERVER_MESSAGES: Record<FieldName, Partial<Record<string, string>>> = {
  name: {
    required: COPY.required,
    too_long: COPY.potNameTooLong,
    taken: COPY.potNameTaken,
    invalid_format: COPY.required,
  },
  target: {
    required: COPY.required,
    invalid_format: COPY.amountFormat,
    too_small: COPY.amountNotPositive,
    too_large: COPY.amountTooLarge,
  },
  theme: { required: COPY.required, invalid_format: COPY.required, taken: COPY.alreadyUsed },
};

const isFieldName = (value: unknown): value is FieldName =>
  value === "name" || value === "target" || value === "theme";

/**
 * SPEC-pots 2.5 (US-22, US-23; `ui-kit.md` 2.2, 2.5–2.7): "Add New Pot" and "Edit Pot" — Pot
 * Name with its live counter ("{N} characters left", `Field`'s `helper`, read from the `input`
 * events that bubble to the form; not a live region), Target and Theme. The fields are checked on
 * blur and on submit (Release 1's timing); the name against the page's other pots, trimmed and
 * case-insensitively. With every theme used (PO-Q4 (a)) the add form opens with no theme and "All
 * themes already have a pot", and submit sends nothing.
 */
export function PotForm({ mode, ...props }: PotFormProps) {
  if (mode === null) return null;
  const key = mode === "add" ? "add" : mode.edit.id;
  return <PotFormOpen key={key} mode={mode} {...props} />;
}

function PotFormOpen({
  mode,
  pots,
  isNameTaken,
  firstFreeTheme,
  onClose,
  onSubmit,
  onDone,
  onStale,
  returnFocus,
}: PotFormProps & { mode: NonNullable<PotFormProps["mode"]> }) {
  const id = useId();
  const editing = mode === "add" ? undefined : mode.edit;
  const nameRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sending = useRef(false);

  // The themes other pots hold: "Already used" (the pot's own stays selectable, US-23 AC1).
  const usedThemes = new Set(pots.filter((p) => p.id !== editing?.id).map((p) => p.theme));
  const allUsed = usedThemes.size >= THEMES.length;

  const [theme, setTheme] = useState<Theme | undefined>(
    () => editing?.theme ?? firstFreeTheme(usedThemes) ?? undefined,
  );
  const [nameLength, setNameLength] = useState(editing?.name.length ?? 0);
  const [errors, setErrors] = useState<Errors>(() =>
    allUsed && editing === undefined ? { theme: COPY.allThemesUsed } : {},
  );
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const checkName = (): string | undefined => {
    const name = nameRef.current?.value ?? "";
    if (name.trim() === "") return COPY.required;
    if (isNameTaken(name, pots, editing?.id)) return COPY.potNameTaken;
    return undefined;
  };
  const checkTarget = (): string | undefined => {
    const parsed = parseAmountInput(targetRef.current?.value ?? "");
    return parsed.ok ? undefined : AMOUNT_MESSAGES[parsed.code];
  };
  const checkTheme = (): string | undefined => {
    if (theme === undefined) return allUsed ? COPY.allThemesUsed : COPY.required;
    if (usedThemes.has(theme)) return COPY.alreadyUsed;
    return undefined;
  };

  const setOne = (field: FieldName, message: string | undefined) =>
    setErrors((current) => ({ ...current, [field]: message }));

  const focusField = (field: FieldName) => {
    if (field === "name") nameRef.current?.focus();
    else if (field === "target") targetRef.current?.focus();
    else formRef.current?.querySelector<HTMLElement>('[aria-haspopup="listbox"]')?.focus();
  };

  const showIssues = (issues: ErrorIssue[]) => {
    const found: Errors = {};
    for (const issue of issues) {
      const field = issue.path[0];
      if (!isFieldName(field) || found[field] !== undefined) continue;
      found[field] = SERVER_MESSAGES[field][issue.code] ?? COPY.signupFailed;
    }
    setErrors(found);
    const first = (["name", "target", "theme"] as const).find((f) => found[f] !== undefined);
    // An issue under no field is the form's own (ui-kit.md 2.7), never silence.
    if (first === undefined) setFormError(COPY.signupFailed);
    else focusField(first);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;
    const found: Errors = { name: checkName(), target: checkTarget(), theme: checkTheme() };
    const first = (["name", "target", "theme"] as const).find((f) => found[f] !== undefined);
    if (first !== undefined || theme === undefined) {
      flushSync(() => setErrors(found));
      focusField(first ?? "theme");
      return;
    }
    const target = parseAmountInput(targetRef.current?.value ?? "");
    if (!target.ok) return;
    sending.current = true;
    flushSync(() => {
      setErrors({});
      setFormError(undefined);
      setPending(true);
    });
    const answer = await onSubmit({
      name: (nameRef.current?.value ?? "").trim(),
      target: target.cents,
      theme,
    });
    sending.current = false;
    switch (answer.kind) {
      case "ok":
      case "gone":
        onDone(answer);
        return;
      case "reset":
        setFormError(COPY.dataWasReset);
        reloadPage();
        return;
      case "session":
        reloadPage();
        return;
      case "validation":
        setPending(false);
        showIssues(answer.issues);
        if (answer.issues.some((issue) => issue.code === "taken")) onStale();
        return;
      case "failed":
        setPending(false);
        setFormError(answer.message);
        return;
    }
  };

  const options = THEMES.map((value) => ({ value, label: value, used: usedThemes.has(value) }));

  return (
    <Modal
      open
      title={editing === undefined ? COPY.addNewPot : COPY.editPot}
      description={editing === undefined ? COPY.addPotDescription : COPY.editPotDescription}
      onClose={() => {
        if (!sending.current) onClose();
      }}
      dismissible={!pending}
      initialFocus={() => nameRef.current}
      returnFocus={returnFocus}
    >
      <form
        ref={formRef}
        className={styles.form}
        noValidate
        onSubmit={(event) => void submit(event)}
        onInput={(event) => {
          if (event.target === nameRef.current) setNameLength(nameRef.current.value.length);
        }}
      >
        <div className={styles.fields}>
          <Field
            id={`${id}-name`}
            name="name"
            label={COPY.potName}
            type="text"
            autoComplete="off"
            maxLength={POT_NAME_MAX}
            placeholder={COPY.potNamePlaceholder}
            defaultValue={editing?.name}
            helper={COPY.charactersLeft(Math.max(0, POT_NAME_MAX - nameLength))}
            error={errors.name}
            onBlur={() => setOne("name", checkName())}
            inputRef={nameRef}
          />
          <AmountField
            id={`${id}-target`}
            name="target"
            label={COPY.target}
            placeholder={COPY.amountPlaceholder}
            defaultValue={editing === undefined ? undefined : formatAmountInput(editing.target)}
            error={errors.target}
            onBlur={() => setOne("target", checkTarget())}
            inputRef={targetRef}
          />
          <SelectField
            label={COPY.theme}
            options={options}
            value={theme}
            onChange={setTheme}
            error={errors.theme}
            onBlur={() => setOne("theme", checkTheme())}
            themes
          />
        </div>
        <FormFooter
          label={editing === undefined ? COPY.addPotSubmit : COPY.saveChanges}
          pending={pending}
          error={formError}
        />
      </form>
    </Modal>
  );
}
