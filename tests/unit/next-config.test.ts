import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import loadConfig from "next/dist/server/config";
import { describe, expect, it } from "vitest";
import { configuredWebmcpMode } from "@/src/server/env";

const repoRoot = join(import.meta.dirname, "..", "..");

/**
 * A copy of next.config.ts in a fresh temp dir. Its relative import of src/shared/env is
 * pointed back at the repository, and each copy has its own path, because Next caches a
 * loaded config module by path.
 */
const configCopy = (configSource: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "pf-next-config-"));
  const pointed = configSource.replace(
    '"./src/shared/env"',
    JSON.stringify(join(repoRoot, "src", "shared", "env")),
  );
  writeFileSync(join(dir, "next.config.ts"), pointed);
  return dir;
};

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
    expect(await nextDevWritesAgentFiles(configCopy(withoutSetting))).toBe(true);
  });
});

describe("next.config.ts and the server read WEBMCP_MODE the same way (T-08, PR #20 review, finding 5)", () => {
  const source = readFileSync(join(repoRoot, "next.config.ts"), "utf8");

  const clientMode = async (configSource: string, value: string | undefined) => {
    const dir = configCopy(configSource);
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
    const withNullish = source
      .replace('process.env.WEBMCP_MODE || "polyfill"', 'process.env.WEBMCP_MODE ?? "polyfill"')
      .replace(/if \(!WEBMCP_MODES[\s\S]*?\n\}\n/, "");
    expect(withNullish).not.toBe(source);
    expect(await clientMode(withNullish, "")).toBe("");
    expect(configuredWebmcpMode({ WEBMCP_MODE: "" })).toBe("polyfill");
  });

  it.each(["Polyfill", " polyfill", "native ", "on"])(
    "PR #20 review: WEBMCP_MODE=%j fails the build instead of hiding the banner at runtime",
    async (value) => {
      await expect(clientMode(source, value)).rejects.toThrow(/WEBMCP_MODE must be one of/);
      expect(() => configuredWebmcpMode({ WEBMCP_MODE: value })).toThrow(/WEBMCP_MODE/);
    },
  );

  it("would let a typo through without the check (violation fixture, DoD v1.1)", async () => {
    const unchecked = source.replace(/if \(!WEBMCP_MODES[\s\S]*?\n\}\n/, "");
    expect(unchecked).not.toBe(source);
    expect(await clientMode(unchecked, "Polyfill")).toBe("Polyfill");
  });
});

describe("next.config.ts refuses APP_ENV=test where a real database could be behind it (TD-10)", () => {
  const source = readFileSync(join(repoRoot, "next.config.ts"), "utf8");
  const local = "postgresql://postgres:postgres@localhost:5432/personal_finance";
  const neon = "postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb";

  /**
   * Loads a config copy with exactly these five variables set (others left as they are) — the
   * guard reads `DATABASE_URL_UNPOOLED` too (T-14), so a contributor's exported value must not decide.
   */
  const loadWith = async (
    configSource: string,
    env: Partial<
      Record<"APP_ENV" | "VERCEL" | "VERCEL_ENV" | "DATABASE_URL" | "DATABASE_URL_UNPOOLED", string>
    >,
  ) => {
    const names = [
      "APP_ENV",
      "VERCEL",
      "VERCEL_ENV",
      "DATABASE_URL",
      "DATABASE_URL_UNPOOLED",
    ] as const;
    const saved = names.map((name) => [name, process.env[name]] as const);
    for (const name of names) {
      const value = env[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    try {
      return await loadConfig(PHASE_DEVELOPMENT_SERVER, configCopy(configSource), { silent: true });
    } finally {
      for (const [name, value] of saved) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  };

  it("does not build with APP_ENV=test on a Vercel deployment", async () => {
    await expect(loadWith(source, { APP_ENV: "test", VERCEL: "1" })).rejects.toThrow(
      /APP_ENV=test on a Vercel deployment/,
    );
  });

  it("does not build with APP_ENV=test and another machine's DATABASE_URL", async () => {
    await expect(loadWith(source, { APP_ENV: "test", DATABASE_URL: neon })).rejects.toThrow(
      /APP_ENV=test with a DATABASE_URL or DATABASE_URL_UNPOOLED that does not name this machine/,
    );
  });

  it("builds with APP_ENV=test against the local database, and inlines it for the test hook", async () => {
    const config = await loadWith(source, { APP_ENV: "test", DATABASE_URL: local });
    expect(config.env?.NEXT_PUBLIC_APP_ENV).toBe("test");
  });

  it("builds a deployment that does not set APP_ENV=test (the control for the cases above)", async () => {
    const config = await loadWith(source, {
      VERCEL: "1",
      VERCEL_ENV: "production",
      DATABASE_URL: neon,
    });
    expect(config.env?.NEXT_PUBLIC_APP_ENV).toBe("development");
  });

  it("would let a deployment build with APP_ENV=test without the check (violation fixture, DoD v1.1)", async () => {
    const unchecked = source.replace(/const testEnvProblem[\s\S]*?\n\}\n/, "");
    expect(unchecked).not.toBe(source);
    const config = await loadWith(unchecked, { APP_ENV: "test", VERCEL: "1", DATABASE_URL: neon });
    expect(config.env?.NEXT_PUBLIC_APP_ENV).toBe("test");
  });
});
