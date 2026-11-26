import {
  Card,
  CheckIcon,
  cn,
  LoadingStatus,
  Skeleton,
} from "@template/ui-core";
import type { PricePlan } from "../types";
import { ActionLink } from "./action-link";

/**
 * Subscription plan card (reference `.card.plan`): name, description, the
 * formatted price and cadence, the plan action and optional feature ticks.
 * It renders the values it is given; prices are never computed here.
 */
export function PlanCard({ plan }: Readonly<{ plan: PricePlan }>) {
  return (
    <Card className="flex h-full flex-col gap-5 p-5 md:p-7">
      <h3 className="text-h2 text-fg">{plan.name}</h3>
      <p className="text-fg-muted">{plan.description}</p>
      <p>
        <span className="text-price text-fg">{plan.price}</span>
        {plan.cadence ? (
          <span className="text-fg-muted"> / {plan.cadence}</span>
        ) : null}
      </p>
      <ActionLink
        action={plan.action}
        ariaLabel={`${plan.action.label}: ${plan.name}`}
        fullWidth
      />
      {plan.features && plan.features.length > 0 ? (
        <ul className="text-fg-muted flex flex-col gap-3">
          {plan.features.map((feature) => (
            <li className="flex items-start gap-2.5" key={feature}>
              <CheckIcon className="text-brand-ink mt-0.5" size="sm" />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

const gridClassName = "grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3";

/** Plan cards: one column on phones and tablets, three from `lg`. */
export function PlanGrid({
  className,
  plans,
}: Readonly<{ className?: string; plans: readonly PricePlan[] }>) {
  return (
    <ul className={cn(gridClassName, className)}>
      {plans.map((plan) => (
        <li key={plan.id ?? plan.name}>
          <PlanCard plan={plan} />
        </li>
      ))}
    </ul>
  );
}

/** Loading placeholder for `PlanGrid`, announced politely. */
export function PlanGridSkeleton({
  count = 3,
  label = "Loading plans",
}: Readonly<{ count?: number; label?: string }>) {
  return (
    <div className={gridClassName}>
      <LoadingStatus label={label} />
      {Array.from({ length: count }, (_, index) => (
        <Card className="flex flex-col gap-5 p-5 md:p-7" key={index}>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-control w-full" />
        </Card>
      ))}
    </div>
  );
}
