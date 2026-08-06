export const referenceDataKeys = {
  all: ["reference-data"] as const,
  countries: () => ["reference-data", "countries"] as const,
};
