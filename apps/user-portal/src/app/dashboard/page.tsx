import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@template/ui-core";
import { portalName } from "@/lib/portal";
import {
  hasProfileIdentity,
  profileInitials,
  profileName,
} from "@/lib/profile-display";
import { createAppServerApiClient } from "@/lib/server-api";

export const metadata: Metadata = { title: "Dashboard" };

const metricSlots = [
  ["Activity", "Recent account events will appear here."],
  ["Usage", "Product usage metrics will appear here."],
  ["Applications", "Application progress will appear here."],
] as const;

export default async function DashboardPage() {
  const api = await createAppServerApiClient();
  const profile = await api.profiles.getProfile();

  if (!hasProfileIdentity(profile)) {
    return <EmptyProfile />;
  }

  const displayName = profileName(profile);

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <DashboardHeader
        description="Review your identity and the current status of your account."
        eyebrow={portalName}
        title={`Welcome back, ${displayName}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              aria-hidden="true"
              className="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold"
            >
              {profileInitials(profile)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Signed-in identity
              </p>
              <p className="mt-2 truncate text-xl font-semibold text-gray-900 dark:text-white">
                {displayName}
              </p>
              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                {profile.emailAddress}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
              Account status
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full ${
                  profile.isVerified ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {profile.isVerified ? "Verified" : "Verification pending"}
              </p>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {profile.isVerified
                ? "Your account verification is complete."
                : "Your account is active while verification is pending."}
            </p>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="metrics-heading" className="space-y-4">
        <div>
          <h2
            className="text-lg font-semibold text-gray-900 dark:text-white"
            id="metrics-heading"
          >
            Account overview
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            These extension points are ready for application-specific metrics.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {metricSlots.map(([title, description]) => (
            <Card data-metric-slot={title.toLowerCase()} key={title}>
              <CardContent>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <p className="mt-5 text-sm font-medium text-gray-400 dark:text-gray-500">
                  No data available yet
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </section>
  );
}

function EmptyProfile() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <DashboardHeader
        description="Your session is active, but no profile details are available yet."
        eyebrow={portalName}
        title="Complete your account"
      />
      <Card>
        <CardContent>
          <CardTitle>Profile information is unavailable</CardTitle>
          <CardDescription>
            Add profile details when profile management becomes available.
          </CardDescription>
        </CardContent>
      </Card>
    </section>
  );
}
