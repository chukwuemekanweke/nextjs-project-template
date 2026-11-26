"use client";

import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Alert,
  ArrowLeftIcon,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
  ErrorState,
  FormField,
  KeyValueList,
  LoadingStatus,
  Pager,
  RefreshIcon,
  SearchInput,
  Select,
  ShieldCheckIcon,
  Skeleton,
  describePageRange,
  type KeyValueItem,
  type TableColumn,
} from "@template/ui-core";
import { useId, type ReactNode } from "react";
import {
  AdminFilterBar,
  AdminForbidden,
  AdminKpiCard,
  AdminKpiGrid,
  AdminListCard,
  AdminRangeFilter,
} from "@/components/admin-patterns";
import {
  ADMIN_FILTERS_UNAVAILABLE,
  AdminDateTime,
  AdminSectionBody,
  NotAvailable,
  UnavailableHint,
  type AdminDateOptions,
  type AdminFilterOption,
} from "@/features/admin-users/admin-view";
import {
  ADMIN_KYC_STATUSES,
  DEFAULT_ADMIN_KYC_FILTERS,
  hasActiveKycFilters,
  kycAttemptLabel,
  kycDecisionNotice,
  kycStatusBadge,
  parseAdminKycStatus,
  type AdminKycAttempt,
  type AdminKycDetailModel,
  type AdminKycFilters,
  type AdminKycListItem,
  type AdminKycListModel,
  type AdminKycStatus,
} from "./kyc-model";

/*
 * KYC monitoring list and verification detail (reference `AdminKyc*`,
 * `AdminKycDetail*`; Trello FE-UI-013). Read-only compositions: the
 * provider decides verifications, so there is no approve or reject; the
 * only intent is "Refresh status", reported through `onRefresh`. No KYC API,
 * route or navigation item exists yet (DR-054); typed preview data lives in
 * `kyc-preview.fixtures.ts` and is used by tests only.
 */

function StatusBadge({ status }: Readonly<{ status: AdminKycStatus }>) {
  const badge = kycStatusBadge(status);
  return <Badge tone={badge.tone}>{badge.label}</Badge>;
}

function text(value: string | undefined): ReactNode {
  return value?.trim() ? value : <NotAvailable />;
}

/* ------------------------------------------------------------------------ */
/* List                                                                      */
/* ------------------------------------------------------------------------ */

