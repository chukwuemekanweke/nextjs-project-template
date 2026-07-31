import type { JsonElement } from "./shared";

export type CredoWebhookRequest = { data: JsonElement; event: string };
export type SafeHavenWebhookRequest = {
  data: JsonElement;
  eventType?: string | null;
  type: string;
};
