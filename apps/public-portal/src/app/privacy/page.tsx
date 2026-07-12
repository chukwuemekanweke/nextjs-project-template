import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we handle personal information.",
  alternates: { canonical: "/privacy" },
};
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <h2>Information we collect</h2>
      <p>
        This configurable placeholder describes information submitted through
        your account and contact forms. Replace it with a policy reviewed for
        your product, jurisdiction, and data practices.
      </p>
      <h2>How information is used</h2>
      <p>
        Information may be used to provide the service, respond to requests,
        protect the platform, and meet legal obligations.
      </p>
      <h2>Your choices</h2>
      <p>
        You may request access, correction, or deletion using the contact
        details published on this site.
      </p>
    </LegalPage>
  );
}
