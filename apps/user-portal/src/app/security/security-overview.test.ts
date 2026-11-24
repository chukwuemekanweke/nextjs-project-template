import type { PasskeyResponse } from "@template/api-client/authentication";
import { describe, expect, it } from "vitest";
import {
  PASSWORD_OVERVIEW_STATUS,
  passkeyOverviewStatus,
  twoFactorOverviewStatus,
} from "./security-overview";

const passkey: PasskeyResponse = {
  createdAtUtc: "2026-09-01T10:00:00Z",
  id: "credential-1",
  isBackedUp: false,
  isBackupEligible: false,
  name: "Laptop",
  transports: ["internal"],
};

describe("security overview", () => {
  it("reports the password as set because every account has one by default", () => {
    expect(PASSWORD_OVERVIEW_STATUS).toEqual({
      label: "Set",
      state: "ready",
      tone: "success",
    });
  });

  it("derives passkey status from the cached passkey list", () => {
    expect(passkeyOverviewStatus({ isError: false, isPending: true })).toEqual({
      state: "loading",
    });
    expect(
      passkeyOverviewStatus({ data: [], isError: false, isPending: false }),
    ).toMatchObject({ label: "Not set", tone: "neutral" });
    expect(
      passkeyOverviewStatus({
        data: [passkey],
        isError: false,
        isPending: false,
      }),
    ).toMatchObject({ label: "1 passkey", tone: "success" });
    expect(
      passkeyOverviewStatus({
        data: [passkey, { ...passkey, id: "credential-2" }],
        isError: false,
        isPending: false,
      }),
    ).toMatchObject({ label: "2 passkeys", tone: "success" });
  });

  it("derives two-factor status from the two-factor query", () => {
    expect(
      twoFactorOverviewStatus({
        data: { enabled: true, recoveryCodesRemaining: 8 },
        isError: false,
        isPending: false,
      }),
    ).toMatchObject({ label: "Enabled", tone: "success" });
    expect(
      twoFactorOverviewStatus({
        data: { enabled: false, recoveryCodesRemaining: 0 },
        isError: false,
        isPending: false,
      }),
    ).toMatchObject({ label: "Disabled", tone: "neutral" });
  });

  it("reports failed queries as unavailable instead of guessing", () => {
    expect(
      passkeyOverviewStatus({ isError: true, isPending: false }),
    ).toMatchObject({ label: "Unavailable" });
    expect(
      twoFactorOverviewStatus({ isError: true, isPending: false }),
    ).toMatchObject({ label: "Unavailable" });
  });
});
