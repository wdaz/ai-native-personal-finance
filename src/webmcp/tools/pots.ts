import { z } from "zod";
import { apiGet, apiSend, type ApiOutcome } from "@/src/shared/api-client";
import {
  PotCreateSchema,
  PotMoneyMoveDtoSchema,
  PotMoneyMoveSchema,
  PotsDtoSchema,
  PotUpdateSchema,
  PotWriteDtoSchema,
  RecordIdSchema,
} from "@/src/shared/schemas";
import { VIA_HEADER, VIA_WEBMCP } from "@/src/shared/via";
import { runDeleteTool } from "../bus";
import { defineTool } from "../defineTool";
import { DEFAULT_TOOL_MESSAGE, fromApiOutcome, toolError, toolSuccess } from "../tool-result";
import type { ToolDefinition, ToolResult } from "../types";

/**
 * SPEC-pots 2.13: the Pots page's six tools. Every input is the route's shared schema with the
 * `id` added (NFR-Q2, `write-path.md` 2.11 (3)); every write goes through the write client with
 * `X-Via: webmcp` (US-40 AC3), so it is on record with its method. `delete_pot` goes through the
 * page's own dialog (the bus, `ui-kit.md` 2.3); nothing is deleted without the person's confirm.
 */
const VIA = { [VIA_HEADER]: VIA_WEBMCP };

const IdInput = z.object({ id: RecordIdSchema });
const EditPotInput = PotUpdateSchema.extend({ id: RecordIdSchema });
const MoneyMoveInput = PotMoneyMoveSchema.extend({ id: RecordIdSchema });

const potPath = (id: string) => `/api/pots/${encodeURIComponent(id)}`;

/** A write's answer as the tool's: the DTO plus the currency, or §2.5's mapped error. */
function writeResult<T extends Record<string, unknown>>(outcome: ApiOutcome<T | null>): ToolResult {
  return fromApiOutcome(outcome, (data) =>
    data === null
      ? toolError("server_error", DEFAULT_TOOL_MESSAGE.server_error)
      : toolSuccess(data),
  );
}

export const listPots = defineTool({
  name: "list_pots",
  title: "List pots",
  description:
    "Lists the demo account's pots in creation order: name, theme, total saved, target and percentage, plus the current balance. Money in USD cents. Available on the Pots page.",
  input: z.object({}),
  // US-39 AC3: the names are user-entered text (R-24). A read tool carries no consequentialHint.
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute() {
    const outcome = await apiGet("/api/pots", PotsDtoSchema, { headers: VIA });
    return fromApiOutcome(outcome, (dto) => toolSuccess(dto));
  },
});

export const addPot = defineTool({
  name: "add_pot",
  title: "Add pot",
  description:
    "Creates a pot from a name (unique, up to 30 characters), a target in USD cents and an unused theme. It starts with $0 saved. Available on the Pots page.",
  input: PotCreateSchema,
  annotations: { consequentialHint: true, untrustedContentHint: true },
  async execute({ input }) {
    return writeResult(
      await apiSend("POST", "/api/pots", PotWriteDtoSchema, { body: input, headers: VIA }),
    );
  },
});

export const editPot = defineTool({
  name: "edit_pot",
  title: "Edit pot",
  description:
    "Changes a pot by id; send all three: its name, target in USD cents and theme. Its total saved does not change. Available on the Pots page.",
  input: EditPotInput,
  annotations: { consequentialHint: true, untrustedContentHint: true },
  async execute({ input: { id, ...body } }) {
    return writeResult(
      await apiSend("PATCH", potPath(id), PotWriteDtoSchema, { body, headers: VIA }),
    );
  },
});

export const deletePot = defineTool({
  name: "delete_pot",
  title: "Delete pot",
  description:
    "Asks the person to confirm on screen, then deletes a pot by id; its total goes back to the current balance. Nothing is deleted without that confirmation. Available on the Pots page.",
  input: IdInput,
  // It returns `{ deleted: true }`, no user-entered text, so no untrustedContentHint (2.13).
  annotations: { consequentialHint: true },
  async execute({ input, signal }) {
    return runDeleteTool("pot", input.id, signal);
  },
});

export const addMoneyToPot = defineTool({
  name: "add_money_to_pot",
  title: "Add money to pot",
  description:
    "Moves an amount in USD cents from the current balance into a pot, by id. It may not exceed the current balance. Available on the Pots page.",
  input: MoneyMoveInput,
  annotations: { consequentialHint: true, untrustedContentHint: true },
  async execute({ input: { id, amount } }) {
    return writeResult(
      await apiSend("POST", `${potPath(id)}/deposit`, PotMoneyMoveDtoSchema, {
        body: { amount },
        headers: VIA,
      }),
    );
  },
});

export const withdrawFromPot = defineTool({
  name: "withdraw_from_pot",
  title: "Withdraw from pot",
  description:
    "Moves an amount in USD cents out of a pot back to the current balance, by id. It may not exceed the pot's total. Available on the Pots page.",
  input: MoneyMoveInput,
  annotations: { consequentialHint: true, untrustedContentHint: true },
  async execute({ input: { id, amount } }) {
    return writeResult(
      await apiSend("POST", `${potPath(id)}/withdraw`, PotMoneyMoveDtoSchema, {
        body: { amount },
        headers: VIA,
      }),
    );
  },
});

/** The four tools whose success `PotsTools` follows with `router.refresh()` (2.8). */
export const POT_WRITE_TOOL_NAMES: ReadonlySet<string> = new Set([
  addPot.name,
  editPot.name,
  addMoneyToPot.name,
  withdrawFromPot.name,
]);

export const potsTools: ToolDefinition[] = [
  listPots,
  addPot,
  editPot,
  deletePot,
  addMoneyToPot,
  withdrawFromPot,
];
