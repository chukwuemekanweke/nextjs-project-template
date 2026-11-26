import { describe, expect, it } from "vitest";
import {
  canTopUp,
  formatWalletAmount,
  formatWalletDateTime,
  parseTopUpAmount,
  selectedTopUpPreset,
  topUpPresetInputText,
  validateTopUpDraft,
  walletPreviewColumns,
  walletStatusBadge,
  walletTransactionsFromResponse,
} from "./wallet-model";
import {
  fixturePreviewRows,
  fixtureTopUp,
  fixtureTransactionsPage,
} from "./wallet-preview.fixtures";

const utc = { timeZone: "UTC" } as const;
/** Intl separates the currency code with a non-breaking space. */
const nb = (text: string) => text.replace(/ /g, " ");

describe("walletTransactionsFromResponse", () => {
  it("copies only contract fields and never invents status, provider or reference", () => {
    const list = walletTransactionsFromResponse(fixtureTransactionsPage);
    expect(list.hasMore).toBe(true);
    expect(list.transactions).toHaveLength(2);
    for (const row of list.transactions) {
      expect(row.status).toBeUndefined();
      expect(row.providerName).toBeUndefined();
      expect(row.reference).toBeUndefined();
    }
    expect(list.transactions[1]).toMatchObject({
      amount: "500000",
      currencyCode: "NGN",
      transactionTitle: "Top-up",
    });
    expect(walletPreviewColumns(list.transactions)).toEqual({
      provider: false,
      reference: false,
      status: false,
    });
  });

  it("keeps keys unique across pages and stops without a next cursor", () => {
    const next = walletTransactionsFromResponse(
      { ...fixtureTransactionsPage, nextCursor: null },
      2,
    );
    expect(next.hasMore).toBe(false);
    expect(next.transactions.map((row) => row.id)).toEqual([
      "wallet-transaction-2",
      "wallet-transaction-3",
    ]);
  });
});

describe("status presentation", () => {
  it("labels every status in text and never treats unknown as successful", () => {
    expect(walletStatusBadge("successful")).toEqual({
      label: "Successful",
      tone: "success",
    });
    expect(walletStatusBadge("pending")).toEqual({
      label: "Pending",
      tone: "warning",
    });
    expect(walletStatusBadge("failed")).toEqual({
      label: "Failed",
      tone: "danger",
    });
    expect(walletStatusBadge("unknown")).toEqual({
      label: "Unknown",
      tone: "neutral",
    });
  });

  it("offers preview columns only when rows carry them", () => {
    expect(walletPreviewColumns(fixturePreviewRows)).toEqual({
      provider: true,
      reference: true,
      status: true,
    });
    expect(walletPreviewColumns([])).toEqual({
      provider: false,
      reference: false,
      status: false,
    });
  });
});

describe("formatting", () => {
  it("formats minor units with the row currency", () => {
    expect(
      formatWalletAmount({ amountMinorUnits: 2_000_000, currencyCode: "NGN" }),
    ).toBe(nb("NGN 20,000.00"));
    expect(
      formatWalletAmount({ amountMinorUnits: "1050", currencyCode: "USD" }),
    ).toBe("$10.50");
  });

  it("formats valid timestamps and rejects missing or invalid ones", () => {
    expect(formatWalletDateTime("2026-01-24T14:20:00Z", utc)).toBe(
      "Jan 24, 2026, 2:20 PM",
    );
    expect(formatWalletDateTime(undefined)).toBeUndefined();
    expect(formatWalletDateTime("not a date")).toBeUndefined();
  });
});

describe("top-up amount entry", () => {
  const ngn = { currencyCode: "NGN" };

  it("parses grouped major units into minor units exactly", () => {
    expect(parseTopUpAmount("20,000", ngn)).toEqual({
      amountMinorUnits: "2000000",
      ok: true,
    });
    expect(parseTopUpAmount(" 12.5 ", ngn)).toEqual({
      amountMinorUnits: "1250",
      ok: true,
    });
    expect(parseTopUpAmount("0.07", ngn)).toEqual({
      amountMinorUnits: "7",
      ok: true,
    });
    expect(
      parseTopUpAmount("90071992547409.93", ngn, { locale: "en-US" }),
    ).toEqual({ amountMinorUnits: "9007199254740993", ok: true });
  });

  it("rejects empty, malformed, zero, negative and over-precise amounts", () => {
    expect(parseTopUpAmount("", ngn)).toEqual({
      error: "Enter an amount.",
      ok: false,
    });
    for (const value of ["abc", "-5", "1e3", "₦5,000", "5.", ".5"]) {
      expect(parseTopUpAmount(value, ngn), value).toEqual({
        error: "Enter a valid amount, for example 5,000.",
        ok: false,
      });
    }
    expect(parseTopUpAmount("0.00", ngn)).toEqual({
      error: "Enter an amount greater than zero.",
      ok: false,
    });
    expect(parseTopUpAmount("1.234", ngn)).toEqual({
      error: "Use at most 2 decimal places.",
      ok: false,
    });
    expect(parseTopUpAmount("1.5", { currencyCode: "JPY" })).toEqual({
      error: "Enter a whole amount.",
      ok: false,
    });
  });

  it("applies source limits only when supplied", () => {
    expect(parseTopUpAmount("50", fixtureTopUp)).toEqual({
      error: `The minimum top-up is ${nb("NGN 100.00")}.`,
      ok: false,
    });
    expect(parseTopUpAmount("1,000,001", fixtureTopUp)).toEqual({
      error: `The maximum top-up is ${nb("NGN 1,000,000.00")}.`,
      ok: false,
    });
    expect(parseTopUpAmount("50", ngn).ok).toBe(true);
  });

  it("turns presets into input text and recognises the selected preset", () => {
    expect(topUpPresetInputText(500_000, "NGN")).toBe("5000");
    expect(topUpPresetInputText("1250", "NGN")).toBe("12.50");
    expect(selectedTopUpPreset("5,000", fixtureTopUp)).toBe("500000");
    expect(selectedTopUpPreset("5000.00", fixtureTopUp)).toBe("500000");
    expect(selectedTopUpPreset("5001", fixtureTopUp)).toBeUndefined();
    expect(selectedTopUpPreset("", fixtureTopUp)).toBeUndefined();
  });
});

describe("validateTopUpDraft", () => {
  it("returns a topUp intent with the chosen provider", () => {
    expect(
      validateTopUpDraft(
        { amount: "20,000", providerId: "fixture-provider-b" },
        fixtureTopUp,
      ),
    ).toEqual({
      action: {
        amountMinorUnits: "2000000",
        currencyCode: "NGN",
        paymentProviderId: "fixture-provider-b",
        type: "topUp",
      },
      ok: true,
    });
  });

  it("requires a listed provider and a valid amount", () => {
    expect(
      validateTopUpDraft({ amount: "", providerId: "unlisted" }, fixtureTopUp),
    ).toEqual({
      amountError: "Enter an amount.",
      ok: false,
      providerError: "Choose how you want to pay.",
    });
    expect(
      validateTopUpDraft(
        { amount: "5000", providerId: "unlisted" },
        fixtureTopUp,
      ),
    ).toEqual({
      amountError: undefined,
      ok: false,
      providerError: "Choose how you want to pay.",
    });
  });

  it("offers top-up only with a configuration and at least one provider", () => {
    expect(canTopUp(fixtureTopUp)).toBe(true);
    expect(canTopUp({ ...fixtureTopUp, providers: [] })).toBe(false);
    expect(canTopUp({ state: "unavailable" })).toBe(false);
  });
});
