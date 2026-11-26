import type { Metadata } from "next";
import { FeatureGrid, Hero, MarketingContainer } from "@template/public-ui";
import { about, site } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `Learn what drives ${site.name}.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <Hero
        description="We help teams move from an ambitious idea to a polished, dependable product experience."
        eyebrow="About"
        size="page"
        title="A foundation for progress"
      />
      <MarketingContainer className="pb-12 md:pb-20">
        <FeatureGrid items={about} />
      </MarketingContainer>
    </main>
  );
}
