"use client";

import { useId, useState, type FormEvent } from "react";
import { DashboardHeader } from "@template/dashboard-ui";
import {
  Alert,
  Button,
  CloseIcon,
  Drawer,
  FieldError,
  FieldHint,
  FormField,
  IconButton,
  Input,
  PencilIcon,
  PlusIcon,
  Select,
  Switch,
  Textarea,
  TrashIcon,
  type TableColumn,
} from "@template/ui-core";
import { AdminForbidden, AdminListCard } from "@/components/admin-patterns";
import {
  UNAVAILABLE_ACTION_DESCRIPTION,
  optionsUnavailableText,
  readyOptions,
  type AdminListState,
  type AdminOptionsState,
} from "../admin-billing-shared/billing-model";
import {
  BillingListTable,
  BillingStatusBadge,
  NotAvailable,
  UnavailableActionHint,
} from "../admin-billing-shared/billing-sections";
import {
  PLAN_DESCRIPTION_MAX_LENGTH,
  PLAN_FEATURES_MAX,
  PLAN_FEATURE_MAX_LENGTH,
  PLAN_INTERVALS,
  PLAN_NAME_MAX_LENGTH,
  decidePlanSubmit,
  describePlanStatus,
  emptyPlanDraft,
  planDraftFromPlan,
  planPriceLines,
  type AdminPlan,
  type PlanDraft,
  type PlanDraftErrors,
  type PlanEditorMode,
  type PlanIntent,
} from "./plans-model";

/*
 * Plans table and editor drawer (reference `AdminPlans*`). Presentation
 * only: saving reports a `PlanIntent` through `onSavePlan`; the caller owns
 * the admin plans API, closes the drawer and refreshes the list. Without a
 * handler, Save is disabled with a visible reason. The drawer never shows a
 * success state.
 */

export const PLANS_PAGE_TITLE = "Plans";

type EditorTarget =
  Readonly<{ mode: "create" }> | Readonly<{ mode: "edit"; plan: AdminPlan }>;

export function PlansScreen({
  currencyOptions,
  onRetry,
  onSavePlan,
  saveError,
  savePending = false,
  state,
}: Readonly<{
  /** Currencies a new plan may use, from a backend read. */
  currencyOptions?: AdminOptionsState;
  onRetry?: () => void;
  onSavePlan?: (intent: PlanIntent) => void;
  /** Safe message from the caller's failed save. */
  saveError?: string | null;
  savePending?: boolean;
  state: AdminListState<AdminPlan>;
}>) {
  const [editor, setEditor] = useState<EditorTarget | null>(null);

  if (state.state === "forbidden") {
    return (
      <AdminForbidden
        permission={state.permission}
        requestDetails={state.requestDetails}
        resourceLabel="Plans"
      />
    );
  }

  const editorTitle =
    editor?.mode === "edit" ? `Edit ${editor.plan.name}` : "New plan";

  return (
    <section className="grid gap-5 md:gap-6">
      <DashboardHeader
        actions={
          <Button
            leadingIcon={<PlusIcon />}
            onClick={() => setEditor({ mode: "create" })}
          >
            New plan
          </Button>
        }
        description="The plans customers can buy and admins can allocate."
        title={PLANS_PAGE_TITLE}
      />
      <AdminListCard title="All plans">
        <BillingListTable
          caption="Plans"
          columns={planColumns((plan) => setEditor({ mode: "edit", plan }))}
          emptyDescription="Create a plan to offer it to customers."
          emptyTitle="No plans yet"
          keyField={(plan) => plan.id}
          loadingLabel="Loading plans"
          onRetry={onRetry}
          paged={false}
          state={state}
        />
      </AdminListCard>
      <Drawer
        className="w-full md:w-[460px]"
        onOpenChange={(open) => {
          if (!open && !savePending) setEditor(null);
        }}
        open={editor !== null}
        side="right"
        title={editorTitle}
      >
        {editor ? (
          <PlanEditor
            currencyOptions={currencyOptions}
            error={saveError}
            key={editor.mode === "edit" ? editor.plan.id : "new"}
            onCancel={() => setEditor(null)}
            onSubmit={onSavePlan}
            pending={savePending}
            plan={editor.mode === "edit" ? editor.plan : undefined}
            title={editorTitle}
          />
        ) : null}
      </Drawer>
    </section>
  );
}

