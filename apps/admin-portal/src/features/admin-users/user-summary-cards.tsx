"use client";

import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  FormField,
  KeyValueList,
  Select,
  type KeyValueItem,
} from "@template/ui-core";
import { useId, type ReactNode } from "react";
import {
  AdminDateTime,
  AdminNotAvailable,
  AdminSectionBody,
  formatAdminDateTime,
  type AdminSection,
} from "@/components/admin-patterns";
import { kycStatusBadge } from "@/features/admin-kyc/kyc-model";
import {
  subscriptionStatusBadge,
  type AdminRoleRef,
  type AdminUserDetail,
  type AdminUserKycSummary,
  type AdminUserSubscriptionSummary,
} from "./users-model";

/*
 * Read-only and role cards of the user detail screen. Values the source
 * does not report render as "Not available"; actions are reported to the
 * detail screen, which owns confirmation.
 */

export function TitledCard({
  action,
  children,
  title,
}: Readonly<{ action?: ReactNode; children: ReactNode; title: string }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
        {action}
      </CardHeader>
      {children}
    </Card>
  );
}

function optionalText(value: string | undefined): ReactNode {
  return value ?? <AdminNotAvailable />;
}

function SignInMethods({ methods }: Readonly<{ methods?: readonly string[] }>) {
  if (!methods || methods.length === 0) {
    return <AdminNotAvailable />;
  }
  return <>{methods.join(" · ")}</>;
}

function TwoFactor({ enabled }: Readonly<{ enabled?: boolean }>) {
  if (enabled === undefined) {
    return <AdminNotAvailable />;
  }
  return enabled ? (
    <Badge tone="success">Enabled</Badge>
  ) : (
    <Badge tone="warning">Not enabled</Badge>
  );
}

function accountItems(user: AdminUserDetail): readonly KeyValueItem[] {
  const { account } = user;
  return [
    { label: "Full name", value: optionalText(account.fullName) },
    { label: "Country", value: optionalText(account.country) },
    { label: "Language", value: optionalText(account.language) },
    { label: "Signed up", value: <AdminDateTime value={account.createdAt} /> },
    {
      label: "Last login",
      value:
        account.lastLoginAt === null ? (
          "Never"
        ) : (
          <AdminDateTime value={account.lastLoginAt} />
        ),
    },
    {
      label: "Last active",
      value: <AdminDateTime value={account.lastActiveAt} />,
    },
    {
      label: "Sign-in methods",
      value: <SignInMethods methods={account.signInMethods} />,
    },
    {
      label: "Two-factor",
      value: <TwoFactor enabled={account.twoFactorEnabled} />,
    },
  ];
}

export function UserAccountCard({ user }: Readonly<{ user: AdminUserDetail }>) {
  return (
    <TitledCard title="Account">
      <CardContent>
        <KeyValueList items={accountItems(user)} />
      </CardContent>
    </TitledCard>
  );
}

/**
 * Held roles (removable chips) and the assign control. The selection is
 * owned by the detail screen so it can be reset when the catalogue no
 * longer offers it.
 */
