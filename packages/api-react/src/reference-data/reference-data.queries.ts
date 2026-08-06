import type { ReferenceDataClient } from "@template/api-client/reference-data";
import { queryOptions } from "@tanstack/react-query";
import { referenceDataKeys } from "./reference-data.keys";

export const countriesQueryOptions = (client: ReferenceDataClient) =>
  queryOptions({
    queryKey: referenceDataKeys.countries(),
    queryFn: ({ signal }) => client.getCountries({ signal }),
    staleTime: 24 * 60 * 60 * 1_000,
  });
