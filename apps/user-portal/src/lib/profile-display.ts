import type { GetProfileQueryResponse } from "@template/api-client/profiles";

export function hasProfileIdentity(profile: GetProfileQueryResponse) {
  return Boolean(
    profile.emailAddress.trim() ||
    profile.firstName.trim() ||
    profile.lastName.trim(),
  );
}

export function profileName(profile: GetProfileQueryResponse) {
  const fullName = [profile.firstName, profile.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  return fullName || profile.emailAddress.trim();
}

export function profileInitials(profile: GetProfileQueryResponse) {
  const initials = [profile.firstName, profile.lastName]
    .map((part) => part.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .join("");
  return initials || profile.emailAddress.trim().charAt(0).toUpperCase();
}
