import type { SystemHealthModel } from "./system-health-model";
export const systemHealthPreview: SystemHealthModel = {
  overall: "degraded",
  services: {
    data: [
      {
        checkedAtUtc: "2026-11-25T10:35:00Z",
        description: "Fictional public API",
        id: "fixture-api",
        latency: { state: "ready", value: "184 ms" },
        name: "Application API",
        status: "operational",
        uptime: { state: "ready", value: "99.95%" },
      },
      {
        checkedAtUtc: null,
        description: "No authoritative check supplied",
        id: "fixture-queue",
        latency: { reason: "Not reported.", state: "unavailable" },
        name: "Background jobs",
        status: "unknown",
        uptime: { reason: "Not reported.", state: "unavailable" },
      },
    ],
    state: "ready",
  },
};
