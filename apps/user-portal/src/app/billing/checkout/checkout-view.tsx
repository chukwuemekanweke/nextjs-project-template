"use client";

import type { SubscriptionPlanResponse } from "@template/api-client/subscriptions";
import {
  useEligiblePaymentProviders,
  usePurchaseSubscription,
  useSubscriptionPlans,
} from "@template/api-react/subscriptions";
import {
  Alert,
  Card,
  CardContent,
  Skeleton,
  formatMinorUnits,
} from "@template/ui-core";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  billingCadence,
  describeBillingLoadError,
  isPortalSupportedPaymentMethod,
} from "@/lib/billing-display";
import {
  browserCheckoutAttemptStore,
  createIdempotencyKey,
} from "@/lib/checkout-attempt";
import {
  createCheckoutSubmitter,
  type CheckoutOutcome,
} from "@/lib/checkout-submission";
import { useRememberedCheckoutAttempt } from "@/lib/use-checkout-attempt";
import { largePrimaryButtonClass } from "../billing-ui";
import {
  ArrowRightIcon,
  LockIcon,
  PaymentCardIcon,
  SpinnerIcon,
} from "./checkout-icons";
import { SubscriptionOrderSummary } from "./order-summary";
import { PaymentInstructions } from "./payment-instructions";
import { PaymentMethodSelector } from "./payment-method-selector";
import { PlanPicker } from "./plan-picker";

type InstructionOutcome = Extract<
  CheckoutOutcome,
  { type: "bank-transfer" | "redirect" | "unsupported" }
>;

export function CheckoutView({
  navigate = (href) => window.location.assign(href),
  planId,
}: Readonly<{ navigate?: (href: string) => void; planId: string }>) {
  const ownerType = resolveBillingOwnerType();
  const plans = useSubscriptionPlans();
  const plan = plans.data?.find((candidate) => candidate.id === planId);

  if (plans.isPending) {
    return <CheckoutSkeleton />;
  }
  if (plans.isError) {
    return (
      <Alert variant="error">
        {describeBillingLoadError(plans.error, "subscription plans")}
      </Alert>
    );
  }
  if (!plan) {
    return (
      <PlanPicker notice="The selected plan is no longer available. Choose another plan." />
    );
  }
  return <PlanCheckout navigate={navigate} ownerType={ownerType} plan={plan} />;
}

