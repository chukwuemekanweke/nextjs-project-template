import type { CSSProperties } from "react";
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
  toProfileDisplay,
  type ProfileDisplay,
} from "@/lib/profile-display";
import { createAppServerApiClient } from "@/lib/server-api";
import { ProfileEditForm } from "./profile-edit-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const api = await createAppServerApiClient();
  const profile = toProfileDisplay(await api.profiles.getProfile());

  if (!hasProfileIdentity(profile)) {
    return <EmptyProfile />;
  }

  const displayName = profileName(profile);

  return (
    <section className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <DashboardHeader
        description="Review the personal information associated with your account."
        eyebrow={portalName}
        title="Your profile"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <Card>
          <CardContent>
            <div className="flex flex-col gap-5 border-b border-gray-100 pb-6 sm:flex-row sm:items-center dark:border-gray-800">
              <ProfileAvatar profile={profile} />
              <div className="min-w-0">
                <p className="text-xl font-semibold break-words text-gray-900 dark:text-white">
                  {displayName}
                </p>
                <p className="mt-1 text-sm break-all text-gray-500 dark:text-gray-400">
                  {profile.emailAddress.trim()}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <CardTitle>Personal information</CardTitle>
              <CardDescription>
                Update the names associated with your account. Your email
                address is read-only.
              </CardDescription>
              <ProfileEditForm
                firstName={profile.firstName}
                lastName={profile.lastName}
              />
              <dl className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
                <ProfileField
                  label="Email address"
                  value={profile.emailAddress}
                />
              </dl>
            </div>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardContent>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
              Account status
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  profile.isVerified ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <p className="font-semibold text-gray-900 dark:text-white">
                {profile.isVerified ? "Verified" : "Verification pending"}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
              {profile.isVerified
                ? "Your email address and account verification are complete."
                : "Your account is active while verification is pending."}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ProfileAvatar({ profile }: Readonly<{ profile: ProfileDisplay }>) {
  const avatarUrl = profile.avatarUrl?.trim();
  const avatarStyle = avatarUrl
    ? ({
        backgroundImage: `url(${JSON.stringify(avatarUrl)})`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      aria-hidden="true"
      className="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-cover bg-center text-2xl font-semibold"
      style={avatarStyle}
    >
      {avatarUrl ? null : profileInitials(profile)}
    </div>
  );
}

function ProfileField({
  className = "",
  label,
  value,
}: Readonly<{ className?: string; label: string; value: string }>) {
  const displayValue = value.trim() || "Not provided";

  return (
    <div className={className}>
      <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium break-words text-gray-900 dark:text-white">
        {displayValue}
      </dd>
    </div>
  );
}

function EmptyProfile() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <DashboardHeader
        description="Your session is active, but no personal information is available yet."
        eyebrow={portalName}
        title="Your profile"
      />
      <Card>
        <CardContent>
          <CardTitle>Profile information is unavailable</CardTitle>
          <CardDescription>
            Try again later or contact support if your profile remains empty.
          </CardDescription>
        </CardContent>
      </Card>
    </section>
  );
}
