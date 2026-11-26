import type { Metadata } from "next";
import { ContactLayout, Hero } from "@template/public-ui";
import { MailIcon, MapPinIcon } from "@template/ui-core";
import { ContactForm } from "@/components/contact-form";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact the ${site.name} team.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main>
      <Hero
        description="Tell us what you are building and we will help you find the right next step."
        eyebrow="Contact"
        size="page"
        title="Talk to us"
      />
      <ContactLayout
        details={[
          {
            href: `mailto:${site.email}`,
            icon: <MailIcon />,
            label: "Email",
            value: site.email,
          },
          { icon: <MapPinIcon />, label: "Office", value: site.address },
        ]}
      >
        <ContactForm to={site.email} />
      </ContactLayout>
    </main>
  );
}
