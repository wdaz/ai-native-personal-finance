import { depositToPot } from "@/src/server/pots";
import { guardedWrite } from "@/src/server/write";
import { PotMoneyMoveSchema } from "@/src/shared/schemas";

type Context = { params: Promise<{ id: string }> };

/** SPEC-pots 2.12 (US-25): from the Current Balance into the pot; `exceeds_balance` or 404. */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  const { id } = await params;
  return guardedWrite(request, {
    now: new Date(),
    schema: PotMoneyMoveSchema,
    id,
    run: depositToPot,
  });
}
