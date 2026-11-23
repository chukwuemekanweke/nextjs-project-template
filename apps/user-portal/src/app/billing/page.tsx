import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { firstSearchParameter } from "@/lib/billing-display";
import { portalName } from "@/lib/portal";
import { BillingHistoryCard } from "./billing-history-card";
import { CurrentSubscriptionCard } from "./current-subscription-card";

export const metadata: Metadata = { title: "Billing" };

function pageNumber(value: string | undefined): number {
  if (!value || !/^\d{1,6}$/.test(value)) return 1;
  return Math.max(1, Number(value));
}

export default async function BillingPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ page?: string | string[] }> }>) {
  const page = pageNumber(firstSearchParameter((await searchParams).page));

  return (
    <section className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <DashboardHeader
        description="Review your subscription, renewal, and payment history."
        eyebrow={portalName}
        title="Billing"
      />
      <CurrentSubscriptionCard />
      <BillingHistoryCard page={page} />
    </section>
  );
}
