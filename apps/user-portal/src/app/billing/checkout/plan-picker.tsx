"use client";

import { useSubscriptionPlans } from "@template/api-react/subscriptions";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Skeleton,
} from "@template/ui-core";
import { describeBillingLoadError } from "@/lib/billing-display";
import { SubscriptionPlanGrid } from "../subscription-plan-grid";

/** Backend-authoritative plans, shared with the Billing page; each links into checkout. */
export function PlanPicker({
  notice,
}: Readonly<{ notice?: string | undefined }>) {
  const plans = useSubscriptionPlans();

  return (
    <Card>
      <CardContent>
        <CardTitle>Choose a plan</CardTitle>
        <CardDescription>
          Prices, currencies, and billing intervals are set by our billing
          service.
        </CardDescription>
        <div className="mt-6 space-y-4">
          {notice ? <Alert variant="warning">{notice}</Alert> : null}
          {plans.isPending ? (
            <div
              aria-busy="true"
              aria-label="Loading plans"
              className="space-y-3"
              role="status"
            >
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : plans.isError ? (
            <Alert variant="error">
              {describeBillingLoadError(plans.error, "subscription plans")}
            </Alert>
          ) : (
            <SubscriptionPlanGrid plans={plans.data} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
