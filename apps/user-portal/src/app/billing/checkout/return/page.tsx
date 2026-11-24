import type { Metadata } from "next";
import { branding } from "@/config/env";
import { PaymentReturn } from "../payment-return";

export const metadata: Metadata = { title: "Payment status" };

/**
 * Hint-free provider return for integrations with a single return URL.
 * Provider query parameters are ignored: the purchase comes from this
 * browser's remembered checkout attempt and its outcome from the backend.
 */
export default function CheckoutReturnPage() {
  return (
    <section className="mx-auto w-full max-w-6xl py-2 sm:py-6">
      <PaymentReturn hint={undefined} supportEmail={branding.supportEmail} />
    </section>
  );
}
