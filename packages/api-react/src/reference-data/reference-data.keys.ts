export const referenceDataKeys = {
  all: ["reference-data"] as const,
  countries: () => [...referenceDataKeys.all, "countries"] as const,
};
