import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the product.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      href="/terms"
      sections={[
        {
          id: "using-the-service",
          title: "Using the service",
          content: (
            <p>
              These configurable placeholder terms must be replaced with terms
              approved for your product and organization before launch.
            </p>
          ),
        },
        {
          id: "accounts",
          title: "Accounts",
          content: (
            <p>
              Users are responsible for account credentials and activity. Access
              remains subject to the authoritative backend policies.
            </p>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          content: (
            <p>
              Users may not interfere with the service, violate applicable law,
              or misuse another person’s information.
            </p>
          ),
        },
      ]}
      title="Terms of service"
      updated="July 2026"
    />
  );
}
