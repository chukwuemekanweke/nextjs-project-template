import { isApiError } from "@template/api-client";
import type {
  GetCurrentSubscriptionQueryResponse,
  SubscriptionPaymentInstructionFields,
} from "@template/api-client/subscriptions";

export type StatusTone = "danger" | "info" | "neutral" | "success" | "warning";

const DISPLAY_LOCALE = "en-US";

/**
 * Formats a backend UTC timestamp as a calendar date. Values are displayed as
 * returned; billing dates are never derived from the interval.
 */
export function formatBillingDate(
  value: string | null | undefined,
  {
    locale = DISPLAY_LOCALE,
    timeZone,
  }: { locale?: string; timeZone?: string } = {},
): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  }).format(timestamp);
}

export function formatBillingDateTime(
  value: string | null | undefined,
  {
    locale = DISPLAY_LOCALE,
    timeZone,
  }: { locale?: string; timeZone?: string } = {},
): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(timestamp);
}

export function billingIntervalLabel(billingInterval: string): string {
  if (billingInterval === "Monthly") return "Billed monthly";
  if (billingInterval === "Yearly") return "Billed yearly";
  return `Billed ${billingInterval.toLowerCase()}`;
}

export function billingCadence(billingInterval: string): string {
  if (billingInterval === "Monthly") return "month";
  if (billingInterval === "Yearly") return "year";
  return billingInterval.toLowerCase();
}

export type SubscriptionPresentation = Readonly<{
  description: string;
  label: string;
  tone: StatusTone;
}>;

/**
 * Presentation for the current subscription. `lifecycleStatus` drives the
 * label (it adds `PastDue`); the raw `status` is preserved by callers.
 */
export function describeSubscription(
  subscription: Pick<
    GetCurrentSubscriptionQueryResponse,
    "cancelAtPeriodEnd" | "lifecycleStatus"
  >,
): SubscriptionPresentation {
  if (
    subscription.cancelAtPeriodEnd &&
    (subscription.lifecycleStatus === "Active" ||
      subscription.lifecycleStatus === "PastDue")
  ) {
    return {
      description:
        "Your subscription stays active until the cancellation date and will not renew.",
      label: "Cancellation scheduled",
      tone: "warning",
    };
  }
  switch (subscription.lifecycleStatus) {
    case "Active":
      return {
        description: "Your subscription is active.",
        label: "Active",
        tone: "success",
      };
    case "PastDue":
      return {
        description:
          "Your current period has ended and the renewal payment has not been settled yet.",
        label: "Past due",
        tone: "danger",
      };
    case "Pending":
      return {
        description: "Your subscription is waiting for payment confirmation.",
        label: "Pending",
        tone: "info",
      };
    case "Scheduled":
      return {
        description: "Your subscription is paid and starts at a later date.",
        label: "Scheduled",
        tone: "info",
      };
    case "Cancelled":
      return {
        description: "This subscription has been cancelled.",
        label: "Cancelled",
        tone: "neutral",
      };
    case "Expired":
      return {
        description: "This subscription has expired.",
        label: "Expired",
        tone: "neutral",
      };
    default:
      return {
        description: "Your subscription status is being updated.",
        label: subscription.lifecycleStatus,
        tone: "neutral",
      };
  }
}

/** Cancellation is offered only for an active entitlement not already cancelling. */
export function canScheduleCancellation(
  subscription: Pick<
    GetCurrentSubscriptionQueryResponse,
    "cancelAtPeriodEnd" | "status"
  >,
): boolean {
  return subscription.status === "Active" && !subscription.cancelAtPeriodEnd;
}

export type PurchaseOutcomeKind =
  | "active"
  | "blocked"
  | "payment-received"
  | "payment-unsuccessful"
  | "processing"
  | "scheduled"
  | "subscription-ended"
  | "unknown";

export type PurchaseStatusPresentation = Readonly<{
  description: string;
  kind: PurchaseOutcomeKind;
  title: string;
  tone: StatusTone;
}>;

