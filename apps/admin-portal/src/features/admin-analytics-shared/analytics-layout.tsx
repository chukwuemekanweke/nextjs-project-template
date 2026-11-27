"use client";

import { useId, type ReactNode } from "react";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  cn,
} from "@template/ui-core";
import {
  ADMIN_FILTERS_UNAVAILABLE,
  AdminChartSection,
  AdminFilterBar,
  AdminForbidden,
  AdminKpiCard,
  AdminKpiGrid,
  AdminRangeFilter,
  AdminSectionBody,
  isValidUtcDateRange,
  type AdminChartData,
  type AdminChartKind,
  type AdminChartSelection,
  type AdminForbiddenState,
  type AdminMetric,
  type AdminOption,
  type AdminRangePreset,
  type AdminReportingRange,
  type AdminSection,
  type UtcDateRange,
} from "@/components/admin-patterns";

/** Screen-level read state: a section, or a backend 403 for the screen. */
export type AnalyticsScreenState<T> = AdminSection<T> | AdminForbiddenState;

/**
 * Renders `AdminForbidden` (with the backend's permission and safe request
 * details), the header plus a loading/error/unavailable card, or the ready
 * screen.
 */
export function AnalyticsScreenStateBoundary<T>({
  children,
  description,
  label,
  onRetry,
  state,
  title,
}: Readonly<{
  children: (data: T) => ReactNode;
  description: string;
  label: string;
  onRetry?: () => void;
  state: AnalyticsScreenState<T>;
  title: string;
}>) {
  if (state.state === "forbidden") {
    return (
      <AdminForbidden
        permission={state.permission}
        requestDetails={state.requestDetails}
        resourceLabel={label}
      />
    );
  }
  if (state.state === "ready") {
    return <>{children(state.data)}</>;
  }
  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader description={description} title={title} />
      <Card>
        <CardContent>
          <AdminSectionBody
            label={label.toLowerCase()}
            onRetry={onRetry}
            section={state}
          >
            {() => null}
          </AdminSectionBody>
        </CardContent>
      </Card>
    </section>
  );
}

export type AnalyticsMetric = Readonly<{
  id: string;
  label: string;
  metric: AdminMetric;
}>;

export type AnalyticsChart = Readonly<{
  id: string;
  title: string;
  description?: ReactNode;
  kind: AdminChartKind;
  data: AdminChartData;
  formatValue?: (value: number) => string;
  selection?: AdminChartSelection;
}>;

/** Header, filter card, KPI row and charts (full width when there is one). */
export function AnalyticsScreenLayout({
  actions,
  charts,
  children,
  description,
  filterNotice,
  filters,
  metrics,
  title,
}: Readonly<{
  actions?: ReactNode;
  charts: readonly AnalyticsChart[];
  children?: ReactNode;
  description: string;
  /** Status text under the filters, for example a reporting-context note. */
  filterNotice?: ReactNode;
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
          <CardContent className="grid gap-3">
            <AdminFilterBar label={`${title} filters`}>
              {filters}
            </AdminFilterBar>
            {filterNotice}
          </CardContent>
        </Card>
      ) : null}
      <AdminKpiGrid>
        {metrics.map((item) => (
          <AdminKpiCard key={item.id} label={item.label} metric={item.metric} />
        ))}
      </AdminKpiGrid>
      <div
        className={cn(
          "grid min-w-0 gap-5",
          charts.length > 1 && "xl:grid-cols-2",
        )}
      >
        {charts.map((chart) => (
          <AdminChartSection
            data={chart.data}
            description={chart.description}
            formatValue={chart.formatValue}
            key={chart.id}
            kind={chart.kind}
            selection={chart.selection}
            title={chart.title}
          />
        ))}
      </div>
      {children}
    </section>
  );
}

/**
 * Controlled select over source-supplied options. A value that is not one
 * of the options is never shown as selected, and only option values are
 * reported. `allLabel` adds an "all" choice with the value "". Without
 * `onChange`, or with a `disabledReason`, the select is inert and the
 * reason is linked with `aria-describedby`.
 */
