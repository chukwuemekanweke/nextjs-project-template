import type {
  ActiveSessionResponse,
  PasskeyResponse,
} from "@template/api-client/authentication";
import type {
  BillingHistoryItemResponse,
  GetCurrentSubscriptionQueryResponse,
} from "@template/api-client/subscriptions";
import { describe, expect, it } from "vitest";
import {
  billingActivityRows,
  greetingName,
  securityChecklist,
  summarizePlan,
  summarizeSecurity,
  summarizeSessions,
} from "./dashboard-overview";

const ready = <T>(data: T) => ({ data, isError: false, isPending: false });
const loading = { isError: false, isPending: true } as const;
const failed = { error: new Error("boom"), isError: true, isPending: false };

const subscription = (
  overrides: Partial<GetCurrentSubscriptionQueryResponse> = {},
): GetCurrentSubscriptionQueryResponse => ({
  autoRenew: true,
  billingAccountId: "ba-1",
  billingInterval: "Monthly",
  cancelAtPeriodEnd: false,
  cancellationEffectiveAtUtc: null,
  cancellationRequestedAtUtc: null,
  currencyCode: "NGN",
  currencyId: "c-1",
  currentPeriodEndUtc: "2026-12-14T00:00:00Z",
  currentPeriodStartUtc: "2026-11-14T00:00:00Z",
  id: "s-1",
  lifecycleStatus: "Active",
  nextBillingAtUtc: "2026-12-14T12:00:00Z",
  planCode: "standard",
  planId: "p-1",
  planName: "Pro",
  planPrice: 150000,
  status: "Active",
  ...overrides,
});

const passkey = (id: string): PasskeyResponse => ({
  createdAtUtc: "2026-11-20T00:00:00Z",
  id,
  isBackedUp: false,
  isBackupEligible: false,
  name: `Key ${id}`,
  transports: [],
});

const session = (isCurrent: boolean, id: string): ActiveSessionResponse => ({
  browserName: "Chrome",
  city: null,
  country: null,
  createdAtUtc: "2026-11-20T00:00:00Z",
  deviceName: null,
  devicePlatform: null,
  expiresAtUtc: "2026-12-20T00:00:00Z",
  firstIpAddress: "203.0.113.1",
  isCurrent,
  lastActiveAtUtc: "2026-11-26T00:00:00Z",
  lastIpAddress: "203.0.113.1",
  sessionId: id,
  state: null,
  userAgent: "test",
});

describe("summarizePlan", () => {
  it("is loading until the backend answers, and unavailable on failure", () => {
    expect(summarizePlan(loading)).toEqual({ state: "loading" });
    expect(summarizePlan(failed)).toEqual({
      detail: "Plan details could not be loaded.",
      state: "unavailable",
    });
  });

  it("reports no plan only for the backend's 404 (null)", () => {
    expect(summarizePlan(ready(null))).toEqual({
      detail: "Choose a plan in Billing.",
      state: "ready",
      value: "No plan",
    });
  });

  it("shows the backend plan name and renewal date", () => {
    expect(summarizePlan(ready(subscription()))).toEqual({
      detail: "Renews Dec 14, 2026",
      state: "ready",
      value: "Pro",
    });
  });

  it("describes cancelling, past-due and pending plans without inventing dates", () => {
    expect(
      summarizePlan(
        ready(
          subscription({
            cancelAtPeriodEnd: true,
            cancellationEffectiveAtUtc: "2026-12-14T00:00:00Z",
          }),
        ),
      ),
    ).toMatchObject({ detail: "Ends Dec 14, 2026" });
    expect(
      summarizePlan(ready(subscription({ lifecycleStatus: "PastDue" }))),
    ).toMatchObject({ detail: "Past due" });
    expect(
      summarizePlan(ready(subscription({ lifecycleStatus: "Pending" }))),
    ).toMatchObject({ detail: "Awaiting payment confirmation.", value: "Pro" });
    expect(
      summarizePlan(ready(subscription({ nextBillingAtUtc: null }))),
    ).toMatchObject({ detail: "Active" });
  });
});

