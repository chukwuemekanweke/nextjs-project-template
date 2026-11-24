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
import { useEffect, useState } from "react";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  describeBillingLoadError,
  describePaymentStatus,
  formatBillingDate,
} from "@/lib/billing-display";
import { abbreviateReference } from "@/lib/billing-view";
import { StatusBadge } from "./billing-ui";
import { CopyIcon, SmallCheckIcon } from "./checkout/checkout-icons";

export function billingHistoryPageHref(
  page: number,
  basePath: string = billingRoutes.overview,
): string {
  return page <= 1
    ? basePath
    : `${basePath}?${new URLSearchParams({ page: String(page) }).toString()}`;
}

/** Backend period boundaries only; never derived from the plan interval. */
export function billingPeriod(item: BillingHistoryItemResponse): string {
  const start = formatBillingDate(item.billingPeriodStartUtc);
  const end = formatBillingDate(item.billingPeriodEndUtc);
  return start && end ? `${start} – ${end}` : "—";
}

/** Copies text, resolving `false` instead of throwing when unavailable. */
export async function copyText(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | undefined = typeof navigator ===
  "undefined"
    ? undefined
    : navigator.clipboard,
): Promise<boolean> {
  if (!clipboard) return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function MerchantReference({ reference }: Readonly<{ reference: string }>) {
  const [feedback, setFeedback] = useState<"copied" | "failed">();

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(undefined), 2_000);
    return () => clearTimeout(timer);
  }, [feedback]);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-xs" title={reference}>
        {abbreviateReference(reference)}
      </span>
      <button
        aria-label={`Copy reference ${reference}`}
        className="hover:text-brand-600 focus-visible:ring-brand-500/40 dark:hover:text-brand-400 rounded-md p-1 text-gray-500 focus-visible:ring-3 focus-visible:outline-none dark:text-gray-400"
        data-reference={reference}
        onClick={() => {
          void copyText(reference).then((copied) =>
            setFeedback(copied ? "copied" : "failed"),
          );
        }}
        type="button"
      >
        {feedback === "copied" ? (
          <SmallCheckIcon className="h-4 w-4 text-emerald-600" />
        ) : (
          <CopyIcon />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {feedback === "copied"
          ? "Reference copied"
          : feedback === "failed"
            ? "Reference could not be copied"
            : ""}
      </span>
    </span>
  );
}

const nowrap = "whitespace-nowrap";

export const billingHistoryColumns: ReadonlyArray<
  TableColumn<BillingHistoryItemResponse>
> = [
  {
    header: "Date",
    className: nowrap,
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
  { header: "Plan", className: nowrap, cell: (item) => item.planName },
  { header: "Billing period", className: nowrap, cell: billingPeriod },
  {
    header: "Amount",
    align: "right",
    className: nowrap,
    cell: (item) => (
      <span className="font-medium text-gray-800 tabular-nums dark:text-white/90">
        {formatMinorUnits(item.amount, item.currencyCode)}
      </span>
    ),
  },
  {
    header: "Status",
    className: nowrap,
    cell: (item) => {
      const status = describePaymentStatus(item.paymentStatus);
      return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>;
    },
  },
  {
    header: "Provider",
    className: nowrap,
    cell: (item) => item.paymentProviderName,
  },
  {
    header: "Reference",
    className: nowrap,
    cell: (item) => <MerchantReference reference={item.merchantReference} />,
  },
];

export function BillingHistoryCard({
  basePath = billingRoutes.overview,
  heading = true,
  page,
}: Readonly<{
  basePath?: string;
  /** Hide the card heading when the page heading already names the table. */
  heading?: boolean;
  page: number;
}>) {
  const ownerType = resolveBillingOwnerType();
  const history = useBillingHistory(ownerType, {
    page,
    pageSize: DEFAULT_BILLING_HISTORY_PAGE_SIZE,
  });
  const totalPages = history.data
    ? Math.max(1, Math.ceil(history.data.totalCount / history.data.pageSize))
    : 1;

  return (
    <Card
      aria-labelledby="billing-history-heading"
      className="min-w-0"
      role="region"
    >
      <CardContent>
        <CardTitle
          className={heading ? "text-xl font-semibold" : "sr-only"}
          id="billing-history-heading"
        >
          Billing history
        </CardTitle>
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
              <div
                aria-busy={history.isPlaceholderData || undefined}
                className={
                  history.isPlaceholderData
                    ? "opacity-60 transition"
                    : undefined
                }
              >
                <DataTable
                  columns={billingHistoryColumns}
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
                  getHref={(target) => billingHistoryPageHref(target, basePath)}
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
