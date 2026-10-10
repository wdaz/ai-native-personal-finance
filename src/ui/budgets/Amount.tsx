import { Fragment } from "react";

/**
 * SPEC-budgets 2.4 (§9 BU-Q5 (a), the designer's changelog §18e): a formatted amount that may
 * break only after a comma — a `<wbr>` after each one, never inside a digit group. The text
 * content stays the amount ("$999,999,999.99").
 */
export function BreakableAmount({ text }: { text: string }) {
  const groups = text.split(",");
  return (
    <>
      {groups.map((group, index) => (
        <Fragment key={index}>
          {group}
          {index < groups.length - 1 ? (
            <>
              ,<wbr />
            </>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}