function PlanCheckout({
  navigate,
  ownerType,
  plan,
}: Readonly<{
  navigate: (href: string) => void;
  ownerType: ReturnType<typeof resolveBillingOwnerType>;
  plan: SubscriptionPlanResponse;
}>) {
  const providers = useEligiblePaymentProviders(plan.id, ownerType);
  const purchase = usePurchaseSubscription();
  const submitterRef =
    useRef<ReturnType<typeof createCheckoutSubmitter>>(undefined);
  const remembered = useRememberedCheckoutAttempt();
  // An interrupted, unsettled attempt for this plan restores its selection so
  // an identical retry reuses the same idempotency key.
  const previousAttempt =
    remembered &&
    !remembered.settledAtUtc &&
    remembered.planId === plan.id &&
    remembered.billingAccountOwnerType === ownerType
      ? remembered
      : undefined;
  // A settled attempt for this plan (for example a cancelled payment) only
  // pre-selects its choices; submitting starts a new attempt and key.
  const lastSelection =
    remembered?.planId === plan.id &&
    remembered.billingAccountOwnerType === ownerType
      ? remembered
      : undefined;
  const [chosenProviderId, setProviderId] = useState<string>();
  const [chosenAutoRenew, setAutoRenew] = useState<boolean>();
  const [error, setError] = useState<string>();
  const [outcome, setOutcome] = useState<InstructionOutcome>();
  const providerId = chosenProviderId ?? lastSelection?.paymentProviderId;
  const autoRenew = chosenAutoRenew ?? lastSelection?.autoRenew ?? true;
  const price = formatMinorUnits(plan.price, plan.currencyCode);

  const selectedProvider = providers.data?.find(
    (provider) => provider.id === providerId,
  );
  // Never promise renewal through a provider that cannot charge again.
  const renewsAutomatically =
    autoRenew && selectedProvider?.supportsRecurringPayments !== false;
  const canSubmit =
    !purchase.isPending &&
    selectedProvider !== undefined &&
    isPortalSupportedPaymentMethod(selectedProvider.paymentMethodType);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProvider || !canSubmit) return;
    submitterRef.current ??= createCheckoutSubmitter({
      createKey: createIdempotencyKey,
      purchase: purchase.mutateAsync,
      store: browserCheckoutAttemptStore(),
    });
    setError(undefined);
    const result = await submitterRef.current.submit({
      autoRenew,
      billingAccountOwnerType: ownerType,
      paymentProviderId: selectedProvider.id,
      planId: plan.id,
    });
    if (result.type === "ignored") return;
    if (result.type === "error") {
      setError(result.message);
      return;
    }
    setOutcome(result);
    if (result.type === "redirect") navigate(result.href);
  }

  return (
    // The summary comes first in reading order so small screens show the plan
    // before payment; on wide screens it moves to the right-hand column.
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:gap-8">
      <SubscriptionOrderSummary
        autoRenew={renewsAutomatically}
        className="xl:col-start-2 xl:row-start-1"
        plan={plan}
        price={price}
      />
      <Card className="shadow-theme-sm xl:col-start-1 xl:row-start-1">
        <CardContent className="sm:p-8">
          {outcome ? (
            <>
              <PaymentCardHeader
                description="Your checkout was created. Follow the steps below."
                title="Complete your payment"
              />
              <div className="mt-6">
                <PaymentInstructions amount={price} outcome={outcome} />
              </div>
            </>
          ) : (
            <form aria-busy={purchase.isPending} onSubmit={submit}>
              <PaymentCardHeader
                description={`Choose how you would like to pay for ${plan.name}.`}
                title="Payment"
              />
              <div className="mt-8 space-y-6">
                {previousAttempt?.purchaseId ? (
                  <Alert variant="info">
                    You already started a checkout for this plan.{" "}
                    <Link
                      className="font-medium underline"
                      href={billingRoutes.purchase(previousAttempt.purchaseId)}
                    >
                      Check its payment status
                    </Link>{" "}
                    before paying again.
                  </Alert>
                ) : null}
                {error ? (
                  <Alert onDismiss={() => setError(undefined)} variant="error">
                    {error}{" "}
                    <Link
                      className="font-medium underline"
                      href={billingRoutes.overview}
                    >
                      View billing
                    </Link>
                  </Alert>
                ) : null}
                <PaymentMethodSelector
                  disabled={purchase.isPending}
                  onSelect={setProviderId}
                  providers={providers}
                  selectedId={providerId}
                />
                <div>
                  <label className="flex cursor-pointer items-center gap-3 has-disabled:cursor-not-allowed">
                    <input
                      checked={autoRenew}
                      className="accent-brand-500 focus-visible:outline-brand-500 h-5 w-5 shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2"
                      disabled={purchase.isPending}
                      name="autoRenew"
                      onChange={(event) => setAutoRenew(event.target.checked)}
                      type="checkbox"
                    />
                    <span className="text-sm text-gray-800 sm:text-base dark:text-white/90">
                      Renew automatically at the end of each{" "}
                      {billingCadence(plan.billingInterval)}
                    </span>
                  </label>
                  {autoRenew &&
                  selectedProvider &&
                  !selectedProvider.supportsRecurringPayments ? (
                    <p className="mt-2 pl-8 text-sm text-amber-700 dark:text-amber-400">
                      {selectedProvider.name} does not support automatic
                      recurring charges.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-3">
                  <button
                    className={largePrimaryButtonClass}
                    disabled={!canSubmit}
                    type="submit"
                  >
                    {purchase.isPending ? (
                      <>
                        <SpinnerIcon />
                        <span>Starting checkout…</span>
                      </>
                    ) : (
                      <>
                        {`Pay ${price}`}
                        <ArrowRightIcon />
                      </>
                    )}
                  </button>
                  <p className="flex items-center justify-center gap-2 text-center text-sm text-gray-500 dark:text-gray-400">
                    <LockIcon className="h-4 w-4 shrink-0" />
                    <span>
                      Secure payment. Your payment is processed by our billing
                      service.
                    </span>
                  </p>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentCardHeader({
  description,
  title,
}: Readonly<{ description: string; title: string }>) {
  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <span className="bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14">
        <PaymentCardIcon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm break-words text-gray-600 sm:text-base dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading checkout"
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:gap-8"
      role="status"
    >
      <Skeleton className="h-96 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );
}