describe("security checklist and score", () => {
  it("scores only backend-reported protections", () => {
    const items = securityChecklist({
      passkeys: ready([passkey("a")]),
      twoFactor: ready({ enabled: true, recoveryCodesRemaining: 8 }),
    });

    expect(items.map(({ id, status }) => [id, status])).toEqual([
      ["two-factor", "done"],
      ["passkey", "done"],
      ["backup-passkey", "todo"],
    ]);
    expect(items[0]?.description).toBe(
      "Authenticator app · 8 recovery codes left",
    );
    expect(items[1]?.description).toBe("1 passkey registered");
    expect(summarizeSecurity(items)).toEqual({
      detail: "Add a backup passkey",
      state: "ready",
      value: "2 of 3",
    });
  });

  it("recommends the first missing step and reports completion", () => {
    const none = securityChecklist({
      passkeys: ready([]),
      twoFactor: ready({ enabled: false, recoveryCodesRemaining: 0 }),
    });
    expect(summarizeSecurity(none)).toEqual({
      detail: "Turn on two-factor authentication",
      state: "ready",
      value: "0 of 3",
    });

    const all = securityChecklist({
      passkeys: ready([passkey("a"), passkey("b")]),
      twoFactor: ready({ enabled: true, recoveryCodesRemaining: 1 }),
    });
    expect(all[0]?.description).toBe(
      "Authenticator app · 1 recovery code left",
    );
    expect(summarizeSecurity(all)).toEqual({
      detail: "All recommended steps done",
      state: "ready",
      value: "3 of 3",
    });
  });

  it("never claims a status while loading or after a failure", () => {
    const pending = securityChecklist({
      passkeys: loading,
      twoFactor: ready({ enabled: true, recoveryCodesRemaining: 8 }),
    });
    expect(pending.map(({ status }) => status)).toEqual([
      "done",
      "loading",
      "loading",
    ]);
    expect(summarizeSecurity(pending)).toEqual({ state: "loading" });

    const broken = securityChecklist({
      passkeys: ready([]),
      twoFactor: failed,
    });
    expect(broken[0]).toMatchObject({
      description: "Status could not be loaded.",
      status: "unavailable",
    });
    expect(summarizeSecurity(broken)).toEqual({
      detail: "Security status could not be loaded.",
      state: "unavailable",
    });
  });
});

describe("summarizeSessions", () => {
  it("counts sessions and identifies this device", () => {
    expect(
      summarizeSessions(ready([session(true, "a"), session(false, "b")])),
    ).toEqual({ detail: "This device + 1 other", state: "ready", value: "2" });
    expect(summarizeSessions(ready([session(true, "a")]))).toMatchObject({
      detail: "This device only",
      value: "1",
    });
    expect(
      summarizeSessions(ready([session(false, "a"), session(false, "b")])),
    ).toMatchObject({ detail: "2 signed-in devices", value: "2" });
  });

  it("is loading or unavailable instead of showing a count", () => {
    expect(summarizeSessions(loading)).toEqual({ state: "loading" });
    expect(summarizeSessions(failed)).toEqual({
      detail: "Sessions could not be loaded.",
      state: "unavailable",
    });
  });
});

describe("billingActivityRows", () => {
  const item = (
    id: string,
    overrides: Partial<BillingHistoryItemResponse> = {},
  ): BillingHistoryItemResponse => ({
    amount: 1500000,
    billingPeriodEndUtc: null,
    billingPeriodStartUtc: null,
    createdAtUtc: "2026-11-10T00:00:00Z",
    currencyCode: "NGN",
    merchantReference: `ref-${id}`,
    paidAtUtc: "2026-11-14T00:00:00Z",
    paymentProviderName: "Bachs",
    paymentStatus: "Succeeded",
    paymentTransactionId: id,
    planCode: "standard",
    planName: "Standard",
    subscriptionId: "s-1",
    ...overrides,
  });

  it("maps backend billing history only, newest first as returned", () => {
    const rows = billingActivityRows([
      item("t1"),
      item("t2", { paidAtUtc: null, paymentStatus: "Failed" }),
    ]);

    expect(rows[0]).toMatchObject({
      date: "Nov 14, 2026",
      description: "Standard · Bachs",
      id: "t1",
      status: { label: "Succeeded", tone: "success" },
    });
    expect(rows[0]?.amount).toContain("15,000.00");
    expect(rows[1]).toMatchObject({ date: "Nov 10, 2026", id: "t2" });
  });

  it("limits the dashboard to the latest five rows", () => {
    const items = Array.from({ length: 8 }, (_, index) => item(`t${index}`));
    expect(billingActivityRows(items)).toHaveLength(5);
  });
});

describe("greetingName", () => {
  it("prefers the first name and falls back to the display name", () => {
    expect(greetingName({ firstName: " Grace " }, "Grace Hopper")).toBe(
      "Grace",
    );
    expect(greetingName({ firstName: "" }, "grace@example.com")).toBe(
      "grace@example.com",
    );
  });
});
