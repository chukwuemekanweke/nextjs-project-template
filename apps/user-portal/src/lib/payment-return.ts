import type { GetSubscriptionPurchaseStatusQueryResponse } from "@template/api-client/subscriptions";
import { billingRoutes } from "@/config/billing";

/**
 * Which provider return route the customer landed on. It is only a UI hint
 * for wording; it never decides the outcome. `undefined` is the hint-free
 * `/billing/checkout/return` route.
 */
export type ProviderReturnHint = "cancelled" | "success" | undefined;

export type PaymentReturnView =
  /** Backend confirmed payment and an active subscription. */
  | "active"
  /** Payment received; fulfillment has not activated the subscription yet. */
  | "activating"
  /** Payment confirmed; the subscription starts later. */
  | "scheduled"
  /** Payment not confirmed yet (still payable, or awaiting provider). */
  | "pending"
  /** The customer left the provider page and the backend has no payment yet. */
  | "not-completed"
  /** Backend confirmed no payment was taken after a cancellation. */
  | "cancelled"
  | "failed"
  | "expired"
  | "underpaid"
  | "blocked"
  | "subscription-ended"
  | "unknown";

/**
 * Maps the authoritative purchase status to what the return routes show.
 *
 * - Success needs `SubscriptionActive`; a paid but unfulfilled purchase is
 *   `activating`, never success.
 * - The cancel hint can soften wording but never overrides the backend: a
 *   paid purchase still resolves to `active`/`activating`. Bachs records a
 *   cancelled checkout as a failed payment (no money taken), so a cancel
 *   return plus `PaymentFailed` reads as a cancellation.
 * - While the backend has no payment, a cancel return is `not-completed`
 *   (the checkout can still be paid until it expires), never `cancelled`.
 */
export function resolvePaymentReturnView(
  status: Pick<GetSubscriptionPurchaseStatusQueryResponse, "status">,
  hint: ProviderReturnHint,
): PaymentReturnView {
  switch (status.status) {
    case "SubscriptionActive":
      return "active";
    case "SubscriptionScheduled":
      return "scheduled";
    case "PaymentSucceededFulfillmentPending":
      return "activating";
    case "PurchaseInitiated":
    case "PaymentPending":
      return hint === "cancelled" ? "not-completed" : "pending";
    case "PaymentCancelled":
      return "cancelled";
    case "PaymentFailed":
      return hint === "cancelled" ? "cancelled" : "failed";
    case "PaymentExpired":
      return "expired";
    case "PaymentUnderpaid":
      return "underpaid";
    case "FulfillmentBlocked":
      return "blocked";
    case "SubscriptionCancelled":
    case "SubscriptionExpired":
      return "subscription-ended";
    default:
      return "unknown";
  }
}

/**
 * The route whose URL matches a confirmed outcome, when the customer is on a
 * different one (for example Bachs sent them to the cancel URL but the backend
 * reports an active subscription). Only backend-confirmed outcomes move.
 */
export function canonicalPaymentReturnRoute(
  view: PaymentReturnView,
  hint: ProviderReturnHint,
): string | undefined {
  if ((view === "active" || view === "scheduled") && hint !== "success") {
    return billingRoutes.checkoutSuccess;
  }
  if (view === "cancelled" && hint !== "cancelled") {
    return billingRoutes.checkoutCancelled;
  }
  return undefined;
}

/** Views that are still waiting on the backend and keep polling. */
export function isAwaitingBackend(view: PaymentReturnView): boolean {
  return (
    view === "pending" ||
    view === "activating" ||
    view === "not-completed" ||
    view === "unknown"
  );
}
