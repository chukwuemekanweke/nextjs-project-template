import type { PurchaseSubscriptionMutationResponse } from "@template/api-client/subscriptions";
import type { PurchaseSubscriptionVariables } from "@template/api-react/subscriptions";
import { describePurchaseError, safePaymentLink } from "./billing-display";
import {
  isSameSelection,
  resolveCheckoutAttempt,
  type CheckoutAttempt,
  type CheckoutAttemptStore,
  type CheckoutSelection,
} from "./checkout-attempt";

export type CheckoutOutcome =
  | Readonly<{ type: "ignored" }>
  | Readonly<{ message: string; type: "error" }>
  | Readonly<{
      href: string;
      response: PurchaseSubscriptionMutationResponse;
      type: "redirect";
    }>
  | Readonly<{
      response: PurchaseSubscriptionMutationResponse;
      type: "bank-transfer";
    }>
  | Readonly<{
      response: PurchaseSubscriptionMutationResponse;
      type: "unsupported";
    }>;

export type CheckoutSubmitterOptions = Readonly<{
  createKey: () => string;
  purchase: (
    variables: PurchaseSubscriptionVariables,
  ) => Promise<PurchaseSubscriptionMutationResponse>;
  store: CheckoutAttemptStore;
}>;

/** Maps the backend's instruction contract to the next frontend step. */
export function checkoutOutcomeFor(
  response: PurchaseSubscriptionMutationResponse,
): CheckoutOutcome {
  if (response.paymentMethodType === "PaymentLink") {
    const href = safePaymentLink(response.instructionFields);
    return href
      ? { href, response, type: "redirect" }
      : { response, type: "unsupported" };
  }
  if (response.paymentMethodType === "BankTransfer") {
    return { response, type: "bank-transfer" };
  }
  return { response, type: "unsupported" };
}

/**
 * Runs one submission and, for a hosted checkout, navigates to the
 * backend-returned link exactly once. Navigation is driven by the submit
 * event, never by a render effect, so re-renders cannot repeat it; an ignored
 * duplicate submission or a failure never navigates.
 */
export async function submitAndFollowCheckout(
  submitter: Pick<ReturnType<typeof createCheckoutSubmitter>, "submit">,
  selection: CheckoutSelection,
  navigate: (href: string) => void,
): Promise<CheckoutOutcome> {
  const outcome = await submitter.submit(selection);
  if (outcome.type === "redirect") navigate(outcome.href);
  return outcome;
}

/**
 * Submits checkout attempts. While a submission is in flight further calls
 * are ignored (usability only; the backend enforces idempotency). An
 * identical selection reuses the remembered idempotency key; a changed one
 * gets a new key. Definitive rejections discard the attempt.
 *
 * The store is shared by every tab, so an attempt whose outcome is still
 * unknown (sent, but no purchase id yet) is also kept in memory: a retry in
 * this tab replays its key even if another tab has overwritten the store.
 */
export function createCheckoutSubmitter({
  createKey,
  purchase,
  store,
}: CheckoutSubmitterOptions) {
  let inFlight = false;
  let unresolved: CheckoutAttempt | undefined;

  return {
    get inFlight() {
      return inFlight;
    },
    async submit(selection: CheckoutSelection): Promise<CheckoutOutcome> {
      if (inFlight) return { type: "ignored" };
      inFlight = true;
      const attempt = resolveCheckoutAttempt(
        unresolved && isSameSelection(unresolved, selection)
          ? unresolved
          : store.read(),
        selection,
        createKey,
      );
      unresolved = attempt;
      store.write(attempt);
      try {
        const response = await purchase({
          idempotencyKey: attempt.idempotencyKey,
          request: selection,
        });
        unresolved = undefined;
        store.write({ ...attempt, purchaseId: response.purchaseId });
        return checkoutOutcomeFor(response);
      } catch (error) {
        const presentation = describePurchaseError(error);
        if (presentation.discardAttempt) {
          unresolved = undefined;
          store.discard(attempt.idempotencyKey);
        }
        return { message: presentation.message, type: "error" };
      } finally {
        inFlight = false;
      }
    },
  };
}
