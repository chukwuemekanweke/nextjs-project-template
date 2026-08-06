import type { ReferenceDataClient } from "@template/api-client/reference-data";
import { referenceDataOperations } from "@template/api-client/reference-data";
import { getQueryOptions } from "../query-client/get-query-options";
import { referenceDataKeys } from "./reference-data.keys";

export const countriesQueryOptions = (client: ReferenceDataClient) =>
  getQueryOptions(referenceDataOperations.getCountries, {
    queryKey: referenceDataKeys.countries(),
    queryFn: ({ signal }) => client.getCountries({ signal }),
    staleTime: 24 * 60 * 60 * 1_000,
  });
