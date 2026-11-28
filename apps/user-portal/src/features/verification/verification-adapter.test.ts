import { describe, expect, it } from "vitest";
import {
  toVerificationScreenModel,
  toVerificationState,
} from "./verification-adapter";

const current = (overrides: Record<string, unknown> = {}) => ({
  completedAtUtc: null,
  isVerified: false,
  provider: "kycaid",
  startedAtUtc: "2026-11-28T12:00:00Z",
  status: "NotStarted",
  submittedAtUtc: null,
  verificationId: "verification-1",
  verificationUrl: null,
  ...overrides,
});

describe("verification adapter", () => {
  it.each([
    ["NotStarted", "notStarted"],
    ["Rejected", "rejected"],
    ["Failed", "failed"],
    ["Expired", "expired"],
  ])("maps backend %s to presentation %s", (status, expected) => {
    expect(toVerificationState(current({ status }))).toMatchObject({
      status: expected,
    });
  });

  it("maps Pending with and without a continuation URL", () => {
    expect(
      toVerificationState(
        current({
          status: "Pending",
          verificationUrl: "https://forms.kycaid.com/form/1",
        }),
      ),
    ).toEqual({
      preparing: false,
      startedAt: "2026-11-28T12:00:00Z",
      status: "inProgress",
    });
    expect(toVerificationState(current({ status: "Pending" }))).toMatchObject({
      preparing: true,
      status: "inProgress",
    });
  });

  it("maps submitted InProgress to the approved review state", () => {
    expect(
      toVerificationState(
        current({
          status: "InProgress",
          submittedAtUtc: "2026-11-28T12:10:00Z",
        }),
      ),
    ).toEqual({
      status: "pending",
      submittedAt: "2026-11-28T12:10:00Z",
    });
  });

  it("shows success only from authoritative isVerified", () => {
    expect(
      toVerificationState(
        current({
          completedAtUtc: "2026-11-28T13:00:00Z",
          isVerified: true,
          status: "FutureStatus",
        }),
      ),
    ).toEqual({
      status: "verified",
      verifiedAt: "2026-11-28T13:00:00Z",
    });
    expect(
      toVerificationScreenModel(current({ status: "Verified" }), "ready"),
    ).toEqual({ history: { state: "unavailable" }, state: "unknown" });
  });

  it("degrades unknown statuses without an action", () => {
    expect(
      toVerificationScreenModel(current({ status: "FutureStatus" }), "ready"),
    ).toEqual({ history: { state: "unavailable" }, state: "unknown" });
  });
});