export function AnalyticsSelect({
  allLabel,
  disabledReason,
  label,
  onChange,
  options,
  value,
}: Readonly<{
  allLabel?: string;
  disabledReason?: string;
  label: string;
  onChange?: (value: string) => void;
  options: readonly AdminOption[];
  value: string;
}>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const choices = allLabel
    ? [{ label: allLabel, value: "" }, ...options]
    : options;
  const reason = selectUnavailableReason(disabledReason, onChange, choices);
  const selected = choices.some((option) => option.value === value)
    ? value
    : undefined;

  function selectOption(next: string) {
    const option = choices.find((item) => item.value === next);
    if (option && option.value !== value) {
      onChange?.(option.value);
    }
  }

  return (
    <FormField
      className="min-w-[150px] flex-[1_1_150px] md:flex-none"
      descriptionId={reason ? hintId : undefined}
      hint={reason}
      inputId={id}
      label={label}
    >
      <Select
        aria-describedby={reason ? hintId : undefined}
        disabled={Boolean(reason)}
        id={id}
        onChange={(event) => selectOption(event.target.value)}
        value={selected ?? ""}
      >
        {selected === undefined ? (
          <option disabled value="">
            Select…
          </option>
        ) : null}
        {choices.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

function selectUnavailableReason(
  disabledReason: string | undefined,
  onChange: ((value: string) => void) | undefined,
  choices: readonly AdminOption[],
): string | undefined {
  if (disabledReason) {
    return disabledReason;
  }
  if (!onChange) {
    return ADMIN_FILTERS_UNAVAILABLE;
  }
  if (choices.length === 0) {
    return "No options to choose from.";
  }
  return undefined;
}

/** A reporting period: a preset, or explicit UTC dates when "custom". */
export type AnalyticsReportingPeriod = Readonly<{
  range: AdminReportingRange;
  customRange: UtcDateRange;
}>;

/**
 * Reporting-period preset plus, when "custom" is chosen, inclusive UTC
 * start and end dates. Only a valid range (real dates, start ≤ end) is
 * reported; `reportedRange` is the range the shown figures cover.
 */
export function AnalyticsReportingPeriodFields({
  disabledReason,
  onChange,
  reportedRange,
  value,
}: Readonly<{
  disabledReason?: string;
  onChange?: (value: AnalyticsReportingPeriod) => void;
  reportedRange?: UtcDateRange;
  value: AnalyticsReportingPeriod;
}>) {
  function selectPreset(range: AdminRangePreset) {
    onChange?.({ ...value, range });
  }

  function selectCustom() {
    onChange?.({ ...value, range: "custom" });
  }

  function changeCustomRange(customRange: UtcDateRange) {
    onChange?.({ ...value, customRange });
  }

  return (
    <>
      <AdminRangeFilter
        disabledReason={disabledReason ?? ADMIN_FILTERS_UNAVAILABLE}
        onChange={onChange ? selectPreset : undefined}
        onSelectCustom={onChange ? selectCustom : undefined}
        range={reportedRange}
        value={value.range}
      />
      {value.range === "custom" ? (
        <UtcDateRangeFields
          onChange={onChange ? changeCustomRange : undefined}
          value={value.customRange}
        />
      ) : null}
    </>
  );
}

function UtcDateRangeFields({
  onChange,
  value,
}: Readonly<{
  onChange?: (value: UtcDateRange) => void;
  value: UtcDateRange;
}>) {
  const id = useId();
  const hint = onChange ? "UTC calendar date" : ADMIN_FILTERS_UNAVAILABLE;

  function changeDate(part: keyof UtcDateRange, next: string) {
    const candidate = { ...value, [part]: next };
    if (isValidUtcDateRange(candidate)) {
      onChange?.(candidate);
    }
  }

  return (
    <>
      <FormField
        descriptionId={`${id}-start-hint`}
        hint={hint}
        inputId={`${id}-start`}
        label="Start date"
      >
        <Input
          aria-describedby={`${id}-start-hint`}
          disabled={!onChange}
          id={`${id}-start`}
          max={value.end}
          onChange={(event) => changeDate("start", event.target.value)}
          type="date"
          value={value.start}
        />
      </FormField>
      <FormField
        descriptionId={`${id}-end-hint`}
        hint={hint}
        inputId={`${id}-end`}
        label="End date"
      >
        <Input
          aria-describedby={`${id}-end-hint`}
          disabled={!onChange}
          id={`${id}-end`}
          min={value.start}
          onChange={(event) => changeDate("end", event.target.value)}
          type="date"
          value={value.end}
        />
      </FormField>
    </>
  );
}
