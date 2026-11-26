import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we handle personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      href="/privacy"
      sections={[
        {
          id: "information-we-collect",
          title: "Information we collect",
          content: (
            <p>
              This configurable placeholder describes information submitted
              through your account and contact forms. Replace it with a policy
              reviewed for your product, jurisdiction, and data practices.
            </p>
          ),
        },
        {
          id: "how-information-is-used",
          title: "How information is used",
          content: (
            <p>
              Information may be used to provide the service, respond to
              requests, protect the platform, and meet legal obligations.
            </p>
          ),
        },
        {
          id: "your-choices",
          title: "Your choices",
          content: (
            <p>
              You may request access, correction, or deletion using the contact
              details published on this site.
            </p>
          ),
        },
      ]}
      title="Privacy policy"
      updated="July 2026"
    />
  );
}
