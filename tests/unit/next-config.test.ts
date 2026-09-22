import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import loadConfig from "next/dist/server/config";
import { describe, expect, it } from "vitest";

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
