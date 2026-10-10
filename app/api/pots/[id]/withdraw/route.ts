import { withdrawFromPot } from "@/src/server/pots";
import { guardedWrite } from "@/src/server/write";
import { PotMoneyMoveSchema } from "@/src/shared/schemas";

type Context = { params: Promise<{ id: string }> };

/** SPEC-pots 2.12 (US-26): out of the pot back to the Current Balance; `exceeds_total` or 404. */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  const { id } = await params;
  return guardedWrite(request, {
    now: new Date(),
    schema: PotMoneyMoveSchema,
    id,
    run: withdrawFromPot,
  });
}
