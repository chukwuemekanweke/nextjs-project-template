import type {
  GetWalletTransactionsQueryResponse,
  InitiatePaymentMutationRequest,
  WalletTransactionResponse,
} from "@template/api-client/payments";
import {
  currencyMinorUnitDigits,
  formatMinorUnits,
  minorUnitsToDecimalString,
  type BadgeTone,
} from "@template/ui-core";

/*
 * Wallet view model for USR-WALLET and USR-WALLET-TOP-UP.
 *
 * The backend wallet read model is incomplete (DR-059, BE-DS-005): there are
 * no balance/pending/funded aggregates, list rows carry no status, provider
 * or reference, the list has no status/date filters, and top-ups have no
 * eligible-provider list or per-intent return URLs. Nothing in production
 * builds this model yet. A future adapter maps authoritative data into it and
 * marks everything else unavailable; it must never compute balances from
 * transaction pages or invent statuses, providers or references.
 *
 * Amounts are whole minor units (DR-113: the wallet contract does not state
 * its unit; the adapter must confirm it before going live).
 */

/** An authoritative amount in whole minor units with its currency. */
export type WalletAmount = Readonly<{
  amountMinorUnits: number | string;
  currencyCode: string;
}>;

/** One summary tile figure (reference `.stat`). */
export type WalletFigure =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error" }>
  /** The source cannot provide this figure; never computed client-side. */
  | Readonly<{ state: "unavailable" }>
  | Readonly<{
      amount: WalletAmount;
      /** Supporting text supplied by the source, for example a count. */
      detail?: string;
      state: "ready";
    }>;

/** Reference summary tiles. */
export type WalletSummary = Readonly<{
  available: WalletFigure;
  fundedThisMonth: WalletFigure;
  pending: WalletFigure;
}>;

export type WalletTransactionStatus =
  "successful" | "pending" | "failed" | "unknown";

/**
 * Row fields drawn in the reference that `WalletTransactionResponse` does not
 * return (DR-059). PREVIEW-ONLY until the wallet read model provides them;
 * the adapter leaves them undefined and the table then omits the columns.
 */
export type WalletTransactionPreviewFields = Readonly<{
  providerName?: string;
  reference?: string;
  status?: WalletTransactionStatus;
}>;

/** One list row: the wire contract plus a client key and preview fields. */
export type WalletTransaction = Readonly<
  WalletTransactionResponse &
    WalletTransactionPreviewFields & {
      /** Client key; the wire row has no identifier. */
      id: string;
    }
>;

export type WalletTransactionList =
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "error" }>
  | Readonly<{
      /** True when the source returned a next cursor. */
      hasMore: boolean;
      state: "ready";
      transactions: readonly WalletTransaction[];
    }>;

/** Reference segmented filter ("All / Successful / Pending / Failed"). */
export type WalletStatusFilter = "all" | "successful" | "pending" | "failed";

export type WalletFilters =
  /** The list endpoint has no status/date filters (DR-059). */
  | Readonly<{ state: "unavailable" }>
  | Readonly<{ state: "ready"; status: WalletStatusFilter }>;

/** A payment provider eligible for top-ups, supplied by the source. */
export type WalletTopUpProvider = Readonly<{
  /** Short method summary, for example "card or transfer". */
  description?: string;
  id: InitiatePaymentMutationRequest["paymentProviderId"];
  name: string;
}>;

export type WalletTopUpConfig =
  /** No eligible-provider list or top-up return handling yet (DR-059). */
  | Readonly<{ state: "unavailable" }>
  | Readonly<{
      currencyCode: string;
      /** Inclusive limits in minor units, only when the source has them. */
      maximumMinorUnits?: number | string;
      minimumMinorUnits?: number | string;
      /** Preset amounts in minor units (product configuration). */
      presetsMinorUnits: readonly (number | string)[];
      providers: readonly WalletTopUpProvider[];
      state: "ready";
    }>;

/** Everything the wallet screen renders. */
export type WalletScreenModel = Readonly<{
  filters: WalletFilters;
  summary: WalletSummary;
  topUp: WalletTopUpConfig;
  transactions: WalletTransactionList;
}>;

/**
 * Presentation intents. The screen only reports what the user chose;
 * initiating a payment, redirecting, filtering and paging are the adapter's
 * job. `topUp` is the input to a future `initiatePayment` call (the adapter
 * resolves `currencyId` and `paymentIntent`).
 */
