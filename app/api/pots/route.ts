import { createPot, getPots } from "@/src/server/pots";
import { getDb } from "@/src/server/db";
import { errorResponse } from "@/src/server/http";
import { guardedWrite } from "@/src/server/write";
import { PotCreateSchema } from "@/src/shared/schemas";

/**
 * SPEC-pots 2.12: a read route (SPEC-write-path 2.1). The proxy answers 401 before this handler
 * runs; any query is ignored. Every answer is `no-store`: set here on the 200, by the helper on the
 * 500.
 */
export async function GET(): Promise<Response> {
  try {
    const pots = await getPots(getDb());
    return Response.json(pots, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/pots failed", error);
    return errorResponse(500, "server_error", "The pots are unavailable");
  }
}

/** SPEC-pots 2.12: a pot is created through the write pipeline (SPEC-write-path 2.2). */
export async function POST(request: Request): Promise<Response> {
  return guardedWrite(request, { now: new Date(), schema: PotCreateSchema, run: createPot });
}
