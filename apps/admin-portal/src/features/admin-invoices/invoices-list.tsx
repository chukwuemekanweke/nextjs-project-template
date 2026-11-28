"use client";

import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Button,
  DownloadIcon,
  formatMinorUnits,
  type TableColumn,
} from "@template/ui-core";
import {
  AdminFilterBar,
  AdminForbidden,
  AdminKpiCard,
  AdminListCard,
  AdminRangeFilter,
} from "@/components/admin-patterns";
import {
  UNAVAILABLE_FILTER_DESCRIPTION,
  formatUtcDate,
  type AdminListState,
} from "../admin-billing-shared/billing-model";
import {
  BillingListTable,
  BillingStatusBadge,
  FilterSelect,
  NotAvailable,
  UnavailableActionHint,
} from "../admin-billing-shared/billing-sections";
import {
  describeInvoiceStatus,
  type AdminInvoiceRow,
  type AdminInvoiceSummary,
} from "./invoices-model";

/*
 * Invoices list (reference `AdminInvoices*`, one responsive composition).
 * PREVIEW-ONLY (BE-DS-007, DR-160): no route or navigation item. Export, the
 * status filter and the date range are shown disabled with their reason;
 * rows link to a detail page only through a caller-supplied `detailHref`
 * built from the invoice id.
 */

const STATUS_OPTIONS = [
  { label: "Paid", value: "Paid" },
  { label: "Due", value: "Due" },
  { label: "Overdue", value: "Overdue" },
];

export function InvoicesScreen({
  detailHref,
  onPageChange,
  onRetry,
  state,
  summary,
}: Readonly<{
  /** Detail URL for a row; omit while the detail route does not exist. */
  detailHref?: (row: AdminInvoiceRow) => string;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  state: AdminListState<AdminInvoiceRow>;
  summary: AdminInvoiceSummary;
}>) {
  if (state.state === "forbidden") {
    return (
      <AdminForbidden
        permission={state.permission}
        requestDetails={state.requestDetails}
        resourceLabel="Invoices"
      />
    );
  }

  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        actions={
          <div className="grid justify-items-end gap-1 max-sm:justify-items-stretch">
            <Button
              aria-describedby="invoices-export-hint"
              disabled
              leadingIcon={<DownloadIcon />}
              size="sm"
              type="button"
              variant="secondary"
            >
              Export CSV
            </Button>
            <UnavailableActionHint id="invoices-export-hint">
              Export is not available yet.
            </UnavailableActionHint>
          </div>
        }
        description="Every invoice issued and the receipt for each payment."
        title="Invoices & receipts"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Invoiced (30d)" metric={summary.invoiced} />
        <AdminKpiCard label="Collected (30d)" metric={summary.collected} />
        <AdminKpiCard label="Outstanding" metric={summary.outstanding} />
        <AdminKpiCard label="Overdue" metric={summary.overdue} />
      </div>
      <AdminListCard
        title="Invoices"
        toolbar={
          <AdminFilterBar label="Invoice filters">
            <FilterSelect
              anyLabel="All"
              disabledReason={UNAVAILABLE_FILTER_DESCRIPTION}
              id="invoices-status"
              label="Status"
              options={STATUS_OPTIONS}
              value=""
            />
            <AdminRangeFilter
              disabled
              disabledReason={UNAVAILABLE_FILTER_DESCRIPTION}
              label="Date range"
              value="30d"
            />
          </AdminFilterBar>
        }
      >
        <BillingListTable
          caption="Invoices"
          columns={invoiceColumns(detailHref)}
          emptyTitle="No invoices yet"
          keyField={(row) => row.id}
          loadingLabel="Loading invoices"
          onPageChange={onPageChange}
          onRetry={onRetry}
          state={state}
        />
      </AdminListCard>
    </section>
  );
}

function invoiceColumns(
  detailHref?: (row: AdminInvoiceRow) => string,
): TableColumn<AdminInvoiceRow>[] {
  const columns: TableColumn<AdminInvoiceRow>[] = [
    {
      cell: (row) => (
        <span className="text-fg font-mono break-all">{row.invoiceNumber}</span>
      ),
      header: "Invoice",
    },
    {
      cell: (row) =>
        row.customerName ? (
          <span className="grid min-w-0">
            <span className="text-fg font-medium break-words">
              {row.customerName}
            </span>
            {row.customerEmail ? (
              <span className="text-small text-fg-subtle break-all">
                {row.customerEmail}
              </span>
            ) : null}
          </span>
        ) : (
          <NotAvailable />
        ),
      header: "Customer",
    },
    { cell: (row) => row.planLabel ?? <NotAvailable />, header: "Plan" },
    {
      align: "right",
      cell: (row) => (
        <span className="text-fg font-semibold whitespace-nowrap">
          {formatMinorUnits(row.total, row.currencyCode)}
        </span>
      ),
      header: "Amount",
    },
    {
      cell: (row) => (
        <BillingStatusBadge status={describeInvoiceStatus(row.status)} />
      ),
      header: "Status",
    },
    { cell: (row) => <UtcDate value={row.issuedAtUtc} />, header: "Issued" },
    {
      cell: (row) =>
        row.dueAtUtc ? (
          <UtcDate value={row.dueAtUtc} />
        ) : (
          <NotAvailable label="No due date" />
        ),
      header: "Due",
    },
    {
      cell: (row) =>
        row.receiptNumber ? (
          <span className="font-mono break-all">{row.receiptNumber}</span>
        ) : (
          <NotAvailable label="No receipt" />
        ),
      header: "Receipt",
    },
  ];
  if (detailHref) {
    columns.push({
      align: "right",
      cell: (row) => (
        <Link
          className="text-brand-ink font-medium hover:underline focus-visible:underline"
          href={detailHref(row)}
        >
          View<span className="sr-only"> invoice {row.invoiceNumber}</span>
        </Link>
      ),
      header: "Actions",
      mobileLabel: "",
    });
  }
  return columns;
}

function UtcDate({ value }: Readonly<{ value: string }>) {
  const text = formatUtcDate(value);
  return text ? (
    <time className="whitespace-nowrap" dateTime={value}>
      {text}
    </time>
  ) : (
    <NotAvailable />
  );
}