export function planColumns(
  onEdit: (plan: AdminPlan) => void,
): TableColumn<AdminPlan>[] {
  return [
    {
      cell: (plan) => (
        <div>
          <span className="text-fg font-semibold">{plan.name}</span>
          <div className="text-caption text-fg-subtle font-mono">
            {plan.code}
          </div>
        </div>
      ),
      header: "Plan",
    },
    {
      cell: (plan) => {
        const [first, ...rest] = planPriceLines(plan);
        if (!first) return <NotAvailable label="No prices" />;
        return (
          <div>
            <span className="text-fg">{first}</span>
            {rest.map((line) => (
              <div className="text-caption text-fg-subtle" key={line}>
                {line}
              </div>
            ))}
          </div>
        );
      },
      header: "Price",
    },
    { cell: (plan) => plan.currencyCode, header: "Currency" },
    {
      cell: (plan) => (
        <BillingStatusBadge status={describePlanStatus(plan.isActive)} />
      ),
      header: "Status",
    },
    {
      align: "right",
      cell: (plan) =>
        plan.subscriberCount === null ? (
          <NotAvailable />
        ) : (
          new Intl.NumberFormat("en-US").format(plan.subscriberCount)
        ),
      header: "Subscribers",
    },
    {
      align: "right",
      cell: (plan) => (
        <Button
          leadingIcon={<PencilIcon />}
          onClick={() => onEdit(plan)}
          size="sm"
          variant="secondary"
        >
          Edit<span className="sr-only"> {plan.name}</span>
        </Button>
      ),
      header: "Actions",
      mobileLabel: "",
    },
  ];
}

/**
 * Drawer content: heading, the editor form and its footer. Exported so tests
 * can render it without the portalled drawer.
 */
