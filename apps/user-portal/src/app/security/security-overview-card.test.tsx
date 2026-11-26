import type { SecurityActivityResponse } from "@template/api-client/authentication";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePasskeys = vi.fn();
const useTwoFactorStatus = vi.fn();
const useSecurityActivity = vi.fn();

vi.mock("@template/api-react/authentication", () => ({
  usePasskeys: () => usePasskeys(),
  useSecurityActivity: (limit?: number) => useSecurityActivity(limit),
  useTwoFactorStatus: () => useTwoFactorStatus(),
}));

import { SecurityOverview } from "./security-overview-card";

const render = () => renderToStaticMarkup(createElement(SecurityOverview));

const passkey = {
  createdAtUtc: "2026-11-01T10:00:00Z",
  id: "AQ",
  isBackedUp: true,
  isBackupEligible: true,
  name: "Work laptop",
  transports: ["internal"],
};

function activity(
  overrides: Partial<SecurityActivityResponse>,
): SecurityActivityResponse {
  return {
    activityType: "InitialLogin",
    browserName: "Chrome",
    city: "Lagos",
    country: "Nigeria",
    deviceName: null,
    devicePlatform: "Windows",
    failureReason: null,
    id: "a1",
    ipAddress: "143.105.174.121",
    occurredAtUtc: "2026-09-26T10:42:00Z",
    state: null,
    ...overrides,
  };
}

beforeEach(() => {
  useSecurityActivity.mockReturnValue({
    data: { pages: [{ activities: [], nextCursor: null }] },
    isPending: false,
  });
});

describe("SecurityOverview", () => {
  it("summarises each sign-in method from the shared queries", () => {
    usePasskeys.mockReturnValue({ data: [], isError: false, isPending: false });
    useTwoFactorStatus.mockReturnValue({
      data: { enabled: true, recoveryCodesRemaining: 8 },
      isError: false,
      isPending: false,
    });

    const markup = render();

    expect(markup).toContain("Sign-in methods");
    // No backend fact exists for the password, so it gets a link, not a status.
    expect(markup).not.toContain("Password status");
    expect(markup).toContain(">Change password</a>");
    expect(markup).toContain('href="/security?tab=password"');
    expect(markup).toContain("Passkeys status: </span>Not set");
    expect(markup).toContain("Two-factor auth status: </span>Enabled");
  });

  it("scores protection from real facts and links unfinished steps to their tabs", () => {
    usePasskeys.mockReturnValue({
      data: [passkey],
      isError: false,
      isPending: false,
    });
    useTwoFactorStatus.mockReturnValue({
      data: { enabled: true, recoveryCodesRemaining: 8 },
      isError: false,
      isPending: false,
    });

    const markup = render();

    expect(markup).toContain("Good protection");
    expect(markup).toContain("2 of 3 recommended steps done");
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-valuenow="2"');
    expect(markup).toContain('aria-valuemax="3"');
    expect(markup).not.toContain("Password set");
    expect(markup).toContain("One passkey registered");
    expect(markup).toContain("To do: </span>Add a backup passkey");
    expect(markup).toContain('href="/security?tab=passkeys"');
    expect(markup).not.toContain("Strong password");
  });

  it("shows accessible placeholders while statuses load, never a disabled state", () => {
    usePasskeys.mockReturnValue({ isError: false, isPending: true });
    useTwoFactorStatus.mockReturnValue({ isError: false, isPending: true });

    const markup = render();

    expect(markup).toContain("Checking your security status");
    expect(markup).toContain("Checking Passkeys status");
    expect(markup).toContain("Checking Two-factor auth status");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain("Disabled");
    expect(markup).not.toContain("recommended steps done");
  });

  it("reports a failed status query as unavailable, not insecure", () => {
    usePasskeys.mockReturnValue({ isError: true, isPending: false });
    useTwoFactorStatus.mockReturnValue({
      data: { enabled: false, recoveryCodesRemaining: 0 },
      isError: false,
      isPending: false,
    });

    const markup = render();

    expect(markup).toContain("Security status unavailable");
    expect(markup).toContain("Passkeys status: </span>Unavailable");
    expect(markup).not.toContain("Basic protection");
  });

  it("lists the three newest real security events from the shared activity query", () => {
    usePasskeys.mockReturnValue({ data: [], isError: false, isPending: false });
    useTwoFactorStatus.mockReturnValue({
      data: { enabled: false, recoveryCodesRemaining: 0 },
      isError: false,
      isPending: false,
    });
    useSecurityActivity.mockReturnValue({
      data: {
        pages: [
          {
            activities: [
              activity({ id: "old", occurredAtUtc: "2026-09-01T10:00:00Z" }),
              activity({
                activityType: "FailedSignIn",
                id: "failed",
                occurredAtUtc: "2026-09-25T10:00:00Z",
              }),
              activity({
                activityType: "PasskeyAdded",
                id: "passkey",
                occurredAtUtc: "2026-09-24T10:00:00Z",
              }),
              activity({
                // A type added by the backend after this client was built.
                activityType:
                  "SomethingNew" as SecurityActivityResponse["activityType"],
                id: "unknown",
                occurredAtUtc: "2026-09-26T10:00:00Z",
              }),
            ],
            nextCursor: null,
          },
        ],
      },
      isPending: false,
    });

    const markup = render();

    expect(useSecurityActivity).toHaveBeenCalledWith(10);
    expect(markup).toContain("Recent security events");
    expect(markup.indexOf("Something New")).toBeLessThan(
      markup.indexOf("Failed sign in attempt"),
    );
    expect(markup).toContain("Passkey added");
    expect(markup).toContain("Chrome on Windows · Lagos, Nigeria");
    expect(markup).not.toContain("September 1, 2026");
    expect(markup).toContain('href="/security?tab=activity"');
  });

  it("keeps the overview usable when recent activity fails to load", () => {
    usePasskeys.mockReturnValue({ data: [], isError: false, isPending: false });
    useTwoFactorStatus.mockReturnValue({
      data: { enabled: false, recoveryCodesRemaining: 0 },
      isError: false,
      isPending: false,
    });
    useSecurityActivity.mockReturnValue({
      error: new Error("down"),
      isError: true,
      isPending: false,
    });

    const markup = render();

    expect(markup).toContain(
      "Security activity could not be loaded. Refresh and try again.",
    );
    expect(markup).toContain("Basic protection");
  });
});
