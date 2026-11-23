"use client";

import { isApiError } from "@template/api-client";
import type { EligiblePaymentProviderResponse } from "@template/api-client/subscriptions";
import type { useEligiblePaymentProviders } from "@template/api-react/subscriptions";
import { Alert, Skeleton } from "@template/ui-core";
import {
  describeBillingLoadError,
  isPortalSupportedPaymentMethod,
  paymentMethodLabel,
} from "@/lib/billing-display";
import { BankIcon, PaymentCardIcon } from "./checkout-icons";

/**
 * Backend-discovered payment providers as a native radio group. Native radios
 * sharing one name give arrow-key navigation and screen-reader semantics; the
 * surrounding label makes the whole card clickable.
 */
export function PaymentMethodSelector({
  disabled,
  onSelect,
  providers,
  selectedId,
}: Readonly<{
  disabled: boolean;
  onSelect: (id: string) => void;
  providers: ReturnType<typeof useEligiblePaymentProviders>;
  selectedId: string | undefined;
}>) {
  if (providers.isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading payment methods"
        className="space-y-3"
        role="status"
      >
        <Skeleton className="h-[4.5rem] w-full rounded-xl" />
        <Skeleton className="h-[4.5rem] w-full rounded-xl" />
      </div>
    );
  }
  if (providers.isError) {
    return (
      <Alert variant="error">
        {isApiError(providers.error) && providers.error.status === 404
          ? "This plan is no longer available for purchase."
          : describeBillingLoadError(providers.error, "payment methods")}
      </Alert>
    );
  }
  if (providers.data.length === 0) {
    return (
      <Alert variant="warning">
        No payment methods are available for this plan in your region.
      </Alert>
    );
  }
  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
        Payment method
      </legend>
      <div className="space-y-3">
        {providers.data.map((provider) => (
          <PaymentMethodCard
            checked={provider.id === selectedId}
            disabled={disabled}
            key={provider.id}
            onSelect={onSelect}
            provider={provider}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function PaymentMethodCard({
  checked,
  disabled = false,
  onSelect,
  provider,
}: Readonly<{
  checked: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
  provider: EligiblePaymentProviderResponse;
}>) {
  const supported = isPortalSupportedPaymentMethod(provider.paymentMethodType);
  const method = paymentMethodLabel(provider.paymentMethodType);
  const interactive = supported && !disabled;
  return (
    <label
      className={[
        "flex items-center gap-4 rounded-xl border px-4 py-4 transition-colors sm:gap-5 sm:px-6 sm:py-5",
        "has-[input:focus-visible]:ring-brand-500/20 has-[input:focus-visible]:ring-3",
        checked
          ? "border-brand-500 ring-brand-500 bg-brand-25 dark:bg-brand-500/10 ring-1"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-transparent",
        interactive && !checked
          ? "hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-white/[0.03]"
          : "",
        interactive ? "cursor-pointer" : "cursor-not-allowed",
        supported ? "" : "opacity-60",
      ].join(" ")}
      data-selected={checked ? "true" : undefined}
    >
      <input
        checked={checked}
        className="checked:border-brand-500 dark:checked:border-brand-500 h-5 w-5 shrink-0 appearance-none rounded-full border border-gray-300 bg-white transition-[border-width] outline-none checked:border-[6px] disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-900"
        disabled={!supported}
        name="paymentProviderId"
        onChange={() => onSelect(provider.id)}
        type="radio"
        value={provider.id}
      />
      <span
        className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:flex ${
          checked
            ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
            : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400"
        }`}
      >
        {provider.paymentMethodType === "BankTransfer" ? (
          <BankIcon className="h-6 w-6" />
        ) : (
          <PaymentCardIcon className="h-6 w-6" />
        )}
      </span>
      <span className="min-w-0">
        <span
          className={`block text-base break-words text-gray-900 dark:text-white ${
            checked ? "font-semibold" : "font-medium"
          }`}
        >
          {provider.name}
        </span>
        <span className="mt-0.5 block text-sm text-gray-500 sm:text-base dark:text-gray-400">
          {supported ? method : `${method} is not available in this portal yet`}
        </span>
      </span>
    </label>
  );
}