export type WalletAction =
  | Readonly<{
      amountMinorUnits: string;
      currencyCode: string;
      paymentProviderId: InitiatePaymentMutationRequest["paymentProviderId"];
      type: "topUp";
    }>
  | Readonly<{ status: WalletStatusFilter; type: "filterStatus" }>
  | Readonly<{ type: "chooseDateRange" }>
  | Readonly<{ type: "loadMore" }>
  | Readonly<{ section: "summary" | "transactions"; type: "reload" }>;

export type WalletActionType = WalletAction["type"];

/** Text shown when top-up has no handler or no configuration. */
export const TOP_UP_UNAVAILABLE_DESCRIPTION =
  "Wallet top-ups are not available yet.";

/** Text shown when filtering has no handler or no source support. */
export const FILTERS_UNAVAILABLE_DESCRIPTION =
  "Filtering by status or date is not available yet.";

/** Whether the top-up action can be offered. */
export function canTopUp(
  topUp: WalletTopUpConfig,
): topUp is Extract<WalletTopUpConfig, { state: "ready" }> {
  return topUp.state === "ready" && topUp.providers.length > 0;
}

/* ------------------------------------------------------------------------ */
/* Wire mapping                                                              */
/* ------------------------------------------------------------------------ */

/**
 * Maps one `getWalletTransactions` page to list rows. Only contract fields
 * are copied; preview fields stay undefined. `offset` keeps keys unique
 * across appended pages.
 */
export function walletTransactionsFromResponse(
  page: GetWalletTransactionsQueryResponse,
  offset = 0,
): Extract<WalletTransactionList, { state: "ready" }> {
  return {
    hasMore: page.nextCursor !== null && page.nextCursor !== "",
    state: "ready",
    transactions: page.transactions.map((row, index) => ({
      amount: row.amount,
      currencyCode: row.currencyCode,
      id: `wallet-transaction-${offset + index}`,
      timestamp: row.timestamp,
      transactionCategory: row.transactionCategory,
      transactionTitle: row.transactionTitle,
      transactionType: row.transactionType,
    })),
  };
}

/* ------------------------------------------------------------------------ */
/* Status and filters                                                        */
/* ------------------------------------------------------------------------ */

const statusLabels: Record<WalletTransactionStatus, string> = {
  failed: "Failed",
  pending: "Pending",
  successful: "Successful",
  unknown: "Unknown",
};

const statusTones: Record<WalletTransactionStatus, BadgeTone> = {
  failed: "danger",
  pending: "warning",
  successful: "success",
  unknown: "neutral",
};

/** Badge text and tone for a row status; the text always carries meaning. */
export function walletStatusBadge(status: WalletTransactionStatus): {
  label: string;
  tone: BadgeTone;
} {
  return { label: statusLabels[status], tone: statusTones[status] };
}

