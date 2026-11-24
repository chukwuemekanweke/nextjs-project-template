import { Pricing } from "@template/public-ui";
import type { ReactNode } from "react";
import {
  toPricePlan,
  type PlanMarketingContent,
} from "@/lib/subscription-pricing";
import type { SubscriptionPlansResult } from "@/lib/subscription-plans";

/** Backend-authoritative plan pricing rendered with the shared pricing UI. */
export function SubscriptionPricing({
  heading,
  marketing,
  plans,
  userPortalUrl,
}: Readonly<{
  heading: string;
  marketing?: PlanMarketingContent;
  plans: SubscriptionPlansResult;
  userPortalUrl: string;
}>) {
  const pricePlans =
    plans.status === "loaded"
      ? plans.plans.flatMap(
          (plan) => toPricePlan(plan, { marketing, userPortalUrl }) ?? [],
        )
      : [];

  return (
    <Pricing
      heading={heading}
      placeholder={
        plans.status === "unavailable" ? (
          <PlanMessage role="alert">
            Plans could not be loaded right now. Refresh the page to try again.
          </PlanMessage>
        ) : (
          <PlanMessage>
            No subscription plans are available right now. Please check back
            soon.
          </PlanMessage>
        )
      }
      plans={pricePlans}
    />
  );
}

function PlanMessage({
  children,
  role = "status",
}: Readonly<{ children: ReactNode; role?: "alert" | "status" }>) {
  return (
    <div
      className="border-stroke dark:border-strokedark rounded-lg border p-10 text-center"
      role={role}
    >
      {children}
    </div>
  );
}
