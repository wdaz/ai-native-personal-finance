import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import loadConfig from "next/dist/server/config";
import { describe, expect, it } from "vitest";
import { configuredWebmcpMode } from "@/src/server/env";

const repoRoot = join(import.meta.dirname, "..", "..");

/**
 * `next dev` (Next.js 16.3) appends a managed block to AGENTS.md when it detects a coding
 * agent, unless the loaded config has `agentRules === false` — the exact test in
 * node_modules/next/dist/server/lib/start-server.js is `initResult.agentRules !== false`.
 * The config is read through Next's own loader, so a Next.js upgrade that renames or drops
 * the option shows up here rather than as an edited AGENTS.md.
 */
const nextDevWritesAgentFiles = async (dir: string) =>
  (await loadConfig(PHASE_DEVELOPMENT_SERVER, dir, { silent: true })).agentRules !== false;

describe("next.config.ts keeps next dev away from AGENTS.md", () => {
  const source = readFileSync(join(repoRoot, "next.config.ts"), "utf8");

  it("turns agentRules off", async () => {
    expect(await nextDevWritesAgentFiles(repoRoot)).toBe(false);
  });

  it("would report the same config without the setting (violation fixture, DoD v1.1)", async () => {
    const withoutSetting = source.replace(/^\s*agentRules: false,\n/m, "");
    expect(withoutSetting).not.toBe(source);
    const dir = mkdtempSync(join(tmpdir(), "pf-next-config-"));
    writeFileSync(join(dir, "next.config.ts"), withoutSetting);
    expect(await nextDevWritesAgentFiles(dir)).toBe(true);
  });
});

describe("next.config.ts and the server read WEBMCP_MODE the same way (T-08, PR #20 review, finding 5)", () => {
  const source = readFileSync(join(repoRoot, "next.config.ts"), "utf8");

  // Next caches a loaded config module by path, so every read gets a fresh copy in its own dir.
  const clientMode = async (configSource: string, value: string | undefined) => {
    const dir = mkdtempSync(join(tmpdir(), "pf-next-config-"));
    writeFileSync(join(dir, "next.config.ts"), configSource);
    const saved = process.env.WEBMCP_MODE;
    if (value === undefined) delete process.env.WEBMCP_MODE;
    else process.env.WEBMCP_MODE = value;
    try {
      const config = await loadConfig(PHASE_DEVELOPMENT_SERVER, dir, { silent: true });
      return config.env?.NEXT_PUBLIC_WEBMCP_MODE;
    } finally {
      if (saved === undefined) delete process.env.WEBMCP_MODE;
      else process.env.WEBMCP_MODE = saved;
    }
  };

  it.each([undefined, "", "off", "native"])(
    "WEBMCP_MODE=%j gives the client what configuredWebmcpMode gives GET /api/meta",
    async (value) => {
      expect(await clientMode(source, value)).toBe(
        configuredWebmcpMode(value === undefined ? {} : { WEBMCP_MODE: value }),
      );
    },
  );

  it("would report `??` treating an empty value differently (violation fixture, DoD v1.1)", async () => {
    const withNullish = source.replace(
      'process.env.WEBMCP_MODE || "polyfill"',
      'process.env.WEBMCP_MODE ?? "polyfill"',
    );
    expect(withNullish).not.toBe(source);
    expect(await clientMode(withNullish, "")).toBe("");
    expect(configuredWebmcpMode({ WEBMCP_MODE: "" })).toBe("polyfill");
  });
});
