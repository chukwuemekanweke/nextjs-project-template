"use client";

import type {
  BillingAccountOwnerType,
  GetCurrentSubscriptionQueryResponse,
} from "@template/api-client/subscriptions";
import {
  DEFAULT_BILLING_HISTORY_PAGE_SIZE,
  useBillingHistory,
  useCurrentSubscription,
  useSubscriptionPlans,
} from "@template/api-react/subscriptions";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Alert,
  ArrowRightIcon,
  Card,
  CardContent,
  CreditCardIcon,
  ErrorState,
  HistoryIcon,
  IconTile,
  Skeleton,
  buttonVariants,
} from "@template/ui-core";
import Link from "next/link";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  describeBillingLoadError,
  describeSubscription,
  formatBillingDate,
} from "@/lib/billing-display";
import {
  resolveBillingHistoryPlacement,
  resolveBillingView,
  type BillingHistoryState,
  type BillingView,
} from "@/lib/billing-view";
import { useRememberedCheckoutAttempt } from "@/lib/use-checkout-attempt";
import { BillingHistoryCard } from "./billing-history-card";
import { StatusBadge, textLinkClass } from "./billing-ui";
import {
  CurrentSubscriptionCard,
  PendingSubscriptionCard,
} from "./current-subscription-card";
import { SubscriptionPlanGrid } from "./subscription-plan-grid";

const descriptions: Record<BillingView["kind"], string> = {
  discovery: "Choose the subscription that works best for you.",
  error: "Review your subscription, renewal, and payment history.",
  loading: "Review your subscription, renewal, and payment history.",
  pending: "Manage your subscription, renewal, and payments.",
  subscription: "Manage your subscription, renewal, and payments.",
};

/**
 * Unified Billing entry point (reference `UserBilling-*`). The backend
 * current subscription selects the view; plan count and history totals then
 * select the layout through `lib/billing-view.ts`. Checkout, payment, and
 * polling stay in `/checkout`.
 */
export function BillingOverview({
  eyebrow,
  page,
  supportEmail,
}: Readonly<{
  eyebrow: string;
  page: number;
  supportEmail?: string | undefined;
}>) {
  const ownerType = resolveBillingOwnerType();
  const current = useCurrentSubscription(ownerType);
  const view = resolveBillingView(current);

  return (
    <section
      className={`mx-auto space-y-6 ${view.kind === "discovery" ? "max-w-6xl" : "max-w-5xl"}`}
      data-billing-view={view.kind}
    >
      <DashboardHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href={billingRoutes.history}
          >
            <HistoryIcon />
            Billing history
          </Link>
        }
        description={descriptions[view.kind]}
        eyebrow={eyebrow}
        title="Billing"
      />
      {view.kind === "loading" ? (
        <LoadingSubscription />
      ) : view.kind === "error" ? (
        <Card>
          <ErrorState
            description={describeBillingLoadError(
              view.error,
              "your subscription",
            )}
            onRetry={() => void current.refetch()}
            retrying={current.isFetching}
            title="We couldn't load your subscription"
          />
        </Card>
      ) : view.kind === "subscription" ? (
        <>
          <CurrentSubscriptionCard
            ownerType={ownerType}
            subscription={view.subscription}
          />
          <BillingHistoryCard page={page} />
        </>
      ) : view.kind === "pending" ? (
        <PendingPurchase
          onRefresh={() => void current.refetch()}
          ownerType={ownerType}
          page={page}
          refreshing={current.isFetching}
          subscription={view.subscription}
          supportEmail={supportEmail}
        />
      ) : (
        <PlanDiscovery ended={view.ended} ownerType={ownerType} page={page} />
      )}
    </section>
  );
}

