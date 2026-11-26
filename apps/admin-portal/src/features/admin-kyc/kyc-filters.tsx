"use client";

import { FormField, SearchInput, Select } from "@template/ui-core";
import { useId } from "react";
import {
  ADMIN_FILTERS_UNAVAILABLE,
  AdminFilterBar,
  AdminRangeFilter,
  AdminUnavailableHint,
  type AdminOption,
  type AdminRangePreset,
} from "@/components/admin-patterns";
import {
  ADMIN_KYC_STATUSES,
  kycStatusBadge,
  parseAdminKycStatus,
  type AdminKycFilters,
} from "./kyc-model";

function parseStatusFilter(value: string): AdminKycFilters["status"] {
  return value === "any" ? "any" : parseAdminKycStatus(value);
}

function filtersChanged(current: AdminKycFilters, next: AdminKycFilters) {
  return (
    next.query !== current.query ||
    next.status !== current.status ||
    next.provider !== current.provider ||
    next.range !== current.range
  );
}

/** Search, status, provider and UTC period; inert without a handler. */
export function AdminKycFilterBar({
  filters,
  onFiltersChange,
  providerOptions,
}: Readonly<{
  filters: AdminKycFilters;
  onFiltersChange?: (filters: AdminKycFilters) => void;
  providerOptions?: readonly AdminOption[];
}>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const inert = !onFiltersChange;
  const describedBy = inert ? hintId : undefined;

  function change(update: Partial<AdminKycFilters>) {
    const next = { ...filters, ...update };
    if (filtersChanged(filters, next)) {
      onFiltersChange?.(next);
    }
  }

  function changeRange(range: AdminRangePreset) {
    change({ range });
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
              change({ status: parseStatusFilter(event.target.value) })
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
          onChange={onFiltersChange ? changeRange : undefined}
          value={filters.range}
        />
      </AdminFilterBar>
      {inert ? (
        <AdminUnavailableHint id={hintId}>
          {ADMIN_FILTERS_UNAVAILABLE}
        </AdminUnavailableHint>
      ) : null}
    </div>
  );
}
