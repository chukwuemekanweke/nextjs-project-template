import type {
  AdminListState,
  AdminRangePreset,
} from "@/components/admin-patterns";

export type AuditOutcome = "success" | "failed" | "denied" | "unknown";
export type AuditEvent = Readonly<{
  id: string;
  atUtc: string;
  actorName: string | null;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  outcome: AuditOutcome;
  reason?: string | null;
}>;
export type AuditFilters = Readonly<{
  query: string;
  action: string;
  actor: string;
  range: AdminRangePreset;
}>;
export type AuditModel = AdminListState<AuditEvent>;
export type AuditAction =
  | Readonly<{ type: "viewDetails"; eventId: string }>
  | Readonly<{ type: "exportCsv" }>;
