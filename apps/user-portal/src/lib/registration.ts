import { z } from "zod";

const RESEND_CLOCK_SKEW_TOLERANCE_MS = 5_000;

export const emailSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const passwordSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm your password."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one digit.")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one non-alphanumeric character.",
      ),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  countryId: z.string().min(1, "Select your country."),
  firstName: z
    .string()
    .trim()
    .min(1, "Enter your first name.")
    .max(100, "First name must be 100 characters or fewer."),
  lastName: z
    .string()
    .trim()
    .min(1, "Enter your last name.")
    .max(100, "Last name must be 100 characters or fewer."),
});

export const confirmationSchema = z.object({
  otp: z.string().trim().length(6, "Enter the 6-character code."),
});

export function normalizeRegistrationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function safeRetryAtUtc(value: string | undefined): string {
  if (!value) {
    return "";
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

export function retrySecondsRemaining(
  retryAtUtc: string,
  nowMilliseconds = Date.now(),
): number {
  const retryTimestamp = Date.parse(retryAtUtc);
  if (!Number.isFinite(retryTimestamp)) {
    return 0;
  }
  return Math.max(
    0,
    Math.ceil(
      (retryTimestamp + RESEND_CLOCK_SKEW_TOLERANCE_MS - nowMilliseconds) /
        1_000,
    ),
  );
}
