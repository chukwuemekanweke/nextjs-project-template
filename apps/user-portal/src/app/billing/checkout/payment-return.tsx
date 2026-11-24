"use client";

import { isApiError } from "@template/api-client";
import type {
  BillingAccountOwnerType,
  GetSubscriptionPurchaseStatusQueryResponse,
} from "@template/api-client/subscriptions";
import {
  useSubscriptionPlans,
  useSubscriptionPurchaseStatus,
} from "@template/api-react/subscriptions";
import { formatMinorUnits } from "@template/ui-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  billingIntervalLabel,
  describePurchaseStatus,
} from "@/lib/billing-display";
import {
  browserCheckoutAttemptStore,
  type CheckoutAttempt,
} from "@/lib/checkout-attempt";
import {
  canonicalPaymentReturnRoute,
  isAwaitingBackend,
  resolvePaymentReturnView,
  type PaymentReturnView,
  type ProviderReturnHint,
} from "@/lib/payment-return";
import { useRememberedCheckoutAttempt } from "@/lib/use-checkout-attempt";
import { largePrimaryButtonClass, textLinkClass } from "../billing-ui";
import { ArrowRightIcon } from "./checkout-icons";
import {
  PaymentResultCard,
  PaymentResultSummary,
  type PaymentResultIconKind,
} from "./payment-result";

/**
 * Landing view for provider returns. The purchase comes only from this
 * browser's remembered checkout attempt; provider query parameters are never
 * read. The outcome comes only from the backend purchase status. Nothing here
 * can start a purchase.
 */
export function PaymentReturn({
  hint,
  supportEmail,
}: Readonly<{ hint: ProviderReturnHint; supportEmail: string }>) {
  const ownerType = resolveBillingOwnerType();
  const attempt = useRememberedCheckoutAttempt();

  if (attempt === undefined) return <CheckingPayment />;
  if (!attempt?.purchaseId || attempt.billingAccountOwnerType !== ownerType) {
    return <MissingCheckout planId={attempt?.planId} />;
  }
  return (
    <VerifiedPaymentReturn
      attempt={attempt}
      hint={hint}
      ownerType={ownerType}
      purchaseId={attempt.purchaseId}
      supportEmail={supportEmail}
    />
  );
}

function VerifiedPaymentReturn({
  attempt,
  hint,
  ownerType,
  purchaseId,
  supportEmail,
}: Readonly<{
  attempt: CheckoutAttempt;
  hint: ProviderReturnHint;
  ownerType: BillingAccountOwnerType;
  purchaseId: string;
  supportEmail: string;
}>) {
  const router = useRouter();
  const status = useSubscriptionPurchaseStatus(purchaseId, ownerType);
  const plans = useSubscriptionPlans();
  const plan = plans.data?.find((candidate) => candidate.id === attempt.planId);
  const view = status.data
    ? resolvePaymentReturnView(status.data, hint)
    : undefined;
  const settled = status.data?.isTerminal === true;
  const canonicalRoute = view
    ? canonicalPaymentReturnRoute(view, hint)
    : undefined;

  // A final outcome ends the attempt, so the next checkout gets a new key.
  useEffect(() => {
    if (settled) browserCheckoutAttemptStore().markSettled(purchaseId);
  }, [purchaseId, settled]);

  // Keep the URL in line with the confirmed outcome (for example a cancel
  // redirect for a purchase the backend reports as paid and active).
  useEffect(() => {
    if (canonicalRoute) router.replace(canonicalRoute);
  }, [canonicalRoute, router]);

  if (!status.data || !view) {
    if (status.isPending) return <CheckingPayment />;
    const missing = isApiError(status.error) && status.error.status === 404;
    return (
      <PaymentResultCard
        actions={
          <>
            {missing ? null : (
              <button
                className={largePrimaryButtonClass}
                disabled={status.isFetching}
                onClick={() => void status.refetch()}
                type="button"
              >
                {status.isFetching ? "Checking…" : "Try again"}
              </button>
            )}
            <Link className={textLinkClass} href={billingRoutes.overview}>
              Go to billing
            </Link>
          </>
        }
        description={
          missing
            ? "We could not find this checkout for your account. Your billing page shows your subscription and payment history."
            : "We could not reach our billing service just now. This does not affect your payment."
        }
        icon="attention"
        title={
          missing
            ? "We couldn't find this checkout"
            : "We couldn't check your payment"
        }
      />
    );
  }

  const polling =
    status.data.shouldContinuePolling &&
    !status.pollingExhausted &&
    !status.isError;
  const content = describeView(view, status.data, {
    retryHref: billingRoutes.checkoutForPlan(
      attempt.planId,
      attempt.billingInterval,
    ),
    supportEmail,
  });
  const needsManualCheck = isAwaitingBackend(view) && !polling;

  return (
    <PaymentResultCard
      actions={
        <>
          {content.primary}
          {needsManualCheck ? (
            <button
              className={
                content.primary ? textLinkClass : largePrimaryButtonClass
              }
              disabled={status.isFetching}
              onClick={() => void status.refetch()}
              type="button"
            >
              {status.isFetching ? "Checking…" : "Check again"}
            </button>
          ) : null}
          {content.secondary}
        </>
      }
      busy={polling}
      description={
        <>
          {content.description}
          {needsManualCheck && status.data.shouldContinuePolling ? (
            <>
              {" "}
              This is taking longer than usual. It does not mean your payment
              failed.
            </>
          ) : null}
          {status.isError ? (
            <>
              {" "}
              We could not refresh the status just now; the last confirmed state
              is shown.
            </>
          ) : null}
        </>
      }
      footer={content.footer}
      icon={content.icon}
      title={content.title}
    >
      <PaymentResultSummary
        amount={formatMinorUnits(status.data.amount, status.data.currencyCode)}
        amountLabel={content.paid ? "Amount paid" : "Amount"}
        planDetail={
          plan && attempt?.billingInterval
            ? billingIntervalLabel(attempt.billingInterval)
            : undefined
        }
        planName={plan?.name}
      />
    </PaymentResultCard>
  );
}

