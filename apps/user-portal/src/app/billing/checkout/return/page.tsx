import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { portalName } from "@/lib/portal";
import { CheckoutReturn } from "./checkout-return";

export const metadata: Metadata = { title: "Returning from payment" };

/**
 * Landing route for hosted-checkout returns. Provider query parameters are
 * intentionally ignored; the remembered purchase id is resolved client-side
 * and its status is read from the backend.
 */
export default function CheckoutReturnPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <DashboardHeader
        description="We are confirming your payment with our billing service."
        eyebrow={portalName}
        title="Confirming your payment"
      />
      <CheckoutReturn />
    </section>
  );
}
