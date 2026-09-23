import type { Metadata } from "next";
import { PAGE_NAMES } from "@/src/ui/nav";
import { PageHeader } from "@/src/ui/PageHeader";

// SPEC-app-shell §2.5: the root layout's template makes it "Personal Finance - Overview".
export const metadata: Metadata = { title: PAGE_NAMES.overview };

/** The heading only (T-07 plan Q2): T-10 renders the Overview itself (SPEC-overview). */
export default function OverviewPage() {
  return <PageHeader title={PAGE_NAMES.overview} />;
}
