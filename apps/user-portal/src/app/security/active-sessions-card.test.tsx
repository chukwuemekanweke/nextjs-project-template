import type { ActiveSessionResponse } from "@template/api-client/authentication";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const useActiveSessions = vi.fn();
const useRevokeSession = vi.fn();
const useRevokeOtherSessions = vi.fn();

vi.mock("@template/api-react/authentication", () => ({
  useActiveSessions: () => useActiveSessions(),
  useRevokeOtherSessions: () => useRevokeOtherSessions(),
  useRevokeSession: () => useRevokeSession(),
}));

import { ActiveSessionsCard } from "./active-sessions-card";

const idleMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

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

function render() {
  return renderToStaticMarkup(createElement(ActiveSessionsCard));
}

describe("ActiveSessionsCard", () => {
  it("shows an accessible loading state", () => {
    useActiveSessions.mockReturnValue({ isPending: true });
    useRevokeSession.mockReturnValue(idleMutation);
    useRevokeOtherSessions.mockReturnValue(idleMutation);

    const markup = render();

    expect(markup).toContain("Loading active sessions");
    expect(markup).toContain('aria-busy="true"');
  });

  it("shows the error state without crashing the rest of the page", () => {
    useActiveSessions.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error("network down"),
    });
    useRevokeSession.mockReturnValue(idleMutation);
    useRevokeOtherSessions.mockReturnValue(idleMutation);

    const markup = render();

    expect(markup).toContain(
      "Active sessions could not be loaded. Refresh and try again.",
    );
  });

  it("shows an empty state when there are no sessions", () => {
    useActiveSessions.mockReturnValue({ isPending: false, data: [] });
    useRevokeSession.mockReturnValue(idleMutation);
    useRevokeOtherSessions.mockReturnValue(idleMutation);

    const markup = render();

    expect(markup).toContain("No active sessions were found.");
  });

  it("lists the current session first, labels it, and hides its sign-out action", () => {
    const other = buildSession({ sessionId: "other", isCurrent: false });
    const current = buildSession({ sessionId: "current", isCurrent: true });
    useActiveSessions.mockReturnValue({
      isPending: false,
      data: [other, current],
    });
    useRevokeSession.mockReturnValue(idleMutation);
    useRevokeOtherSessions.mockReturnValue(idleMutation);

    const markup = render();

    expect(markup.indexOf("This device")).toBeLessThan(
      markup.indexOf("Sign out Chrome on Windows"),
    );
    expect(markup).toContain("This device");
    expect(markup).toContain('aria-label="Sign out Chrome on Windows"');
    expect(markup).toContain("Sign out all other sessions");
  });

  it("hides the sign-out-all action when only the current session exists", () => {
    useActiveSessions.mockReturnValue({
      isPending: false,
      data: [buildSession({ isCurrent: true })],
    });
    useRevokeSession.mockReturnValue(idleMutation);
    useRevokeOtherSessions.mockReturnValue(idleMutation);

    const markup = render();

    expect(markup).not.toContain("Sign out all other sessions");
  });

  it("falls back to readable copy when device and location details are missing", () => {
    useActiveSessions.mockReturnValue({
      isPending: false,
      data: [
        buildSession({
          browserName: null,
          devicePlatform: null,
          deviceName: null,
          city: null,
          state: null,
          country: null,
        }),
      ],
    });
    useRevokeSession.mockReturnValue(idleMutation);
    useRevokeOtherSessions.mockReturnValue(idleMutation);

    const markup = render();

    expect(markup).toContain("Unknown device");
    expect(markup).not.toContain("null on null");
    expect(markup).not.toMatch(/\bnull\b/);
  });

  it("links the most recent IP address to an external lookup in a new tab", () => {
    useActiveSessions.mockReturnValue({
      isPending: false,
      data: [buildSession({ lastIpAddress: "143.105.174.121" })],
    });
    useRevokeSession.mockReturnValue(idleMutation);
    useRevokeOtherSessions.mockReturnValue(idleMutation);

    const markup = render();

    expect(markup).toContain(
      'href="https://whatismyipaddress.com/ip/143.105.174.121"',
    );
    expect(markup).toContain("text-brand-600");
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });
});
