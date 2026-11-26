import type { Metadata } from "next";
import {
  Hero,
  MarketingContainer,
  NumberedFeatureList,
} from "@template/public-ui";
import { capabilities } from "@/config/site";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore configurable product capabilities.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <main>
      <Hero
        description="A closer look at what ships with the foundation."
        eyebrow="Features"
        size="page"
        title="Everything between sign-up and revenue"
      />
      <MarketingContainer className="pb-12 md:pb-20">
        <NumberedFeatureList items={capabilities} />
      </MarketingContainer>
    </main>
  );
}
