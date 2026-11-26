import { formatMinorUnits } from "@template/ui-core";

/*
 * Typed state for one admin figure (KPI tile, summary row source). A value
 * is either known and formatted, or explicitly loading, unavailable or in
 * error. "Unavailable" means there is no source for the figure; it is never
 * rendered as zero, a dash that could read as zero, or a sample number.
 */

export type AdminTrend = "up" | "down" | "neutral";

/** A change against a previous period; the label must state the direction. */
export type AdminMetricDelta = Readonly<{ label: string; trend: AdminTrend }>;

export type AdminMetric =
  | Readonly<{
      state: "ready";
      /** Already formatted for display, for example "12,480" or "₦18.4M". */
      value: string;
      delta?: AdminMetricDelta;
      /** Secondary context, for example "vs previous 30 days". */
      context?: string;
    }>
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "error"; message: string }>;

const countFormatter = new Intl.NumberFormat("en-US");

/**
 * A count from a backend read. Missing or invalid input becomes
 * `unavailable`, so an absent figure never renders as "0".
 */
export function countMetric(
  value: number | null | undefined,
  unavailableReason = "Not reported by the backend.",
): AdminMetric {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    return { reason: unavailableReason, state: "unavailable" };
  }
  return { state: "ready", value: countFormatter.format(value) };
}

/**
 * A money amount in minor units. Without a reported currency the amount
 * cannot be presented honestly, so the metric is unavailable.
 */
export function moneyMetric(
  amountMinor: number | string | null | undefined,
  currencyCode: string | null | undefined,
): AdminMetric {
  if (amountMinor === null || amountMinor === undefined) {
    return { reason: "Not reported by the backend.", state: "unavailable" };
  }
  if (!currencyCode?.trim()) {
    return { reason: "Currency not reported.", state: "unavailable" };
  }
  return {
    state: "ready",
    value: formatMinorUnits(amountMinor, currencyCode.trim().toUpperCase()),
  };
}
