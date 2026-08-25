import type { GetProfileQueryResponse } from "@template/api-client/profiles";

export type ProfileDisplay = Pick<
  GetProfileQueryResponse,
  "avatarUrl" | "emailAddress" | "firstName" | "isVerified" | "lastName"
>;

export function toProfileDisplay(
  profile: GetProfileQueryResponse,
): ProfileDisplay {
  return {
    avatarUrl: profile.avatarUrl,
    emailAddress: profile.emailAddress,
    firstName: profile.firstName,
    isVerified: profile.isVerified,
    lastName: profile.lastName,
  };
}

export function hasProfileIdentity(profile: ProfileDisplay) {
  return Boolean(
    profile.emailAddress.trim() ||
    profile.firstName.trim() ||
    profile.lastName.trim(),
  );
}

export function profileName(profile: ProfileDisplay) {
  const fullName = [profile.firstName, profile.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  return fullName || profile.emailAddress.trim();
}

export function profileInitials(profile: ProfileDisplay) {
  const initials = [profile.firstName, profile.lastName]
    .map((part) => part.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .join("");
  return initials || profile.emailAddress.trim().charAt(0).toUpperCase();
}
