import { z } from "zod";

const newPasswordSchema = z
  .string()
  .min(1, "Enter a new password.")
  .min(8, "New password must be at least 8 characters.")
  .regex(/[A-Z]/, "New password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "New password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "New password must contain at least one digit.")
  .regex(
    /[^a-zA-Z0-9]/,
    "New password must contain at least one non-alphanumeric character.",
  );

export const passwordChangeSchema = z
  .object({
    confirmNewPassword: z.string().min(1, "Confirm your new password."),
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: newPasswordSchema,
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: "New passwords must match.",
    path: ["confirmNewPassword"],
  });
