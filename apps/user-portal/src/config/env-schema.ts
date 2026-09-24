import { z } from "zod";

export const userPortalEnvironmentExtensionSchema = z.object({
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().trim().min(1),
  NEXT_PUBLIC_USER_PORTAL_DESCRIPTION: z.string().trim().min(1),
});
