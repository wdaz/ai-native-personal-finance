import type { NextConfig } from "next";
import { WEBMCP_MODES, testEnvRefusal } from "./src/shared/env";

// TD-10: `APP_ENV=test` makes the unauthenticated /api/test/* reset and seed routes exist and
// is inlined below as `NEXT_PUBLIC_APP_ENV`, so a build or a `next start` that would put it
// where a real database could be behind it stops here — on a Vercel deployment, or with a
// `DATABASE_URL` that names another machine. Not keyed on `NODE_ENV`: CI and every local
// API/E2E run build with `APP_ENV=test` and `NODE_ENV=production` (ADR-0003).
const testEnvProblem = testEnvRefusal(process.env);
if (testEnvProblem !== null) {
  throw new Error(testEnvProblem);
}

// `||`, not `??`: an empty WEBMCP_MODE is "polyfill" here too, as src/server/env.ts's
// configuredWebmcpMode reads it for GET /api/meta. An unknown value (a typo, "Polyfill") fails
// the build here rather than reaching runtime, where it would make getMeta throw and the reset
// banner disappear (T-08, PR #20 review).
const webmcpMode = process.env.WEBMCP_MODE || "polyfill";
if (!WEBMCP_MODES.some((mode) => mode === webmcpMode)) {
  throw new Error(
    `WEBMCP_MODE must be one of ${WEBMCP_MODES.join(", ")}, not "${webmcpMode}" (SPEC-webmcp-tools §2.1)`,
  );
}

/**
 * SPEC-webmcp-tools §2.1 — `WEBMCP_MODE` is the documented knob; the client reads it as
 * `NEXT_PUBLIC_WEBMCP_MODE`. `APP_ENV=test` is exposed as `NEXT_PUBLIC_APP_ENV` for the
 * test hook. Both are resolved at build time, which is why they live here and not in the
 * WebMCP adapter (T-11).
 */
const nextConfig: NextConfig = {
  // Next.js 16.3's `next dev` appends a managed "agent rules" block to AGENTS.md whenever it
  // detects a coding agent. AGENTS.md is this project's contract with its agents and changes
  // only by the owner's decision (AGENTS.md §2), so the feature is off.
  // tests/unit/next-config.test.ts holds it off.
  agentRules: false,
  env: {
    NEXT_PUBLIC_WEBMCP_MODE: webmcpMode,
    NEXT_PUBLIC_APP_ENV: process.env.APP_ENV ?? "development",
  },
};

export default nextConfig;
