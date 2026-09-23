import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const md = readFileSync("docs/01-requirements/user-stories.md", "utf8");
const appendix = md.slice(md.indexOf("## Appendix — validation and message copy"));
mkdirSync("tests/fixtures/copy", { recursive: true });
writeFileSync(
  "tests/fixtures/copy/reworded.md.fixture",
  "<!-- tests/unit/shared/copy.test.ts: the appendix with one message reworded. -->\n\n" +
    appendix.replace("| Can't be empty |", "| Can't be blank |"),
);
writeFileSync(
  "tests/fixtures/copy/no-appendix.md.fixture",
  "<!-- tests/unit/shared/copy.test.ts: the appendix under another heading. -->\n\n" +
    appendix.replace("## Appendix — validation and message copy", "## Messages"),
);
