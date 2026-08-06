import type { GetCountriesQueryResponse } from "./contracts";
import { referenceDataOperations } from "./contracts";
import type { ApiClient, ApiOperationOptions } from "../client";

export const getCountries = (
  client: ApiClient,
  options?: ApiOperationOptions,
) =>
  client.request<GetCountriesQueryResponse>({
    ...referenceDataOperations.getCountries,
    ...options,
  });
