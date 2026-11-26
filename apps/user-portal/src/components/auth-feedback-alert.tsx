import { Alert } from "@template/ui-core";
import type { AuthFeedback } from "@/lib/auth-feedback";

/** Renders mapped authentication feedback as a titled `Alert`. */
export function AuthFeedbackAlert({
  feedback,
}: Readonly<{ feedback: AuthFeedback | undefined }>) {
  if (!feedback) {
    return null;
  }
  return (
    <Alert title={feedback.title} variant={feedback.variant}>
      {feedback.message}
    </Alert>
  );
}
