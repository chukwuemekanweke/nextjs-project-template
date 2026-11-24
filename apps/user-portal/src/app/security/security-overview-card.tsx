"use client";

import {
  usePasskeys,
  useTwoFactorStatus,
} from "@template/api-react/authentication";
import {
  Card,
  CardContent,
  FingerprintIcon,
  KeyIcon,
  SectionHeader,
  ShieldIcon,
  Skeleton,
  SmartphoneIcon,
  StatusBadge,
} from "@template/ui-core";
import type { ReactNode } from "react";
import {
  PASSWORD_OVERVIEW_STATUS,
  passkeyOverviewStatus,
  twoFactorOverviewStatus,
  type OverviewStatus,
} from "./security-overview";

/**
 * Summary of sign-in methods. It reads the same cached queries as the passkey
 * and two-factor cards, so it adds no requests of its own.
 */
export function SecurityOverviewCard() {
  const passkeys = usePasskeys();
  const twoFactor = useTwoFactorStatus();

  return (
    <Card>
      <CardContent>
        <SectionHeader
          description="A quick overview of your account security status."
          icon={<ShieldIcon className="h-6 w-6" />}
          title="Account security overview"
        />
        <ul className="bg-brand-50/70 dark:bg-brand-500/[0.07] divide-brand-100 mt-5 grid divide-y rounded-[10px] sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:py-3 dark:divide-gray-800">
          <OverviewItem
            icon={<KeyIcon className="h-6 w-6" />}
            label="Password"
            status={PASSWORD_OVERVIEW_STATUS}
          />
          <OverviewItem
            icon={<FingerprintIcon className="h-6 w-6" />}
            label="Passkeys"
            status={passkeyOverviewStatus(passkeys)}
          />
          <OverviewItem
            icon={<SmartphoneIcon className="h-6 w-6" />}
            label="Two-factor auth"
            status={twoFactorOverviewStatus(twoFactor)}
          />
        </ul>
      </CardContent>
    </Card>
  );
}

function OverviewItem({
  icon,
  label,
  status,
}: Readonly<{ icon: ReactNode; label: string; status: OverviewStatus }>) {
  return (
    <li className="flex items-center gap-4 px-5 py-4 sm:justify-center sm:py-2">
      <span className="text-brand-500 dark:text-brand-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[15px] leading-6 font-semibold text-gray-900 dark:text-white/90">
          {label}
        </p>
        <div className="mt-1">
          {status.state === "loading" ? (
            <span aria-busy="true" role="status">
              <span className="sr-only">Checking {label} status</span>
              <Skeleton className="h-6 w-16 rounded-full" />
            </span>
          ) : (
            <StatusBadge tone={status.tone}>
              <span className="sr-only">{label} status: </span>
              {status.label}
            </StatusBadge>
          )}
        </div>
      </div>
    </li>
  );
}
