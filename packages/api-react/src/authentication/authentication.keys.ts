export const authenticationKeys = {
  all: ["authentication"] as const,
  mutation: (operation: string) =>
    [...authenticationKeys.all, operation] as const,
};
