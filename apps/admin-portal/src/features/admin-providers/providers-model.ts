import type {
  AdminActionAvailability,
  AdminListState,
} from "@/components/admin-patterns";

export type ProviderStatus =
  "operational" | "degraded" | "inactive" | "unknown";

export const PROVIDER_ACTION_TYPES = [
  "makeActive",
  "configure",
  "test",
] as const;
export type ProviderActionType = (typeof PROVIDER_ACTION_TYPES)[number];

/** A requested provider operation; the backend decides whether it succeeds. */
export type ProviderAction = Readonly<{
  type: ProviderActionType;
  providerId: string;
}>;

/** Copy for an operation that must be confirmed before it is requested. */
export type ProviderActionConfirmation = Readonly<{
  title: string;
  description: string;
  confirmLabel: string;
}>;

/**
 * Per-record eligibility from the source: whether this operation may be
 * requested for this provider now, whether it is in flight, and whether it
 * needs confirmation. A screen-level handler never implies eligibility.
 */
export type ProviderActionState = AdminActionAvailability &
  Readonly<{ confirmation?: ProviderActionConfirmation }>;

export type AdminProvider = Readonly<{
  id: string;
  name: string;
  category: "payment" | "service";
  description?: string;
  status: ProviderStatus;
  capabilities: readonly string[];
  actions: Readonly<Record<ProviderActionType, ProviderActionState>>;
}>;

export type ProvidersModel = AdminListState<AdminProvider>;

export type ProviderFilters = Readonly<{ query: string }>;

/** Whether `action` may be requested for `provider` (enabled, not pending). */
export function canRequestProviderAction(
  provider: AdminProvider,
  type: ProviderActionType,
): boolean {
  const availability = provider.actions[type];
  return availability.state === "available" && !availability.pending;
}
