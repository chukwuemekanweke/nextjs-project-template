"use client";

import type { BillingHistoryItemResponse } from "@template/api-client/subscriptions";
import {
  DEFAULT_BILLING_HISTORY_PAGE_SIZE,
  useBillingHistory,
} from "@template/api-react/subscriptions";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  DataTable,
  Pagination,
  Skeleton,
  formatMinorUnits,
  type TableColumn,
} from "@template/ui-core";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  describeBillingLoadError,
  describePaymentStatus,
  formatBillingDate,
} from "@/lib/billing-display";
import { StatusBadge } from "./billing-ui";

export function billingHistoryPageHref(page: number): string {
  return page <= 1
    ? billingRoutes.overview
    : `${billingRoutes.overview}?${new URLSearchParams({ page: String(page) }).toString()}`;
}

export function billingPeriod(item: BillingHistoryItemResponse): string {
  const start = formatBillingDate(item.billingPeriodStartUtc);
  const end = formatBillingDate(item.billingPeriodEndUtc);
  return start && end ? `${start} – ${end}` : "—";
}

const columns: ReadonlyArray<TableColumn<BillingHistoryItemResponse>> = [
  {
    header: "Date",
    cell: (item) =>
      item.paidAtUtc ? (
        formatBillingDate(item.paidAtUtc)
      ) : (
        <span>
          {formatBillingDate(item.createdAtUtc)}
          <span className="block text-xs text-gray-400">Not paid</span>
        </span>
      ),
  },
  { header: "Plan", cell: (item) => item.planName },
  { header: "Billing period", cell: billingPeriod },
  {
    header: "Amount",
    cell: (item) => formatMinorUnits(item.amount, item.currencyCode),
    className: "whitespace-nowrap",
  },
  {
    header: "Status",
    cell: (item) => {
      const status = describePaymentStatus(item.paymentStatus);
      return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>;
    },
  },
  { header: "Provider", cell: (item) => item.paymentProviderName },
  {
    header: "Reference",
    cell: (item) => (
      <span className="font-mono text-xs">{item.merchantReference}</span>
    ),
  },
];

export function BillingHistoryCard({ page }: Readonly<{ page: number }>) {
  const ownerType = resolveBillingOwnerType();
  const history = useBillingHistory(ownerType, {
    page,
    pageSize: DEFAULT_BILLING_HISTORY_PAGE_SIZE,
  });
  const totalPages = history.data
    ? Math.max(1, Math.ceil(history.data.totalCount / history.data.pageSize))
    : 1;

  return (
    <Card>
      <CardContent>
        <CardTitle>Billing history</CardTitle>
        <CardDescription>
          Initial purchases and renewal attempts, newest first, including
          payments that did not complete.
        </CardDescription>
        <div className="mt-5 space-y-4">
          {history.isPending ? (
            <div
              aria-busy="true"
              aria-label="Loading billing history"
              className="space-y-3"
              role="status"
            >
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : history.isError && !history.data ? (
            <Alert variant="error">
              {describeBillingLoadError(history.error, "billing history")}
            </Alert>
          ) : (
            <>
              <div aria-busy={history.isPlaceholderData || undefined}>
                <DataTable
                  columns={columns}
                  emptyMessage={
                    history.data.totalCount === 0
                      ? "No billing activity yet."
                      : "No billing activity on this page."
                  }
                  keyField={(item) => item.paymentTransactionId}
                  rows={history.data.items}
                />
              </div>
              {totalPages > 1 ? (
                <Pagination
                  currentPage={Math.min(page, totalPages)}
                  getHref={billingHistoryPageHref}
                  totalPages={totalPages}
                />
              ) : null}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