/** Search, status, provider and UTC period; inert without a handler. */
export function AdminKycFilterBar({
  filters,
  onFiltersChange,
  providerOptions,
}: Readonly<{
  filters: AdminKycFilters;
  onFiltersChange?: (filters: AdminKycFilters) => void;
  providerOptions?: readonly AdminFilterOption[];
}>) {
  const id = useId();
  const inert = !onFiltersChange;
  const describedBy = inert ? `${id}-hint` : undefined;

  function change(next: Partial<AdminKycFilters>) {
    const merged = { ...filters, ...next };
    if (
      merged.query !== filters.query ||
      merged.status !== filters.status ||
      merged.provider !== filters.provider ||
      merged.range !== filters.range
    ) {
      onFiltersChange?.(merged);
    }
  }

  return (
    <div className="grid gap-2">
      <AdminFilterBar label="Verification filters">
        <FormField
          className="flex-[2_1_240px]"
          inputId={`${id}-q`}
          label="Search"
        >
          <SearchInput
            aria-describedby={describedBy}
            className="md:max-w-none"
            disabled={inert}
            id={`${id}-q`}
            onChange={(event) => change({ query: event.target.value })}
            placeholder="User, email or provider reference"
            value={filters.query}
          />
        </FormField>
        <FormField
          className="min-w-[150px] flex-[1_1_150px]"
          inputId={`${id}-status`}
          label="Status"
        >
          <Select
            aria-describedby={describedBy}
            disabled={inert}
            id={`${id}-status`}
            onChange={(event) =>
              change({
                status:
                  event.target.value === "any"
                    ? "any"
                    : parseAdminKycStatus(event.target.value),
              })
            }
            value={filters.status}
          >
            <option value="any">Any</option>
            {ADMIN_KYC_STATUSES.map((status) => (
              <option key={status} value={status}>
                {kycStatusBadge(status).label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          className="min-w-[150px] flex-[1_1_150px]"
          inputId={`${id}-provider`}
          label="Provider"
        >
          <Select
            aria-describedby={describedBy}
            disabled={inert || !providerOptions}
            id={`${id}-provider`}
            onChange={(event) => change({ provider: event.target.value })}
            value={filters.provider}
          >
            <option value="any">Any</option>
            {(providerOptions ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <AdminRangeFilter
          disabledReason={inert ? ADMIN_FILTERS_UNAVAILABLE : undefined}
          label="Started"
          onChange={onFiltersChange ? (range) => change({ range }) : undefined}
          value={filters.range}
        />
      </AdminFilterBar>
      {inert ? (
        <UnavailableHint id={`${id}-hint`}>
          {ADMIN_FILTERS_UNAVAILABLE}
        </UnavailableHint>
      ) : null}
    </div>
  );
}

function kycColumns(
  dates: AdminDateOptions | undefined,
  getVerificationHref: ((verificationId: string) => string) | undefined,
): readonly TableColumn<AdminKycListItem>[] {
  const columns: TableColumn<AdminKycListItem>[] = [
    {
      cell: (item) => (
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
      ),
      header: "User",
    },
    {
      cell: (item) => <StatusBadge status={item.status} />,
      className: "whitespace-nowrap",
      header: "Status",
    },
    { cell: (item) => text(item.provider), header: "Provider" },
    {
      cell: (item) =>
        item.providerReference ? (
          <span className="font-mono break-all">{item.providerReference}</span>
        ) : (
          <NotAvailable />
        ),
      header: "Provider ref.",
    },
    {
      cell: (item) => <AdminDateTime dates={dates} value={item.startedAt} />,
      className: "whitespace-nowrap",
      header: "Started",
    },
    {
      cell: (item) => <AdminDateTime dates={dates} value={item.submittedAt} />,
      className: "whitespace-nowrap",
      header: "Submitted",
    },
    {
      cell: (item) => <AdminDateTime dates={dates} value={item.completedAt} />,
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
  dates,
  filters = DEFAULT_ADMIN_KYC_FILTERS,
  getVerificationHref,
  model,
  onFiltersChange,
  onPageChange,
  onReload,
  providerOptions,
}: Readonly<{
  dates?: AdminDateOptions;
  filters?: AdminKycFilters;
  getVerificationHref?: (verificationId: string) => string;
  model: AdminKycListModel;
  onFiltersChange?: (filters: AdminKycFilters) => void;
  onPageChange?: (page: number) => void;
  onReload?: () => void;
  providerOptions?: readonly AdminFilterOption[];
}>) {
  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.details}
        resourceLabel="KYC monitoring"
      />
    );
  }

  const loadingMetric = { state: "loading" } as const;
  const errorMetric = {
    message: "Counts could not be loaded.",
    state: "error",
  } as const;
  const counts =
    model.state === "ready"
      ? model.counts
      : model.state === "loading"
        ? {
            inProgress: loadingMetric,
            pending: loadingMetric,
            rejectedOrFailed: loadingMetric,
            verified: loadingMetric,
          }
        : {
            inProgress: errorMetric,
            pending: errorMetric,
            rejectedOrFailed: errorMetric,
            verified: errorMetric,
          };

  let footer: ReactNode = null;
  if (model.state === "ready" && model.items.length > 0) {
    footer = onPageChange ? (
      <Pager
        className="w-full border-t-0 p-0 md:p-0"
        label="Verifications pagination"
        onPageChange={onPageChange}
        page={model.page}
        pageSize={model.pageSize}
        totalItems={model.totalItems}
        totalPages={model.totalPages}
      />
    ) : (
      <p className="text-label text-fg-muted">{describePageRange(model)}</p>
    );
  }

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
        footer={footer}
        title="Verifications"
        toolbar={
          <AdminKycFilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            providerOptions={providerOptions}
          />
        }
      >
        <DataTable
          caption="Identity verifications"
          columns={kycColumns(dates, getVerificationHref)}
          empty={
            <EmptyState
              className="border-0 py-2"
              description={
                hasActiveKycFilters(filters)
                  ? "Try a different search or fewer filters."
                  : "Verifications appear here when users start one."
              }
              icon={<ShieldCheckIcon />}
              title={
                hasActiveKycFilters(filters)
                  ? "No verifications match these filters"
                  : "No verifications yet"
              }
            />
          }
          error={
            model.state === "error" ? (
              <ErrorState
                className="py-2"
                description="Verifications could not be loaded."
                onRetry={onReload}
                title="Couldn't load verifications"
              />
            ) : undefined
          }
          keyField={(item) => item.id}
          loading={model.state === "loading"}
          loadingLabel="Loading verifications"
          mobileLayout="stack"
          rows={model.state === "ready" ? model.items : []}
          variant="embedded"
        />
      </AdminListCard>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Detail                                                                    */
/* ------------------------------------------------------------------------ */

function attemptColumns(
  dates: AdminDateOptions | undefined,
): readonly TableColumn<AdminKycAttempt>[] {
  return [
    {
      cell: (attempt) => `#${attempt.attemptNumber}`,
      className: "text-fg font-medium whitespace-nowrap",
      header: "Attempt",
    },
    {
      cell: (attempt) => <StatusBadge status={attempt.status} />,
      header: "Status",
    },
    {
      cell: (attempt) => (
        <AdminDateTime dateOnly dates={dates} value={attempt.startedAt} />
      ),
      className: "whitespace-nowrap",
      header: "Started",
    },
    {
      cell: (attempt) => (
        <AdminDateTime dateOnly dates={dates} value={attempt.completedAt} />
      ),
      className: "whitespace-nowrap",
      header: "Completed",
    },
  ];
}

/**
 * Verification detail page body (reference `AdminKycDetail`): read-only
 * verification facts, the user, a status timeline and previous attempts.
 * "Refresh status" asks the adapter to re-read the provider; without
 * `onRefresh` it is disabled with an explanation. There is no approve,
 * reject or override.
 */
export function AdminKycDetailScreen({
  dates,
  getUserHref,
  listHref,
  model,
  onRefresh,
  onReload,
  refreshing = false,
}: Readonly<{
  dates?: AdminDateOptions;
  /** Link to an implemented user detail route. */
  getUserHref?: (userId: string) => string;
  /** Implemented KYC list route, for the back link. */
  listHref?: string;
  model: AdminKycDetailModel;
  onRefresh?: () => void;
  onReload?: () => void;
  refreshing?: boolean;
}>) {
  const hintId = useId();

  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.details}
        resourceLabel="Verification details"
      />
    );
  }

  const back = listHref ? (
    <Link
      className="text-small text-brand-ink inline-flex w-fit items-center gap-1.5 font-medium hover:underline"
      href={listHref}
    >
      <ArrowLeftIcon size="xs" />
      KYC monitoring
    </Link>
  ) : null;

  if (model.state === "loading") {
    return (
      <section aria-busy="true" className="space-y-6">
        <LoadingStatus label="Loading verification" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-48 w-full" />
      </section>
    );
  }
  if (model.state === "error" || model.state === "notFound") {
    return (
      <section className="space-y-6">
        {back}
        <Card>
          {model.state === "error" ? (
            <ErrorState
              description="The verification could not be loaded."
              onRetry={onReload}
              title="Couldn't load this verification"
            />
          ) : (
            <EmptyState
              className="m-6"
              icon={<ShieldCheckIcon />}
              title="Verification not found"
            />
          )}
        </Card>
      </section>
    );
  }

  const { verification } = model;
  const items: KeyValueItem[] = [
    { label: "Status", value: <StatusBadge status={verification.status} /> },
    { label: "Provider status", value: text(verification.providerStatus) },
    { label: "Provider", value: text(verification.provider) },
    {
      label: "Verification ID",
      value: verification.providerReference ? (
        <span className="font-mono break-all">
          {verification.providerReference}
        </span>
      ) : (
        <NotAvailable />
      ),
    },
    {
      label: "Applicant ID",
      value: verification.applicantId ? (
        <span className="font-mono break-all">{verification.applicantId}</span>
      ) : (
        <NotAvailable />
      ),
    },
    {
      label: "Started",
      value: <AdminDateTime dates={dates} value={verification.startedAt} />,
    },
    {
      label: "Submitted",
      value: <AdminDateTime dates={dates} value={verification.submittedAt} />,
    },
    {
      label: "Completed",
      value: <AdminDateTime dates={dates} value={verification.completedAt} />,
    },
  ];

  return (
    <section className="space-y-6">
      {back}
      <DashboardHeader
        actions={
          <div className="grid gap-1">
            <Button
              aria-describedby={onRefresh ? undefined : hintId}
              disabled={!onRefresh}
              leadingIcon={<RefreshIcon />}
              loading={refreshing}
              onClick={onRefresh}
              variant="secondary"
            >
              Refresh status
            </Button>
          </div>
        }
        description={kycAttemptLabel(verification)}
        title={`Verification · ${verification.user.displayName}`}
      />
      {onRefresh ? null : <UnavailableHint id={hintId} />}
      <Alert variant="info">{kycDecisionNotice(verification.provider)}</Alert>
      {verification.status === "unknown" ? (
        <Alert variant="warning">
          The provider reported a status this portal doesn&apos;t recognise.
          Treat the verification as unresolved.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueList items={items} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>User</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Avatar decorative name={verification.user.displayName} />
              <div className="min-w-0 flex-[1_1_180px]">
                <p className="text-fg font-semibold break-words">
                  {verification.user.displayName}
                </p>
                <p className="text-small text-fg-muted break-all">
                  {verification.user.email}
                  {verification.user.country
                    ? ` · ${verification.user.country}`
                    : null}
                </p>
              </div>
              {getUserHref ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href={getUserHref(verification.user.id)}>
                    Open user
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status history</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminSectionBody
              label="status history"
              onRetry={onReload}
              section={model.history}
            >
              {(events) =>
                events.length === 0 ? (
                  <p className="text-fg-muted">No status changes recorded.</p>
                ) : (
                  <ol aria-label="Status history" className="grid gap-4">
                    {events.map((event) => (
                      <li className="flex gap-3" key={event.id}>
                        <span
                          aria-hidden="true"
                          className="bg-brand mt-1.5 size-2.5 shrink-0 rounded-full"
                        />
                        <div className="min-w-0">
                          <p className="text-fg font-semibold break-words">
                            {event.label}
                          </p>
                          <p className="text-small text-fg-muted">
                            <AdminDateTime
                              dates={dates}
                              value={event.occurredAt}
                            />
                            {event.detail ? ` · ${event.detail}` : null}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )
              }
            </AdminSectionBody>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Previous attempts</CardTitle>
        </CardHeader>
        {model.attempts.state === "unavailable" ? (
          <CardContent>
            <AdminSectionBody
              label="previous attempts"
              section={model.attempts}
            >
              {() => null}
            </AdminSectionBody>
          </CardContent>
        ) : (
          <DataTable
            caption="Verification attempts"
            columns={attemptColumns(dates)}
            emptyMessage="No previous attempts."
            error={
              model.attempts.state === "error" ? (
                <ErrorState
                  className="py-2"
                  description="Previous attempts could not be loaded."
                  onRetry={onReload}
                  title="Couldn't load previous attempts"
                />
              ) : undefined
            }
            keyField={(attempt) => attempt.id}
            loading={model.attempts.state === "loading"}
            loadingLabel="Loading previous attempts"
            loadingRows={3}
            mobileLayout="stack"
            rows={model.attempts.state === "ready" ? model.attempts.data : []}
            variant="embedded"
          />
        )}
      </Card>
    </section>
  );
}
