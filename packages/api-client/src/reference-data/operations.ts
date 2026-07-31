import type { GetCountriesQueryResponse } from "../contracts/reference-data";
import { referenceDataOperations } from "../contracts/reference-data";
import type { ApiClient, ApiOperationOptions } from "../client";

export const getCountries = (
  client: ApiClient,
  options?: ApiOperationOptions,
) =>
  client.request<GetCountriesQueryResponse>({
    ...referenceDataOperations.getCountries,
    ...options,
  });
