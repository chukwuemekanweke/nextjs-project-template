"use client";

import { Button, FormField, SearchInput, Select } from "@template/ui-core";
import { useId } from "react";
import {
  ADMIN_FILTERS_UNAVAILABLE,
  AdminFilterBar,
  AdminUnavailableHint,
  type AdminOption,
} from "@/components/admin-patterns";
import {
  ADMIN_KYC_STATUSES,
  kycStatusBadge,
} from "@/features/admin-kyc/kyc-model";
import {
  ADMIN_ACCOUNT_STATUSES,
  ADMIN_USER_SORTS,
  DEFAULT_ADMIN_USER_FILTERS,
  accountStatusBadge,
  adminUserSortLabels,
  hasActiveUserFilters,
  nextUserFilters,
  type AdminUserFilters,
} from "./users-model";

const statusOptions: readonly AdminOption[] = ADMIN_ACCOUNT_STATUSES.map(
  (status) => ({ label: accountStatusBadge(status).label, value: status }),
);

const kycOptions: readonly AdminOption[] = ADMIN_KYC_STATUSES.map((status) => ({
  label: kycStatusBadge(status).label,
  value: status,
}));

function FilterSelect({
  describedBy,
  disabled,
  label,
  onChange,
  options,
  value,
}: Readonly<{
  describedBy?: string;
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: readonly AdminOption[];
  value: string;
}>) {
  const id = useId();
  return (
    <FormField
      className="min-w-[150px] flex-[1_1_150px]"
      inputId={id}
      label={label}
    >
      <Select
        aria-describedby={describedBy}
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="any">Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

function parseStatusFilter(value: string): AdminUserFilters["status"] {
  return ADMIN_ACCOUNT_STATUSES.find((status) => status === value) ?? "any";
}

function parseKycFilter(value: string): AdminUserFilters["kyc"] {
  return ADMIN_KYC_STATUSES.find((status) => status === value) ?? "any";
}

/**
 * Search, the five reference filter menus and sort. Controlled: changes go
 * to `onFiltersChange`; without it every control is inert and explained.
 * Role and plan options are backend-owned; without them those menus stay
 * inert even when the others are wired.
 */
export function AdminUserFilterBar({
  filters,
  onFiltersChange,
  planOptions,
  roleOptions,
}: Readonly<{
  filters: AdminUserFilters;
  onFiltersChange?: (filters: AdminUserFilters) => void;
  planOptions?: readonly AdminOption[];
  roleOptions?: readonly AdminOption[];
}>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const inert = !onFiltersChange;
  const describedBy = inert ? hintId : undefined;

  function change<Key extends keyof AdminUserFilters>(
    key: Key,
    value: AdminUserFilters[Key],
  ) {
    const next = nextUserFilters(filters, key, value);
    if (next) {
      onFiltersChange?.(next);
    }
  }

  function clearFilters() {
    onFiltersChange?.({ ...DEFAULT_ADMIN_USER_FILTERS, sort: filters.sort });
  }

  function changeSort(value: string) {
    const sort = ADMIN_USER_SORTS.find((option) => option === value);
    if (sort) {
      change("sort", sort);
    }
  }

  return (
    <div className="grid gap-2">
      <AdminFilterBar label="User filters">
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
            onChange={(event) => change("query", event.target.value)}
            placeholder="Name, email or ID"
            value={filters.query}
          />
        </FormField>
        <FilterSelect
          describedBy={describedBy}
          disabled={inert}
          label="Status"
          onChange={(value) => change("status", parseStatusFilter(value))}
          options={statusOptions}
          value={filters.status}
        />
        <FilterSelect
          describedBy={describedBy}
          disabled={inert}
          label="KYC"
          onChange={(value) => change("kyc", parseKycFilter(value))}
          options={kycOptions}
          value={filters.kyc}
        />
        <FilterSelect
          describedBy={describedBy}
          disabled={inert || !roleOptions}
          label="Role"
          onChange={(value) => change("role", value)}
          options={roleOptions ?? []}
          value={filters.role}
        />
        <FilterSelect
          describedBy={describedBy}
          disabled={inert || !planOptions}
          label="Plan"
          onChange={(value) => change("plan", value)}
          options={planOptions ?? []}
          value={filters.plan}
        />
        <FormField
          className="min-w-[150px] flex-[1_1_150px]"
          inputId={`${id}-sort`}
          label="Sort"
        >
          <Select
            aria-describedby={describedBy}
            disabled={inert}
            id={`${id}-sort`}
            onChange={(event) => changeSort(event.target.value)}
            value={filters.sort}
          >
            {ADMIN_USER_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {adminUserSortLabels[sort]}
              </option>
            ))}
          </Select>
        </FormField>
        {onFiltersChange && hasActiveUserFilters(filters) ? (
          <Button onClick={clearFilters} variant="ghost">
            Clear filters
          </Button>
        ) : null}
      </AdminFilterBar>
      {inert ? (
        <AdminUnavailableHint id={hintId}>
          {ADMIN_FILTERS_UNAVAILABLE}
        </AdminUnavailableHint>
      ) : null}
    </div>
  );
}
