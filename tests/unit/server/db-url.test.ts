import { parse } from "pg-connection-string";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    ["a mode pg does not switch on, in capitals", `${NEON}?sslmode=REQUIRE`],
    ["libpq semantics chosen on purpose", `${NEON}?uselibpqcompat=true&sslmode=require`],
    [
      "libpq semantics chosen on purpose, percent-encoded",
      `${NEON}?uselibpqcompat=%74rue&sslmode=require`,
    ],
    ["a value that only contains the text", `${NEON}?application_name=sslmode=require`],
    ["a longer mode name", `${NEON}?sslmode=required`],
    ["the text in the userinfo", "postgresql://user:sslmode=require@localhost/personal_finance"],
    [
      "the text between & signs in the userinfo",
      "postgresql://user:a&sslmode=require&b@localhost/personal_finance",
    ],
    ["the text in the fragment", `${LOCAL}#sslmode=require`],
  ])("leaves %s alone", (_label, url) => {
    expect(withVerifiedSsl(url)).toBe(url);
  });

  it("does not read uselibpqcompat=false as a choice of libpq semantics: only pg's exact 'true' is one", () => {
    expect(withVerifiedSsl(`${NEON}?uselibpqcompat=false&sslmode=require`)).toBe(
      `${NEON}?uselibpqcompat=false&sslmode=verify-full`,
    );
  });

  it("changes the query, not the userinfo or the fragment around it", () => {
    expect(
      withVerifiedSsl(
        "postgresql://u:a&sslmode=require&b@localhost/db?sslmode=require#sslmode=require",
      ),
    ).toBe("postgresql://u:a&sslmode=require&b@localhost/db?sslmode=verify-full#sslmode=require");
  });

  it("reads every occurrence", () => {
    expect(withVerifiedSsl(`${NEON}?sslmode=require&sslmode=prefer`)).toBe(
      `${NEON}?sslmode=verify-full&sslmode=verify-full`,
    );
  });

  /**
   * pg reads the decoded parameters of the URL, and the URL parser strips tabs and newlines; the
   * rewrite reads the raw text. A weak mode the rewrite cannot see is refused, not passed on.
   */
  describe("refuses a weak sslmode it cannot rewrite", () => {
    it.each([
      ["a percent-encoded value", `${NEON}?sslmode=re%71uire`],
      ["a percent-encoded name", `${NEON}?ssl%6Dode=require`],
      ["a trailing newline", `${NEON}?sslmode=require\n`],
      ["a tab inside the value", `${NEON}?sslmode=req\tuire`],
    ])("%s", (_label, url) => {
      expect(() => withVerifiedSsl(url)).toThrow(/verify-full/);
    });

    it("without putting the URL, or its password, in the message", () => {
      let message = "";
      try {
        withVerifiedSsl(`${NEON}?sslmode=re%71uire`);
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).not.toBe("");
      expect(message).not.toContain("password");
      expect(message).not.toContain("neon.tech");
    });

    it("but not a mode the later occurrence overrides, as pg reads the last one", () => {
      expect(withVerifiedSsl(`${NEON}?ssl%6Dode=require&sslmode=verify-full`)).toBe(
        `${NEON}?ssl%6Dode=require&sslmode=verify-full`,
      );
    });
  });
});

/**
 * `pg-connection-string`'s `useLibpqCompat` option is the reading `pg` 9 will make the default
 * (2.14.0, `index.js`, `parse`) — so it stands in for the upgrade the entry warns of; no `pg` 9
 * exists to run. The copy imported here is the one npm hoists to the top level, which is `pg`'s
 * (a devDependency) and not necessarily the one the adapter's own `pg` brings to the app: the first
 * test pins the reading the simulation assumes, so the day the imported copy is version 3 — where
 * the option may not exist or mean the same — this file fails and the simulation is re-derived.
 */
describe("under libpq semantics, the reading of pg 9 (TD-20)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // The library warns once per process (`deprecatedSslModeWarning.warned`), so this is the only
  // test that parses a weak mode without `useLibpqCompat`, and it does so after the URL it must not
  // warn about: the raw URL warning proves the spy sees warnings and the flag was still unset when
  // the rewritten URL was read.
  it("(sentinel) the imported pg-connection-string is the 2.x reading: require verifies and warns, the rewritten URL does not warn", () => {
    const warn = vi.spyOn(process, "emitWarning").mockImplementation(() => undefined);
    expect(parse(withVerifiedSsl(`${NEON}?sslmode=require`)).ssl).toEqual({});
    expect(warn).not.toHaveBeenCalled();

    expect(parse(`${NEON}?sslmode=require`).ssl).toEqual({});
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("SECURITY WARNING");
  });

  it("(fixture) the URL as the integration writes it stops verifying the server's certificate", () => {
    expect(parse(`${NEON}?sslmode=require`, { useLibpqCompat: true }).ssl).toEqual({
      rejectUnauthorized: false,
    });
  });

  it("the URL withVerifiedSsl returns still verifies it", () => {
    const url = withVerifiedSsl(`${NEON}?sslmode=require&channel_binding=require`);
    expect(parse(url, { useLibpqCompat: true }).ssl).toEqual({});
  });

  it("and reads the same way under pg 8", () => {
    const url = withVerifiedSsl(`${NEON}?sslmode=require`);
    expect(parse(url).ssl).toEqual({});
    expect(parse(url, { useLibpqCompat: true }).ssl).toEqual(parse(url).ssl);
  });
});
