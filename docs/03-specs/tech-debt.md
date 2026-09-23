# Tech debt — Release 1

Status: **Approved** (v1.0 — 2026-09-23, owner decision at the T-06 plan gate: tech debt lives in its own file, linked from `backlog.md`, so the link is never lost) · Author(s): Agent · Date: 2026-09-23

Known shortcuts and fragilities the owner has decided to keep for now. Every entry has an id
(`TD-n`), where it was found, the owner's decision, the risk, what guards it meanwhile, the
fix, and the task expected to pick it up. `backlog.md` links here from its Notes. A task that
touches a file an entry names reads the entry first; the task that fixes an entry marks it
**Closed** here — with the date and the PR — and never deletes it.

| Id | Title | Status | Picked up by |
|----|-------|--------|--------------|
| TD-1 | The CSP nonce reaches Next through an undocumented header copy | Open | the first task that changes `middleware.ts` — TD-2 is the natural one |
| TD-2 | `middleware.ts` uses a deprecated file convention (`proxy`) | Open | a small follow-up task, before Next removes the old convention |
| TD-3 | `/_global-error` is prerendered, without the CSP nonce | Open | whichever task first gives the app an error UI of its own |

## TD-1 — The CSP nonce reaches Next through an undocumented header copy

- **Found:** 2026-09-23, T-06 plan finding F2 — by the subagent that prepared F1 (PR #15), and
  checked by the planning session in Next's own source.
- **Owner decision:** 2026-09-23 — recorded as tech debt and kept in the backlog; not fixed
  before T-06 ("F2 tapıntısı techdeptdə yazılır. Və backlogda saxlanılır.").
- **What:** Next 16.3.5 takes the nonce it puts on its own inline `<script>`/`<style>` tags from
  the **request's** `Content-Security-Policy` header
  (`node_modules/next/dist/server/app-render/app-render.js:209-210`: `headers['content-security-policy']` →
  `getScriptNonceFromHeader`). `middleware.ts` sets that header on the **response** only, and
  forwards `x-nonce`, which the renderer never reads. It works today because Next's router also
  copies middleware response headers onto the request — behaviour Next does not document.
- **Risk:** a Next upgrade that stops the copy renders every page without the nonce; the CSP then
  blocks Next's inline scripts and styles and client-side JavaScript is dead — the failure T-05's
  review found as C2.
- **Guarded meanwhile by:** `tests/api/middleware.spec.ts` (F1, PR #15: every inline tag of a 404
  page carries the response's nonce) and T-06's `tests/api/auth-pages.spec.ts` and E2E CSP
  guard — all fail the day the copy stops.
- **Fix:** also set the `Content-Security-Policy` on the forwarded request headers, as Next's own
  content-security-policy guide does; keep forwarding `x-nonce` for any `<Script>` that reads it
  with `headers()`; correct the comment in `middleware.ts`. ADR-0006's wording was already
  corrected (dated note of 2026-09-23).

## TD-2 — `middleware.ts` uses a deprecated file convention

- **Found:** 2026-09-23, during T-05 — every `next build` prints a deprecation warning for the
  `middleware` file convention: "Please use 'proxy' instead" (codemod: `npx @next/codemod@canary
  middleware-to-proxy`). Recorded then only in the process log (T-05 entry, "Next"); moved here
  when this file was created, so it has a home.
- **Owner decision:** none yet beyond T-05's "worth a follow-up task" — listed here so it is not
  lost.
- **Risk:** a Next major that removes the old convention breaks the route matrix, the session
  check, the reset-epoch check and the CSP at once.
- **Guarded meanwhile by:** the API suite (`tests/api/middleware.spec.ts`, `auth.spec.ts`) and the
  E2E suite, which fail on any of those.
- **Fix:** run the codemod, keep `runtime: "nodejs"` and the matcher, re-run the API and E2E
  suites; fold TD-1's fix into the same change.

## TD-3 — `/_global-error` is prerendered, without the CSP nonce

- **Found:** 2026-09-23, F1 (PR #15) — its known limitation. Next's `/_global-error` page is built
  at build time with inline `<script>`/`<style>` tags and `style` attributes that carry no
  nonce, so under ADR-0006's CSP it would render unstyled and without client JavaScript. A
  `global-error.tsx` has to be a client component and cannot call `connection()`, and
  `connection()` in the root layout did not change it.
- **Owner decision:** none yet — listed here so it is not lost.
- **Risk:** low — the page renders only when the root layout itself throws; the user sees an
  unstyled error instead of a styled one.
- **Guarded meanwhile by:** nothing automatic; it is not reachable by a normal request.
- **Fix:** to be found — an `app/global-error.tsx` without `style` attributes still leaves the
  prerendered inline scripts; worth a look when a task first adds an error UI.
