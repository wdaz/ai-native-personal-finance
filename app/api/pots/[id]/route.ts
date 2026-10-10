import { deletePot, updatePot } from "@/src/server/pots";
import { guardedWrite } from "@/src/server/write";
import { PotUpdateSchema } from "@/src/shared/schemas";

type Context = { params: Promise<{ id: string }> };

/** SPEC-pots 2.12: all three fields; the total unchanged; 404 for no such pot. */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  const { id } = await params;
  return guardedWrite(request, { now: new Date(), schema: PotUpdateSchema, id, run: updatePot });
}

/** SPEC-pots 2.7, 2.12: 204 with the total back in the balance, or 404; no body is read. */
export async function DELETE(request: Request, { params }: Context): Promise<Response> {
  const { id } = await params;
  return guardedWrite(request, { now: new Date(), id, run: deletePot });
}
