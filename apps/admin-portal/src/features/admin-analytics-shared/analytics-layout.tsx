"use client";

import type { ReactNode } from "react";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Select,
} from "@template/ui-core";
import {
  AdminChartSection,
  AdminFilterBar,
  AdminKpiCard,
  AdminKpiGrid,
  AdminRangeFilter,
  type AdminChartData,
  type AdminChartKind,
  type AdminMetric,
  type AdminRangePreset,
  type UtcDateRange,
} from "@/components/admin-patterns";

export type AnalyticsMetric = Readonly<{
  id: string;
  label: string;
  metric: AdminMetric;
}>;

export type AnalyticsChart = Readonly<{
  id: string;
  title: string;
  description?: string;
  kind: AdminChartKind;
  data: AdminChartData;
  formatValue?: (value: number) => string;
}>;

export function AnalyticsScreenLayout({
  actions,
  charts,
  children,
  description,
  filters,
  metrics,
  title,
}: Readonly<{
  actions?: ReactNode;
  charts: readonly AnalyticsChart[];
  children?: ReactNode;
  description: string;
  filters?: ReactNode;
  metrics: readonly AnalyticsMetric[];
  title: string;
}>) {
  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        actions={actions}
        description={description}
        title={title}
      />
      {filters ? (
        <Card>
          <CardContent>
            <AdminFilterBar label={`${title} filters`}>
              {filters}
            </AdminFilterBar>
          </CardContent>
        </Card>
      ) : null}
      <AdminKpiGrid>
        {metrics.map((item) => (
          <AdminKpiCard key={item.id} label={item.label} metric={item.metric} />
        ))}
      </AdminKpiGrid>
      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        {charts.map((chart) => (
          <AdminChartSection
            data={chart.data}
            description={chart.description}
            formatValue={chart.formatValue}
            key={chart.id}
            kind={chart.kind}
            title={chart.title}
          />
        ))}
      </div>
      {children}
    </section>
  );
}

export function AnalyticsRangeControl({
  disabledReason,
  onChange,
  range,
  value,
}: Readonly<{
  disabledReason?: string;
  onChange?: (value: AdminRangePreset) => void;
  range?: UtcDateRange;
  value: AdminRangePreset;
}>) {
  return (
    <AdminRangeFilter
      disabledReason={disabledReason}
      onChange={onChange}
      range={range}
      value={value}
    />
  );
}

export function AnalyticsSelect<T extends string>({
  disabledReason,
  label,
  onChange,
  options,
  value,
}: Readonly<{
  disabledReason?: string;
  label: string;
  onChange?: (value: T) => void;
  options: readonly Readonly<{ label: string; value: T }>[];
  value: T;
}>) {
  const id = `analytics-${label.toLowerCase().replaceAll(" ", "-")}`;
  const disabled = !onChange;
  return (
    <FormField
      className="min-w-[150px] flex-[1_1_150px] md:flex-none"
      hint={disabled ? disabledReason : undefined}
      inputId={id}
      label={label}
    >
      <Select
        disabled={disabled}
        id={id}
        onChange={(event) => onChange?.(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

export function AnalyticsBreakdownCard({
  children,
  title,
}: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h3">{title}</CardTitle>
      </CardHeader>
      {children}
    </Card>
  );
}
