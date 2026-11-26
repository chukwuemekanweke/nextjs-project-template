"use client";

import Link from "next/link";
import { useId } from "react";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Button,
  Chip,
  FormField,
  PlusIcon,
  SearchInput,
  type TableColumn,
} from "@template/ui-core";
import {
  AdminFilterBar,
  AdminForbidden,
  AdminListCard,
} from "@/components/admin-patterns";
import {
  UNAVAILABLE_FILTER_DESCRIPTION,
  formatUtcDate,
  optionsUnavailableText,
  readyOptions,
  type AdminListState,
  type AdminOptionsState,
} from "../admin-billing-shared/billing-model";
import {
  BillingListTable,
  BillingStatusBadge,
  FilterSelect,
  NotAvailable,
} from "../admin-billing-shared/billing-sections";
import {
  SUBSCRIPTION_SEARCH_MAX_LENGTH,
  autoRenewLabel,
  describeSubscriptionStatus,
  hasActiveSubscriptionFilters,
  ownerTypeFilterOptions,
  ownerTypeLabel,
  renewalFilterOptions,
  subscriptionStatusFilterOptions,
  type AdminSubscriptionFilters,
  type AdminSubscriptionRow,
} from "./subscriptions-model";

/*
 * Subscriptions list (reference `AdminSubscriptions*`). Presentation only:
 * the future page owns URL filter state and the admin read. Links to the
 * detail and allocation screens render only when the caller supplies their
 * URLs (no routes exist yet).
 */

export const SUBSCRIPTIONS_PAGE_TITLE = "Subscriptions";

export function SubscriptionsScreen({
  allocateHref,
  detailHref,
  filters,
  onFiltersChange,
  onPageChange,
  onRetry,
  planOptions,
  state,
}: Readonly<{
  /** Allocation screen URL, once the route exists. */
  allocateHref?: string;
  detailHref?: (row: AdminSubscriptionRow) => string;
  filters: AdminSubscriptionFilters;
  onFiltersChange?: (filters: AdminSubscriptionFilters) => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  /** Plans to filter by, from an admin plans read (inactive included). */
  planOptions?: AdminOptionsState;
  state: AdminListState<AdminSubscriptionRow>;
}>) {
  const id = useId();

  if (state.state === "forbidden") {
    return (
      <AdminForbidden
        permission={state.permission}
        requestDetails={state.requestDetails}
        resourceLabel="Subscriptions"
      />
    );
  }

  const change =
    onFiltersChange && state.state !== "unavailable"
      ? (patch: Partial<AdminSubscriptionFilters>) =>
          onFiltersChange({ ...filters, ...patch })
      : undefined;
  const filterReason = change ? undefined : UNAVAILABLE_FILTER_DESCRIPTION;
  const searchHintId = `${id}-search-hint`;
  const filtered = hasActiveSubscriptionFilters(filters);

  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        actions={
          allocateHref ? (
            <Button asChild leadingIcon={<PlusIcon />}>
              <Link href={allocateHref}>Allocate subscription</Link>
            </Button>
          ) : null
        }
        description="Every billing account's subscription and its lifecycle."
        title={SUBSCRIPTIONS_PAGE_TITLE}
      />
      <AdminListCard
        title="All subscriptions"
        toolbar={
          <AdminFilterBar label="Subscription filters">
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
                maxLength={SUBSCRIPTION_SEARCH_MAX_LENGTH}
                onChange={(event) => change?.({ query: event.target.value })}
                placeholder="Search owner, email or ID"
                value={filters.query}
              />
            </FormField>
            <FilterSelect
              disabledReason={filterReason}
              id={`${id}-status`}
              label="Status"
              onChange={change ? (status) => change({ status }) : undefined}
              options={subscriptionStatusFilterOptions}
              value={filters.status}
            />
            <FilterSelect
              disabledReason={
                filterReason ?? optionsUnavailableText(planOptions, "Plans")
              }
              id={`${id}-plan`}
              label="Plan"
              onChange={change ? (plan) => change({ plan }) : undefined}
              options={readyOptions(planOptions)}
              value={filters.plan}
            />
            <FilterSelect
              disabledReason={filterReason}
              id={`${id}-owner`}
              label="Owner"
              onChange={
                change
                  ? (value) =>
                      change({
                        ownerType:
                          value as AdminSubscriptionFilters["ownerType"],
                      })
                  : undefined
              }
              options={ownerTypeFilterOptions}
              value={filters.ownerType}
            />
            <FilterSelect
              disabledReason={filterReason}
              id={`${id}-renewal`}
              label="Renewal"
              onChange={
                change
                  ? (value) =>
                      change({
                        renewal: value as AdminSubscriptionFilters["renewal"],
                      })
                  : undefined
              }
              options={renewalFilterOptions}
              value={filters.renewal}
            />
          </AdminFilterBar>
        }
      >
        <BillingListTable
          caption="Subscriptions"
          columns={subscriptionColumns(detailHref)}
          emptyDescription={
            filtered
              ? "Try a different search or clear some filters."
              : undefined
          }
          emptyTitle={
            filtered
              ? "No subscriptions match these filters"
              : "No subscriptions yet"
          }
          keyField={(row) => row.id}
          loadingLabel="Loading subscriptions"
          onPageChange={onPageChange}
          onRetry={onRetry}
          state={state}
        />
      </AdminListCard>
    </section>
  );
}

function DateCell({ value }: Readonly<{ value: string | null }>) {
  const text = formatUtcDate(value);
  return text && value ? (
    <time className="whitespace-nowrap" dateTime={value}>
      {text}
    </time>
  ) : (
    <NotAvailable />
  );
}

export function subscriptionColumns(
  detailHref?: (row: AdminSubscriptionRow) => string,
): TableColumn<AdminSubscriptionRow>[] {
  const columns: TableColumn<AdminSubscriptionRow>[] = [
    {
      cell: (row) => (
        <div className="min-w-0">
          {row.ownerDisplayName ? (
            <span className="text-fg font-semibold break-words">
              {row.ownerDisplayName}
            </span>
          ) : (
            <NotAvailable label="Owner not available" />
          )}
          {row.ownerSecondary ? (
            <div className="text-caption text-fg-subtle break-all">
              {row.ownerSecondary}
            </div>
          ) : null}
        </div>
      ),
      header: "Owner",
    },
    {
      cell: (row) => <Chip>{ownerTypeLabel(row.ownerType)}</Chip>,
      header: "Type",
    },
    {
      cell: (row) => row.tenantName ?? <NotAvailable />,
      header: "Tenant",
    },
    {
      cell: (row) => (
        <span className="text-fg font-semibold">{row.planName}</span>
      ),
      header: "Plan",
    },
    {
      cell: (row) => (
        <BillingStatusBadge status={describeSubscriptionStatus(row)} />
      ),
      header: "Status",
    },
    {
      cell: (row) => <DateCell value={row.currentPeriodEndUtc} />,
      header: "Period end",
    },
    {
      cell: (row) => <DateCell value={row.nextBillingAtUtc} />,
      header: "Next billing",
    },
    {
      cell: (row) => autoRenewLabel(row.autoRenew) ?? <NotAvailable />,
      header: "Auto-renew",
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
          View
          <span className="sr-only">
            {" "}
            {row.planName} subscription
            {row.ownerDisplayName ? ` for ${row.ownerDisplayName}` : ""}
          </span>
        </Link>
      ),
      header: "Actions",
      mobileLabel: "",
    });
  }
  return columns;
}
