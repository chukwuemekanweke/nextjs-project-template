import { safeSignInError } from "./sign-in";

/**
 * Titled admin sign-in feedback (design `AuthStates`). The title and tone
 * follow the BFF status; the body is the existing safe copy. No attempt
 * counts or lockout durations: the backend does not return them.
 */
export type SignInFeedback = Readonly<{
  message: string;
  title: string;
  variant: "error" | "warning";
}>;

export function signInFeedback(status: number): SignInFeedback {
  const message = safeSignInError(status);
  if (status === 401) {
    return { message, title: "Incorrect email or password", variant: "error" };
  }
  if (status === 403) {
    return { message, title: "Access denied", variant: "error" };
  }
  if (status === 423) {
    return { message, title: "Account locked", variant: "error" };
  }
  if (status === 429) {
    return { message, title: "Too many requests", variant: "warning" };
  }
  return { message, title: "Sign-in unavailable", variant: "error" };
}
