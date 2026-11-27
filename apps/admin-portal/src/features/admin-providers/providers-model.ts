import type { AdminListState } from "@/components/admin-patterns";
export type ProviderStatus =
  "operational" | "degraded" | "inactive" | "unknown";
export type AdminProvider = Readonly<{
  id: string;
  name: string;
  category: "payment" | "service";
  description?: string;
  status: ProviderStatus;
  capabilities: readonly string[];
  metadata: readonly Readonly<{ label: string; value: string }>[];
}>;
export type ProvidersModel = AdminListState<AdminProvider>;
export type ProviderAction = Readonly<{
  type: "makeActive" | "configure" | "test";
  providerId: string;
}>;
