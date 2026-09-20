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

## Why the imports point at README files

`boundaries/dependencies` classifies an import by the path it _resolves to_; an import
that does not resolve is treated as external and is allowed by policy. The target
therefore has to exist. `src/server` and `src/domain` hold no modules yet — T-02 and T-04
add them — so the fixtures import the only files those folders contain. The layer is what
is being asserted, not the module's contents, and a side-effect import states that
plainly. Point them at real modules once those exist.

If one of those targets is ever deleted the import stops resolving, the rule stops
firing, and the test fails loudly rather than the guarantee lapsing in silence.
