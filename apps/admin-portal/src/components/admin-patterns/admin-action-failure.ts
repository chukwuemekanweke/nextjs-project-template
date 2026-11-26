import { isApiError } from "@template/api-client";

/*
 * Safe feedback for a failed privileged admin action (lock a user, cancel a
 * subscription, …). Categories come from the normalized `ApiError.kind`;
 * raw backend messages, codes and exceptions are never shown. No admin
 * action API or step-up contract exists yet (DR-072): when one defines
 * specific error codes (for example an expired step-up), map them here
 * rather than guessing them in features.
 */

export type AdminActionFailureCategory =
  /** 401: the session or the fresh authenticator check was not accepted. */
  | "authentication"
  /** 403: the administrator's role does not allow the action. */
  | "permission"
  /** 409/423 or 404: the record changed or no longer allows the action. */
  | "conflict"
  /** 400/422: the backend rejected the submitted input. */
  | "invalid"
  /** Network, timeout, rate limit or 5xx: retrying may succeed. */
  | "temporary"
  | "unexpected";

export type AdminActionFailure = Readonly<{
  category: AdminActionFailureCategory;
  message: string;
}>;

const FAILURE_MESSAGES: Readonly<Record<AdminActionFailureCategory, string>> = {
  authentication:
    "Your session or authenticator check was not accepted. Check the code and try again, or sign in again.",
  conflict:
    "This record changed and no longer allows the action. Reload it to see its current state.",
  invalid: "The request was not accepted. Check the details and try again.",
  permission: "Your administrator role doesn't allow this action.",
  temporary:
    "The service couldn't complete the action right now. Try again in a moment.",
  unexpected:
    "The action couldn't be completed. Check the record's current state, then try again.",
};

function categoryFor(error: unknown): AdminActionFailureCategory {
  if (!isApiError(error)) {
    return "unexpected";
  }
  switch (error.kind) {
    case "unauthorized":
      return "authentication";
    case "forbidden":
      return "permission";
    case "conflict":
    case "locked":
    case "not-found":
      return "conflict";
    case "validation":
      return "invalid";
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
      return "temporary";
    default:
      return "unexpected";
  }
}

/** Classifies a rejected action with fixed, safe copy. */
export function describeAdminActionFailure(error: unknown): AdminActionFailure {
  const category = categoryFor(error);
  return { category, message: FAILURE_MESSAGES[category] };
}
