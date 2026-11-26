import { DashboardHeader } from "@template/dashboard-ui";
import {
  ActivityIcon,
  Alert,
  CreditCardIcon,
  UsersIcon,
  WalletIcon,
} from "@template/ui-core";
import {
  AdminChartSection,
  AdminKpiCard,
  AdminKpiGrid,
  AdminRangeFilter,
  AdminSummaryCard,
  AdminSummaryGrid,
  type AdminRangePreset,
} from "@/components/admin-patterns";
import type { AdminDashboardData } from "./admin-dashboard-data";

const countFormatter = new Intl.NumberFormat("en-US");

/**
 * Operations overview (reference `AdminDashboard`, all four variants share
 * this one responsive composition). It renders the state it is given; the
 * route decides the source. Summary cards have no "Open …" links until
 * their routes exist.
 */
export function AdminDashboard({
  data,
  onPeriodChange,
}: Readonly<{
  data: AdminDashboardData;
  /** Only when a live source can re-query for the chosen period. */
  onPeriodChange?: (preset: AdminRangePreset) => void;
}>) {
  const unavailableCount = countUnavailablePanels(data);

  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        actions={
          <AdminRangeFilter
            disabled={Boolean(data.period.unavailableReason)}
            disabledReason={data.period.unavailableReason}
            onChange={onPeriodChange}
            range={data.period.range}
            value={data.period.preset}
          />
        }
        description="Platform health across users, payments and subscriptions."
        title="Operations overview"
      />
      {unavailableCount > 0 ? (
        <Alert title="Operational data is not connected yet" variant="info">
          Panels marked &ldquo;Not available&rdquo; have no admin API yet. They
          never show sample or estimated figures.
        </Alert>
      ) : null}
      <AdminKpiGrid>
        <AdminKpiCard
          icon={<UsersIcon />}
          label="Total users"
          metric={data.kpis.totalUsers}
        />
        <AdminKpiCard
          icon={<ActivityIcon />}
          label="Daily active users"
          metric={data.kpis.dailyActiveUsers}
        />
        <AdminKpiCard
          icon={<CreditCardIcon />}
          label="Payment volume"
          metric={data.kpis.paymentVolume}
        />
        <AdminKpiCard
          icon={<WalletIcon />}
          label="Monthly recurring revenue"
          metric={data.kpis.recurringRevenue}
        />
      </AdminKpiGrid>
      <div className="grid grid-cols-1 gap-3 md:gap-5 xl:grid-cols-2">
        <AdminChartSection
          data={data.registrations}
          formatValue={(value) => countFormatter.format(value)}
          kind="line"
          title="New registrations"
        />
        <AdminChartSection
          data={data.payments}
          formatValue={(value) => countFormatter.format(value)}
          kind="bars"
          title="Payments: successful vs failed"
        />
      </div>
      <AdminSummaryGrid>
        <AdminSummaryCard data={data.kycQueue} title="KYC queue" />
        <AdminSummaryCard
          data={data.subscriptionsNeedingAttention}
          title="Subscriptions needing attention"
        />
        <AdminSummaryCard
          data={data.paymentProviders}
          title="Payment providers"
        />
      </AdminSummaryGrid>
    </section>
  );
}

function countUnavailablePanels(data: AdminDashboardData): number {
  return [
    ...Object.values(data.kpis),
    data.registrations,
    data.payments,
    data.kycQueue,
    data.subscriptionsNeedingAttention,
    data.paymentProviders,
  ].filter((panel) => panel.state === "unavailable").length;
}
