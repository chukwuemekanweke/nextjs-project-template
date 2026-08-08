import { beforeEach, describe, expect, it, vi } from "vitest";

describe("userPortalHref", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:5000");
    vi.stubEnv("NEXT_PUBLIC_APP_ENVIRONMENT", "test");
    vi.stubEnv("NEXT_PUBLIC_APPLICATION_NAME", "public-portal");
    vi.stubEnv("NEXT_PUBLIC_APPLICATION_VERSION", "0.1.0");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_NAME", "Acme Platform");
    vi.stubEnv("NEXT_PUBLIC_ORGANIZATION_NAME", "Acme Inc.");
    vi.stubEnv("NEXT_PUBLIC_LOGO_LIGHT", "/images/logo/logo-light.svg");
    vi.stubEnv("NEXT_PUBLIC_LOGO_DARK", "/images/logo/logo-dark.svg");
    vi.stubEnv("NEXT_PUBLIC_FAVICON", "/images/favicon.ico");
    vi.stubEnv("NEXT_PUBLIC_BRAND_PRIMARY_COLOUR", "#006BFF");
    vi.stubEnv("NEXT_PUBLIC_BRAND_ACCENT_COLOUR", "#20C5A8");
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "support@example.com");
    vi.stubEnv("NEXT_PUBLIC_COPYRIGHT", "Acme Inc. All rights reserved.");
    vi.stubEnv("NEXT_PUBLIC_USER_PORTAL_NAME", "Customer Portal");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PORTAL_NAME", "Operations Portal");
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_PORTAL_NAME", "Acme Platform");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:9002");
    vi.stubEnv("NEXT_PUBLIC_USER_PORTAL_URL", "http://localhost:9000");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_DESCRIPTION", "Description");
    vi.stubEnv("NEXT_PUBLIC_CONTACT_ADDRESS", "Address");
  });

  it("points calls to action to the User Portal", async () => {
    const { env, userPortalHref } = await import("./env");
    expect(userPortalHref("/login")).toBe(`${env.userPortalUrl}/login`);
  });
});
