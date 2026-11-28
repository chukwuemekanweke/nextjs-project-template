import type { ReactNode } from "react";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CheckIcon,
  CircleHelpIcon,
  ClockIcon,
  CloseIcon,
  DataTable,
  EmptyState,
  ErrorState,
  HistoryIcon,
  IconTile,
  LoadingStatus,
  Panel,
  RefreshIcon,
  ShieldCheckIcon,
  Skeleton,
  SkeletonText,
  TriangleAlertIcon,
  type TableColumn,
} from "@template/ui-core";
import {
  formatVerificationDateTime,
  UNAVAILABLE_ACTION_DESCRIPTION,
  verificationActionFor,
  verificationPanelTone,
  verificationStatusBadge,
  verificationStatusCopy,
  type VerificationAttempt,
  type VerificationDateOptions,
  type VerificationHistory,
  type VerificationIntent,
  type VerificationScreenModel,
  type VerificationState,
  type VerificationStatus,
} from "./verification-model";

/*
 * Presentational identity verification screen (reference `UserVerification*`,
 * USR-VERIFICATION). It renders the model it is given and reports the chosen
 * intent; it never contacts a verification provider, collects documents or
 * changes state itself. Typed preview data lives in
 * `verification-preview.fixtures.ts` and is used by tests only.
 */

export const VERIFICATION_PAGE_TITLE = "Identity verification";

/** Behaviour shared by the screen and its status panel. */
type ActionProps = Readonly<{
  /** Intent currently being handled; its button shows a busy state. */
  busyIntent?: VerificationIntent;
  /**
   * Called with the chosen intent. When omitted, actions render disabled
   * with an explanation (non-live composition).
   */
  onAction?: (intent: VerificationIntent) => void;
}>;

/* ------------------------------------------------------------------------ */
/* Header                                                                    */
/* ------------------------------------------------------------------------ */

export function VerificationHeader() {
  return (
    <DashboardHeader
      description="Verification is handled by our identity verification partner."
      title={VERIFICATION_PAGE_TITLE}
    />
  );
}

/* ------------------------------------------------------------------------ */
/* Status panel                                                              */
/* ------------------------------------------------------------------------ */

const panelIcons: Record<VerificationStatus | "unknown", ReactNode> = {
  expired: <TriangleAlertIcon />,
  failed: <TriangleAlertIcon />,
  inProgress: <ClockIcon />,
  notStarted: <ShieldCheckIcon />,
  pending: <ClockIcon />,
  rejected: <CloseIcon />,
  unknown: <CircleHelpIcon />,
  verified: <CheckIcon />,
};

/** Reference status card: icon, heading, explanation and one action. */
function StatusCard({
  children,
  description,
  status,
  title,
}: Readonly<{
  children?: ReactNode;
  description: ReactNode;
  status: VerificationStatus | "unknown";
  title: string;
}>) {
  return (
    <Card
      aria-labelledby="verification-status-heading"
      data-status={status}
      role="region"
    >
      <CardContent className="flex flex-wrap items-start gap-5">
        <IconTile size="lg" tone={verificationPanelTone(status)}>
          {panelIcons[status]}
        </IconTile>
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-2.5">
          <h2 className="text-h2 text-fg" id="verification-status-heading">
            {title}
          </h2>
          <div className="text-fg-muted break-words">{description}</div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

const verificationSteps = [
  {
    description: "A valid government-issued photo ID.",
    title: "Identity document",
  },
  {
    description: "A quick liveness check with your camera.",
    title: "Selfie check",
  },
  {
    description: "Our verification partner reviews your submission.",
    title: "Review",
  },
] as const;

/** The three instruction steps shown before verification starts. */
export function VerificationSteps() {
  return (
    <ol
      aria-label="Verification steps"
      className="mt-2 grid gap-4 md:grid-cols-3"
    >
      {verificationSteps.map((step, index) => (
        <li key={step.title}>
          <Panel className="h-full">
            <p className="text-small text-fg font-semibold">
              {index + 1}. {step.title}
            </p>
            <p className="text-small text-fg-muted mt-1">{step.description}</p>
          </Panel>
        </li>
      ))}
    </ol>
  );
}

const ACTION_HINT_ID = "verification-action-hint";

/** Button for the state's intent; disabled with a reason when not wired. */
export function VerificationActionSlot({
  busyIntent,
  onAction,
  verification,
}: ActionProps & Readonly<{ verification: VerificationState }>) {
  const action = verificationActionFor(verification);
  if (!action) return null;
  const unavailable = !onAction;
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        aria-describedby={unavailable ? ACTION_HINT_ID : undefined}
        data-intent={action.intent}
        disabled={unavailable}
        leadingIcon={action.intent === "refresh" ? <RefreshIcon /> : undefined}
        loading={busyIntent === action.intent}
        onClick={onAction ? () => onAction(action.intent) : undefined}
        variant={action.variant}
      >
        {action.label}
      </Button>
      {unavailable ? (
        <p className="text-small text-fg-subtle" id={ACTION_HINT_ID}>
          {UNAVAILABLE_ACTION_DESCRIPTION}
        </p>
      ) : null}
    </div>
  );
}

function SupportContact({ supportEmail }: Readonly<{ supportEmail?: string }>) {
  if (!supportEmail) return null;
  return (
    <p className="text-small text-fg-muted">
      Need help? Email{" "}
      <a
        className="text-brand-ink font-medium break-all underline-offset-2 hover:underline"
        href={`mailto:${supportEmail}`}
      >
        {supportEmail}
      </a>
      .
    </p>
  );
}

/** Current verification state with its single action (or none). */
export function VerificationStatusPanel({
  busyIntent,
  dates,
  onAction,
  supportEmail,
  verification,
}: ActionProps &
  Readonly<{
    dates?: VerificationDateOptions;
    /** Configured support address, offered when no retry is allowed. */
    supportEmail?: string;
    verification: VerificationState;
  }>) {
  const copy = verificationStatusCopy(verification, dates);
  const action = verificationActionFor(verification);
  return (
    <StatusCard
      description={copy.description}
      status={verification.status}
      title={copy.title}
    >
      {verification.status === "notStarted" ? <VerificationSteps /> : null}
      {verification.status === "verified" ? (
        <div>
          <Badge tone="success">Verified</Badge>
        </div>
      ) : null}
      <VerificationActionSlot
        busyIntent={busyIntent}
        onAction={onAction}
        verification={verification}
      />
      {verification.status === "rejected" && !action ? (
        <SupportContact supportEmail={supportEmail} />
      ) : null}
    </StatusCard>
  );
}

/* ------------------------------------------------------------------------ */
/* History                                                                   */
/* ------------------------------------------------------------------------ */

function DateTimeCell({
  dates,
  value,
}: Readonly<{ dates?: VerificationDateOptions; value?: string }>) {
  const formatted = formatVerificationDateTime(value, dates);
  if (!formatted || !value) {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not available</span>
      </>
    );
  }
  return <time dateTime={value}>{formatted}</time>;
}

