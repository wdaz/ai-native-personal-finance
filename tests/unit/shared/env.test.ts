import { describe, expect, it } from "vitest";
import {
  isLocalDatabaseUrl,
  localDatabaseRefusal,
  migrationDatabaseUrl,
  testEnvRefusal,
} from "@/src/shared/env";

const LOCAL_URLS = [
  "postgresql://postgres:postgres@localhost:5432/personal_finance",
  "postgres://postgres:postgres@127.0.0.1:5432/personal_finance",
  "postgresql://postgres:password@[::1]:5432/personal_finance",
  "postgresql://postgres:password@LOCALHOST/personal_finance?sslmode=disable",
  "postgresql://localhost/personal_finance",
];

/** Hosts that only look local, and one real Neon-shaped URL — every one must be refused. */
const NOT_LOCAL_URLS = [
  "postgresql://user:password@ep-cool-name-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  "postgresql://user:password@db.example.com:5432/personal_finance",
  "postgresql://user:password@localhost.example.com/personal_finance",
  "postgresql://user:password@notlocalhost/personal_finance",
  "postgresql://user:password@127.0.0.1.nip.io/personal_finance",
  "postgresql://user:password@127.0.0.2/personal_finance",
  // userinfo, not host: this connects to prod.example.com
  "postgresql://localhost:password@prod.example.com/personal_finance",
  // node-postgres reads ?host= over the URL's own host (measured 2026-09-24)
  "postgresql://user:password@localhost/personal_finance?host=prod.example.com",
  "postgresql://user:password@localhost/personal_finance?hostaddr=10.0.0.5",
  // node-postgres re-encodes a value with whitespace or a malformed % escape and parses it as a
  // different URL (measured 2026-09-25); each of the next three isolates one of the guard's
  // conditions — the scheme, whitespace, the escape — and the fourth is the bypass they close.
  // A scheme that is not postgres:/postgresql: (a special one reads a backslash as a delimiter):
  "http://localhost/personal_finance",
  // A leading space: pg parses it against its base URL and reads the host as "base":
  " postgresql://user:password@localhost:5432/personal_finance",
  // A malformed percent escape, which makes pg re-encode the whole value:
  "postgresql://user:password@localhost/personal_finance?x=%zz",
  // The bypass, the scheme and a trailing space together: `new URL` reads the host as localhost,
  // pg re-encodes the value and connects to evil.example.com:
  "http://localhost\\@evil.example.com/db ",
  // no host at all: the driver falls back to PGHOST
  "postgresql:///personal_finance",
  "not a url",
  "",
];

describe("isLocalDatabaseUrl (TD-10)", () => {
  it.each(LOCAL_URLS)("%s is local", (url) => {
    expect(isLocalDatabaseUrl(url)).toBe(true);
  });

  it.each(NOT_LOCAL_URLS)("%j is not local", (url) => {
    expect(isLocalDatabaseUrl(url)).toBe(false);
  });
});

describe("localDatabaseRefusal (TD-10: db:reset, the seed and every Playwright run)", () => {
  it.each(LOCAL_URLS)("lets %s through", (url) => {
    expect(localDatabaseRefusal({ DATABASE_URL: url })).toBeNull();
  });

  it.each(NOT_LOCAL_URLS.filter(Boolean))("refuses %s", (url) => {
    expect(localDatabaseRefusal({ DATABASE_URL: url })).toMatch(/^Refusing to run: DATABASE_URL/);
  });

  it("leaves an unset or empty DATABASE_URL to databaseUrl()'s own error", () => {
    expect(localDatabaseRefusal({})).toBeNull();
    expect(localDatabaseRefusal({ DATABASE_URL: "" })).toBeNull();
  });

  it("never puts the URL, its password or its host in the message (CI logs are public)", () => {
    // Built from a variable, not spelled out: the secret scan reads a literal
    // `scheme://user:password@host` as a leak, and `${…}` is one of its placeholders.
    const secret = "s3cret-pw";
    const message = localDatabaseRefusal({
      DATABASE_URL: `postgresql://user:${secret}@db.example.com:5432/personal_finance`,
    });
    expect(message).not.toBeNull();
    expect(message).not.toContain(secret);
    expect(message).not.toContain("db.example.com");
  });
});

