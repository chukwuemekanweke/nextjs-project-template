import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Card,
  CardContent,
  EmptyState,
  UserIcon,
  buttonVariants,
} from "@template/ui-core";
import { billingRoutes } from "@/config/billing";
import {
  hasProfileIdentity,
  profileName,
  toProfileDisplay,
} from "@/lib/profile-display";
import { createAppServerApiClient } from "@/lib/server-api";
import {
  DashboardMetrics,
  RecentBillingActivityCard,
  SecurityChecklistCard,
} from "./dashboard-live";
import { greetingName } from "./dashboard-overview";
import { ProfileSummaryCard } from "./dashboard-sections";

export const metadata: Metadata = { title: "Dashboard" };

const PAGE_DESCRIPTION = "Here is the state of your account today.";

/**
 * Overview dashboard (USR-DASHBOARD). Identity is read on the server; plan,
 * security and session tiles, the checklist and billing activity load in the
 * browser from the portal's existing queries. Reference content without a
 * backend source is not rendered as data: the wallet tile is unavailable,
 * and the KYC callout, "Top up wallet", country/language/member-since and
 * wallet activity are omitted (DR-018, DR-050, DR-054, DR-059).
 */
export default async function DashboardPage() {
  const api = await createAppServerApiClient();
  const profile = toProfileDisplay(await api.profiles.getProfile());

  if (!hasProfileIdentity(profile)) {
    return <EmptyProfile />;
  }

  const displayName = profileName(profile);

  return (
    <section className="space-y-6">
      <DashboardHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href={billingRoutes.overview}
          >
            View billing
          </Link>
        }
        description={PAGE_DESCRIPTION}
        title={`Welcome back, ${greetingName(profile, displayName)}`}
      />

      <DashboardMetrics />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSummaryCard
          avatarUrl={profile.avatarUrl}
          emailAddress={profile.emailAddress}
          isVerified={profile.isVerified}
          name={displayName}
        />
        <SecurityChecklistCard />
      </div>

      <RecentBillingActivityCard />
    </section>
  );
}

function EmptyProfile() {
  return (
    <section className="space-y-6">
      <DashboardHeader
        description="Your session is active, but no profile details are available yet."
        title="Complete your account"
      />
      <Card>
        <CardContent>
          <EmptyState
            action={
              <Link
                className={buttonVariants({ size: "sm", variant: "secondary" })}
                href="/profile"
              >
                Open profile
              </Link>
            }
            description="Profile details will appear here once they are available."
            icon={<UserIcon />}
            title="Profile information is unavailable"
          />
        </CardContent>
      </Card>
    </section>
  );
}
