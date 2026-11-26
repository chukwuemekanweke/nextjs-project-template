import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { ActiveSessionsCard } from "./active-sessions-card";
import { PasskeysCard } from "./passkeys-card";
import { PasswordChangeCard } from "./password-change-card";
import { SecurityActivityCard } from "./security-activity-card";
import { SecurityOverview } from "./security-overview-card";
import { parseSecurityTab } from "./security-tab";
import { SecurityTabs } from "./security-tabs";
import { TwoFactorSecurityCard } from "./two-factor-security-card";

export const metadata: Metadata = { title: "Security" };

/**
 * One responsive route for all six Security sections; `?tab=` selects the
 * section (unknown values fall back to the overview).
 */
export default async function SecurityPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ tab?: string | string[] }> }>) {
  const initialTab = parseSecurityTab((await searchParams).tab);

  return (
    <section className="space-y-6">
      <DashboardHeader
        description="Manage your password, passkeys, two-factor authentication and active sessions."
        title="Security"
      />
      <SecurityTabs
        initialTab={initialTab}
        panels={{
          activity: <SecurityActivityCard />,
          overview: <SecurityOverview />,
          passkeys: <PasskeysCard />,
          password: <PasswordChangeCard />,
          sessions: <ActiveSessionsCard />,
          "two-factor": <TwoFactorSecurityCard />,
        }}
      />
    </section>
  );
}
