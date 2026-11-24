import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import Link from "next/link";
import { billingRoutes } from "@/config/billing";
import { firstSearchParameter, parseBillingPage } from "@/lib/billing-display";
import { portalName } from "@/lib/portal";
import { BillingHistoryCard } from "../billing-history-card";
import { textLinkClass } from "../billing-ui";

export const metadata: Metadata = { title: "Billing history" };

/**
 * Full billing history. `/billing` links here when the expanded pricing grid
 * replaces the inline table, so past payments stay reachable without an
 * active subscription. Uses the same owner-scoped query as `/billing`.
 */
export default async function BillingHistoryPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ page?: string | string[] }> }>) {
  const page = parseBillingPage(
    firstSearchParameter((await searchParams).page),
  );

  return (
    <section className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <DashboardHeader
        actions={
          <Link
            className={`${textLinkClass} text-sm`}
            href={billingRoutes.overview}
          >
            Back to billing
          </Link>
        }
        description="Initial purchases and renewal attempts for your account."
        eyebrow={portalName}
        title="Billing history"
      />
      <BillingHistoryCard
        basePath={billingRoutes.history}
        heading={false}
        page={page}
      />
    </section>
  );
}
