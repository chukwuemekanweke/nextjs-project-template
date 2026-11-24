import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { ShieldIcon } from "@template/ui-core";
import { ActiveSessionsCard } from "./active-sessions-card";
import { LoginActivityCard } from "./login-activity-card";
import { PasskeysCard } from "./passkeys-card";
import { PasswordChangeCard } from "./password-change-card";
import { SecurityOverviewCard } from "./security-overview-card";
import { SecurityTabs } from "./security-tabs";
import { TwoFactorSecurityCard } from "./two-factor-security-card";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <section className="space-y-6">
      <DashboardHeader
        description="Manage your credentials, passkeys, two-factor authentication, active sessions, and login activity."
        icon={<ShieldIcon className="h-6 w-6" />}
        title="Security"
      />
      <SecurityTabs
        devices={
          <>
            <ActiveSessionsCard />
            <LoginActivityCard />
          </>
        }
        general={
          <>
            <SecurityOverviewCard />
            <PasswordChangeCard />
            <PasskeysCard />
            <TwoFactorSecurityCard />
          </>
        }
      />
    </section>
  );
}
