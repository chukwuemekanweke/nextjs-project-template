export const kycKeys = {
  all: ["kyc"] as const,
  current: () => [...kycKeys.all, "current"] as const,
};
