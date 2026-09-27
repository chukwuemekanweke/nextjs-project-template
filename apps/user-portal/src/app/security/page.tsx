import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import { portalName } from "@/lib/portal";
import { ActiveSessionsCard } from "./active-sessions-card";
import { LoginActivityCard } from "./login-activity-card";
import { PasswordChangeCard } from "./password-change-card";
import { SecurityTabs } from "./security-tabs";
import { TwoFactorSecurityCard } from "./two-factor-security-card";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <DashboardHeader
        description="Manage your credentials, two-factor authentication, active sessions, and login activity."
        eyebrow={portalName}
        title="Account security"
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
            <PasswordChangeCard />
            <TwoFactorSecurityCard />
          </>
        }
      />
    </section>
  );
}
