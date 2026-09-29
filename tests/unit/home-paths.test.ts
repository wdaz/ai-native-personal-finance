import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Built from pieces so this file never matches itself; `<` keeps `/Users/<name>/` usable as a placeholder.
const U = "/Us" + "ers/";
const H = "/ho" + "me/";
const HOME_PATH = new RegExp(`${U}(?!<)[A-Za-z0-9._-]+|${H}(?!<)[a-z_][a-z0-9_-]*/`);

function homePathLines(text: string): number[] {
  return text.split("\n").flatMap((line, i) => (HOME_PATH.test(line) ? [i + 1] : []));
}

describe("no absolute home-directory path at the tip (T-15a, backlog T-15 item 6)", () => {
  it("(fixture) flags the macOS and Linux forms", () => {
    expect(homePathLines(`cd ${U}alice/Own/repo\nok\nT=${H}bob/tmp`)).toEqual([1, 3]);
  });

  it("(fixture) allows the placeholders, ~ and $HOME", () => {
    const text = [`${U}<name>/Own`, `${H}<user>/x`, "~/Own/repo", "$HOME/.claude/jobs", "/usr/bin"];
    expect(homePathLines(text.join("\n"))).toEqual([]);
  });

  it("(fixture, known limit) a URL path that starts with /home/ is flagged", () => {
    expect(homePathLines(`https://example.com${H}docs/`)).toEqual([1]);
  });

  it("no tracked text file holds one", () => {
    const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
      .split("\0")
      .filter(Boolean);
    const hits = files.flatMap((file) => {
      const bytes = readFileSync(file);
      if (bytes.includes(0)) return [];
      return homePathLines(bytes.toString("utf8")).map((line) => `${file}:${line}`);
    });
    expect(hits).toEqual([]);
  });
});
