"use client";

import {
  Badge,
  Button,
  SearchInput,
  type BadgeTone,
  type TableColumn,
} from "@template/ui-core";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  AdminForbidden,
  AdminListCard,
  AdminListPager,
  AdminListTable,
} from "@/components/admin-patterns";
import type {
  AdminProvider,
  ProviderAction,
  ProviderStatus,
  ProvidersModel,
} from "./providers-model";

const statusTone: Readonly<Record<ProviderStatus, BadgeTone>> = {
  operational: "success",
  degraded: "warning",
  inactive: "neutral",
  unknown: "neutral",
};

export function ProvidersScreen({
  model,
  onAction,
  onPageChange,
}: Readonly<{
  model: ProvidersModel;
  onAction?: (action: ProviderAction) => void;
  onPageChange?: (page: number) => void;
}>) {
  if (model.state === "forbidden")
    return <AdminForbidden resourceLabel="Providers" />;
  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        title="Providers"
        description="Provider availability and supported capabilities. Sensitive configuration is never displayed."
      />
      <AdminListCard
        title="Provider directory"
        toolbar={
          <SearchInput
            aria-label="Search providers"
            disabled
            placeholder="Search providers"
          />
        }
        footer={
          <AdminListPager
            label="Provider pages"
            onPageChange={onPageChange}
            state={model}
          />
        }
      >
        <AdminListTable
          caption="Providers"
          columns={providerColumns(onAction)}
          emptyTitle="No providers"
          keyField={(row) => row.id}
          loadingLabel="Loading providers"
          onPageChange={onPageChange}
          state={model}
        />
      </AdminListCard>
    </section>
  );
}

function providerColumns(
  onAction?: (action: ProviderAction) => void,
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
        <Badge tone={statusTone[row.status]}>
          {row.status === "unknown" ? "Unknown" : row.status}
        </Badge>
      ),
    },
    {
      header: "Capabilities",
      cell: (row) =>
        row.capabilities.length ? (
          row.capabilities.join(", ")
        ) : (
          <span className="text-fg-subtle">Not reported</span>
        ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="grid justify-items-end gap-1">
          <Button
            disabled={!onAction}
            onClick={() =>
              onAction?.({ providerId: row.id, type: "makeActive" })
            }
            size="sm"
            variant="secondary"
          >
            Make active
          </Button>
          {!onAction ? (
            <span className="text-caption text-fg-subtle">
              Management is unavailable.
            </span>
          ) : null}
        </div>
      ),
    },
  ];
}
