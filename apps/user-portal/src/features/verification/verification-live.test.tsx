import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  current: vi.fn(),
  start: vi.fn(),
}));

vi.mock("@template/api-react/kyc", () => ({
  useCurrentKycVerification: () => hooks.current(),
  useStartKycVerification: () => hooks.start(),
}));

import { VerificationLive } from "./verification-live";

const response = (status: string, overrides: Record<string, unknown> = {}) => ({
  completedAtUtc: null,
  isVerified: false,
  provider: "kycaid",
  startedAtUtc: "2026-11-28T12:00:00Z",
  status,
  submittedAtUtc: null,
  verificationId: "verification-1",
  verificationUrl: "https://forms.kycaid.com/form/1",
  ...overrides,
});

function query(data: ReturnType<typeof response>) {
  return {
    data,
    isError: false,
    isFetching: false,
    isPending: false,
    pollingExhausted: false,
    refetch: vi.fn(),
  };
}

beforeEach(() => {
  hooks.current.mockReturnValue(query(response("NotStarted")));
  hooks.start.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });
});

describe("live verification screen", () => {
  it.each([
    ["NotStarted", "Verify your identity"],
    ["Pending", "Verification in progress"],
    ["InProgress", "We&#x27;re reviewing your documents"],
    ["Rejected", "Verification was not approved"],
    ["Failed", "Verification could not be completed"],
    ["Expired", "Your verification session expired"],
  ])("renders backend %s without fixture data", (status, copy) => {
    hooks.current.mockReturnValue(query(response(status)));
    const markup = renderToStaticMarkup(<VerificationLive />);
    expect(markup).toContain(copy);
    expect(markup).not.toContain("KYC-FIXTURE");
  });

  it("shows the provider-session preparation state when Pending has no URL", () => {
    hooks.current.mockReturnValue(
      query(response("Pending", { verificationUrl: null })),
    );
    const markup = renderToStaticMarkup(<VerificationLive />);
    expect(markup).toContain("Preparing your verification");
    expect(markup).toContain("Try again");
  });

  it("requires isVerified before showing verified", () => {
    hooks.current.mockReturnValue(query(response("Verified")));
    expect(renderToStaticMarkup(<VerificationLive />)).toContain(
      "couldn&#x27;t confirm your verification status",
    );
    hooks.current.mockReturnValue(
      query(response("Verified", { isVerified: true })),
    );
    expect(renderToStaticMarkup(<VerificationLive />)).toContain(
      "You&#x27;re verified",
    );
  });

  it("offers manual refresh when bounded polling is exhausted", () => {
    hooks.current.mockReturnValue({
      ...query(response("InProgress")),
      pollingExhausted: true,
    });
    const markup = renderToStaticMarkup(<VerificationLive />);
    expect(markup).toContain("Automatic status checks paused");
    expect(markup).toContain("Refresh status");
  });

  it("renders loading and API failure states", () => {
    hooks.current.mockReturnValue({
      isError: false,
      isPending: true,
      pollingExhausted: false,
      refetch: vi.fn(),
    });
    expect(renderToStaticMarkup(<VerificationLive />)).toContain(
      "Loading verification status",
    );
    hooks.current.mockReturnValue({
      isError: true,
      isPending: false,
      pollingExhausted: false,
      refetch: vi.fn(),
    });
    expect(renderToStaticMarkup(<VerificationLive />)).toContain(
      "Verification status unavailable",
    );
  });
});
