/**
 * Temporary scaffold route. SPEC-auth §2.8 gives `/` to the middleware in T-05
 * (`/` → `/overview` or `/login`); this page exists only so `next build` has a route
 * and the T-01 smoke test has a URL.
 */
export default function ScaffoldPage() {
  return (
    <main>
      <h1>Personal Finance — scaffold</h1>
      <p>Release 1 build starts at T-02. See docs/03-specs/backlog.md.</p>
    </main>
  );
}
