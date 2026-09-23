import { logout } from "@/src/server/auth";

export async function POST(): Promise<Response> {
  return logout();
}