function historyColumns(
  dates?: VerificationDateOptions,
): readonly TableColumn<VerificationAttempt>[] {
  return [
    {
      header: "Attempt",
      className: "whitespace-nowrap text-fg font-medium",
      cell: (attempt) => `#${attempt.attemptNumber}`,
    },
    {
      header: "Started",
      className: "whitespace-nowrap",
      cell: (attempt) => (
        <DateTimeCell dates={dates} value={attempt.startedAt} />
      ),
    },
    {
      header: "Status",
      className: "whitespace-nowrap",
      cell: (attempt) => {
        const badge = verificationStatusBadge(attempt.status);
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
    },
    {
      header: "Updated",
      className: "whitespace-nowrap",
      cell: (attempt) => (
        <DateTimeCell dates={dates} value={attempt.updatedAt} />
      ),
    },
  ];
}

/**
 * Reference "Verification history" table. Rows stack into labelled blocks on
 * phones, keeping every field. Omitted when the source has no history.
 */
export function VerificationHistoryCard({
  dates,
  history,
  onReload,
}: Readonly<{
  dates?: VerificationDateOptions;
  history: VerificationHistory;
  onReload?: () => void;
}>) {
  if (history.state === "unavailable") return null;
  return (
    <Card aria-labelledby="verification-history-heading" role="region">
      <CardHeader>
        <CardTitle id="verification-history-heading">
          Verification history
        </CardTitle>
      </CardHeader>
      <DataTable
        caption="Verification attempts"
        columns={historyColumns(dates)}
        empty={
          <EmptyState
            className="border-0 py-2"
            description="Your verification attempts will appear here."
            icon={<HistoryIcon />}
            title="No verification attempts yet"
          />
        }
        error={
          history.state === "error" ? (
            <ErrorState
              className="py-2"
              description="Your verification history could not be loaded."
              onRetry={onReload}
              title="History unavailable"
            />
          ) : undefined
        }
        keyField={(attempt) => attempt.id}
        loading={history.state === "loading"}
        loadingLabel="Loading verification history"
        loadingRows={3}
        mobileLayout="stack"
        rows={history.state === "ready" ? history.attempts : []}
        variant="embedded"
      />
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Screen                                                                    */
/* ------------------------------------------------------------------------ */

function StatusPanelSkeleton() {
  return (
    <Card aria-busy="true">
      <CardContent className="flex flex-wrap items-start gap-5">
        <LoadingStatus label="Loading verification status" />
        <Skeleton className="size-12 shrink-0 rounded-lg" />
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3">
          <Skeleton className="h-6 w-56 max-w-full" />
          <SkeletonText lines={2} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * The whole verification page body: header, status panel and history.
 * Loading, error and unrecognised states never fall back to sample data.
 */
export function VerificationScreen({
  busyIntent,
  dates,
  model,
  notices,
  onAction,
  onReload,
  supportEmail,
}: ActionProps &
  Readonly<{
    dates?: VerificationDateOptions;
    model: VerificationScreenModel;
    /** Live workflow notices shown below the page header. */
    notices?: ReactNode;
    /** Re-reads status and history after an error. */
    onReload?: () => void;
    supportEmail?: string;
  }>) {
  return (
    <section className="space-y-6">
      <VerificationHeader />
      {notices}
      {model.state === "loading" ? (
        <>
          <StatusPanelSkeleton />
          <VerificationHistoryCard
            dates={dates}
            history={{ state: "loading" }}
          />
        </>
      ) : null}
      {model.state === "error" ? (
        <Card>
          <ErrorState
            description="Your verification status could not be loaded."
            onRetry={onReload}
            title="Verification status unavailable"
          />
        </Card>
      ) : null}
      {model.state === "unknown" ? (
        <>
          <StatusCard
            description="We couldn't confirm your verification status. Please check again later."
            status="unknown"
            title="Verification status unavailable"
          >
            <SupportContact supportEmail={supportEmail} />
          </StatusCard>
          <VerificationHistoryCard
            dates={dates}
            history={model.history}
            onReload={onReload}
          />
        </>
      ) : null}
      {model.state === "ready" ? (
        <>
          <VerificationStatusPanel
            busyIntent={busyIntent}
            dates={dates}
            onAction={onAction}
            supportEmail={supportEmail}
            verification={model.verification}
          />
          <VerificationHistoryCard
            dates={dates}
            history={model.history}
            onReload={onReload}
          />
        </>
      ) : null}
    </section>
  );
}
