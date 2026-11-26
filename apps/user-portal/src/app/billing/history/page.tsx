import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { billingRoutes } from "@/config/billing";
import { firstSearchParameter, parseBillingPage } from "@/lib/billing-display";
import { portalName } from "@/lib/portal";
import { BillingHistoryCard } from "../billing-history-card";
import { BackLink } from "../billing-ui";

export const metadata: Metadata = { title: "Billing history" };

/**
 * Full billing history (reference `UserBillingHistory`). Uses the same
 * owner-scoped, server-paginated query as `/billing`. The reference's status
 * filter, CSV export and invoice/receipt row actions are omitted: the history
 * contract has no filter parameter, export endpoint, or invoice/receipt ids
 * (DR-058; invoices and receipts are FE-UI-018).
 */
export default async function BillingHistoryPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ page?: string | string[] }> }>) {
  const page = parseBillingPage(
    firstSearchParameter((await searchParams).page),
  );

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <BackLink href={billingRoutes.overview}>Back to billing</BackLink>
        <DashboardHeader
          description="Every subscription purchase and renewal attempt for your account."
          eyebrow={portalName}
          title="Billing history"
        />
      </div>
      <BillingHistoryCard
        basePath={billingRoutes.history}
        heading={false}
        page={page}
      />
    </section>
  );
}
