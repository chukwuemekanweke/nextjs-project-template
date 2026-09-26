export const authenticationKeys = {
  all: ["authentication"] as const,
  mutation: (operation: string) =>
    [...authenticationKeys.all, operation] as const,
  security: () => [...authenticationKeys.all, "security"] as const,
  twoFactorStatus: () =>
    [...authenticationKeys.security(), "two-factor"] as const,
};
