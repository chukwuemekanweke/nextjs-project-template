"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Alert,
  ArrowLeftIcon,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  FieldError,
  FieldHint,
  FormField,
  Input,
  KeyValueList,
  Radio,
  RadioGroup,
  SearchInput,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
} from "@template/ui-core";
import {
  UNAVAILABLE_ACTION_DESCRIPTION,
  optionsUnavailableText,
  readyOptions,
  type AdminOptionsState,
} from "../admin-billing-shared/billing-model";
import { UnavailableActionHint } from "../admin-billing-shared/billing-sections";
import {
  ALLOCATION_REASON_MAX_LENGTH,
  EMPTY_ALLOCATION_DRAFT,
  allocationSummary,
  changeOwnerType,
  changeTenant,
  decideAllocation,
  overlapWarning,
  type AllocationDraft,
  type AllocationErrors,
  type AllocationIntent,
  type AllocationOverlap,
  type AllocationSummaryRow,
} from "./allocation-model";

/*
 * Allocate a subscription (reference `AdminAllocate*`). A preview form:
 * it validates locally, shows a summary, and after a confirmation reports
 * an `AllocationIntent` through `onAllocate`. Without a handler the review
 * button is disabled with a reason. The screen never says an allocation was
 * created; the page navigates to the backend's result when one exists.
 */

export const ALLOCATE_PAGE_TITLE = "Allocate a subscription";

