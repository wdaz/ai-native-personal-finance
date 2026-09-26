import { parse } from "pg-connection-string";
import { describe, expect, it } from "vitest";
import { withVerifiedSsl } from "@/src/server/db-url";

/** The shape of the URL the Neon–Vercel integration writes: `sslmode=require`, no CA parameters. */
const NEON =
  "postgresql://user:password@ep-cool-name-123456-pooler.eu-central-1.aws.neon.tech/neondb";
const LOCAL = "postgresql://postgres:postgres@localhost:5432/personal_finance";

/**
 * TD-20: `pg` 8 reads `sslmode=require` (and `prefer`, `verify-ca`) as `verify-full`; `pg` 9 will
 * read it the libpq way — encrypted, certificate not verified. Naming `verify-full` keeps today's
 * behaviour on both, and is what `pg-connection-string` 2.14.0's own warning asks for.
 */
describe("withVerifiedSsl", () => {
  it.each(["require", "prefer", "verify-ca"])("reads sslmode=%s as verify-full", (mode) => {
    expect(withVerifiedSsl(`${NEON}?sslmode=${mode}`)).toBe(`${NEON}?sslmode=verify-full`);
  });

  it("changes only that parameter, wherever it stands", () => {
    expect(withVerifiedSsl(`${NEON}?sslmode=require&channel_binding=require`)).toBe(
      `${NEON}?sslmode=verify-full&channel_binding=require`,
    );
    expect(withVerifiedSsl(`${NEON}?connect_timeout=10&sslmode=require&application_name=pf`)).toBe(
      `${NEON}?connect_timeout=10&sslmode=verify-full&application_name=pf`,
    );
  });

  it.each([
    ["no sslmode (the local database)", LOCAL],
    ["sslmode=disable", `${LOCAL}?sslmode=disable`],
    ["sslmode=verify-full", `${NEON}?sslmode=verify-full`],
    ["an explicit sslmode=no-verify", `${NEON}?sslmode=no-verify`],
    ["libpq semantics chosen on purpose", `${NEON}?uselibpqcompat=true&sslmode=require`],
    ["a value that only contains the text", `${NEON}?application_name=sslmode=require`],
    ["the text in the userinfo", "postgresql://user:sslmode=require@localhost/personal_finance"],
    ["a longer mode name", `${NEON}?sslmode=required`],
  ])("leaves %s alone", (_label, url) => {
    expect(withVerifiedSsl(url)).toBe(url);
  });

  it("reads every occurrence", () => {
    expect(withVerifiedSsl(`${NEON}?sslmode=require&sslmode=prefer`)).toBe(
      `${NEON}?sslmode=verify-full&sslmode=verify-full`,
    );
  });
});

/**
 * `pg-connection-string`'s `useLibpqCompat` option is the reading `pg` 9 will make the default
 * (2.14.0, `index.js`, `parse`) — so it stands in for the upgrade the entry warns of.
 */
describe("under libpq semantics, the reading of pg 9 (TD-20)", () => {
  it("(fixture) the URL as the integration writes it stops verifying the server's certificate", () => {
    expect(parse(`${NEON}?sslmode=require`, { useLibpqCompat: true }).ssl).toEqual({
      rejectUnauthorized: false,
    });
  });

  it("the URL withVerifiedSsl returns still verifies it", () => {
    const url = withVerifiedSsl(`${NEON}?sslmode=require&channel_binding=require`);
    expect(parse(url, { useLibpqCompat: true }).ssl).toEqual({});
  });

  it("and reads the same way under pg 8, without its deprecation warning", () => {
    const url = withVerifiedSsl(`${NEON}?sslmode=require`);
    expect(parse(url).ssl).toEqual({});
    expect(parse(url, { useLibpqCompat: true }).ssl).toEqual(parse(url).ssl);
  });
});
