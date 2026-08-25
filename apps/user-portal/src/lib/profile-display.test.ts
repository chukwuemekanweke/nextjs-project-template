import type { GetProfileQueryResponse } from "@template/api-client/profiles";
import { describe, expect, it } from "vitest";
import {
  hasProfileIdentity,
  profileInitials,
  profileName,
  toProfileDisplay,
} from "./profile-display";

const profile: GetProfileQueryResponse = {
  stakeholderId: "stakeholder-1",
  emailAddress: "ada@example.com",
  firstName: " Ada ",
  lastName: " Lovelace ",
  avatarUrl: null,
  isVerified: true,
};

describe("profile display", () => {
  it("formats a profile identity", () => {
    expect(hasProfileIdentity(profile)).toBe(true);
    expect(profileName(profile)).toBe("Ada Lovelace");
    expect(profileInitials(profile)).toBe("AL");
  });

  it("falls back to email when names are unavailable", () => {
    const emailOnly = { ...profile, firstName: "", lastName: "" };

    expect(profileName(emailOnly)).toBe("ada@example.com");
    expect(profileInitials(emailOnly)).toBe("A");
  });

  it("detects an empty profile", () => {
    expect(
      hasProfileIdentity({
        ...profile,
        emailAddress: " ",
        firstName: " ",
        lastName: " ",
      }),
    ).toBe(false);
  });

  it("projects only user-facing profile fields", () => {
    expect(toProfileDisplay(profile)).toEqual({
      avatarUrl: null,
      emailAddress: "ada@example.com",
      firstName: " Ada ",
      isVerified: true,
      lastName: " Lovelace ",
    });
    expect(toProfileDisplay(profile)).not.toHaveProperty("stakeholderId");
  });
});
