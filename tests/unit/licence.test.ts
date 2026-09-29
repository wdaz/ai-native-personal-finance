import { readFileSync, readdirSync } from "node:fs";
import { sep } from "node:path";
import { describe, expect, it } from "vitest";

const CHALLENGE_ASSET = /the challenge asset `/i;
const PHOSPHOR = /Phosphor "/;

const read = (path: string) => readFileSync(path, "utf8");

// `/`-separated like the notices, whatever the platform's separator.
function sourcesCiting(marker: RegExp): string[] {
  return readdirSync("src", { recursive: true, encoding: "utf8" })
    .filter((path) => path.endsWith(".tsx"))
    .map((path) => ["src", ...path.split(sep)].join("/"))
    .filter((path) => marker.test(read(path)));
}

function unlisted(notices: string, files: string[]): string[] {
  return files.filter((file) => !notices.includes(file));
}

describe("LICENSE and THIRD-PARTY-NOTICES.md (T-15a, backlog T-15 items 1 and 2)", () => {
  it("(fixture) reports a source the notices do not list", () => {
    const notices = "| `src/ui/icons/AIcon.tsx` | the starter's `a.svg` |";
    expect(unlisted(notices, ["src/ui/icons/AIcon.tsx", "src/ui/icons/BIcon.tsx"])).toEqual([
      "src/ui/icons/BIcon.tsx",
    ]);
  });

  it("(fixture) the markers match where the headers put them", () => {
    expect(CHALLENGE_ASSET.test("/** The challenge asset `icon-nav-pots.svg` */")).toBe(true);
    expect(
      CHALLENGE_ASSET.test(' * The "finance" wordmark — the challenge asset `logo-large.svg`'),
    ).toBe(true);
    expect(PHOSPHOR.test(' * Phosphor "jar", fill weight')).toBe(true);
    expect(CHALLENGE_ASSET.test("/** Drawn for this app; no challenge asset covers it. */")).toBe(
      false,
    );
  });

  it("LICENSE is PolyForm Strict 1.0.0 with the owner's notice and the challenge-assets clause", () => {
    const licence = read("LICENSE");
    expect(licence).toMatch(/^Required Notice: Copyright \(c\) 2026 Ruslan Haqverdi/);
    expect(licence).toContain("# PolyForm Strict License 1.0.0");
    expect(licence).toContain(
      "other than distributing the software or making changes or new works based on the software",
    );
    expect(licence).toContain("Frontend Mentor");
    expect(licence).toContain("THIRD-PARTY-NOTICES.md");
  });

  it("every source that draws a challenge asset is listed", () => {
    const files = sourcesCiting(CHALLENGE_ASSET);
    expect(files.length).toBeGreaterThanOrEqual(9);
    expect(unlisted(read("THIRD-PARTY-NOTICES.md"), files)).toEqual([]);
  });

  it("every Phosphor icon is listed under Phosphor's own notice", () => {
    const files = sourcesCiting(PHOSPHOR);
    expect(files.length).toBeGreaterThanOrEqual(2);
    const notices = read("THIRD-PARTY-NOTICES.md");
    expect(notices).toContain("Copyright (c) 2023 Phosphor Icons");
    expect(unlisted(notices, files)).toEqual([]);
  });

  it("the Frontend Mentor files, the font and the recorded close icon are listed", () => {
    const listed = [
      "public/avatars/",
      "public/images/illustration-authentication.svg",
      "docs/00-discovery/inputs/data.json",
      "prisma/data.json",
      "docs/00-discovery/inputs/challenge-brief.md",
      "docs/02-architecture/design-tokens.md",
      "src/ui/tokens.css",
      "app/fonts/OFL.txt",
      "src/ui/icons/CloseCircleIcon.tsx",
    ];
    expect(unlisted(read("THIRD-PARTY-NOTICES.md"), listed)).toEqual([]);
  });
});
