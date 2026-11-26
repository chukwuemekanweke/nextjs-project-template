import { PricingIntervals } from "@template/public-ui";
import { EmptyState, ErrorState } from "@template/ui-core";
import {
  toPricingIntervals,
  type PlanMarketingContent,
} from "@/lib/subscription-pricing";
import type { SubscriptionPlansResult } from "@/lib/subscription-plans";

/**
 * Backend-authoritative plan pricing rendered with the shared plan cards.
 * When plans offer several billing intervals, a switch shows each
 * interval's prices; the cards for every interval are prepared here, on the
 * server.
 */
export function SubscriptionPricing({
  heading,
  marketing,
  plans,
  userPortalUrl,
}: Readonly<{
  /** Section heading for assistive technology (the page hero is visual). */
  heading: string;
  marketing?: PlanMarketingContent;
  plans: SubscriptionPlansResult;
  userPortalUrl: string;
}>) {
  const intervals =
    plans.status === "loaded"
      ? toPricingIntervals(plans.plans, { marketing, userPortalUrl })
      : [];

  return (
    <section aria-label={heading}>
      {plans.status === "unavailable" ? (
        <ErrorState
          className="border-border bg-surface rounded-xl border"
          description="Refresh the page to try again."
          title="Plans could not be loaded right now."
        />
      ) : intervals.length === 0 ? (
        <div role="status">
          <EmptyState
            description="Please check back soon."
            title="No subscription plans are available right now."
          />
        </div>
      ) : (
        <PricingIntervals intervals={intervals} />
      )}
    </section>
  );
}
