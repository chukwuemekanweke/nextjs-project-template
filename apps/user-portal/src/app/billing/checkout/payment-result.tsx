import {
  Card,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  IconTile,
  KeyValueList,
  LockIcon,
  TriangleAlertIcon,
  type IconTileTone,
} from "@template/ui-core";
import type { ReactNode } from "react";

export type PaymentResultIconKind =
  "attention" | "cancelled" | "pending" | "success";

const ICONS: Record<
  PaymentResultIconKind,
  Readonly<{ icon: ReactNode; tone: IconTileTone }>
> = {
  attention: { icon: <TriangleAlertIcon />, tone: "warning" },
  cancelled: { icon: <CircleXIcon />, tone: "danger" },
  pending: { icon: <ClockIcon />, tone: "warning" },
  success: { icon: <CircleCheckIcon />, tone: "success" },
};

/**
 * Centered result card (reference `UserCheckoutResult-*`) shared by every
 * payment-return outcome: success, pending, cancelled and the other states
 * the backend can report. Content is supplied by the caller; this only owns
 * the visual structure.
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
  const visual = ICONS[icon];
  return (
    <Card
      className="mx-auto w-full max-w-xl px-5 py-7 text-center md:px-8 md:py-9"
      data-result-icon={icon}
    >
      <IconTile className="mx-auto" size="lg" tone={visual.tone}>
        {visual.icon}
      </IconTile>
      <div aria-busy={busy} aria-live="polite" role="status">
        <h1 className="text-h1 text-fg mt-4">{title}</h1>
        <p className="text-fg-muted mx-auto mt-2 max-w-md">{description}</p>
      </div>
      {children ? <div className="mt-6 text-left">{children}</div> : null}
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {actions}
      </div>
      {footer ? (
        <p className="border-border text-small text-fg-muted mt-6 flex items-center justify-center gap-2 border-t pt-5">
          <LockIcon className="shrink-0" size="xs" />
          <span>Secure payment. Processed by our billing service.</span>
        </p>
      ) : null}
    </Card>
  );
}

/** Plan, amount and reference (reference `.kv`); every value is backend data. */
export function PaymentResultSummary({
  amount,
  amountLabel,
  planDetail,
  planName,
  reference,
}: Readonly<{
  amount: string;
  amountLabel: string;
  planDetail?: string | undefined;
  planName?: string | undefined;
  reference?: string | undefined;
}>) {
  return (
    <div className="border-border bg-surface-2 rounded-lg border p-4">
      <KeyValueList
        items={[
          ...(planName
            ? [
                {
                  label: "Plan",
                  value: (
                    <>
                      {planName}
                      {planDetail ? (
                        <span className="text-fg-muted font-normal">
                          {" "}
                          · {planDetail}
                        </span>
                      ) : null}
                    </>
                  ),
                },
              ]
            : []),
          { label: amountLabel, value: amount },
          ...(reference
            ? [
                {
                  label: "Reference",
                  value: <span className="font-mono">{reference}</span>,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
