"use client";

import Link from "next/link";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Alert,
  ArrowLeftIcon,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  ErrorState,
  KeyValueList,
  RefreshIcon,
  type KeyValueItem,
  type TableColumn,
} from "@template/ui-core";
import { useId, type ReactNode } from "react";
import {
  AdminDateTime,
  AdminDetailFallback,
  AdminNotAvailable,
  AdminSectionBody,
  AdminUnavailableHint,
  type AdminSection,
} from "@/components/admin-patterns";
import {
  kycAttemptLabel,
  kycDecisionNotice,
  kycStatusBadge,
  parseAdminKycStatus,
  type AdminKycAttempt,
  type AdminKycDetailModel,
  type AdminKycHistoryEvent,
  type AdminKycUser,
  type AdminKycVerification,
} from "./kyc-model";

/*
 * Verification detail (reference `AdminKycDetail*`; Trello FE-UI-013).
 * Read-only: the provider decides verifications, so there is no approve,
 * reject or override; the only intent is "Refresh status" through
 * `onRefresh`. No KYC API, route or navigation item exists yet (DR-054).
 */

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const badge = kycStatusBadge(status);
  return <Badge tone={badge.tone}>{badge.label}</Badge>;
}

function optionalText(value: string | undefined): ReactNode {
  return value?.trim() ? value : <AdminNotAvailable />;
}

function Identifier({ value }: Readonly<{ value: string | undefined }>) {
  if (!value) {
    return <AdminNotAvailable />;
  }
  return <span className="font-mono break-all">{value}</span>;
}

function verificationItems(
  verification: AdminKycVerification,
): readonly KeyValueItem[] {
  return [
    { label: "Status", value: <StatusBadge status={verification.status} /> },
    {
      label: "Provider status",
      value: optionalText(verification.providerStatus),
    },
    { label: "Provider", value: optionalText(verification.provider) },
    {
      label: "Verification ID",
      value: <Identifier value={verification.providerReference} />,
    },
    {
      label: "Applicant ID",
      value: <Identifier value={verification.applicantId} />,
    },
    {
      label: "Started",
      value: <AdminDateTime value={verification.startedAt} />,
    },
    {
      label: "Submitted",
      value: <AdminDateTime value={verification.submittedAt} />,
    },
    {
      label: "Completed",
      value: <AdminDateTime value={verification.completedAt} />,
    },
  ];
}

