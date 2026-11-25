// Specimen data for the development-only foundations preview (token names,
// specs, a static chart series). Not API fixtures. Values are
// never duplicated here: swatches render the real utilities and read the
// computed value from @template/ui-core/theme.css at runtime. The literal
// class names below also let Tailwind generate the utilities.

export type ColorToken = Readonly<{
  className: string;
  label: string;
  token: `--color-${string}`;
}>;

export type ColorGroup = Readonly<{
  title: string;
  tokens: readonly ColorToken[];
}>;

export const colorGroups: readonly ColorGroup[] = [
  {
    title: "Surfaces",
    tokens: [
      { className: "bg-bg", label: "Background", token: "--color-bg" },
      { className: "bg-surface", label: "Surface", token: "--color-surface" },
      {
        className: "bg-surface-2",
        label: "Surface 2",
        token: "--color-surface-2",
      },
      {
        className: "bg-surface-3",
        label: "Surface 3",
        token: "--color-surface-3",
      },
      { className: "bg-hover", label: "Hover", token: "--color-hover" },
      {
        className: "bg-surface-selected",
        label: "Selected",
        token: "--color-surface-selected",
      },
      { className: "bg-nav-bg", label: "Navigation", token: "--color-nav-bg" },
      {
        className: "bg-nav-active-bg",
        label: "Active navigation",
        token: "--color-nav-active-bg",
      },
    ],
  },
  {
    title: "Text and borders",
    tokens: [
      { className: "bg-fg", label: "Text", token: "--color-fg" },
      {
        className: "bg-fg-muted",
        label: "Text secondary",
        token: "--color-fg-muted",
      },
      {
        className: "bg-fg-subtle",
        label: "Text tertiary",
        token: "--color-fg-subtle",
      },
      { className: "bg-border", label: "Border", token: "--color-border" },
      {
        className: "bg-border-strong",
        label: "Border strong",
        token: "--color-border-strong",
      },
      {
        className: "bg-control-border",
        label: "Control border",
        token: "--color-control-border",
      },
    ],
  },
  {
    title: "Brand",
    tokens: [
      { className: "bg-brand", label: "Brand", token: "--color-brand" },
      {
        className: "bg-brand-hover",
        label: "Brand hover",
        token: "--color-brand-hover",
      },
      {
        className: "bg-brand-press",
        label: "Brand pressed",
        token: "--color-brand-press",
      },
      {
        className: "bg-brand-soft",
        label: "Brand soft",
        token: "--color-brand-soft",
      },
      {
        className: "bg-brand-soft-2",
        label: "Brand soft 2",
        token: "--color-brand-soft-2",
      },
      {
        className: "bg-brand-ink",
        label: "Brand ink (links)",
        token: "--color-brand-ink",
      },
      { className: "bg-focus", label: "Focus", token: "--color-focus" },
    ],
  },
  {
    title: "Status",
    tokens: [
      { className: "bg-success", label: "Success", token: "--color-success" },
      {
        className: "bg-success-bg",
        label: "Success background",
        token: "--color-success-bg",
      },
      { className: "bg-warning", label: "Warning", token: "--color-warning" },
      {
        className: "bg-warning-bg",
        label: "Warning background",
        token: "--color-warning-bg",
      },
      { className: "bg-danger", label: "Danger", token: "--color-danger" },
      {
        className: "bg-danger-bg",
        label: "Danger background",
        token: "--color-danger-bg",
      },
      {
        className: "bg-danger-solid",
        label: "Danger solid",
        token: "--color-danger-solid",
      },
      { className: "bg-info", label: "Information", token: "--color-info" },
      {
        className: "bg-info-bg",
        label: "Information background",
        token: "--color-info-bg",
      },
      {
        className: "bg-neutral-bg",
        label: "Neutral background",
        token: "--color-neutral-bg",
      },
      { className: "bg-scrim", label: "Scrim", token: "--color-scrim" },
    ],
  },
  {
    title: "Charts",
    tokens: [
      { className: "bg-chart-1", label: "Chart 1", token: "--color-chart-1" },
      { className: "bg-chart-2", label: "Chart 2", token: "--color-chart-2" },
      { className: "bg-chart-3", label: "Chart 3", token: "--color-chart-3" },
      { className: "bg-chart-4", label: "Chart 4", token: "--color-chart-4" },
      { className: "bg-grid", label: "Grid", token: "--color-grid" },
      {
        className: "bg-chart-axis",
        label: "Axis labels",
        token: "--color-chart-axis",
      },
      {
        className: "bg-chart-area",
        label: "Area fill",
        token: "--color-chart-area",
      },
    ],
  },
];

