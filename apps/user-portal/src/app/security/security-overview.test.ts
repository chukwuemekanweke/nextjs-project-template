import type { PasskeyResponse } from "@template/api-client/authentication";
import { describe, expect, it } from "vitest";
import {
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

  it("scores nothing when no backend-supported step is done", () => {
    const score = securityScore(ready([]), disabled);
    expect(score).toMatchObject({
      completed: 0,
      level: "Basic protection",
      state: "ready",
      tone: "warning",
      total: 3,
    });
    expect(
      score.state === "ready" && score.steps.map((step) => step.label),
    ).toEqual([
      "Turn on two-factor authentication",
      "Add a passkey",
      "Add a backup passkey",
    ]);
  });

  it("reports fair protection with one step done", () => {
    expect(securityScore(ready([]), enabled)).toMatchObject({
      completed: 1,
      level: "Fair protection",
      tone: "warning",
    });
    expect(securityScore(ready([passkey]), disabled)).toMatchObject({
      completed: 1,
      level: "Fair protection",
    });
  });

  it("reports good protection with two-factor and one passkey (2 of 3)", () => {
    const score = securityScore(ready([passkey]), enabled);
    expect(score).toMatchObject({
      completed: 2,
      level: "Good protection",
      tone: "brand",
      total: 3,
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
      completed: 3,
      level: "Strong protection",
      tone: "success",
      total: 3,
    });
    expect(score.state === "ready" && score.steps[1]?.label).toBe(
      "2 passkeys registered",
    );
  });

  it("never scores the password, which the backend does not report", () => {
    const score = securityScore(ready([]), disabled);
    const ids =
      score.state === "ready" ? score.steps.map((step) => step.id) : [];
    expect(ids).not.toContain("password");
  });

  it("does not claim a strong or recently changed password", () => {
    const score = securityScore(ready([]), disabled);
    const labels =
      score.state === "ready" ? score.steps.map((step) => step.label) : [];
    expect(labels.join(" ")).not.toMatch(/strong|changed/i);
  });
});
