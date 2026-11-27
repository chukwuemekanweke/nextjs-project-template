import type { ProvidersModel } from "./providers-model";
export const providersPreview: ProvidersModel = {
  page: 1,
  pageSize: 20,
  rows: [
    {
      capabilities: ["Hosted checkout", "Bank transfer"],
      category: "payment",
      description: "Fictional payment provider",
      id: "fixture-provider-1",
      metadata: [{ label: "Region", value: "Test" }],
      name: "FixturePay",
      status: "operational",
    },
    {
      capabilities: ["Email delivery"],
      category: "service",
      description: "Fictional notification provider",
      id: "fixture-provider-2",
      metadata: [],
      name: "FixtureMail",
      status: "unknown",
    },
  ],
  state: "ready",
  totalItems: 2,
  totalPages: 1,
};
