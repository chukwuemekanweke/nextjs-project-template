"use client";

import {
  defaultSubscriptionPlanPrice,
  findSubscriptionPlanPrice,
  subscriptionPlanPrices,
  type EligiblePaymentProviderResponse,
  type SubscriptionPlanResponse,
} from "@template/api-client/subscriptions";
import {
  useEligiblePaymentProviders,
  usePurchaseSubscription,
  useSubscriptionPlans,
} from "@template/api-react/subscriptions";
import {
  Alert,
  ArrowRightIcon,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CreditCardIcon,
  IconTile,
  LockIcon,
  Skeleton,
  Spinner,
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
  submitAndFollowCheckout,
  type CheckoutOutcome,
} from "@/lib/checkout-submission";
import { useRememberedCheckoutAttempt } from "@/lib/use-checkout-attempt";
import { checkoutNextStepDisclosure } from "@/lib/billing-presentation";
import { BillingIntervalToggle } from "../billing-interval-toggle";
import { SubscriptionOrderSummary } from "./order-summary";
import { PaymentInstructions } from "./payment-instructions";
import { ProviderRedirect } from "./provider-redirect";
import { PaymentMethodSelector } from "./payment-method-selector";
import { PlanPicker } from "./plan-picker";

type InstructionOutcome = Extract<
  CheckoutOutcome,
  { type: "bank-transfer" | "redirect" | "unsupported" }
>;

export function CheckoutView({
  billingInterval,
  navigate = (href) => window.location.assign(href),
  planId,
}: Readonly<{
  /** Requested interval; ignored unless the plan offers it. */
  billingInterval?: string | undefined;
  navigate?: (href: string) => void;
  planId: string;
}>) {
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
  if (!plan || subscriptionPlanPrices(plan).length === 0) {
    return (
      <PlanPicker notice="The selected plan is no longer available. Choose another plan." />
    );
  }
  return (
    <PlanCheckout
      navigate={navigate}
      ownerType={ownerType}
      plan={plan}
      requestedInterval={billingInterval}
    />
  );
}

