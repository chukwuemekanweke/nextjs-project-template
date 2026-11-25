import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeSelect, ThemeSwitch } from "@template/ui-core";
import type { ReactNode } from "react";
import { isFoundationsPreviewEnabled } from "@/lib/foundations-preview";
import {
  chartSpecimen,
  colorGroups,
  elevationScale,
  layerTokens,
  layoutTokens,
  radiusScale,
  sizeTokens,
  spacingScale,
  typeScale,
} from "./foundation-specimens";
import { TokenValue } from "./token-value";

export const metadata: Metadata = {
  title: "Foundations preview",
  robots: { follow: false, index: false },
};

/**
 * Development-only specimen of @template/ui-core/theme.css (reference:
 * design system 0-foundations/Main.html). Every colour, size and type style
 * comes from the production tokens; nothing is redefined here.
 */
export default function FoundationsPreviewPage() {
  if (!isFoundationsPreviewEnabled(process.env.NODE_ENV)) {
    notFound();
  }

  return (
    <main className="bg-bg pb-section text-fg pt-32">
      <div className="max-w-content px-page mx-auto flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <span className="eyebrow">Foundations</span>
          <h1 className="text-display">Project Template design system</h1>
          <p className="text-lead text-fg-muted max-w-3xl">
            Shared tokens from <code>@template/ui-core/theme.css</code>. Light
            keeps the blue-and-white theme; dark uses neutral greys with blue
            kept for primary actions, links and focus.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <ThemeSelect />
            <ThemeSwitch />
          </div>
        </header>

        {colorGroups.map((group) => (
          <Section key={group.title} title={group.title}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
              {group.tokens.map((token) => (
                <div
                  className="flex min-w-0 flex-col gap-1.5"
                  key={token.token}
                >
                  <div
                    className={`border-border h-16 rounded-md border ${token.className}`}
                  />
                  <b className="text-small font-medium">{token.label}</b>
                  <TokenValue token={token.token} />
                </div>
              ))}
            </div>
          </Section>
        ))}

        <Section title="Surface hierarchy">
          <div className="bg-bg p-card rounded-xl">
            <p className="text-small text-fg-subtle">bg</p>
            <div className="border-border bg-surface p-card mt-3 rounded-xl border shadow-xs">
              <p className="text-h3">Card on surface</p>
              <p className="text-small text-fg-muted">
                Secondary text on the card surface.
              </p>
              <div className="border-border bg-surface-2 mt-4 rounded-lg border p-4">
                <p className="text-label">Soft panel (surface-2)</p>
                <div className="bg-surface-3 text-small text-fg-muted mt-3 rounded-lg p-3">
                  Read-only well (surface-3)
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Status">
          <div className="flex flex-wrap gap-3">
            <StatusBadge className="bg-success-bg text-success" symbol="✓">
              Active
            </StatusBadge>
            <StatusBadge className="bg-warning-bg text-warning" symbol="!">
              Pending
            </StatusBadge>
            <StatusBadge className="bg-danger-bg text-danger" symbol="×">
              Failed
            </StatusBadge>
            <StatusBadge className="bg-info-bg text-info" symbol="i">
              Scheduled
            </StatusBadge>
            <StatusBadge className="bg-neutral-bg text-neutral" symbol="–">
              Cancelled
            </StatusBadge>
          </div>
          <p className="text-small text-fg-subtle">
            Status always pairs colour with a symbol and text.
          </p>
        </Section>

        <Section title="Type scale">
          <div className="flex flex-col">
            {typeScale.map((sample) => (
              <div
                className="border-border flex flex-wrap items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0"
                key={sample.name}
              >
                <span className={sample.className}>{sample.name}</span>
                <span className="text-mono text-fg-subtle font-mono">
                  {sample.spec}
                </span>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <p className="text-mono font-mono">
              Reference PUR-2026-000184 · JetBrains Mono 13
            </p>
            <table className="text-body">
              <tbody>
                <tr>
                  <td className="text-fg-muted pr-6">Monthly</td>
                  <td className="text-right">1,111.00</td>
                </tr>
                <tr>
                  <td className="text-fg-muted pr-6">Yearly</td>
                  <td className="text-right">11,880.50</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Spacing and sizes">
          <div className="flex flex-col gap-2">
            {spacingScale.map((step) => (
              <div className="flex items-center gap-3" key={step.name}>
                <span className="text-mono text-fg-subtle w-16 font-mono">
                  {step.name} · {step.px}
                </span>
                <span className={`bg-brand h-3 rounded-sm ${step.className}`} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-6">
            {sizeTokens.map((size) => (
              <div className="flex flex-col items-center gap-2" key={size.name}>
                <span
                  className={`border-control-border bg-brand-soft rounded-sm border border-dashed ${size.className}`}
                />
                <span className="text-caption text-fg-muted">
                  {size.name} · {size.spec}
                </span>
              </div>
            ))}
          </div>
          <TokenList
            rows={layoutTokens.map((token) => [token.name, token.spec])}
          />
        </Section>

        <Section title="Radius">
          <div className="flex flex-wrap gap-6">
            {radiusScale.map((radius) => (
              <div
                className="flex flex-col items-center gap-2"
                key={radius.name}
              >
                <span
                  className={`border-border-strong bg-surface-3 size-16 border ${radius.className}`}
                />
                <span className="text-caption text-fg-muted">
                  {radius.name} · {radius.spec}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Elevation and layers">
          <div className="bg-bg p-card grid gap-4 rounded-xl sm:grid-cols-3">
            {elevationScale.map((level) => (
              <div
                className={`border-border bg-surface p-card rounded-xl border ${level.className}`}
                key={level.name}
              >
                <p className="text-label">{level.name}</p>
                <p className="text-small text-fg-muted">{level.use}</p>
              </div>
            ))}
          </div>
          <p className="text-small text-fg-subtle">
            Dark theme relies on surface steps; shadow-xs and shadow-sm are
            none.
          </p>
          <TokenList
            rows={layerTokens.map((layer) => [
              layer.className,
              String(layer.value),
            ])}
          />
        </Section>

        <Section title="Charts">
          <ChartSpecimen />
          <div className="text-small text-fg-muted flex flex-wrap gap-4">
            {[
              ["bg-chart-1", "Successful"],
              ["bg-chart-2", "Comparison"],
              ["bg-chart-3", "Failed"],
              ["bg-chart-4", "Other"],
            ].map(([swatch, label]) => (
              <span className="inline-flex items-center gap-2" key={label}>
                <span className={`size-2.5 rounded-[3px] ${swatch}`} />
                {label}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Interaction states">
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="min-h-control bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-press inline-flex items-center rounded-md px-4.5 font-medium transition-colors"
              type="button"
            >
              Primary
            </button>
            <button
              className="min-h-control border-control-border bg-surface hover:bg-hover inline-flex items-center rounded-md border px-4.5 font-medium transition-colors"
              type="button"
            >
              Secondary
            </button>
            <button
              className="min-h-control bg-danger-solid text-on-danger inline-flex items-center rounded-md px-4.5 font-medium"
              type="button"
            >
              Destructive
            </button>
            <button
              className="min-h-control bg-brand text-on-brand inline-flex items-center rounded-md px-4.5 font-medium disabled:opacity-50"
              disabled
              type="button"
            >
              Disabled
            </button>
            <button
              aria-busy="true"
              className="min-h-control bg-brand text-on-brand inline-flex items-center gap-2 rounded-md px-4.5 font-medium opacity-80"
              type="button"
            >
              <span className="size-icon-xs border-on-brand animate-spin rounded-full border-2 border-t-transparent" />
              Saving…
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="preview-default" label="Default" value="Ada Okafor" />
            <Field
              id="preview-readonly"
              label="Read-only"
              readOnly
              value="ada@example.com"
            />
            <Field
              error="Enter a valid email address."
              id="preview-error"
              label="Error"
              value="abc"
            />
          </div>
          <p className="text-small text-fg-subtle">
            Tab through this page: every control shows the 2px focus ring.
          </p>
          <div className="border-border bg-surface relative h-24 overflow-hidden rounded-lg border">
            <p className="text-small p-4">Content under the scrim</p>
            <div className="bg-scrim text-label absolute inset-0 grid place-items-center text-white">
              Overlay scrim
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  children,
  title,
}: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <section className="border-border bg-surface p-card flex flex-col gap-5 rounded-xl border shadow-xs">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  );
}

function StatusBadge({
  children,
  className,
  symbol,
}: Readonly<{ children: ReactNode; className: string; symbol: string }>) {
  return (
    <span
      className={`text-caption inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${className}`}
    >
      <span aria-hidden="true">{symbol}</span>
      {children}
    </span>
  );
}

function TokenList({ rows }: Readonly<{ rows: string[][] }>) {
  return (
    <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
      {rows.map(([name, value]) => (
        <div
          className="border-border flex justify-between gap-4 border-b py-1.5"
          key={name}
        >
          <dt className="text-mono font-mono">{name}</dt>
          <dd className="text-small text-fg-muted">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Field({
  error,
  id,
  label,
  readOnly = false,
  value,
}: Readonly<{
  error?: string;
  id: string;
  label: string;
  readOnly?: boolean;
  value: string;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={`min-h-control text-body focus:border-brand read-only:bg-surface-3 read-only:text-fg-muted w-full rounded-md border px-3.5 focus:shadow-[0_0_0_4px_var(--color-brand-soft-2)] focus:outline-none ${
          error ? "border-danger" : "border-control-border bg-surface"
        }`}
        defaultValue={value}
        id={id}
        readOnly={readOnly}
      />
      {error ? (
        <span className="text-small text-danger" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function ChartSpecimen() {
  const width = 360;
  const height = 180;
  const max = 80;
  const step = width / chartSpecimen.bars.length;
  const y = (value: number) => height - (value / max) * height;
  const line = chartSpecimen.line
    .map((value, index) => `${index * step + step / 2},${y(value)}`)
    .join(" ");

  return (
    <svg
      aria-label="Chart palette specimen: grouped bars and a trend line"
      className="h-[180px] w-full max-w-xl"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line
          key={fraction}
          stroke="var(--color-grid)"
          x1="0"
          x2={width}
          y1={height * fraction}
          y2={height * fraction}
        />
      ))}
      {chartSpecimen.bars.map((group, groupIndex) =>
        group.map((value, seriesIndex) => (
          <rect
            fill={`var(--color-chart-${seriesIndex + 1})`}
            height={height - y(value)}
            key={`${groupIndex}-${seriesIndex}`}
            rx="3"
            width="10"
            x={groupIndex * step + 12 + seriesIndex * 12}
            y={y(value)}
          />
        )),
      )}
      <polygon
        fill="var(--color-chart-area)"
        points={`${step / 2},${height} ${line} ${width - step / 2},${height}`}
      />
      <polyline
        fill="none"
        points={line}
        stroke="var(--color-chart-4)"
        strokeWidth="2"
      />
    </svg>
  );
}
