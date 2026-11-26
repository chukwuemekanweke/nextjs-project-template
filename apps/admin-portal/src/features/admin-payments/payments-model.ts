import {
  parseAdminRangePreset,
  type AdminRangePreset,
} from "@/components/admin-patterns";
import type { BadgeTone } from "@template/ui-core";
import type { StatusPresentation } from "../admin-billing-shared/billing-model";
import type { BillingTimelineEvent } from "../admin-billing-shared/billing-sections";

/*
 * Admin payment transactions view model (ADM-PAYMENTS, ADM-PAYMENT-DETAIL).
 *
 * These are local presentation types: there is no admin payments contract
 * in `@template/api-client` (DR-070) and the customer wallet/billing reads
 * are not admin inventories. A future adapter (CAF-FE-014) maps the admin
 * API into these types without inventing values; a field the source does
 * not return stays `null` and renders "Not available", never zero.
 */

/** One payment transaction row (reference payments table). */
export type AdminPaymentRow = Readonly<{
  id: string;
  merchantReference: string;
  providerReference: string | null;
  /** Owner display name, only when the source returns it. */
  ownerDisplayName: string | null;
  ownerId: string | null;
  providerName: string;
  /** Raw intent, for example `SubscriptionPurchase` or `WalletTopUp`. */
  intent: string;
  /** Whole minor currency units. */
  amount: number | string;
  currencyCode: string;
  /** Raw payment status (`Succeeded`, `Failed`, `Initiated`, …). */
  paymentStatus: string;
  createdAtUtc: string;
  completedAtUtc: string | null;
}>;

/**
 * What the backend reports about fulfilling the payment's purpose. It is
 * independent of the payment status: a successful payment is never assumed
 * to be fulfilled.
 */
export type AdminPaymentFulfillment =
  /** The source did not report fulfillment. */
  | Readonly<{ status: "unknown" }>
  /** The intent grants nothing to fulfil (for example a wallet top-up). */
  | Readonly<{ status: "notApplicable" }>
  | Readonly<{ status: "pending" }>
  | Readonly<{ status: "fulfilled"; atUtc?: string | null }>
  | Readonly<{
      status: "blocked";
      atUtc?: string | null;
      reason?: string | null;
    }>
  | Readonly<{ status: "notFulfilled"; reason?: string | null }>;

/** A provider webhook or reconciliation record, exactly as logged. */
export type AdminPaymentProviderEvent = Readonly<{
  id: string;
  event: string;
  /** For example `Webhook` or `Reconciliation`. */
  source: string;
  result: string;
  atUtc: string;
}>;

export type AdminPaymentDetail = AdminPaymentRow &
  Readonly<{
    tenantName: string | null;
    paymentMethodType: string | null;
    fulfillment: AdminPaymentFulfillment;
    /** `null` when the source keeps no status history. */
    statusHistory: readonly BillingTimelineEvent[] | null;
    /** `null` when the source exposes no provider event log. */
    providerEvents: readonly AdminPaymentProviderEvent[] | null;
  }>;

/* ------------------------------------------------------------------------ */
/* Status and intent                                                         */
/* ------------------------------------------------------------------------ */

const PAYMENT_STATUSES: Readonly<Record<string, StatusPresentation>> = {
  Cancelled: { label: "Cancelled", tone: "neutral" },
  Expired: { label: "Expired", tone: "neutral" },
  Failed: { label: "Failed", tone: "danger" },
  Initiated: { label: "Pending", tone: "warning" },
  PendingInitiation: { label: "Pending", tone: "warning" },
  Succeeded: { label: "Successful", tone: "success" },
  Underpaid: { label: "Underpaid", tone: "warning" },
};

/**
 * Raw payment status. Unknown values are shown as returned with a neutral
 * tone; unknown is never presented as successful.
 */
export function describePaymentStatus(status: string): StatusPresentation {
  return PAYMENT_STATUSES[status] ?? { label: status, tone: "neutral" };
}

