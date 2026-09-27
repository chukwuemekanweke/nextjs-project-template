import type {
  ActiveSessionResponse,
  LoginActivityResponse,
} from "@template/api-client/authentication";
import { describe, expect, it } from "vitest";
import {
  describeActivityType,
  describeDevice,
  describeLocation,
  formatActivityTimestamp,
  formatRelativeTime,
  ipAddressLookupUrl,
  sortActivitiesNewestFirst,
  sortSessionsCurrentFirst,
} from "./session-display";

function buildSession(
  overrides: Partial<ActiveSessionResponse> = {},
): ActiveSessionResponse {
  return {
    sessionId: "session-1",
    deviceName: null,
    devicePlatform: "Windows",
    browserName: "Chrome",
    userAgent: "Mozilla/5.0",
    firstIpAddress: "143.105.174.121",
    lastIpAddress: "143.105.174.121",
    city: "Lagos",
    state: null,
    country: "Nigeria",
    createdAtUtc: "2026-09-20T10:00:00Z",
    lastActiveAtUtc: "2026-09-26T09:55:00Z",
    expiresAtUtc: "2026-10-20T10:00:00Z",
    isCurrent: false,
    ...overrides,
  };
}

function buildActivity(
  overrides: Partial<LoginActivityResponse> = {},
): LoginActivityResponse {
  return {
    id: "activity-1",
    activityType: "InitialLogin",
    occurredAtUtc: "2026-09-26T10:42:00Z",
    ipAddress: "143.105.174.121",
    deviceName: null,
    devicePlatform: "Windows",
    browserName: "Chrome",
    city: "Lagos",
    state: null,
    country: "Nigeria",
    ...overrides,
  };
}

describe("session display", () => {
  it("moves the current session first without reordering the rest", () => {
    const other1 = buildSession({ sessionId: "other-1", isCurrent: false });
    const current = buildSession({ sessionId: "current", isCurrent: true });
    const other2 = buildSession({ sessionId: "other-2", isCurrent: false });

    expect(
      sortSessionsCurrentFirst([other1, other2, current]).map(
        (session) => session.sessionId,
      ),
    ).toEqual(["current", "other-1", "other-2"]);
  });

  it("orders login activity from newest to oldest", () => {
    const oldest = buildActivity({
      id: "oldest",
      occurredAtUtc: "2026-09-20T10:00:00Z",
    });
    const newest = buildActivity({
      id: "newest",
      occurredAtUtc: "2026-09-26T10:42:00Z",
    });
    const middle = buildActivity({
      id: "middle",
      occurredAtUtc: "2026-09-23T10:00:00Z",
    });

    expect(
      sortActivitiesNewestFirst([oldest, middle, newest]).map(
        (activity) => activity.id,
      ),
    ).toEqual(["newest", "middle", "oldest"]);
  });

  it("describes the device using the most specific available fields", () => {
    expect(
      describeDevice({
        browserName: "Chrome",
        devicePlatform: "Windows",
        deviceName: null,
      }),
    ).toBe("Chrome on Windows");
    expect(
      describeDevice({
        browserName: "Chrome",
        devicePlatform: null,
        deviceName: null,
      }),
    ).toBe("Chrome");
    expect(
      describeDevice({
        browserName: null,
        devicePlatform: null,
        deviceName: "Pixel 8",
      }),
    ).toBe("Pixel 8");
  });

  it("falls back to a readable label when no device information is available", () => {
    expect(
      describeDevice({
        browserName: null,
        devicePlatform: null,
        deviceName: null,
      }),
    ).toBe("Unknown device");
    expect(
      describeDevice({
        browserName: null,
        devicePlatform: null,
        deviceName: null,
      }),
    ).not.toContain("null");
  });

  it("joins the available location parts and omits missing ones", () => {
    expect(
      describeLocation({ city: "Lagos", state: null, country: "Nigeria" }),
    ).toBe("Lagos, Nigeria");
    expect(
      describeLocation({ city: "Lagos", state: "Lagos", country: "Nigeria" }),
    ).toBe("Lagos, Nigeria");
    expect(
      describeLocation({ city: null, state: null, country: null }),
    ).toBeUndefined();
  });

  it("builds a safely encoded IP address lookup URL", () => {
    expect(ipAddressLookupUrl("143.105.174.121")).toBe(
      "https://whatismyipaddress.com/ip/143.105.174.121",
    );
    expect(ipAddressLookupUrl("2001:db8::/&weird")).toBe(
      "https://whatismyipaddress.com/ip/2001%3Adb8%3A%3A%2F%26weird",
    );
  });

  it("formats relative last-active times", () => {
    const now = new Date("2026-09-26T10:00:00Z");
    expect(formatRelativeTime("2026-09-26T09:55:00Z", now)).toBe(
      "5 minutes ago",
    );
    expect(formatRelativeTime("2026-09-26T08:00:00Z", now)).toBe("2 hours ago");
    expect(formatRelativeTime("2026-09-24T10:00:00Z", now)).toBe("2 days ago");
  });

  it("formats absolute activity timestamps", () => {
    expect(formatActivityTimestamp("2026-09-26T10:42:00Z")).toBe(
      "September 26, 2026 at 10:42 AM",
    );
  });

  it("maps known activity types to human-readable labels", () => {
    expect(describeActivityType("InitialLogin")).toBe("Successful sign in");
    expect(describeActivityType("TokenRefresh")).toBe("Session refreshed");
    expect(describeActivityType("sign_in_succeeded")).toBe(
      "Successful sign in",
    );
    expect(describeActivityType("sign_in_failed")).toBe(
      "Failed sign in attempt",
    );
  });

  it("humanizes unrecognized activity types instead of exposing raw enum values", () => {
    expect(describeActivityType("device_trust_revoked")).toBe(
      "Device Trust Revoked",
    );
    expect(describeActivityType("RecoveryCodeUsed")).toBe("Recovery Code Used");
    expect(describeActivityType("")).toBe("Account activity");
  });
});
