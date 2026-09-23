import { signup } from "@/src/server/auth";

export async function POST(request: Request): Promise<Response> {
  return signup(request);
}
