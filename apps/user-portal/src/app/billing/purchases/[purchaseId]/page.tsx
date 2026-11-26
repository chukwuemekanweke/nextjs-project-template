import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { notFound } from "next/navigation";
import { billingRoutes } from "@/config/billing";
import { branding } from "@/config/env";
import { isBackendId } from "@/lib/billing-display";
import { portalName } from "@/lib/portal";
import { BackLink } from "../../billing-ui";
import { PurchaseStatusView } from "./purchase-status-view";

export const metadata: Metadata = { title: "Purchase details" };

export default async function PurchaseStatusPage({
  params,
}: Readonly<{ params: Promise<{ purchaseId: string }> }>) {
  const { purchaseId } = await params;
  if (!isBackendId(purchaseId)) notFound();

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <BackLink href={billingRoutes.history}>Billing history</BackLink>
        <DashboardHeader
          description="Status and payment details from our billing service. Pending payments update automatically."
          eyebrow={portalName}
          title="Purchase details"
        />
      </div>
      <PurchaseStatusView
        purchaseId={purchaseId}
        supportEmail={branding.supportEmail}
      />
    </section>
  );
}
