import { describe, expect, it } from "vitest";
import { userPortalEnvironmentExtensionSchema } from "./env-schema";

describe("user portal environment extension", () => {
  it("requires a Google OAuth client id", () => {
    const result = userPortalEnvironmentExtensionSchema.safeParse({
      NEXT_PUBLIC_USER_PORTAL_DESCRIPTION: "Customer portal",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] }),
      );
    }
  });

  it("accepts a non-empty public client id", () => {
    expect(
      userPortalEnvironmentExtensionSchema.safeParse({
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: "client-id.apps.googleusercontent.com",
        NEXT_PUBLIC_USER_PORTAL_DESCRIPTION: "Customer portal",
      }).success,
    ).toBe(true);
  });
});
