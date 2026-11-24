"use client";

import { isApiError } from "@template/api-client";
import { useSecurityActivity } from "@template/api-react/authentication";
import type { SecurityActivityResponse } from "@template/api-client/authentication";
import {
  ActivityIcon,
  Alert,
  Card,
  CardContent,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  KeyIcon,
  LogOutIcon,
  RefreshIcon,
  SectionHeader,
  ShieldCheckIcon,
  Skeleton,
  buttonClassName,
} from "@template/ui-core";
import type { ReactNode } from "react";
import {
  describeActivityPresentation,
  describeActivityType,
  describeDevice,
  describeFailureReason,
  describeLocation,
  formatActivityTimestamp,
  ipAddressLookupUrl,
  sortActivitiesNewestFirst,
  type ActivityIconKind,
  type ActivityTone,
} from "./session-display";

const SECURITY_ACTIVITY_PAGE_SIZE = 10;

export function SecurityActivityCard() {
  const activity = useSecurityActivity(SECURITY_ACTIVITY_PAGE_SIZE);
  const activities = sortActivitiesNewestFirst(
    activity.data?.pages.flatMap((page) => page.activities) ?? [],
  );

  return (
    <Card>
      <CardContent>
        <SectionHeader
          description="A history of sign-ins and security events on your account."
          icon={<ClockIcon className="h-6 w-6" />}
          title="Recent security activity"
        />
        <div className="mt-5 space-y-3">
          {activity.isPending ? (
            <SecurityActivityListSkeleton />
          ) : activity.isError && !activity.data ? (
            <Alert variant="error">
              {securityActivityError(activity.error)}
            </Alert>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No security activity has been recorded yet.
            </p>
          ) : (
            <>
              {activity.isFetchNextPageError ? (
                <Alert variant="error">
                  More security activity could not be loaded. Try again.
                </Alert>
              ) : null}
              <ul
                aria-label="Security activity"
                className="divide-y divide-gray-200 border-t border-gray-200 dark:divide-gray-800 dark:border-gray-800"
              >
                {activities.map((entry) => (
                  <ActivityRow entry={entry} key={entry.id} />
                ))}
              </ul>
              {activity.hasNextPage ? (
                <div className="flex justify-center pt-2">
                  <button
                    className={buttonClassName({ variant: "secondary" })}
                    disabled={activity.isFetchingNextPage}
                    onClick={() => void activity.fetchNextPage()}
                    type="button"
                  >
                    {activity.isFetchingNextPage
                      ? "Loading…"
                      : activity.isFetchNextPageError
                        ? "Try loading more again"
                        : "Load more"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const ACTIVITY_ICONS: Readonly<Record<ActivityIconKind, ReactNode>> = {
  activity: <ActivityIcon />,
  alert: <CircleAlertIcon />,
  check: <CircleCheckIcon />,
  key: <KeyIcon />,
  logout: <LogOutIcon />,
  refresh: <RefreshIcon />,
  shield: <ShieldCheckIcon />,
};

const ACTIVITY_TONES: Readonly<Record<ActivityTone, string>> = {
  brand: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  neutral: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
  success:
    "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
};

function ActivityRow({ entry }: Readonly<{ entry: SecurityActivityResponse }>) {
  const location = describeLocation(entry);
  const presentation = describeActivityPresentation(entry.activityType);
  const failureReason = describeFailureReason(entry.failureReason);

  return (
    <li className="flex items-start gap-4 py-4 last:pb-0">
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ACTIVITY_TONES[presentation.tone]}`}
      >
        {ACTIVITY_ICONS[presentation.icon]}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white/90">
            {describeActivityType(entry.activityType)}
          </p>
          {failureReason ? (
            <p className="mt-0.5 text-sm text-red-600 dark:text-red-400">
              <span className="sr-only">Reason: </span>
              {failureReason}
            </p>
          ) : null}
          <p className="mt-0.5 text-sm break-words text-gray-600 dark:text-gray-400">
            {describeDevice(entry)}
            <span aria-hidden="true"> · </span>
            <span className="sr-only">IP address: </span>
            <a
              className="hover:text-brand-600 dark:hover:text-brand-400 underline decoration-gray-300 decoration-dotted underline-offset-2 dark:decoration-gray-600"
              href={ipAddressLookupUrl(entry.ipAddress)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {entry.ipAddress}
              <span className="sr-only">
                {" "}
                (opens IP address lookup in a new tab)
              </span>
            </a>
            {location ? (
              <>
                <span aria-hidden="true"> · </span>
                <span className="sr-only">Location: </span>
                {location}
              </>
            ) : null}
          </p>
        </div>
        <time
          className="shrink-0 text-sm text-gray-600 sm:pt-0.5 sm:text-right dark:text-gray-400"
          dateTime={entry.occurredAtUtc}
        >
          {formatActivityTimestamp(entry.occurredAtUtc)}
        </time>
      </div>
    </li>
  );
}

function SecurityActivityListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading security activity"
      className="space-y-4"
      role="status"
    >
      {[0, 1, 2].map((index) => (
        <div className="space-y-2" key={index}>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

function securityActivityError(error: unknown): string {
  if (isApiError(error) && error.status === 403) {
    return "Your current session does not have permission to view security activity. Sign out and sign in again.";
  }
  return "Security activity could not be loaded. Refresh and try again.";
}
