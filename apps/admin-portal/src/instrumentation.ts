import { createServerEnvironment } from "@template/config";
import { z } from "zod";

/** Runs when the Next.js server starts, before requests are handled. */
export async function register() {
  createServerEnvironment(
    z.object({
      ADMIN_REQUIRED_ROLE: z.string().trim().min(1).default("Administrator"),
    }),
  );
}
