import type { SubscriptionPlanResponse } from "@template/api-client/subscriptions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InfoIcon,
  RefreshIcon,
} from "@template/ui-core";
import Link from "next/link";
import type { ReactNode } from "react";
import { billingCadence, billingIntervalLabel } from "@/lib/billing-display";

/**
 * Order summary (reference `UserCheckout` right column). The backend plan
 * price is the amount due today: the contract has no taxes, discounts, fees
 * or next-charge date, so none are shown (DR-056). `children` holds the pay
 * action while checkout is open.
 */
export function SubscriptionOrderSummary({
  autoRenew,
  billingInterval,
  changeHref,
  children,
  className = "",
  intervalControl,
  plan,
  price,
}: Readonly<{
  autoRenew: boolean;
  /** The selected, backend-offered interval. */
  billingInterval: string;
  /** Where "Change" leads to pick another plan; omitted once submitted. */
  changeHref?: string;
  children?: ReactNode;
  className?: string;
  /** Interval selector, when the plan offers several intervals. */
  intervalControl?: ReactNode;
  plan: SubscriptionPlanResponse;
  price: string;
}>) {
  const cadence = billingCadence(billingInterval);
  return (
    <Card
      aria-labelledby="order-summary-heading"
      className={`lg:sticky lg:top-6 ${className}`}
      role="region"
    >
      <CardHeader>
        <CardTitle id="order-summary-heading">Order summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-h3 text-fg break-words">{plan.name}</h3>
            <p className="text-small text-fg-muted">
              {billingIntervalLabel(billingInterval)}
            </p>
          </div>
          {changeHref ? (
            <Link
              aria-label={`Change plan (${plan.name})`}
              className="text-small text-brand-ink shrink-0 font-medium hover:underline"
              href={changeHref}
            >
              Change
            </Link>
          ) : null}
        </div>
        {intervalControl}
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-stat text-fg">{price}</span>
          <span className="text-fg-muted">/ {cadence}</span>
        </p>

        <dl className="text-label border-border space-y-2 border-t pt-4 font-normal">
          <SummaryRow label="Subtotal" value={price} />
          <SummaryRow label="Billing frequency" value={billingInterval} />
          <div className="border-border text-fg flex items-center justify-between gap-4 border-t pt-3 font-semibold">
            <dt>Due today</dt>
            <dd className="text-h3 text-right">{price}</dd>
          </div>
        </dl>

        {children}

        <p className="text-small text-fg-muted flex gap-2.5">
          <InfoIcon className="mt-0.5 shrink-0" size="xs" />
          <span>
            {billingIntervalLabel(billingInterval)} in {plan.currencyCode}. The
            amount and currency are determined by our billing service.
          </span>
        </p>

        <div className="border-border flex gap-2.5 border-t pt-4">
          <RefreshIcon className="text-fg-subtle mt-0.5 shrink-0" size="xs" />
          <div>
            <h4 className="text-label text-fg">
              {billingInterval} subscription
            </h4>
            <p className="text-small text-fg-muted mt-0.5">
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
    <div className="flex items-center justify-between gap-4">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-fg text-right break-words">{value}</dd>
    </div>
  );
}
