import { describe, expect, it } from "vitest";
import { createSignInRedirectUrl } from "@template/api-client/authentication";
import {
  createEmailConfirmationDestination,
  createRegistrationHref,
  createSignInHref,
  createTwoFactorDestination,
  safeEmailParameter,
  safeSignInDestination,
  safeSignInError,
} from "./sign-in";

describe("createEmailConfirmationDestination", () => {
  it("carries safe email, cooldown, and return destinations", () => {
    expect(
      createEmailConfirmationDestination({
        email: " User@Example.COM ",
        retryAtUtc: "2026-08-22T11:00:00Z",
        returnTo: "/payments?page=2",
      }),
    ).toBe(
      "/confirm-email?email=user%40example.com&returnTo=%2Fpayments%3Fpage%3D2&retryAtUtc=2026-08-22T11%3A00%3A00Z",
    );
  });

  it("drops invalid timestamps and external destinations", () => {
    expect(
      createEmailConfirmationDestination({
        email: "user@example.com",
        retryAtUtc: "invalid",
        returnTo: "https://attacker.test",
      }),
    ).toBe("/confirm-email?email=user%40example.com&returnTo=%2Fdashboard");
  });
});

describe("safeEmailParameter", () => {
  it("normalizes valid emails and rejects invalid query values", () => {
    expect(safeEmailParameter(" Ada@Example.COM ")).toBe("ada@example.com");
    expect(safeEmailParameter("not-an-email")).toBe("");
    expect(safeEmailParameter(undefined)).toBe("");
  });
});

describe("safeSignInDestination", () => {
  it("preserves local paths including their query and fragment", () => {
    expect(safeSignInDestination("/payments?status=pending#latest")).toBe(
      "/payments?status=pending#latest",
    );
  });

  it.each([undefined, "", "https://attacker.test", "//attacker.test/path"])(
    "rejects an unsafe destination: %s",
    (destination) => {
      expect(safeSignInDestination(destination)).toBe("/dashboard");
    },
  );
});

describe("createTwoFactorDestination", () => {
  it("preserves only a validated returnTo and never carries a challenge", () => {
    const destination = createTwoFactorDestination("/payments?page=2");
    expect(destination).toBe(
      "/sign-in/two-factor?returnTo=%2Fpayments%3Fpage%3D2",
    );
    expect(destination).not.toContain("challenge");
    expect(createTwoFactorDestination("https://attacker.test")).toBe(
      "/sign-in/two-factor?returnTo=%2Fdashboard",
    );
  });
});

describe("safeSignInError", () => {
  it("does not expose backend credential details", () => {
    expect(safeSignInError(401)).toBe("The email or password is incorrect.");
  });

  it("uses a generic message for unexpected failures", () => {
    expect(safeSignInError(500)).not.toContain("500");
  });
});

describe("authentication links", () => {
  const checkout =
    "/billing/checkout?planId=019a0000-0000-7000-8000-000000000001";

  it("keeps a selected plan destination between sign-in and registration", () => {
    expect(createRegistrationHref(checkout)).toBe(
      `/register?returnTo=${encodeURIComponent(checkout)}`,
    );
    expect(
      createSignInHref({ email: "User@Example.com", returnTo: checkout }),
    ).toBe(
      `/sign-in?email=user%40example.com&returnTo=${encodeURIComponent(checkout)}`,
    );
  });

  it("omits default and unsafe destinations", () => {
    expect(createRegistrationHref("/dashboard")).toBe("/register");
    expect(createRegistrationHref("https://evil.example/billing")).toBe(
      "/register",
    );
    expect(createSignInHref({ returnTo: "//evil.example" })).toBe("/sign-in");
    expect(createSignInHref()).toBe("/sign-in");
  });
});

describe("provider return destinations", () => {
  it("bring an expired session back to the payment return route after sign-in", () => {
    const redirect = createSignInRedirectUrl(
      new URL("https://portal.example/billing/checkout/success?checkout_id=x"),
      "/sign-in",
    );
    const returnTo = redirect.searchParams.get("returnTo") ?? undefined;
    expect(redirect.origin).toBe("https://portal.example");
    expect(safeSignInDestination(returnTo)).toBe(
      "/billing/checkout/success?checkout_id=x",
    );
    expect(safeSignInDestination("/billing/checkout/cancelled")).toBe(
      "/billing/checkout/cancelled",
    );
  });

  it("never turn a return destination into an open redirect", () => {
    expect(
      safeSignInDestination("//attacker.test/billing/checkout/success"),
    ).toBe("/dashboard");
    expect(
      safeSignInDestination("https://attacker.test/billing/checkout/success"),
    ).toBe("/dashboard");
  });
});
