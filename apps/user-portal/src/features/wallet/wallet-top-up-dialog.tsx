"use client";

import {
  Alert,
  Button,
  Dialog,
  FormField,
  Input,
  Select,
} from "@template/ui-core";
import { useId, useState, type FormEvent } from "react";
import {
  formatWalletAmount,
  selectedTopUpPreset,
  topUpPresetInputText,
  validateTopUpDraft,
  type WalletAction,
  type WalletDisplayOptions,
  type WalletTopUpConfig,
} from "./wallet-model";

/** Reference redirect notice, without a balance-update promise (DR-114). */
export const TOP_UP_REDIRECT_NOTICE =
  "You'll be redirected to the selected provider to pay. Your wallet is credited only after the provider confirms the payment.";

/**
 * Reference top-up dialog: amount, preset chips, provider select and the
 * redirect notice. Submitting validates the draft and reports a `topUp`
 * intent; it never initiates a payment, redirects or shows a result (return
 * handling is not designed, DR-059). Mount with a fresh `key` per opening to
 * reset its state. While `pending` it cannot be dismissed.
 */
export function WalletTopUpDialog({
  config,
  display,
  error,
  onClose,
  onSubmit,
  pending = false,
}: Readonly<{
  config: Extract<WalletTopUpConfig, { state: "ready" }>;
  display?: WalletDisplayOptions;
  /** Safe adapter message when the previous submission failed. */
  error?: string;
  onClose: () => void;
  onSubmit: (action: Extract<WalletAction, { type: "topUp" }>) => void;
  pending?: boolean;
}>) {
  const formId = useId();
  const amountId = useId();
  const amountMessageId = useId();
  const providerId = useId();
  const providerMessageId = useId();
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState(config.providers[0]?.id ?? "");
  const [amountError, setAmountError] = useState<string>();
  const [providerError, setProviderError] = useState<string>();
  const selectedPreset = selectedTopUpPreset(amount, config);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const result = validateTopUpDraft(
      { amount, providerId: provider },
      config,
      display,
    );
    if (result.ok) {
      setAmountError(undefined);
      setProviderError(undefined);
      onSubmit(result.action);
      return;
    }
    setAmountError(result.amountError);
    setProviderError(result.providerError);
  }

  return (
    <Dialog
      dismissible={!pending}
      footer={
        <>
          <Button disabled={pending} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button form={formId} loading={pending} type="submit">
            Continue to payment
          </Button>
        </>
      }
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      title="Top up wallet"
    >
      <form
        className="flex flex-col gap-4"
        id={formId}
        noValidate
        onSubmit={submit}
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        <FormField
          descriptionId={amountMessageId}
          error={amountError}
          inputId={amountId}
          label={`Amount (${config.currencyCode})`}
          required
        >
          <Input
            aria-describedby={amountError ? amountMessageId : undefined}
            aria-invalid={amountError ? true : undefined}
            autoComplete="off"
            autoFocus
            disabled={pending}
            id={amountId}
            inputMode="decimal"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            required
            value={amount}
          />
        </FormField>
        {config.presetsMinorUnits.length > 0 ? (
          <div
            aria-label="Preset amounts"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {config.presetsMinorUnits.map((preset) => (
              <Button
                aria-pressed={selectedPreset === String(preset)}
                data-preset={String(preset)}
                disabled={pending}
                key={String(preset)}
                onClick={() => {
                  setAmount(topUpPresetInputText(preset, config.currencyCode));
                  setAmountError(undefined);
                }}
                size="sm"
                variant="secondary"
              >
                {formatWalletAmount(
                  {
                    amountMinorUnits: preset,
                    currencyCode: config.currencyCode,
                  },
                  display,
                )}
              </Button>
            ))}
          </div>
        ) : null}
        <FormField
          descriptionId={providerMessageId}
          error={providerError}
          inputId={providerId}
          label="Pay with"
          required
        >
          <Select
            aria-describedby={providerError ? providerMessageId : undefined}
            aria-invalid={providerError ? true : undefined}
            disabled={pending}
            id={providerId}
            onChange={(event) => setProvider(event.target.value)}
            required
            value={provider}
          >
            {config.providers.map((option) => (
              <option key={option.id} value={option.id}>
                {option.description
                  ? `${option.name} — ${option.description}`
                  : option.name}
              </option>
            ))}
          </Select>
        </FormField>
        <Alert variant="info">{TOP_UP_REDIRECT_NOTICE}</Alert>
      </form>
    </Dialog>
  );
}
