"use client";

import { isApiError } from "@template/api-client";
import { useLoginActivity } from "@template/api-react/authentication";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Skeleton,
} from "@template/ui-core";
import {
  describeActivityType,
  describeDevice,
  describeLocation,
  formatActivityTimestamp,
  ipAddressLookupUrl,
  sortActivitiesNewestFirst,
} from "./session-display";

const LOGIN_ACTIVITY_PAGE_SIZE = 10;

export function LoginActivityCard() {
  const activity = useLoginActivity(LOGIN_ACTIVITY_PAGE_SIZE);
  const activities = sortActivitiesNewestFirst(
    activity.data?.pages.flatMap((page) => page.activities) ?? [],
  );

  return (
    <Card>
      <CardContent>
        <CardTitle>Recent login activity</CardTitle>
        <CardDescription>
          A history of sign-ins and security events on your account.
        </CardDescription>
        <div className="mt-5 space-y-3">
          {activity.isPending ? (
            <LoginActivityListSkeleton />
          ) : activity.isError && !activity.data ? (
            <Alert variant="error">{loginActivityError(activity.error)}</Alert>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No login activity has been recorded yet.
            </p>
          ) : (
            <>
              {activity.isFetchNextPageError ? (
                <Alert variant="error">
                  More login activity could not be loaded. Try again.
                </Alert>
              ) : null}
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {activities.map((entry) => {
                  const location = describeLocation(entry);
                  return (
                    <li
                      className="space-y-1 py-3 first:pt-0 last:pb-0"
                      key={entry.id}
                    >
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {describeActivityType(entry.activityType)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {describeDevice(entry)}
                      </p>
                      <p className="text-sm break-words">
                        <span className="sr-only">IP address: </span>
                        <a
                          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium underline decoration-dotted underline-offset-2"
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
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="sr-only">Location: </span>
                        {location ?? "Location unavailable"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatActivityTimestamp(entry.occurredAtUtc)}
                      </p>
                    </li>
                  );
                })}
              </ul>
              {activity.hasNextPage ? (
                <div className="flex justify-center pt-2">
                  <button
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
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

function LoginActivityListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading login activity"
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

function loginActivityError(error: unknown): string {
  if (isApiError(error) && error.status === 403) {
    return "Your current session does not have permission to view login activity. Sign out and sign in again.";
  }
  return "Login activity could not be loaded. Refresh and try again.";
}
