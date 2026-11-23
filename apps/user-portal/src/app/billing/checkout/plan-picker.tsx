"use client";

import { useSubscriptionPlans } from "@template/api-react/subscriptions";
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
import { billingRoutes } from "@/config/billing";
import {
  billingCadence,
  billingIntervalLabel,
  describeBillingLoadError,
} from "@/lib/billing-display";
import { primaryButtonClass } from "../billing-ui";

/** Lists backend-authoritative plans; each links into checkout. */
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
        <div className="mt-5 space-y-3">
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
          ) : plans.data.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No subscription plans are available right now.
            </p>
          ) : (
            <ul className="space-y-3">
              {plans.data.map((plan) => (
                <li
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
                  key={plan.id}
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {plan.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatMinorUnits(plan.price, plan.currencyCode)} /{" "}
                      {billingCadence(plan.billingInterval)} ·{" "}
                      {billingIntervalLabel(plan.billingInterval)}
                    </p>
                  </div>
                  <Link
                    aria-label={`Choose ${plan.name}`}
                    className={primaryButtonClass}
                    href={billingRoutes.checkoutForPlan(plan.id)}
                  >
                    Choose plan
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
