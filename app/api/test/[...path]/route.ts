import { handleTestSupport } from "@/src/server/test-support";

/**
 * SPEC-reset-and-test-support §2.7. One catch-all route: src/server/test-support.ts holds
 * the table of routes, which is empty unless APP_ENV=test, so outside tests every
 * /api/test/* path answers 404.
 */
type Context = { params: Promise<{ path: string[] }> };

export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handleTestSupport("POST", (await params).path, request);
}

export async function GET(request: Request, { params }: Context): Promise<Response> {
  return handleTestSupport("GET", (await params).path, request);
}
