/** Wire contracts owned by the providers domain. */
export type ActivateProviderRequest = {
  providerKey: string;
  providerType: string;
};
export type SetActiveProviderMutationRequest = ActivateProviderRequest;
export type SetActiveProviderMutationResponse = void;

export const providersOperations = {
  setActiveProvider: { method: "PUT", path: "/api/v1/providers/active" },
} as const;
