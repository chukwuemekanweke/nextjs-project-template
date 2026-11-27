import type { AuditModel } from "./audit-model";
export const auditPreview: AuditModel = {
  page: 1,
  pageSize: 20,
  rows: [
    {
      action: "Provider activation requested",
      actorId: "fixture-admin-1",
      actorName: "Ada Fixture",
      atUtc: "2026-11-25T10:30:00Z",
      detailAction: { state: "available" },
      id: "fixture-audit-1",
      outcome: "success",
      reason: "Approved test change",
      resource: "Provider",
      resourceId: "fixture-provider-1",
    },
    {
      action: "Role assignment attempted",
      actorId: null,
      actorName: null,
      atUtc: "invalid",
      detailAction: {
        reason: "Details were not retained for this event.",
        state: "unavailable",
      },
      id: "fixture-audit-2",
      outcome: "unknown",
      reason: null,
      resource: "Role",
    },
  ],
  state: "ready",
  totalItems: 2,
  totalPages: 1,
};