export function UserRolesCard({
  assignable,
  assignableRoles,
  describedBy,
  onAssign,
  onRemove,
  onSelectRole,
  roles,
  rolesHref,
  selectedRoleId,
}: Readonly<{
  /** Catalogue roles the user does not hold. */
  assignable: readonly AdminRoleRef[];
  assignableRoles: AdminSection<readonly AdminRoleRef[]>;
  describedBy?: string;
  onAssign?: (role: AdminRoleRef) => void;
  onRemove?: (role: AdminRoleRef) => void;
  onSelectRole: (roleId: string) => void;
  roles: readonly AdminRoleRef[];
  rolesHref?: string;
  selectedRoleId: string;
}>) {
  const roleSelectId = useId();
  const roleToAssign = assignable.find((role) => role.id === selectedRoleId);

  function assignSelectedRole() {
    if (roleToAssign) {
      onAssign?.(roleToAssign);
    }
  }

  return (
    <TitledCard title="Administrative roles">
      <CardContent className="grid gap-4">
        {roles.length === 0 ? (
          <p className="text-fg-muted">No administrative roles.</p>
        ) : (
          <ul aria-label="Assigned roles" className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <li key={role.id}>
                <Chip
                  onRemove={onRemove ? () => onRemove(role) : undefined}
                  removeLabel={`Remove ${role.name}`}
                >
                  {role.name}
                </Chip>
              </li>
            ))}
          </ul>
        )}
        <AdminSectionBody label="assignable roles" section={assignableRoles}>
          {() =>
            assignable.length === 0 ? (
              <p className="text-small text-fg-muted">
                No other roles to assign.
              </p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <FormField
                  className="min-w-[200px] flex-[1_1_200px]"
                  inputId={roleSelectId}
                  label="Role to assign"
                >
                  <Select
                    aria-describedby={describedBy}
                    disabled={!onAssign}
                    id={roleSelectId}
                    onChange={(event) => onSelectRole(event.target.value)}
                    value={roleToAssign ? roleToAssign.id : ""}
                  >
                    <option value="">Choose a role</option>
                    {assignable.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <Button
                  aria-describedby={describedBy}
                  disabled={!onAssign || !roleToAssign}
                  onClick={assignSelectedRole}
                >
                  Assign role
                </Button>
              </div>
            )
          }
        </AdminSectionBody>
        {rolesHref ? (
          <Link
            className="text-small text-brand-ink w-fit font-medium hover:underline"
            href={rolesHref}
          >
            Manage roles
          </Link>
        ) : null}
      </CardContent>
    </TitledCard>
  );
}

function KycSummary({
  getKycHref,
  kyc,
}: Readonly<{
  getKycHref?: (verificationId: string) => string;
  kyc: AdminUserKycSummary | null;
}>) {
  if (!kyc) {
    return <p className="text-fg-muted">No verification yet.</p>;
  }
  const badge = kycStatusBadge(kyc.status);
  const started = formatAdminDateTime(kyc.startedAt);
  const details = [
    kyc.attemptNumber ? `Attempt #${kyc.attemptNumber}` : null,
    started ? `started ${started}` : null,
  ].filter(Boolean);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="grid gap-1">
        <Badge className="w-fit" tone={badge.tone}>
          {badge.label}
        </Badge>
        {details.length > 0 ? (
          <p className="text-small text-fg-muted">{details.join(" · ")}</p>
        ) : null}
      </div>
      {getKycHref && kyc.verificationId ? (
        <Button asChild size="sm" variant="secondary">
          <Link href={getKycHref(kyc.verificationId)}>Open verification</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function UserKycCard({
  getKycHref,
  kyc,
}: Readonly<{
  getKycHref?: (verificationId: string) => string;
  kyc: AdminSection<AdminUserKycSummary | null>;
}>) {
  return (
    <TitledCard title="KYC">
      <CardContent>
        <AdminSectionBody label="verification status" section={kyc}>
          {(summary) => <KycSummary getKycHref={getKycHref} kyc={summary} />}
        </AdminSectionBody>
      </CardContent>
    </TitledCard>
  );
}

function SubscriptionSummary({
  subscription,
}: Readonly<{ subscription: AdminUserSubscriptionSummary | null }>) {
  if (!subscription) {
    return <p className="text-fg-muted">No subscription.</p>;
  }
  const badge = subscriptionStatusBadge(subscription.status);
  const renews = formatAdminDateTime(subscription.renewsAt);
  let autoRenew: string | null = null;
  if (subscription.autoRenew !== undefined) {
    autoRenew = `auto-renew ${subscription.autoRenew ? "on" : "off"}`;
  }
  const details = [renews ? `Renews ${renews}` : null, autoRenew].filter(
    Boolean,
  );
  return (
    <div className="grid gap-1">
      <p className="flex flex-wrap items-center gap-2">
        <span className="text-fg font-semibold">
          {subscription.planName}
          {subscription.interval ? ` · ${subscription.interval}` : ""}
        </span>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </p>
      {details.length > 0 ? (
        <p className="text-small text-fg-muted">{details.join(" · ")}</p>
      ) : null}
    </div>
  );
}

export function UserSubscriptionCard({
  subscription,
}: Readonly<{
  subscription: AdminSection<AdminUserSubscriptionSummary | null>;
}>) {
  return (
    <TitledCard title="Subscription">
      <CardContent>
        <AdminSectionBody label="subscription" section={subscription}>
          {(summary) => <SubscriptionSummary subscription={summary} />}
        </AdminSectionBody>
      </CardContent>
    </TitledCard>
  );
}
