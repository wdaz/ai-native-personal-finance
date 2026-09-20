# tests/api

Playwright `request`-context tests against route handlers and a seeded test database
(ADR-0003). One file per resource; asserts status, body schema (Zod), side effects.

Run: `npm run test:api`. Empty until T-05, which is why the script passes
`--pass-with-no-tests`.
