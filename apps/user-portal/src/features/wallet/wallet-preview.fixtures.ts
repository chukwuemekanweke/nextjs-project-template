import type { GetWalletTransactionsQueryResponse } from "@template/api-client/payments";
import type {
  WalletFigure,
  WalletScreenModel,
  WalletSummary,
  WalletTopUpConfig,
  WalletTransaction,
} from "./wallet-model";

/*
 * PREVIEW ONLY. Typed, deterministic fixtures for the reference `UserWallet*`
 * and `UserWalletTopUp*` artboards, used by tests (the isolated harness for
 * this screen). Fixed timestamps and amounts; no random or current-time data.
 * Fields the backend cannot provide (summary figures, row status, provider,
 * reference, filters, provider list) exist only here. Production modules must
 * never import this file, use it as a fallback for a failed request, or
 * expose it behind a toggle; `wallet-screen.test.tsx` enforces the import
 * rule.
 */

export const FIXTURE_CURRENCY = "NGN";

/** A wire page exactly as `getWalletTransactions` returns it. */
export const fixtureTransactionsPage: GetWalletTransactionsQueryResponse = {
  nextCursor: "FIXTURE-CURSOR-2",
  transactions: [
    {
      amount: 2_000_000,
      currencyCode: FIXTURE_CURRENCY,
      timestamp: "2026-01-24T14:20:00Z",
      transactionCategory: "Wallet funding",
      transactionTitle: "Top-up",
      transactionType: "Credit",
    },
    {
      amount: "500000",
      currencyCode: FIXTURE_CURRENCY,
      timestamp: "2026-01-12T09:03:00Z",
      transactionCategory: "Wallet funding",
      transactionTitle: "Top-up",
      transactionType: "Credit",
    },
  ],
};

function fixtureRow(
  index: number,
  overrides: Partial<WalletTransaction> = {},
): WalletTransaction {
  const day = String(24 - index * 4).padStart(2, "0");
  return {
    amount: (index + 1) * 500_000,
    currencyCode: FIXTURE_CURRENCY,
    id: `WTX-FIXTURE-${index}`,
    timestamp: `2026-01-${day}T10:00:00Z`,
    transactionCategory: "Wallet funding",
    transactionTitle: "Top-up",
    transactionType: "Credit",
    ...overrides,
  };
}

/** Rows with the reference preview fields, one per status (incl. unknown). */
export const fixturePreviewRows: readonly WalletTransaction[] = [
  fixtureRow(0, {
    providerName: "FIXTURE Provider A",
    reference: "WTX-FIXTURE-0001",
    status: "successful",
  }),
  fixtureRow(1, {
    providerName: "FIXTURE Provider B",
    reference: "WTX-FIXTURE-0002",
    status: "pending",
  }),
  fixtureRow(2, {
    providerName: "FIXTURE Provider B",
    reference: "WTX-FIXTURE-0003",
    status: "failed",
  }),
  fixtureRow(3, { status: "unknown" }),
];

const readyFigure = (
  amountMinorUnits: number,
  detail?: string,
): WalletFigure => ({
  amount: { amountMinorUnits, currencyCode: FIXTURE_CURRENCY },
  detail,
  state: "ready",
});

/** Summary figures as the reference draws them (preview only). */
export const fixturePreviewSummary: WalletSummary = {
  available: readyFigure(4_250_000, "NGN wallet"),
  fundedThisMonth: readyFigure(2_500_000, "2 successful top-ups"),
  pending: readyFigure(500_000, "1 top-up awaiting confirmation"),
};

/** What the backend can support today: every figure unavailable. */
export const unavailableSummary: WalletSummary = {
  available: { state: "unavailable" },
  fundedThisMonth: { state: "unavailable" },
  pending: { state: "unavailable" },
};

export const fixtureTopUp: Extract<WalletTopUpConfig, { state: "ready" }> = {
  currencyCode: FIXTURE_CURRENCY,
  maximumMinorUnits: 100_000_000,
  minimumMinorUnits: 10_000,
  presetsMinorUnits: [500_000, 1_000_000, 2_000_000, 5_000_000],
  providers: [
    {
      description: "card or transfer",
      id: "fixture-provider-a",
      name: "FIXTURE Provider A",
    },
    { id: "fixture-provider-b", name: "FIXTURE Provider B" },
  ],
  state: "ready",
};

/** The full reference composition (every preview field supplied). */
export const fixturePreviewScreen: WalletScreenModel = {
  filters: { state: "ready", status: "all" },
  summary: fixturePreviewSummary,
  topUp: fixtureTopUp,
  transactions: {
    hasMore: false,
    state: "ready",
    transactions: fixturePreviewRows,
  },
};

/**
 * What a live adapter could render today from `getWalletTransactions` alone:
 * contract rows, no summary, filters or top-up configuration.
 */
export function fixtureContractOnlyScreen(
  transactions: WalletScreenModel["transactions"],
): WalletScreenModel {
  return {
    filters: { state: "unavailable" },
    summary: unavailableSummary,
    topUp: { state: "unavailable" },
    transactions,
  };
}
