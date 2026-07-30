import { createServerEnvironment } from "@template/config";
import { z } from "zod";

/** Runs when the Next.js server starts, before requests are handled. */
export async function register() {
  createServerEnvironment(z.object({}));
}
