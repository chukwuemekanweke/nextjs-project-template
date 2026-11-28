"use client";

import { useCurrentKycVerification } from "@template/api-react/kyc";
import {
  useActiveSessions,
  usePasskeys,
  useTwoFactorStatus,
} from "@template/api-react/authentication";
import {
  DEFAULT_BILLING_HISTORY_PAGE_SIZE,
  useBillingHistory,
  useCurrentSubscription,
} from "@template/api-react/subscriptions";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CreditCardIcon,
  EmptyState,
  ErrorState,
  InboxIcon,
  LaptopIcon,
  ShieldCheckIcon,
  WalletIcon,
  buttonVariants,
} from "@template/ui-core";
import Link from "next/link";
import { billingRoutes, resolveBillingOwnerType } from "@/config/billing";
import {
  billingActivityRows,
  securityChecklist,
  summarizePlan,
  summarizeSecurity,
  summarizeSessions,
  type MetricSummary,
} from "./dashboard-overview";
import {
  ActivityTable,
  IdentityVerificationCallout,
  MetricCard,
  MetricGrid,
  SecurityChecklist,
  textLinkClassName,
} from "./dashboard-sections";
import { toVerificationState } from "@/features/verification/verification-adapter";
import {
  verificationActionFor,
  verificationStatusCopy,
} from "@/features/verification/verification-model";

/*
 * Live dashboard widgets. They reuse the portal's existing TanStack Query
 * hooks (same keys and BFF routes as Billing and Security, so the cache is
 * shared) and add no API operations. Each widget loads and fails on its own.
 */

const SECURITY_HREF = "/security";
const VERIFICATION_HREF = "/verification";

/** Uses the same authoritative KYC key as the verification page. */
export function DashboardVerificationCallout() {
  const query = useCurrentKycVerification();
  if (!query.data || query.isError || query.isPending) return null;
  const state = toVerificationState(query.data);
  if (!state || state.status === "verified") return null;
  const copy = verificationStatusCopy(state);
  const action = verificationActionFor(state);
  return (
    <IdentityVerificationCallout
      action={
        <Link
          className={buttonVariants({ size: "sm", variant: "secondary" })}
          href={VERIFICATION_HREF}
        >
          {action?.label ?? "View verification"}
        </Link>
      }
      title={copy.title}
    >
      {copy.description}
    </IdentityVerificationCallout>
  );
}

/** No wallet API exists (DR-059); the tile never shows a balance. */
const WALLET_UNAVAILABLE: MetricSummary = {
  detail: "Wallet is not available yet.",
  state: "unavailable",
};

function RetryButton({
  label,
  onRetry,
  retrying,
}: Readonly<{ label: string; onRetry: () => void; retrying: boolean }>) {
  return (
    <Button
      aria-label={`Try loading ${label} again`}
      loading={retrying}
      onClick={onRetry}
      size="sm"
      variant="secondary"
    >
      Try again
    </Button>
  );
}

export function DashboardMetrics() {
  const ownerType = resolveBillingOwnerType();
  const subscription = useCurrentSubscription(ownerType);
  const twoFactor = useTwoFactorStatus();
  const passkeys = usePasskeys();
  const sessions = useActiveSessions();

  const plan = summarizePlan(subscription);
  const security = summarizeSecurity(
    securityChecklist({ passkeys, twoFactor }),
  );
  const activeSessions = summarizeSessions(sessions);

  return (
    <MetricGrid>
      <MetricCard
        icon={<WalletIcon />}
        label="Wallet balance"
        metric={WALLET_UNAVAILABLE}
        unavailableLabel="Not available"
      />
      <MetricCard
        action={
          plan.state === "unavailable" ? (
            <RetryButton
              label="your plan"
              onRetry={() => void subscription.refetch()}
              retrying={subscription.isFetching}
            />
          ) : null
        }
        icon={<CreditCardIcon />}
        label="Current plan"
        metric={plan}
      />
      <MetricCard
        action={
          security.state === "unavailable" ? (
            <RetryButton
              label="your security score"
              onRetry={() => {
                if (twoFactor.isError) void twoFactor.refetch();
                if (passkeys.isError) void passkeys.refetch();
              }}
              retrying={twoFactor.isFetching || passkeys.isFetching}
            />
          ) : null
        }
        icon={<ShieldCheckIcon />}
        label="Security score"
        metric={security}
      />
      <MetricCard
        action={
          activeSessions.state === "unavailable" ? (
            <RetryButton
              label="active sessions"
              onRetry={() => void sessions.refetch()}
              retrying={sessions.isFetching}
            />
          ) : null
        }
        icon={<LaptopIcon />}
        label="Active sessions"
        metric={activeSessions}
      />
    </MetricGrid>
  );
}

export function SecurityChecklistCard() {
  const twoFactor = useTwoFactorStatus();
  const passkeys = usePasskeys();
  const items = securityChecklist({ passkeys, twoFactor });

  return (
    <Card aria-labelledby="security-checklist-heading" role="region">
      <CardHeader>
        <CardTitle id="security-checklist-heading">
          Security checklist
        </CardTitle>
        <Link className={textLinkClassName} href={SECURITY_HREF}>
          Open security
        </Link>
      </CardHeader>
      <CardContent>
        <SecurityChecklist
          action={(item) => (
            <Link
              aria-label={`Set up ${item.title.toLowerCase()} in Security`}
              className={buttonVariants({ size: "sm", variant: "secondary" })}
              href={SECURITY_HREF}
            >
              {item.id === "two-factor" ? "Set up" : "Add"}
            </Link>
          )}
          items={items}
        />
      </CardContent>
    </Card>
  );
}

export function RecentBillingActivityCard() {
  const ownerType = resolveBillingOwnerType();
  // Same key as the first Billing history page, so the request is shared.
  const history = useBillingHistory(ownerType, {
    page: 1,
    pageSize: DEFAULT_BILLING_HISTORY_PAGE_SIZE,
  });
  const failed = history.isError && !history.data;

  return (
    <Card aria-labelledby="recent-activity-heading" role="region">
      <CardHeader>
        <CardTitle id="recent-activity-heading">
          Recent billing activity
        </CardTitle>
        <Link className={textLinkClassName} href={billingRoutes.history}>
          See all
        </Link>
      </CardHeader>
      <ActivityTable
        caption="Recent billing activity"
        empty={
          <EmptyState
            className="border-0"
            description="Subscription payments will appear here."
            icon={<InboxIcon />}
            title="No billing activity yet"
          />
        }
        error={
          failed ? (
            <ErrorState
              description="Your billing activity could not be loaded."
              onRetry={() => void history.refetch()}
              retrying={history.isFetching}
            />
          ) : undefined
        }
        loading={history.isPending}
        rows={history.data ? billingActivityRows(history.data.items) : []}
      />
    </Card>
  );
}