export function AllocateScreen({
  backHref,
  durationOptions,
  error,
  initialDraft = EMPTY_ALLOCATION_DRAFT,
  onAllocate,
  onUserSearch,
  overlap,
  pending = false,
  planOptions,
  tenantOptions,
  userResults,
}: Readonly<{
  backHref?: string;
  /** Durations the allocation contract offers. */
  durationOptions?: AdminOptionsState;
  /** Safe message from the caller's failed request. */
  error?: string | null;
  initialDraft?: AllocationDraft;
  onAllocate?: (intent: AllocationIntent) => void;
  /** Looks up users in a tenant; results arrive as `userResults`. */
  onUserSearch?: (tenantId: string, query: string) => void;
  /** Existing subscription the backend reported for the chosen owner. */
  overlap?: AllocationOverlap | null;
  pending?: boolean;
  /** Active plans from the admin plans read. */
  planOptions?: AdminOptionsState;
  tenantOptions?: AdminOptionsState;
  userResults?: AdminOptionsState;
}>) {
  const id = useId();
  const [draft, setDraft] = useState<AllocationDraft>(initialDraft);
  const [errors, setErrors] = useState<AllocationErrors>({});
  const [confirming, setConfirming] = useState<AllocationIntent | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const formId = `${id}-form`;
  const hintId = `${id}-review-hint`;
  const field = (name: string) => `${id}-${name}`;
  const message = (name: keyof AllocationErrors | string) =>
    `${id}-${name}-message`;

  const tenants = readyOptions(tenantOptions);
  const users = readyOptions(userResults);
  const plans = readyOptions(planOptions);
  const durations = readyOptions(durationOptions);
  const summary = allocationSummary(draft, {
    durations,
    plans,
    tenants,
    users,
  });

  const tenantReason = optionsUnavailableText(tenantOptions, "Tenants");
  const planReason = optionsUnavailableText(planOptions, "Plans");
  const durationReason = optionsUnavailableText(durationOptions, "Durations");
  const searchReason = !onUserSearch
    ? "User lookup is not available yet."
    : !draft.tenantId
      ? "Choose a tenant first."
      : undefined;

  function update(next: AllocationDraft) {
    setDraft(next);
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onAllocate) return;
    const decision = decideAllocation(draft, pending);
    if (decision.kind === "blocked") return;
    if (decision.kind === "invalid") {
      setErrors(decision.errors);
      return;
    }
    setErrors({});
    setConfirming(decision.intent);
  }

  const describedBy = (name: keyof AllocationErrors, hint?: unknown) =>
    errors[name] || hint ? message(name) : undefined;

  return (
    <section className="grid gap-5 md:gap-6">
      {backHref ? (
        <Link
          className="text-small text-brand-ink inline-flex w-fit items-center gap-1.5 font-medium hover:underline"
          href={backHref}
        >
          <ArrowLeftIcon size="xs" />
          Subscriptions
        </Link>
      ) : null}
      <DashboardHeader
        description="Grant a plan without a payment. Allocations are complimentary and never count as revenue."
        title={ALLOCATE_PAGE_TITLE}
      />
      <div className="grid items-start gap-5 md:gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-5"
              id={formId}
              noValidate
              onSubmit={review}
            >
              <div className="grid gap-1.5">
                <p
                  className="text-label text-fg font-medium"
                  id={field("owner-type")}
                >
                  Allocate to
                </p>
                <SegmentedControl
                  aria-label="Allocate to"
                  disabled={pending}
                  onValueChange={(ownerType) =>
                    update(changeOwnerType(draft, ownerType))
                  }
                  options={[
                    { label: "User", value: "Stakeholder" },
                    { label: "Tenant", value: "Tenant" },
                  ]}
                  value={draft.ownerType}
                />
              </div>
              <FormField
                descriptionId={describedBy("tenantId", tenantReason)}
                error={errors.tenantId}
                hint={tenantReason}
                inputId={field("tenant")}
                label="Tenant"
                required
              >
                <Select
                  aria-describedby={describedBy("tenantId", tenantReason)}
                  aria-invalid={errors.tenantId ? true : undefined}
                  disabled={pending || Boolean(tenantReason)}
                  id={field("tenant")}
                  onChange={(event) =>
                    update(changeTenant(draft, event.target.value))
                  }
                  value={draft.tenantId}
                >
                  <option value="">Choose a tenant</option>
                  {tenants.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              {draft.ownerType === "Stakeholder" ? (
                <div className="grid gap-3" data-owner-lookup="">
                  <FormField
                    descriptionId={searchReason ? message("search") : undefined}
                    hint={searchReason}
                    inputId={field("user-search")}
                    label="User in this tenant"
                    required
                  >
                    <SearchInput
                      aria-describedby={
                        searchReason ? message("search") : undefined
                      }
                      className="md:max-w-none"
                      disabled={pending || Boolean(searchReason)}
                      id={field("user-search")}
                      onChange={(event) => {
                        setUserQuery(event.target.value);
                        onUserSearch?.(
                          draft.tenantId,
                          event.target.value.trim(),
                        );
                      }}
                      placeholder="Search by name or email"
                      value={userQuery}
                    />
                  </FormField>
                  <UserResults
                    disabled={pending}
                    error={errors.userId}
                    name={field("user")}
                    onSelect={(userId) => update({ ...draft, userId })}
                    results={userResults}
                    searched={Boolean(onUserSearch && draft.tenantId)}
                    selected={draft.userId}
                  />
                </div>
              ) : null}
              <FormField
                descriptionId={describedBy("planId", planReason ?? true)}
                error={errors.planId}
                hint={planReason ?? "Active plans only."}
                inputId={field("plan")}
                label="Plan"
                required
              >
                <Select
                  aria-describedby={describedBy("planId", planReason ?? true)}
                  aria-invalid={errors.planId ? true : undefined}
                  disabled={pending || Boolean(planReason)}
                  id={field("plan")}
                  onChange={(event) =>
                    update({ ...draft, planId: event.target.value })
                  }
                  value={draft.planId}
                >
                  <option value="">Choose a plan</option>
                  {plans.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  descriptionId={describedBy("startDate", true)}
                  error={errors.startDate}
                  hint="UTC day."
                  inputId={field("start")}
                  label="Start date"
                  required
                >
                  <Input
                    aria-describedby={describedBy("startDate", true)}
                    aria-invalid={errors.startDate ? true : undefined}
                    disabled={pending}
                    id={field("start")}
                    onChange={(event) =>
                      update({ ...draft, startDate: event.target.value })
                    }
                    type="date"
                    value={draft.startDate}
                  />
                </FormField>
                <FormField
                  descriptionId={describedBy("durationId", durationReason)}
                  error={errors.durationId}
                  hint={durationReason}
                  inputId={field("duration")}
                  label="Duration"
                  required
                >
                  <Select
                    aria-describedby={describedBy("durationId", durationReason)}
                    aria-invalid={errors.durationId ? true : undefined}
                    disabled={pending || Boolean(durationReason)}
                    id={field("duration")}
                    onChange={(event) =>
                      update({ ...draft, durationId: event.target.value })
                    }
                    value={draft.durationId}
                  >
                    <option value="">Choose a duration</option>
                    {durations.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label
                    className="text-fg font-semibold"
                    htmlFor={field("renew")}
                  >
                    Renew automatically
                  </label>
                  <p className="text-small text-fg-muted" id={message("renew")}>
                    The backend decides whether renewal is possible without a
                    payment method.
                  </p>
                </div>
                <Switch
                  aria-describedby={message("renew")}
                  checked={draft.autoRenew}
                  disabled={pending}
                  id={field("renew")}
                  onCheckedChange={(autoRenew) =>
                    update({ ...draft, autoRenew })
                  }
                />
              </div>
              <FormField
                descriptionId={describedBy("reason", true)}
                error={errors.reason}
                hint="Recorded in audit history."
                inputId={field("reason")}
                label="Reason"
                required
              >
                <Textarea
                  aria-describedby={describedBy("reason", true)}
                  aria-invalid={errors.reason ? true : undefined}
                  aria-required
                  disabled={pending}
                  id={field("reason")}
                  maxLength={ALLOCATION_REASON_MAX_LENGTH}
                  onChange={(event) =>
                    update({ ...draft, reason: event.target.value })
                  }
                  rows={3}
                  value={draft.reason}
                />
              </FormField>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AllocationSummaryList rows={summary} />
            {overlap ? (
              <Alert title="Existing subscription" variant="warning">
                {overlapWarning(overlap)}
              </Alert>
            ) : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
            <Button
              aria-describedby={onAllocate ? undefined : hintId}
              data-intent="allocate"
              disabled={!onAllocate}
              form={formId}
              fullWidth
              loading={pending}
              type="submit"
            >
              Review allocation
            </Button>
            {onAllocate ? null : (
              <UnavailableActionHint id={hintId}>
                {UNAVAILABLE_ACTION_DESCRIPTION}
              </UnavailableActionHint>
            )}
          </CardContent>
        </Card>
      </div>
      {confirming ? (
        <ConfirmDialog
          confirmLabel="Request allocation"
          description="Check the details. The backend validates eligibility and sets the period end."
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const intent = confirming;
            setConfirming(null);
            onAllocate?.(intent);
          }}
          open
          title="Confirm allocation"
          tone="primary"
        >
          <AllocationConfirmContent overlap={overlap} rows={summary} />
        </ConfirmDialog>
      ) : null}
    </section>
  );
}

export function AllocationSummaryList({
  rows,
}: Readonly<{ rows: readonly AllocationSummaryRow[] }>) {
  return (
    <KeyValueList
      items={rows.map((row) => ({
        label: row.label,
        value:
          row.value === "Not chosen" || row.value === "Set by the backend" ? (
            <span className="text-fg-subtle font-normal">{row.value}</span>
          ) : (
            row.value
          ),
      }))}
    />
  );
}

/** Body of the confirmation dialog; exported for tests (portalled dialog). */
export function AllocationConfirmContent({
  overlap,
  rows,
}: Readonly<{
  overlap?: AllocationOverlap | null;
  rows: readonly AllocationSummaryRow[];
}>) {
  return (
    <div className="grid gap-4" data-allocation-confirm="">
      <AllocationSummaryList rows={rows} />
      {overlap ? (
        <Alert variant="warning">{overlapWarning(overlap)}</Alert>
      ) : null}
    </div>
  );
}

function UserResults({
  disabled,
  error,
  name,
  onSelect,
  results,
  searched,
  selected,
}: Readonly<{
  disabled: boolean;
  error?: string;
  name: string;
  onSelect: (userId: string) => void;
  results?: AdminOptionsState;
  searched: boolean;
  selected: string;
}>) {
  if (!searched || !results) {
    return error ? <FieldError>{error}</FieldError> : null;
  }
  const reason = optionsUnavailableText(results, "Users");
  if (reason) {
    return (
      <div className="grid gap-1">
        <FieldHint>
          {results.state === "ready" ? "No users match this search." : reason}
        </FieldHint>
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    );
  }
  return (
    <RadioGroup error={error} legend="Matching users">
      {readyOptions(results).map((option) => (
        <Radio
          checked={selected === option.value}
          disabled={disabled}
          key={option.value}
          label={option.label}
          name={name}
          onChange={() => onSelect(option.value)}
          value={option.value}
        />
      ))}
    </RadioGroup>
  );
}
