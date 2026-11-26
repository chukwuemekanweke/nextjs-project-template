import type { Metadata } from "next";
import {
  CtaBanner,
  FeatureGrid,
  Hero,
  MarketingContainer,
  MarketingSection,
  ProductShot,
  SectionHeading,
} from "@template/public-ui";
import { features, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Modern product experiences",
  description: site.description,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main>
      <Hero
        actions={[
          site.register,
          { label: "See pricing", href: "/pricing", variant: "secondary" },
        ]}
        description={site.description}
        title="Launch your product with accounts, billing and admin already done."
      />
      <MarketingContainer className="flex justify-center pb-12 md:pb-20">
        <ProductShot />
      </MarketingContainer>
      <MarketingSection aria-labelledby="features-title" tone="alt">
        <SectionHeading
          description="Built once, properly, so you can focus on what makes your product different."
          eyebrow="Everything included"
          id="features-title"
          title="The parts every product needs"
        />
        <FeatureGrid items={features} />
      </MarketingSection>
      <MarketingSection>
        <CtaBanner
          action={{ label: "Create your account", href: site.register.href }}
          description="Start with a strong foundation and shape it around your product."
          title="Ready when you are"
        />
      </MarketingSection>
    </main>
  );
}