describe("testEnvRefusal (TD-10: APP_ENV=test)", () => {
  const neon = "postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb";

  it.each([undefined, "", "development", "production", "Test", "test "])(
    "is not about APP_ENV=%j — nothing is refused, whatever else the environment says",
    (appEnv) => {
      expect(testEnvRefusal({ APP_ENV: appEnv, VERCEL: "1", DATABASE_URL: neon })).toBeNull();
    },
  );

  it("refuses APP_ENV=test on a Vercel deployment, by VERCEL or by VERCEL_ENV", () => {
    expect(testEnvRefusal({ APP_ENV: "test", VERCEL: "1" })).toMatch(/Vercel deployment/);
    expect(testEnvRefusal({ APP_ENV: "test", VERCEL_ENV: "preview" })).toMatch(/Vercel deployment/);
    expect(testEnvRefusal({ APP_ENV: "test", VERCEL_ENV: "development" })).toMatch(/Vercel/);
  });

  it("refuses APP_ENV=test with a DATABASE_URL on another machine — with no platform variable at all", () => {
    expect(testEnvRefusal({ APP_ENV: "test", DATABASE_URL: neon })).toMatch(/DATABASE_URL/);
    expect(
      testEnvRefusal({
        APP_ENV: "test",
        DATABASE_URL: "postgresql://user:password@localhost/db?host=prod.example.com",
      }),
    ).toMatch(/DATABASE_URL/);
  });

  it("lets APP_ENV=test run against a local database, in CI and on a laptop", () => {
    expect(testEnvRefusal({ APP_ENV: "test", DATABASE_URL: LOCAL_URLS[0] })).toBeNull();
    expect(
      testEnvRefusal({
        APP_ENV: "test",
        CI: "true",
        GITHUB_ACTIONS: "true",
        NODE_ENV: "production",
        DATABASE_URL: LOCAL_URLS[0],
      }),
    ).toBeNull();
  });

  it("treats an empty platform variable as unset, and an unset DATABASE_URL as nothing to protect", () => {
    expect(testEnvRefusal({ APP_ENV: "test", VERCEL: "", VERCEL_ENV: "" })).toBeNull();
    expect(testEnvRefusal({ APP_ENV: "test" })).toBeNull();
  });

  it("never puts the URL, its password or its host in the message", () => {
    const message = testEnvRefusal({ APP_ENV: "test", DATABASE_URL: neon });
    expect(message).not.toContain("user:password");
    expect(message).not.toContain("neon.tech");
  });
});

describe("migrationDatabaseUrl (T-14: Prisma's CLI uses Neon's direct connection)", () => {
  it("prefers DATABASE_URL_UNPOOLED, the direct URL the Neon integration sets on Vercel", () => {
    expect(
      migrationDatabaseUrl({ DATABASE_URL: LOCAL_URLS[0], DATABASE_URL_UNPOOLED: LOCAL_URLS[1] }),
    ).toBe(LOCAL_URLS[1]);
  });

  it("falls back to DATABASE_URL when DATABASE_URL_UNPOOLED is unset or empty (local runs, CI)", () => {
    expect(migrationDatabaseUrl({ DATABASE_URL: LOCAL_URLS[0] })).toBe(LOCAL_URLS[0]);
    expect(migrationDatabaseUrl({ DATABASE_URL: LOCAL_URLS[0], DATABASE_URL_UNPOOLED: "" })).toBe(
      LOCAL_URLS[0],
    );
  });

  it("is undefined when neither is set, so Prisma names the missing datasource itself", () => {
    expect(migrationDatabaseUrl({})).toBeUndefined();
    expect(migrationDatabaseUrl({ DATABASE_URL: "", DATABASE_URL_UNPOOLED: "" })).toBeUndefined();
  });
});

describe("localDatabaseRefusal reads DATABASE_URL_UNPOOLED too (T-14, Review Focus 1)", () => {
  const secret = "s3cret-pw";
  const remote = `postgresql://user:${secret}@db.example.com:5432/personal_finance`;

  it("refuses a local DATABASE_URL beside a remote DATABASE_URL_UNPOOLED — the shape an env pull leaves", () => {
    const message = localDatabaseRefusal({
      DATABASE_URL: LOCAL_URLS[0],
      DATABASE_URL_UNPOOLED: remote,
    });
    expect(message).toMatch(/^Refusing to run: DATABASE_URL or DATABASE_URL_UNPOOLED/);
    expect(message).not.toContain(secret);
    expect(message).not.toContain("db.example.com");
  });

  it("refuses a remote DATABASE_URL_UNPOOLED alone", () => {
    expect(localDatabaseRefusal({ DATABASE_URL_UNPOOLED: remote })).not.toBeNull();
  });

  it("(control) lets two local URLs through, and treats an empty one as unset", () => {
    expect(
      localDatabaseRefusal({ DATABASE_URL: LOCAL_URLS[0], DATABASE_URL_UNPOOLED: LOCAL_URLS[1] }),
    ).toBeNull();
    expect(
      localDatabaseRefusal({ DATABASE_URL: LOCAL_URLS[0], DATABASE_URL_UNPOOLED: "" }),
    ).toBeNull();
  });

  it("makes APP_ENV=test refuse a remote DATABASE_URL_UNPOOLED as it does a remote DATABASE_URL", () => {
    expect(
      testEnvRefusal({
        APP_ENV: "test",
        DATABASE_URL: LOCAL_URLS[0],
        DATABASE_URL_UNPOOLED: remote,
      }),
    ).toMatch(/^Refusing to run: APP_ENV=test with a DATABASE_URL or DATABASE_URL_UNPOOLED that/);
  });
});
