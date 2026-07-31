import "server-only";

import { createServerEnvironment } from "@template/config";
import { z } from "zod";

export const serverEnv = createServerEnvironment(z.object({}));
