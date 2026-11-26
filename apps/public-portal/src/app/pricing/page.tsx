import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  FaqGrid,
  Hero,
  MarketingContainer,
  MarketingSection,
  PlanGridSkeleton,
  SectionHeading,
} from "@template/public-ui";
import { SubscriptionPricing } from "@/components/subscription-pricing";
import { env } from "@/config/env";
import { faqs, planMarketing } from "@/config/site";
import { loadSubscriptionPlans } from "@/lib/subscription-plans";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the plan that fits your team.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <main>
      <Hero
        description="Prices, currencies, and billing intervals come directly from our billing service."
        eyebrow="Pricing"
        size="page"
        title="Simple plans that grow with you"
      />
      <MarketingContainer className="pb-12 md:pb-16">
        <Suspense fallback={<PlanGridSkeleton />}>
          <Plans />
        </Suspense>
      </MarketingContainer>
      <MarketingSection aria-labelledby="pricing-questions" tone="alt">
        <SectionHeading id="pricing-questions" title="Questions" />
        <FaqGrid items={faqs} />
      </MarketingSection>
    </main>
  );
}

async function Plans() {
  // Render per request so builds never depend on the API; the plan response
  // itself is cached (see SUBSCRIPTION_PLANS_REVALIDATE_SECONDS).
  await connection();
  const plans = await loadSubscriptionPlans();
  return (
    <SubscriptionPricing
      heading="Plans"
      marketing={planMarketing}
      plans={plans}
      userPortalUrl={env.userPortalUrl}
    />
  );
}
