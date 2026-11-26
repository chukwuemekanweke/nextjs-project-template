import { describe, expect, it } from "vitest";
import {
  formatVerificationDate,
  formatVerificationDateTime,
  verificationActionFor,
  verificationPanelTone,
  verificationStatusBadge,
  verificationStatusCopy,
} from "./verification-model";
import {
  fixtureVerification,
  verificationFixtureStatuses,
} from "./verification-preview.fixtures";

const utc = { timeZone: "UTC" } as const;

describe("verificationActionFor", () => {
  it("offers the reference action for each state", () => {
    const actions = Object.fromEntries(
      verificationFixtureStatuses.map((status) => [
        status,
        verificationActionFor(fixtureVerification(status)),
      ]),
    );
    expect(actions).toEqual({
      expired: { intent: "start", label: "Start again", variant: "primary" },
      inProgress: {
        intent: "continue",
        label: "Continue verification",
        variant: "primary",
      },
      notStarted: {
        intent: "start",
        label: "Start verification",
        variant: "primary",
      },
      pending: {
        intent: "refresh",
        label: "Refresh status",
        variant: "secondary",
      },
      rejected: { intent: "retry", label: "Try again", variant: "primary" },
      verified: null,
    });
  });

  it("never offers a duplicate start while pending", () => {
    expect(verificationActionFor({ status: "pending" })?.intent).not.toBe(
      "start",
    );
  });

  it("drops retry when the source disallows another attempt", () => {
    expect(
      verificationActionFor({ retryAllowed: false, status: "rejected" }),
    ).toBeNull();
  });
});

describe("verificationStatusCopy", () => {
  it("uses only supplied dates", () => {
    expect(
      verificationStatusCopy(fixtureVerification("verified"), utc).description,
    ).toBe("Verified on Jan 15, 2026. No further action is needed.");
    expect(
      verificationStatusCopy({ status: "verified" }, utc).description,
    ).toBe("Your identity has been verified. No further action is needed.");
    expect(
      verificationStatusCopy(fixtureVerification("pending"), utc).description,
    ).toContain("Submitted Jan 15, 2026, 10:41 AM.");
    expect(
      verificationStatusCopy({ status: "pending" }, utc).description,
    ).not.toContain("Submitted");
  });

  it("does not invent a rejection reason", () => {
    expect(
      verificationStatusCopy({ reason: "  ", status: "rejected" }).description,
    ).toBe("No reason was provided for this decision.");
  });

  it("makes no turnaround, email, payout or limit claims", () => {
    for (const status of verificationFixtureStatuses) {
      const copy = verificationStatusCopy(fixtureVerification(status), utc);
      const text = `${copy.title} ${copy.description}`;
      expect(text, status).not.toMatch(
        /minute|hour|email|payout|limit|wallet/i,
      );
    }
  });
});

describe("status presentation", () => {
  it("labels every attempt status in text", () => {
    expect(verificationStatusBadge("pending")).toEqual({
      label: "Pending",
      tone: "warning",
    });
    expect(verificationStatusBadge("rejected").tone).toBe("danger");
    expect(verificationStatusBadge("unknown").label).toBe("Unknown");
  });

  it("maps panel tones to the reference icon colours", () => {
    expect(verificationPanelTone("verified")).toBe("success");
    expect(verificationPanelTone("rejected")).toBe("danger");
    expect(verificationPanelTone("pending")).toBe("warning");
    expect(verificationPanelTone("expired")).toBe("warning");
    expect(verificationPanelTone("notStarted")).toBe("brand");
    expect(verificationPanelTone("unknown")).toBe("neutral");
  });
});

describe("date formatting", () => {
  it("formats valid timestamps and rejects missing or invalid ones", () => {
    expect(formatVerificationDateTime("2026-01-15T10:32:00Z", utc)).toBe(
      "Jan 15, 2026, 10:32 AM",
    );
    expect(formatVerificationDate("2026-01-15T10:32:00Z", utc)).toBe(
      "Jan 15, 2026",
    );
    expect(formatVerificationDateTime(undefined)).toBeUndefined();
    expect(formatVerificationDate("not a date")).toBeUndefined();
  });
});
