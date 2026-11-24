import type { Metadata } from "next";
import { branding } from "@/config/env";
import { PaymentReturn } from "../payment-return";

export const metadata: Metadata = { title: "Payment status" };

/**
 * Bachs `cancel_url` destination. Cancellation is shown only once the backend
 * confirms no payment was taken; a paid purchase still shows success.
 * Provider query parameters are ignored: the purchase comes from this
 * browser's remembered checkout attempt and its outcome from the backend.
 */
export default function CheckoutCancelledPage() {
  return (
    <section className="mx-auto w-full max-w-6xl py-2 sm:py-6">
      <PaymentReturn hint="cancelled" supportEmail={branding.supportEmail} />
    </section>
  );
}
