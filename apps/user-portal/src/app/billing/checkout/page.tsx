import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { billingRoutes } from "@/config/billing";
import { firstSearchParameter, isBackendId } from "@/lib/billing-display";
import { portalName } from "@/lib/portal";
import { BackLink } from "../billing-ui";
import { CheckoutView } from "./checkout-view";
import { PlanPicker } from "./plan-picker";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    billingInterval?: string | string[];
    planId?: string | string[];
  }>;
}>) {
  const query = await searchParams;
  const planId = firstSearchParameter(query.planId);
  // Only a preference: CheckoutView accepts it only when the plan offers it.
  const billingInterval = firstSearchParameter(query.billingInterval);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <BackLink href={billingRoutes.overview}>Back to plans</BackLink>
        <DashboardHeader
          description="Review your plan and choose how to pay."
          eyebrow={portalName}
          title="Checkout"
        />
      </div>
      {isBackendId(planId) ? (
        <CheckoutView billingInterval={billingInterval} planId={planId} />
      ) : (
        <PlanPicker
          notice={
            planId === undefined
              ? undefined
              : "The selected plan link is not valid. Choose a plan below."
          }
        />
      )}
    </section>
  );
}
