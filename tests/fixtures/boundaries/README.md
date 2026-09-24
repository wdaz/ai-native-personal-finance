# tests/fixtures/boundaries

Deliberately illegal source files, used by `tests/unit/boundaries.test.ts` to prove that
the lint rules in `eslint.config.mjs` still fire. ADR-0002's Consequences say "CI must
fail on violations", and during T-01 those rules disabled themselves three times without
`eslint` ever exiting non-zero: a missing element `mode`, an element pattern ending in
`/**/*` that classified every file as unknown, and a resolver that could not load, which
turned `@/`-aliased imports into external modules. Each time the only symptom was silence.

## How the fixtures are run

The extension is `.ts.fixture`, not `.ts`, so `eslint .`, `tsc --noEmit`, Prettier and
Vitest's own `include` all pass them by. The test reads each file and hands it to
`ESLint#lintText` with a `filePath` that says where the code _pretends_ to live —
`src/domain/…`, `app/…`, `src/ui/…`. That path is the whole input to the layer
classification, so the fixtures exercise the real config, the real `tsconfig.json` alias
and the real resolver, without a single illegal file existing in the tree.

## What is covered

Every rule ADR-0002, ADR-0003 (test ids) and ADR-0005 state has at least one fixture that
violates it, and every layer pair they permit has one that must stay silent. The two halves
matter equally: a config that reported nothing would pass no violation case, and a config
that reported everything would pass no control.

| Violates                                   | Fixtures                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `domain` → `server`, `app`, `webmcp`       | relative and `@/`-aliased server imports, plus app and webmcp                                                                         |
| `shared` → anything else                   | `domain`, `server`                                                                                                                    |
| `webmcp` → anything but `shared`           | `server`                                                                                                                              |
| `scripts` → anything but `shared`/`domain` | `server`                                                                                                                              |
| Prisma outside `src/server`                | from `app` (`@prisma/client`, the `/edge` sub-path and the generated client in `src/server/generated/prisma`), `src/ui`, `src/shared` |
| ADR-0005's clock rule                      | `new Date()`, `Date()` and `Date.now()`, in `src/domain` **and** `src/server`                                                         |
| ADR-0003's test-id rule                    | a string as `data-testid` in `src/ui` and as `getByTestId`'s argument in `tests/e2e`                                                  |

| Must report nothing                                                   | Fixture                                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------- |
| `domain` → `shared`                                                   | `domain-imports-shared-allowed`                           |
| `app` → `server`                                                      | `app-imports-server-allowed`                              |
| `server` → `domain`                                                   | `server-imports-domain-allowed`                           |
| `scripts` → `shared`                                                  | `scripts-imports-shared-allowed`                          |
| `scripts` → `domain`                                                  | `scripts-imports-domain-allowed`                          |
| `webmcp` → `shared`                                                   | `webmcp-imports-shared-allowed`                           |
| `new Date(<value>)` in `domain` — a fixed date, not the clock         | `domain-parses-date-allowed`                              |
| a `data-testid` taken from `TEST_IDS`, in `src/ui` and in `tests/e2e` | `ui-shared-test-id-allowed`, `e2e-shared-test-id-allowed` |

The violation cases also assert `severity === 2`. ADR-0002 says "CI must fail on
violations"; a rule demoted to a warning would still be reported, and `eslint` would still
exit 0 were `--max-warnings 0` ever dropped from the `lint` script.

## Why some imports point at README files

`boundaries/dependencies` classifies an import by the path it _resolves to_; an import
that does not resolve is treated as external and is allowed by policy. The target
therefore has to exist. `src/server`, `src/domain` and `src/webmcp` hold modules since T-02,
T-03 and T-11, and their fixtures import `src/server/db`, `src/domain/clock` and
`src/webmcp/adapter`; `app/(app)` holds a real layout and pages by now too, but nothing here
has repointed its fixture yet (`domain-imports-app.ts.fixture` still imports
`app/(app)/README.md` — pre-existing, not a T-11 change). The layer is what is being
asserted, not the module's contents, and a side-effect import states that plainly.

If one of those targets is ever deleted the import stops resolving, the rule stops
firing, and the test fails loudly rather than the guarantee lapsing in silence.
