import next from "eslint-config-next/core-web-vitals";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";

/**
 * Import boundaries are the machine-readable form of ADR-0002:
 *   domain  imports nothing from app, server, webmcp
 *   shared  imports nothing from the rest
 *   app     never imports Prisma directly (only server)
 *   webmcp  imports only shared and calls the HTTP API
 * ADR-0005 adds: no `new Date()` in domain or server business code.
 */
const config = [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "docs/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["app/**/*", "src/**/*", "tests/**/*", "scripts/**/*"],
      // `partialMatch: false` makes the pattern match the whole file path. The pattern
      // must end in `/**` and not `/**/*`: the latter requires a segment after `**`, so
      // `src/domain/clock.ts` would be classified as unknown and every rule below would
      // silently pass. Both forms were checked against a deliberate violation.
      "boundaries/elements": [
        { type: "app", partialMatch: false, pattern: "app/**" },
        { type: "domain", partialMatch: false, pattern: "src/domain/**" },
        { type: "shared", partialMatch: false, pattern: "src/shared/**" },
        { type: "server", partialMatch: false, pattern: "src/server/**" },
        { type: "webmcp", partialMatch: false, pattern: "src/webmcp/**" },
        { type: "ui", partialMatch: false, pattern: "src/ui/**" },
        { type: "tests", partialMatch: false, pattern: "tests/**" },
        { type: "scripts", partialMatch: false, pattern: "scripts/**" },
      ],
    },
    rules: {
      "boundaries/no-unknown-files": "off",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message: "ADR-0002: {{from.element.type}} must not import {{to.element.type}}.",
          policies: [
            // Anything may use external packages; the layers below constrain internal
            // imports only. ADR-0002 says nothing about npm dependencies.
            { allow: { to: { module: { origin: "external" } } } },
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["app", "domain", "shared", "server", "webmcp", "ui"] },
                  },
                },
              },
            },
            {
              from: { element: { type: "domain" } },
              allow: { to: { element: { types: { anyOf: ["domain", "shared"] } } } },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "server" } },
              allow: { to: { element: { types: { anyOf: ["server", "domain", "shared"] } } } },
            },
            {
              from: { element: { type: "webmcp" } },
              allow: { to: { element: { types: { anyOf: ["webmcp", "shared"] } } } },
            },
            {
              from: { element: { type: "ui" } },
              allow: { to: { element: { types: { anyOf: ["ui", "shared"] } } } },
            },
            {
              from: { element: { type: "tests" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: [
                        "tests",
                        "app",
                        "domain",
                        "shared",
                        "server",
                        "webmcp",
                        "ui",
                        "scripts",
                      ],
                    },
                  },
                },
              },
            },
            // ADR-0002 clarification 2026-09-20: scripts import shared/domain only.
            {
              from: { element: { type: "scripts" } },
              allow: { to: { element: { types: { anyOf: ["scripts", "domain", "shared"] } } } },
            },
          ],
        },
      ],
    },
  },
  {
    // ADR-0002: "app never imports Prisma directly (only server)".
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message: "ADR-0002: app must reach the database through src/server.",
            },
          ],
          patterns: [
            {
              group: ["**/prisma/**", "prisma/*"],
              message: "ADR-0002: app must reach the database through src/server.",
            },
          ],
        },
      ],
    },
  },
  {
    // ADR-0005: business time is injected, never read from the wall clock.
    files: ["src/domain/**/*.ts", "src/server/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message:
            "ADR-0005: inject a Clock instead of calling new Date() in domain/server business code.",
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: "ADR-0005: inject a Clock instead of calling Date.now().",
        },
      ],
    },
  },
  prettier,
];

export default config;
