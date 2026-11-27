import type { ProvidersModel } from "./providers-model";
export const providersPreview: ProvidersModel = {
  page: 1,
  pageSize: 20,
  rows: [
    {
      actions: {
        configure: { state: "available" },
        makeActive: {
          confirmation: {
            confirmLabel: "Make active",
            description: "Make FixturePay the active payment provider?",
            title: "Change active provider",
          },
          state: "available",
        },
        test: { pending: true, state: "available" },
      },
      capabilities: ["Hosted checkout", "Bank transfer"],
      category: "payment",
      description: "Fictional payment provider",
      id: "fixture-provider-1",
      name: "FixturePay",
      status: "operational",
    },
    {
      actions: {
        configure: {
          reason: "Configuration is not supported.",
          state: "unavailable",
        },
        makeActive: {
          reason: "Only payment providers can be active.",
          state: "unavailable",
        },
        test: {
          reason: "A health test is not available.",
          state: "unavailable",
        },
      },
      capabilities: ["Email delivery"],
      category: "service",
      description: "Fictional notification provider",
      id: "fixture-provider-2",
      name: "FixtureMail",
      status: "unknown",
    },
  ],
  state: "ready",
  totalItems: 2,
  totalPages: 1,
};
