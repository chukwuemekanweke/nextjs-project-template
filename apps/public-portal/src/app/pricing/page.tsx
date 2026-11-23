import type { Metadata } from "next";
import { connection } from "next/server";
import { Faq } from "@template/public-ui";
import { PageIntro } from "@/components/page-intro";
import { SubscriptionPricing } from "@/components/subscription-pricing";
import { env } from "@/config/env";
import { faqs, planMarketing } from "@/config/site";
import { loadSubscriptionPlans } from "@/lib/subscription-plans";
export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the plan that fits your team.",
  alternates: { canonical: "/pricing" },
};
export default async function PricingPage() {
  // Render per request so builds never depend on the API; the plan response
  // itself is cached (see SUBSCRIPTION_PLANS_REVALIDATE_SECONDS).
  await connection();
  const plans = await loadSubscriptionPlans();
  return (
    <main>
      <PageIntro
        eyebrow="Pricing"
        title="Straightforward plans,"
        highlighted="clear value"
        description="Prices, currencies, and billing intervals come directly from our billing service."
      />
      <SubscriptionPricing
        heading="Choose your path"
        marketing={planMarketing}
        plans={plans}
        userPortalUrl={env.userPortalUrl}
      />
      <Faq heading="Pricing questions" items={faqs} />
    </main>
  );
}
