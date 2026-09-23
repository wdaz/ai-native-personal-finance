import { describe, expect, it } from "vitest";
import { demoPasswordHash } from "@/src/server/env";

describe("demoPasswordHash", () => {
  it("returns a well-formed bcrypt hash", () => {
    const hash = "$2b$10$bhzxOh.akrgXdDStGY5q7OZBbpZASLI0ZZZKd7FaugCHNaAhj/3hi";
    expect(demoPasswordHash({ DEMO_PASSWORD_HASH: hash })).toBe(hash);
  });

  it("throws when unset", () => {
    expect(() => demoPasswordHash({})).toThrow(/DEMO_PASSWORD_HASH/);
  });

  it("throws when the value is not a $2[aby]$NN$... bcrypt hash — e.g. a mangled/escaped one", () => {
    expect(() => demoPasswordHash({ DEMO_PASSWORD_HASH: "\\$2b\\$10\\$notreallyahash" })).toThrow(
      /bcrypt/,
    );
  });
});
