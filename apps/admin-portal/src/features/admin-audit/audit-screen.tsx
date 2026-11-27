"use client";

import {
  Badge,
  Button,
  type BadgeTone,
  type TableColumn,
} from "@template/ui-core";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  ADMIN_ACTION_UNAVAILABLE,
  ADMIN_FILTERS_UNAVAILABLE,
  AdminDateTime,
  AdminFilterBar,
  AdminForbidden,
  AdminListCard,
  AdminListPager,
  AdminListTable,
  AdminRangeFilter,
  AdminSearchFilter,
  adminOptionsUnavailableText,
  readyAdminOptions,
  type AdminActionAvailability,
  type AdminOptionsState,
  type AdminRangePreset,
} from "@/components/admin-patterns";
import { AnalyticsSelect } from "../admin-analytics-shared/analytics-layout";
import type {
  AuditAction,
  AuditEvent,
  AuditFilters,
  AuditModel,
  AuditOutcome,
} from "./audit-model";

const tones: Readonly<Record<AuditOutcome, BadgeTone>> = {
  denied: "warning",
  failed: "danger",
  success: "success",
  unknown: "neutral",
};

const outcomeLabels: Readonly<Record<AuditOutcome, string>> = {
  denied: "Denied",
  failed: "Failed",
  success: "Success",
  unknown: "Unknown",
};

/**
 * Audit history (reference `AdminAuditPage`). Filters, page and actions are
 * controlled; export and each event's details have their own availability
 * from the source, so a handler alone never enables them.
 */
export function AuditScreen({
  actionOptions,
  actorOptions,
  exportAction,
  filters,
  model,
  onAction,
  onFiltersChange,
  onPageChange,
  onRetry,
}: Readonly<{
  actionOptions?: AdminOptionsState;
  actorOptions?: AdminOptionsState;
  exportAction: AdminActionAvailability;
  filters: AuditFilters;
  model: AuditModel;
  onAction?: (action: AuditAction) => void;
  onFiltersChange?: (filters: AuditFilters) => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
}>) {
  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.requestDetails}
        resourceLabel="Audit history"
      />
    );
  }

  const wired = Boolean(onFiltersChange);

  function changeFilters(patch: Partial<AuditFilters>) {
    onFiltersChange?.({ ...filters, ...patch });
  }

  function optionsReason(
    options: AdminOptionsState | undefined,
    noun: string,
  ): string | undefined {
    return wired
      ? adminOptionsUnavailableText(options, noun)
      : ADMIN_FILTERS_UNAVAILABLE;
  }

  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        actions={
          <ActionWithReason
            availability={exportAction}
            label="Export CSV"
            onRequest={
              onAction ? () => onAction({ type: "exportCsv" }) : undefined
            }
          />
        }
        description="Immutable administrative events, actors, resources and reported outcomes."
        title="Audit history"
      />
      <AdminListCard
        footer={
          <AdminListPager
            label="Audit pages"
            onPageChange={onPageChange}
            state={model}
          />
        }
        title="Events"
        toolbar={
          <AdminFilterBar label="Audit filters">
            <AdminSearchFilter
              onChange={wired ? (query) => changeFilters({ query }) : undefined}
              placeholder="Actor, action or resource"
              value={filters.query}
            />
            <AdminRangeFilter
              disabledReason={ADMIN_FILTERS_UNAVAILABLE}
              onChange={
                wired
                  ? (range: AdminRangePreset) => changeFilters({ range })
                  : undefined
              }
              value={filters.range}
            />
            <AnalyticsSelect
              allLabel="Any action"
              disabledReason={optionsReason(actionOptions, "Actions")}
              label="Action"
              onChange={
                wired ? (action) => changeFilters({ action }) : undefined
              }
              options={readyAdminOptions(actionOptions)}
              value={filters.action}
            />
            <AnalyticsSelect
              allLabel="Any actor"
              disabledReason={optionsReason(actorOptions, "Actors")}
              label="Actor"
              onChange={wired ? (actor) => changeFilters({ actor }) : undefined}
              options={readyAdminOptions(actorOptions)}
              value={filters.actor}
            />
          </AdminFilterBar>
        }
      >
        <AdminListTable
          caption="Audit events"
          columns={auditColumns(onAction)}
          emptyTitle="No audit events"
          keyField={(row) => row.id}
          loadingLabel="Loading audit events"
          onPageChange={onPageChange}
          onRetry={onRetry}
          state={model}
        />
      </AdminListCard>
    </section>
  );
}

/** An operation button with its pending state and, when inert, its reason. */
function ActionWithReason({
  availability,
  label,
  onRequest,
  variant = "secondary",
}: Readonly<{
  availability: AdminActionAvailability;
  label: string;
  onRequest?: () => void;
  variant?: "secondary" | "ghost";
}>) {
  const pending = availability.state === "available" && availability.pending;
  let reason: string | undefined;
  if (availability.state === "unavailable") {
    reason = availability.reason;
  } else if (!onRequest) {
    reason = ADMIN_ACTION_UNAVAILABLE;
  }
  return (
    <div className="grid justify-items-end gap-1">
      <Button
        disabled={Boolean(reason) || pending}
        loading={pending}
        onClick={onRequest}
        size="sm"
        variant={variant}
      >
        {label}
      </Button>
      {reason ? (
        <span className="text-caption text-fg-subtle">{reason}</span>
      ) : null}
    </div>
  );
}

function auditColumns(
  onAction?: (action: AuditAction) => void,
): readonly TableColumn<AuditEvent>[] {
  return [
    {
      header: "When",
      cell: (row) => <AdminDateTime value={row.atUtc} />,
    },
    {
      header: "Actor",
      cell: (row) =>
        row.actorName ??
        row.actorId ?? <span className="text-fg-subtle">Not reported</span>,
    },
    { header: "Action", cell: (row) => row.action },
    {
      header: "Target",
      cell: (row) => (
        <div>
          <p>{row.resource}</p>
          {row.resourceId ? (
            <p className="text-caption text-fg-muted font-mono">
              {row.resourceId}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      header: "Outcome",
      cell: (row) => (
        <Badge tone={tones[row.outcome]}>{outcomeLabels[row.outcome]}</Badge>
      ),
    },
    {
      header: "Reason",
      cell: (row) =>
        row.reason ?? <span className="text-fg-subtle">Not reported</span>,
    },
    {
      align: "right",
      header: "Actions",
      cell: (row) => (
        <ActionWithReason
          availability={row.detailAction}
          label="Details"
          onRequest={
            onAction
              ? () => onAction({ eventId: row.id, type: "viewDetails" })
              : undefined
          }
          variant="ghost"
        />
      ),
    },
  ];
}
