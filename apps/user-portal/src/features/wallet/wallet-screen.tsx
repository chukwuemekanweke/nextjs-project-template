"use client";

import { DashboardHeader } from "@template/dashboard-ui";
import {
  Badge,
  Button,
  CalendarIcon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ClockIcon,
  DataTable,
  EmptyState,
  ErrorState,
  IconTile,
  InboxIcon,
  PlusIcon,
  SegmentedControl,
  Skeleton,
  TrendingUpIcon,
  WalletIcon,
  cn,
  type TableColumn,
} from "@template/ui-core";
import { useState, type ReactNode } from "react";
import {
  canTopUp,
  FILTERS_UNAVAILABLE_DESCRIPTION,
  formatWalletAmount,
  formatWalletDateTime,
  TOP_UP_UNAVAILABLE_DESCRIPTION,
  walletPreviewColumns,
  walletStatusBadge,
  walletStatusFilterOptions,
  type WalletAction,
  type WalletActionType,
  type WalletDisplayOptions,
  type WalletFigure,
  type WalletFilters,
  type WalletScreenModel,
  type WalletStatusFilter,
  type WalletSummary,
  type WalletTopUpConfig,
  type WalletTransaction,
  type WalletTransactionList,
} from "./wallet-model";
import { WalletTopUpDialog } from "./wallet-top-up-dialog";

/*
 * Presentational wallet screen (reference `UserWallet*`, USR-WALLET) with the
 * top-up dialog (`UserWalletTopUp*`, USR-WALLET-TOP-UP). It renders the model
 * it is given and reports intents through `onAction`; it never reads a
 * balance, initiates a payment, redirects or moves money. Typed preview data
 * lives in `wallet-preview.fixtures.ts` and is used by tests only.
 */

export const WALLET_PAGE_TITLE = "Wallet";

/** Behaviour shared by the screen and its sections. */
export type WalletActionProps = Readonly<{
  /** Intent currently being handled; its control shows a busy state. */
  busyAction?: WalletActionType;
  /**
   * Called with the chosen intent. When omitted, every action renders
   * disabled with an explanation (non-live composition).
   */
  onAction?: (action: WalletAction) => void;
}>;

/* ------------------------------------------------------------------------ */
/* Header and top-up entry point                                             */
/* ------------------------------------------------------------------------ */

const TOP_UP_HINT_ID = "wallet-top-up-hint";

