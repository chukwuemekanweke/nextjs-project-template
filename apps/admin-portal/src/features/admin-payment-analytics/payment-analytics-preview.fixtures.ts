import { countMetric, moneyMetric } from "@/components/admin-patterns";
import type { PaymentAnalyticsModel } from "./payment-analytics-model";

export const paymentAnalyticsPreview: PaymentAnalyticsModel = {
  intents: [
    {
      amountMinor: 8_400_000,
      count: 32,
      currencyCode: "NGN",
      id: "subscriptions",
      label: "Subscription purchase",
      successRate: "93.8%",
    },
  ],
  metrics: [
    {
      id: "volume",
      label: "Payment volume",
      metric: moneyMetric(12_540_000, "NGN"),
    },
    { id: "transactions", label: "Transactions", metric: countMetric(48) },
    { id: "successful", label: "Successful", metric: countMetric(44) },
    {
      id: "success-rate",
      label: "Success rate",
      metric: { state: "ready", value: "91.7%" },
    },
  ],
  providers: [
    {
      amountMinor: 7_900_000,
      count: 29,
      currencyCode: "NGN",
      id: "fixture-pay",
      label: "FixturePay",
      successRate: "93.1%",
    },
  ],
  reportingRange: { end: "2026-11-25", start: "2026-10-27" },
  statusBreakdown: {
    categories: ["Successful", "Failed", "Pending"],
    series: [{ label: "Transactions", series: 1, values: [44, 3, 1] }],
    state: "ready",
    summary: "44 successful, 3 failed and 1 pending payment.",
  },
  volumeTrend: {
    categories: ["21 Nov", "22 Nov", "23 Nov", "24 Nov", "25 Nov"],
    series: [
      {
        label: "Volume",
        series: 1,
        values: [2_100_000, 1_940_000, 2_500_000, 2_800_000, 3_200_000],
      },
    ],
    state: "ready",
    summary: "Payment volume increased over the five reported days.",
  },
};