type ViewContent = Readonly<{
  description: ReactNode;
  footer?: boolean;
  icon: PaymentResultIconKind;
  paid?: boolean;
  primary?: ReactNode;
  secondary?: ReactNode;
  title: string;
}>;

function describeView(
  view: PaymentReturnView,
  data: GetSubscriptionPurchaseStatusQueryResponse,
  {
    retryHref,
    supportEmail,
  }: Readonly<{ retryHref: string; supportEmail: string }>,
): ViewContent {
  const billingLink = (
    <Link className={textLinkClass} href={billingRoutes.overview}>
      Go to billing
    </Link>
  );
  const dashboardLink = (
    <Link className={textLinkClass} href={billingRoutes.dashboard}>
      Go to dashboard
    </Link>
  );
  const returnToCheckout = (
    <Link className={largePrimaryButtonClass} href={retryHref}>
      Return to checkout
    </Link>
  );
  const supportContact = (
    <>
      Contact{" "}
      <a
        className="text-brand-500 font-medium underline"
        href={`mailto:${supportEmail}`}
      >
        {supportEmail}
      </a>{" "}
      with reference{" "}
      <span className="font-mono text-gray-700 dark:text-gray-300">
        {data.merchantReference}
      </span>
      .
    </>
  );
  const backendCopy = describePurchaseStatus(data.status);

  switch (view) {
    case "active":
    case "scheduled":
      return {
        description:
          view === "active"
            ? "Your payment has been received and your subscription is now active."
            : "Your payment has been received and your subscription is scheduled to start at a later date.",
        footer: true,
        icon: "success",
        paid: true,
        primary: (
          <Link
            className={largePrimaryButtonClass}
            href={billingRoutes.overview}
          >
            Continue to billing
            <ArrowRightIcon />
          </Link>
        ),
        secondary: dashboardLink,
        title: "Payment successful",
      };
    case "activating":
      return {
        description:
          "Your payment has been received. We're activating your subscription, which usually takes a few moments. This page updates automatically.",
        icon: "pending",
        paid: true,
        secondary: billingLink,
        title: "Activating your subscription",
      };
    case "pending":
      return {
        description: `We're waiting for ${data.paymentProviderName} to confirm your payment. This page updates automatically.`,
        icon: "pending",
        secondary: billingLink,
        title: "Confirming your payment",
      };
    case "not-completed":
      return {
        description: `We haven't received a payment for this checkout yet. If you left ${data.paymentProviderName} before paying, return to checkout to continue. If you did pay, this page updates once the payment is confirmed.`,
        icon: "pending",
        primary: returnToCheckout,
        secondary: dashboardLink,
        title: "Payment not completed",
      };
    case "cancelled":
      return {
        description:
          "No payment was completed, and your subscription was not activated. You can return to checkout and try again when you're ready.",
        icon: "cancelled",
        primary: returnToCheckout,
        secondary: dashboardLink,
        title: "Payment cancelled",
      };
    case "failed":
    case "expired":
      return {
        description: backendCopy.description,
        icon: "cancelled",
        primary: returnToCheckout,
        secondary: billingLink,
        title: backendCopy.title,
      };
    case "underpaid":
    case "blocked":
      return {
        description: (
          <>
            {backendCopy.description} {supportContact}
          </>
        ),
        icon: "attention",
        paid: view === "blocked",
        primary: (
          <Link
            className={largePrimaryButtonClass}
            href={billingRoutes.overview}
          >
            Go to billing
          </Link>
        ),
        title: backendCopy.title,
      };
    case "subscription-ended":
      return {
        description: backendCopy.description,
        icon: "cancelled",
        primary: (
          <Link
            className={largePrimaryButtonClass}
            href={billingRoutes.overview}
          >
            Go to billing
          </Link>
        ),
        secondary: dashboardLink,
        title: backendCopy.title,
      };
    case "unknown":
      return {
        description: backendCopy.description,
        icon: "pending",
        secondary: billingLink,
        title: backendCopy.title,
      };
  }
}

function CheckingPayment() {
  return (
    <PaymentResultCard
      actions={null}
      busy
      description="We're checking your payment with our billing service."
      icon="pending"
      title="Confirming your payment"
    />
  );
}

function MissingCheckout({ planId }: Readonly<{ planId: string | undefined }>) {
  return (
    <PaymentResultCard
      actions={
        <>
          <Link
            className={largePrimaryButtonClass}
            href={billingRoutes.overview}
          >
            Go to billing
          </Link>
          <Link
            className={textLinkClass}
            href={
              planId
                ? billingRoutes.checkoutForPlan(planId)
                : billingRoutes.checkout
            }
          >
            Return to checkout
          </Link>
        </>
      }
      description="We couldn't find a recent checkout in this browser, so we can't confirm a payment here. Your billing page shows your current subscription and payment history, including any payment confirmed since."
      icon="attention"
      title="We couldn't find your checkout"
    />
  );
}
