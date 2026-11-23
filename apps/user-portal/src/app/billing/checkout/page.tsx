import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { firstSearchParameter, isBackendId } from "@/lib/billing-display";
import { portalName } from "@/lib/portal";
import { CheckoutView } from "./checkout-view";
import { PlanPicker } from "./plan-picker";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ planId?: string | string[] }> }>) {
  const planId = firstSearchParameter((await searchParams).planId);

  return (
    <section className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <DashboardHeader
        description="Review your plan, choose a payment method, and complete your subscription."
        eyebrow={portalName}
        title="Subscribe"
      />
      {isBackendId(planId) ? (
        <CheckoutView planId={planId} />
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