export type TypeSample = Readonly<{
  className: string;
  name: string;
  spec: string;
}>;

export const typeScale: readonly TypeSample[] = [
  { className: "text-display", name: "Display", spec: "56 / 600 (phone 38)" },
  { className: "text-section", name: "Section", spec: "36 / 600 (phone 26)" },
  { className: "text-h1", name: "Heading 1", spec: "28 / 600 (phone 24)" },
  { className: "text-h2", name: "Heading 2", spec: "20 / 600 (phone 18)" },
  { className: "text-h3", name: "Heading 3", spec: "16 / 600" },
  { className: "text-lead", name: "Lead", spec: "19 / 400 (phone 17)" },
  { className: "text-body", name: "Body", spec: "15 / 400" },
  { className: "text-label", name: "Label", spec: "14 / 500" },
  { className: "text-small", name: "Small", spec: "13 / 400" },
  { className: "text-caption", name: "Caption", spec: "12 / 500" },
  { className: "text-overline uppercase", name: "Overline", spec: "12 / 600" },
  { className: "text-micro uppercase", name: "Micro", spec: "11 / 600" },
  { className: "text-stat", name: "Stat 1,284,500", spec: "28 / 600" },
  { className: "text-price", name: "1,250.00", spec: "40 / 600" },
];

export const radiusScale = [
  { className: "rounded-sm", name: "sm", spec: "8px" },
  { className: "rounded-md", name: "md", spec: "10px" },
  { className: "rounded-lg", name: "lg", spec: "12px" },
  { className: "rounded-xl", name: "xl", spec: "14px" },
  { className: "rounded-2xl", name: "2xl", spec: "18px" },
  { className: "rounded-full", name: "full", spec: "9999px" },
] as const;

export const elevationScale = [
  { className: "shadow-xs", name: "shadow-xs", use: "Cards" },
  { className: "shadow-sm", name: "shadow-sm", use: "Selected control" },
  { className: "shadow-lg", name: "shadow-lg", use: "Menus and dialogs" },
] as const;

export const spacingScale = [
  { className: "w-1", name: "1", px: 4 },
  { className: "w-2", name: "2", px: 8 },
  { className: "w-3", name: "3", px: 12 },
  { className: "w-4", name: "4", px: 16 },
  { className: "w-5", name: "5", px: 20 },
  { className: "w-6", name: "6", px: 24 },
  { className: "w-8", name: "8", px: 32 },
  { className: "w-10", name: "10", px: 40 },
  { className: "w-12", name: "12", px: 48 },
  { className: "w-16", name: "16", px: 64 },
  { className: "w-20", name: "20", px: 80 },
  { className: "w-24", name: "24", px: 96 },
] as const;

export const sizeTokens = [
  { className: "size-control", name: "control", spec: "44px" },
  { className: "size-control-sm", name: "control-sm", spec: "36px" },
  { className: "size-icon-lg", name: "icon-lg", spec: "22px" },
  { className: "size-icon-md", name: "icon-md", spec: "20px" },
  { className: "size-icon-sm", name: "icon-sm", spec: "18px" },
  { className: "size-icon-xs", name: "icon-xs", spec: "16px" },
] as const;

export const layoutTokens = [
  { name: "sidebar", spec: "260px" },
  { name: "topbar / topbar-mobile", spec: "68px / 64px" },
  { name: "tabbar-item", spec: "52px" },
  { name: "nav-drawer", spec: "304px" },
  { name: "drawer / container-dialog", spec: "520px" },
  { name: "container-content", spec: "1280px" },
  { name: "container-marketing", spec: "1200px" },
  { name: "container-auth-form", spec: "420px" },
  { name: "page / card padding", spec: "32 / 24px (phone 20 / 16px)" },
] as const;

export const layerTokens = [
  { className: "z-sticky", value: 20 },
  { className: "z-tabbar", value: 30 },
  { className: "z-overlay", value: 40 },
  { className: "z-drawer", value: 50 },
  { className: "z-popover", value: 60 },
  { className: "z-tooltip", value: 70 },
] as const;

/** Static series for the chart-palette specimen (not real data). */
export const chartSpecimen = {
  bars: [
    [42, 18, 8],
    [55, 24, 6],
    [48, 30, 11],
    [62, 28, 9],
    [70, 35, 7],
    [66, 40, 12],
  ],
  line: [20, 34, 30, 46, 52, 61],
} as const;
