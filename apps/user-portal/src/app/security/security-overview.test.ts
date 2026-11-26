import type { PasskeyResponse } from "@template/api-client/authentication";
import { describe, expect, it } from "vitest";
import {
  PASSWORD_OVERVIEW_STATUS,
  passkeyOverviewStatus,
  securityScore,
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

describe("security score", () => {
  const ready = <T>(data: T) => ({ data, isError: false, isPending: false });
  const enabled = ready({ enabled: true, recoveryCodesRemaining: 8 });
  const disabled = ready({ enabled: false, recoveryCodesRemaining: 0 });

  it("waits for both facts before scoring", () => {
    expect(securityScore({ isError: false, isPending: true }, enabled)).toEqual(
      { state: "loading" },
    );
    expect(
      securityScore(ready([passkey]), { isError: false, isPending: true }),
    ).toEqual({ state: "loading" });
  });

  it("never guesses a score when a fact cannot be loaded", () => {
    expect(securityScore({ isError: true, isPending: false }, enabled)).toEqual(
      { state: "unavailable" },
    );
    expect(
      securityScore(ready([passkey]), { isError: true, isPending: false }),
    ).toEqual({ state: "unavailable" });
  });

  it("counts only the password when nothing else is set up", () => {
    const score = securityScore(ready([]), disabled);
    expect(score).toMatchObject({
      completed: 1,
      level: "Basic protection",
      state: "ready",
      tone: "warning",
      total: 4,
    });
    expect(
      score.state === "ready" && score.steps.map((step) => step.label),
    ).toEqual([
      "Password set",
      "Turn on two-factor authentication",
      "Add a passkey",
      "Add a backup passkey",
    ]);
  });

  it("matches the reference '3 of 4' state with two-factor and one passkey", () => {
    const score = securityScore(ready([passkey]), enabled);
    expect(score).toMatchObject({
      completed: 3,
      level: "Good protection",
      tone: "brand",
    });
    expect(
      score.state === "ready" &&
        score.steps.filter((step) => !step.done).map((step) => step.id),
    ).toEqual(["backup-passkey"]);
  });

  it("reports strong protection once a backup passkey exists", () => {
    const score = securityScore(
      ready([passkey, { ...passkey, id: "credential-2" }]),
      enabled,
    );
    expect(score).toMatchObject({
      completed: 4,
      level: "Strong protection",
      tone: "success",
    });
    expect(score.state === "ready" && score.steps[2]?.label).toBe(
      "2 passkeys registered",
    );
  });

  it("does not claim a strong or recently changed password", () => {
    const score = securityScore(ready([]), disabled);
    const labels =
      score.state === "ready" ? score.steps.map((step) => step.label) : [];
    expect(labels.join(" ")).not.toMatch(/strong|changed/i);
  });
});
