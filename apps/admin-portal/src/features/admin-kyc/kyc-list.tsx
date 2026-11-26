"use client";

import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import { Avatar, Badge, type TableColumn } from "@template/ui-core";
import type { ReactNode } from "react";
import {
  AdminDateTime,
  AdminForbidden,
  AdminKpiCard,
  AdminKpiGrid,
  AdminListCard,
  AdminListPager,
  AdminListTable,
  AdminNotAvailable,
  type AdminOption,
} from "@/components/admin-patterns";
import { AdminKycFilterBar } from "./kyc-filters";
import {
  DEFAULT_ADMIN_KYC_FILTERS,
  hasActiveKycFilters,
  kycStatusBadge,
  type AdminKycFilters,
  type AdminKycListItem,
  type AdminKycListModel,
} from "./kyc-model";

/*
 * KYC monitoring list (reference `AdminKyc*`; Trello FE-UI-013). Read-only:
 * the provider decides verifications. No KYC API, route or navigation item
 * exists yet (DR-054); typed preview data lives in `kyc-preview.fixtures.ts`
 * and is used by tests only.
 */

function optionalText(value: string | undefined): ReactNode {
  return value?.trim() ? value : <AdminNotAvailable />;
}

function VerificationUser({ item }: Readonly<{ item: AdminKycListItem }>) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar decorative name={item.user.displayName} size="sm" />
      <span className="min-w-0 leading-tight">
        <span className="text-fg block font-semibold break-words">
          {item.user.displayName}
        </span>
        <span className="text-caption text-fg-subtle block break-all">
          {item.user.email}
        </span>
      </span>
    </span>
  );
}

function kycColumns(
  getVerificationHref: ((verificationId: string) => string) | undefined,
): readonly TableColumn<AdminKycListItem>[] {
  const columns: TableColumn<AdminKycListItem>[] = [
    { cell: (item) => <VerificationUser item={item} />, header: "User" },
    {
      cell: (item) => {
        const badge = kycStatusBadge(item.status);
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
      className: "whitespace-nowrap",
      header: "Status",
    },
    { cell: (item) => optionalText(item.provider), header: "Provider" },
    {
      cell: (item) =>
        item.providerReference ? (
          <span className="font-mono break-all">{item.providerReference}</span>
        ) : (
          <AdminNotAvailable />
        ),
      header: "Provider ref.",
    },
    {
      cell: (item) => <AdminDateTime value={item.startedAt} />,
      className: "whitespace-nowrap",
      header: "Started",
    },
    {
      cell: (item) => <AdminDateTime value={item.submittedAt} />,
      className: "whitespace-nowrap",
      header: "Submitted",
    },
    {
      cell: (item) => <AdminDateTime value={item.completedAt} />,
      className: "whitespace-nowrap",
      header: "Completed",
    },
  ];
  if (getVerificationHref) {
    columns.push({
      align: "right",
      cell: (item) => (
        <Link
          aria-label={`View verification for ${item.user.displayName}`}
          className="text-brand-ink font-medium hover:underline focus-visible:underline"
          href={getVerificationHref(item.id)}
        >
          View
        </Link>
      ),
      header: "Actions",
      mobileLabel: "",
    });
  }
  return columns;
}

/**
 * KYC monitoring page body: four count tiles (each its own metric state,
 * never zero for a missing source), filters, the verification table and
 * paging. Detail links appear only with `getVerificationHref`.
 */
export function AdminKycScreen({
  filters = DEFAULT_ADMIN_KYC_FILTERS,
  getVerificationHref,
  model,
  onFiltersChange,
  onPageChange,
  onReload,
  providerOptions,
}: Readonly<{
  filters?: AdminKycFilters;
  getVerificationHref?: (verificationId: string) => string;
  model: AdminKycListModel;
  onFiltersChange?: (filters: AdminKycFilters) => void;
  onPageChange?: (page: number) => void;
  onReload?: () => void;
  providerOptions?: readonly AdminOption[];
}>) {
  const { counts, verifications } = model;
  if (verifications.state === "forbidden") {
    return (
      <AdminForbidden
        permission={verifications.permission}
        requestDetails={verifications.requestDetails}
        resourceLabel="KYC monitoring"
      />
    );
  }

  const filtered = hasActiveKycFilters(filters);

  return (
    <section className="space-y-6">
      <DashboardHeader
        description="Track identity verifications. Decisions come from the verification provider."
        title="KYC monitoring"
      />
      <AdminKpiGrid>
        <AdminKpiCard label="Pending review" metric={counts.pending} />
        <AdminKpiCard label="In progress" metric={counts.inProgress} />
        <AdminKpiCard label="Verified" metric={counts.verified} />
        <AdminKpiCard
          label="Rejected or failed"
          metric={counts.rejectedOrFailed}
        />
      </AdminKpiGrid>
      <AdminListCard
        footer={
          <AdminListPager
            label="Verifications pages"
            onPageChange={onPageChange}
            state={verifications}
          />
        }
        title="Verifications"
        toolbar={
          <AdminKycFilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            providerOptions={providerOptions}
          />
        }
      >
        <AdminListTable
          caption="Identity verifications"
          columns={kycColumns(getVerificationHref)}
          emptyDescription={
            filtered
              ? "Try a different search or fewer filters."
              : "Verifications appear here when users start one."
          }
          emptyTitle={
            filtered
              ? "No verifications match these filters"
              : "No verifications yet"
          }
          keyField={(item) => item.id}
          loadingLabel="Loading verifications"
          onPageChange={onPageChange}
          onRetry={onReload}
          state={verifications}
        />
      </AdminListCard>
    </section>
  );
}
