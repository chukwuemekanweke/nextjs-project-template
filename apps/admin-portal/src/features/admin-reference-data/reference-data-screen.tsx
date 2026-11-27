"use client";

import { useId } from "react";
import { Badge, Tabs, type TableColumn } from "@template/ui-core";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  AdminForbidden,
  AdminListCard,
  AdminListPager,
  AdminListTable,
  AdminSearchFilter,
  AdminUnavailableHint,
} from "@/components/admin-patterns";
import {
  REFERENCE_DATA_CATEGORIES,
  type ReferenceDataCategory,
  type ReferenceDataFilters,
  type ReferenceDataModel,
  type ReferenceDataRow,
} from "./reference-data-model";

const categoryLabels: Readonly<Record<ReferenceDataCategory, string>> = {
  countries: "Countries",
  currencies: "Currencies",
  languages: "Languages",
};

const singularLabels: Readonly<Record<ReferenceDataCategory, string>> = {
  countries: "Country",
  currencies: "Currency",
  languages: "Language",
};

const CATEGORY_UNAVAILABLE =
  "Switching categories needs an admin reference-data API.";

/**
 * Read-only reference data (reference `AdminReferenceDataPage`). The
 * category, search and page are controlled by the caller.
 */
export function ReferenceDataScreen({
  category,
  filters,
  model,
  onCategoryChange,
  onFiltersChange,
  onPageChange,
  onRetry,
}: Readonly<{
  category: ReferenceDataCategory;
  filters: ReferenceDataFilters;
  model: ReferenceDataModel;
  onCategoryChange?: (category: ReferenceDataCategory) => void;
  onFiltersChange?: (filters: ReferenceDataFilters) => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
}>) {
  const categoryHintId = useId();
  if (model.state === "forbidden") {
    return (
      <AdminForbidden
        permission={model.permission}
        requestDetails={model.requestDetails}
        resourceLabel="Reference data"
      />
    );
  }
  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        title="Reference data"
        description="Backend-owned lookup values. This administration view is read-only."
      />
      <AdminListCard
        title="Reference values"
        toolbar={
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Tabs
                ariaLabel="Reference-data category"
                items={REFERENCE_DATA_CATEGORIES.map((value) => ({
                  content: null,
                  disabled: !onCategoryChange && value !== category,
                  label: categoryLabels[value],
                  value,
                }))}
                onValueChange={onCategoryChange}
                panelClassName="hidden"
                value={category}
              />
              {onCategoryChange ? null : (
                <AdminUnavailableHint id={categoryHintId}>
                  {CATEGORY_UNAVAILABLE}
                </AdminUnavailableHint>
              )}
            </div>
            <AdminSearchFilter
              label="Search reference data"
              onChange={
                onFiltersChange
                  ? (query) => onFiltersChange({ query })
                  : undefined
              }
              placeholder="Code or name"
              value={filters.query}
            />
          </div>
        }
        footer={
          <AdminListPager
            label="Reference-data pages"
            onPageChange={onPageChange}
            state={model}
          />
        }
      >
        <AdminListTable
          caption={`${categoryLabels[category]} reference data`}
          columns={referenceColumns(category)}
          emptyTitle={`No ${category}`}
          keyField={(row) => row.id}
          loadingLabel={`Loading ${category}`}
          onPageChange={onPageChange}
          onRetry={onRetry}
          state={model}
        />
      </AdminListCard>
    </section>
  );
}
function referenceColumns(
  category: ReferenceDataCategory,
): readonly TableColumn<ReferenceDataRow>[] {
  const columns: TableColumn<ReferenceDataRow>[] = [
    {
      header: "Code",
      cell: (row) => <span className="font-mono">{row.code}</span>,
    },
    {
      header: singularLabels[category],
      cell: (row) => row.name,
    },
  ];
  if (category === "countries") {
    columns.push(
      { header: "Currency", cell: (row) => row.currency ?? "Not available" },
      { header: "Dial code", cell: (row) => row.dialCode ?? "Not available" },
    );
  }
  columns.push({
    header: "Status",
    cell: (row) =>
      row.status ? (
        <Badge tone={row.status === "Active" ? "success" : "neutral"}>
          {row.status}
        </Badge>
      ) : (
        <span className="text-fg-subtle">Not reported</span>
      ),
  });
  return columns;
}
