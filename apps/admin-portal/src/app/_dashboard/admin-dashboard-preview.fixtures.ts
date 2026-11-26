import type { AdminDashboardData } from "./admin-dashboard-data";

/*
 * PREVIEW ONLY. Typed copies of the reference `AdminDashboard` sample
 * content (design ad9386e), used by tests to show the composition can
 * present the full design once admin APIs exist. The figures, providers and
 * dates are illustrative, not facts. Production modules must never import
 * this file, use it as a fallback or expose it behind a toggle; a test in
 * `admin-dashboard.test.tsx` enforces the import rule.
 */

const days = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 9, 27 + index));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
});

const weeks = ["27 Oct", "3 Nov", "10 Nov", "17 Nov", "24 Nov"];

export const previewAdminDashboard: AdminDashboardData = {
  kpis: {
    dailyActiveUsers: {
      context: "DAU/MAU 31%",
      delta: { label: "+2.1%", trend: "up" },
      state: "ready",
      value: "1,912",
    },
    paymentVolume: {
      context: "96.1% success rate",
      delta: { label: "+9.8%", trend: "up" },
      state: "ready",
      value: "₦18.4M",
    },
    recurringRevenue: {
      context: "1,204 active subscriptions",
      delta: { label: "+3.4%", trend: "up" },
      state: "ready",
      value: "₦6.2M",
    },
    totalUsers: {
      context: "vs previous 30 days",
      delta: { label: "+4.2%", trend: "up" },
      state: "ready",
      value: "12,480",
    },
  },
  kycQueue: {
    rows: [
      { id: "pending", label: "Pending", value: "14" },
      { id: "in-progress", label: "In progress", value: "38" },
      { id: "rejected", label: "Rejected (7d)", value: "9" },
    ],
    state: "ready",
  },
  paymentProviders: {
    rows: [
      {
        display: "badge",
        id: "bachs",
        label: "Bachs",
        tone: "success",
        value: "Active",
      },
      {
        display: "badge",
        id: "credo",
        label: "Credo",
        tone: "success",
        value: "Active",
      },
      {
        display: "badge",
        id: "safehaven",
        label: "SafeHaven",
        tone: "neutral",
        value: "Inactive",
      },
    ],
    state: "ready",
  },
  payments: {
    categories: weeks,
    series: [
      {
        label: "Successful",
        series: 1,
        values: [3120, 3480, 3610, 3890, 4210],
      },
      // A missing week shows as a gap, not zero.
      { label: "Failed", series: 2, values: [140, 162, null, 151, 170] },
    ],
    state: "ready",
    summary:
      "Weekly payments in thousands of naira, 27 Oct to 24 Nov 2026 (UTC): successful payments rose from 3,120 to 4,210; failed payments stayed between 140 and 170; one week of failures was not reported.",
  },
  period: {
    preset: "30d",
    range: { end: "2026-11-25", start: "2026-10-27" },
  },
  registrations: {
    categories: days,
    series: [
      {
        label: "Registrations",
        series: 1,
        values: days.map((_, index) => 280 + ((index * 37) % 120)),
      },
    ],
    state: "ready",
    summary:
      "Daily registrations, 27 Oct to 25 Nov 2026 (UTC), ranging between 280 and 399 a day.",
  },
  subscriptionsNeedingAttention: {
    rows: [
      { id: "past-due", label: "Past due", tone: "danger", value: "23" },
      { id: "cancelling", label: "Cancel at period end", value: "41" },
      { id: "failed", label: "Failed renewals (7d)", value: "12" },
    ],
    state: "ready",
  },
};
