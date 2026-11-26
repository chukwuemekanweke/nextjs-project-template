/*
 * Pure geometry for the small admin SVG charts. Values are plotted in a
 * fixed `CHART_WIDTH` × `CHART_HEIGHT` viewBox that the chart frame
 * stretches; `null` marks a missing point (a gap, never zero).
 */

export const CHART_WIDTH = 600;
export const CHART_HEIGHT = 240;
const TOP_PADDING = 8;

export type ChartValue = number | null;

/** Largest plotted value rounded up to 1, 2, 2.5 or 5 × 10ⁿ (at least 1). */
export function chartScaleMax(
  series: readonly (readonly ChartValue[])[],
): number {
  const max = Math.max(
    0,
    ...series.flat().filter((value): value is number => value !== null),
  );
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (max <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

function yFor(value: number, max: number): number {
  const usable = CHART_HEIGHT - TOP_PADDING;
  return CHART_HEIGHT - (Math.max(0, value) / max) * usable;
}

/**
 * SVG path for a line through `values`, restarting after each missing point
 * so gaps stay visible. Returns "" when nothing can be drawn.
 */
export function linePath(values: readonly ChartValue[], max: number): string {
  const step = values.length > 1 ? CHART_WIDTH / (values.length - 1) : 0;
  let path = "";
  let drawing = false;
  values.forEach((value, index) => {
    if (value === null) {
      drawing = false;
      return;
    }
    const x = values.length > 1 ? index * step : CHART_WIDTH / 2;
    path += `${drawing ? "L" : "M"}${round(x)} ${round(yFor(value, max))} `;
    drawing = true;
  });
  return path.trim();
}

export type ChartBar = Readonly<{
  category: number;
  height: number;
  series: number;
  width: number;
  x: number;
  y: number;
}>;

/** Grouped bars: one group per category, one bar per series. */
export function groupedBars(
  series: readonly (readonly ChartValue[])[],
  categoryCount: number,
  max: number,
): ChartBar[] {
  if (categoryCount === 0 || series.length === 0) return [];
  const groupWidth = CHART_WIDTH / categoryCount;
  const gap = groupWidth * 0.25;
  const barWidth = (groupWidth - gap) / series.length;
  const bars: ChartBar[] = [];
  for (let category = 0; category < categoryCount; category += 1) {
    series.forEach((values, seriesIndex) => {
      const value = values[category];
      if (value === null || value === undefined) return;
      const y = yFor(value, max);
      bars.push({
        category,
        height: round(CHART_HEIGHT - y),
        series: seriesIndex,
        width: round(barWidth),
        x: round(category * groupWidth + gap / 2 + seriesIndex * barWidth),
        y: round(y),
      });
    });
  }
  return bars;
}

/** Horizontal gridline positions (quarters of the scale). */
export function gridLines(): number[] {
  return [0, 0.25, 0.5, 0.75, 1].map((fraction) =>
    round(CHART_HEIGHT - fraction * (CHART_HEIGHT - TOP_PADDING)),
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
