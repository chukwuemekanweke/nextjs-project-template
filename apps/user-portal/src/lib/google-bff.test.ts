import { describe, expect, it } from "vitest";
import {
  isAuthenticatedGoogleResponse,
  isTerminalGoogleFlowCode,
  safeGoogleSessionResponse,
} from "./google-bff";

describe("Google authentication BFF boundaries", () => {
  const session = {
    accessToken: "access-secret",
    expiresAtUtc: "2026-09-24T11:00:00Z",
    outcome: "authenticated" as const,
    refreshToken: "refresh-secret",
    refreshTokenExpiresAtUtc: "2026-10-24T11:00:00Z",
    tokenType: "Bearer",
  };

  it("returns safe metadata without application tokens", () => {
    expect(isAuthenticatedGoogleResponse(session)).toBe(true);
    expect(safeGoogleSessionResponse(session)).toEqual({
      expiresAtUtc: session.expiresAtUtc,
      status: "authenticated",
      tokenType: "Bearer",
    });
    expect(safeGoogleSessionResponse(session)).not.toHaveProperty(
      "accessToken",
    );
    expect(safeGoogleSessionResponse(session)).not.toHaveProperty(
      "refreshToken",
    );
  });

  it("clears only terminal flow failures", () => {
    expect(isTerminalGoogleFlowCode("google_flow_expired")).toBe(true);
    expect(isTerminalGoogleFlowCode("google_flow_invalid")).toBe(true);
    expect(isTerminalGoogleFlowCode("invalid_google_credential")).toBe(false);
    expect(isTerminalGoogleFlowCode("account_locked")).toBe(false);
  });
});
