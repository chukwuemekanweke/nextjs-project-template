import Link from "next/link";
import type { ReactNode } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CircleCheckIcon,
  CircleHelpIcon,
  DataTable,
  IconTile,
  Skeleton,
  TriangleAlertIcon,
  type TableColumn,
} from "@template/ui-core";
import type {
  ActivityRow,
  ChecklistItem,
  MetricSummary,
} from "./dashboard-overview";

/*
 * Presentational dashboard sections (reference `UserDashboard*`). They render
 * the state they are given; data loading lives in `dashboard-live.tsx`, and
 * typed preview data in `dashboard-preview.fixtures.ts` (tests only).
 */

/** Inline text link (reference `.card-h a.small`). */
export const textLinkClassName =
  "text-small text-brand-ink font-medium hover:underline focus-visible:underline";

/* ------------------------------------------------------------------------ */
/* Metric tiles                                                              */
/* ------------------------------------------------------------------------ */

/**
 * Reference `.stat` tile. Loading shows a placeholder with a status
 * announcement; unavailable shows `unavailableLabel` and its reason in text,
 * never a sample value.
 */
export function MetricCard({
  action,
  icon,
  label,
  metric,
  unavailableLabel = "Unavailable",
}: Readonly<{
  action?: ReactNode;
  icon: ReactNode;
  label: string;
  metric: MetricSummary;
  unavailableLabel?: string;
}>) {
  return (
    <Card
      aria-busy={metric.state === "loading" || undefined}
      data-metric={label}
      data-state={metric.state}
    >
      <CardContent className="flex h-full flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-small text-fg-muted font-normal">{label}</h2>
          <IconTile className="max-md:hidden" size="sm">
            {icon}
          </IconTile>
        </div>
        {metric.state === "loading" ? (
          <>
            <span className="sr-only" role="status">
              Loading {label.toLowerCase()}
            </span>
            <Skeleton className="mt-1 h-8 w-24" />
            <Skeleton className="mt-1 h-4 w-32 max-w-full" />
          </>
        ) : (
          <>
            <p
              className={
                metric.state === "ready"
                  ? "text-stat text-fg break-words"
                  : "text-h2 text-fg-muted"
              }
            >
              {metric.state === "ready" ? metric.value : unavailableLabel}
            </p>
            <p className="text-small text-fg-subtle">{metric.detail}</p>
          </>
        )}
        {action ? <div className="mt-auto pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

/** Four tiles on desktop (reference `.grid.g4`), two columns on phones. */
export function MetricGrid({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Profile summary                                                           */
/* ------------------------------------------------------------------------ */

/**
 * Reference "Your profile" card with live profile identity only. Country,
 * language and member-since have no backend source. The separate live KYC
 * callout uses the shared current-verification query.
 */
export function ProfileSummaryCard({
  avatarUrl,
  emailAddress,
  isVerified,
  name,
}: Readonly<{
  avatarUrl: string | null;
  emailAddress: string;
  isVerified: boolean;
  name: string;
}>) {
  return (
    <Card aria-labelledby="profile-summary-heading" role="region">
      <CardHeader>
        <CardTitle id="profile-summary-heading">Your profile</CardTitle>
        <Link className={textLinkClassName} href="/profile">
          Edit profile
        </Link>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar decorative name={name} size="lg" src={avatarUrl} />
        <div className="grid min-w-0 gap-1">
          <p className="text-h2 text-fg break-words">{name}</p>
          {emailAddress.trim() ? (
            <p className="text-fg-muted break-all">{emailAddress.trim()}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap gap-2">
            {isVerified ? (
              <Badge tone="success">Account verified</Badge>
            ) : (
              <Badge tone="warning">Verification pending</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Security checklist                                                        */
/* ------------------------------------------------------------------------ */

const checklistVisuals: Record<
  Exclude<ChecklistItem["status"], "loading">,
  { icon: ReactNode; label: string; tone: "success" | "warning" | "neutral" }
> = {
  done: { icon: <CircleCheckIcon />, label: "Done", tone: "success" },
  todo: { icon: <TriangleAlertIcon />, label: "Recommended", tone: "warning" },
  unavailable: {
    icon: <CircleHelpIcon />,
    label: "Unavailable",
    tone: "neutral",
  },
};

export function SecurityChecklist({
  action,
  items,
}: Readonly<{
  /** Rendered beside each "todo" item, for example a link to Security. */
  action?: (item: ChecklistItem) => ReactNode;
  items: readonly ChecklistItem[];
}>) {
  return (
    <ul className="grid gap-3.5">
      {items.map((item) => (
        <li className="flex items-center gap-3" key={item.id}>
          {item.status === "loading" ? (
            <Skeleton className="size-8 shrink-0 rounded-sm" />
          ) : (
            <IconTile size="sm" tone={checklistVisuals[item.status].tone}>
              {checklistVisuals[item.status].icon}
            </IconTile>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-fg font-semibold">
              {item.status === "loading" ? null : (
                <span className="sr-only">
                  {checklistVisuals[item.status].label}:{" "}
                </span>
              )}
              {item.title}
            </p>
            <p
              className="text-small text-fg-muted"
              role={item.status === "loading" ? "status" : undefined}
            >
              {item.description}
            </p>
          </div>
          {item.status === "todo" && action ? action(item) : null}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------------ */
/* Recent activity                                                           */
/* ------------------------------------------------------------------------ */

const activityColumns: readonly TableColumn<ActivityRow>[] = [
  { header: "Date", className: "whitespace-nowrap", cell: (row) => row.date },
  { header: "Description", cell: (row) => row.description },
  {
    header: "Status",
    className: "whitespace-nowrap",
    cell: (row) => <Badge tone={row.status.tone}>{row.status.label}</Badge>,
  },
  {
    align: "right",
    header: "Amount",
    className: "whitespace-nowrap",
    cell: (row) => (
      <span className="text-fg font-semibold tabular-nums">{row.amount}</span>
    ),
  },
];

/** Reference activity table; rows stack into labelled blocks on phones. */
export function ActivityTable({
  caption,
  empty,
  error,
  loading = false,
  rows,
}: Readonly<{
  caption: string;
  empty?: ReactNode;
  error?: ReactNode;
  loading?: boolean;
  rows: readonly ActivityRow[];
}>) {
  return (
    <DataTable
      caption={caption}
      columns={activityColumns}
      empty={empty}
      error={error}
      keyField={(row) => row.id}
      loading={loading}
      loadingLabel="Loading recent activity"
      loadingRows={3}
      mobileLayout="stack"
      rows={rows}
      variant="embedded"
    />
  );
}

/* ------------------------------------------------------------------------ */
/* Identity verification callout                                             */
/* ------------------------------------------------------------------------ */

/**
 * Reference KYC banner. Production supplies backend-authoritative copy and a
 * link to the live verification route; preview fixtures remain test-only.
 */
export function IdentityVerificationCallout({
  action,
  children,
  title,
}: Readonly<{ action?: ReactNode; children: ReactNode; title: string }>) {
  return (
    <Alert title={title} variant="warning">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{children}</span>
        {action}
      </div>
    </Alert>
  );
}
