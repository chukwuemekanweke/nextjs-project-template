import type { ActivityRow, MetricSummary } from "./dashboard-overview";

/*
 * PREVIEW ONLY. Typed copies of the reference `UserDashboard` sample content,
 * used by tests to show that the dashboard sections can present the full
 * design (wallet balance, KYC callout, mixed wallet/billing activity) once
 * real sources exist. Production modules must never import this file, use it
 * as a fallback for a failed request, or expose it behind a toggle; a test in
 * `dashboard-sections.test.tsx` enforces the import rule.
 */

export const previewMetrics = {
  activeSessions: {
    detail: "This device + 1 other",
    state: "ready",
    value: "2",
  },
  plan: { detail: "Renews 14 Dec 2026", state: "ready", value: "Standard" },
  security: {
    detail: "Add a backup passkey",
    state: "ready",
    value: "2 of 3",
  },
  wallet: {
    detail: "Updated just now",
    state: "ready",
    value: "₦42,500.00",
  },
} as const satisfies Record<string, MetricSummary>;

export const previewVerificationCallout = {
  actionLabel: "Start verification",
  body: "It takes about 3 minutes with a government ID.",
  title: "Verify your identity to unlock payouts and higher limits.",
} as const;

export const previewActivityRows: readonly ActivityRow[] = [
  {
    amount: "+₦20,000.00",
    date: "Nov 24, 2026",
    description: "Wallet top-up · Bachs",
    id: "preview-1",
    status: { label: "Successful", tone: "success" },
  },
  {
    amount: "₦15,000.00",
    date: "Nov 14, 2026",
    description: "Standard plan · monthly",
    id: "preview-2",
    status: { label: "Paid", tone: "success" },
  },
  {
    amount: "₦10,000.00",
    date: "Nov 2, 2026",
    description: "Wallet top-up · Credo",
    id: "preview-3",
    status: { label: "Failed", tone: "danger" },
  },
];
