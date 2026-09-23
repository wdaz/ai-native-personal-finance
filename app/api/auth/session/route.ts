import { session } from "@/src/server/auth";

export async function GET(request: Request): Promise<Response> {
  return session(request, new Date());
}
