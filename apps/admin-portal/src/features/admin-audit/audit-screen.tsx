"use client";

import {
  Badge,
  Button,
  FormField,
  SearchInput,
  type BadgeTone,
  type TableColumn,
} from "@template/ui-core";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  AdminFilterBar,
  AdminForbidden,
  AdminListCard,
  AdminListPager,
  AdminListTable,
  AdminRangeFilter,
  formatAdminDateTime,
} from "@/components/admin-patterns";
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

export function AuditScreen({
  filters,
  model,
  onAction,
  onFiltersChange,
  onPageChange,
}: Readonly<{
  filters: AuditFilters;
  model: AuditModel;
  onAction?: (action: AuditAction) => void;
  onFiltersChange?: (filters: AuditFilters) => void;
  onPageChange?: (page: number) => void;
}>) {
  if (model.state === "forbidden") {
    return <AdminForbidden resourceLabel="Audit history" />;
  }
  const change = onFiltersChange
    ? (patch: Partial<AuditFilters>) =>
        onFiltersChange({ ...filters, ...patch })
    : undefined;
  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        actions={
          <div className="grid justify-items-end gap-1">
            <Button
              disabled={!onAction}
              onClick={() => onAction?.({ type: "exportCsv" })}
              size="sm"
              variant="secondary"
            >
              Export CSV
            </Button>
            {!onAction ? (
              <span className="text-caption text-fg-subtle">
                Export is unavailable.
              </span>
            ) : null}
          </div>
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
            <FormField inputId="audit-search" label="Search">
              <SearchInput
                disabled={!change}
                id="audit-search"
                onChange={(event) => change?.({ query: event.target.value })}
                placeholder="Actor, action or resource"
                value={filters.query}
              />
            </FormField>
            <AdminRangeFilter
              disabledReason="Audit filters require the audit API."
              onChange={change ? (range) => change({ range }) : undefined}
              value={filters.range}
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
          state={model}
        />
      </AdminListCard>
    </section>
  );
}

function auditColumns(
  onAction?: (action: AuditAction) => void,
): readonly TableColumn<AuditEvent>[] {
  return [
    {
      header: "When",
      cell: (row) => {
        const text = formatAdminDateTime(row.atUtc);
        return text ? (
          <time dateTime={row.atUtc}>{text}</time>
        ) : (
          <span className="text-fg-subtle">Not recorded</span>
        );
      },
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
        <Badge tone={tones[row.outcome]}>
          {row.outcome === "unknown" ? "Unknown" : row.outcome}
        </Badge>
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
        <Button
          disabled={!onAction}
          onClick={() => onAction?.({ eventId: row.id, type: "viewDetails" })}
          size="sm"
          variant="ghost"
        >
          Details
        </Button>
      ),
    },
  ];
}
