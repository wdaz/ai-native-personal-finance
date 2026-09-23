# app/(auth)

Unauthenticated route group: `/login`, `/signup` (SPEC-auth §6 UI).

No `WebMcpProvider` is mounted here (SPEC-webmcp-tools §2.3).

T-06: `layout.tsx` (illustration panel ≥ 1024 px, logo bar below; `connection()` renders
every response per request so Next can apply the CSP nonce — ADR-0006), `auth.module.css`
(the card both pages share), `login/` (`page.tsx`, `LoginForm`, `DemoBox`) and `signup/`
(`page.tsx`, `SignupForm`). The demo credentials are read on the server
(`demoCredentials()` in `src/server/env.ts`) and passed to the client components as props.
