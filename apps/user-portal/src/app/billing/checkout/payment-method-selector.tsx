"use client";

import { isApiError } from "@template/api-client";
import type { EligiblePaymentProviderResponse } from "@template/api-client/subscriptions";
import type { useEligiblePaymentProviders } from "@template/api-react/subscriptions";
import {
  Alert,
  CreditCardIcon,
  IconTile,
  Skeleton,
  cn,
} from "@template/ui-core";
import {
  describeBillingLoadError,
  isPortalSupportedPaymentMethod,
} from "@/lib/billing-display";
import { paymentProviderDescription } from "@/lib/billing-presentation";
import { BankIcon } from "./checkout-icons";

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
        <Skeleton className="h-[4.5rem] w-full rounded-lg" />
        <Skeleton className="h-[4.5rem] w-full rounded-lg" />
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
      <legend className="sr-only">Payment provider</legend>
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
  const interactive = supported && !disabled;
  const descriptionId = `payment-provider-${provider.id}-description`;
  return (
    <label
      className={cn(
        "border-border-strong bg-surface flex items-center gap-3 rounded-lg border p-4 transition-colors",
        "has-[input:focus-visible]:outline-focus has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2",
        checked && "border-brand bg-brand-soft ring-brand ring-1",
        interactive && !checked && "hover:bg-hover",
        interactive ? "cursor-pointer" : "cursor-not-allowed",
        !supported && "opacity-60",
      )}
      data-selected={checked ? "true" : undefined}
    >
      <input
        aria-describedby={descriptionId}
        checked={checked}
        className="accent-brand size-[18px] shrink-0 focus-visible:outline-none disabled:cursor-not-allowed"
        disabled={!supported}
        name="paymentProviderId"
        onChange={() => onSelect(provider.id)}
        type="radio"
        value={provider.id}
      />
      <IconTile className="max-sm:hidden" tone={checked ? "brand" : "neutral"}>
        {provider.paymentMethodType === "BankTransfer" ? (
          <BankIcon />
        ) : (
          <CreditCardIcon />
        )}
      </IconTile>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span
          className={cn(
            "text-fg break-words",
            checked ? "font-semibold" : "font-medium",
          )}
        >
          {provider.name}
        </span>
        <span className="text-small text-fg-muted" id={descriptionId}>
          {paymentProviderDescription(provider)}
        </span>
      </span>
    </label>
  );
}
