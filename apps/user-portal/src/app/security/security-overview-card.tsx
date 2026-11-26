"use client";

import {
  usePasskeys,
  useSecurityActivity,
  useTwoFactorStatus,
} from "@template/api-react/authentication";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CircleAlertIcon,
  CircleCheckIcon,
  FingerprintIcon,
  IconTile,
  KeyIcon,
  ListRow,
  LoadingStatus,
  Progress,
  ShieldCheckIcon,
  ShieldIcon,
  Skeleton,
  SkeletonList,
  SmartphoneIcon,
} from "@template/ui-core";
import type { ReactNode } from "react";
import {
  ActivityEventIcon,
  SECURITY_ACTIVITY_PAGE_SIZE,
  loadedActivities,
  securityActivityError,
  securityLinkClassName,
} from "./activity-presentation";
import {
  passkeyOverviewStatus,
  securityScore,
  twoFactorOverviewStatus,
  type OverviewStatus,
  type SecurityScore,
  type SecurityStepId,
} from "./security-overview";
import type { SecurityTab } from "./security-tab";
import { SecurityTabLink } from "./security-tabs";
import {
  describeActivityType,
  describeDevice,
  describeLocation,
  formatActivityTimestamp,
} from "./session-display";

const RECENT_EVENT_COUNT = 3;

const STEP_TABS: Readonly<Record<SecurityStepId, SecurityTab>> = {
  "backup-passkey": "passkeys",
  passkey: "passkeys",
  "two-factor": "two-factor",
};

/**
 * Overview tab: protection score, recent security events and sign-in
 * methods. It reads the same cached passkey, two-factor and activity queries
 * as the other tabs, so it adds no requests of its own.
 */
export function SecurityOverview() {
  const passkeys = usePasskeys();
  const twoFactor = useTwoFactorStatus();

  return (
    <>
      <div className="grid gap-5 md:gap-6 lg:grid-cols-2">
        <ProtectionCard score={securityScore(passkeys, twoFactor)} />
        <RecentEventsCard />
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sign-in methods</CardTitle>
            <p className="text-small text-fg-muted mt-0.5">
              How you can prove it is you when signing in.
            </p>
          </div>
        </CardHeader>
        <ul aria-label="Sign-in methods">
          <MethodRow
            actionLabel="Change password"
            icon={<KeyIcon />}
            label="Password"
            tab="password"
          />
          <MethodRow
            icon={<FingerprintIcon />}
            label="Passkeys"
            status={passkeyOverviewStatus(passkeys)}
            tab="passkeys"
          />
          <MethodRow
            icon={<SmartphoneIcon />}
            label="Two-factor auth"
            status={twoFactorOverviewStatus(twoFactor)}
            tab="two-factor"
          />
        </ul>
      </Card>
    </>
  );
}

const SCORE_TILE_TONES = {
  brand: "brand",
  success: "success",
  warning: "warning",
} as const;

export function ProtectionCard({ score }: Readonly<{ score: SecurityScore }>) {
  if (score.state === "loading") {
    return (
      <Card aria-busy="true">
        <LoadingStatus label="Checking your security status" />
        <CardContent aria-hidden="true" className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-52" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (score.state === "unavailable") {
    return (
      <Card>
        <CardContent className="flex items-start gap-3">
          <IconTile tone="neutral">
            <ShieldIcon />
          </IconTile>
          <div className="min-w-0">
            <h2 className="text-h3 text-fg">Security status unavailable</h2>
            <p className="text-small text-fg-muted mt-0.5">
              Some sign-in methods could not be checked, so no score is shown.
              Refresh the page to try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = `${score.completed} of ${score.total} recommended steps done`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <IconTile tone={SCORE_TILE_TONES[score.tone]}>
            <ShieldCheckIcon />
          </IconTile>
          <div className="min-w-0">
            <h2 className="text-h3 text-fg">{score.level}</h2>
            <p className="text-small text-fg-muted">{summary}</p>
          </div>
        </div>
        <Progress
          label="Recommended security steps"
          max={score.total}
          tone={score.tone}
          value={score.completed}
          valueText={summary}
        />
        <ul aria-label="Recommended security steps" className="grid gap-2.5">
          {score.steps.map((step) => (
            <li
              className={
                step.done
                  ? "text-small text-fg flex items-start gap-2"
                  : "text-small text-warning flex items-start gap-2"
              }
              key={step.id}
            >
              {step.done ? (
                <CircleCheckIcon className="text-success mt-px" size="xs" />
              ) : (
                <CircleAlertIcon className="mt-px" size="xs" />
              )}
              <span className="min-w-0 flex-1">
                <span className="sr-only">
                  {step.done ? "Done: " : "To do: "}
                </span>
                {step.label}
              </span>
              {!step.done ? (
                <SecurityTabLink
                  className={securityLinkClassName}
                  tab={STEP_TABS[step.id]}
                >
                  Set up
                  <span className="sr-only"> {step.label.toLowerCase()}</span>
                </SecurityTabLink>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function RecentEventsCard() {
  const activity = useSecurityActivity(SECURITY_ACTIVITY_PAGE_SIZE);
  const events = loadedActivities(activity.data?.pages).slice(
    0,
    RECENT_EVENT_COUNT,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Recent security events</CardTitle>
        <SecurityTabLink className={securityLinkClassName} tab="activity">
          View all
          <span className="sr-only"> security activity</span>
        </SecurityTabLink>
      </CardHeader>
      {activity.isPending ? (
        <SkeletonList label="Loading recent security events" rows={3} />
      ) : activity.isError && !activity.data ? (
        <CardContent>
          <Alert variant="error">{securityActivityError(activity.error)}</Alert>
        </CardContent>
      ) : events.length === 0 ? (
        <CardContent>
          <p className="text-small text-fg-muted">
            No security activity has been recorded yet.
          </p>
        </CardContent>
      ) : (
        <ul aria-label="Recent security events">
          {events.map((event) => {
            const location = describeLocation(event);
            return (
              <ListRow
                as="li"
                description={[
                  describeDevice(event),
                  location,
                  formatActivityTimestamp(event.occurredAtUtc),
                ]
                  .filter(Boolean)
                  .join(" · ")}
                key={event.id}
                leading={
                  <ActivityEventIcon
                    activityType={event.activityType}
                    size="sm"
                  />
                }
                title={describeActivityType(event.activityType)}
              />
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function MethodRow({
  actionLabel = "Manage",
  icon,
  label,
  status,
  tab,
}: Readonly<{
  actionLabel?: string;
  icon: ReactNode;
  label: string;
  /** Omitted when no backend fact exists (the password). */
  status?: OverviewStatus;
  tab: SecurityTab;
}>) {
  return (
    <ListRow
      actions={
        <SecurityTabLink className={securityLinkClassName} tab={tab}>
          {actionLabel}
          {actionLabel === "Manage" ? (
            <span className="sr-only"> {label}</span>
          ) : null}
        </SecurityTabLink>
      }
      as="li"
      leading={<IconTile tone="neutral">{icon}</IconTile>}
      title={label}
    >
      {status ? (
        <div className="mt-1">
          {status.state === "loading" ? (
            <span aria-busy="true" role="status">
              <span className="sr-only">Checking {label} status</span>
              <Skeleton className="h-6 w-16 rounded-full" />
            </span>
          ) : (
            <Badge tone={status.tone}>
              <span className="sr-only">{label} status: </span>
              {status.label}
            </Badge>
          )}
        </div>
      ) : null}
    </ListRow>
  );
}
