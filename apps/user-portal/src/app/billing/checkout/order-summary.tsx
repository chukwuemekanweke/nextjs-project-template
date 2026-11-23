import type { SubscriptionPlanResponse } from "@template/api-client/subscriptions";
import { Card, CardContent } from "@template/ui-core";
import { billingCadence, billingIntervalLabel } from "@/lib/billing-display";
import { InfoIcon, RenewIcon } from "./checkout-icons";

/**
 * Presentation of the backend-authoritative plan price. No taxes, discounts,
 * or fees exist in the contract, so the plan price is the amount due today.
 */
export function SubscriptionOrderSummary({
  autoRenew,
  className = "",
  plan,
  price,
}: Readonly<{
  autoRenew: boolean;
  className?: string;
  plan: SubscriptionPlanResponse;
  price: string;
}>) {
  const cadence = billingCadence(plan.billingInterval);
  return (
    <Card
      aria-labelledby="order-summary-heading"
      className={`shadow-theme-sm ${className}`}
      role="region"
    >
      <CardContent className="sm:p-8">
        <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Order summary
        </p>
        <h2
          className="mt-3 text-xl font-semibold break-words text-gray-900 dark:text-white"
          id="order-summary-heading"
        >
          {plan.name}
        </h2>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5 border-b border-gray-200 pb-6 dark:border-gray-800">
          <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {price}
          </span>
          <span className="text-base text-gray-500 dark:text-gray-400">
            / {cadence}
          </span>
        </p>

        <dl className="pt-4 text-sm sm:text-base">
          <SummaryRow label="Subtotal" value={price} />
          <SummaryRow label="Billing frequency" value={plan.billingInterval} />
          <div className="bg-brand-50 dark:bg-brand-500/10 mt-2 flex items-center justify-between gap-4 rounded-lg px-3 py-3 font-semibold text-gray-900 dark:text-white">
            <dt>Due today</dt>
            <dd className="text-right">{price}</dd>
          </div>
        </dl>

        <p className="mt-6 flex gap-3 border-b border-gray-200 pb-6 text-sm leading-6 text-gray-600 dark:border-gray-800 dark:text-gray-400">
          <InfoIcon className="mt-1 h-5 w-5 shrink-0 text-gray-500" />
          <span>
            {billingIntervalLabel(plan.billingInterval)} in {plan.currencyCode}.
            The amount and currency are determined by our billing service.
          </span>
        </p>

        <div className="mt-6 flex gap-3">
          <RenewIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {plan.billingInterval} subscription
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
              {autoRenew
                ? `Renews automatically each ${cadence}. Cancel anytime from Billing; access continues until the end of the current billing period.`
                : `Does not renew automatically. Access ends at the end of the paid ${cadence} unless you renew.`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 px-0.5 py-2">
      <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
      <dd className="text-right break-words text-gray-700 dark:text-gray-300">
        {value}
      </dd>
    </div>
  );
}
