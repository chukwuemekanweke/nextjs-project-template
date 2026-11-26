"use client";

import type { BillingHistoryItemResponse } from "@template/api-client/subscriptions";
import {
  DEFAULT_BILLING_HISTORY_PAGE_SIZE,
  useBillingHistory,
} from "@template/api-react/subscriptions";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckIcon,
  CopyIcon,
  DataTable,
  ErrorState,
  Pager,
  Skeleton,
  formatMinorUnits,
  type TableColumn,
} from "@template/ui-core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  describeBillingLoadError,
  describePaymentStatus,
  formatBillingDate,
} from "@/lib/billing-display";
import { formatBillingPeriod } from "@/lib/billing-presentation";
import { abbreviateReference } from "@/lib/billing-view";
import { StatusBadge } from "./billing-ui";

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
  return (
    formatBillingPeriod(item.billingPeriodStartUtc, item.billingPeriodEndUtc) ??
    "—"
  );
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
        className="text-fg-subtle hover:text-brand-ink focus-visible:outline-focus rounded-sm p-1 focus-visible:outline-2"
        data-reference={reference}
        onClick={() => {
          void copyText(reference).then((copied) =>
            setFeedback(copied ? "copied" : "failed"),
          );
        }}
        type="button"
      >
        {feedback === "copied" ? (
          <CheckIcon className="text-success" size="xs" />
        ) : (
          <CopyIcon size="xs" />
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
          <span className="text-caption text-fg-subtle block">Not paid</span>
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
      <span className="text-fg font-medium tabular-nums">
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
  /** Hide the card title when the page heading already names the table. */
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
  const totalCount = history.data?.totalCount;

  return (
    <Card
      aria-labelledby="billing-history-heading"
      className="min-w-0 overflow-hidden"
      role="region"
    >
      <CardHeader>
        <div className="min-w-0">
          <CardTitle
            as="h3"
            className={heading ? undefined : "sr-only"}
            id="billing-history-heading"
          >
            Billing history
          </CardTitle>
          <CardDescription>
            Initial purchases and renewal attempts, newest first, including
            payments that did not complete.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {totalCount !== undefined && totalCount > 0 ? (
            <span className="text-small text-fg-muted" data-record-count="">
              {totalCount === 1 ? "1 record" : `${totalCount} records`}
            </span>
          ) : null}
          {basePath === billingRoutes.overview ? (
            <Link
              className="text-small text-brand-ink font-medium hover:underline"
              href={billingRoutes.history}
            >
              View all
            </Link>
          ) : null}
        </div>
      </CardHeader>
      {history.isPending ? (
        <div
          aria-busy="true"
          aria-label="Loading billing history"
          className="space-y-3 p-4 md:p-6"
          role="status"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : history.isError && !history.data ? (
        <ErrorState
          description={describeBillingLoadError(
            history.error,
            "billing history",
          )}
          onRetry={() => void history.refetch()}
          retrying={history.isFetching}
          title="We couldn't load your billing history"
        />
      ) : (
        <>
          <div
            aria-busy={history.isPlaceholderData || undefined}
            className={
              history.isPlaceholderData ? "opacity-60 transition" : undefined
            }
          >
            <DataTable
              caption="Billing history"
              columns={billingHistoryColumns}
              emptyMessage={
                history.data.totalCount === 0
                  ? "No billing activity yet."
                  : "No billing activity on this page."
              }
              keyField={(item) => item.paymentTransactionId}
              mobileLayout="stack"
              rows={history.data.items}
              variant="embedded"
            />
          </div>
          {totalPages > 1 ? (
            <Pager
              getHref={(target) => billingHistoryPageHref(target, basePath)}
              loading={history.isPlaceholderData}
              page={Math.min(page, totalPages)}
              pageSize={history.data.pageSize}
              totalItems={history.data.totalCount}
              totalPages={totalPages}
            />
          ) : null}
        </>
      )}
    </Card>
  );
}
