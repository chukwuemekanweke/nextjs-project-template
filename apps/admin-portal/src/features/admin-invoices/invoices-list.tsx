"use client";

import Link from "next/link";
import { useId } from "react";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  DownloadIcon,
  FormField,
  SearchInput,
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
  IntentButton,
  NotAvailable,
  UnavailableActionHint,
} from "../admin-billing-shared/billing-sections";
import {
  INVOICE_SEARCH_MAX_LENGTH,
  describeInvoiceStatus,
  hasActiveInvoiceFilters,
  invoicePlanLabel,
  invoiceStatusFilterOptions,
  type AdminInvoiceFilters,
  type AdminInvoiceRow,
  type AdminInvoiceSummary,
} from "./invoices-model";

/*
 * Invoices list (reference `AdminInvoices*`, one responsive composition).
 * Presentation only: the future page owns URL filter state, the admin
 * invoice read and CSV export. PREVIEW-ONLY (DR-160): no route or
 * navigation item until an admin invoice API exists. Without handlers the
 * filters and export are inert with a visible reason; rows link to a detail
 * page only when the caller supplies `detailHref`, built from the backend
 * invoice id.
 */

export const INVOICES_PAGE_TITLE = "Invoices & receipts";

export function InvoicesScreen({
  detailHref,
  exportBusy = false,
  filters,
  onExport,
  onFiltersChange,
  onPageChange,
  onRetry,
  state,
  summary,
}: Readonly<{
  /** Detail URL for a row; omit while the detail route does not exist. */
  detailHref?: (row: AdminInvoiceRow) => string;
  exportBusy?: boolean;
  filters: AdminInvoiceFilters;
  onExport?: () => void;
  onFiltersChange?: (filters: AdminInvoiceFilters) => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  state: AdminListState<AdminInvoiceRow>;
  summary: AdminInvoiceSummary;
}>) {
  const id = useId();
  const exportHintId = `${id}-export-hint`;

  if (state.state === "forbidden") {
    return (
      <AdminForbidden
        permission={state.permission}
        requestDetails={state.requestDetails}
        resourceLabel="Invoices"
      />
    );
  }

  const live = Boolean(onFiltersChange) && state.state !== "unavailable";
  const change = live
    ? (patch: Partial<AdminInvoiceFilters>) =>
        onFiltersChange?.({ ...filters, ...patch })
    : undefined;
  const filterReason = live ? undefined : UNAVAILABLE_FILTER_DESCRIPTION;
  const searchHintId = `${id}-search-hint`;
  const canExport = Boolean(onExport) && state.state === "ready";

  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        actions={
          <div className="grid justify-items-end gap-1 max-sm:justify-items-stretch">
            <IntentButton
              busy={exportBusy}
              hintId={exportHintId}
              intent="exportCsv"
              leadingIcon={<DownloadIcon />}
              onAction={canExport ? onExport : undefined}
              size="sm"
              variant="secondary"
            >
              Export CSV
            </IntentButton>
            {canExport ? null : (
              <UnavailableActionHint id={exportHintId}>
                Export is not available yet.
              </UnavailableActionHint>
            )}
          </div>
        }
        description="Every invoice issued and the receipt for each payment."
        title={INVOICES_PAGE_TITLE}
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
            <FormField
              className="min-w-[220px] flex-[2_1_260px]"
              descriptionId={filterReason ? searchHintId : undefined}
              hint={filterReason}
              inputId={`${id}-search`}
              label="Search"
            >
              <SearchInput
                aria-describedby={filterReason ? searchHintId : undefined}
                disabled={!change}
                id={`${id}-search`}
                maxLength={INVOICE_SEARCH_MAX_LENGTH}
                onChange={(event) => change?.({ query: event.target.value })}
                placeholder="Invoice number or customer"
                value={filters.query}
              />
            </FormField>
            <FilterSelect
              disabledReason={filterReason}
              id={`${id}-status`}
              label="Status"
              onChange={change ? (status) => change({ status }) : undefined}
              options={invoiceStatusFilterOptions}
              value={filters.status}
            />
            <AdminRangeFilter
              disabled={!change}
              disabledReason={filterReason}
              label="Issued"
              onChange={change ? (range) => change({ range }) : undefined}
              value={filters.range}
            />
          </AdminFilterBar>
        }
      >
        <BillingListTable
          caption="Invoices"
          columns={invoiceColumns(detailHref)}
          emptyDescription={
            hasActiveInvoiceFilters(filters)
              ? "Try a different search or clear some filters."
              : undefined
          }
          emptyTitle={
            hasActiveInvoiceFilters(filters)
              ? "No invoices match these filters"
              : "No invoices yet"
          }
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

/** The eight reference columns, plus "View" when a detail route exists. */
export function invoiceColumns(
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
        row.customerDisplayName ? (
          <span className="grid min-w-0">
            <span className="text-fg font-medium break-words">
              {row.customerDisplayName}
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
    {
      cell: (row) => invoicePlanLabel(row) ?? <NotAvailable />,
      header: "Plan",
    },
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
    {
      cell: (row) => <UtcDate value={row.issuedAtUtc} />,
      header: "Issued",
    },
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
