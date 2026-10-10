import type { Metadata } from "next";
import { headers } from "next/headers";
import type { PotsDto } from "@/src/shared/schemas";
import { getDb } from "@/src/server/db";
import { getPots } from "@/src/server/pots";
import { PAGE_NAMES } from "@/src/ui/nav";
import { PageHeader } from "@/src/ui/PageHeader";
import { PotsError } from "@/src/ui/pots/PotsError";
import { PotsBoard } from "./PotsBoard";

// SPEC-app-shell §2.5: the root layout's template makes it "Personal Finance - Pots".
export const metadata: Metadata = { title: PAGE_NAMES.pots };

/**
 * SPEC-pots 2.1, 2.9: calls `getPots` directly (no HTTP self-call, the Overview pattern) and hands
 * the DTO to `PotsBoard`. When it throws, the page logs the failure with the request id and renders
 * the header with no "+ Add New Pot" (PO-Q9 (a)) and the error card in place of the grid.
 */
export default async function PotsPage() {
  let dto: PotsDto | undefined;
  try {
    dto = await getPots(getDb());
  } catch (error) {
    const requestId = (await headers()).get("x-request-id") ?? "none";
    console.error(`Pots: getPots failed requestId=${requestId}`, error);
  }

  if (dto === undefined) {
    return (
      <>
        <PageHeader title={PAGE_NAMES.pots} />
        <PotsError />
      </>
    );
  }
  return <PotsBoard dto={dto} />;
}
