import { Fragment } from "react";
import { formatMoney } from "@/src/shared/money";

/**
 * SPEC-pots 2.2 (the designer's changelog §18e, BU-5, which §19 applies to Pots): an amount wider
 * than its line breaks only after a comma — a `<wbr>` after each comma of the `formatMoney` text —
 * never inside a group of digits.
 */
export function AmountText({ cents }: { cents: number }) {
  const parts = formatMoney(cents).split(",");
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 && (
        <>
          ,<wbr />
        </>
      )}
    </Fragment>
  ));
}