function LoadingSubscription() {
  return (
    <Card aria-busy="true" aria-label="Loading subscription" role="status">
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

function useHistoryState(
  ownerType: BillingAccountOwnerType,
  page: number,
): BillingHistoryState {
  // Same key as BillingHistoryCard, so the table reuses this request.
  const history = useBillingHistory(ownerType, {
    page,
    pageSize: DEFAULT_BILLING_HISTORY_PAGE_SIZE,
  });
  if (history.isPending) return "loading";
  if (history.isError && !history.data) return "error";
  return history.data.totalCount;
}

function PendingPurchase({
  onRefresh,
  ownerType,
  page,
  refreshing,
  subscription,
  supportEmail,
}: Readonly<{
  onRefresh: () => void;
  ownerType: BillingAccountOwnerType;
  page: number;
  refreshing: boolean;
  subscription: GetCurrentSubscriptionQueryResponse;
  supportEmail?: string | undefined;
}>) {
  const attempt = useRememberedCheckoutAttempt();
  const history = useHistoryState(ownerType, page);
  const placement = resolveBillingHistoryPlacement({
    history,
    planCount: undefined,
    view: "pending",
  });

  return (
    <>
      <PendingSubscriptionCard
        attempt={attempt}
        onRefresh={onRefresh}
        refreshing={refreshing}
        subscription={subscription}
        supportEmail={supportEmail}
      />
      {placement === "inline" ? <BillingHistoryCard page={page} /> : null}
    </>
  );
}

/**
 * Status banner above the plans (reference `none` and `expired`). The
 * expired wording is used only when the backend actually returned an ended
 * subscription; a `404` reads as "no active subscription".
 */
export function NoActiveSubscription({
  ended,
}: Readonly<{ ended?: GetCurrentSubscriptionQueryResponse | undefined }>) {
  const endedOn = ended
    ? formatBillingDate(
        ended.cancellationEffectiveAtUtc ?? ended.currentPeriodEndUtc,
      )
    : undefined;
  const status = ended ? describeSubscription(ended) : undefined;

  return (
    <Card data-ended-subscription={ended?.lifecycleStatus}>
      <CardContent className="flex items-start gap-4">
        <IconTile size="lg" tone={ended ? "warning" : "brand"}>
          <CreditCardIcon />
        </IconTile>
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 text-fg break-words">
            {ended
              ? `Your ${ended.planName} subscription has ended`
              : "No active subscription"}
          </h2>
          <p className="text-fg-muted mt-1">
            {ended
              ? `${endedOn ? `It ended on ${endedOn}. ` : ""}Choose a plan to restore access.`
              : "Choose a plan below to get started."}
          </p>
        </div>
        {status ? (
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PlanDiscovery({
  ended,
  ownerType,
  page,
}: Readonly<{
  ended?: GetCurrentSubscriptionQueryResponse | undefined;
  ownerType: BillingAccountOwnerType;
  page: number;
}>) {
  const plans = useSubscriptionPlans();
  const history = useHistoryState(ownerType, page);
  const placement = resolveBillingHistoryPlacement({
    history,
    planCount: plans.data?.length,
    view: "discovery",
  });

  return (
    <>
      <NoActiveSubscription ended={ended} />
      {plans.isPending ? (
        <div
          aria-busy="true"
          aria-label="Loading plans"
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          role="status"
        >
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : plans.isError ? (
        <Alert variant="error">
          {describeBillingLoadError(plans.error, "subscription plans")}
        </Alert>
      ) : (
        <SubscriptionPlanGrid
          heading={
            <div>
              <h2 className="text-h2 text-fg">Plans</h2>
              <p className="text-small text-fg-muted mt-0.5">
                Prices, currencies, and billing intervals are set by our billing
                service.
              </p>
            </div>
          }
          plans={plans.data}
        />
      )}
      {placement === "inline" ? <BillingHistoryCard page={page} /> : null}
      {placement === "link" ? (
        <Card className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-small text-fg-muted">
            Looking for past payments and renewal attempts?
          </p>
          <Link className={textLinkClass} href={billingRoutes.history}>
            View billing history
            <ArrowRightIcon size="xs" />
          </Link>
        </Card>
      ) : null}
    </>
  );
}
