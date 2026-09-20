import type { NextConfig } from "next";

/**
 * SPEC-webmcp-tools §2.1 — `WEBMCP_MODE` is the documented knob; the client reads it as
 * `NEXT_PUBLIC_WEBMCP_MODE`. `APP_ENV=test` is exposed as `NEXT_PUBLIC_APP_ENV` for the
 * test hook. Both are resolved at build time, which is why they live here and not in the
 * WebMCP adapter (T-11).
 */
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_WEBMCP_MODE: process.env.WEBMCP_MODE ?? "polyfill",
    NEXT_PUBLIC_APP_ENV: process.env.APP_ENV ?? "development",
  },
};

export default nextConfig;
