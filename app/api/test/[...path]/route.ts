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

// Next.js implements OPTIONS itself and answers 405 to PUT/PATCH/DELETE unless a route
// exports them; the route table has no entries for these methods, so delegating them like
// POST/GET above answers the same 404 envelope everywhere, and outside test every method
// does (SPEC-reset-and-test-support §2.7: the routes "do not exist — 404").
export async function PUT(request: Request, { params }: Context): Promise<Response> {
  return handleTestSupport("PUT", (await params).path, request);
}

export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handleTestSupport("PATCH", (await params).path, request);
}

export async function DELETE(request: Request, { params }: Context): Promise<Response> {
  return handleTestSupport("DELETE", (await params).path, request);
}

export async function OPTIONS(request: Request, { params }: Context): Promise<Response> {
  return handleTestSupport("OPTIONS", (await params).path, request);
}
