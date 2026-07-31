export type CountryResponse = {
  callingCode: string | null;
  flagUrl: string;
  name: string;
  shortCode: string;
};

export type GetCountriesQueryResponse = Array<CountryResponse>;

export const referenceDataOperations = {
  getCountries: { method: "GET", path: "/api/v1/reference-data/countries" },
} as const;
