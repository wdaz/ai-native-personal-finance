import { afterEach, describe, expect, it } from "vitest";
import { childEnv } from "../fixtures/child-env";

const set: string[] = [];
afterEach(() => {
  for (const name of set.splice(0)) delete process.env[name];
});
function setEnv(name: string, value: string): void {
  process.env[name] = value;
  set.push(name);
}

/** T-13: what a child process a unit test starts must not inherit from the parent run. */
describe("childEnv()", () => {
  it("drops npm_config_* in either case, because npm reads its environment case-insensitively", () => {
    setEnv("npm_config_strict_allow_scripts", "true");
    setEnv("NPM_CONFIG_STRICT_ALLOW_SCRIPTS", "false");
    setEnv("Npm_Config_Registry", "https://example.invalid");
    const env = childEnv();
    expect(Object.keys(env).filter((name) => /^npm_config_/i.test(name))).toEqual([]);
  });

  it("drops VITEST* and NODE_V8_COVERAGE", () => {
    setEnv("VITEST_WORKER_ID", "1");
    setEnv("NODE_V8_COVERAGE", "/tmp/coverage");
    const env = childEnv();
    expect(env.VITEST_WORKER_ID).toBeUndefined();
    expect(env.NODE_V8_COVERAGE).toBeUndefined();
  });

  it("keeps everything else, PATH included", () => {
    setEnv("CHILD_ENV_TEST_KEEP", "yes");
    const env = childEnv();
    expect(env.CHILD_ENV_TEST_KEEP).toBe("yes");
    expect(env.PATH).toBe(process.env.PATH);
  });
});