export function PlanEditor({
  currencyOptions,
  error,
  onCancel,
  onSubmit,
  pending = false,
  plan,
  title,
}: Readonly<{
  currencyOptions?: AdminOptionsState;
  error?: string | null;
  onCancel: () => void;
  onSubmit?: (intent: PlanIntent) => void;
  pending?: boolean;
  /** The plan being edited; omitted for a new plan. */
  plan?: AdminPlan;
  title: string;
}>) {
  const id = useId();
  const mode: PlanEditorMode = plan ? "edit" : "create";
  const [draft, setDraft] = useState<PlanDraft>(() =>
    plan
      ? planDraftFromPlan(plan)
      : emptyPlanDraft(
          readyOptions(currencyOptions).length === 1
            ? readyOptions(currencyOptions)[0]?.value
            : "",
        ),
  );
  const [errors, setErrors] = useState<PlanDraftErrors>({});
  const formId = `${id}-form`;
  const hintId = `${id}-save-hint`;
  const field = (name: string) => `${id}-${name}`;
  const message = (name: string) => `${id}-${name}-message`;
  const currencyReason =
    mode === "create"
      ? optionsUnavailableText(currencyOptions, "Currencies")
      : undefined;

  function update(patch: Partial<PlanDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmit) return;
    const decision = decidePlanSubmit(draft, {
      mode,
      originalCode: plan?.code,
      pending,
      planId: plan?.id,
    });
    if (decision.kind === "blocked") return;
    if (decision.kind === "invalid") {
      setErrors(decision.errors);
      return;
    }
    setErrors({});
    onSubmit(decision.intent);
  }

  const described = (name: keyof PlanDraftErrors, hint?: boolean) =>
    errors[name] || hint ? message(name) : undefined;

  return (
    <div className="flex min-h-full flex-col" data-plan-editor={mode}>
      <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3.5 md:px-6">
        <h2 className="text-h3 text-fg">{title}</h2>
        <IconButton
          disabled={pending}
          icon={<CloseIcon />}
          label="Close plan editor"
          onClick={onCancel}
          variant="ghost"
        />
      </div>
      <form
        className="grid flex-1 content-start gap-4 overflow-y-auto px-4 py-4 md:px-6"
        id={formId}
        noValidate
        onSubmit={submit}
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        <FormField
          descriptionId={described("name")}
          error={errors.name}
          inputId={field("name")}
          label="Name"
          required
        >
          <Input
            aria-describedby={described("name")}
            aria-invalid={errors.name ? true : undefined}
            disabled={pending}
            id={field("name")}
            maxLength={PLAN_NAME_MAX_LENGTH}
            onChange={(event) => update({ name: event.target.value })}
            value={draft.name}
          />
        </FormField>
        <FormField
          descriptionId={described("code", true)}
          error={errors.code}
          hint={
            mode === "edit"
              ? "Codes can't change after creation."
              : "Capital letters, digits and underscores. It can't change later."
          }
          inputId={field("code")}
          label="Code"
          required={mode === "create"}
        >
          <Input
            aria-describedby={described("code", true)}
            aria-invalid={errors.code ? true : undefined}
            className="font-mono"
            disabled={pending}
            id={field("code")}
            onChange={(event) =>
              update({ code: event.target.value.toUpperCase() })
            }
            readOnly={mode === "edit"}
            value={draft.code}
          />
        </FormField>
        <FormField
          descriptionId={described("description")}
          error={errors.description}
          inputId={field("description")}
          label="Description"
        >
          <Textarea
            aria-describedby={described("description")}
            aria-invalid={errors.description ? true : undefined}
            disabled={pending}
            id={field("description")}
            maxLength={PLAN_DESCRIPTION_MAX_LENGTH}
            onChange={(event) => update({ description: event.target.value })}
            rows={2}
            value={draft.description}
          />
        </FormField>
        <FormField
          descriptionId={
            errors.currencyCode || currencyReason || mode === "edit"
              ? message("currencyCode")
              : undefined
          }
          error={errors.currencyCode}
          hint={
            mode === "edit" ? "A plan's currency can't change." : currencyReason
          }
          inputId={field("currency")}
          label="Currency"
          required={mode === "create"}
        >
          {mode === "edit" ? (
            <Input
              aria-describedby={message("currencyCode")}
              id={field("currency")}
              readOnly
              value={draft.currencyCode}
            />
          ) : (
            <Select
              aria-describedby={
                errors.currencyCode || currencyReason
                  ? message("currencyCode")
                  : undefined
              }
              aria-invalid={errors.currencyCode ? true : undefined}
              disabled={pending || Boolean(currencyReason)}
              id={field("currency")}
              onChange={(event) => update({ currencyCode: event.target.value })}
              value={draft.currencyCode}
            >
              <option value="">Choose a currency</option>
              {readyOptions(currencyOptions).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <fieldset className="grid gap-1.5">
          <legend className="text-label text-fg mb-1.5 font-medium">
            Prices
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {PLAN_INTERVALS.map((interval) => {
              const key = `price${interval}` as const;
              return (
                <FormField
                  descriptionId={described(key)}
                  error={errors[key]}
                  inputId={field(key)}
                  key={interval}
                  label={`${interval} price${draft.currencyCode ? ` (${draft.currencyCode})` : ""}`}
                >
                  <Input
                    aria-describedby={described(key)}
                    aria-invalid={errors[key] ? true : undefined}
                    disabled={pending}
                    id={field(key)}
                    inputMode="decimal"
                    onChange={(event) =>
                      update({
                        prices: {
                          ...draft.prices,
                          [interval]: event.target.value,
                        },
                      })
                    }
                    value={draft.prices[interval]}
                  />
                </FormField>
              );
            })}
          </div>
          {errors.prices ? (
            <FieldError id={message("prices")}>{errors.prices}</FieldError>
          ) : (
            <FieldHint>Leave an interval empty to not offer it.</FieldHint>
          )}
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="text-label text-fg mb-1.5 font-medium">
            Features
          </legend>
          {draft.features.map((feature, index) => (
            <div className="flex items-center gap-2" key={index}>
              <Input
                aria-describedby={
                  errors.features ? message("features") : undefined
                }
                aria-invalid={
                  errors.features && !feature.trim() ? true : undefined
                }
                aria-label={`Feature ${index + 1}`}
                disabled={pending}
                maxLength={PLAN_FEATURE_MAX_LENGTH}
                onChange={(event) =>
                  update({
                    features: draft.features.map((value, position) =>
                      position === index ? event.target.value : value,
                    ),
                  })
                }
                value={feature}
              />
              <IconButton
                disabled={pending}
                icon={<TrashIcon />}
                label={`Remove feature ${index + 1}`}
                onClick={() =>
                  update({
                    features: draft.features.filter(
                      (_, position) => position !== index,
                    ),
                  })
                }
                variant="ghost"
              />
            </div>
          ))}
          {errors.features ? (
            <FieldError id={message("features")}>{errors.features}</FieldError>
          ) : null}
          <Button
            className="w-fit"
            disabled={pending || draft.features.length >= PLAN_FEATURES_MAX}
            leadingIcon={<PlusIcon />}
            onClick={() => update({ features: [...draft.features, ""] })}
            size="sm"
            variant="ghost"
          >
            Add feature
          </Button>
        </fieldset>
        <div className="flex items-center justify-between gap-4">
          <div>
            <label className="text-fg font-semibold" htmlFor={field("active")}>
              Active
            </label>
            <p className="text-small text-fg-muted" id={message("active")}>
              Inactive plans can&apos;t be bought or allocated.
            </p>
          </div>
          <Switch
            aria-describedby={message("active")}
            checked={draft.isActive}
            disabled={pending}
            id={field("active")}
            onCheckedChange={(isActive) => update({ isActive })}
          />
        </div>
      </form>
      <div className="border-border grid gap-2 border-t px-4 py-3.5 md:px-6">
        <div className="flex flex-wrap justify-end gap-3 max-sm:*:flex-auto">
          <Button disabled={pending} onClick={onCancel} variant="ghost">
            Cancel
          </Button>
          <Button
            aria-describedby={onSubmit ? undefined : hintId}
            data-intent={mode === "edit" ? "update" : "create"}
            disabled={!onSubmit}
            form={formId}
            loading={pending}
            type="submit"
          >
            Save plan
          </Button>
        </div>
        {onSubmit ? null : (
          <UnavailableActionHint id={hintId}>
            {UNAVAILABLE_ACTION_DESCRIPTION}
          </UnavailableActionHint>
        )}
      </div>
    </div>
  );
}