export const walletStatusFilterOptions: readonly Readonly<{
  label: string;
  value: WalletStatusFilter;
}>[] = [
  { label: "All", value: "all" },
  { label: "Successful", value: "successful" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

/** Which optional reference columns the current rows can fill. */
export function walletPreviewColumns(
  transactions: readonly WalletTransaction[],
): Readonly<{ provider: boolean; reference: boolean; status: boolean }> {
  return {
    provider: transactions.some((row) => row.providerName !== undefined),
    reference: transactions.some((row) => row.reference !== undefined),
    status: transactions.some((row) => row.status !== undefined),
  };
}

/* ------------------------------------------------------------------------ */
/* Formatting                                                                */
/* ------------------------------------------------------------------------ */

const DISPLAY_LOCALE = "en-US";

/** Display options shared by every date and amount on the screen. */
export type WalletDisplayOptions = Readonly<{
  locale?: string;
  timeZone?: string;
}>;

export function formatWalletAmount(
  amount: WalletAmount,
  { locale = DISPLAY_LOCALE }: WalletDisplayOptions = {},
): string {
  return formatMinorUnits(amount.amountMinorUnits, amount.currencyCode, {
    locale,
  });
}

/**
 * Formats a source timestamp, or `undefined` when it is missing or invalid.
 * Never substitutes the current time.
 */
export function formatWalletDateTime(
  value: string | undefined,
  { locale = DISPLAY_LOCALE, timeZone }: WalletDisplayOptions = {},
): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(timestamp);
}

/* ------------------------------------------------------------------------ */
/* Top-up amount entry                                                       */
/* ------------------------------------------------------------------------ */

/** Minor-unit digits for a currency (2 when `Intl` does not know it). */
function minorDigits(currencyCode: string): number {
  return currencyMinorUnitDigits(currencyCode) ?? 2;
}

function compareMinorUnits(left: string, right: string): number {
  const a = BigInt(left);
  const b = BigInt(right);
  return a === b ? 0 : a < b ? -1 : 1;
}

/**
 * Input text for a preset amount: the major-unit value without grouping and
 * without a zero fraction ("5000", "12.50").
 */
export function topUpPresetInputText(
  minorUnits: number | string,
  currencyCode: string,
): string {
  const decimal = minorUnitsToDecimalString(
    minorUnits,
    minorDigits(currencyCode),
  );
  if (decimal === undefined) return "";
  return decimal.replace(/\.0+$/, "");
}

const AMOUNT_PATTERN = /^\d+(?:\.\d+)?$/;

export type TopUpAmountResult =
  | Readonly<{ amountMinorUnits: string; ok: true }>
  | Readonly<{ error: string; ok: false }>;

/**
 * Parses the typed major-unit amount ("20,000", "20000.5") into whole minor
 * units with string arithmetic, then checks it against the source limits.
 * Grouping commas and spaces are ignored; signs and other symbols are not
 * accepted.
 */
export function parseTopUpAmount(
  text: string,
  config: Pick<
    Extract<WalletTopUpConfig, { state: "ready" }>,
    "currencyCode" | "maximumMinorUnits" | "minimumMinorUnits"
  >,
  { locale = DISPLAY_LOCALE }: WalletDisplayOptions = {},
): TopUpAmountResult {
  const normalized = text.replace(/[\s,]/g, "");
  if (!normalized) return { error: "Enter an amount.", ok: false };
  if (!AMOUNT_PATTERN.test(normalized)) {
    return { error: "Enter a valid amount, for example 5,000.", ok: false };
  }
  const digits = minorDigits(config.currencyCode);
  const [whole = "0", fraction = ""] = normalized.split(".");
  if (fraction.length > digits) {
    return {
      error:
        digits === 0
          ? "Enter a whole amount."
          : `Use at most ${digits} decimal places.`,
      ok: false,
    };
  }
  const minor = BigInt(`${whole}${fraction.padEnd(digits, "0")}`).toString();
  if (minor === "0") {
    return { error: "Enter an amount greater than zero.", ok: false };
  }
  const limit = (value: number | string) =>
    formatMinorUnits(value, config.currencyCode, { locale });
  if (
    config.minimumMinorUnits !== undefined &&
    compareMinorUnits(minor, String(config.minimumMinorUnits)) < 0
  ) {
    return {
      error: `The minimum top-up is ${limit(config.minimumMinorUnits)}.`,
      ok: false,
    };
  }
  if (
    config.maximumMinorUnits !== undefined &&
    compareMinorUnits(minor, String(config.maximumMinorUnits)) > 0
  ) {
    return {
      error: `The maximum top-up is ${limit(config.maximumMinorUnits)}.`,
      ok: false,
    };
  }
  return { amountMinorUnits: minor, ok: true };
}

export type TopUpDraft = Readonly<{ amount: string; providerId: string }>;

export type TopUpDraftResult =
  | Readonly<{ action: Extract<WalletAction, { type: "topUp" }>; ok: true }>
  | Readonly<{ amountError?: string; ok: false; providerError?: string }>;

/** Validates the dialog draft into a `topUp` intent. */
export function validateTopUpDraft(
  draft: TopUpDraft,
  config: Extract<WalletTopUpConfig, { state: "ready" }>,
  options: WalletDisplayOptions = {},
): TopUpDraftResult {
  const amount = parseTopUpAmount(draft.amount, config, options);
  const provider = config.providers.find(({ id }) => id === draft.providerId);
  if (!amount.ok || !provider) {
    return {
      amountError: amount.ok ? undefined : amount.error,
      ok: false,
      providerError: provider ? undefined : "Choose how you want to pay.",
    };
  }
  return {
    action: {
      amountMinorUnits: amount.amountMinorUnits,
      currencyCode: config.currencyCode,
      paymentProviderId: provider.id,
      type: "topUp",
    },
    ok: true,
  };
}

/** The preset matching the typed amount, if any (for `aria-pressed`). */
export function selectedTopUpPreset(
  text: string,
  config: Extract<WalletTopUpConfig, { state: "ready" }>,
): string | undefined {
  const parsed = parseTopUpAmount(text, {
    currencyCode: config.currencyCode,
  });
  if (!parsed.ok) return undefined;
  return config.presetsMinorUnits
    .map(String)
    .find((preset) => compareMinorUnits(preset, parsed.amountMinorUnits) === 0);
}
