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
  { type: "bank-transfer" | "unsupported" }
>;

/**
 * Next step after the backend accepted a purchase that does not redirect to a
 * hosted checkout (hosted checkouts use `ProviderRedirect`).
 */
export function PaymentInstructions({
  amount,
  outcome,
}: Readonly<{ amount: string; outcome: InstructionOutcome }>) {
  const { response } = outcome;
  const statusHref = billingRoutes.purchase(response.purchaseId);

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
        {response.paymentMethodType === "PaymentLink" ? (
          <>
            We couldn&apos;t open {response.paymentProviderName}&apos;s checkout
            page. Your checkout was recorded; check its status or contact
            support with the reference below.
          </>
        ) : (
          <>
            {paymentMethodLabel(response.paymentMethodType)} payments with{" "}
            {response.paymentProviderName} cannot be completed in this portal
            yet. Your checkout was recorded; check its status or contact support
            with the reference below.
          </>
        )}
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
    <p className="text-small text-fg-muted">
      Reference:{" "}
      <span className="text-fg font-mono">{response.merchantReference}</span>
    </p>
  );
}
