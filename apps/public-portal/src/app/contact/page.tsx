import type { Metadata } from "next";
import { ContactSection } from "@template/public-ui";
import { PageIntro } from "@/components/page-intro";
import { site } from "@/config/site";
export const metadata: Metadata = {
  title: "Contact",
  description: `Contact the ${site.name} team.`,
  alternates: { canonical: "/contact" },
};
export default function ContactPage() {
  return (
    <main>
      <PageIntro
        eyebrow="Contact"
        title="Let’s talk about your"
        highlighted="goals"
        description="Tell us what you are building and our team will help you find the right next step."
      />
      <ContactSection
        heading="Send a message"
        description="We would love to hear from you."
        email={site.email}
        address={site.address}
      />
    </main>
  );
}
