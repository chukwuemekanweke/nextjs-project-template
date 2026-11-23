import type { Metadata } from "next";
import { branding } from "@/config/env";
import { PaymentReturn } from "../payment-return";

export const metadata: Metadata = { title: "Payment status" };

/**
 * Bachs `success_url` destination. Success is shown only once the backend
 * reports an active subscription.
 * Provider query parameters are ignored: the purchase comes from this
 * browser's remembered checkout attempt and its outcome from the backend.
 */
export default function CheckoutSuccessPage() {
  return (
    <section className="mx-auto w-full max-w-6xl py-2 sm:py-6">
      <PaymentReturn hint="success" supportEmail={branding.supportEmail} />
    </section>
  );
}
