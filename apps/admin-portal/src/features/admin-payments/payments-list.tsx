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
  AdminListCard,
  AdminRangeFilter,
} from "@/components/admin-patterns";
import {
  UNAVAILABLE_FILTER_DESCRIPTION,
  formatUtcDateTime,
  optionsUnavailableText,
  readyOptions,
  type AdminListState,
  type AdminOptionsState,
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
  PAYMENT_SEARCH_MAX_LENGTH,
  describePaymentStatus,
  hasActivePaymentFilters,
  paymentIntentFilterOptions,
  paymentIntentLabel,
  paymentStatusFilterOptions,
  type AdminPaymentFilters,
  type AdminPaymentRow,
} from "./payments-model";

/*
 * Payment transactions list (reference `AdminPayments*`, one responsive
 * composition). Presentation only: the future page owns URL filter state,
 * the admin payments read and CSV export. Without handlers the filters and
 * export are inert with a visible reason. Rows link to a detail page only
 * when the caller supplies `detailHref` (no route exists yet).
 */

export const PAYMENTS_PAGE_TITLE = "Payments";

export function PaymentsScreen({
  currencyOptions,
  detailHref,
  exportBusy = false,
  filters,
  onExport,
  onFiltersChange,
  onPageChange,
  onRetry,
  providerOptions,
  state,
}: Readonly<{
  currencyOptions?: AdminOptionsState;
  /** Detail URL for a row; omit while the detail route does not exist. */
  detailHref?: (row: AdminPaymentRow) => string;
  exportBusy?: boolean;
  filters: AdminPaymentFilters;
  /** Requests an export of the filtered list; the caller performs it. */
  onExport?: () => void;
  onFiltersChange?: (filters: AdminPaymentFilters) => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  providerOptions?: AdminOptionsState;
  state: AdminListState<AdminPaymentRow>;
}>) {
  const id = useId();
  const exportHintId = `${id}-export-hint`;

  if (state.state === "forbidden") {
    return (
      <AdminForbidden
        permission={state.permission}
        requestDetails={state.requestDetails}
        resourceLabel="Payments"
      />
    );
  }

  const live = Boolean(onFiltersChange) && state.state !== "unavailable";
  const change = live
    ? (patch: Partial<AdminPaymentFilters>) =>
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
        description="Every payment transaction across providers."
        title={PAYMENTS_PAGE_TITLE}
      />
      <AdminListCard
        title="Transactions"
        toolbar={
          <AdminFilterBar label="Payment filters">
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
                maxLength={PAYMENT_SEARCH_MAX_LENGTH}
                onChange={(event) => change?.({ query: event.target.value })}
                placeholder="Merchant or provider reference"
                value={filters.query}
              />
            </FormField>
            <AdminRangeFilter
              disabled={!change}
              disabledReason={filterReason}
              label="Created"
              onChange={change ? (range) => change({ range }) : undefined}
              value={filters.range}
            />
            <FilterSelect
              disabledReason={
                filterReason ??
                optionsUnavailableText(providerOptions, "Providers")
              }
              id={`${id}-provider`}
              label="Provider"
              onChange={change ? (provider) => change({ provider }) : undefined}
              options={readyOptions(providerOptions)}
              value={filters.provider}
            />
            <FilterSelect
              disabledReason={
                filterReason ??
                optionsUnavailableText(currencyOptions, "Currencies")
              }
              id={`${id}-currency`}
              label="Currency"
              onChange={change ? (currency) => change({ currency }) : undefined}
              options={readyOptions(currencyOptions)}
              value={filters.currency}
            />
            <FilterSelect
              disabledReason={filterReason}
              id={`${id}-intent`}
              label="Intent"
              onChange={change ? (intent) => change({ intent }) : undefined}
              options={paymentIntentFilterOptions}
              value={filters.intent}
            />
            <FilterSelect
              disabledReason={filterReason}
              id={`${id}-status`}
              label="Status"
              onChange={change ? (status) => change({ status }) : undefined}
              options={paymentStatusFilterOptions}
              value={filters.status}
            />
          </AdminFilterBar>
        }
      >
        <BillingListTable
          caption="Payment transactions"
          columns={paymentColumns(detailHref)}
          emptyDescription={
            hasActivePaymentFilters(filters)
              ? "Try a different search or clear some filters."
              : undefined
          }
          emptyTitle={
            hasActivePaymentFilters(filters)
              ? "No payments match these filters"
              : "No payments yet"
          }
          keyField={(row) => row.id}
          loadingLabel="Loading payments"
          onPageChange={onPageChange}
          onRetry={onRetry}
          state={state}
        />
      </AdminListCard>
    </section>
  );
}

/** The eight reference columns, plus a "View" link when a route exists. */
export function paymentColumns(
  detailHref?: (row: AdminPaymentRow) => string,
): TableColumn<AdminPaymentRow>[] {
  const columns: TableColumn<AdminPaymentRow>[] = [
    {
      cell: (row) => (
        <span className="text-fg font-mono break-all">
          {row.merchantReference}
        </span>
      ),
      header: "Reference",
    },
    {
      cell: (row) =>
        row.ownerDisplayName ? (
          <span className="text-fg font-medium">{row.ownerDisplayName}</span>
        ) : (
          <NotAvailable />
        ),
      header: "User",
    },
    { cell: (row) => row.providerName, header: "Provider" },
    { cell: (row) => paymentIntentLabel(row.intent), header: "Intent" },
    {
      align: "right",
      cell: (row) => (
        <span className="text-fg font-semibold whitespace-nowrap">
          {formatMinorUnits(row.amount, row.currencyCode)}
        </span>
      ),
      header: "Amount",
    },
    {
      cell: (row) => (
        <BillingStatusBadge status={describePaymentStatus(row.paymentStatus)} />
      ),
      header: "Status",
    },
    {
      cell: (row) => <UtcTime value={row.createdAtUtc} />,
      header: "Created",
    },
    {
      cell: (row) =>
        row.completedAtUtc ? (
          <UtcTime value={row.completedAtUtc} />
        ) : (
          <NotAvailable label="Not completed" />
        ),
      header: "Completed",
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
          View<span className="sr-only"> payment {row.merchantReference}</span>
        </Link>
      ),
      header: "Actions",
      mobileLabel: "",
    });
  }
  return columns;
}

function UtcTime({ value }: Readonly<{ value: string }>) {
  const text = formatUtcDateTime(value);
  return text ? (
    <time className="whitespace-nowrap" dateTime={value}>
      {text}
    </time>
  ) : (
    <NotAvailable />
  );
}
