import { describe, expect, it } from "vitest";
import { browserEnvironmentSchema, serverEnvironmentSchema } from "./index";

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
});
