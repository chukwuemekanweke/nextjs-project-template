import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the product.",
  alternates: { canonical: "/terms" },
};
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 2026">
      <h2>Using the service</h2>
      <p>
        These configurable placeholder terms must be replaced with terms
        approved for your product and organization before launch.
      </p>
      <h2>Accounts</h2>
      <p>
        Users are responsible for account credentials and activity. Access
        remains subject to the authoritative backend policies.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Users may not interfere with the service, violate applicable law, or
        misuse another person’s information.
      </p>
    </LegalPage>
  );
}