export function describePurchaseStatus(
  status: string,
): PurchaseStatusPresentation {
  switch (status) {
    case "PurchaseInitiated":
    case "PaymentPending":
      return {
        description:
          "We are waiting for your payment provider to confirm the payment. This page updates automatically.",
        kind: "processing",
        title: "Waiting for payment",
        tone: "info",
      };
    case "PaymentSucceededFulfillmentPending":
      return {
        description:
          "Your payment was received. We are activating your subscription, which can take a few moments.",
        kind: "payment-received",
        title: "Payment received — activating your subscription",
        tone: "info",
      };
    case "SubscriptionActive":
      return {
        description: "Your subscription is active and ready to use.",
        kind: "active",
        title: "Subscription active",
        tone: "success",
      };
    case "SubscriptionScheduled":
      return {
        description:
          "Your payment was received and your subscription is scheduled to start at a later date.",
        kind: "scheduled",
        title: "Subscription scheduled",
        tone: "success",
      };
    case "PaymentFailed":
      return {
        description:
          "The payment was not completed. You have not been subscribed through this checkout.",
        kind: "payment-unsuccessful",
        title: "Payment failed",
        tone: "danger",
      };
    case "PaymentCancelled":
      return {
        description:
          "The payment was cancelled. You have not been subscribed through this checkout.",
        kind: "payment-unsuccessful",
        title: "Payment cancelled",
        tone: "warning",
      };
    case "PaymentExpired":
      return {
        description:
          "The payment window expired before payment was completed. You can start a new checkout.",
        kind: "payment-unsuccessful",
        title: "Payment expired",
        tone: "warning",
      };
    case "PaymentUnderpaid":
      return {
        description:
          "The amount received was less than the plan price, so the subscription was not activated. Contact support about the partial payment.",
        kind: "payment-unsuccessful",
        title: "Payment incomplete",
        tone: "danger",
      };
    case "SubscriptionCancelled":
      return {
        description:
          "The subscription created by this purchase has since been cancelled.",
        kind: "subscription-ended",
        title: "Subscription cancelled",
        tone: "neutral",
      };
    case "SubscriptionExpired":
      return {
        description:
          "The subscription created by this purchase has since expired.",
        kind: "subscription-ended",
        title: "Subscription expired",
        tone: "neutral",
      };
    case "FulfillmentBlocked":
      return {
        description:
          "We could not finish activating your subscription automatically. This does not mean your payment failed. Contact support with the reference below so we can resolve it.",
        kind: "blocked",
        title: "Activation needs attention",
        tone: "warning",
      };
    default:
      return {
        description:
          "We are confirming the latest state of this purchase. Check again shortly or contact support with the reference below.",
        kind: "unknown",
        title: "Confirming your purchase",
        tone: "neutral",
      };
  }
}

const PAYMENT_STATUS_LABELS: Readonly<
  Record<string, Readonly<{ label: string; tone: StatusTone }>>
> = {
  Cancelled: { label: "Cancelled", tone: "neutral" },
  Expired: { label: "Expired", tone: "neutral" },
  Failed: { label: "Failed", tone: "danger" },
  Initiated: { label: "Pending", tone: "info" },
  PendingInitiation: { label: "Pending", tone: "info" },
  Succeeded: { label: "Paid", tone: "success" },
  Underpaid: { label: "Underpaid", tone: "warning" },
};

/** Raw payment status for billing-history rows; unknown values pass through. */
export function describePaymentStatus(paymentStatus: string) {
  return (
    PAYMENT_STATUS_LABELS[paymentStatus] ?? {
      label: paymentStatus,
      tone: "neutral" as const,
    }
  );
}

/** Payment methods this portal can complete without inventing behavior. */
export const PORTAL_PAYMENT_METHODS = new Set(["BankTransfer", "PaymentLink"]);

export function isPortalSupportedPaymentMethod(paymentMethodType: string) {
  return PORTAL_PAYMENT_METHODS.has(paymentMethodType);
}

