import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { notFound } from "next/navigation";
import { branding } from "@/config/env";
import { isBackendId } from "@/lib/billing-display";
import { portalName } from "@/lib/portal";
import { PurchaseStatusView } from "./purchase-status-view";

export const metadata: Metadata = { title: "Payment status" };

export default async function PurchaseStatusPage({
  params,
}: Readonly<{ params: Promise<{ purchaseId: string }> }>) {
  const { purchaseId } = await params;
  if (!isBackendId(purchaseId)) notFound();

  return (
    <section className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <DashboardHeader
        description="The status below comes from our billing service and updates automatically."
        eyebrow={portalName}
        title="Payment status"
      />
      <PurchaseStatusView
        purchaseId={purchaseId}
        supportEmail={branding.supportEmail}
      />
    </section>
  );
}