function VerificationUserCard({
  getUserHref,
  user,
}: Readonly<{
  getUserHref?: (userId: string) => string;
  user: AdminKycUser;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Avatar decorative name={user.displayName} />
        <div className="min-w-0 flex-[1_1_180px]">
          <p className="text-fg font-semibold break-words">
            {user.displayName}
          </p>
          <p className="text-small text-fg-muted break-all">
            {user.email}
            {user.country ? ` · ${user.country}` : null}
          </p>
        </div>
        {getUserHref ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={getUserHref(user.id)}>Open user</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatusHistoryCard({
  history,
  onReload,
}: Readonly<{
  history: AdminSection<readonly AdminKycHistoryEvent[]>;
  onReload?: () => void;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status history</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminSectionBody
          label="status history"
          onRetry={onReload}
          section={history}
        >
          {(events) =>
            events.length === 0 ? (
              <p className="text-fg-muted">No status changes recorded.</p>
            ) : (
              <ol aria-label="Status history" className="grid gap-4">
                {events.map((event) => (
                  <li className="flex gap-3" key={event.id}>
                    <span
                      aria-hidden="true"
                      className="bg-brand mt-1.5 size-2.5 shrink-0 rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="text-fg font-semibold break-words">
                        {event.label}
                      </p>
                      <p className="text-small text-fg-muted">
                        <AdminDateTime value={event.occurredAt} />
                        {event.detail ? ` · ${event.detail}` : null}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )
          }
        </AdminSectionBody>
      </CardContent>
    </Card>
  );
}

const attemptColumns: readonly TableColumn<AdminKycAttempt>[] = [
  {
    cell: (attempt) => `#${attempt.attemptNumber}`,
    className: "text-fg font-medium whitespace-nowrap",
    header: "Attempt",
  },
  {
    cell: (attempt) => <StatusBadge status={attempt.status} />,
    header: "Status",
  },
  {
    cell: (attempt) => <AdminDateTime dateOnly value={attempt.startedAt} />,
    className: "whitespace-nowrap",
    header: "Started",
  },
  {
    cell: (attempt) => <AdminDateTime dateOnly value={attempt.completedAt} />,
    className: "whitespace-nowrap",
    header: "Completed",
  },
];

function PreviousAttemptsCard({
  attempts,
  onReload,
}: Readonly<{
  attempts: AdminSection<readonly AdminKycAttempt[]>;
  onReload?: () => void;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Previous attempts</CardTitle>
      </CardHeader>
      {attempts.state === "unavailable" ? (
        <CardContent>
          <AdminSectionBody label="previous attempts" section={attempts}>
            {() => null}
          </AdminSectionBody>
        </CardContent>
      ) : (
        <DataTable
          caption="Verification attempts"
          columns={attemptColumns}
          emptyMessage="No previous attempts."
          error={
            attempts.state === "error" ? (
              <ErrorState
                className="py-2"
                description="Previous attempts could not be loaded."
                onRetry={onReload}
                title="Couldn't load previous attempts"
              />
            ) : undefined
          }
          keyField={(attempt) => attempt.id}
          loading={attempts.state === "loading"}
          loadingLabel="Loading previous attempts"
          loadingRows={3}
          mobileLayout="stack"
          rows={attempts.state === "ready" ? attempts.data : []}
          variant="embedded"
        />
      )}
    </Card>
  );
}

/**
 * Verification detail page body: read-only verification facts, the user,
 * a status timeline and previous attempts. Without `onRefresh` the refresh
 * action is disabled with an explanation.
 */
export function AdminKycDetailScreen({
  getUserHref,
  listHref,
  model,
  onRefresh,
  onReload,
  refreshing = false,
}: Readonly<{
  /** Link to an implemented user detail route. */
  getUserHref?: (userId: string) => string;
  /** Implemented KYC list route, for the back link. */
  listHref?: string;
  model: AdminKycDetailModel;
  onRefresh?: () => void;
  onReload?: () => void;
  refreshing?: boolean;
}>) {
  const hintId = useId();

  const back = listHref ? (
    <Link
      className="text-small text-brand-ink inline-flex w-fit items-center gap-1.5 font-medium hover:underline"
      href={listHref}
    >
      <ArrowLeftIcon size="xs" />
      KYC monitoring
    </Link>
  ) : null;

  if (model.state !== "ready") {
    return (
      <section className="space-y-6">
        {model.state === "forbidden" ? null : back}
        <AdminDetailFallback
          onRetry={onReload}
          resourceLabel="Verification"
          state={model}
        />
      </section>
    );
  }

  const { attempts, history, verification } = model.record;

  return (
    <section className="space-y-6">
      {back}
      <DashboardHeader
        actions={
          <Button
            aria-describedby={onRefresh ? undefined : hintId}
            disabled={!onRefresh}
            leadingIcon={<RefreshIcon />}
            loading={refreshing}
            onClick={onRefresh}
            variant="secondary"
          >
            Refresh status
          </Button>
        }
        description={kycAttemptLabel(verification)}
        title={`Verification · ${verification.user.displayName}`}
      />
      {onRefresh ? null : <AdminUnavailableHint id={hintId} />}
      <Alert variant="info">{kycDecisionNotice(verification.provider)}</Alert>
      {parseAdminKycStatus(verification.status) === "unknown" ? (
        <Alert variant="warning">
          The provider reported a status this portal doesn&apos;t recognise.
          Treat the verification as unresolved.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueList items={verificationItems(verification)} />
            </CardContent>
          </Card>
          <VerificationUserCard
            getUserHref={getUserHref}
            user={verification.user}
          />
        </div>
        <StatusHistoryCard history={history} onReload={onReload} />
      </div>

      <PreviousAttemptsCard attempts={attempts} onReload={onReload} />
    </section>
  );
}
