import type { Metadata } from "next";
import { Cta, Features } from "@template/public-ui";
import { PageIntro } from "@/components/page-intro";
import { features, site } from "@/config/site";
export const metadata: Metadata = {
  title: "Features",
  description: "Explore configurable product capabilities.",
  alternates: { canonical: "/features" },
};
export default function FeaturesPage() {
  return (
    <main>
      <PageIntro
        eyebrow="Features"
        title="Built for teams that"
        highlighted="ship"
        description="A reusable, configurable foundation designed for real product delivery."
      />
      <Features heading="Capabilities that grow with you" items={features} />
      <Cta
        title="Put these capabilities to work"
        description="Create your account and begin shaping the experience around your product."
        action={site.register}
      />
    </main>
  );
}
