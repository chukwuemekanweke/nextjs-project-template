import { describe, expect, it } from "vitest";
import {
  billingPeriodProgress,
  checkoutNextStepDisclosure,
  formatBillingPeriod,
  paymentProviderDescription,
  purchaseTimeline,
  subscriptionSummary,
} from "./billing-presentation";

const START = "2026-11-01T00:00:00Z";
const END = "2026-12-01T00:00:00Z";

describe("formatBillingPeriod", () => {
  it("joins backend boundaries and omits incomplete periods", () => {
    expect(formatBillingPeriod(START, END, { timeZone: "UTC" })).toBe(
      "Nov 1, 2026 – Dec 1, 2026",
    );
    expect(formatBillingPeriod(START, null)).toBeUndefined();
    expect(formatBillingPeriod("bad", END)).toBeUndefined();
  });
});

describe("billingPeriodProgress", () => {
  it("measures elapsed time and clamps outside the period", () => {
    expect(
      billingPeriodProgress(START, END, Date.parse("2026-11-16T00:00:00Z")),
    ).toEqual({ percent: 50, valueText: "50% of the current period elapsed" });
    expect(
      billingPeriodProgress(START, END, Date.parse("2026-10-01T00:00:00Z"))
        ?.percent,
    ).toBe(0);
    expect(
      billingPeriodProgress(START, END, Date.parse("2027-01-01T00:00:00Z"))
        ?.percent,
    ).toBe(100);
  });

  it("draws nothing for missing or inverted periods", () => {
    expect(billingPeriodProgress(null, END, 0)).toBeUndefined();
    expect(billingPeriodProgress(END, START, 0)).toBeUndefined();
    expect(billingPeriodProgress("bad", END, 0)).toBeUndefined();
  });
});

describe("subscriptionSummary", () => {
  const summary = (...args: Parameters<typeof subscriptionSummary>) =>
    subscriptionSummary(...args).replace(/ /g, " ");
  const base = {
    autoRenew: true,
    billingInterval: "Monthly",
    cancelAtPeriodEnd: false,
    cancellationEffectiveAtUtc: null,
    currencyCode: "NGN",
    currentPeriodEndUtc: "2026-12-14T12:00:00Z",
    nextBillingAtUtc: "2026-12-14T12:00:00Z",
    planPrice: 1500000,
  };

  it("promises renewal only with a backend next billing date", () => {
    expect(summary(base)).toBe(
      "NGN 15,000.00 per month · renews automatically on Dec 14, 2026.",
    );
    expect(summary({ ...base, nextBillingAtUtc: null })).toBe(
      "NGN 15,000.00 per month · renews automatically.",
    );
    expect(summary({ ...base, autoRenew: false })).toBe(
      "NGN 15,000.00 per month · auto-renew is off.",
    );
  });

  it("states the access end for a scheduled cancellation", () => {
    expect(
      summary({
        ...base,
        cancelAtPeriodEnd: true,
        cancellationEffectiveAtUtc: "2026-12-14T12:00:00Z",
      }),
    ).toBe(
      "Auto-renew is off. You keep access until Dec 14, 2026, then the subscription ends.",
    );
    expect(
      summary({
        ...base,
        cancelAtPeriodEnd: true,
        currentPeriodEndUtc: null,
      }),
    ).toBe(
      "Auto-renew is off. You keep access until the end of the current period.",
    );
  });
});

describe("checkout provider wording", () => {
  it("describes providers from their method and recurring capability", () => {
    expect(
      paymentProviderDescription({
        paymentMethodType: "PaymentLink",
        supportsRecurringPayments: true,
      }),
    ).toBe("Hosted checkout · supports auto-renew");
    expect(
      paymentProviderDescription({
        paymentMethodType: "BankTransfer",
        supportsRecurringPayments: false,
      }),
    ).toBe("Bank transfer");
    expect(
      paymentProviderDescription({
        paymentMethodType: "Card",
        supportsRecurringPayments: true,
      }),
    ).toBe("Card is not available in this portal yet");
  });

  it("discloses the next step only for the selected, supported method", () => {
    expect(
      checkoutNextStepDisclosure({
        name: "Bachs",
        paymentMethodType: "PaymentLink",
      }),
    ).toBe("You'll be redirected to Bachs to complete payment securely.");
    expect(
      checkoutNextStepDisclosure({
        name: "SafeHaven",
        paymentMethodType: "BankTransfer",
      }),
    ).toContain("bank transfer details");
    expect(
      checkoutNextStepDisclosure({ name: "Credo", paymentMethodType: "Card" }),
    ).toBeUndefined();
    expect(checkoutNextStepDisclosure(undefined)).toBeUndefined();
  });
});

describe("purchaseTimeline", () => {
  const none = {
    fulfilledAtUtc: null,
    fulfillmentBlockedAtUtc: null,
    paymentCompletedAtUtc: null,
    paymentProviderName: "Bachs",
  };

  it("lists only recorded timestamps, newest first", () => {
    const events = purchaseTimeline(
      {
        ...none,
        fulfilledAtUtc: "2026-11-14T10:02:00Z",
        paymentCompletedAtUtc: "2026-11-14T10:01:00Z",
      },
      { timeZone: "UTC" },
    );
    expect(events.map((event) => event.id)).toEqual(["fulfilled", "paid"]);
    expect(events[1]?.label).toBe("Payment confirmed by Bachs");
    expect(events[0]?.at).toBe("Nov 14, 2026, 10:02 AM");
  });

  it("records blocked activation and ignores invalid or missing values", () => {
    expect(purchaseTimeline(none)).toEqual([]);
    expect(
      purchaseTimeline({
        ...none,
        fulfillmentBlockedAtUtc: "2026-11-14T10:03:00Z",
        paymentCompletedAtUtc: "not-a-date",
      }).map((event) => event.id),
    ).toEqual(["blocked"]);
  });
});