/** Filterable status values (raw), labelled as in the table. */
export const paymentStatusFilterOptions = [
  { label: "Successful", value: "Succeeded" },
  { label: "Pending", value: "Initiated" },
  { label: "Failed", value: "Failed" },
  { label: "Underpaid", value: "Underpaid" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Expired", value: "Expired" },
] as const;

const PAYMENT_INTENTS: Readonly<Record<string, string>> = {
  SubscriptionPurchase: "Subscription purchase",
  SubscriptionRenewal: "Renewal",
  WalletTopUp: "Wallet top-up",
};

/** Intent label; unknown values are shown as returned. */
export function paymentIntentLabel(intent: string): string {
  return PAYMENT_INTENTS[intent] ?? intent;
}

export const paymentIntentFilterOptions = Object.entries(PAYMENT_INTENTS).map(
  ([value, label]) => ({ label, value }),
);

export function paymentMethodLabel(paymentMethodType: string): string {
  if (paymentMethodType === "PaymentLink") return "Hosted checkout";
  if (paymentMethodType === "BankTransfer") return "Bank transfer";
  if (paymentMethodType === "Card") return "Card";
  return paymentMethodType;
}

export type FulfillmentPresentation = Readonly<{
  title: string;
  description: string;
  variant: "info" | "success" | "warning" | "error";
  tone: BadgeTone;
}>;

/** Fulfillment outcome copy, from the reported fulfillment only. */
export function describeFulfillment(
  fulfillment: AdminPaymentFulfillment,
): FulfillmentPresentation {
  switch (fulfillment.status) {
    case "unknown":
      return {
        description:
          "The backend did not report a fulfillment outcome for this payment.",
        title: "Fulfillment not reported",
        tone: "neutral",
        variant: "info",
      };
    case "notApplicable":
      return {
        description: "This payment does not grant a subscription or access.",
        title: "No fulfillment needed",
        tone: "neutral",
        variant: "info",
      };
    case "pending":
      return {
        description: "Access has not been granted yet.",
        title: "Fulfillment pending",
        tone: "info",
        variant: "info",
      };
    case "fulfilled":
      return {
        description: "The backend recorded this payment as fulfilled.",
        title: "Fulfilled",
        tone: "success",
        variant: "success",
      };
    case "blocked":
      return {
        description:
          fulfillment.reason?.trim() ||
          "Fulfillment is blocked. No reason was recorded.",
        title: "Fulfillment blocked",
        tone: "warning",
        variant: "warning",
      };
    case "notFulfilled":
      return {
        description:
          fulfillment.reason?.trim() ||
          "No access was granted. No reason was recorded.",
        title: "Not fulfilled",
        tone: "danger",
        variant: "error",
      };
  }
}

/* ------------------------------------------------------------------------ */
/* Filters (URL state owned by the future page)                              */
/* ------------------------------------------------------------------------ */

export const PAYMENT_SEARCH_MAX_LENGTH = 100;

/** Search plus the five reference filters; `""` means "Any". */
export type AdminPaymentFilters = Readonly<{
  query: string;
  range: AdminRangePreset;
  provider: string;
  currency: string;
  intent: string;
  status: string;
}>;

export const DEFAULT_PAYMENT_FILTERS: AdminPaymentFilters = {
  currency: "",
  intent: "",
  provider: "",
  query: "",
  range: "30d",
  status: "",
};

const FILTER_PARAMS = {
  currency: "currency",
  intent: "intent",
  provider: "provider",
  query: "q",
  range: "range",
  status: "status",
} as const satisfies Record<keyof AdminPaymentFilters, string>;

type SearchParamsLike = Readonly<{ get(name: string): string | null }>;

function cleanText(value: string | null | undefined): string {
  return (value ?? "").trim().slice(0, PAYMENT_SEARCH_MAX_LENGTH);
}

/**
 * Reads filters from URL search params. Unknown statuses and intents are
 * dropped (not guessed); provider and currency are kept for the API to
 * validate.
 */
export function parsePaymentFilters(
  params: SearchParamsLike,
): AdminPaymentFilters {
  const status = cleanText(params.get(FILTER_PARAMS.status));
  const intent = cleanText(params.get(FILTER_PARAMS.intent));
  return {
    currency: cleanText(params.get(FILTER_PARAMS.currency)).toUpperCase(),
    intent: intent in PAYMENT_INTENTS ? intent : "",
    provider: cleanText(params.get(FILTER_PARAMS.provider)),
    query: cleanText(params.get(FILTER_PARAMS.query)),
    range:
      parseAdminRangePreset(params.get(FILTER_PARAMS.range)) ??
      DEFAULT_PAYMENT_FILTERS.range,
    status: paymentStatusFilterOptions.some((option) => option.value === status)
      ? status
      : "",
  };
}

/** Serialises non-default filters (page resets when filters change). */
export function paymentFiltersToSearchParams(
  filters: AdminPaymentFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of Object.keys(
    FILTER_PARAMS,
  ) as (keyof AdminPaymentFilters)[]) {
    const value = cleanText(filters[key]);
    if (value && value !== DEFAULT_PAYMENT_FILTERS[key]) {
      params.set(FILTER_PARAMS[key], value);
    }
  }
  return params;
}

/** True when any filter narrows the default list (affects empty copy). */
export function hasActivePaymentFilters(filters: AdminPaymentFilters): boolean {
  return paymentFiltersToSearchParams(filters).toString() !== "";
}
