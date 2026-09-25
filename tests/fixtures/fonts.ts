import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * TD-11: `app/fonts/` holds binary files the build serves, so what they are is checked, not
 * only written down. Every problem found in `dir` (the fonts directory) against `layoutSource`
 * (`app/layout.tsx`), one sentence each; an empty list means the directory is as its README says.
 */
export function fontProblems(dir: string, layoutSource: string): string[] {
  const problems: string[] = [];
  const readme = existsSync(join(dir, "README.md"))
    ? readFileSync(join(dir, "README.md"), "utf8")
    : "";
  // | `file.woff2` | 400 | `<sha256>` |
  const listed = new Map(
    [...readme.matchAll(/^\|\s*`([^`]+\.woff2)`\s*\|[^|]*\|\s*`([0-9a-f]{64})`\s*\|/gm)].flatMap(
      ([, file, hash]) => (file && hash ? [[file, hash] as const] : []),
    ),
  );
  const present = readdirSync(dir).filter((file) => file.endsWith(".woff2"));

  for (const file of present) {
    const expected = listed.get(file);
    if (expected === undefined) {
      problems.push(`${file} is not listed in README.md`);
      continue;
    }
    const actual = createHash("sha256")
      .update(readFileSync(join(dir, file)))
      .digest("hex");
    if (actual !== expected)
      problems.push(`${file} has sha256 ${actual}, README.md says ${expected}`);
    if (!layoutSource.includes(`./fonts/${file}`))
      problems.push(`${file} is not used by app/layout.tsx`);
  }
  for (const file of listed.keys()) {
    if (!present.includes(file))
      problems.push(`README.md lists ${file}, which is not in the directory`);
  }
  const licence = existsSync(join(dir, "OFL.txt"))
    ? readFileSync(join(dir, "OFL.txt"), "utf8")
    : "";
  if (!licence.includes("SIL OPEN FONT LICENSE Version 1.1")) {
    problems.push("OFL.txt is missing or is not the SIL Open Font License, Version 1.1");
  }
  return problems;
}
