import type { Metadata } from "next";
import { firstSearchParameter, isBackendId } from "@/lib/billing-display";
import { portalName } from "@/lib/portal";
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
    <section className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      <header>
        <p className="text-brand-500 dark:text-brand-400 text-xs font-medium tracking-wider uppercase">
          {portalName}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
          Complete your subscription
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base dark:text-gray-400">
          Review your plan, choose a payment method, and activate your
          subscription.
        </p>
      </header>
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
