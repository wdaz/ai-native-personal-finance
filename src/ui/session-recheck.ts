import { SessionResponseSchema } from "@/src/shared/schemas";

/**
 * SPEC-auth §2.9, US-03 AC1: a page the browser restores from its back/forward cache sends no
 * request, so the proxy never sees it. The shell asks `GET /api/auth/session` instead.
 * `true` means the session has ended. A failed or unreadable answer keeps the page (plan D9):
 * its next navigation goes through the proxy anyway. Parsing with the shared schema also
 * loads `schemas.ts`, which sets Zod's `jitless` on this client path (TD-5).
 */
export async function sessionHasEnded(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetcher("/api/auth/session", { cache: "no-store" });
    const body = SessionResponseSchema.safeParse(await response.json());
    return body.success && !body.data.authenticated;
  } catch {
    return false;
  }
}

/**
 * Listens for `pageshow` on `target`; on a restore (`persisted`) whose session has ended, calls
 * `leave("/login")` — `location.replace` in the app. Returns the unsubscribe.
 */
export function recheckSessionOnRestore(
  target: Window,
  leave: (path: string) => void,
  fetcher?: typeof fetch,
): () => void {
  const onPageshow = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    void sessionHasEnded(fetcher).then((ended) => {
      if (ended) leave("/login");
    });
  };
  target.addEventListener("pageshow", onPageshow);
  return () => target.removeEventListener("pageshow", onPageshow);
}
