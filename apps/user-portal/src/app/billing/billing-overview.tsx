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
import { Alert, Card, CardContent, Skeleton } from "@template/ui-core";
import Link from "next/link";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import { describeBillingLoadError } from "@/lib/billing-display";
import {
  resolveBillingHistoryPlacement,
  resolveBillingView,
  type BillingHistoryState,
  type BillingView,
} from "@/lib/billing-view";
import { useRememberedCheckoutAttempt } from "@/lib/use-checkout-attempt";
import { BillingHistoryCard } from "./billing-history-card";
import { secondaryButtonClass, textLinkClass } from "./billing-ui";
import { ArrowRightIcon } from "./checkout/checkout-icons";
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
 * Unified Billing entry point. The backend current subscription selects the
 * view; plan count and history totals then select the layout through
 * `lib/billing-view.ts`. Checkout, payment, and polling stay in `/checkout`.
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
      className={`mx-auto space-y-6 sm:space-y-8 ${view.kind === "discovery" ? "max-w-6xl" : "max-w-5xl"}`}
      data-billing-view={view.kind}
    >
      <DashboardHeader
        description={descriptions[view.kind]}
        eyebrow={eyebrow}
        title="Billing"
      />
      {view.kind === "loading" ? (
        <LoadingSubscription />
      ) : view.kind === "error" ? (
        <Card>
          <CardContent className="space-y-4">
            <Alert variant="error">
              {describeBillingLoadError(view.error, "your subscription")}
            </Alert>
            <button
              className={secondaryButtonClass}
              disabled={current.isFetching}
              onClick={() => void current.refetch()}
              type="button"
            >
              Try again
            </button>
          </CardContent>
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
        <PlanDiscovery ownerType={ownerType} page={page} />
      )}
    </section>
  );
}

function LoadingSubscription() {
  return (
    <Card aria-busy="true" aria-label="Loading subscription" role="status">
      <CardContent className="space-y-4 sm:p-8">
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

function PlanDiscovery({
  ownerType,
  page,
}: Readonly<{ ownerType: BillingAccountOwnerType; page: number }>) {
  const plans = useSubscriptionPlans();
  const history = useHistoryState(ownerType, page);
  const placement = resolveBillingHistoryPlacement({
    history,
    planCount: plans.data?.length,
    view: "discovery",
  });

  return (
    <>
      {plans.isPending ? (
        <div
          aria-busy="true"
          aria-label="Loading plans"
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          role="status"
        >
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : plans.isError ? (
        <Alert variant="error">
          {describeBillingLoadError(plans.error, "subscription plans")}
        </Alert>
      ) : (
        <SubscriptionPlanGrid plans={plans.data} />
      )}
      {placement === "inline" ? <BillingHistoryCard page={page} /> : null}
      {placement === "link" ? (
        <Card className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Looking for past payments and renewal attempts?
          </p>
          <Link
            className={`${textLinkClass} inline-flex items-center gap-1.5 text-sm`}
            href={billingRoutes.history}
          >
            View billing history
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Card>
      ) : null}
    </>
  );
}
