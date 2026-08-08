import "server-only";

import { createServerEnvironment } from "@template/config";
import { z } from "zod";

export const serverEnv = createServerEnvironment(
  z.object({
    ADMIN_REQUIRED_ROLE: z.string().trim().min(1).default("Administrator"),
  }),
);
