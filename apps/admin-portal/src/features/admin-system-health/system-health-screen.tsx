"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type BadgeTone,
} from "@template/ui-core";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  AdminKpiCard,
  AdminSectionBody,
  formatAdminDateTime,
} from "@/components/admin-patterns";
import type {
  HealthStatus,
  ServiceHealth,
  SystemHealthModel,
} from "./system-health-model";

const tone: Readonly<Record<HealthStatus, BadgeTone>> = {
  degraded: "warning",
  operational: "success",
  unavailable: "danger",
  unknown: "neutral",
};

export function SystemHealthScreen({
  model,
  onRefresh,
}: Readonly<{ model: SystemHealthModel; onRefresh?: () => void }>) {
  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        actions={
          <div className="grid justify-items-end gap-1">
            <Button
              disabled={!onRefresh}
              onClick={onRefresh}
              size="sm"
              variant="secondary"
            >
              Refresh
            </Button>
            {!onRefresh ? (
              <span className="text-caption text-fg-subtle">
                Live refresh is unavailable.
              </span>
            ) : null}
          </div>
        }
        description="Authoritative service and dependency checks. Frontend health alone is not system health."
        title="System health"
      />
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-small text-fg-muted">Overall status</p>
            <p className="text-h2 text-fg">System health</p>
          </div>
          <Badge tone={tone[model.overall]}>{statusLabel(model.overall)}</Badge>
        </CardContent>
      </Card>
      <AdminSectionBody label="service health" section={model.services}>
        {(services) =>
          services.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent>
                <p className="text-fg-muted">
                  No service checks were reported.
                </p>
              </CardContent>
            </Card>
          )
        }
      </AdminSectionBody>
    </section>
  );
}

function ServiceCard({ service }: Readonly<{ service: ServiceHealth }>) {
  const checked = formatAdminDateTime(service.checkedAtUtc);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle as="h3">{service.name}</CardTitle>
          {service.description ? (
            <p className="text-small text-fg-muted mt-1">
              {service.description}
            </p>
          ) : null}
        </div>
        <Badge tone={tone[service.status]}>{statusLabel(service.status)}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <AdminKpiCard label="Latency" metric={service.latency} />
          <AdminKpiCard label="Uptime" metric={service.uptime} />
        </div>
        <p className="text-small text-fg-muted">
          Last checked: {checked ?? "Not reported"}
        </p>
        {service.details?.length ? (
          <ul className="text-small text-fg-muted list-disc pl-5">
            {service.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function statusLabel(status: HealthStatus) {
  return status === "unknown"
    ? "Unknown"
    : `${status[0]?.toUpperCase()}${status.slice(1)}`;
}
