import type { SecurityActivityResponse } from "@template/api-client/authentication";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const useSecurityActivity = vi.fn();

vi.mock("@template/api-react/authentication", () => ({
  useSecurityActivity: () => useSecurityActivity(),
}));

import { SecurityActivityCard } from "./security-activity-card";

function buildActivity(
  overrides: Partial<SecurityActivityResponse> = {},
): SecurityActivityResponse {
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
    failureReason: null,
    ...overrides,
  };
}

function render() {
  return renderToStaticMarkup(createElement(SecurityActivityCard));
}

describe("SecurityActivityCard", () => {
  it("shows an accessible loading state", () => {
    useSecurityActivity.mockReturnValue({ isPending: true });

    const markup = render();

    expect(markup).toContain("Loading security activity");
    expect(markup).toContain('aria-busy="true"');
  });

  it("shows the error state without crashing the rest of the page", () => {
    useSecurityActivity.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error("network down"),
    });

    const markup = render();

    expect(markup).toContain(
      "Security activity could not be loaded. Refresh and try again.",
    );
  });

  it("labels failed sign-ins with their reason", () => {
    useSecurityActivity.mockReturnValue({
      isPending: false,
      data: {
        pages: [
          {
            activities: [
              buildActivity({
                activityType: "FailedSignIn",
                failureReason: "invalid_two_factor_code",
              }),
              buildActivity({ activityType: "PasskeyAdded", id: "activity-2" }),
            ],
            nextCursor: null,
          },
        ],
      },
    });

    const markup = render();

    expect(markup).toContain("Failed sign in attempt");
    expect(markup).toContain("Incorrect two-factor code");
    expect(markup).toContain("Passkey added");
  });

  it("shows an empty state when there is no recorded activity", () => {
    useSecurityActivity.mockReturnValue({
      isPending: false,
      data: { pages: [{ activities: [], nextCursor: null }] },
    });

    const markup = render();

    expect(markup).toContain("No security activity has been recorded yet.");
  });

  it("orders activity newest first, maps activity types, and formats the timestamp", () => {
    const older = buildActivity({
      id: "older",
      activityType: "TokenRefresh",
      occurredAtUtc: "2026-09-20T09:00:00Z",
    });
    const newer = buildActivity({
      id: "newer",
      activityType: "InitialLogin",
      occurredAtUtc: "2026-09-26T10:42:00Z",
    });
    useSecurityActivity.mockReturnValue({
      isPending: false,
      data: { pages: [{ activities: [older, newer], nextCursor: null }] },
      hasNextPage: false,
    });

    const markup = render();

    expect(markup.indexOf("Successful sign in")).toBeLessThan(
      markup.indexOf("Session refreshed"),
    );
    expect(markup).toContain("September 26, 2026 at 10:42 AM");
    expect(markup).toContain("Chrome on Windows");
    expect(markup).toContain(
      'href="https://whatismyipaddress.com/ip/143.105.174.121"',
    );
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain("Lagos, Nigeria");
  });

  it("falls back to readable copy when device and location details are missing", () => {
    useSecurityActivity.mockReturnValue({
      isPending: false,
      data: {
        pages: [
          {
            activities: [
              buildActivity({
                browserName: null,
                devicePlatform: null,
                deviceName: null,
                city: null,
                state: null,
                country: null,
              }),
            ],
            nextCursor: null,
          },
        ],
      },
      hasNextPage: false,
    });

    const markup = render();

    expect(markup).toContain("Unknown device");
    expect(markup).not.toContain("Location:");
    expect(markup).not.toMatch(/\bnull\b/);
  });

  it("shows a load-more control while another page is available", () => {
    useSecurityActivity.mockReturnValue({
      isPending: false,
      data: {
        pages: [{ activities: [buildActivity()], nextCursor: "cursor-2" }],
      },
      hasNextPage: true,
      isFetchingNextPage: false,
    });

    const markup = render();

    expect(markup).toContain("Load more");
  });

  it("hides the load-more control once every page has been fetched", () => {
    useSecurityActivity.mockReturnValue({
      isPending: false,
      data: { pages: [{ activities: [buildActivity()], nextCursor: null }] },
      hasNextPage: false,
    });

    const markup = render();

    expect(markup).not.toContain("Load more");
  });

  it("keeps loaded activity visible when loading another page fails", () => {
    useSecurityActivity.mockReturnValue({
      isPending: false,
      isError: true,
      isFetchNextPageError: true,
      error: new Error("network down"),
      data: {
        pages: [{ activities: [buildActivity()], nextCursor: "cursor-2" }],
      },
      hasNextPage: true,
      isFetchingNextPage: false,
    });

    const markup = render();

    expect(markup).toContain("Successful sign in");
    expect(markup).toContain(
      "More security activity could not be loaded. Try again.",
    );
    expect(markup).toContain("Try loading more again");
  });
});
