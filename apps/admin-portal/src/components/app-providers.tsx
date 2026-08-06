"use client";

import { ApiProvider } from "@template/api-react/query-client";
import type { ReactNode } from "react";
import { browserApi } from "@/lib/api";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return <ApiProvider apiClient={browserApi}>{children}</ApiProvider>;
}
