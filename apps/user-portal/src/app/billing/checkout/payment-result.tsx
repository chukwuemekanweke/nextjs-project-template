import { Card } from "@template/ui-core";
import type { ReactNode } from "react";
import {
  AlertIcon,
  CancelCircleIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
} from "./checkout-icons";

export type PaymentResultIconKind =
  "attention" | "cancelled" | "pending" | "success";

const ICONS: Record<PaymentResultIconKind, ReactNode> = {
  attention: <AlertIcon className="h-9 w-9 sm:h-10 sm:w-10" />,
  cancelled: <CancelCircleIcon className="h-9 w-9 sm:h-10 sm:w-10" />,
  pending: <ClockIcon className="h-9 w-9 sm:h-10 sm:w-10" />,
  success: <CheckIcon className="h-10 w-10 sm:h-12 sm:w-12" />,
};

/**
 * Centered result card shared by the payment success, cancelled, and
 * verification states. Content is supplied by the caller; this only owns the
 * visual structure.
 */
export function PaymentResultCard({
  actions,
  busy = false,
  children,
  description,
  footer = false,
  icon,
  title,
}: Readonly<{
  actions: ReactNode;
  busy?: boolean;
  children?: ReactNode;
  description: ReactNode;
  footer?: boolean;
  icon: PaymentResultIconKind;
  title: string;
}>) {
  return (
    <Card className="shadow-theme-sm mx-auto w-full max-w-2xl">
      <div className="px-5 py-8 text-center sm:px-10 sm:py-10">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24 ${
            icon === "attention"
              ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
              : "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
          }`}
        >
          {ICONS[icon]}
        </div>
        <div aria-busy={busy} aria-live="polite" role="status">
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-gray-500 sm:text-lg dark:text-gray-400">
            {description}
          </p>
        </div>
        {children ? <div className="mt-8 text-left">{children}</div> : null}
        <div className="mt-8 flex flex-col items-center gap-3">{actions}</div>
        {footer ? (
          <p className="mt-8 flex items-center justify-center gap-2 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <LockIcon className="h-4 w-4 shrink-0" />
            <span>Secure payment. Processed by our billing service.</span>
          </p>
        ) : null}
      </div>
    </Card>
  );
}

/** Plan and amount panel; every value comes from backend data. */
export function PaymentResultSummary({
  amount,
  amountLabel,
  planDetail,
  planName,
}: Readonly<{
  amount: string;
  amountLabel: string;
  planDetail?: string;
  planName?: string;
}>) {
  return (
    <dl className="bg-brand-25 dark:bg-brand-500/10 flex flex-col gap-4 rounded-xl px-5 py-5 sm:flex-row sm:items-center sm:px-8">
      {planName ? (
        <div className="min-w-0 flex-1">
          <dt className="sr-only">Plan</dt>
          <dd className="text-lg font-semibold break-words text-gray-900 sm:text-xl dark:text-white">
            {planName}
          </dd>
          {planDetail ? (
            <dd className="mt-1 text-sm text-gray-500 sm:text-base dark:text-gray-400">
              {planDetail}
            </dd>
          ) : null}
        </div>
      ) : null}
      <div
        className={
          planName
            ? "border-t border-gray-200 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8 dark:border-gray-700"
            : ""
        }
      >
        <dt className="text-sm text-gray-500 dark:text-gray-400">
          {amountLabel}
        </dt>
        <dd className="mt-1 text-xl font-bold break-words text-gray-900 sm:text-2xl dark:text-white">
          {amount}
        </dd>
      </div>
    </dl>
  );
}
