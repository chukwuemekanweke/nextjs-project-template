"use client";

import {
  defaultSubscriptionPlanPrice,
  type SubscriptionPlanPriceResponse,
  type SubscriptionPlanResponse,
} from "@template/api-client/subscriptions";
import { Card, formatMinorUnits } from "@template/ui-core";
import Link from "next/link";
import { useState } from "react";
import {
  billingRoutes,
  placeholderPlanPresentation,
  planPresentation as configuredPlanPresentation,
  type PlanPresentation,
} from "@/config/billing";
import { billingCadence, billingIntervalLabel } from "@/lib/billing-display";
import {
  offeredBillingIntervals,
  resolvePlanLayout,
  resolvePlanPresentation,
  type ResolvedPlanPresentation,
} from "@/lib/billing-view";
import { BillingIntervalToggle } from "./billing-interval-toggle";
import {
  BoltIcon,
  BuildingIcon,
  LayersIcon,
  SmallCheckIcon,
} from "./checkout/checkout-icons";

const choosePlanClass =
  "bg-brand-500 hover:bg-brand-600 focus-visible:ring-brand-500/40 shadow-theme-xs inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 text-base font-semibold text-white transition focus-visible:ring-3 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-gray-900";

const gridClasses = {
  single: "mx-auto grid max-w-md grid-cols-1",
  pair: "grid grid-cols-1 gap-6 md:grid-cols-2",
  grid: "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3",
} as const;

/** Decorative only, cycled by position; never implies tier or recommendation. */
const PLAN_ICONS = [BoltIcon, LayersIcon, BuildingIcon] as const;

/**
 * Backend-authoritative plans. The count selects a balanced single card, a
 * pair, or the multi-row grid; every layout uses the same pricing card, and
 * plans are never filtered or reordered. When plans offer several billing
 * intervals, a toggle chooses which price each card shows.
 */
export function SubscriptionPlanGrid({
  placeholder = placeholderPlanPresentation,
  plans,
  presentation = configuredPlanPresentation,
}: Readonly<{
  /** Fallback copy until the API supplies plan presentation fields. */
  placeholder?: PlanPresentation | undefined;
  plans: ReadonlyArray<SubscriptionPlanResponse>;
  presentation?: Readonly<Record<string, PlanPresentation>>;
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
      <Card className="p-8 text-center" role="status">
        <p className="text-base font-medium text-gray-800 dark:text-white/90">
          No subscription plans are available right now.
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please check back soon.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {intervals.length > 1 && selectedInterval ? (
        <div className="flex justify-center">
          <BillingIntervalToggle
            intervals={intervals}
            name="plan-billing-interval"
            onChange={setChosenInterval}
            value={selectedInterval}
          />
        </div>
      ) : null}
      <ul
        aria-label="Subscription plans"
        className={gridClasses[layout]}
        data-plan-layout={layout}
      >
        {plans.map((plan, index) => {
          const price = defaultSubscriptionPlanPrice(plan, selectedInterval);
          if (!price) return null;
          return (
            <li className="flex min-w-0" key={plan.id}>
              <SubscriptionPlanCard
                iconIndex={index}
                plan={plan}
                presentation={resolvePlanPresentation(
                  plan,
                  presentation[plan.code],
                  placeholder,
                )}
                price={price}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SubscriptionPlanCard({
  iconIndex = 0,
  plan,
  presentation,
  price,
}: Readonly<{
  iconIndex?: number;
  plan: SubscriptionPlanResponse;
  presentation: ResolvedPlanPresentation;
  /** One of the plan's offered intervals. */
  price: SubscriptionPlanPriceResponse;
}>) {
  const headingId = `plan-${plan.id}-name`;
  const Icon = PLAN_ICONS[iconIndex % PLAN_ICONS.length] ?? BoltIcon;
  const { badge, description, features, recommended } = presentation;

  return (
    <article
      aria-labelledby={headingId}
      className={[
        "shadow-theme-sm flex w-full flex-col rounded-2xl border bg-white p-6 sm:p-7 dark:bg-white/[0.03]",
        recommended
          ? "border-brand-200 bg-brand-25 dark:border-brand-800 dark:bg-brand-500/5"
          : "border-gray-200 dark:border-gray-800",
      ].join(" ")}
      data-plan-code={plan.code}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-6 w-6" />
        </span>
        {recommended ? (
          <span className="bg-brand-500 rounded-full px-3 py-1 text-xs font-semibold text-white">
            Most popular
          </span>
        ) : badge ? (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/5 dark:text-gray-300">
            {badge}
          </span>
        ) : null}
      </div>

      <h2
        className={`mt-5 text-2xl font-semibold break-words text-gray-900 dark:text-white`}
        id={headingId}
      >
        {plan.name}
      </h2>
      {description ? (
        <p className="mt-2 text-base leading-6 text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}

      <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          {formatMinorUnits(price.price, plan.currencyCode)}
        </span>
        <span className="text-lg text-gray-500 dark:text-gray-400">
          / {billingCadence(price.billingInterval)}
        </span>
      </p>
      <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
        {billingIntervalLabel(price.billingInterval)}
      </p>
      <hr className="mt-6 border-gray-200 dark:border-gray-800" />

      {features.length > 0 ? (
        <ul className="mt-6 space-y-3 text-base text-gray-700 dark:text-gray-300">
          {features.map((feature) => (
            <li className="flex gap-3" key={feature}>
              <SmallCheckIcon className="text-brand-500 mt-0.5 h-4 w-4 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto pt-7">
        <Link
          aria-label={`Choose ${plan.name}`}
          className={choosePlanClass}
          href={billingRoutes.checkoutForPlan(plan.id, price.billingInterval)}
        >
          Choose plan
        </Link>
      </div>
    </article>
  );
}
