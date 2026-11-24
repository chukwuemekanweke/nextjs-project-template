import type { Metadata } from "next";
import { branding } from "@/config/env";
import { firstSearchParameter, parseBillingPage } from "@/lib/billing-display";
import { portalName } from "@/lib/portal";
import { BillingOverview } from "./billing-overview";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ page?: string | string[] }> }>) {
  const page = parseBillingPage(
    firstSearchParameter((await searchParams).page),
  );

  return (
    <BillingOverview
      eyebrow={portalName}
      page={page}
      supportEmail={branding.supportEmail}
    />
  );
}
