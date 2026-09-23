import { getDb } from "@/src/server/db";
import { errorResponse } from "@/src/server/http";
import { getMeta } from "@/src/server/meta";

/**
 * SPEC-app-shell §5: public and `no-store`. The middleware adds `no-store` to authenticated
 * pages only, so this route sets it itself (T-08 plan D11).
 */
export async function GET(): Promise<Response> {
  try {
    return Response.json(await getMeta(getDb()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/meta failed", error);
    return errorResponse(500, "server_error", "Meta is unavailable");
  }
}
