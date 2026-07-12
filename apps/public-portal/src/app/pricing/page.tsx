import type { Metadata } from "next";
import { Faq, Pricing } from "@template/public-ui";
import { PageIntro } from "@/components/page-intro";
import { faqs, plans } from "@/config/site";
export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the plan that fits your team.",
  alternates: { canonical: "/pricing" },
};
export default function PricingPage() {
  return (
    <main>
      <PageIntro
        eyebrow="Pricing"
        title="Straightforward plans,"
        highlighted="clear value"
        description="Configurable placeholder pricing ready to be replaced by your commercial model."
      />
      <Pricing heading="Choose your path" plans={plans} />
      <Faq heading="Pricing questions" items={faqs} />
    </main>
  );
}
