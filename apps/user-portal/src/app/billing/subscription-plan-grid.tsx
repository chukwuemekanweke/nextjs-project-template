"use client";

import {
  defaultSubscriptionPlanPrice,
  type SubscriptionPlanPriceResponse,
  type SubscriptionPlanResponse,
} from "@template/api-client/subscriptions";
import {
  Card,
  CheckIcon,
  EmptyState,
  InboxIcon,
  buttonVariants,
  formatMinorUnits,
} from "@template/ui-core";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { billingRoutes } from "@/config/billing";
import { billingCadence, billingIntervalLabel } from "@/lib/billing-display";
import {
  offeredBillingIntervals,
  resolvePlanLayout,
  planCardContent,
} from "@/lib/billing-view";
import { BillingIntervalToggle } from "./billing-interval-toggle";

const gridClasses = {
  single: "mx-auto grid max-w-md grid-cols-1",
  pair: "grid grid-cols-1 gap-6 md:grid-cols-2",
  grid: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3",
} as const;

/**
 * Backend-authoritative plans (reference `.card.plan` grid). The count
 * selects a balanced single card, a pair, or the multi-row grid; every layout
 * uses the same pricing card, and plans are never filtered or reordered. When
 * plans offer several billing intervals, a toggle chooses which price each
 * card shows. All card content comes from the plan response; "Most popular"
 * and savings labels from the reference are not computed.
 */
export function SubscriptionPlanGrid({
  heading,
  plans,
}: Readonly<{
  /** Optional section heading shown beside the interval toggle. */
  heading?: ReactNode;
  plans: ReadonlyArray<SubscriptionPlanResponse>;
}>) {
  const intervals = offeredBillingIntervals(plans);
  const [chosenInterval, setChosenInterval] = useState<string>();
  const selectedInterval =
    chosenInterval && intervals.includes(chosenInterval)
      ? chosenInterval
      : intervals.includes("Monthly")
        ? "Monthly"
        : intervals[0];
  const layout = resolvePlanLayout(plans.length);
  if (layout === "empty") {
    return (
      <Card role="status">
        <EmptyState
          className="m-4 md:m-6"
          description="Please check back soon."
          icon={<InboxIcon />}
          title="No subscription plans are available right now."
        />
      </Card>
    );
  }
  const showToggle = intervals.length > 1 && selectedInterval !== undefined;

  return (
    <div className="space-y-5">
      {heading || showToggle ? (
        <div
          className={`flex flex-col gap-4 sm:flex-row sm:items-end ${heading ? "sm:justify-between" : "sm:justify-center"}`}
        >
          {heading}
          {showToggle ? (
            <BillingIntervalToggle
              intervals={intervals}
              name="plan-billing-interval"
              onChange={setChosenInterval}
              value={selectedInterval}
            />
          ) : null}
        </div>
      ) : null}
      <ul
        aria-label="Subscription plans"
        className={gridClasses[layout]}
        data-plan-layout={layout}
      >
        {plans.map((plan) => {
          const price = defaultSubscriptionPlanPrice(plan, selectedInterval);
          if (!price) return null;
          return (
            <li className="flex min-w-0" key={plan.id}>
              <SubscriptionPlanCard plan={plan} price={price} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SubscriptionPlanCard({
  plan,
  price,
}: Readonly<{
  plan: SubscriptionPlanResponse;
  /** One of the plan's offered intervals. */
  price: SubscriptionPlanPriceResponse;
}>) {
  const headingId = `plan-${plan.id}-name`;
  const { description, features } = planCardContent(plan);

  return (
    <article
      aria-labelledby={headingId}
      className="border-border bg-surface flex w-full flex-col gap-4 rounded-xl border p-5 shadow-xs md:p-6"
      data-plan-code={plan.code}
    >
      <div>
        <h3 className="text-h3 text-fg break-words" id={headingId}>
          {plan.name}
        </h3>
        {description ? (
          <p className="text-fg-muted mt-1" data-plan-description="">
            {description}
          </p>
        ) : null}
      </div>

      <div>
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-stat text-fg">
            {formatMinorUnits(price.price, plan.currencyCode)}
          </span>
          <span className="text-fg-muted">
            / {billingCadence(price.billingInterval)}
          </span>
        </p>
        <p className="text-small text-fg-subtle mt-1">
          {billingIntervalLabel(price.billingInterval)}
        </p>
      </div>

      <Link
        aria-label={`Choose ${plan.name}`}
        className={buttonVariants({ fullWidth: true, variant: "primary" })}
        href={billingRoutes.checkoutForPlan(plan.id, price.billingInterval)}
      >
        Choose plan
      </Link>

      {features.length > 0 ? (
        <ul className="text-fg-muted space-y-2.5">
          {features.map((feature) => (
            <li className="flex gap-2.5" data-plan-feature="" key={feature}>
              <CheckIcon className="text-success mt-0.5 shrink-0" size="sm" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
