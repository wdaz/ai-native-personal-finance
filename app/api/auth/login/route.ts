import { login } from "@/src/server/auth";

export async function POST(request: Request): Promise<Response> {
  return login(request, new Date());
}
