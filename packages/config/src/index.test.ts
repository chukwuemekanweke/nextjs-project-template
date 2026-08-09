import { describe, expect, it } from "vitest";
import {
  browserEnvironmentSchema,
  DEFAULT_TENANT_ID,
  serverEnvironmentSchema,
} from "./index";

describe("shared environment schemas", () => {
  it("rejects missing server configuration", () => {
    expect(serverEnvironmentSchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid browser API URLs", () => {
    expect(
      browserEnvironmentSchema.safeParse({
        NEXT_PUBLIC_API_BASE_URL: "not-a-url",
        NEXT_PUBLIC_APP_ENVIRONMENT: "development",
        NEXT_PUBLIC_APPLICATION_NAME: "public-portal",
        NEXT_PUBLIC_APPLICATION_VERSION: "0.1.0",
      }).success,
    ).toBe(false);
  });

  it("uses the template tenant when no tenant override is configured", () => {
    const server = serverEnvironmentSchema.parse({
      API_BASE_URL: "http://localhost:8080",
      APP_ENVIRONMENT: "development",
      APPLICATION_NAME: "user-portal",
      APPLICATION_VERSION: "0.1.0",
    });
    const browser = browserEnvironmentSchema.parse({
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:8080",
      NEXT_PUBLIC_APP_ENVIRONMENT: "development",
      NEXT_PUBLIC_APPLICATION_NAME: "user-portal",
      NEXT_PUBLIC_APPLICATION_VERSION: "0.1.0",
    });

    expect(server.TENANT_ID).toBe(DEFAULT_TENANT_ID);
    expect(browser.NEXT_PUBLIC_TENANT_ID).toBe(DEFAULT_TENANT_ID);
  });

  it("rejects an invalid tenant override", () => {
    expect(
      serverEnvironmentSchema.safeParse({
        API_BASE_URL: "http://localhost:8080",
        TENANT_ID: "not-a-tenant-id",
        APP_ENVIRONMENT: "development",
        APPLICATION_NAME: "user-portal",
        APPLICATION_VERSION: "0.1.0",
      }).success,
    ).toBe(false);
  });
});
