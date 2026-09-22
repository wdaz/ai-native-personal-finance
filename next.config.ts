import type { NextConfig } from "next";

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
    NEXT_PUBLIC_WEBMCP_MODE: process.env.WEBMCP_MODE ?? "polyfill",
    NEXT_PUBLIC_APP_ENV: process.env.APP_ENV ?? "development",
  },
};

export default nextConfig;
