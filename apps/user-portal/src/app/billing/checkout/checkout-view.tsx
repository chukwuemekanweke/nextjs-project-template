"use client";

import { isApiError } from "@template/api-client";
import type {
  EligiblePaymentProviderResponse,
  SubscriptionPlanResponse,
} from "@template/api-client/subscriptions";
import {
  useEligiblePaymentProviders,
  usePurchaseSubscription,
  useSubscriptionPlans,
} from "@template/api-react/subscriptions";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Skeleton,
  formatMinorUnits,
} from "@template/ui-core";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  billingCadence,
  billingIntervalLabel,
  describeBillingLoadError,
  isPortalSupportedPaymentMethod,
  paymentMethodLabel,
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
import { primaryButtonClass } from "../billing-ui";
import { PaymentInstructions } from "./payment-instructions";
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
  const [chosenProviderId, setProviderId] = useState<string>();
  const [chosenAutoRenew, setAutoRenew] = useState<boolean>();
  const [error, setError] = useState<string>();
  const [outcome, setOutcome] = useState<InstructionOutcome>();
  const providerId = chosenProviderId ?? previousAttempt?.paymentProviderId;
  const autoRenew = chosenAutoRenew ?? previousAttempt?.autoRenew ?? true;
  const price = formatMinorUnits(plan.price, plan.currencyCode);

  const selectedProvider = providers.data?.find(
    (provider) => provider.id === providerId,
  );
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
      <Card>
        <CardContent>
          {outcome ? (
            <>
              <CardTitle>Complete your payment</CardTitle>
              <CardDescription>
                Your checkout was created. Follow the steps below.
              </CardDescription>
              <div className="mt-5">
                <PaymentInstructions amount={price} outcome={outcome} />
              </div>
            </>
          ) : (
            <form aria-busy={purchase.isPending} onSubmit={submit}>
              <CardTitle>Payment</CardTitle>
              <CardDescription>
                Choose how you would like to pay for {plan.name}.
              </CardDescription>
              <div className="mt-5 space-y-5">
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
                <ProviderOptions
                  disabled={purchase.isPending}
                  onSelect={setProviderId}
                  providers={providers}
                  selectedId={providerId}
                />
                <div className="space-y-2">
                  <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      checked={autoRenew}
                      className="mt-0.5 h-4 w-4"
                      disabled={purchase.isPending}
                      name="autoRenew"
                      onChange={(event) => setAutoRenew(event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      Renew automatically at the end of each{" "}
                      {billingCadence(plan.billingInterval)}
                    </span>
                  </label>
                  {autoRenew &&
                  selectedProvider &&
                  !selectedProvider.supportsRecurringPayments ? (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {selectedProvider.name} does not support automatic
                      recurring charges.
                    </p>
                  ) : null}
                </div>
                <button
                  className={`${primaryButtonClass} w-full sm:w-auto`}
                  disabled={!canSubmit}
                  type="submit"
                >
                  {purchase.isPending ? "Starting checkout…" : `Pay ${price}`}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <PlanSummary autoRenew={autoRenew} plan={plan} price={price} />
    </div>
  );
}

function ProviderOptions({
  disabled,
  onSelect,
  providers,
  selectedId,
}: Readonly<{
  disabled: boolean;
  onSelect: (id: string) => void;
  providers: ReturnType<typeof useEligiblePaymentProviders>;
  selectedId: string | undefined;
}>) {
  if (providers.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading payment methods" role="status">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  if (providers.isError) {
    return (
      <Alert variant="error">
        {isApiError(providers.error) && providers.error.status === 404
          ? "This plan is no longer available for purchase."
          : describeBillingLoadError(providers.error, "payment methods")}
      </Alert>
    );
  }
  if (providers.data.length === 0) {
    return (
      <Alert variant="warning">
        No payment methods are available for this plan in your region.
      </Alert>
    );
  }
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">
        Payment method
      </legend>
      {providers.data.map((provider) => (
        <ProviderOption
          checked={provider.id === selectedId}
          key={provider.id}
          onSelect={onSelect}
          provider={provider}
        />
      ))}
    </fieldset>
  );
}

function ProviderOption({
  checked,
  onSelect,
  provider,
}: Readonly<{
  checked: boolean;
  onSelect: (id: string) => void;
  provider: EligiblePaymentProviderResponse;
}>) {
  const supported = isPortalSupportedPaymentMethod(provider.paymentMethodType);
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
        checked
          ? "border-brand-500 bg-brand-50/40 dark:bg-brand-500/10"
          : "border-gray-200 dark:border-gray-800"
      } ${supported ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
    >
      <input
        checked={checked}
        className="mt-0.5 h-4 w-4"
        disabled={!supported}
        name="paymentProviderId"
        onChange={() => onSelect(provider.id)}
        type="radio"
        value={provider.id}
      />
      <span>
        <span className="block font-medium text-gray-800 dark:text-white/90">
          {provider.name}
        </span>
        <span className="block text-gray-500 dark:text-gray-400">
          {supported
            ? paymentMethodLabel(provider.paymentMethodType)
            : `${paymentMethodLabel(provider.paymentMethodType)} is not available in this portal yet`}
        </span>
      </span>
    </label>
  );
}

function PlanSummary({
  autoRenew,
  plan,
  price,
}: Readonly<{
  autoRenew: boolean;
  plan: SubscriptionPlanResponse;
  price: string;
}>) {
  const cadence = billingCadence(plan.billingInterval);
  return (
    <Card className="self-start">
      <CardContent className="space-y-3">
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Order summary
        </p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {plan.name}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {price}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {" "}
            / {cadence}
          </span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {billingIntervalLabel(plan.billingInterval)} in {plan.currencyCode}.
          The amount is set by our billing service.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {autoRenew
            ? `Your subscription renews each ${cadence} until you cancel. You can cancel from Billing at any time; access continues to the end of the paid period.`
            : `Your subscription ends at the end of the paid ${cadence} unless you renew.`}
        </p>
      </CardContent>
    </Card>
  );
}

function CheckoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading checkout" role="status">
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