/** Reference "Top up" button; disabled with a reason when not available. */
export function WalletTopUpButton({
  onAction,
  onOpen,
  topUp,
}: Readonly<{
  onAction?: WalletActionProps["onAction"];
  onOpen: () => void;
  topUp: WalletTopUpConfig;
}>) {
  const unavailable = !onAction || !canTopUp(topUp);
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button
        aria-describedby={unavailable ? TOP_UP_HINT_ID : undefined}
        aria-haspopup="dialog"
        data-action="openTopUp"
        disabled={unavailable}
        leadingIcon={<PlusIcon />}
        onClick={unavailable ? undefined : onOpen}
      >
        Top up
      </Button>
      {unavailable ? (
        <p className="text-small text-fg-subtle" id={TOP_UP_HINT_ID}>
          {TOP_UP_UNAVAILABLE_DESCRIPTION}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Summary tiles                                                             */
/* ------------------------------------------------------------------------ */

/** Reference `.stat` tile; never shows a figure the source did not supply. */
export function WalletFigureCard({
  display,
  figure,
  icon,
  label,
}: Readonly<{
  display?: WalletDisplayOptions;
  figure: WalletFigure;
  icon: ReactNode;
  label: string;
}>) {
  return (
    <Card aria-busy={figure.state === "loading" || undefined}>
      <CardContent
        className="flex h-full flex-col gap-1"
        data-figure={label}
        data-state={figure.state}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-small text-fg-muted font-normal">{label}</h3>
          <IconTile className="max-md:hidden" size="sm">
            {icon}
          </IconTile>
        </div>
        {figure.state === "loading" ? (
          <>
            <span className="sr-only" role="status">
              Loading {label.toLowerCase()}
            </span>
            <Skeleton className="mt-1 h-8 w-32 max-w-full" />
            <Skeleton className="mt-1 h-4 w-40 max-w-full" />
          </>
        ) : null}
        {figure.state === "ready" ? (
          <>
            <p className="text-stat text-fg break-words tabular-nums">
              {formatWalletAmount(figure.amount, display)}
            </p>
            {figure.detail ? (
              <p className="text-small text-fg-subtle">{figure.detail}</p>
            ) : null}
          </>
        ) : null}
        {figure.state === "unavailable" || figure.state === "error" ? (
          <>
            <p className="text-h2 text-fg-muted">Not available</p>
            <p className="text-small text-fg-subtle">
              {figure.state === "error"
                ? "This figure could not be loaded."
                : "Not provided by the wallet service yet."}
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** The three reference summary tiles. */
export function WalletSummaryGrid({
  busyAction,
  display,
  onAction,
  summary,
}: WalletActionProps &
  Readonly<{ display?: WalletDisplayOptions; summary: WalletSummary }>) {
  const failed = Object.values(summary).some(
    (figure) => figure.state === "error",
  );
  return (
    <section aria-labelledby="wallet-summary-heading" className="space-y-3">
      <h2 className="sr-only" id="wallet-summary-heading">
        Wallet summary
      </h2>
      <div className="grid gap-3 sm:grid-cols-3 md:gap-5">
        <WalletFigureCard
          display={display}
          figure={summary.available}
          icon={<WalletIcon />}
          label="Available balance"
        />
        <WalletFigureCard
          display={display}
          figure={summary.pending}
          icon={<ClockIcon />}
          label="Pending"
        />
        <WalletFigureCard
          display={display}
          figure={summary.fundedThisMonth}
          icon={<TrendingUpIcon />}
          label="Funded this month"
        />
      </div>
      {failed && onAction ? (
        <Button
          loading={busyAction === "reload"}
          onClick={() => onAction({ section: "summary", type: "reload" })}
          size="sm"
          variant="secondary"
        >
          Reload summary
        </Button>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Transactions                                                              */
/* ------------------------------------------------------------------------ */

function NotAvailable() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not available</span>
    </>
  );
}

function DateTimeCell({
  display,
  value,
}: Readonly<{ display?: WalletDisplayOptions; value?: string }>) {
  const formatted = formatWalletDateTime(value, display);
  if (!formatted || !value) return <NotAvailable />;
  return <time dateTime={value}>{formatted}</time>;
}

const amountTones = {
  failed: "text-fg-subtle",
  pending: "text-fg",
  successful: "text-success",
  unknown: "text-fg",
} as const;

/**
 * Reference columns. Provider, Reference and Status are included only when
 * the rows carry them (the wire contract does not, DR-059); the Receipt
 * column is omitted until receipts exist (FE-UI-018).
 */
export function walletTransactionColumns(
  transactions: readonly WalletTransaction[],
  display?: WalletDisplayOptions,
): readonly TableColumn<WalletTransaction>[] {
  const optional = walletPreviewColumns(transactions);
  const columns: TableColumn<WalletTransaction>[] = [
    {
      header: "Date",
      className: "whitespace-nowrap",
      cell: (row) => <DateTimeCell display={display} value={row.timestamp} />,
    },
    {
      header: "Type",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="text-fg font-medium break-words">
            {row.transactionTitle}
          </span>
          {row.transactionCategory ? (
            <span className="text-caption text-fg-subtle break-words">
              {row.transactionCategory}
            </span>
          ) : null}
        </span>
      ),
    },
  ];
  if (optional.provider) {
    columns.push({
      header: "Provider",
      className: "whitespace-nowrap",
      cell: (row) => row.providerName ?? <NotAvailable />,
    });
  }
  if (optional.reference) {
    columns.push({
      header: "Reference",
      cell: (row) =>
        row.reference ? (
          <span className="font-mono text-xs break-all">{row.reference}</span>
        ) : (
          <NotAvailable />
        ),
    });
  }
  if (optional.status) {
    columns.push({
      header: "Status",
      className: "whitespace-nowrap",
      cell: (row) => {
        const badge = walletStatusBadge(row.status ?? "unknown");
        return <Badge tone={badge.tone}>{badge.label}</Badge>;
      },
    });
  }
  columns.push({
    header: "Amount",
    align: "right",
    className: "whitespace-nowrap",
    cell: (row) => (
      <span
        className={cn(
          "font-semibold tabular-nums",
          amountTones[row.status ?? "unknown"],
        )}
      >
        {formatWalletAmount(
          { amountMinorUnits: row.amount, currencyCode: row.currencyCode },
          display,
        )}
      </span>
    ),
  });
  return columns;
}

const FILTER_HINT_ID = "wallet-filter-hint";

/** Status filter and date range (reference toolbar above the table). */
export function WalletTransactionFilters({
  busyAction,
  filters,
  onAction,
}: WalletActionProps & Readonly<{ filters: WalletFilters }>) {
  const unavailable = !onAction || filters.state !== "ready";
  const status: WalletStatusFilter =
    filters.state === "ready" ? filters.status : "all";
  return (
    <div className="border-border flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:px-6 md:py-4">
      <SegmentedControl
        aria-label="Filter transactions by status"
        disabled={unavailable}
        onValueChange={(value) =>
          onAction?.({ status: value, type: "filterStatus" })
        }
        options={walletStatusFilterOptions}
        value={status}
      />
      <Button
        aria-describedby={unavailable ? FILTER_HINT_ID : undefined}
        disabled={unavailable}
        leadingIcon={<CalendarIcon />}
        loading={busyAction === "chooseDateRange"}
        onClick={
          unavailable
            ? undefined
            : () => onAction?.({ type: "chooseDateRange" })
        }
        size="sm"
        variant="secondary"
      >
        Date range
      </Button>
      {unavailable ? (
        <p className="text-small text-fg-subtle w-full" id={FILTER_HINT_ID}>
          {FILTERS_UNAVAILABLE_DESCRIPTION}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Reference "Transactions" card. Rows stack into labelled blocks on phones.
 * The list is cursor-paged, so "Load more" replaces the reference
 * "Showing 1–4 of 4" pager (no total is returned, DR-115).
 */
export function WalletTransactionsCard({
  busyAction,
  display,
  filters,
  onAction,
  transactions,
}: WalletActionProps &
  Readonly<{
    display?: WalletDisplayOptions;
    filters: WalletFilters;
    transactions: WalletTransactionList;
  }>) {
  const rows = transactions.state === "ready" ? transactions.transactions : [];
  const filtered = filters.state === "ready" && filters.status !== "all";
  return (
    <Card aria-labelledby="wallet-transactions-heading" role="region">
      <CardHeader>
        <CardTitle id="wallet-transactions-heading">Transactions</CardTitle>
      </CardHeader>
      <WalletTransactionFilters
        busyAction={busyAction}
        filters={filters}
        onAction={onAction}
      />
      <DataTable
        caption="Wallet transactions"
        columns={walletTransactionColumns(rows, display)}
        empty={
          <EmptyState
            className="border-0 py-2"
            description={
              filtered
                ? "Try another status."
                : "Top-ups and other wallet activity will appear here."
            }
            icon={<InboxIcon />}
            title={
              filtered
                ? "No transactions match this filter"
                : "No transactions yet"
            }
          />
        }
        error={
          transactions.state === "error" ? (
            <ErrorState
              className="py-2"
              description="Your wallet transactions could not be loaded."
              onRetry={
                onAction
                  ? () => onAction({ section: "transactions", type: "reload" })
                  : undefined
              }
              retrying={busyAction === "reload"}
              title="Transactions unavailable"
            />
          ) : undefined
        }
        keyField={(row) => row.id}
        loading={transactions.state === "loading"}
        loadingLabel="Loading wallet transactions"
        loadingRows={4}
        mobileLayout="stack"
        rows={rows}
        variant="embedded"
      />
      {transactions.state === "ready" && transactions.hasMore ? (
        <div className="border-border flex justify-center border-t px-4 py-3 md:px-6">
          <Button
            disabled={!onAction}
            loading={busyAction === "loadMore"}
            onClick={
              onAction ? () => onAction({ type: "loadMore" }) : undefined
            }
            size="sm"
            variant="secondary"
          >
            Load more
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Screen                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * The whole wallet page body: header with the top-up entry point, summary
 * tiles and transactions, plus the top-up dialog. Loading, error and
 * unavailable states never fall back to sample data.
 */
export function WalletScreen({
  busyAction,
  display,
  model,
  onAction,
  topUpError,
}: WalletActionProps &
  Readonly<{
    display?: WalletDisplayOptions;
    model: WalletScreenModel;
    /** Safe message from the adapter when initiating a top-up failed. */
    topUpError?: string;
  }>) {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const topUp = model.topUp;
  const pending = busyAction === "topUp";

  return (
    <section className="space-y-6">
      <DashboardHeader
        actions={
          <WalletTopUpButton
            onAction={onAction}
            onOpen={() => {
              setDialogKey((key) => key + 1);
              setTopUpOpen(true);
            }}
            topUp={topUp}
          />
        }
        description="Fund your wallet and track your transactions."
        title={WALLET_PAGE_TITLE}
      />
      <WalletSummaryGrid
        busyAction={busyAction}
        display={display}
        onAction={onAction}
        summary={model.summary}
      />
      <WalletTransactionsCard
        busyAction={busyAction}
        display={display}
        filters={model.filters}
        onAction={onAction}
        transactions={model.transactions}
      />
      {topUpOpen && onAction && canTopUp(topUp) ? (
        <WalletTopUpDialog
          config={topUp}
          display={display}
          error={topUpError}
          key={dialogKey}
          onClose={() => setTopUpOpen(false)}
          onSubmit={onAction}
          pending={pending}
        />
      ) : null}
    </section>
  );
}
