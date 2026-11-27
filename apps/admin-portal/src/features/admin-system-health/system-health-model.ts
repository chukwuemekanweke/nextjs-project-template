import type {
  AdminActionAvailability,
  AdminForbiddenState,
  AdminMetric,
  AdminSection,
} from "@/components/admin-patterns";

export type HealthStatus =
  "operational" | "degraded" | "unavailable" | "unknown";
export type ServiceHealth = Readonly<{
  id: string;
  name: string;
  description?: string;
  status: HealthStatus;
  latency: AdminMetric;
  uptime: AdminMetric;
  checkedAtUtc: string | null;
  details?: readonly string[];
}>;
export type SystemHealthModel = Readonly<{
  overall: HealthStatus;
  services: AdminSection<readonly ServiceHealth[]>;
}>;
export type SystemHealthScreenState =
  AdminSection<SystemHealthModel> | AdminForbiddenState;
export type SystemHealthRefreshState = AdminActionAvailability;
