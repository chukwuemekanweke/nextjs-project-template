"use client";

import type { PurchaseSubscriptionMutationResponse } from "@template/api-client/subscriptions";
import { Alert } from "@template/ui-core";
import Link from "next/link";
import { billingRoutes } from "@/config/billing";
import {
  bankTransferDetails,
  formatBillingDateTime,
  paymentMethodLabel,
} from "@/lib/billing-display";
import type { CheckoutOutcome } from "@/lib/checkout-submission";
import {
  DetailList,
  primaryButtonClass,
  secondaryButtonClass,
} from "../billing-ui";

type InstructionOutcome = Extract<
  CheckoutOutcome,
  { type: "bank-transfer" | "redirect" | "unsupported" }
>;

/** Next step after the backend accepted a purchase. */
export function PaymentInstructions({
  amount,
  outcome,
}: Readonly<{ amount: string; outcome: InstructionOutcome }>) {
  const { response } = outcome;
  const statusHref = billingRoutes.purchase(response.purchaseId);

  if (outcome.type === "redirect") {
    return (
      <div className="space-y-4" aria-live="polite">
        <Alert variant="info">
          Redirecting you to {response.paymentProviderName} to complete your
          payment securely…
        </Alert>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a className={primaryButtonClass} href={outcome.href}>
            Continue to {response.paymentProviderName}
          </a>
          <Link className={secondaryButtonClass} href={statusHref}>
            Check payment status
          </Link>
        </div>
        <PurchaseReference response={response} />
      </div>
    );
  }

  if (outcome.type === "bank-transfer") {
    const details = bankTransferDetails(response.instructionFields);
    const expiresAt = formatBillingDateTime(response.expiresAtUtc);
    return (
      <div className="space-y-5">
        <Alert variant="info">
          Transfer exactly {amount} using the details below. Your subscription
          activates after {response.paymentProviderName} confirms the payment.
        </Alert>
        {details.length > 0 ? (
          <DetailList
            items={[
              ...details,
              { label: "Amount", value: amount },
              ...(expiresAt ? [{ label: "Pay before", value: expiresAt }] : []),
            ]}
          />
        ) : (
          <Alert variant="warning">
            Transfer details are not available yet. Check the payment status or
            contact support with the reference below.
          </Alert>
        )}
        <PurchaseReference response={response} />
        <Link className={primaryButtonClass} href={statusHref}>
          I have made the transfer — check status
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="warning">
        {paymentMethodLabel(response.paymentMethodType)} payments with{" "}
        {response.paymentProviderName} cannot be completed in this portal yet.
        Your checkout was recorded; check its status or contact support with the
        reference below.
      </Alert>
      <PurchaseReference response={response} />
      <Link className={secondaryButtonClass} href={statusHref}>
        Check payment status
      </Link>
    </div>
  );
}

function PurchaseReference({
  response,
}: Readonly<{ response: PurchaseSubscriptionMutationResponse }>) {
  return (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Reference:{" "}
      <span className="font-mono text-gray-700 dark:text-gray-300">
        {response.merchantReference}
      </span>
    </p>
  );
}
