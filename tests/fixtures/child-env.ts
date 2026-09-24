/**
 * The environment for a child process a unit test starts. Dropped:
 * - `VITEST*` — the parent Vitest run sets them, and a nested Vitest would take itself for a worker;
 * - `NODE_V8_COVERAGE` — under `--coverage` a child would write into the parent's report;
 * - `npm_config_*`, in any case — `npm run` and `npx` export the resolved project configuration
 *   (this repository's `.npmrc` included) as environment variables, and a variable outranks a
 *   file, so a test that stages its own `.npmrc` would never see it decide anything (found in
 *   T-13's plan: the "without .npmrc" case stayed strict). npm reads its environment
 *   case-insensitively, so `NPM_CONFIG_STRICT_ALLOW_SCRIPTS=false` in a contributor's shell
 *   would defeat the same test.
 */
export function childEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const name of Object.keys(env)) {
    if (name.startsWith("VITEST") || /^npm_config_/i.test(name) || name === "NODE_V8_COVERAGE") {
      delete env[name];
    }
  }
  return env;
}
