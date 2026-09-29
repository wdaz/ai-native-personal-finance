import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

function sourcesCiting(marker: RegExp): string[] {
  return readdirSync("src", { recursive: true, encoding: "utf8" })
    .filter((path) => path.endsWith(".tsx"))
    .map((path) => join("src", path))
    .filter((path) => marker.test(read(path)));
}

describe("LICENSE and THIRD-PARTY-NOTICES.md (T-15a, backlog T-15 items 1 and 2)", () => {
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
    const files = sourcesCiting(/The challenge asset `/);
    expect(files.length).toBeGreaterThanOrEqual(9);
    const notices = read("THIRD-PARTY-NOTICES.md");
    for (const file of files) expect(notices).toContain(file);
  });

  it("every Phosphor icon is listed under Phosphor's own notice", () => {
    const files = sourcesCiting(/Phosphor "/);
    expect(files.length).toBeGreaterThanOrEqual(2);
    const notices = read("THIRD-PARTY-NOTICES.md");
    expect(notices).toContain("Copyright (c) 2023 Phosphor Icons");
    for (const file of files) expect(notices).toContain(file);
  });

  it("the Frontend Mentor files, the font and the recorded close icon are listed", () => {
    const notices = read("THIRD-PARTY-NOTICES.md");
    for (const path of [
      "public/avatars/",
      "public/images/illustration-authentication.svg",
      "docs/00-discovery/inputs/data.json",
      "prisma/data.json",
      "docs/00-discovery/inputs/challenge-brief.md",
      "docs/02-architecture/design-tokens.md",
      "src/ui/tokens.css",
      "app/fonts/OFL.txt",
      "src/ui/icons/CloseCircleIcon.tsx",
    ]) {
      expect(notices).toContain(path);
    }
  });
});
