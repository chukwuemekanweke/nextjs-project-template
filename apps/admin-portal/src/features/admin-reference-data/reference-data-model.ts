import type { AdminListState } from "@/components/admin-patterns";

export const REFERENCE_DATA_CATEGORIES = [
  "countries",
  "languages",
  "currencies",
] as const;
export type ReferenceDataCategory = (typeof REFERENCE_DATA_CATEGORIES)[number];

export type ReferenceDataRow = Readonly<{
  id: string;
  code: string;
  name: string;
  currency?: string | null;
  dialCode?: string | null;
  status?: string | null;
}>;

export type ReferenceDataModel = AdminListState<ReferenceDataRow>;

export type ReferenceDataFilters = Readonly<{ query: string }>;
