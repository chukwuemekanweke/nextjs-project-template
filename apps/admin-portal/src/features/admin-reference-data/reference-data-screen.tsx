"use client";

import { Badge, SearchInput, Tabs, type TableColumn } from "@template/ui-core";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  AdminForbidden,
  AdminListCard,
  AdminListPager,
  AdminListTable,
} from "@/components/admin-patterns";
import type {
  ReferenceDataCategory,
  ReferenceDataModel,
  ReferenceDataRow,
} from "./reference-data-model";

export function ReferenceDataScreen({
  category,
  model,
  onCategoryChange,
  onPageChange,
}: Readonly<{
  category: ReferenceDataCategory;
  model: ReferenceDataModel;
  onCategoryChange?: (category: ReferenceDataCategory) => void;
  onPageChange?: (page: number) => void;
}>) {
  if (model.state === "forbidden")
    return <AdminForbidden resourceLabel="Reference data" />;
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
            <Tabs
              ariaLabel="Reference-data category"
              items={[
                { content: null, label: "Countries", value: "countries" },
                { content: null, label: "Languages", value: "languages" },
                { content: null, label: "Currencies", value: "currencies" },
              ]}
              onValueChange={onCategoryChange}
              panelClassName="hidden"
              value={category}
            />
            <SearchInput
              aria-label="Search reference data"
              disabled
              placeholder="Search reference data"
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
          caption={`${category} reference data`}
          columns={referenceColumns(category)}
          emptyTitle={`No ${category}`}
          keyField={(row) => row.id}
          loadingLabel={`Loading ${category}`}
          onPageChange={onPageChange}
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
      header:
        category === "countries"
          ? "Country"
          : category === "languages"
            ? "Language"
            : "Currency",
      cell: (row) => row.name,
    },
  ];
  if (category === "countries")
    columns.push(
      { header: "Currency", cell: (row) => row.currency ?? "Not available" },
      { header: "Dial code", cell: (row) => row.dialCode ?? "Not available" },
    );
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
