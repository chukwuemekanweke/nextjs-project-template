import {
  ChartFrame,
  chartColors,
  chartSeriesColor,
  type ChartSeries,
} from "@template/dashboard-ui/charts";
import type { ReactNode } from "react";
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  categoryBand,
  chartScaleMax,
  gridLines,
  groupedBars,
  linePath,
  type ChartValue,
} from "./chart-geometry";
import {
  ChartPeriodPicker,
  type AdminChartSelection,
} from "./chart-period-picker";

/*
 * Admin chart section: `ChartFrame` (title, legend, state, text summary)
 * plus a small token-coloured SVG and a visually hidden data table, so the
 * figures are available without the picture. No charting library (TD-10).
 */

export type AdminChartSeries = Readonly<{
  label: string;
  /** Theme series colour 1–4. */
  series: ChartSeries;
  /** One value per category; `null` is a missing point, never zero. */
  values: readonly ChartValue[];
}>;

export type AdminChartData =
  | Readonly<{
      state: "ready";
      /** Category labels (x axis), for example UTC dates. */
      categories: readonly string[];
      series: readonly AdminChartSeries[];
      /** Text alternative: what the chart shows and its key takeaway. */
      summary: string;
    }>
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "empty"; message?: string }>
  | Readonly<{ state: "unavailable"; reason: string }>
  | Readonly<{ state: "error"; message: string }>;

export type AdminChartKind = "line" | "bars";

export function AdminChartSection({
  actions,
  data,
  description,
  formatValue = String,
  kind,
  onRetry,
  selection,
  title,
}: Readonly<{
  /** Header actions, for example a link to an implemented report route. */
  actions?: ReactNode;
  data: AdminChartData;
  description?: ReactNode;
  /** Formats values in the accessible data table. */
  formatValue?: (value: number) => string;
  kind: AdminChartKind;
  onRetry?: () => void;
  selection?: AdminChartSelection;
  title: string;
}>) {
  const selectedIndex =
    data.state === "ready" && selection?.selected
      ? data.categories.indexOf(selection.selected)
      : -1;
  const frameState = data.state === "unavailable" ? "empty" : data.state;
  const showLegend =
    data.state === "ready" && (kind === "bars" || data.series.length > 1);

  return (
    <div className="min-w-0" data-chart={title} data-state={data.state}>
      <ChartFrame
        actions={data.state === "ready" ? actions : undefined}
        description={description}
        emptyMessage={
          data.state === "unavailable"
            ? data.reason
            : data.state === "empty"
              ? (data.message ?? "No data for this period.")
              : undefined
        }
        errorMessage={data.state === "error" ? data.message : undefined}
        legend={
          showLegend
            ? data.series.map(({ label, series }) => ({ label, series }))
            : undefined
        }
        onRetry={onRetry}
        state={frameState}
        summary={chartSummary(title, data)}
        title={title}
      >
        {data.state === "ready" ? (
          kind === "line" ? (
            <LinePlot
              categoryCount={data.categories.length}
              selectedIndex={selectedIndex}
              series={data.series}
            />
          ) : (
            <BarPlot
              categoryCount={data.categories.length}
              selectedIndex={selectedIndex}
              series={data.series}
            />
          )
        ) : null}
      </ChartFrame>
      {data.state === "ready" && selection ? (
        <ChartPeriodPicker
          categories={data.categories}
          selectedIndex={selectedIndex}
          selection={selection}
        />
      ) : null}
      {data.state === "ready" ? (
        <ChartDataTable
          categories={data.categories}
          formatValue={formatValue}
          series={data.series}
          title={title}
        />
      ) : null}
    </div>
  );
}

/** The figure caption for each state; ready charts use the data summary. */
export function chartSummary(title: string, data: AdminChartData): string {
  switch (data.state) {
    case "ready":
      return data.summary;
    case "loading":
      return `${title}: loading.`;
    case "empty":
      return `${title}: ${data.message ?? "no data for this period."}`;
    case "unavailable":
      return `${title}: not available. ${data.reason}`;
    case "error":
      return `${title}: could not be loaded.`;
  }
}

function SelectedBand({
  categoryCount,
  index,
  kind,
}: Readonly<{ categoryCount: number; index: number; kind: AdminChartKind }>) {
  if (index < 0) {
    return null;
  }
  const band = categoryBand(index, categoryCount, kind);
  return (
    <rect
      data-selected-band=""
      fill={chartColors.area}
      height={CHART_HEIGHT}
      width={band.width}
      x={band.x}
      y={0}
    />
  );
}

function LinePlot({
  categoryCount,
  selectedIndex,
  series,
}: Readonly<{
  categoryCount: number;
  selectedIndex: number;
  series: readonly AdminChartSeries[];
}>) {
  const max = chartScaleMax(series.map(({ values }) => values));
  return (
    <svg
      preserveAspectRatio="none"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
    >
      <SelectedBand
        categoryCount={categoryCount}
        index={selectedIndex}
        kind="line"
      />
      <Grid />
      {series.map(({ label, series: colour, values }) => (
        <path
          d={linePath(values, max)}
          fill="none"
          key={label}
          stroke={chartSeriesColor(colour)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function BarPlot({
  categoryCount,
  selectedIndex,
  series,
}: Readonly<{
  categoryCount: number;
  selectedIndex: number;
  series: readonly AdminChartSeries[];
}>) {
  const max = chartScaleMax(series.map(({ values }) => values));
  const bars = groupedBars(
    series.map(({ values }) => values),
    categoryCount,
    max,
  );
  return (
    <svg
      preserveAspectRatio="none"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
    >
      <SelectedBand
        categoryCount={categoryCount}
        index={selectedIndex}
        kind="bars"
      />
      <Grid />
      {bars.map((bar) => (
        <rect
          fill={chartSeriesColor(series[bar.series]?.series ?? 1)}
          height={bar.height}
          key={`${bar.category}-${bar.series}`}
          rx={3}
          width={bar.width}
          x={bar.x}
          y={bar.y}
        />
      ))}
    </svg>
  );
}

function Grid() {
  return (
    <g stroke={chartColors.grid} strokeWidth={1}>
      {gridLines().map((y) => (
        <line
          key={y}
          vectorEffect="non-scaling-stroke"
          x1={0}
          x2={CHART_WIDTH}
          y1={y}
          y2={y}
        />
      ))}
    </g>
  );
}

/** Visually hidden table with every plotted value ("Not reported" gaps). */
function ChartDataTable({
  categories,
  formatValue,
  series,
  title,
}: Readonly<{
  categories: readonly string[];
  formatValue: (value: number) => string;
  series: readonly AdminChartSeries[];
  title: string;
}>) {
  return (
    <table className="sr-only">
      <caption>{title} data</caption>
      <thead>
        <tr>
          <th scope="col">Period</th>
          {series.map(({ label }) => (
            <th key={label} scope="col">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {categories.map((category, index) => (
          <tr key={category}>
            <th scope="row">{category}</th>
            {series.map(({ label, values }) => {
              const value = values[index];
              return (
                <td key={label}>
                  {value === null || value === undefined
                    ? "Not reported"
                    : formatValue(value)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