function PlanCheckout({
  navigate,
  ownerType,
  plan,
  requestedInterval,
}: Readonly<{
  navigate: (href: string) => void;
  ownerType: ReturnType<typeof resolveBillingOwnerType>;
  plan: SubscriptionPlanResponse;
  requestedInterval: string | undefined;
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
  const [chosenInterval, setChosenInterval] = useState<string>();
  const [error, setError] = useState<string>();
  const [outcome, setOutcome] = useState<InstructionOutcome>();
  const providerId = chosenProviderId ?? lastSelection?.paymentProviderId;
  const autoRenew = chosenAutoRenew ?? lastSelection?.autoRenew ?? true;
  // Explicit choice, then the link's interval, then the remembered one, then
  // the plan default; only intervals the backend offers are ever used.
  const selectedPrice =
    findSubscriptionPlanPrice(plan, chosenInterval) ??
    findSubscriptionPlanPrice(plan, requestedInterval) ??
    defaultSubscriptionPlanPrice(plan, lastSelection?.billingInterval);
  const offeredIntervals = subscriptionPlanPrices(plan).map(
    (offered) => offered.billingInterval,
  );
  const billingInterval = selectedPrice?.billingInterval ?? "";
  const price = selectedPrice
    ? formatMinorUnits(selectedPrice.price, plan.currencyCode)
    : "";

  const selectedProvider = providers.data?.find(
    (provider) => provider.id === providerId,
  );
  // Never promise renewal through a provider that cannot charge again.
  const renewsAutomatically =
    autoRenew && selectedProvider?.supportsRecurringPayments !== false;
  const canSubmit =
    !purchase.isPending &&
    selectedPrice !== undefined &&
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
    const result = await submitAndFollowCheckout(
      submitterRef.current,
      {
        autoRenew,
        billingAccountOwnerType: ownerType,
        billingInterval,
        paymentProviderId: selectedProvider.id,
        planId: plan.id,
      },
      navigate,
    );
    if (result.type === "ignored") return;
    if (result.type === "error") {
      setError(result.message);
      return;
    }
    setOutcome(result);
  }

  const nextStep = checkoutNextStepDisclosure(selectedProvider);

  if (outcome) {
    return (
      <div className={checkoutGridClass}>
        <Card>
          <CardContent>
            {outcome.type === "redirect" ? (
              <ProviderRedirect
                href={outcome.href}
                providerName={outcome.response.paymentProviderName}
              />
            ) : (
              <>
                <PaymentCardHeader
                  description="Your checkout was created. Follow the steps below."
                  title="Complete your payment"
                />
                <div className="mt-6">
                  <PaymentInstructions amount={price} outcome={outcome} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <SubscriptionOrderSummary
          autoRenew={renewsAutomatically}
          billingInterval={billingInterval}
          plan={plan}
          price={price}
        />
      </div>
    );
  }

  return (
    // Payment method first, then the summary with the pay action, in reading
    // order on every viewport (reference `UserCheckout`).
    <form
      aria-busy={purchase.isPending}
      className={checkoutGridClass}
      onSubmit={submit}
    >
      <div className="min-w-0 space-y-6">
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
        <Card aria-labelledby="payment-method-heading" role="region">
          <CardHeader>
            <div className="min-w-0">
              <CardTitle id="payment-method-heading">Payment method</CardTitle>
              <CardDescription>
                Choose how you would like to pay for {plan.name}.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <PaymentMethodSelector
              disabled={purchase.isPending}
              onSelect={setProviderId}
              providers={providers}
              selectedId={providerId}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <AutoRenewSwitch
              cadence={billingCadence(billingInterval)}
              checked={autoRenew}
              disabled={purchase.isPending}
              onChange={setAutoRenew}
              provider={selectedProvider}
            />
          </CardContent>
        </Card>
      </div>
      <SubscriptionOrderSummary
        autoRenew={renewsAutomatically}
        billingInterval={billingInterval}
        changeHref={billingRoutes.checkout}
        intervalControl={
          offeredIntervals.length > 1 ? (
            <BillingIntervalToggle
              disabled={purchase.isPending}
              intervals={offeredIntervals}
              name="billingInterval"
              onChange={setChosenInterval}
              value={billingInterval}
            />
          ) : null
        }
        plan={plan}
        price={price}
      >
        <div className="space-y-3">
          <Button
            disabled={!canSubmit}
            fullWidth
            leadingIcon={
              purchase.isPending ? <Spinner decorative size="sm" /> : undefined
            }
            trailingIcon={purchase.isPending ? undefined : <ArrowRightIcon />}
            type="submit"
          >
            {purchase.isPending ? "Starting checkout…" : `Pay ${price}`}
          </Button>
          {nextStep ? (
            <p className="text-caption text-fg-subtle" data-next-step="">
              {nextStep}
            </p>
          ) : null}
          <p className="text-caption text-fg-subtle flex items-start gap-2">
            <LockIcon className="mt-0.5 shrink-0" size="xs" />
            <span>
              Secure payment. Your payment is processed by our billing service.
            </span>
          </p>
        </div>
      </SubscriptionOrderSummary>
    </form>
  );
}

/**
 * Auto-renew preference (reference `.switch` card). A native checkbox with
 * `role="switch"` keeps form semantics. The provider's recurring capability
 * decides whether renewal is promised; the stored preference is unchanged.
 */
function AutoRenewSwitch({
  cadence,
  checked,
  disabled,
  onChange,
  provider,
}: Readonly<{
  cadence: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  provider: EligiblePaymentProviderResponse | undefined;
}>) {
  const unsupported = checked && provider?.supportsRecurringPayments === false;
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 has-disabled:cursor-not-allowed">
      <span className="min-w-0">
        <span className="text-fg block font-medium">
          Renew automatically at the end of each {cadence}
        </span>
        {unsupported ? (
          <span className="text-small text-warning mt-0.5 block">
            {provider.name} does not support automatic recurring charges.
          </span>
        ) : (
          <span className="text-small text-fg-muted mt-0.5 block">
            Renewal needs a provider that supports auto-renew. You can cancel at
            period end from Billing.
          </span>
        )}
      </span>
      <span className="relative inline-flex h-11 w-11 shrink-0 items-center">
        <input
          checked={checked}
          className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          disabled={disabled}
          name="autoRenew"
          onChange={(event) => onChange(event.target.checked)}
          role="switch"
          type="checkbox"
        />
        <span
          aria-hidden="true"
          className="bg-switch-track peer-checked:bg-brand peer-focus-visible:outline-focus h-6 w-11 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:opacity-50"
        />
        <span
          aria-hidden="true"
          className="bg-switch-thumb pointer-events-none absolute left-[3px] size-[18px] rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}

function PaymentCardHeader({
  description,
  title,
}: Readonly<{ description: string; title: string }>) {
  return (
    <div className="flex items-center gap-4">
      <IconTile size="lg">
        <CreditCardIcon />
      </IconTile>
      <div className="min-w-0">
        <h2 className="text-h2 text-fg">{title}</h2>
        <p className="text-fg-muted mt-1 break-words">{description}</p>
      </div>
    </div>
  );
}

const checkoutGridClass =
  "grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]";

function CheckoutSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading checkout"
      className={checkoutGridClass}
      role="status"
    >
      <Skeleton className="h-96 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
