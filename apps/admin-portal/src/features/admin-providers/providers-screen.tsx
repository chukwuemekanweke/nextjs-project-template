"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  type BadgeTone,
  type TableColumn,
} from "@template/ui-core";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  ADMIN_ACTION_UNAVAILABLE,
  AdminForbidden,
  AdminListCard,
  AdminListPager,
  AdminListTable,
  AdminSearchFilter,
} from "@/components/admin-patterns";
import {
  PROVIDER_ACTION_TYPES,
  canRequestProviderAction,
  type AdminProvider,
  type ProviderAction,
  type ProviderActionType,
  type ProviderFilters,
  type ProviderStatus,
  type ProvidersModel,
} from "./providers-model";

const statusTone: Readonly<Record<ProviderStatus, BadgeTone>> = {
  degraded: "warning",
  inactive: "neutral",
  operational: "success",
  unknown: "neutral",
};

const statusLabel: Readonly<Record<ProviderStatus, string>> = {
  degraded: "Degraded",
  inactive: "Inactive",
  operational: "Operational",
  unknown: "Unknown",
};

const actionLabels: Readonly<Record<ProviderActionType, string>> = {
  configure: "Configure",
  makeActive: "Make active",
  test: "Test",
};

/**
 * Provider directory (reference `AdminProvidersPage`). Each operation is
 * enabled only when `onAction` is supplied and the record reports it as
 * available; operations with a confirmation are captured and re-checked
 * against the current record before the intent is reported. Outcomes come
 * back through the model; nothing is assumed to succeed.
 */
export function ProvidersScreen({
  filters,
  model,
  onAction,
  onFiltersChange,
  onPageChange,
  onRetry,
}: Readonly<{
  filters: ProviderFilters;
  model: ProvidersModel;
  onAction?: (action: ProviderAction) => void;
  onFiltersChange?: (filters: ProviderFilters) => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
}>) {
  const [captured, setCaptured] = useState<ProviderAction | null>(null);

  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.requestDetails}
        resourceLabel="Providers"
      />
    );
  }

  const capturedProvider =
    captured && model.state === "ready"
      ? model.rows.find((row) => row.id === captured.providerId)
      : undefined;
  const confirmation =
    captured && capturedProvider
      ? capturedProvider.actions[captured.type].confirmation
      : undefined;

  function requestAction(action: ProviderAction, provider: AdminProvider) {
    if (provider.actions[action.type].confirmation) {
      setCaptured(action);
      return;
    }
    onAction?.(action);
  }

  function confirmCaptured() {
    if (
      captured &&
      capturedProvider &&
      canRequestProviderAction(capturedProvider, captured.type)
    ) {
      onAction?.(captured);
    }
    setCaptured(null);
  }

  function changeQuery(query: string) {
    onFiltersChange?.({ query });
  }

  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        description="Provider availability and supported capabilities. Sensitive configuration is never displayed."
        title="Providers"
      />
      <AdminListCard
        footer={
          <AdminListPager
            label="Provider pages"
            onPageChange={onPageChange}
            state={model}
          />
        }
        title="Provider directory"
        toolbar={
          <AdminSearchFilter
            label="Search providers"
            onChange={onFiltersChange ? changeQuery : undefined}
            placeholder="Provider name"
            value={filters.query}
          />
        }
      >
        <AdminListTable
          caption="Providers"
          columns={providerColumns(onAction ? requestAction : undefined)}
          emptyTitle="No providers"
          keyField={(row) => row.id}
          loadingLabel="Loading providers"
          onPageChange={onPageChange}
          onRetry={onRetry}
          state={model}
        />
      </AdminListCard>
      {captured && confirmation ? (
        <ConfirmDialog
          confirmLabel={confirmation.confirmLabel}
          description={confirmation.description}
          onCancel={() => setCaptured(null)}
          onConfirm={confirmCaptured}
          open
          title={confirmation.title}
        />
      ) : null}
    </section>
  );
}

function providerColumns(
  onRequest?: (action: ProviderAction, provider: AdminProvider) => void,
): readonly TableColumn<AdminProvider>[] {
  return [
    {
      header: "Provider",
      cell: (row) => (
        <div>
          <p className="text-fg font-semibold">{row.name}</p>
          <p className="text-small text-fg-muted">
            {row.description ??
              (row.category === "payment"
                ? "Payment provider"
                : "Service provider")}
          </p>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (row) => (row.category === "payment" ? "Payment" : "Service"),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
      ),
    },
    {
      header: "Capabilities",
      cell: (row) =>
        row.capabilities.length > 0 ? (
          row.capabilities.join(", ")
        ) : (
          <span className="text-fg-subtle">Not reported</span>
        ),
    },
    {
      align: "right",
      header: "Actions",
      cell: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          {PROVIDER_ACTION_TYPES.map((type) => (
            <ProviderActionButton
              key={type}
              onRequest={onRequest}
              provider={row}
              type={type}
            />
          ))}
        </div>
      ),
    },
  ];
}

function ProviderActionButton({
  onRequest,
  provider,
  type,
}: Readonly<{
  onRequest?: (action: ProviderAction, provider: AdminProvider) => void;
  provider: AdminProvider;
  type: ProviderActionType;
}>) {
  const availability = provider.actions[type];
  const pending = availability.state === "available" && availability.pending;
  let reason: string | undefined;
  if (availability.state === "unavailable") {
    reason = availability.reason;
  } else if (!onRequest) {
    reason = ADMIN_ACTION_UNAVAILABLE;
  }
  const enabled =
    Boolean(onRequest) && canRequestProviderAction(provider, type);

  return (
    <div className="grid justify-items-end gap-1">
      <Button
        aria-label={`${actionLabels[type]} ${provider.name}`}
        disabled={!enabled}
        loading={pending}
        onClick={() => onRequest?.({ providerId: provider.id, type }, provider)}
        size="sm"
        variant="secondary"
      >
        {actionLabels[type]}
      </Button>
      {reason ? (
        <span className="text-caption text-fg-subtle">{reason}</span>
      ) : null}
    </div>
  );
}
