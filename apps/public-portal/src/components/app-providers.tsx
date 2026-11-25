"use client";

import { ApiProvider } from "@template/api-react/query-client";
import { ThemeProvider } from "@template/ui-core";
import type { ReactNode } from "react";
import { browserApi } from "@/lib/api";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ThemeProvider>
      <ApiProvider apiClient={browserApi}>{children}</ApiProvider>
    </ThemeProvider>
  );
}
