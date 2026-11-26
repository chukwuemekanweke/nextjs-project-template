import { Steps, type StepItem } from "@template/ui-core";

export type RegistrationStep = "confirm" | "details" | "email";

const registrationSteps: readonly StepItem[] = [
  { id: "email", label: "Email" },
  { id: "details", label: "Your details" },
  { id: "confirm", label: "Confirm email" },
];

/**
 * Registration progress shared by `/register` and `/confirm-email`. The
 * current step comes from in-page state, never from the URL.
 */
export function RegistrationSteps({
  current,
}: Readonly<{ current: RegistrationStep }>) {
  return (
    <Steps
      current={current}
      label="Account setup progress"
      steps={registrationSteps}
    />
  );
}
