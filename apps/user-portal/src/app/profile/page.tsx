import type { Metadata } from "next";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  UserIcon,
} from "@template/ui-core";
import {
  hasProfileIdentity,
  profileName,
  toProfileDisplay,
} from "@/lib/profile-display";
import { createAppServerApiClient } from "@/lib/server-api";
import { AvatarUploadControl } from "./avatar-upload-control";
import { ProfileEditForm } from "./profile-edit-form";

export const metadata: Metadata = { title: "Profile" };

const PAGE_DESCRIPTION = "The personal details tied to your account.";

/**
 * Profile (USR-PROFILE). The profile is read on the server through the
 * authenticated server client; editing and the avatar upload are client
 * workflows on the profile BFF. Reference fields without a backend source —
 * country, "last updated", photo removal, upload percentage and the
 * connected Google sign-in card — are not rendered (DR-019).
 */
export default async function ProfilePage() {
  const api = await createAppServerApiClient();
  const profile = toProfileDisplay(await api.profiles.getProfile());

  if (!hasProfileIdentity(profile)) {
    return <EmptyProfile />;
  }

  return (
    <section className="space-y-6">
      <DashboardHeader description={PAGE_DESCRIPTION} title="Profile" />

      <Card aria-labelledby="profile-photo-heading" role="region">
        <CardHeader>
          <CardTitle id="profile-photo-heading">Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUploadControl
            avatarUrl={profile.avatarUrl}
            name={profileName(profile)}
          />
        </CardContent>
      </Card>

      <Card>
        <ProfileEditForm
          emailAddress={profile.emailAddress}
          firstName={profile.firstName}
          isVerified={profile.isVerified}
          lastName={profile.lastName}
        />
      </Card>
    </section>
  );
}

function EmptyProfile() {
  return (
    <section className="space-y-6">
      <DashboardHeader description={PAGE_DESCRIPTION} title="Profile" />
      <Card>
        <CardContent>
          <EmptyState
            description="Try again later or contact support if your profile remains empty."
            icon={<UserIcon />}
            title="Profile information is unavailable"
          />
        </CardContent>
      </Card>
    </section>
  );
}