export function paymentMethodLabel(paymentMethodType: string): string {
  if (paymentMethodType === "PaymentLink") return "Hosted checkout";
  if (paymentMethodType === "BankTransfer") return "Bank transfer";
  if (paymentMethodType === "Card") return "Card";
  return paymentMethodType;
}

/**
 * Returns the backend-provided hosted checkout URL only when it is an absolute
 * HTTPS URL without embedded credentials. Provider URLs are never constructed.
 */
export function safePaymentLink(
  fields: SubscriptionPaymentInstructionFields | undefined,
): string | undefined {
  const value = fields?.paymentLink;
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

const BANK_TRANSFER_FIELDS = [
  ["bankName", "Bank"],
  ["accountName", "Account name"],
  ["accountNumber", "Account number"],
  ["providerReference", "Payment reference"],
] as const;

/** Documented bank-transfer fields, in display order, omitting absent values. */
export function bankTransferDetails(
  fields: SubscriptionPaymentInstructionFields | undefined,
): Array<Readonly<{ label: string; value: string }>> {
  return BANK_TRANSFER_FIELDS.flatMap(([key, label]) => {
    const value = fields?.[key]?.trim();
    return value ? [{ label, value }] : [];
  });
}

export type PurchaseErrorPresentation = Readonly<{
  /**
   * True when the backend definitively rejected the request, so the next
   * deliberate submission must use a new idempotency key. Ambiguous failures
   * (network, timeout, 5xx, 401, 429) keep the key so a retry replays.
   */
  discardAttempt: boolean;
  message: string;
}>;

export function describePurchaseError(
  error: unknown,
): PurchaseErrorPresentation {
  if (isApiError(error)) {
    switch (error.status) {
      case 400:
        return {
          discardAttempt: true,
          message:
            "This plan or payment method is not available for your account. Choose another payment method or plan.",
        };
      case 403:
        return {
          discardAttempt: true,
          message:
            "Your account is not allowed to purchase this subscription. Contact support if you think this is a mistake.",
        };
      case 404:
        return {
          discardAttempt: true,
          message: "This plan is no longer available. Choose another plan.",
        };
      case 409:
        return {
          discardAttempt: true,
          message:
            "This checkout conflicts with an existing subscription or an earlier checkout. Review your billing page before trying again.",
        };
      case 401:
        return {
          discardAttempt: false,
          message: "Your session has expired. Sign in again to continue.",
        };
      case 429:
        return {
          discardAttempt: false,
          message: "Too many attempts. Wait a moment, then try again.",
        };
    }
  }
  return {
    discardAttempt: false,
    message:
      "We could not confirm your checkout. Try again — retrying this checkout will not create a second purchase.",
  };
}

export function describeBillingLoadError(error: unknown, subject: string) {
  if (isApiError(error)) {
    if (error.status === 401) {
      return "Your session has expired. Sign in again to continue.";
    }
    if (error.status === 403) {
      return `You do not have access to ${subject}.`;
    }
  }
  return `${subject[0]?.toUpperCase()}${subject.slice(1)} could not be loaded. Refresh and try again.`;
}

/** Confirmation copy using only the backend-returned entitlement date. */
export function describeCancellationResult(
  response: Readonly<{ changed: boolean; entitledUntilUtc: string | null }>,
): string {
  const until = formatBillingDate(response.entitledUntilUtc);
  if (response.changed) {
    return until
      ? `Cancellation scheduled. You keep access until ${until}.`
      : "Cancellation scheduled. You keep access until the end of your current period.";
  }
  return until
    ? `Cancellation was already scheduled; access continues until ${until}.`
    : "Cancellation was already scheduled.";
}

export function describeCancellationError(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 404) {
      return "There is no active subscription to cancel.";
    }
    if (error.status === 401) {
      return "Your session has expired. Sign in again to continue.";
    }
    if (error.status === 403) {
      return "You do not have permission to cancel this subscription.";
    }
  }
  return "Cancellation could not be scheduled. Try again.";
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBackendId(value: string | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function firstSearchParameter(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
