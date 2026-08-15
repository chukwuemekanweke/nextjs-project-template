export const profileKeys = {
  all: ["profiles"] as const,
  current: () => [...profileKeys.all, "current"] as const,
};
