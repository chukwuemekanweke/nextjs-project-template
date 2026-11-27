import type { AdminListState } from "@/components/admin-patterns";
export type ReferenceDataCategory = "countries" | "languages" | "currencies";
export type ReferenceDataRow = Readonly<{
  id: string;
  code: string;
  name: string;
  currency?: string | null;
  dialCode?: string | null;
  status?: string | null;
}>;
export type ReferenceDataModel = AdminListState<ReferenceDataRow>;
